import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { User } from './models/User';
import { ChatSession } from './models/ChatSession';
import { Message } from './models/Message';
import { startCleanupJob } from './lib/cleanup';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-chat';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Registration Route
app.post('/api/auth/register', async (req, res) => {
    const { phoneNumber, name, gender } = req.body;
    if (!phoneNumber || !name || !gender) {
        return res.status(400).json({ error: 'Phone number, name, and gender are required' });
    }

    try {
        let user = await User.findOne({ phoneNumber });
        if (user) return res.status(400).json({ error: 'User already exists' });

        user = await User.create({ phoneNumber, name, gender });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Auth Route (Login Only)
app.post('/api/auth/login', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Search User
app.get('/api/users/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Search query required' });

    try {
        const users = await User.find({ phoneNumber: new RegExp(query as string, 'i') }).limit(10);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Search failed' });
    }
});

// Send Chat Request
app.post('/api/chat/request', async (req, res) => {
    const { from, to, encryptionKey } = req.body;
    if (from === to) return res.status(400).json({ error: 'Cannot chat with yourself' });

    try {
        let session = await ChatSession.findOne({
            participants: { $all: [from, to] },
            status: { $ne: 'expired' }
        });

        if (session) return res.status(400).json({ error: 'Chat already exists or pending' });

        session = await ChatSession.create({
            participants: [from, to],
            initiatedBy: from,
            status: 'pending',
            encryptionKey
        });

        io.to(to).emit('newRequest', session);
        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Request failed' });
    }
});

// Accept/Reject Request
app.post('/api/chat/respond', async (req, res) => {
    const { sessionId, status, acceptedBy } = req.body; // status: 'active' or 'rejected'

    try {
        const session = await ChatSession.findById(sessionId);
        if (!session) return res.status(404).json({ error: 'Session not found' });

        session.status = status;
        if (status === 'active') {
            session.acceptedBy = acceptedBy;
            session.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins initial
        } else {
            await ChatSession.findByIdAndDelete(sessionId);
            return res.json({ message: 'Request rejected' });
        }

        await session.save();

        // Notify both parties
        session.participants.forEach(p => io.to(p).emit('chatStarted', session));

        res.json(session);
    } catch (err) {
        res.status(500).json({ error: 'Response failed' });
    }
});

// Get Messages for a Session
app.get('/api/messages/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    try {
        const messages = await Message.find({ sessionId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Socket logic
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', async (phoneNumber: string) => {
        socket.join(phoneNumber);
        await User.findOneAndUpdate({ phoneNumber }, { status: 'online', lastSeen: new Date() });
        io.emit('userStatus', { phoneNumber, status: 'online' });
    });

    socket.on('sendMessage', async ({ sessionId, sender, encryptedContent, iv }: { sessionId: string, sender: string, encryptedContent: string, iv: string }) => {
        try {
            const session = await ChatSession.findById(sessionId);
            if (!session || session.status !== 'active') return;

            // Update activity and expiry
            session.lastActivity = new Date();
            session.expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Reset timer
            await session.save();

            const message = await Message.create({ sessionId, sender, encryptedContent, iv });

            session.participants.forEach(p => {
                io.to(p).emit('message', message);
            });
        } catch (err) {
            console.error('Message error:', err);
        }
    });

    socket.on('typing', ({ sessionId, sender, isTyping }: { sessionId: string, sender: string, isTyping: boolean }) => {
        ChatSession.findById(sessionId).then(session => {
            if (session) {
                session.participants.forEach(p => {
                    if (p !== sender) io.to(p).emit('typing', { sessionId, sender, isTyping });
                });
            }
        });
    });

    socket.on('call-user', (data: { to: string, offer: any, from: string, sessionId: string, type: string }) => {
        socket.to(data.to).emit('call-made', {
            offer: data.offer,
            socket: socket.id,
            from: data.from,
            sessionId: data.sessionId,
            type: data.type
        });
    });

    socket.on('make-answer', (data: { to: string, answer: any }) => {
        socket.to(data.to).emit('answer-made', {
            socket: socket.id,
            answer: data.answer
        });
    });

    socket.on('ice-candidate', (data: { to: string, candidate: any }) => {
        socket.to(data.to).emit('ice-candidate', {
            socket: socket.id,
            candidate: data.candidate
        });
    });

    socket.on('hangup', (data: { to: string }) => {
        socket.to(data.to).emit('hangup');
    });

    socket.on('disconnect', () => {
        // Logic for offline handled by specific 'leave' if needed or timeout
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startCleanupJob(io);
});

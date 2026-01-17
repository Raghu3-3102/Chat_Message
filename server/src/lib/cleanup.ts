import { ChatSession } from '../models/ChatSession';
import { Message } from '../models/Message';
import { Server } from 'socket.io';

export const startCleanupJob = (io: Server) => {
    setInterval(async () => {
        try {
            const now = new Date();
            const expiredSessions = await ChatSession.find({
                status: 'active',
                expiresAt: { $lt: now }
            });

            for (const session of expiredSessions) {
                console.log(`Cleaning up session ${session._id}`);
                // Delete all messages for this session
                await Message.deleteMany({ sessionId: session._id });
                // Update session status or delete
                session.status = 'expired';
                await session.save();

                // Notify participants
                session.participants.forEach(p => {
                    io.to(p).emit('chatExpired', { sessionId: session._id });
                });
            }
        } catch (err) {
            console.error('Cleanup job error:', err);
        }
    }, 30000); // Check every 30 seconds
};

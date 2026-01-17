import mongoose from 'mongoose';

const chatSessionSchema = new mongoose.Schema({
    participants: [{ type: String, ref: 'User' }], // Array of phone numbers
    status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending' },
    lastActivity: { type: Date, default: Date.now },
    initiatedBy: { type: String, required: true },
    acceptedBy: { type: String },
    encryptionKey: { type: String } // Shared key stored in base64
}, { timestamps: true });

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

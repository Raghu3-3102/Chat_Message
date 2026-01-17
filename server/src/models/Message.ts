import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
    sender: { type: String, required: true },
    encryptedContent: { type: String, required: true }, // AES-GCM encrypted blob
    iv: { type: String, required: true }, // Initialization Vector
}, { timestamps: true });

export const Message = mongoose.model('Message', messageSchema);

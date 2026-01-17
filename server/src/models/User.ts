import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: { type: String, enum: ['male', 'female'], required: true },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { useChatStore } from '../../store/useChatStore';
import logo from '../../assets/Gemini_Generated_Image_z5qhq6z5qhq6z5qh.png';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        name: '',
        gender: 'male' as 'male' | 'female'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setCurrentUser } = useChatStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formData.phoneNumber || !formData.name) return;

        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', formData);
            setCurrentUser(data);
            socket.emit('join', data.phoneNumber);
            localStorage.setItem('userPhone', data.phoneNumber);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
            <div className="w-full max-w-[440px] bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 p-10 md:p-12">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-100 p-1 border border-slate-100 relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={logo} alt="SecureChat Logo" className="w-full h-full object-cover rounded-xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h1>
                    <p className="text-slate-500">Join the secure communication network</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Your Name</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter your full name"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                        <div className="relative group">
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                placeholder="+1 234 567 890"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Gender</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: 'male' })}
                                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.gender === 'male' ? 'border-blue-500' : 'border-slate-300'}`}>
                                    {formData.gender === 'male' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                </div>
                                <span className="font-semibold">Male</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, gender: 'female' })}
                                className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.gender === 'female' ? 'border-pink-500' : 'border-slate-300'}`}>
                                    {formData.gender === 'female' && <div className="w-2.5 h-2.5 bg-pink-500 rounded-full" />}
                                </div>
                                <span className="font-semibold">Female</span>
                            </button>
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-200"
                    >
                        {loading ? 'Creating Account...' : 'Get Started'}
                        {!loading && <ChevronRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 font-medium">
                        Already have an account?{' '}
                        <button onClick={onSwitchToLogin} className="text-blue-600 font-bold hover:underline">
                            Log In
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

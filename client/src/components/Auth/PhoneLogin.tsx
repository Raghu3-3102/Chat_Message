import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import socket from '../../lib/socket';
import { useChatStore } from '../../store/useChatStore';
import logo from '../../assets/Gemini_Generated_Image_z5qhq6z5qhq6z5qh.png';

interface PhoneLoginProps {
    onSwitchToRegister: () => void;
}

export const PhoneLogin: React.FC<PhoneLoginProps> = ({ onSwitchToRegister }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { setCurrentUser } = useChatStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!phone) return;

        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { phoneNumber: phone });
            setCurrentUser(data);
            socket.emit('join', phone);
            localStorage.setItem('userPhone', phone);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
                    <p className="text-slate-500">Sign in to your secure account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">Phone Number</label>
                        <div className="relative group">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 234 567 890"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>

                    {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-slate-200"
                    >
                        {loading ? 'Authenticating...' : 'Sign In'}
                        {!loading && <ChevronRight className="w-5 h-5" />}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 font-medium">
                        Don't have an account?{' '}
                        <button onClick={onSwitchToRegister} className="text-blue-600 font-bold hover:underline">
                            Register Now
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

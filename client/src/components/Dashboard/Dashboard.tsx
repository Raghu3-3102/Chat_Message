import React, { useState } from 'react';
import { Search, UserPlus, Check, X, MessageSquare, Shield } from 'lucide-react';
import api from '../../lib/api';
import { useChatStore } from '../../store/useChatStore';

interface User {
    phoneNumber: string;
}

interface DashboardProps {
    onSelectSession: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectSession }) => {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const { currentUser, pendingRequests, clearPendingRequest, activeSessions } = useChatStore();

    const handleSearch = async () => {
        if (!search) return;
        try {
            const { data } = await api.get(`/users/search?query=${search}`);
            setResults(data.filter((u: User) => u.phoneNumber !== currentUser?.phoneNumber));
        } catch (err) {
            console.error('Search failed', err);
        }
    };

    const sendRequest = async (to: string) => {
        try {
            await api.post('/chat/request', { from: currentUser?.phoneNumber, to });
            alert('Request sent!');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to send request');
        }
    };

    const respondToRequest = async (sessionId: string, status: 'active' | 'rejected') => {
        try {
            await api.post('/chat/respond', { sessionId, status, acceptedBy: currentUser?.phoneNumber });
            clearPendingRequest(sessionId);
        } catch (err) {
            console.error('Failed to respond', err);
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar - Desktop */}
            <div className="w-full md:w-[400px] border-r border-white/5 flex flex-col bg-surface/30">
                <div className="p-8 border-b border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-white tracking-tight italic">Ghost<span className="text-primary">Chat</span></h2>
                        <div className="w-10 h-10 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Start a new session..."
                            className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:ring-2 focus:ring-primary/20"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary group-focus-within:text-primary transition-colors" />
                        <button
                            onClick={handleSearch}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-2 rounded-xl hover:scale-105 transition-all text-[10px] font-bold uppercase tracking-wider px-3"
                        >
                            Search
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                    {/* Search Results */}
                    {results.length > 0 && (
                        <section>
                            <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 bg-primary rounded-full" />
                                Found Users
                            </h3>
                            <div className="space-y-2">
                                {results.map((user) => (
                                    <div key={user.phoneNumber} className="glass-panel p-4 flex items-center justify-between group hover:bg-white/[0.04] rounded-2xl border-none">
                                        <span className="font-mono text-white/80">{user.phoneNumber}</span>
                                        <button onClick={() => sendRequest(user.phoneNumber)} className="bg-primary/10 hover:bg-primary text-primary hover:text-white p-2.5 rounded-xl transition-all duration-300">
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Pending Requests */}
                    {pendingRequests.length > 0 && (
                        <section className="animate-in slide-in-from-left duration-500">
                            <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <span className="w-1 h-1 bg-orange-400 rounded-full" />
                                Access Requests
                            </h3>
                            <div className="space-y-3">
                                {pendingRequests.map((req) => (
                                    <div key={req._id} className="glass-panel p-5 bg-orange-400/5 border-orange-400/10 rounded-2xl">
                                        <p className="text-[10px] text-orange-400/60 font-bold uppercase mb-2 tracking-widest">Signal Incoming</p>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-white tracking-wider">{req.initiatedBy}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => respondToRequest(req._id, 'active')} className="bg-white text-black p-2 rounded-xl hover:bg-green-400 hover:text-white transition-all">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => respondToRequest(req._id, 'rejected')} className="bg-white/10 text-white p-2 rounded-xl hover:bg-red-400 transition-all">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Sessions */}
                    <section>
                        <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-1 h-1 bg-secondary rounded-full" />
                            Secure Sessions
                        </h3>
                        <div className="space-y-3">
                            {activeSessions.map((session) => (
                                <div
                                    key={session._id}
                                    onClick={() => onSelectSession(session._id)}
                                    className="glass-panel p-5 hover:bg-white/[0.04] cursor-pointer group transition-all duration-300 border-none rounded-3xl"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:rotate-6 transition-all duration-500">
                                            <MessageSquare className="w-5 h-5 text-primary group-hover:text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-mono text-white text-lg truncate mb-0.5">
                                                {session.participants.find(p => p !== currentUser?.phoneNumber)}
                                            </p>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                                                <span className="text-[9px] text-green-400 font-black uppercase tracking-widest">Private</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {activeSessions.length === 0 && (
                                <div className="py-12 px-6 text-center border-2 border-dashed border-white/[0.02] rounded-[2rem]">
                                    <p className="text-secondary text-xs italic font-medium">No encrypted sessions active.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* User Footer */}
                <div className="p-8 border-t border-white/5 bg-surface/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center border border-white/5">
                            <div className="text-primary font-black">ST</div>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-secondary font-bold uppercase tracking-widest">Self Identity</p>
                            <p className="font-mono text-white text-sm">{currentUser?.phoneNumber}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero / Placeholder - Desktop */}
            <div className="hidden md:flex flex-1 items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/[0.02] to-accent/[0.02]" />
                <div className="text-center relative z-10 p-12 max-w-[500px]">
                    <div className="w-24 h-24 bg-white/[0.02] border border-white/5 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-3xl">
                        <Shield className="w-10 h-10 text-white/20" />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Ghost Messaging</h2>
                    <p className="text-secondary leading-relaxed">
                        Every session is end-to-end encrypted and automatically destroyed after 10 minutes of silence. Your conversations leave no trace.
                    </p>
                </div>
            </div>
        </div>
    );
};

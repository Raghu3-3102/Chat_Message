import React, { useState } from 'react';
import { Search, UserPlus, Edit, MoreVertical, Shield, MessageSquare, Clock, LogOut } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';
import api from '../../lib/api';
import { generateSessionKey, exportKey } from '../../lib/crypto';

interface SidebarProps {
    onSelectSession: (id: string) => void;
    activeSessionId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectSession, activeSessionId }) => {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    const { currentUser, activeSessions, pendingRequests, clearPendingRequest, addSession, logout, showModal } = useChatStore();

    const handleSearch = async (val: string) => {
        setSearch(val);
        if (val.length < 3) {
            setSearchResults([]);
            return;
        }
        try {
            const { data } = await api.get(`/users/search?query=${val}`);
            setSearchResults(data.filter((u: any) => u.phoneNumber !== currentUser?.phoneNumber));
        } catch (err) {
            console.error('Search failed', err);
        }
    };

    const sendRequest = async (to: string) => {
        try {
            // Generate key for this new potential session
            const key = await generateSessionKey();
            const exported = await exportKey(key);

            const { data } = await api.post('/chat/request', {
                from: currentUser?.phoneNumber,
                to,
                encryptionKey: exported
            });

            // If it's an existing active session, just select it
            if (data.status === 'active') {
                addSession(data);
                onSelectSession(data._id);
            } else {
                showModal({
                    title: 'Request Sent',
                    message: `Signal invitation has been transmitted to ${to} successfully.`,
                    type: 'success'
                });
            }

            setSearch('');
            setSearchResults([]);
        } catch (err: any) {
            showModal({
                title: 'Error',
                message: err.response?.data?.error || 'Failed to send secure invitation.',
                type: 'error'
            });
        }
    };

    const respondToRequest = async (sessionId: string, status: 'active' | 'rejected') => {
        try {
            const { data } = await api.post('/chat/respond', {
                sessionId,
                status,
                acceptedBy: currentUser?.phoneNumber
            });
            clearPendingRequest(sessionId);
            if (status === 'active') {
                addSession(data);
                // Automatically redirect to the new chat
                onSelectSession(data._id);
            }
        } catch (err) {
            console.error('Failed to respond', err);
        }
    };

    const getAvatar = (gender: string, name: string) => {
        const seed = name || 'User';
        return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&gender=${gender === 'male' ? 'male' : 'female'}`;
    };

    return (
        <div className="w-full md:w-[380px] h-full border-r border-slate-200 bg-white flex flex-col flex-shrink-0 relative overflow-hidden">
            {/* Header */}
            <div className="p-4 md:p-6 border-b border-slate-100 bg-[#F9FAFB]">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-3">
                        <img
                            src={getAvatar(currentUser?.gender || 'male', currentUser?.name || 'Me')}
                            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white border-2 border-white shadow-md"
                            alt="Profile"
                        />
                        <div className="min-w-0">
                            <h2 className="font-bold text-slate-900 leading-tight truncate max-w-[100px] md:max-w-[120px]">{currentUser?.name}</h2>
                            <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Active Link</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button className="p-2 md:p-2.5 hover:bg-slate-200/50 rounded-xl transition-colors text-slate-400">
                            <Edit className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={logout} className="p-2 md:p-2.5 hover:bg-red-50 rounded-xl transition-colors text-slate-400 hover:text-red-500">
                            <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by number or name..."
                        className="w-full bg-slate-100 border-2 border-transparent focus:bg-white focus:border-blue-500/20 rounded-2xl py-3 md:py-3.5 pl-10 md:pl-12 pr-4 text-sm transition-all outline-none font-medium"
                    />
                    <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4 space-y-4 md:space-y-6">

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between px-2 md:px-4 mb-3">
                            <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Found Signals</h3>
                            <button onClick={() => setSearchResults([])} className="text-[10px] font-bold text-slate-400 hover:text-slate-600">CLEAR</button>
                        </div>
                        <div className="space-y-2">
                            {searchResults.map(user => {
                                const existingSession = activeSessions.find(s => s.participants.includes(user.phoneNumber));
                                const isPending = pendingRequests.some(r => r.participants.includes(user.phoneNumber));

                                return (
                                    <div key={user.phoneNumber} className="flex items-center justify-between p-3 md:p-4 bg-blue-50/50 border border-blue-100/50 rounded-[1.5rem] md:rounded-3xl">
                                        <div className="flex items-center gap-2 md:gap-3">
                                            <img src={getAvatar(user.gender, user.name)} className="w-8 h-8 md:w-10 md:h-10 rounded-xl shadow-sm bg-white" alt="U" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono">{user.phoneNumber}</p>
                                            </div>
                                        </div>
                                        {existingSession ? (
                                            <button
                                                onClick={() => {
                                                    onSelectSession(existingSession._id);
                                                    setSearchResults([]);
                                                    setSearch('');
                                                }}
                                                className="bg-green-500 text-white p-2 md:p-2.5 rounded-xl hover:bg-green-600 transition-all shadow-md shadow-green-100 flex-shrink-0"
                                                title="Open Chat"
                                            >
                                                <MessageSquare className="w-4 h-4" />
                                            </button>
                                        ) : isPending ? (
                                            <div className="text-[10px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 uppercase tracking-widest animate-pulse">
                                                Waiting...
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => sendRequest(user.phoneNumber)}
                                                className="bg-blue-600 text-white p-2 md:p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex-shrink-0"
                                                title="Send Request"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Pending Incoming Requests */}
                {pendingRequests.filter(r => r.initiatedBy !== currentUser?.phoneNumber).length > 0 && (
                    <section className="animate-in slide-in-from-left duration-500">
                        <h3 className="px-2 md:px-4 text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3 md:mb-4">Incoming Requests</h3>
                        <div className="space-y-3">
                            {pendingRequests.filter(r => r.initiatedBy !== currentUser?.phoneNumber).map(req => (
                                <div key={req._id} className="p-4 md:p-5 bg-gradient-to-br from-orange-50 to-white rounded-[1.5rem] md:rounded-[1.8rem] border border-orange-100 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                                        <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-orange-600 font-black uppercase tracking-widest">Secure Invite</p>
                                            <p className="text-sm font-bold text-slate-900">{req.initiatedBy}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => respondToRequest(req._id, 'active')}
                                            className="flex-1 bg-slate-900 text-white text-[10px] md:text-[11px] font-black py-2.5 md:py-3 rounded-xl hover:bg-black transition-all"
                                        >
                                            ACCEPT
                                        </button>
                                        <button
                                            onClick={() => respondToRequest(req._id, 'rejected')}
                                            className="flex-1 bg-white text-slate-500 text-[10px] md:text-[11px] font-black py-2.5 md:py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            IGNORE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Sent Invitations */}
                {pendingRequests.filter(r => r.initiatedBy === currentUser?.phoneNumber).length > 0 && (
                    <section className="animate-in slide-in-from-left duration-500">
                        <h3 className="px-2 md:px-4 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3 md:mb-4">Sent Invitations</h3>
                        <div className="space-y-2">
                            {pendingRequests.filter(r => r.initiatedBy === currentUser?.phoneNumber).map(req => {
                                const target = req.participants.find(p => p !== currentUser?.phoneNumber);
                                return (
                                    <div key={req._id} className="flex items-center justify-between p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{target}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Waiting for Accept...</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Direct Messages Section */}
                <section>
                    <div className="flex items-center justify-between px-2 md:px-4 mb-3">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personal Chats</h3>
                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{activeSessions.length}</span>
                    </div>
                    <div className="space-y-1">
                        {activeSessions.map(session => {
                            const otherId = session.participants.find(p => p !== currentUser?.phoneNumber) || 'Unknown';
                            return (
                                <div
                                    key={session._id}
                                    onClick={() => onSelectSession(session._id)}
                                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] cursor-pointer transition-all ${activeSessionId === session._id ? 'bg-blue-50 shadow-sm border border-blue-100' : 'hover:bg-slate-50'}`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                            <img src={getAvatar(String(session.otherGender || 'male'), String(session.otherName || otherId))} alt="Avatar" />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5 md:mb-1">
                                            <p className="font-bold text-slate-900 truncate uppercase text-sm">{session.otherName || otherId}</p>
                                            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium tracking-tight">Active Path</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] md:text-xs text-slate-500 truncate font-medium">Click to resume encrypted chat...</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {activeSessions.length === 0 && (
                            <div className="text-center py-8 md:py-12 px-6 md:px-8">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-50 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                    <MessageSquare className="w-6 h-6 md:w-8 md:h-8 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-400 leading-relaxed">No active conversations found. Start a new one!</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Bottom Footer */}
            <div className="p-4 md:p-6 border-t border-slate-100 bg-[#F9FAFB] space-y-3">
                <div className="flex items-center gap-3 bg-white p-2.5 md:p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="hidden sm:flex items-center gap-1.5 md:gap-2 bg-green-50 px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-2xl border border-green-100">
                        <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-500" />
                        <span className="text-green-600 font-mono text-[10px] md:text-xs font-black uppercase tracking-widest">Permanent Path</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Signal Health</p>
                        <p className="text-[11px] md:text-xs font-bold text-slate-900 truncate">Encrypted Path Active</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl shadow-xl shadow-slate-200">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20 flex-shrink-0">
                        {currentUser?.phoneNumber.slice(-2)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">My Identity</p>
                        <p className="text-xs font-bold text-white truncate">{currentUser?.phoneNumber}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all active:scale-95 group"
                        title="Logout"
                    >
                        <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </button>
                </div>
            </div>

        </div>
    );
};

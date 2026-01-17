import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Shield, Smile, Search, MoreHorizontal, Mic, ArrowLeft, Video } from 'lucide-react';
import socket from '../../lib/socket';
import api from '../../lib/api';
import { useChatStore } from '../../store/useChatStore';
import { encryptMessage, decryptMessage, importKey, generateSessionKey } from '../../lib/crypto';
import EmojiPicker, { Theme } from 'emoji-picker-react';

interface Message {
    _id?: string;
    sessionId: string;
    sender: string;
    encryptedContent: string;
    iv: string;
    decrypted?: string;
    createdAt: string;
}

interface ChatWindowProps {
    sessionId: string;
    onToggleInfo: () => void;
    onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ sessionId, onToggleInfo, onBack }) => {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherTyping, setOtherTyping] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(600);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const { currentUser, sessionKeys, setSessionKey, showModal, setCall } = useChatStore();
    const chatEndRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    const session = useChatStore.getState().activeSessions.find(s => s._id === sessionId);
    const otherParticipant = session?.participants.find(p => p !== currentUser?.phoneNumber);

    useEffect(() => {
        const initSession = async () => {
            if (!session) return;

            // Import or generating key
            let key = sessionKeys[sessionId];
            if (!key) {
                if (session.encryptionKey) {
                    key = await importKey(session.encryptionKey);
                } else {
                    key = await generateSessionKey();
                }
                setSessionKey(sessionId, key);
            }

            // Fetch History
            try {
                const { data } = await api.get(`/messages/${sessionId}`);
                const decryptedMsgs = await Promise.all(data.map(async (msg: Message) => {
                    try {
                        msg.decrypted = await decryptMessage(key, msg.encryptedContent, msg.iv);
                    } catch (e) {
                        msg.decrypted = "[Decryption Failed]";
                    }
                    return msg;
                }));
                setMessages(decryptedMsgs);
            } catch (err) {
                console.error('History fetch failed', err);
            }
        };

        if (sessionId) {
            initSession();
        }

        socket.on('message', async (msg: Message) => {
            if (msg.sessionId === sessionId) {
                const currentKey = useChatStore.getState().sessionKeys[sessionId];
                if (currentKey) {
                    try {
                        msg.decrypted = await decryptMessage(currentKey, msg.encryptedContent, msg.iv);
                        setMessages(prev => [...prev, msg]);
                        setTimeLeft(600); // Reset local timer on incoming message
                    } catch (e) {
                        console.error('Decryption failed', e);
                    }
                }
            }
        });

        socket.on('typing', (data) => {
            if (data.sessionId === sessionId) setOtherTyping(data.isTyping);
        });

        socket.on('chatExpired', (data) => {
            if (data.sessionId === sessionId) {
                showModal({
                    title: 'Session Expired',
                    message: 'This secure path has expired. All messages have been self-destructed.',
                    type: 'info'
                });
                onBack(); // Auto-redirect on expiry
            }
        });

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Trigger expiry UI logic if hit 0 manually
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Sync initial time left if session has expiresAt
        if (session && session.expiresAt) {
            const diff = Math.floor((new Date(session.expiresAt).getTime() - new Date().getTime()) / 1000);
            if (diff > 0) setTimeLeft(diff);
            else setTimeLeft(0);
        }

        return () => {
            socket.off('message');
            socket.off('typing');
            socket.off('chatExpired');
            clearInterval(timer);
        };
    }, [sessionId]);

    useEffect(() => {
        if (timeLeft <= 0) {
            setMessages([]); // Immediately disappear messages
            showModal({
                title: 'Secure Session Expired',
                message: 'Inactivity threshold reached. All data has been purged for your security.',
                type: 'info'
            });
            onBack();
        }
    }, [timeLeft, onBack, showModal]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, otherTyping]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const onEmojiClick = (emojiData: any) => {
        setInputText(prev => prev + emojiData.emoji);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim() || !sessionKeys[sessionId]) return;

        const key = sessionKeys[sessionId];
        const { encrypted, iv } = await encryptMessage(key, inputText);

        socket.emit('sendMessage', {
            sessionId,
            sender: currentUser?.phoneNumber,
            encryptedContent: encrypted,
            iv
        });

        setInputText('');
        setTimeLeft(600); // Reset local timer on outgoing message
        socket.emit('typing', { sessionId, sender: currentUser?.phoneNumber, isTyping: false });
    };

    const startCall = (type: 'audio' | 'video') => {
        if (otherParticipant) {
            setCall({
                isCalling: true,
                callType: type,
                targetPhone: otherParticipant,
                callStatus: 'idle' // Will be picked up by App.tsx
            });
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="px-4 md:px-8 py-3 md:py-5 border-b border-slate-100 flex items-center justify-between bg-white z-10 shadow-sm">
                <div className="flex items-center gap-2 md:gap-4">
                    <button onClick={onBack} className="md:hidden p-2 hover:bg-slate-100 rounded-xl">
                        <ArrowLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <div className="relative">
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherParticipant}`} alt="Avatar" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-sm md:text-lg leading-tight uppercase tracking-tight">{otherParticipant}</h2>
                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-blue-500" />
                            <span className="text-[8px] md:text-[10px] text-blue-500 font-black uppercase tracking-widest leading-none">Secured Path</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 md:gap-3">
                    <div className="hidden sm:flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2.5 md:px-4 py-1.5 md:py-2.5 rounded-2xl border border-slate-100">
                        <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-400" />
                        <span className="text-slate-600 font-mono text-[10px] md:text-xs font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button onClick={() => startCall('audio')} className="p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-colors text-blue-500">
                            <Mic className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={() => startCall('video')} className="p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-colors text-blue-500">
                            <Video className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                    <button className="hidden md:block p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><Search className="w-5 h-5" /></button>
                    <button onClick={onToggleInfo} className="p-2 md:p-3 hover:bg-slate-50 rounded-2xl transition-colors text-slate-400"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-[#FBFCFE] custom-scrollbar">
                <div className="text-center py-4 md:py-8">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-slate-200">Today</span>
                </div>

                {messages.map((msg, i) => {
                    const isMe = msg.sender === currentUser?.phoneNumber;
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-500`}>
                            <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100'
                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'
                                    }`}>
                                    <p className="text-sm font-medium leading-relaxed">{msg.decrypted}</p>
                                </div>
                                <span className="text-[9px] mt-1.5 font-bold text-slate-400 uppercase tracking-widest px-2">
                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {otherTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 border-t border-slate-100 bg-white">
                <form onSubmit={handleSend} className="flex gap-2 md:gap-4 items-center max-w-6xl mx-auto">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Write something..."
                            className="w-full bg-slate-50 border-none rounded-2xl py-4 md:py-5 pl-4 md:pl-6 pr-12 text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2 hover:bg-slate-100 rounded-xl transition-colors ${showEmojiPicker ? 'text-blue-500 bg-blue-50' : 'text-slate-400'}`}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        </div>
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.LIGHT}
                                    lazyLoadEmojis={true}
                                    searchPlaceholder="Search emojis..."
                                    width={350}
                                    height={400}
                                />
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white p-4 md:p-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:scale-105 active:scale-95"
                    >
                        <Send className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button type="button" className="hidden sm:block p-5 bg-slate-100 text-slate-500 rounded-2xl hover:bg-slate-200 transition-all">
                        <Mic className="w-6 h-6" />
                    </button>
                </form>
            </div>

        </div>
    );
};

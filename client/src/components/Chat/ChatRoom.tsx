import React, { useState, useEffect, useRef } from 'react';
import { Send, Clock, Shield, Smile, ArrowLeft } from 'lucide-react';
import socket from '../../lib/socket';
import { useChatStore } from '../../store/useChatStore';
import { encryptMessage, decryptMessage, generateSessionKey } from '../../lib/crypto';

interface Message {
    _id?: string;
    sessionId: string;
    sender: string;
    encryptedContent: string;
    iv: string;
    decrypted?: string;
    createdAt: string;
}

interface ChatRoomProps {
    sessionId: string;
    onBack: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ sessionId, onBack }) => {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [otherTyping, setOtherTyping] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(600); // 10 mins in seconds

    const { currentUser, sessionKeys, setSessionKey } = useChatStore();
    const chatEndRef = useRef<HTMLDivElement>(null);

    const session = useChatStore.getState().activeSessions.find(s => s._id === sessionId);
    const otherParticipant = session?.participants.find(p => p !== currentUser?.phoneNumber);

    useEffect(() => {
        // Initialize session key if not exists
        const initKey = async () => {
            if (!sessionKeys[sessionId]) {
                const key = await generateSessionKey();
                setSessionKey(sessionId, key);
            }
        };
        initKey();

        socket.on('message', async (msg: Message) => {
            if (msg.sessionId === sessionId) {
                const key = useChatStore.getState().sessionKeys[sessionId];
                if (key) {
                    try {
                        msg.decrypted = await decryptMessage(key, msg.encryptedContent, msg.iv);
                        setMessages(prev => [...prev, msg]);
                    } catch (e) {
                        console.error('Decryption failed', e);
                    }
                }
            }
        });

        socket.on('typing', (data) => {
            if (data.sessionId === sessionId) {
                setOtherTyping(data.isTyping);
            }
        });

        socket.on('chatExpired', (data) => {
            if (data.sessionId === sessionId) {
                alert('This session has expired and messages were self-destructed.');
                onBack();
            }
        });

        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            socket.off('message');
            socket.off('typing');
            socket.off('chatExpired');
            clearInterval(timer);
        };
    }, [sessionId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, otherTyping]);

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
        socket.emit('typing', { sessionId, sender: currentUser?.phoneNumber, isTyping: false });
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        if (!isTyping) {
            setIsTyping(true);
            socket.emit('typing', { sessionId, sender: currentUser?.phoneNumber, isTyping: true });
            setTimeout(() => {
                setIsTyping(false);
                socket.emit('typing', { sessionId, sender: currentUser?.phoneNumber, isTyping: false });
            }, 3000);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex flex-col h-screen bg-surface relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between glass sticky top-0 z-20 backdrop-blur-2xl">
                <div className="flex items-center gap-5">
                    <button onClick={onBack} className="p-3 bg-white/[0.03] hover:bg-white/[0.08] hover:scale-105 active:scale-95 rounded-2xl transition-all border border-white/5">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <div>
                        <h2 className="font-mono text-xl text-white font-bold tracking-tight">{otherParticipant}</h2>
                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-green-500 font-black uppercase tracking-[0.1em]">Signal Verified</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2 bg-orange-400/10 px-4 py-2 rounded-2xl border border-orange-400/20">
                        <Clock className="w-4 h-4 text-orange-400" />
                        <span className="text-orange-400 font-mono text-sm font-black">{formatTime(timeLeft)}</span>
                    </div>
                    <span className="text-[8px] text-secondary font-bold uppercase tracking-widest mr-1">Time to Purge</span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="text-center py-10 opacity-20">
                    <p className="text-[10px] uppercase font-black tracking-[0.4em] text-white underline underline-offset-8 decoration-primary/50">Session Initiated</p>
                </div>

                {messages.map((msg, i) => {
                    const isMe = msg.sender === currentUser?.phoneNumber;
                    return (
                        <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-5 duration-700`}>
                            <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`p-5 rounded-[2rem] ${isMe
                                    ? 'bg-primary text-white rounded-br-none shadow-2xl shadow-primary/20'
                                    : 'glass-panel text-white rounded-bl-none border-none bg-white/[0.04]'
                                    } transition-all`}>
                                    <p className="text-base leading-relaxed font-medium">{msg.decrypted}</p>
                                </div>
                                <span className="text-[9px] mt-2 font-black text-secondary uppercase tracking-widest px-2">
                                    {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {otherTyping && (
                    <div className="flex justify-start animate-pulse">
                        <div className="bg-white/[0.05] px-5 py-4 rounded-3xl rounded-bl-none flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Footer / Input */}
            <div className="p-6 md:p-8 bg-surface/80 border-t border-white/5 backdrop-blur-3xl">
                <form onSubmit={handleSend} className="flex gap-4 max-w-5xl mx-auto">
                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            value={inputText}
                            onChange={handleTyping}
                            placeholder="Inject secure message..."
                            className="w-full glass-input rounded-3xl py-5 px-14 text-white text-lg placeholder:text-white/10 outline-none ring-primary/20 focus:ring-4 transition-all"
                        />
                        <Smile className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-hover:text-primary transition-colors cursor-pointer" />
                    </div>
                    <button
                        type="submit"
                        className="bg-white text-black hover:bg-primary hover:text-white p-5 rounded-3xl transition-all shadow-2xl hover:scale-105 active:scale-95 duration-500"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </form>
                <p className="text-center mt-4 text-[9px] text-white/10 font-bold uppercase tracking-[0.3em]">
                    AES-256 GCM Live Encryption
                </p>
            </div>
        </div>
    );
};

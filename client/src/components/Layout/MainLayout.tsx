import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { ChatWindow } from './ChatWindow';
import { InfoPanel } from './InfoPanel';
import { useChatStore } from '../../store/useChatStore';
import logo from '../../assets/Gemini_Generated_Image_z5qhq6z5qhq6z5qh.png';

export const MainLayout: React.FC = () => {
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [showInfo, setShowInfo] = useState(false);
    const { activeSessions, currentUser, isMobileSidebarOpen, setIsMobileSidebarOpen } = useChatStore();

    const activeSession = activeSessions.find(s => s._id === activeSessionId);
    const otherParticipant = activeSession?.participants.find(p => p !== currentUser?.phoneNumber) || null;

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setIsMobileSidebarOpen(false);
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] overflow-hidden relative">
            <div className={`
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 fixed md:relative z-30 w-full md:w-[380px] h-full transition-transform duration-300 ease-in-out bg-white
            `}>
                <Sidebar
                    onSelectSession={handleSelectSession}
                    activeSessionId={activeSessionId}
                />
            </div>

            <main className={`
                flex-1 flex overflow-hidden w-full h-full
                ${!isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                transition-transform duration-300 ease-in-out
            `}>
                {activeSessionId ? (
                    <div className="flex flex-1 overflow-hidden">
                        <ChatWindow
                            sessionId={activeSessionId}
                            onToggleInfo={() => setShowInfo(!showInfo)}
                            onBack={() => setIsMobileSidebarOpen(true)}
                        />
                        {showInfo && (
                            <div className="hidden lg:block">
                                <InfoPanel userPhone={otherParticipant} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#FBFCFE] p-12 text-center">
                        <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 border border-slate-100 shadow-2xl shadow-blue-100 p-2 overflow-hidden">
                            <img src={logo} className="w-full h-full object-cover rounded-[2.2rem]" alt="SecureChat Logo" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 text-center">Select a Conversation</h2>
                        <p className="text-slate-500 max-w-sm leading-relaxed font-medium">
                            Choose a secure session from the sidebar or start a new encrypted signal to begin messaging.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

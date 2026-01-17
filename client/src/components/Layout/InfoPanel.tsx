import React from 'react';
import { Search, Heart, Bell, FileText, Film, Music, Image as ImageIcon, ChevronRight } from 'lucide-react';

interface InfoPanelProps {
    userPhone: string | null;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ userPhone }) => {
    if (!userPhone) return null;

    return (
        <div className="w-[340px] h-full border-l border-slate-200 bg-white flex flex-col flex-shrink-0 animate-in slide-in-from-right duration-300">
            {/* Header / Profile */}
            <div className="p-8 flex flex-col items-center border-b border-slate-50 bg-[#F9FAFB]">
                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-blue-50 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userPhone}`} alt="Profile" />
                    </div>
                </div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{userPhone}</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Secured Signal</p>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <button className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 transition-all active:scale-95">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><FileText className="w-5 h-5" /></div>
                        <span className="text-[11px] font-black uppercase tracking-wider">Chat</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 text-slate-600 border border-slate-100 hover:bg-slate-100 transition-all active:scale-95">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm"><Film className="w-5 h-5" /></div>
                        <span className="text-[11px] font-black uppercase tracking-wider">Video</span>
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-slate-700 transition-colors group">
                    <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-bold">Search History</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-slate-700 transition-colors group">
                    <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-slate-400 group-hover:text-pink-500 transition-colors" />
                        <span className="text-sm font-bold">Add to Favorites</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 text-slate-700 transition-colors group">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-bold">Notifications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                </button>

                {/* Attachments Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shared Media</h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase border border-blue-100 px-3 py-1 rounded-full hover:bg-blue-50">View All</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 cursor-pointer hover:border-blue-200 transition-colors">
                            <FileText className="w-6 h-6 text-blue-400 mb-1" />
                            <span className="text-[9px] font-black text-slate-400">PDF</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 cursor-pointer hover:border-pink-200 transition-colors">
                            <ImageIcon className="w-6 h-6 text-pink-400 mb-1" />
                            <span className="text-[9px] font-black text-slate-400">IMAGE</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 cursor-pointer hover:border-purple-200 transition-colors">
                            <Film className="w-6 h-6 text-purple-400 mb-1" />
                            <span className="text-[9px] font-black text-slate-400">VIDEO</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-slate-100 cursor-pointer hover:border-yellow-200 transition-colors">
                            <Music className="w-6 h-6 text-yellow-400 mb-1" />
                            <span className="text-[9px] font-black text-slate-400">MP3</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

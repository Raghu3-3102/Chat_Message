import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, PhoneOff, MicOff, VideoOff } from 'lucide-react';
import { useChatStore } from '../../store/useChatStore';

interface CallOverlayProps {
    onHangup: () => void;
    onAnswer: () => void;
    onDecline: () => void;
}

export const CallOverlay: React.FC<CallOverlayProps> = ({ onHangup, onAnswer, onDecline }) => {
    const { call, setCall } = useChatStore();
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && call.localStream) {
            localVideoRef.current.srcObject = call.localStream;
        }
    }, [call.localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && call.remoteStream) {
            remoteVideoRef.current.srcObject = call.remoteStream;
        }
    }, [call.remoteStream]);

    const toggleMute = () => {
        if (call.localStream) {
            const audioTrack = call.localStream.getAudioTracks()[0];
            if (audioTrack) {
                const newState = !audioTrack.enabled;
                audioTrack.enabled = newState;
                setCall({ isMuted: !newState });
            }
        }
    };

    const toggleVideo = () => {
        if (call.localStream) {
            const videoTrack = call.localStream.getVideoTracks()[0];
            if (videoTrack) {
                const newState = !videoTrack.enabled;
                videoTrack.enabled = newState;
                setCall({ isVideoOff: !newState });
            }
        }
    };

    return (
        <AnimatePresence>
            {(call.isCalling || call.incomingCall) && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center"
                >
                    {/* Background/Remote Video */}
                    <div className="absolute inset-0 overflow-hidden">
                        {call.remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                                <div className="w-32 h-32 rounded-full bg-slate-700 flex items-center justify-center mb-4 animate-pulse">
                                    <Video className="w-12 h-12 text-slate-500" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                                    {call.callStatus === 'offering' ? 'Connecting Signal...' : 'Waiting for Peer...'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Local Preview (PiP) */}
                    {call.localStream && (
                        <motion.div
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            className="absolute top-8 right-8 w-32 md:w-48 aspect-[3/4] bg-black rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden z-10"
                        >
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror"
                            />
                        </motion.div>
                    )}

                    {/* Incoming Call UI */}
                    {call.incomingCall && !call.isCalling && (
                        <div className="relative z-20 text-center p-8 bg-white/10 backdrop-blur-xl rounded-[3rem] border border-white/10 max-w-sm w-full mx-4">
                            <div className="w-24 h-24 rounded-[2rem] bg-blue-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-500/20">
                                <PhoneOff className="w-10 h-10 text-white rotate-[135deg]" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Incoming Request</h2>
                            <p className="text-slate-300 font-medium mb-8">Secure link from {call.incomingCall.from}</p>
                            <div className="flex gap-4">
                                <button
                                    onClick={onDecline}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white py-4 rounded-2xl font-black transition-all border border-red-500/50"
                                >
                                    DECLINE
                                </button>
                                <button
                                    onClick={onAnswer}
                                    className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black hover:bg-green-600 transition-all shadow-xl shadow-green-500/20"
                                >
                                    ACCEPT
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Active Call Controls */}
                    {call.isCalling && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 px-6 py-4 bg-white/10 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 shadow-2xl">
                            <button
                                onClick={toggleMute}
                                className={`p-4 rounded-2xl transition-all active:scale-90 ${call.isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title={call.isMuted ? "Unmute" : "Mute"}
                            >
                                {call.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={toggleVideo}
                                className={`p-4 rounded-2xl transition-all active:scale-90 ${call.isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                title={call.isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
                            >
                                {call.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                            </button>
                            <button
                                onClick={onHangup}
                                className="p-4 bg-red-500 hover:bg-red-600 rounded-2xl text-white transition-all shadow-xl shadow-red-500/40 active:scale-90"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

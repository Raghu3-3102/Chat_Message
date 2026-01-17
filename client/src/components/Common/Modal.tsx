import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'info';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'info' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100"
                    >
                        <div className="p-8 text-center">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 ${type === 'success' ? 'bg-green-50 text-green-500' :
                                type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                }`}>
                                {type === 'success' && <CheckCircle2 className="w-8 h-8" />}
                                {type === 'error' && <AlertCircle className="w-8 h-8" />}
                                {type === 'info' && <X className="w-8 h-8" />}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{message}</p>

                            <button
                                onClick={onClose}
                                className="mt-8 w-full bg-slate-900 text-white font-black py-4 rounded-2xl hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
                            >
                                DISMISS
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

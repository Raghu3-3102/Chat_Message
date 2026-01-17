import { create } from 'zustand';

interface User {
    phoneNumber: string;
    name: string;
    gender: 'male' | 'female';
    status: 'online' | 'offline';
}

interface ChatSession {
    _id: string;
    participants: string[];
    status: 'pending' | 'active' | 'expired';
    expiresAt: string;
    initiatedBy: string;
    encryptionKey?: string; // Stored key
}

interface ModalState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface CallState {
    isCalling: boolean;
    callType: 'audio' | 'video' | null;
    targetPhone: string | null;
    incomingCall: {
        from: string;
        offer: any;
        sessionId: string;
        type: 'audio' | 'video';
    } | null;
    callStatus: 'idle' | 'offering' | 'connected' | 'ended';
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isMuted: boolean;
    isVideoOff: boolean;
}

interface ChatStore {
    currentUser: User | null;
    activeSessions: ChatSession[];
    pendingRequests: ChatSession[];
    sessionKeys: Record<string, CryptoKey>; // sessionId -> CryptoKey (In-Memory Only)
    isMobileSidebarOpen: boolean;
    modal: ModalState;
    call: CallState;

    setCurrentUser: (user: User | null) => void;
    setActiveSessions: (sessions: ChatSession[]) => void;
    addSession: (session: ChatSession) => void;
    setPendingRequests: (requests: ChatSession[]) => void;
    clearPendingRequest: (sessionId: string) => void;
    setSessionKey: (sessionId: string, key: CryptoKey) => void;
    setIsMobileSidebarOpen: (isOpen: boolean) => void;
    showModal: (params: Omit<ModalState, 'isOpen'>) => void;
    hideModal: () => void;
    setCall: (call: Partial<CallState>) => void;
    resetCall: () => void;
    logout: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
    currentUser: null,
    activeSessions: [],
    pendingRequests: [],
    sessionKeys: {},
    isMobileSidebarOpen: true,
    modal: { isOpen: false, title: '', message: '', type: 'info' },
    call: { isCalling: false, callType: null, targetPhone: null, incomingCall: null, callStatus: 'idle', localStream: null, remoteStream: null, isMuted: false, isVideoOff: false },

    setCurrentUser: (user) => set({ currentUser: user }),
    setActiveSessions: (sessions) => set({ activeSessions: sessions }),
    addSession: (session) => set((state) => ({
        activeSessions: [...state.activeSessions.filter(s => s._id !== session._id), session]
    })),
    setPendingRequests: (requests) => set({ pendingRequests: requests }),
    clearPendingRequest: (sessionId) => set((state) => ({
        pendingRequests: state.pendingRequests.filter(r => r._id !== sessionId)
    })),
    setSessionKey: (sessionId, key) => set((state) => ({
        sessionKeys: { ...state.sessionKeys, [sessionId]: key }
    })),
    setIsMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
    showModal: (params) => set({ modal: { ...params, isOpen: true } }),
    hideModal: () => set((state) => ({ modal: { ...state.modal, isOpen: false } })),
    setCall: (call) => set((state) => ({ call: { ...state.call, ...call } })),
    resetCall: () => set({ call: { isCalling: false, callType: null, targetPhone: null, incomingCall: null, callStatus: 'idle', localStream: null, remoteStream: null, isMuted: false, isVideoOff: false } }),
    logout: () => {
        localStorage.removeItem('userPhone');
        set({
            currentUser: null,
            activeSessions: [],
            pendingRequests: [],
            sessionKeys: {},
            isMobileSidebarOpen: true,
            modal: { isOpen: false, title: '', message: '', type: 'info' },
            call: { isCalling: false, callType: null, targetPhone: null, incomingCall: null, callStatus: 'idle', localStream: null, remoteStream: null, isMuted: false, isVideoOff: false }
        });
    }
}));

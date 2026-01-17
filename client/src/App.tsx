import { useEffect } from 'react';
import { AuthFlow } from './components/Auth/AuthFlow';
import { useChatStore } from './store/useChatStore';
import socket from './lib/socket';
import api from './lib/api';
import { MainLayout } from './components/Layout/MainLayout';
import { GlobalModal } from './components/Common/GlobalModal';
import { CallOverlay } from './components/Chat/CallOverlay';
import { useWebRTC } from './hooks/useWebRTC';

function App() {
  const { currentUser, setCurrentUser, addSession, setPendingRequests, setActiveSessions, resetCall, call } = useChatStore();

  const { answerCall, hangup, startCall } = useWebRTC(); // Hook is now generic

  useEffect(() => {
    if (call.isCalling && call.callStatus === 'idle' && call.targetPhone && call.callType) {
      startCall(call.callType, call.targetPhone);
    }
  }, [call.isCalling, call.callStatus, call.targetPhone, call.callType, startCall]);

  useEffect(() => {
    const fetchUser = async () => {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone && !currentUser) {
        try {
          const { data } = await api.post('/auth/login', { phoneNumber: savedPhone });
          setCurrentUser(data);
          socket.emit('join', savedPhone);

          // Fetch initial sessions
          const sessionsRes = await api.get(`/chat/sessions/${savedPhone}`);
          const allSessions: any[] = sessionsRes.data;
          setActiveSessions(allSessions.filter(s => s.status === 'active'));
          setPendingRequests(allSessions.filter(s => s.status === 'pending'));
        } catch (err) {
          localStorage.removeItem('userPhone');
        }
      }
    };
    fetchUser();

    socket.on('newRequest', (session) => {
      setPendingRequests([...useChatStore.getState().pendingRequests, session]);
    });

    socket.on('chatStarted', (session) => {
      addSession(session);
    });

    return () => {
      socket.off('newRequest');
      socket.off('chatStarted');
    };
  }, [currentUser]);

  if (!currentUser) {
    return <AuthFlow />;
  }

  return (
    <>
      <MainLayout />
      <GlobalModal />
      <CallOverlay
        onHangup={hangup}
        onAnswer={answerCall}
        onDecline={resetCall}
      />
    </>
  );
}

export default App;

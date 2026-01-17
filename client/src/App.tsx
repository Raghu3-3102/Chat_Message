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
    const initUser = async () => {
      const savedPhone = localStorage.getItem('userPhone');
      if (savedPhone && !currentUser) {
        try {
          const { data } = await api.post('/auth/login', { phoneNumber: savedPhone });
          setCurrentUser(data);
        } catch (err) {
          localStorage.removeItem('userPhone');
        }
      }
    };
    initUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      socket.emit('join', currentUser.phoneNumber);

      const fetchSessions = async () => {
        try {
          const sessionsRes = await api.get(`/chat/sessions/${currentUser.phoneNumber}`);
          const allSessions: any[] = sessionsRes.data;
          setActiveSessions(allSessions.filter(s => s.status === 'active'));
          setPendingRequests(allSessions.filter(s => s.status === 'pending'));
        } catch (err) {
          console.error('Failed to fetch sessions', err);
        }
      };

      fetchSessions();

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
    }
  }, [currentUser, setActiveSessions, setPendingRequests, addSession]);

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

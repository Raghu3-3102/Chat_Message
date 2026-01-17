import { useEffect, useRef, useCallback } from 'react';
import socket from '../lib/socket';
import { useChatStore } from '../store/useChatStore';

export const useWebRTC = () => {
    const pc = useRef<RTCPeerConnection | null>(null);
    const { call, setCall, resetCall, currentUser } = useChatStore();

    const cleanup = useCallback(() => {
        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (call.localStream) {
            call.localStream.getTracks().forEach(track => track.stop());
        }
        resetCall();
    }, [call.localStream, resetCall]);

    const initPeerConnection = useCallback(() => {
        if (pc.current) return pc.current;

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' },
            ]
        });

        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const target = call.targetPhone || call.incomingCall?.from;
                if (target) {
                    socket.emit('ice-candidate', {
                        to: target,
                        candidate: event.candidate
                    });
                }
            }
        };

        peer.ontrack = (event) => {
            console.log('Received remote track:', event.streams[0]);
            setCall({ remoteStream: event.streams[0] });
        };

        peer.onconnectionstatechange = () => {
            console.log('WebRTC Connection State:', peer.connectionState);
        };

        peer.oniceconnectionstatechange = () => {
            console.log('WebRTC ICE Connection State:', peer.iceConnectionState);
        };

        pc.current = peer;
        return peer;
    }, [call.targetPhone, call.incomingCall?.from, setCall]);

    const startCall = useCallback(async (type: 'audio' | 'video', targetPhone: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === 'video'
            });

            setCall({ isCalling: true, callStatus: 'offering', localStream: stream });

            const peer = initPeerConnection();
            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            if (targetPhone) {
                socket.emit('call-user', {
                    to: targetPhone,
                    offer,
                    from: currentUser?.phoneNumber,
                    sessionId: "", // Optional for this flow
                    type
                });
            }
        } catch (err) {
            console.error('Failed to start call', err);
            cleanup();
        }
    }, [currentUser?.phoneNumber, initPeerConnection, setCall, cleanup]);

    const answerCall = useCallback(async () => {
        if (!call.incomingCall) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: call.incomingCall.type === 'video'
            });

            setCall({ isCalling: true, callStatus: 'connected', localStream: stream });

            const peer = initPeerConnection();
            stream.getTracks().forEach(track => peer.addTrack(track, stream));

            await peer.setRemoteDescription(new RTCSessionDescription(call.incomingCall.offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            socket.emit('make-answer', {
                to: call.incomingCall.from,
                answer
            });
        } catch (err) {
            console.error('Failed to answer call', err);
            cleanup();
        }
    }, [call.incomingCall, initPeerConnection, setCall, cleanup]);

    useEffect(() => {
        socket.on('call-made', (data) => {
            setCall({ incomingCall: data });
        });

        socket.on('answer-made', async (data) => {
            if (pc.current) {
                await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                setCall({ callStatus: 'connected' });
            }
        });

        socket.on('ice-candidate', async (data) => {
            if (pc.current) {
                try {
                    await pc.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.error('Error adding ice candidate', e);
                }
            }
        });

        socket.on('hangup', () => {
            cleanup();
        });

        return () => {
            socket.off('call-made');
            socket.off('answer-made');
            socket.off('ice-candidate');
            socket.off('hangup');
        };
    }, [setCall, cleanup]);

    const hangup = useCallback(() => {
        const target = call.targetPhone || call.incomingCall?.from;
        if (target) {
            socket.emit('hangup', { to: target });
        }
        cleanup();
    }, [call.targetPhone, call.incomingCall?.from, cleanup]);

    return { startCall, answerCall, hangup };
};

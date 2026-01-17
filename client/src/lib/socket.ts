import { io } from 'socket.io-client';

const socket = io('https://chat-message-nf2e.onrender.com');

export default socket;

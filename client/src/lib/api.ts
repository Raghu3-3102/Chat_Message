import axios from 'axios';

const api = axios.create({
    baseURL: 'https://chat-message-nf2e.onrender.com/api',
});

export default api;

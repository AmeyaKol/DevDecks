import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api'; // Use /api due to proxy

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
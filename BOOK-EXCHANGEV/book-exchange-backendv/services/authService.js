// src/services/authService.js
import axios from 'axios';

const API_URL = 'http://localhost:5001/auth'; // Update this as needed

const register = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData, {
        headers: {
            'Content-Type': 'application/json',
        },
    });
    return response.data;
};

const login = async (username, password) => {
    const response = await axios.post(`${API_URL}/login`, { username, password });
    return response.data;
};

const resetPassword = async (email, newPassword) => {
    const response = await axios.post(`${API_URL}/reset-password`, { email, newPassword });
    return response.data;
};

export default {
    register,
    login,
    resetPassword,
};


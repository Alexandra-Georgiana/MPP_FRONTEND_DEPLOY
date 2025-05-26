import axios from 'axios';

const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

export const authService = {
    async loginAdmin(username, password) {
        try {
            const response = await axios.post(`${API_URL}/admin/login`, {
                username,
                password
            });
            
            if (response.data.token) {
                localStorage.setItem('admin', JSON.stringify({
                    username: response.data.username,
                    email: response.data.email,
                    role: 'admin',
                    token: response.data.token
                }));
            }
            
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('admin');
    },

    getCurrentAdmin() {
        const adminStr = localStorage.getItem('admin');
        if (adminStr) {
            return JSON.parse(adminStr);
        }
        return null;
    },

    isAuthenticated() {
        return !!this.getCurrentAdmin();
    }
};

export default authService; 
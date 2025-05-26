const config = {
    // This is for Node.js backend API calls (login, register, songs, likes, etc.)
    apiUrl: import.meta.env.VITE_API_URL || 'https://mppmusic-library-production.up.railway.app/api',
    
    // This is for the main Node.js backend URL (without /api, used for some direct calls)
    baseUrl: import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'https://mppmusic-library-production.up.railway.app',
    
    // This is for Flask backend API calls (recommendations, song analysis)
    flaskApiUrl: import.meta.env.VITE_FLASK_API_URL || 'https://mppmusic-library-production.up.railway.app',
    
    // You can remove this as frontend shouldn't connect directly to DB
    dbUrl: import.meta.env.VITE_DB_URL || 'https://mppmusic-library-production.up.railway.app'
};

export default config;
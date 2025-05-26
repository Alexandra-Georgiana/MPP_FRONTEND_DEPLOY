const config = {
    // This is for Node.js backend API calls (login, register, songs, likes, etc.)
    //apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    apiUrl: 'https://mppfordeploy-hopefully-production.up.railway.app/api',
   
    // This is for the main Node.js backend URL (without /api, used for some direct calls)
    baseUrl: import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '') 
        : 'http://localhost:3000',
    
    // This is for Flask backend API calls (recommendations, song analysis)
    flaskApiUrl: import.meta.env.VITE_FLASK_API_URL || 'http://localhost:5000'
};

export default config;
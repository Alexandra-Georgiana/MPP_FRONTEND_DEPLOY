import React, {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';


const AdminShortCut = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const handleKeyPress = (e) =>{
            if(e.ctrlKey && e.key === 'a'){
                navigate('/admin_login');
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [navigate]);
    return null;
};

export default AdminShortCut;
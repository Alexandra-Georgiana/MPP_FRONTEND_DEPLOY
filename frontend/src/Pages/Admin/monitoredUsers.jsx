import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

const MonitoredUsers = () => {
  const [monitoredUsers, setMonitoredUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMonitoredUsers = async () => {
      try {
        const response = await fetch(`${config.flaskApiUrl}/api/getMonitoredUsers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch monitored users');
        }
        const data = await response.json();
        setMonitoredUsers(data);
      } catch (error) {
        console.error('Error fetching monitored users:', error);
      }
    };

    fetchMonitoredUsers();
  }, []);

  return (
    <div style={{ padding: '20px', backgroundColor: '#561B21', color: 'white', minHeight: '90vh', minWidth: '60vw' }}>
      <h1>Monitored Users</h1>
      <button onClick={() => navigate('/admin')} style={{ marginBottom: '20px', padding: '10px', borderRadius: '5px', backgroundColor: '#007BFF', color: 'white', border: 'none', cursor: 'pointer' }}>
        Back to Admin Page
      </button>
      {monitoredUsers.length > 0 ? (
        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', color: 'black' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid black', padding: '10px' }}>User ID</th>
              <th style={{ border: '1px solid black', padding: '10px' }}>Reason</th>
              <th style={{ border: '1px solid black', padding: '10px' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {monitoredUsers.map((user, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid black', padding: '10px' }}>{user.user_id}</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{user.reason}</td>
                <td style={{ border: '1px solid black', padding: '10px' }}>{new Date(user.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={{ color: 'white', textAlign: 'center', marginTop: '20px' }}>No monitored users found.</p>
      )}
    </div>
  );
};

export default MonitoredUsers;

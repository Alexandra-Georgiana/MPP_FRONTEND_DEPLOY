import config from '../config';

const response = await fetch(`${config.apiUrl}/verify-token`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  credentials: 'include'
}); 
import config from '../../config';

const response = await fetch(`${config.apiUrl}/songs/liked`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}` 
  },
  body: JSON.stringify({ token })
}); 
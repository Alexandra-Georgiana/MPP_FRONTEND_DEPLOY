import config from '../../config';

const getSongs = async (reset = false) => {
  try {
    setLoading(true);

    const response = await fetch(`${config.apiUrl}/songs?offset=${offset}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // ... existing code ...
  } catch (error) {
    // ... existing code ...
  }
}; 
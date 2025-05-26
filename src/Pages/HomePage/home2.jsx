import config from '../../config';

const getSongs = async (reset = false, customOffset = offset) => {
  try {
    setLoading(true);

    const response = await fetch(`${config.apiUrl}/songs?offset=${customOffset}&limit=${limit}`, {
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
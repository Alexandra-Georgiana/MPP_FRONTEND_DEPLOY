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

const getSongDetails = async (trackId) => {
  try {
    const response = await fetch(`${config.apiUrl}/songs/${trackId}`);
    if (!response.ok) {
      console.error('Error fetching song details:', response.status, response.statusText);
      throw new Error(`Failed to fetch song details: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    setSong(data);
    const response1 = await fetch(`${config.apiUrl}/songs/details/${trackId}`);
    if (!response1.ok) {
      console.error('Error fetching song details:', response1.status, response1.statusText);
      throw new Error(`Failed to fetch song details: ${response1.status} ${response1.statusText}`);
    }
    const data1 = await response1.json();
    setAverageRating(data1.average_rating || 0);
    setComments(data1.comments || []);
  } catch (error) {
    console.error('Error fetching song details:', error);
  }
}; 
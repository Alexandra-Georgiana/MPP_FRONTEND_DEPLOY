export const countRatings = (songs) => {
    return [1, 2, 3, 4, 5].map((rating) => ({
      rating: `${rating}★`,
      count: songs.filter((song) => song.rating === rating).length,
    }));
  };
  
  export const getColor = (rating) => {
    if (rating <= 2) return "white";
    if (rating === 3) return "darkred";
    return "black";
  };
  
  export const calculateMostCommonGenre = (songs) => {
    const genreCounts = songs.reduce((acc, song) => {
      acc[song.genre] = (acc[song.genre] || 0) + 1;
      return acc;
    }, {});
  
    return Object.entries(genreCounts).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
  };
  
import AlbumCover from "./local_album_cover.png";
import Audio from "./local_audio.mp3";

const songs = [
    { id: 1, title: "Echoes of Tomorrow", artist: "Luna Wave", album: "Futuristic Dreams", genre: "Synthwave", image: AlbumCover, audio: Audio, description: "A futuristic synthwave journey through time.", rating: 0 },
    { id: 2, title: "Neon Night Drive", artist: "Synth Horizon", album: "City Lights", genre: "Electronic", image: AlbumCover, audio: Audio, description: "The perfect soundtrack for a neon-lit city drive.", rating: 3 },
    { id: 3, title: "Golden Skies", artist: "Aurora Ray", album: "Sunset Whispers", genre: "Chillwave", image: AlbumCover, audio: Audio, description: "A calming melody for sunset lovers.", rating: 0 },
    { id: 4, title: "Parallel Universe", artist: "Quantum Beat", album: "Dimensional Sounds", genre: "Experimental", image: AlbumCover, audio: Audio, description: "A journey into a different dimension of sound.", rating: 0 },
    { id: 5, title: "Midnight Serenity", artist: "Celestial Echo", album: "Moonlit Vibes", genre: "Ambient", image: AlbumCover, audio: Audio, description: "Peaceful ambient music for midnight relaxation.", rating: 0 },
    { id: 6, title: "Lost in the Stars", artist: "Cosmo Drift", album: "Galactic Journeys", genre: "Lo-Fi", image: AlbumCover, audio: Audio, description: "A dreamy lo-fi track for cosmic exploration.", rating: 0 },
    { id: 7, title: "Velvet Horizon", artist: "Eclipse Sound", album: "Dark Tranquility", genre: "Downtempo", image: AlbumCover, audio: Audio, description: "Smooth downtempo beats for a relaxed mood.", rating: 0 },
    { id: 8, title: "Chasing the Sun", artist: "Solar Pulse", album: "Daydream Escape", genre: "Indie Electronic", image: AlbumCover, audio: Audio, description: "A feel-good track for chasing your dreams.", rating: 0 },
    { id: 9, title: "Distant Echo", artist: "Astral Tune", album: "Beyond the Void", genre: "Space Music", image: AlbumCover, audio: Audio, description: "Mysterious echoes from the depths of space.", rating: 0 },
    { id: 10, title: "Cosmic Waves", artist: "Nebula Sound", album: "Infinite Skies", genre: "Psybient", image: AlbumCover, audio: Audio, description: "Ride the waves of the cosmos with this tune.", rating: 0 },
    { id: 11, title: "Crystal Reflections", artist: "Ocean Breeze", album: "Aquatic Dreams", genre: "New Age", image: AlbumCover, audio: Audio, description: "A soothing journey through crystal-clear waters.", rating: 0 },
    { id: 12, title: "Fading Lights", artist: "Shadow Pulse", album: "Silent Nightscapes", genre: "Chillout", image: AlbumCover, audio: Audio, description: "A melancholic chillout piece for late nights.", rating: 0 },
    { id: 13, title: "Aurora Dreams", artist: "Skybound", album: "Frozen Echoes", genre: "Cinematic", image: AlbumCover, audio: Audio, description: "A cinematic masterpiece inspired by the auroras.", rating: 0 },
    { id: 14, title: "The Last Voyage", artist: "Neon Drifters", album: "Lost Realms", genre: "Retrowave", image: AlbumCover, audio: Audio, description: "A nostalgic retrowave trip through lost memories.", rating: 0 },
    { id: 15, title: "Electric Sunset", artist: "Digital Mirage", album: "Synth Horizons", genre: "Synthwave", image: AlbumCover, audio: Audio, description: "Synth-filled beats for an electrifying sunset.", rating: 0 },
    { id: 16, title: "Frozen Time", artist: "Glacial Echo", album: "Arctic Soundscapes", genre: "Ambient", image: AlbumCover, audio: Audio, description: "An ambient piece capturing the stillness of ice.", rating: 0 },
    { id: 17, title: "Whispering Shadows", artist: "Ethereal Sound", album: "Mystic Waves", genre: "Downtempo", image: AlbumCover, audio: Audio, description: "Mysterious whispers within deep, haunting beats.", rating: 0 },
    { id: 18, title: "Celestial Path", artist: "Starlit Voyage", album: "Galactic Winds", genre: "Space Ambient", image: AlbumCover, audio: Audio, description: "An atmospheric journey through the galaxies.", rating: 0 },
    { id: 19, title: "Sunken Cities", artist: "Deep Dive", album: "Underwater Legends", genre: "Dark Ambient", image: AlbumCover, audio: Audio, description: "Exploring the echoes of submerged civilizations.", rating: 0 },
    { id: 20, title: "Artificial Horizons", artist: "Cybernetic Sound", album: "Future Visions", genre: "Cyberpunk", image: AlbumCover, audio: Audio, description: "A cyberpunk-inspired vision of the future.", rating: 0 },
    { id: 21, title: "Lost Signals", artist: "Void Frequency", album: "Ethereal Broadcasts", genre: "Experimental", image: AlbumCover, audio: Audio, description: "Glitchy and distorted, like a lost transmission.", rating: 0 },
    { id: 22, title: "Beyond the Clouds", artist: "Sky Painter", album: "Dream Horizons", genre: "Dream Pop", image: AlbumCover, audio: Audio, description: "A dreamy pop ballad that floats above the clouds.", rating: 0 },
    { id: 23, title: "Synthetic Symphony", artist: "Neon Pulse", album: "Artificial Harmonics", genre: "Synthwave", image: AlbumCover, audio: Audio, description: "A symphony of neon lights and retro beats.", rating: 0 },
    { id: 24, title: "Echoes from the Abyss", artist: "Deep Resonance", album: "Dark Explorations", genre: "Drone", image: AlbumCover, audio: Audio, description: "Dark, droning echoes from the depths below.", rating: 0 },
    { id: 25, title: "Binary Love", artist: "Robotic Heart", album: "Electric Emotions", genre: "Electronica", image: AlbumCover, audio: Audio, description: "A robotic tale of love and electricity.", rating: 0 },
    { id: 26, title: "Melodic Starlight", artist: "Orion's Sound", album: "Stellar Dreams", genre: "Chillwave", image: AlbumCover, audio: Audio, description: "Soft melodies glowing in the starlit night.", rating: 0 },
    { id: 27, title: "Fragments of a Dream", artist: "Ethereal Visions", album: "Fading Memories", genre: "Shoegaze", image: AlbumCover, audio: Audio, description: "Dreamy soundscapes that fade into memories.", rating: 0 },
    { id: 28, title: "Timeless Echo", artist: "Horizon Drift", album: "Sound of the Past", genre: "Lo-Fi", image: AlbumCover, audio: Audio, description: "Lo-fi beats that bring echoes of the past.", rating: 0 },
  ];
  
  export default songs;
  
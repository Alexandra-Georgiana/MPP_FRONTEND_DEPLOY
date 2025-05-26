CREATE DATABASE IF NOT EXISTS MusicLibrary;

USE MusicLibrary;

DROP TABLE IF EXISTS liked_songs;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(500) NOT NULL,
    email VARCHAR(50) NOT NULL,
    favorite_genre VARCHAR(50) NOT NULL DEFAULT '',
    favorite_artist VARCHAR(50) NOT NULL DEFAULT '',
    bio TEXT NULL,
    avatar LONGTEXT NULL
);

CREATE TABLE songs (
    track_id INT AUTO_INCREMENT PRIMARY KEY,
    track_name VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    album_name VARCHAR(255) NOT NULL,
    album_image VARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 0 AND rating <= 5) DEFAULT 0,
    genres VARCHAR(50) NOT NULL,
    audio_url VARCHAR(255) NOT NULL
);

CREATE TABLE liked_songs (
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
);

CREATE TABLE comments (
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
);

CREATE TABLE ratings (
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
);

CREATE TABLE Admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(500) NOT NULL,
    email VARCHAR(50) NOT NULL
);

CREATE TABLE monitored_users (
    user_id INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


DELETE FROM songs;

USE MusicLibrary;
ALTER TABLE users 
    ADD COLUMN email_verified BOOLEAN DEFAULT 0,
    ADD COLUMN two_factor_enabled BOOLEAN DEFAULT 0,
    ADD COLUMN two_factor_token VARCHAR(6) NULL,
    ADD COLUMN two_factor_expires TIMESTAMP NULL,
    ADD COLUMN reset_token VARCHAR(255) NULL,
    ADD COLUMN reset_token_expires TIMESTAMP NULL,
    ADD COLUMN last_login TIMESTAMP NULL;

-- Create remember me tokens table
CREATE TABLE user_remember_tokens (
    token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add indices to optimize song fetching and search
ALTER TABLE songs ADD INDEX idx_track_name (track_name);
ALTER TABLE songs ADD INDEX idx_artist_name (artist_name);
ALTER TABLE songs ADD INDEX idx_genre_name (genres);
-- Add index for genre and rating columns to improve query performance
ALTER TABLE songs ADD INDEX idx_genre_rating (genres, rating);

INSERT INTO Admin (username, password, email) VALUES ('Administrator', 'admin123', 'admin@mymusiclib.com');
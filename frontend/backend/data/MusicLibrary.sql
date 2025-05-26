create database MusicLibrary;
go

use MusicLibrary;
GO

DROP TABLE IF EXISTS liked_songs;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS songs;
DROP TABLE users;
GO

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL,
    password NVARCHAR(500) NOT NULL,
    email NVARCHAR(50) NOT NULL,
    favorite_genre NVARCHAR(50) NOT NULL DEFAULT '',
    favorite_artist NVARCHAR(50) NOT NULL DEFAULT '',
    bio TEXT NULL,
    avatar NVARCHAR(255) NULL
);
GO

CREATE TABLE songs (
    track_id INT IDENTITY(1,1) PRIMARY KEY,
    track_name NVARCHAR(255) NOT NULL,
    artist_name NVARCHAR(255) NOT NULL,
    album_name NVARCHAR(255) NOT NULL,
    album_image NVARCHAR(255) NOT NULL,
    rating INT CHECK (rating >= 0 AND rating <= 5) DEFAULT 0,
    genres NVARCHAR(50) NOT NULL,
    audio_url NVARCHAR(255) NOT NULL,
);
GO


ALTER TABLE users ALTER COLUMN password NVARCHAR(500) NOT NULL;
GO
ALTER TABLE users ALTER COLUMN avatar VARCHAR(max) NULL;
GO

CREATE TABLE liked_songs (
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
);
GO

CREATE TABLE comments(
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    comment_text NVARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
)
GO
--only one comment per user per song; at the first listen

CREATE TABLE ratings(
    user_id INT NOT NULL,
    track_id INT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5) DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id),
    PRIMARY KEY (user_id, track_id),
    FOREIGN KEY (track_id) REFERENCES songs(track_id)
)
GO
--only one rating per user per song; at the first listen 

--we belive in first impression
DROP DATABASE IF EXISTS MusicLibrary;
GO

SELECT * FROM songs WHERE track_name LIKE '%water%' or artist_name LIKE '%water%';

SELECT songs.track_name, songs.artist_name, songs.album_name, songs.album_image, ratings.rating FROM songs
JOIN ratings ON songs.track_id = ratings.track_id WHERE ratings.user_id = 1;

SELECT TOP 10 users.username, comments.comment_text FROM comments 
JOIN  users ON comments.user_id = users.id
WHERE track_id = 0;

SELECT * FROM songs;


CREATE TABLE Admin (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL,
    password NVARCHAR(500) NOT NULL,
    email NVARCHAR(50) NOT NULL
);
GO

INSERT INTO Admin (username, password, email) VALUES ('Administrator', 'admin123', 'admin@mymusiclib.com');

SELECT * FROM songs Where track_name = 'Tedy'
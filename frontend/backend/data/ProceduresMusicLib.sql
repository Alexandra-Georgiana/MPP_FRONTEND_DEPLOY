use MusicLibrary;
GO

--Users Table Procedures
CREATE PROCEDURE register_user
    @username NVARCHAR(50),
    @password NVARCHAR(50),
    @email NVARCHAR(50),
    @favorite_genre NVARCHAR(50) = '',
    @favorite_artist NVARCHAR(50) = '',
    @bio TEXT = NULL,
    @avat
SELECT * FROM commentsar NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO users (username, password, email, favorite_genre, favorite_artist, bio, avatar)
    VALUES (@username, @password, @email, @favorite_genre, @favorite_artist, @bio, @avatar);
END
GO

CREATE PROCEDURE GetUserByEmail
    @email NVARCHAR(50)
AS
BEGIN
    SELECT * FROM users WHERE email = @email;
END
GO

CREATE PROCEDURE GetUserByID
    @id INT
AS
BEGIN
    SELECT * FROM users WHERE id = @id;
END
GO

CREATE PROCEDURE UpdateUserProfile
    @username NVARCHAR(50) = NULL,
    @password NVARCHAR(50) = NULL,
    @email NVARCHAR(50) = NULL,
    @favorite_genre NVARCHAR(50) = NULL,
    @favorite_artist NVARCHAR(50) = NULL,
    @bio TEXT = NULL,
    @avatar NVARCHAR(255) = NULL
AS
BEGIN
    UPDATE users
    SET username = COALESCE(@username, username),
        password = COALESCE(@password, password),
        email = COALESCE(@email, email),
        favorite_genre = COALESCE(@favorite_genre, favorite_genre),
        favorite_artist = COALESCE(@favorite_artist, favorite_artist),
        bio = COALESCE(@bio, bio),
        avatar = COALESCE(@avatar, avatar)
    WHERE email = @email;
END
GO

-- Songs Table Procedures
CREATE PROCEDURE GetAllSongs
AS
BEGIN
    SELECT * FROM songs;
END
GO

CREATE PROCEDURE GetSongByID
    @track_id INT
AS
BEGIN
    SELECT * FROM songs WHERE track_id = @track_id;
END
GO

-- Add indices to optimize song fetching and search
CREATE INDEX idx_track_name ON songs (track_name);
CREATE INDEX idx_artist_name ON songs (artist_name);
CREATE INDEX idx_genre_name ON songs (genres);
-- Add index for genre and rating columns to improve query performance
CREATE INDEX idx_genre_rating ON songs (genres, rating);

DROP INDEX IF EXISTS idx_track_name ON songs;
DROP INDEX IF EXISTS idx_artist_name ON songs;
DROP INDEX IF EXISTS idx_genre_name ON songs;
DROP INDEX IF EXISTS idx_genre_rating ON songs;

SELECT * FROM songs WHERE track_id = 2310;
SELECT * FROM users
UPDATE users SET avatar = NULL WHERE username = 'Aki'
Update songs SET rating = 4 WHERE track_id = 2310

SELECT * FROM comments
DROP TABLE IF EXISTS songs;
TRUNCATE TABLE songs;
SELECT * FROM Admin;

USE MusicLibrary;
GO
SELECT * FROM users;

SELECT TOP 1 genre
                FROM songs
                WHERE rating >= 4 AND genre IS NOT NULL AND genre != ''
                GROUP BY genre
                ORDER BY COUNT(*) DESC

CREATE TABLE monitored_users (
    user_id INT NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, timestamp),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

USE MusicLibrary;
GO
DELETE FROM users WHERE id = 10;
-- Update all rows in the songs table where rating is 0 to set the rating to 4
UPDATE songs
SET rating = 4
WHERE rating = 0;

SELECT COUNT(*) FROM songs;

DELETE FROM monitored_users;
DELETE FROM users;

SELECT * FROM liked_songs;
DELETE FROM ratingS;
DELETE FROM comments;
DELETE FROM songs;

ALTER TABLE users ADD
    email_verified BIT DEFAULT 0,
    two_factor_enabled BIT DEFAULT 0,
    two_factor_token VARCHAR(6) NULL,
    two_factor_expires DATETIME NULL,
    reset_token VARCHAR(255) NULL,
    reset_token_expires DATETIME NULL,
    last_login DATETIME NULL;
GO

-- Create remember me tokens table
CREATE TABLE user_remember_tokens (
    token_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
GO

Select * from users
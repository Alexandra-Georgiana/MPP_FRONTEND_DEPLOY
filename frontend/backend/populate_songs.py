import json
import pyodbc
from faker import Faker
import os

# Database connection setup
connection = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=USER\\MSSQLSERVER03;DATABASE=MusicLibrary;Trusted_Connection=yes;')
cursor = connection.cursor()

# Check if the songs.json file exists
songs_file_path = 'd:/MPP/frontend/backend/data/songs.json'
if not os.path.exists(songs_file_path):
    # Create a placeholder songs.json file if it doesn't exist
    with open(songs_file_path, 'w', encoding='utf-8') as file:
        json.dump([], file)
    print(f"Placeholder {songs_file_path} file created.")

# Load songs from JSON file with utf-8 encoding to handle special characters
with open(songs_file_path, 'r', encoding='utf-8') as file:
    songs = json.load(file)

# Initialize Faker instance
fake = Faker()

# Generate additional songs using Faker
additional_songs = []
for i in range(10000):
    song = {
        "track_name": fake.sentence(nb_words=3),
        "artist_name": fake.name(),
        "album_name": fake.sentence(nb_words=2),
        "album_image": fake.image_url(width=150, height=150),
        "rating": fake.random_int(min=1, max=5),
        "genres": fake.word(ext_word_list=["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"]),
        "audio_url": fake.url()
    }
    additional_songs.append(song)



# Insert songs into the database
insert_query = """
INSERT INTO songs ( track_name, artist_name, album_name, album_image, rating, genres, audio_url)
VALUES ( ?, ?, ?, ?, ?, ?, ?)
"""

for song in additional_songs:
    cursor.execute(insert_query, (
        song["track_name"],
        song["artist_name"],
        song["album_name"],
        song["album_image"],
        song["rating"],
        song["genres"],
        song["audio_url"]
    ))

# Disable IDENTITY_INSERT after insertion
cursor.execute("SET IDENTITY_INSERT songs OFF")

# Generate additional songs with specific ratings (0 and 4)
specific_rating_songs = []
for i in range(5000):  # Generate 5000 songs with rating 0
    song = {
        "track_name": fake.sentence(nb_words=3),
        "artist_name": fake.name(),
        "album_name": fake.sentence(nb_words=2),
        "album_image": fake.image_url(width=150, height=150),
        "rating": 0,
        "genres": fake.word(ext_word_list=["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"]),
        "audio_url": fake.url()
    }
    specific_rating_songs.append(song)

for i in range(5000):  # Generate 5000 songs with rating 4
    song = {
        "track_name": fake.sentence(nb_words=3),
        "artist_name": fake.name(),
        "album_name": fake.sentence(nb_words=2),
        "album_image": fake.image_url(width=150, height=150),
        "rating": 4,
        "genres": fake.word(ext_word_list=["Pop", "Rock", "Jazz", "Classical", "Hip-Hop"]),
        "audio_url": fake.url()
    }
    specific_rating_songs.append(song)

# Insert songs with specific ratings into the database
for song in specific_rating_songs:
    cursor.execute(insert_query, (
        song["track_name"],
        song["artist_name"],
        song["album_name"],
        song["album_image"],
        song["rating"],
        song["genres"],
        song["audio_url"]
    ))

# Commit changes and close connection
connection.commit()
cursor.close()
connection.close()

print("10,000 songs have been added to the database using Faker.")

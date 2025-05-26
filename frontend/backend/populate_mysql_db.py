import json
import mysql.connector
from mysql.connector import Error

def connect_to_mysql():
    try:
        connection = mysql.connector.connect(
            host="localhost",
            user="root",
            password="N15feb05",
            database="MusicLibrary"
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def populate_songs(connection):
    try:
        with open('data/songs.json', 'r', encoding='utf-8') as file:
            songs = json.load(file)
            
        cursor = connection.cursor()
        
        # Insert songs
        insert_query = """
        INSERT INTO songs (track_id, track_name, artist_name, album_name, album_image, rating, genres, audio_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        for song in songs:
            values = (
                song['track_id'],
                song['track_name'],
                song['artist_name'],
                song['album_name'],
                song['album_image'],
                song.get('rating', 0),
                song.get('genres', ''),  # Add default empty string if genres is not present
                song['audio_url']
            )
            
            try:
                cursor.execute(insert_query, values)
                print(f"Inserted song: {song['track_name']}")
            except Error as e:
                print(f"Error inserting song {song['track_name']}: {e}")
                continue
        
        connection.commit()
        print("\nAll songs have been inserted successfully!")
        
    except Error as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Error reading or processing JSON file: {e}")
    finally:
        if connection.is_connected():
            cursor.close()

def main():
    connection = connect_to_mysql()
    if connection is not None:
        print("Successfully connected to MySQL database!")
        populate_songs(connection)
        connection.close()
        print("\nMySQL connection closed.")

if __name__ == "__main__":
    main()

from dotenv import load_dotenv
import os
from requests import post, get
import base64
import json
from yt_dlp import YoutubeDL
import time
import mysql.connector
from concurrent.futures import ThreadPoolExecutor

load_dotenv()

client_id = os.getenv("CLIENT_ID")
client_secret = os.getenv("CLIENT_SECRET")
# connection_string = os.getenv("MYSQL_DATABASE_CONNECTION_STRING")

def get_token():
    auth_string = client_id + ":" + client_secret
    auth_bytes = auth_string.encode("utf-8")
    auth_base64 = str(base64.b64encode(auth_bytes), "utf-8")

    url = "https://accounts.spotify.com/api/token"
    headers = {
        "Authorization": "Basic " + auth_base64,
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {"grant_type": "client_credentials"}
    result = post(url, headers=headers, data=data)
    return json.loads(result.content)["access_token"]

def get_auth_header(token):
    return {"Authorization": "Bearer " + token}

def search_for_artist(token, artist_name):
    url = "https://api.spotify.com/v1/search"
    headers = get_auth_header(token)
    query = f"?q={artist_name}&type=artist&limit=1"
    result = get(url + query, headers=headers)
    json_result = json.loads(result.content)["artists"]["items"]
    return json_result[0] if json_result else None

def get_artist_albums(token, artist_id):
    url = f"https://api.spotify.com/v1/artists/{artist_id}/albums"
    headers = get_auth_header(token)
    result = get(url + "?include_groups=album,single,appears_on&limit=50", headers=headers)
    return json.loads(result.content)["items"]

def get_album_tracks(token, album_id):
    url = f"https://api.spotify.com/v1/albums/{album_id}"
    headers = get_auth_header(token)
    result = get(url, headers=headers)
    album_data = json.loads(result.content)

    tracks_info = []
    for track in album_data["tracks"]["items"]:
        tracks_info.append({
            "track_name": track["name"],
            "artist_name": ", ".join([artist["name"] for artist in track["artists"]]),
            "album_name": album_data["name"],
            "album_image": album_data["images"][0]["url"] if album_data["images"] else None,
            "rating": 0,
        })
    return tracks_info

def get_audio_url(track_name, artist_name):
    ydl_opts = {
        "format": "bestaudio/best",
        "quiet": True,
        "noplaylist": True,
        "extract_flat": "in_playlist",
    }
    with YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(f"ytsearch1:{track_name} {artist_name}", download=False)
            if info and "entries" in info and info["entries"]:
                return f"https://www.youtube.com/watch?v={info['entries'][0]['id']}"
        except Exception as e:
            print(f"Failed to fetch YouTube URL for {track_name} - {e}")
    return None

def get_db_connection():
    try:
        mysql_url = os.getenv('MYSQL_URL', 'mysql://root:N15feb05.@localhost:3306/MusicLibrary')
        params = {
            'charset': 'utf8mb4',
            'use_unicode': True,
            'buffered': True
        }
        return mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', 'N15feb05.'),
            database=os.getenv('DB_NAME', 'MusicLibrary'),
            **params
        )
    except mysql.connector.Error as err:
        print(f"Failed to connect to database: {err}")
        raise

def track_exists(cursor, track_name, artist_name):
    cursor.execute("""
        SELECT 1 FROM songs
        WHERE track_name = %s AND artist_name = %s
    """, (track_name, artist_name))  # Changed ? to %s for MySQL
    return cursor.fetchone() is not None

def save_track_to_db(cursor, conn, track_info):
    genre = track_info.get("genre", "Unknown")
    cursor.execute("""
        INSERT INTO songs (track_name, artist_name, album_name, album_image, rating, audio_url, genres)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (  # Changed ? to %s for MySQL
        track_info["track_name"],
        track_info["artist_name"],
        track_info["album_name"],
        track_info["album_image"],
        track_info["rating"],
        track_info["audio_url"],
        genre
    ))
    conn.commit()

def process_artists(artist_list, genre_name, start_index):
    token = get_token()
    conn = get_db_connection()
    cursor = conn.cursor(buffered=True)
    print(f"[{genre_name}] Started processing...")

    try:
        for i, artist_name in enumerate(artist_list):
            full_index = start_index + i
            artist_data = search_for_artist(token, artist_name)
            if not artist_data:
                print(f"[{genre_name}] No artist found: {artist_name}")
                continue

            print(f"[{genre_name}] Artist found: {artist_data['name']}")
            albums = get_artist_albums(token, artist_data["id"])

            for album in albums:
                print(f"[{genre_name}] Album: {album['name']}")
                tracks = get_album_tracks(token, album["id"])

                for track in tracks:
                    time.sleep(0.5)
                    audio_url = get_audio_url(track["track_name"], track["artist_name"]) or "https://example.com/placeholder-audio.mp3"
                    track["audio_url"] = audio_url
                    track["genre"] = genre_name

                    if not track_exists(cursor, track["track_name"], track["artist_name"]):
                        try:
                            save_track_to_db(cursor, conn, track)
                            print(f"[{genre_name}] Saved: {track['track_name']}, {track['artist_name']}")
                        except mysql.connector.Error as err:
                            print(f"Database error: {err}")
                            continue
                    else:
                        print(f"[{genre_name}] Duplicate skipped: {track['track_name']}")

    except Exception as e:
        print(f"[{genre_name}] Error occurred: {e}")
    finally:
        cursor.close()
        conn.close()
        print(f"[{genre_name}] Done.")

# Define your genre/artist groups
genres_artists = {
    "K-Pop": [
        #"TWICE", "EXO", "Red Velvet", 
        # "SEVENTEEN", "NCT", "Stray Kids",
        # "ITZY", "ATEEZ", 
        # "ENHYPEN", "TXT", "LE SSERAFIM", "IVE", "NewJeans", "GOT7",
        # "MAMAMOO",
        "BIGBANG", "SHINee"
        ], 
     "K-pop":[#"Super Junior", "IU",   "Jessi", 
        # "Chungha", "KARD", "ASTRO", 
        # "MONSTA X", "PENTAGON", 
        # "LOONA", "GFRIEND", "Aespa", "Dreamcatcher", "2NE1", "Seori", "Somi",
        "Katseye", "Kang Daniel"
    ],
    # "K-R&B / Hip-Hop": [
    #     "Crush", "Zion.T", "DEAN", "Heize", "Loco", "pH-1", "Sik-K",
    #     "Giriboy", "BewhY", "Gray", "Simon Dominic", "DPR LIVE", "BIBI", "Hoody", "Jvcki Wai",
    #     "Changmo", "Swings", "The Quiett", "Beenzino", "Zico", "Yoon Mirae", "Dynamic Duo",
    #     "Jessi", "Lee Hi", "Primary", "ELO", "Punchnello", "Coogie", "Kid Milli", "Hash Swan",
    #     "Leellamarz", "Woo", "Gaeko", "Kang Daniel", "Jung Seung Hwan", "Suran", "Jung Jinwoo", "Samuel Seo"
    # ],
    # "Pop": [
    #     "Ariana Grande", "Dua Lipa", "Billie Eilish", "Ed Sheeran", "Justin Bieber", "Katy Perry", "Lady Gaga",
    #     "Shawn Mendes", "Selena Gomez", "Rihanna", "Bruno Mars", "The Weeknd", "Olivia Rodrigo", "Doja Cat", "Sam Smith",
    #     "Harry Styles", "Miley Cyrus", "Lizzo", "Charlie Puth", "Camila Cabello", "Ellie Goulding", "Halsey", "Bebe Rexha",
    #     "Ava Max", "Zayn Malik", "Troye Sivan", "Sia", "Meghan Trainor", "Tate McRae", "Anne-Marie", "Demi Lovato",
    #     "Carly Rae Jepsen", "Maroon 5", "OneRepublic", "P!nk", "Niall Horan", "Jason Derulo", "Khalid", "Tori Kelly"
    # ],
    # "Rock / Alternative / Indie": [
    #     "Arctic Monkeys", "The Strokes", "Radiohead", "Nirvana", "Foo Fighters", "Muse", "Red Hot Chili Peppers", "Green Day",
    #     "The Killers", "Paramore", "Linkin Park", "The 1975", "Tame Impala", "Imagine Dragons", "Florence + The Machine", "Kings of Leon",
    #     "The Smashing Pumpkins", "Pearl Jam", "The Cure", "Blur", "Oasis", "Beck", "Modest Mouse", "The White Stripes",
    #     "Vampire Weekend", "Alt-J", "The Black Keys", "Arcade Fire", "Panic! At The Disco", "Fall Out Boy", "The National", "Interpol",
    #     "Yeah Yeah Yeahs", "The Shins", "MGMT", "The Lumineers", "Of Monsters and Men", "Franz Ferdinand", "The Kooks", "Two Door Cinema Club"
    # ],
    # "EDM / Electronic": [
    #     "Calvin Harris", "David Guetta", "Martin Garrix", "Zedd", "Marshmello", "Kygo", "Avicii", "Skrillex",
    #     "Tiesto", "Diplo", "Steve Aoki", "Alesso", "Deadmau5", "Porter Robinson", "Madeon", "Flume",
    #     "Hardwell", "Armin van Buuren", "Alan Walker", "The Chainsmokers", "Major Lazer", "Illenium", "KSHMR", "Don Diablo",
    #     "Galantis", "Seven Lions", "Paul van Dyk", "Paul Oakenfold", "Above & Beyond", "Bassnectar", "Eric Prydz", "Felix Jaehn",
    #     "Robin Schulz", "Dillon Francis", "Oliver Heldens", "R3HAB", "Kygo", "Benny Benassi", "Laidback Luke", "Yellow Claw"
    # ],
    # "Indie / Dream Pop / Chill": [
    #     "Lana Del Rey", "Beach House", "Cigarettes After Sex", "Alvvays", "Clairo", "Men I Trust", "Japanese Breakfast", "Mac DeMarco",
    #     "Joji", "The 1975", "LANY", "Tame Impala", "Vampire Weekend", "Alt-J", "Phoebe Bridgers", "Lucy Dacus",
    #     "Angel Olsen", "Mitski", "Bon Iver", "Fleet Foxes", "The Shins", "Real Estate", "Sufjan Stevens", "MGMT",
    #     "The xx", "Washed Out", "Wild Nothing", "Warpaint", "Still Corners", "Slowdive", "Purity Ring", "The Radio Dept.",
    #     "Grizzly Bear", "The Paper Kites", "The Tallest Man on Earth", "Father John Misty", "James Blake", "The National", "Iron & Wine", "The Antlers"
    # ]
}


def test_database_connection():
    """Test the database connection before starting"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"Successfully connected to MySQL version: {version[0]}")
        cursor.close()
        conn.close()
        return True
    except mysql.connector.Error as err:
        print(f"Database connection failed: {err}")
        return False

if __name__ == "__main__":
    # Test database connection first
    if not test_database_connection():
        print("Database connection test failed. Please check your MySQL connection settings.")
        exit(1)

    # Launch threads per genre
    print("Launching threads...")
    start_index = 0
    with ThreadPoolExecutor(max_workers=3) as executor:
        for genre, artist_list in genres_artists.items():
            executor.submit(process_artists, artist_list, genre, start_index)
            start_index += len(artist_list)

    print("All threads launched.")

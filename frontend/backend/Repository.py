import mysql.connector
import os
from dotenv import load_dotenv
import urllib.parse
import datetime
from flask import Flask, request, jsonify
from functools import wraps
import jwt as pyjwt
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import ssl
import bcrypt
import secrets

app = Flask(__name__)

# Load environment variables
print("Loading environment variables...")
load_dotenv()

# Database Configuration using public URL
print("\nReading database configuration...")
MYSQL_PUBLIC_URL = os.getenv('MYSQL_PUBLIC_URL')

if not MYSQL_PUBLIC_URL:
    raise ValueError("MYSQL_PUBLIC_URL environment variable is not set")

# Parse the URL
parsed = urllib.parse.urlparse(MYSQL_PUBLIC_URL)
print("\nParsed connection details:")
print(f"Host: {parsed.hostname}")
print(f"Port: {parsed.port}")
print(f"User: {parsed.username}")
print(f"Database: {parsed.path[1:]}")  # Remove leading /

# Initialize database connection
print("\nAttempting to connect to MySQL...")
try:
    conn = mysql.connector.connect(
        host=parsed.hostname,
        port=parsed.port,
        user=parsed.username,
        password=parsed.password,
        database=parsed.path[1:] if parsed.path else 'railway',
        autocommit=True,
        connection_timeout=30
    )
    cursor = conn.cursor(dictionary=True)
    print(f"\nSuccessfully connected to MySQL database at {parsed.hostname}:{parsed.port}")
except mysql.connector.Error as e:
    print(f"\nMySQL Error: {e}")
    raise
except Exception as e:
    print(f"\nGeneral Error: {e}")
    raise

# Email Configuration
GMAIL_USER = os.getenv('GMAIL_USER', 'your-email@gmail.com')
GMAIL_APP_PASSWORD = os.getenv('GMAIL_APP_PASSWORD', 'your-app-password')

# Setup HTTPS if enabled
use_https = os.getenv('USE_HTTPS', 'false').lower() == 'true'
CERT_FILE = os.getenv('SSL_CERT', './certs/certificate.crt')
KEY_FILE = os.getenv('SSL_KEY', './certs/private.key')

# Set your secret key for JWT from environment variable
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'admin-secret-key-change-this-in-production')

def generate_admin_token(admin_id, email):
    expiration = datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # Token expires in 24 hours
    token = pyjwt.encode({
        'admin_id': admin_id,
        'email': email,
        'exp': expiration.timestamp()  # Convert to Unix timestamp
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return token

def admin_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401

        try:
            if token.startswith('Bearer '):
                token = token.split('Bearer ')[1]
            data = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_admin = data
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except pyjwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token!'}), 401

        return f(*args, **kwargs)
    return decorated# Start the monitoring thread

def get_db_connection():
    """Get database connection to Railway MySQL database using the public URL"""
    try:
        MYSQL_PUBLIC_URL = os.getenv('MYSQL_PUBLIC_URL')
        if not MYSQL_PUBLIC_URL:
            raise ValueError("MYSQL_PUBLIC_URL environment variable is not set")
            
        # Parse the URL
        parsed = urllib.parse.urlparse(MYSQL_PUBLIC_URL)
        
        connection = mysql.connector.connect(
            host=parsed.hostname,
            port=parsed.port,
            user=parsed.username,
            password=parsed.password,
            database=parsed.path[1:] if parsed.path else 'railway',
            autocommit=True,
            connection_timeout=30
        )
        print(f"Successfully created new database connection to {parsed.hostname}:{parsed.port}")
        return connection
    except mysql.connector.Error as e:
        print(f"MySQL Error: {e}")
        print(f"Connection URL: {MYSQL_PUBLIC_URL}")
        raise
    except Exception as e:
        print(f"General Error: {e}")
        raise

@app.before_request
def log_request_info():
    print(f"Incoming request: {request.method} {request.path}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Request content type: {request.content_type}")
    if request.is_json:
        try:
            print(f"Request JSON data: {request.json}")
        except Exception as e:
            print(f"Error parsing JSON: {str(e)}")
    else:
        print(f"Request body: {request.get_data(as_text=True)[:200]}")

# ------------------------------- USER ENDPOINTS -------------------------------

@app.route('/getUserByEmail', methods=['POST'])
def get_user_by_email():
    email = request.json.get('email')
    print(f"Looking up user with email: {email}")
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)  # Use dictionary cursor for direct JSON conversion
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        result = cursor.fetchone()
        if result:
            print("Found user:", result)
            return jsonify(result)
        print(f"No user found for email: {email}")
        return jsonify({})
    except Exception as e:
        print(f"Database error in get_user_by_email: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def generate_verification_token():
    # Generate a random 6-digit verification code
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email, verification_code):
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = "Music Library - Email Verification"
        msg['From'] = GMAIL_USER  # Use the actual Gmail address
        msg['To'] = to_email
        
        # Create the plain-text and HTML version of your message
        text = f"""
        Welcome to Music Library!
        
        Your verification code is: {verification_code}
        
        This code will expire in 10 minutes.
        If you didn't request this code, please ignore this email.
        """
        
        html = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2c3e50; text-align: center;">Welcome to Music Library!</h2>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <p style="font-size: 16px;">Your verification code is:</p>
                        <h1 style="text-align: center; color: #3498db; font-size: 32px; letter-spacing: 5px;">{verification_code}</h1>
                        <p style="color: #7f8c8d; font-size: 14px;">This code will expire in 10 minutes.</p>
                    </div>
                    <p style="color: #95a5a6; font-size: 12px; text-align: center;">If you didn't request this code, please ignore this email.</p>
                </div>
            </body>
        </html>
        """

        # Add the text and HTML parts to the MIMEMultipart message
        part1 = MIMEText(text, 'plain')
        part2 = MIMEText(html, 'html')
        msg.attach(part1)
        msg.attach(part2)

        try:
            # Create SMTP session for sending the mail
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()  # Enable TLS
            
            # Print debug info
            print(f"Attempting to login with GMAIL_USER: {GMAIL_USER}")
            
            # Login to the server
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            
            # Send email
            server.send_message(msg)
            
            # Close the connection
            server.quit()
            
            print(f"Verification email sent successfully to {to_email}")
            return True
            
        except Exception as smtp_error:
            print(f"SMTP Error: {smtp_error}")
            print(f"Gmail User: {GMAIL_USER}")
            print("Please check your Gmail credentials and make sure you're using an App Password")
            return False
            
    except Exception as e:
        print(f"General Error sending email: {e}")
        # For development/testing purposes, print the code
        print(f"Development mode: Verification code is: {verification_code}")
        return False


@app.route('/registerUser', methods=['POST'])
def register_user():
    data = request.json
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')
    # Generate verification token (6-digit code)
    verification_token = ''.join(random.choices(string.digits, k=6))
    # Set token expiration to 10 minutes from now
    token_expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
    
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if email already exists
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if user:
            return jsonify({"error": "Email already exists"}), 400

        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert the new user with correct column names
        cursor.execute("""
            INSERT INTO users (email, username, password, two_factor_token, two_factor_expires, email_verified)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (email, username, hashed_password, verification_token, token_expires, False))
        conn.commit()

        # Send verification email
        send_verification_email(email, verification_token)
        
        return jsonify({"message": "User registered successfully. Please check your email for verification."}), 201
    except Exception as e:
        print(f"Database error in register_user: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/verify-email', methods=['POST'])
def verify_email():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    
    if not email or not code:
        return jsonify({'error': 'Email and verification code are required'}), 400
    
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT two_factor_token, two_factor_expires
            FROM users
            WHERE email = %s AND email_verified = 0
        """, (email,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({'error': 'Invalid email or already verified'}), 400
            
        stored_code = row['two_factor_token']
        expiration = row['two_factor_expires']
        
        if not stored_code or not expiration:
            return jsonify({'error': 'No verification code found or code has expired'}), 400
            
        # Compare current time with expiration time
        if datetime.datetime.utcnow() > expiration:
            return jsonify({'error': 'Verification code has expired'}), 400
            
        if code != stored_code:
            return jsonify({'error': 'Invalid verification code'}), 400
            
        # Mark email as verified and clear verification code
        cursor.execute("""
            UPDATE users
            SET email_verified = 1,
                two_factor_token = NULL,
                two_factor_expires = NULL
            WHERE email = %s
        """, (email,))
        conn.commit()
        
        return jsonify({'message': 'Email verified successfully'}), 200
        
    except Exception as e:
        print(f"Error verifying email: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/updateUserProfile', methods=['POST'])
def update_user_profile():
    conn = None
    cursor = None
    try:
        data = request.json

        # Debugging: Log the incoming data
        print("Received data for update_user_profile:", data)

        # Validate input data
        required_fields = ['password', 'favoriteGenre', 'favoriteArtist', 'bio', 'avatar', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 400

        # Get database connection
        conn = get_db_connection()
        cursor = conn.cursor()

        # Update user profile without modifying the username
        cursor.execute("""
            UPDATE users SET password = %s, favorite_genre = %s, favorite_artist = %s, bio = %s, avatar = %s
            WHERE email = %s""",
            (data['password'], data['favoriteGenre'],
            data['favoriteArtist'], data['bio'], data['avatar'], data['email'])
        )
        conn.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        print("Error updating user profile:", e)
        return jsonify({"error": "Failed to update profile"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# ------------------------------- SONGS ENDPOINTS -------------------------------

#pagination
#improve performance by using indexes on the columns used in the WHERE clause and JOIN conditions
#fetch all songs that u want
@app.route('/getAllSongs', methods=['GET'])
def get_all_songs():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:        
        cursor.execute("""
            SELECT track_id, track_name, artist_name, album_name, album_image, genres, rating
            FROM songs USE INDEX (idx_track_name)
            ORDER BY track_name
        """)
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        songs = [dict(zip(columns, row)) for row in rows]

        return jsonify(songs), 200
    except Exception as e:
        print("Error fetching songs:", e)
        return jsonify({"error": "Failed to fetch songs"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/searchSongs/<query>', methods=['GET'])
def search_songs(query):
    if not query or query.strip() == '':
        return jsonify([]), 200  # Return empty array for empty queries
    
    search_term = query.strip()
    if len(search_term) < 2:
        return jsonify({"error": "Search query must be at least 2 characters long"}), 400
        
    print(f"Searching for songs with query: {query}")
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        search_term = search_term.lower()  # Case-insensitive search
        search_pattern = f"%{search_term}%"
        cursor.execute("""
            SELECT track_id, track_name, artist_name, album_name, album_image, genres
            FROM songs USE INDEX (idx_track_name)
            WHERE LOWER(track_name) LIKE %s 
                OR LOWER(artist_name) LIKE %s 
                OR LOWER(album_name) LIKE %s
            ORDER BY 
                CASE 
                    WHEN LOWER(track_name) = %s THEN 1
                    WHEN LOWER(artist_name) = %s THEN 2
                    ELSE 6
                END,
                track_name
            LIMIT 50
        """, (search_pattern, search_pattern, search_pattern, search_term, search_term))
    
        rows = cursor.fetchall()
        if not rows:
            return jsonify([]), 200
            
        songs = rows  # dictionary cursor already converts to dict

        print(f"Found {len(songs)} matching songs")
        return jsonify(songs), 200
    except Exception as e:
        print("Error searching songs:", e)
        return jsonify({"error": "Failed to search songs"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/addReview', methods=['POST'])
def add_review():
    conn = None
    cursor = None
    try:
        # Log the request to help with debugging
        print(f"Received review request at: {request.path}")
        
        # Ensure the request has JSON data
        if not request.is_json:
            print("ERROR: Request Content-Type is not application/json")
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        data = request.json
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({"error": "No data provided"}), 400
            
        print(f"Received review data: {data}")
        
        # Validate required fields
        email = data.get('userId')  # userId here is actually the email
        if not email:
            print("ERROR: No email provided in userId field")
            return jsonify({"error": "Email is required"}), 400
            
        track_id = data.get('trackId')
        if not track_id:
            print("ERROR: No track ID provided")
            return jsonify({"error": "Track ID is required"}), 400
            
        rating = data.get('rating')
        if rating is None:
            print("ERROR: No rating provided")
            return jsonify({"error": "Rating is required"}), 400
            
        if not isinstance(rating, (int, float)) or rating < 1 or rating > 5:
            print("ERROR: Invalid rating value")
            return jsonify({"error": "Rating must be a number between 1 and 5"}), 400
            
        comment = data.get('comment', '')  # Default to empty string if not provided
        print(f"Processing review - Email: {email}, Track ID: {track_id}, Rating: {rating}, Has Comment: {bool(comment)}")

        # Look up user ID by email
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            print(f"ERROR: No user found for email: {email}")
            return jsonify({"error": f"No user found with email: {email}"}), 404

        user_id = user['id']  # Extract the ID from the query result using dictionary cursor
        print("Resolved user_id:", user_id)
        
        # Add or update the rating
        cursor.execute("""
            INSERT INTO ratings (user_id, track_id, rating) 
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating)
        """, (user_id, track_id, rating))
        
        # Add comment if provided
        if comment.strip():
            cursor.execute("""
                INSERT INTO comments (user_id, track_id, comment_text)
                VALUES (%s, %s, %s)
            """, (user_id, track_id, comment))
            
        conn.commit()
        print("Review added successfully")
        return jsonify({"message": "Review added successfully"}), 200
        
    except ValueError as ve:
        print(f"Validation error in review submission: {ve}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(ve)}), 400
        
    except Exception as e:
        print("Error adding review:", e)
        if conn:
            conn.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e) or "Failed to add review", "type": type(e).__name__}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route('/api/addComment', methods=['POST'])
@app.route('/addComment', methods=['POST'])  # Add this alias route to ensure compatibility
def add_comment():
    try:
        # Log the request to help with debugging
        print(f"Received comment request at: {request.path}")
        
        # Ensure the request has JSON data
        if not request.is_json:
            print("ERROR: Request Content-Type is not application/json")
            return jsonify({"error": "Content-Type must be application/json"}), 400
            
        data = request.json
        if not data:
            print("ERROR: No JSON data received")
            return jsonify({"error": "No data provided"}), 400
        
        print(f"Received comment data: {data}")
        
        # Validate required fields
        email = data.get('userId')  # userId is email in this context
        if not email:
            print("ERROR: No email provided in userId field")
            return jsonify({"error": "Email is required"}), 400
            
        track_id = data.get('trackId')
        if not track_id:
            print("ERROR: No track ID provided")
            return jsonify({"error": "Track ID is required"}), 400
            
        comment = data.get('comment')
        if not comment or not comment.strip():
            print("ERROR: Empty comment received")
            return jsonify({"error": "Comment cannot be empty"}), 400

        print(f"Processing comment - Email: {email}, Track ID: {track_id}")

        # Look up user ID by email
        try:
            conn = get_db_connection()
            cursor = conn.cursor()        
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            user = cursor.fetchone()
            if not user:
                print(f"ERROR: No user found for email: {email}")
                return jsonify({"error": f"No user found with email: {email}"}), 404
                    
            user_id = user[0]  # Extract the ID from the query result
            print("Resolved user_id:", user_id)

            cursor.execute("""
                INSERT INTO comments (user_id, track_id, comment_text)
                VALUES (%s, %s, %s)
            """, (user_id, track_id, comment))
            
            conn.commit()
            conn.close()
            print("Comment added successfully")
            return jsonify({"message": "Comment added successfully"}), 200
        except Exception as db_error:
            if conn:
                conn.rollback()
            print(f"Database error: {db_error}")
            return jsonify({"error": "Database error", "details": str(db_error)}), 500
    except ValueError as ve:
        print(f"Validation error in comment submission: {ve}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        print("Error adding comment:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e) or "Failed to add comment", "type": type(e).__name__}), 500

@app.route('/api/getSongDetails/<int:song_id>', methods=['GET'])
def get_song_details(song_id):
    try:
        # Calculate the average rating for the song
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get average rating
        cursor.execute("""
            SELECT COALESCE(AVG(rating), 0) AS average_rating
            FROM ratings
            WHERE track_id = %s
        """, (song_id,))
        rating_result = cursor.fetchone()
        average_rating = rating_result['average_rating']

        # Fetch the last 10 comments for the song with user info
        cursor.execute("""
            SELECT 
                u.username,
                c.comment_text,
                c.created_at,
                COALESCE(r.rating, 0) as user_rating
            FROM comments c
            JOIN users u ON c.user_id = u.id
            LEFT JOIN ratings r ON c.user_id = r.user_id 
                AND c.track_id = r.track_id
            WHERE c.track_id = %s
            ORDER BY c.created_at DESC
            LIMIT 10
        """, (song_id,))
        comments = cursor.fetchall()

        # Get basic song info
        cursor.execute("""
            SELECT s.*, COUNT(DISTINCT r.user_id) as rating_count
            FROM songs s
            LEFT JOIN ratings r ON s.track_id = r.track_id
            WHERE s.track_id = %s
            GROUP BY s.track_id
        """, (song_id,))
        song = cursor.fetchone()
        
        if not song:
            return jsonify({"error": "Song not found"}), 404

        # Combine all data
        response_data = {
            **song,
            "average_rating": float(average_rating),
            "comments": comments
        }

        return jsonify(response_data), 200
    except Exception as e:
        print("Error fetching song details:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch song details"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

# Endpoint for getting song by ID - used by the song list
@app.route('/getSongById/<int:track_id>', methods=['GET'])
def get_song_by_id(track_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT track_id, track_name, artist_name, album_name, album_image, rating, audio_url
            FROM songs 
            WHERE track_id = %s
        """, (track_id,))
        song = cursor.fetchone()
        if not song:
            return jsonify({"error": "Song not found"}), 404
        columns = [col[0] for col in cursor.description]
        song_dict = dict(zip(columns, song))
        return jsonify(song_dict), 200
    except Exception as e:
        print("Error getting song by ID:", e)
        return jsonify({"error": "Failed to get song by ID", "details": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/addToLiked', methods=['POST'])
def add_to_liked():
    try:
        data = request.json
        email = data.get('userId')  # userId here is actually the email
        track_id = data.get('trackId')  # Changed from TrackId to match frontend
        
        print(f"Adding song to liked list - Email: {email}, Track ID: {track_id}")
        
        if not email or not track_id:
            raise ValueError("Email and track_id are required")
            
        # Look up user ID by email
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            raise ValueError("No user found with that email")
        user_id = user[0]  # Extract the ID from the query result
        print("Resolved user_id:", user_id)
        # Insert into liked_songs table
        cursor.execute("""
            INSERT INTO liked_songs (user_id, track_id)
            VALUES (%s, %s)
        """, (user_id, track_id))
        conn.commit()
        return jsonify({"message": "Song added to liked list successfully"}), 200
    except Exception as e:
        print("Error adding to liked list:", e)
        return jsonify({"error": "Failed to add to liked list"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/getLikedSongs', methods=['POST'])
def get_liked_songs():
    try:
        print("Flask: Received request to /api/getLikedSongs")
        # Get email from request JSON
        data = request.json
        email = data.get('email')
        if not email:
            print("No email provided in request")
            return jsonify({"error": "No email provided"}), 400
        print(f"Flask: Processing getLikedSongs for email: {email}")
        # Get user ID first
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        if not user:
            print(f"No user found for email: {email}")
            return jsonify([])
        user_id = user[0]
        print(f"Found user ID: {user_id}")
        # Get liked songs with the user's specific rating
        cursor.execute("""
            SELECT 
                s.track_id,
                s.track_name,
                s.artist_name,
                s.album_name,
                s.album_image,
                s.audio_url,
                COALESCE(r.rating, 0) AS rating
            FROM songs s
            INNER JOIN liked_songs ls ON s.track_id = ls.track_id
            LEFT JOIN ratings r ON s.track_id = r.track_id AND r.user_id = %s
            WHERE ls.user_id = %s
        """, (user_id, user_id))
        # Convert rows to list of dictionaries
        columns = ['track_id', 'track_name', 'artist_name', 'album_name', 'album_image', 'audio_url', 'rating']
        liked_songs = []
        for row in cursor.fetchall():
            song = {}
            for i, col in enumerate(columns):
                song[col] = row[i] if row[i] is not None else ''
            liked_songs.append(song)
        print(f"Found {len(liked_songs)} liked songs for user ID {user_id}")
        return jsonify(liked_songs)
    except Exception as e:
        print(f"Error in get_liked_songs for email {data.get('email', 'N/A')}: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

#-------Admin---------

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        cursor.execute("SELECT id, email, password FROM Admin WHERE email = %s", (email,))
        row = cursor.fetchone()
        
        if not row:
            return jsonify({"error": "Admin not found"}), 404
        
        stored_password = row[2]  # Password is the third column
        if password != stored_password:  # In production, use proper password hashing
            return jsonify({"error": "Invalid password"}), 401
            
        # Generate token
        token = generate_admin_token(row[0], row[1])  # Pass admin_id and email
        
        return jsonify({
            "message": "Login successful",
            "token": token,
            "admin": {
                "id": row[0],
                "email": row[1]
            }
        }), 200
    except Exception as e:
        print("Error fetching admin:", e)
        return jsonify({"error": "Failed to fetch admin"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/mostCommonGenre/<int:rating>', methods=['GET'])
def get_most_common_genre(rating):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Use the idx_genre_rating index to optimize the query
        if rating == 1:  # Low ratings (<= 2)
            cursor.execute("""
                SELECT genres, COUNT(*) as count
                FROM songs USE INDEX (idx_genre_rating)
                WHERE rating <= 2 AND genres IS NOT NULL AND genres != ''
                GROUP BY genres
                ORDER BY count DESC
                LIMIT 1
            """)
        elif rating == 2:  # Medium ratings (= 3)
            cursor.execute("""
                SELECT genres, COUNT(*) as count
                FROM songs USE INDEX (idx_genre_rating)
                WHERE rating = 3 AND genres IS NOT NULL AND genres != ''
                GROUP BY genres
                ORDER BY count DESC
                LIMIT 1
            """)
        elif rating == 3:  # High ratings (>= 4)
            cursor.execute("""
                SELECT genres, COUNT(*) as count
                FROM songs USE INDEX (idx_genre_rating)
                WHERE rating >= 4 AND genres IS NOT NULL AND genres != ''
                GROUP BY genres
                ORDER BY count DESC
                LIMIT 1
            """)
        else:
            return jsonify({"error": "Invalid rating range"}), 400

        row = cursor.fetchone()
        print("Query result for rating", rating, ":", row)  # Log the query result
        conn.close()

        if row:
            return jsonify({"most_common_genre": row[0]}), 200
        else:
            return jsonify({"most_common_genre": "none"}), 200

    except Exception as e:
        print("Error fetching most common genre:", e)
        return jsonify({"error": "Failed to fetch most common genre"}), 500
    
@app.route('/api/getMonitoredUsers', methods=['GET'])
@admin_token_required
def get_monitored_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM monitored_users")
        rows = cursor.fetchall()
        columns = [col[0] for col in cursor.description]
        monitored_users = [dict(zip(columns, row)) for row in rows]

        return jsonify(monitored_users), 200
    except Exception as e:
        print("Error fetching monitored users:", e)
        return jsonify({"error": "Failed to fetch monitored users"}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/songs/delete/<int:song_id>', methods=['DELETE'])
@admin_token_required
def delete_song(song_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # First check if the song exists
        cursor.execute("SELECT track_id FROM songs WHERE track_id = %s", (song_id,))
        if not cursor.fetchone():
            return jsonify({"error": "Song not found"}), 404

        # Delete related records first (maintain referential integrity)
        cursor.execute("DELETE FROM comments WHERE track_id = %s", (song_id,))
        cursor.execute("DELETE FROM ratings WHERE track_id = %s", (song_id,))
        cursor.execute("DELETE FROM liked_songs WHERE track_id = %s", (song_id,))
        
        # Finally delete the song
        cursor.execute("DELETE FROM songs WHERE track_id = %s", (song_id,))
        
        conn.commit()
        return jsonify({"message": "Song deleted successfully"}), 200
    except Exception as e:
        print("Error deleting song:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/spngs/add', methods=['POST'])
@admin_token_required
def add_song():
    try:
        data = request.json
        track_name = data.get('trackName')
        artist_name = data.get('artistName')
        album_name = data.get('albumName')
        album_image = data.get('albumImage')
        rating = data.get('rating')
        genres = data.get('genres')
        audio_url = data.get('audioUrl')

        conn = get_db_connection()
        cursor = conn.cursor()

        # Insert the new song into the database
        cursor.execute("""
            INSERT INTO songs (track_name, artist_name, album_name, album_image, rating, genres, audio_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (track_name, artist_name, album_name, album_image, rating, genres, audio_url))

        conn.commit()
        return jsonify({"message": "Song added successfully"}), 200

    except Exception as e:
        print("Error adding song:", e)
        return jsonify({"error": "Failed to add song"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

@app.route('/api/songs/update/<int:song_id>', methods=['PUT'])
@admin_token_required
def update_song(song_id):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'artist', 'album', 'genre', 'year']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Update song details using MySQL syntax with %s placeholders
        cursor.execute("""
            UPDATE songs
            SET track_name = %s,
                artist_name = %s,
                album_name = %s,
                genres = %s,
                release_year = %s
            WHERE track_id = %s
        """, (data['title'], data['artist'], data['album'], data['genre'], data['year'], song_id))

        if cursor.rowcount == 0:
            return jsonify({"error": "Song not found"}), 404

        conn.commit()
        return jsonify({"message": "Song updated successfully"}), 200

    except Exception as e:
        print("Error updating song:", e)
        return jsonify({"error": str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


# Admin verify token endpoint
@app.route('/api/admin/verify', methods=['GET'])
def verify_admin_token():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Token is missing!'}), 401

    try:
        if token.startswith('Bearer '):
            token = token.split('Bearer ')[1]
        data = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'message': 'Valid token', 'admin': data}), 200
    except pyjwt.ExpiredSignatureError:
        return jsonify({'error': 'Token has expired!'}), 401
    except pyjwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token!'}), 401


@app.route('/api/user/getLikedSongs', methods=['POST'])
def get_user_liked_songs():
    try:
        data = request.json
        if not data or 'email' not in data:
            print("No email provided in request")
            return jsonify([])

        email = data['email']
        print(f"Fetching liked songs for email: {email}")
        
        # Get user ID first
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"No user found for email: {email}")
            conn.close()
            return jsonify([])

        user_id = user[0]
        print(f"Found user ID: {user_id}")        # Get liked songs with the user's specific rating
        cursor.execute("""
            SELECT 
                s.track_id,
                s.track_name,
                s.artist_name,
                s.album_name,
                s.album_image,
                s.audio_url,
                COALESCE(r.rating, 0) AS rating
            FROM songs s
            INNER JOIN liked_songs ls ON s.track_id = ls.track_id
            LEFT JOIN ratings r ON s.track_id = r.track_id AND r.user_id = %s
            WHERE ls.user_id = %s
        """, (user_id, user_id))

        # Convert rows to list of dictionaries
        columns = ['track_id', 'track_name', 'artist_name', 'album_name', 'album_image', 'audio_url', 'rating']
        liked_songs = []

        for row in cursor.fetchall():
            song = {}
            for i, col in enumerate(columns):
                song[col] = row[i] if row[i] is not None else ''
            liked_songs.append(song)

        print(f"Found {len(liked_songs)} liked songs for user ID {user_id}")
        conn.close()
        return jsonify(liked_songs)

    except Exception as e:
        print(f"Error in get_user_liked_songs for email {data.get('email', 'N/A')}: {str(e)}")
        if 'conn' in locals():
            conn.close()
        return jsonify({"error": "Internal server error"}), 500

def verify_email(email):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("SELECT email FROM users WHERE email = %s", (email,))
        result = cursor.fetchone()
        
        return result is not None
    except Exception as e:
        print(f"Error verifying email: {e}")
        return False
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    try:
        # Default to port 5000 for local development
        port = int(os.environ.get("PORT", 5000))
        
        # Run in development mode on localhost
        app.run(host='localhost', port=port, debug=True)
    except Exception as e:
        print(f"Error starting Flask application: {e}")

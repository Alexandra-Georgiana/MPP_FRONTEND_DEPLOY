import mysql.connector
import os
from dotenv import load_dotenv
import urllib.parse

# Load environment variables with debug info
print("Loading environment variables...")
load_dotenv()

# Database Configuration
print("\nReading database configuration...")
MYSQL_PUBLIC_URL = os.getenv('MYSQL_PUBLIC_URL')

if not MYSQL_PUBLIC_URL:
    raise ValueError("MYSQL_PUBLIC_URL environment variable is not set")

print(f"\nUsing connection URL: {MYSQL_PUBLIC_URL}")

# Parse the URL
parsed = urllib.parse.urlparse(MYSQL_PUBLIC_URL)
print("\nParsed connection details:")
print(f"Host: {parsed.hostname}")
print(f"Port: {parsed.port}")
print(f"User: {parsed.username}")
print(f"Database: {parsed.path[1:]}")  # Remove leading /

# Print connection details for debugging
print("\nMySQL Connection Details:")
print(f"Host: {MYSQL_HOST}")
print(f"Port: {MYSQL_PORT}")
print(f"User: {MYSQL_USER}")
print(f"Password: {'*' * len(str(MYSQL_PASSWORD)) if MYSQL_PASSWORD else 'Not set'}")
print(f"Database: {MYSQL_DATABASE}")

# Initialize database connection
print("\nAttempting to connect to MySQL...")
try:
    if not MYSQL_PASSWORD:
        raise ValueError("MYSQL_ROOT_PASSWORD environment variable is not set")
        
    conn = mysql.connector.connect(
        host=str(MYSQL_HOST),
        port=int(MYSQL_PORT),
        user=str(MYSQL_USER),
        password=str(MYSQL_PASSWORD),
        database=str(MYSQL_DATABASE),
        autocommit=True,
        connection_timeout=30
    )
    cursor = conn.cursor(dictionary=True)
    print(f"\nSuccessfully connected to MySQL database at {MYSQL_HOST}:{MYSQL_PORT}")
    print("Server info:", conn.get_server_info())
    
except mysql.connector.Error as e:
    print(f"\nMySQL Error: {e}")
    raise
except Exception as e:
    print(f"\nGeneral Error: {e}")
    raise

print("\nScript completed.")

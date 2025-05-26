import mysql.connector
import os
from dotenv import load_dotenv
import urllib.parse

# Load environment variables with debug info
print("Loading environment variables...")
load_dotenv()

# Database Configuration using public URL
print("\nReading database configuration...")
MYSQL_PUBLIC_URL = os.getenv('MYSQL_PUBLIC_URL')

if not MYSQL_PUBLIC_URL:
    raise ValueError("MYSQL_PUBLIC_URL environment variable is not set")

try:
    # Parse the URL
    parsed = urllib.parse.urlparse(MYSQL_PUBLIC_URL)
    
    # Print connection details (excluding password)
    print("\nParsed connection details:")
    print(f"Host: {parsed.hostname}")
    print(f"Port: {parsed.port}")
    print(f"User: {parsed.username}")
    print(f"Database: {parsed.path[1:]}")  # Remove leading /
    
    # Initialize database connection
    print("\nAttempting to connect to MySQL...")
    
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
    print("Server info:", conn.get_server_info())
    
    # Test the connection with a simple query
    cursor.execute("SELECT 1 as test")
    result = cursor.fetchone()
    print("\nTest query result:", result)
    
except mysql.connector.Error as e:
    print(f"\nMySQL Error: {e}")
    raise
except Exception as e:
    print(f"\nGeneral Error: {e}")
    raise
finally:
    if 'conn' in locals():
        conn.close()

print("\nScript completed.")

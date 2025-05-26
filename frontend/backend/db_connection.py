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

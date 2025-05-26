import threading
import time
import pyodbc

def monitor_comments(conn):
    while True:
        try:
            print("Monitoring comments for bad words...")
            cursor = conn.cursor()

            # Query to find users with more than 3 bad word comments in less than 10 minutes
            query = """
            INSERT INTO monitored_users (user_id, reason, timestamp)
            SELECT DISTINCT c.user_id, 'Used bad words in multiple comments', GETDATE()
            FROM comments c
            WHERE c.comment_text LIKE '%badword1%' OR c.comment_text LIKE '%badword2%' OR c.comment_text LIKE '%badword3%'
              AND c.created_at >= DATEADD(MINUTE, -10, GETDATE())
            GROUP BY c.user_id
            HAVING COUNT(*) > 3
              AND NOT EXISTS (
                SELECT 1 FROM monitored_users m WHERE m.user_id = c.user_id
              );
            """

            cursor.execute(query)
            conn.commit()

            # Get users to print
            cursor.execute("SELECT user_id FROM monitored_users")
            rows = cursor.fetchall()
            for row in rows:
                print(f"User {row[0]} has been monitored for bad words.")

            cursor.close()
        except Exception as e:
            print(f"Error monitoring comments: {e}")
        time.sleep(600)  # Run every 10 minutes


# Establish database connection
conn = pyodbc.connect('DRIVER={ODBC Driver 17 for SQL Server};SERVER=USER\\MSSQLSERVER03;DATABASE=MusicLibrary;Trusted_Connection=yes;')

# Start the monitoring thread
thread = threading.Thread(target=monitor_comments, args=(conn,), daemon=True)
thread.start()
import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import Error

load_dotenv()

def get_table_order():
    """Returns tables in order of their dependencies"""
    return [
        # Base tables - already transferred
        #'users',        # Base table - no dependencies
        #'songs',        # Base table - no dependencies
        #'admin',        # Base table - no dependencies
        'comments',     # Depends on users and songs
        'liked_songs',  # Depends on users and songs
        'ratings',      # Depends on users and songs
        'monitored_users',  # Depends on users
        'user_remember_tokens'  # Depends on users
    ]

def import_to_railway():
    print("\n=== Starting Database Transfer Debug ===")
    print("\nEnvironment Variables:")
    print(f"MYSQLHOST: {os.getenv('MYSQLHOST')}")
    print(f"MYSQLUSER: {os.getenv('MYSQLUSER')}")
    print(f"MYSQLDATABASE: {os.getenv('MYSQLDATABASE')}")
    print(f"MYSQLPORT: {os.getenv('MYSQLPORT')}")

    try:
        # Connect to local database
        print("\n1. Connecting to local database...")
        local_conn = mysql.connector.connect(
            host="localhost",
            user="root",
            password="N15feb05.",
            database="MusicLibrary"
        )
        print("✓ Local connection successful!")
        local_cursor = local_conn.cursor()

        # Connect to Railway database
        print("\n2. Connecting to Railway database...")
        railway_conn = mysql.connector.connect(
            host=os.getenv('MYSQLHOST'),
            user=os.getenv('MYSQLUSER'),
            password=os.getenv('MYSQLPASSWORD'),
            database=os.getenv('MYSQLDATABASE'),
            port=int(os.getenv('MYSQLPORT'))
        )
        print("✓ Railway connection successful!")
        railway_cursor = railway_conn.cursor()

        # Transfer tables and data in correct order
        print("\n3. Transferring tables and data:")
        for table_name in get_table_order():
            print(f"\nProcessing {table_name}...")
            
            # Get table creation SQL
            local_cursor.execute(f"SHOW CREATE TABLE {table_name}")
            create_table_sql = local_cursor.fetchone()[1]
            
            # Create table in Railway
            try:
                railway_cursor.execute(create_table_sql)
                railway_conn.commit()
                print(f"✓ Created table structure for {table_name}")
            except Error as e:
                print(f"! Error creating table: {e}")
                continue

            # Get and transfer data
            local_cursor.execute(f"SELECT * FROM {table_name}")
            rows = local_cursor.fetchall()
            
            if rows:
                # Get column count for insert statement
                local_cursor.execute(f"SHOW COLUMNS FROM {table_name}")
                column_count = len(local_cursor.fetchall())
                
                # Prepare insert statement
                placeholders = ', '.join(['%s'] * column_count)
                insert_query = f"INSERT INTO {table_name} VALUES ({placeholders})"
                
                # Insert data
                try:
                    railway_cursor.executemany(insert_query, rows)
                    railway_conn.commit()
                    print(f"✓ Transferred {len(rows)} records to {table_name}")
                except Error as e:
                    print(f"! Error transferring data: {e}")
            else:
                print(f"- No data to transfer for {table_name}")

        # Verify transfer
        print("\n4. Verifying transfer:")
        railway_cursor.execute("SHOW TABLES")
        railway_tables = railway_cursor.fetchall()
        for table in railway_tables:
            table_name = table[0]
            railway_cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = railway_cursor.fetchone()[0]
            print(f"- {table_name}: {count} records")

    except Error as e:
        print(f"\n❌ Error occurred: {e}")
    finally:
        if 'local_conn' in locals() and local_conn.is_connected():
            local_cursor.close()
            local_conn.close()
            print("\n✓ Local connection closed")
        if 'railway_conn' in locals() and railway_conn.is_connected():
            railway_cursor.close()
            railway_conn.close()
            print("✓ Railway connection closed")
        print("\n=== Transfer Complete ===")

if __name__ == "__main__":
    import_to_railway()
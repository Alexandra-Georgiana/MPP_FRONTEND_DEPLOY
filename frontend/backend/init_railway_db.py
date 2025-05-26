#!/usr/bin/env python

import os
import time
import subprocess
import sys

def wait_for_db():
    """Wait for the database to become available"""
    # Check if we're on Railway
    is_railway = os.environ.get('RAILWAY_ENVIRONMENT') is not None
    
    # Always use SQL Server for this project
    return wait_for_sqlserver()

def wait_for_postgres():
    """Wait for PostgreSQL to be ready"""
    print("Waiting for PostgreSQL to be ready...")
    max_retries = 30
    retry_count = 0
    
    # Get the database URL from the environment
    db_url = os.environ.get('DATABASE_URL')
    
    if not db_url:
        print("No DATABASE_URL environment variable found. Cannot connect to PostgreSQL.")
        return False
    
    # Try to install psycopg2 if not already installed
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2
    
    while retry_count < max_retries:
        try:
            # Parse the DATABASE_URL to get connection parameters
            import re
            match = re.match(r'postgres://(.*):(.*)@(.*):(\d+)/(.*)', db_url)
            if match:
                user, password, host, port, dbname = match.groups()
                conn = psycopg2.connect(
                    dbname=dbname,
                    user=user,
                    password=password,
                    host=host,
                    port=port
                )
                conn.close()
                print("PostgreSQL is ready!")
                return True
            else:
                print(f"Could not parse DATABASE_URL: {db_url}")
                return False
        except Exception as e:
            retry_count += 1
            print(f"PostgreSQL not ready yet. Retrying in 5 seconds... (Attempt {retry_count} of {max_retries})")
            print(f"Error: {e}")
            time.sleep(5)
    
    print("Failed to connect to PostgreSQL.")
    return False

def wait_for_sqlserver():
    """Wait for SQL Server to become available"""
    print("Waiting for SQL Server to be ready...")
    max_retries = 30
    retry_count = 0
    
    # Try to install pyodbc if not already installed
    try:
        import pyodbc
    except ImportError:
        print("Installing pyodbc...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyodbc"])
        import pyodbc
    
    # Get SQL Server connection parameters from environment or use defaults
    server = os.environ.get('SQLSERVER_HOST', 'sqlserver')
    user = os.environ.get('SQLSERVER_USER', 'sa')
    password = os.environ.get('SQLSERVER_PASSWORD', 'StrongPassword123!')
    
    while retry_count < max_retries:
        try:
            conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server={server};Database=master;UID={user};PWD={password}"
            print(f"Trying to connect to SQL Server at {server}...")
            conn = pyodbc.connect(conn_str)
            conn.close()
            print("SQL Server is ready!")
            return True
        except Exception as e:
            retry_count += 1
            print(f"SQL Server not ready yet. Retrying in 5 seconds... (Attempt {retry_count} of {max_retries})")
            time.sleep(5)
    
    print("Failed to connect to SQL Server after multiple attempts.")
    return False

def init_database():
    """Initialize the database with schema and data"""
    
    # Import pyodbc here to ensure it's available
    import pyodbc
    
    # Get SQL Server connection parameters from environment or use defaults
    server = os.environ.get('SQLSERVER_HOST', 'sqlserver')
    user = os.environ.get('SQLSERVER_USER', 'sa')
    password = os.environ.get('SQLSERVER_PASSWORD', 'StrongPassword123!')
    
    # Create database
    try:
        conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server={server};Database=master;UID={user};PWD={password}"
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print("Creating MusicLibrary database...")
        cursor.execute("IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'MusicLibrary') CREATE DATABASE MusicLibrary")
        conn.commit()
        conn.close()
          # Apply schema from init.sql
        print("Applying database schema...")
        with open("init.sql", "r") as sql_file:
            sql_script = sql_file.read()
            
        conn_str = f"Driver={{ODBC Driver 17 for SQL Server}};Server={server};Database=MusicLibrary;UID={user};PWD={password}"
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Split and execute SQL commands
        for command in sql_script.split(';'):
            if command.strip():
                cursor.execute(command)
        conn.commit()
        
        # Apply stored procedures
        print("Applying stored procedures...")
        with open("data/ProceduresMusicLib.sql", "r") as proc_file:
            proc_script = proc_file.read()
            
        for command in proc_script.split('GO'):
            if command.strip():
                cursor.execute(command)
        conn.commit()
        conn.close()
        
        # Populate sample data
        print("Populating sample data...")
        import populate_songs  # Import and run the populate script
        
        print("Database initialization completed successfully!")
        return True
    except Exception as e:
        print(f"Database initialization failed: {str(e)}")
        return False

if __name__ == "__main__":
    if wait_for_db():
        init_database()

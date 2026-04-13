import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "marsh.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def query(sql: str, params: tuple = ()):
    with get_connection() as conn:
        cursor = conn.execute(sql, params)
        return cursor.fetchall()

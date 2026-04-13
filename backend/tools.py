from database import query

TIME_WINDOW_SQL = {
    "last_week":     "-7 days",
    "last_month":    "-1 month",
    "last_3_months": "-3 months",
    "last_6_months": "-6 months",
    "last_year":     "-1 year",
}

def getCurrentReadings(location: str = "center") -> dict:
    """Gets the latest temperature, pH, and CO2 readings for a marsh location.

    Args:
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.

    Returns:
        A dict with the most recent value for each sensor type: temperature (°C), ph, co2 (ppm).
    """
    rows = query(
        """
        SELECT sensor_type, value
        FROM measurements
        WHERE location = ?
          AND (sensor_type, timestamp) IN (
              SELECT sensor_type, MAX(timestamp)
              FROM measurements
              WHERE location = ?
              GROUP BY sensor_type
          )
        """,
        (location, location)
    )
    return {row["sensor_type"]: row["value"] for row in rows}


def getExtremeReading(sensor_type: str, extreme: str, location: str = "center", time_window: str = "last_month") -> dict:
    """Gets the highest or lowest recorded value for a sensor along with the timestamp it occurred.

    Args:
        sensor_type: The measurement to query. One of 'temperature', 'ph', 'co2'.
        extreme: Whether to find the highest or lowest reading. One of 'max', 'min'.
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.
        time_window: Time period to search within. One of 'last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year'. Defaults to 'last_month'.

    Returns:
        A dict with 'value' and 'timestamp' of the extreme reading.
    """
    window = TIME_WINDOW_SQL.get(time_window, "-1 month")
    order = "DESC" if extreme == "max" else "ASC"
    rows = query(
        f"""
        SELECT value, timestamp
        FROM measurements
        WHERE sensor_type = ? AND location = ? AND timestamp >= datetime('now', ?)
        ORDER BY value {order}
        LIMIT 1
        """,
        (sensor_type, location, window)
    )
    if not rows:
        return None
    return {
        "value": rows[0]["value"],
        "timestamp": rows[0]["timestamp"],
    }


def getHistoricalStats(sensor_type: str, location: str = "center", time_window: str = "last_month") -> dict:
    """Gets min, max, and average for a sensor over a time period at a marsh location.

    Args:
        sensor_type: The measurement to query. One of 'temperature', 'ph', 'co2'.
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.
        time_window: Time period to analyse. One of 'last_week', 'last_month', 'last_3_months', 'last_6_months', 'last_year'. Defaults to 'last_month'.

    Returns:
        A dict with 'min', 'max', and 'avg' for the requested sensor and period.
    """
    window = TIME_WINDOW_SQL.get(time_window, "-1 month")
    rows = query(
        """
        SELECT MIN(value) as min, MAX(value) as max, AVG(value) as avg
        FROM measurements
        WHERE sensor_type = ? AND location = ? AND timestamp >= datetime('now', ?)
        """,
        (sensor_type, location, window)
    )
    if not rows or rows[0]["avg"] is None:
        return None
    return {
        "min": round(rows[0]["min"], 2),
        "max": round(rows[0]["max"], 2),
        "avg": round(rows[0]["avg"], 2),
    }

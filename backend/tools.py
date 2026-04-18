from datetime import datetime, timedelta, timezone
from database import query

VALID_LOCATIONS = {"north", "center", "south"}
VALID_SENSORS   = {"temperature", "ph", "co2"}

# replaces None with default values for start and end dates. start datre defaults to 30 day ago, end date defaults to today.
def _defaults(start, end):
    now = datetime.now(timezone.utc)
    end   = end   or now.strftime("%Y-%m-%d")
    start = start or (now - timedelta(days=30)).strftime("%Y-%m-%d")
    return start, end


def getCurrentReadings(location: str = "center") -> dict:
    """Gets the latest temperature, pH, and CO2 readings for a marsh location.

    Args:
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.

    Returns:
        A dict with the most recent value for each sensor type: temperature (°C), ph, co2 (ppm).
    """
    print(f"[Tool] getCurrentReadings(location={location})")
    if location not in VALID_LOCATIONS:
        return None
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


def getExtremeReading(sensor_type: str, extreme: str, location: str = "center",
                      start: str = None, end: str = None) -> dict:
    """Gets the highest or lowest recorded value for a sensor along with the timestamp it occurred.

    Args:
        sensor_type: The measurement to query. One of 'temperature', 'ph', 'co2'.
        extreme: Whether to find the highest or lowest reading. One of 'max', 'min'.
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.
        start: Start date (ISO 8601, e.g. '2024-06-01'). Defaults to 30 days ago.
        end: End date (ISO 8601, e.g. '2024-09-01'). Defaults to today.

    Returns:
        A dict with 'value' and 'timestamp' of the extreme reading.
    """
    print(f"[Tool] getExtremeReading(sensor_type={sensor_type}, extreme={extreme}, location={location}, start={start}, end={end})")
    if location not in VALID_LOCATIONS or sensor_type not in VALID_SENSORS:
        return None
    # replace None with default values for start and end.
    start, end = _defaults(start, end)
    order = "DESC" if extreme == "max" else "ASC"
    rows = query(
        f"""
        SELECT value, timestamp
        FROM measurements
        WHERE sensor_type = ? AND location = ? AND timestamp BETWEEN ? AND ?
        ORDER BY value {order}
        LIMIT 1
        """,
        (sensor_type, location, start, end)
    )
    if not rows:
        return None
    return {
        "value":     rows[0]["value"],
        "timestamp": rows[0]["timestamp"],
    }

def getHistoricalStats(sensor_type: str, location: str = "center", start: str = None, end: str = None) -> dict:
    """Gets min, max, and average for a sensor over a time period at a marsh location.

    Args:
        sensor_type: The measurement to query. One of 'temperature', 'ph', 'co2'.
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.
        start: Start date (e.g. '2024-06-01'). Defaults to 30 days ago.
        end: End date (e.g. '2024-09-01'). Defaults to today.

    Returns:
        A dict with 'min', 'max', and 'avg' for the requested sensor and period.
    """
    print(f"[Tool] getHistoricalStats(sensor_type={sensor_type}, location={location}, start={start}, end={end})")
    if location not in VALID_LOCATIONS or sensor_type not in VALID_SENSORS:
        return None
    start, end = _defaults(start, end)
    rows = query(
        """
        SELECT MIN(value) as min, MAX(value) as max, AVG(value) as avg
        FROM measurements
        WHERE sensor_type = ? AND location = ? AND timestamp BETWEEN ? AND ?
        """,
        (sensor_type, location, start, end)
    )
    if not rows or rows[0]["avg"] is None:
        return None
    
    print(f"Stats for {sensor_type} at {location} from {start} to {end}: min={rows[0]['min']}, max={rows[0]['max']}, avg={rows[0]['avg']}")

    return {
        "min": round(rows[0]["min"], 2),
        "max": round(rows[0]["max"], 2),
        "avg": round(rows[0]["avg"], 2),
    }

def getTrend(sensor_type: str, location: str = "center",
             start: str = None, end: str = None) -> dict:
    """Calculates the trend for a sensor over a time period using least squares. 
    May be biased due to seasonality and other factors. For example, a trend over one year or two 
    year maybe strongly influenced by seasonal patterns in the data. 
    A trend over a month maybe interesting to see seasonal patterns. Over mutiple years,
    there may be a long term trend noticable.
    
    Args:
        sensor_type: The measurement to analyse. One of 'temperature', 'ph', 'co2'.
        location: The marsh zone to query. One of 'north', 'center', 'south'. Defaults to 'center'.
        start: Start date (e.g. '2024-06-01'). Defaults to 30 days ago.
        end: End date (e.g. '2024-09-01'). Defaults to today.

    Returns:
        A dict with:
          - 'trend_total':   total change in value over the time period of the regression line
          - 'direction':      'rising', 'falling', or 'stable'
    """
    print(f"[Tool] getTrend(sensor_type={sensor_type}, location={location}, start={start}, end={end})")
    if location not in VALID_LOCATIONS or sensor_type not in VALID_SENSORS:
        return None
    start, end = _defaults(start, end)
    rows = query(
        """
        SELECT strftime('%s', timestamp) AS ts_epoch, value
        FROM measurements
        WHERE sensor_type = ? AND location = ? AND timestamp BETWEEN ? AND ?
        ORDER BY timestamp ASC
        """,
        (sensor_type, location, start, end)
    )
    if len(rows) < 2:
        return None

    xs = [float(r["ts_epoch"]) for r in rows]
    x0 = xs[0]
    xs = [x - x0 for x in xs] # normalize to avoid too large numbers as epoch timestamps are in seconds 
    ys = [r["value"] for r in rows]
    n = len(xs)

    x_mean = sum(xs) / n
    y_mean = sum(ys) / n
    num   = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys))
    denom = sum((x - x_mean) ** 2 for x in xs)

    slope = num / denom if denom != 0 else 0.0
    timeframe = max(xs) - min(xs) 
    trend_total = slope * timeframe

    #slope_per_day    = slope_per_second * 86_400
    #slope_per_month  = slope_per_day * 30
    #slope_per_year   = slope_per_day * 365



    if abs(slope * 86_400 *30) < 0.01:
        direction = "stable"
    elif slope > 0:
        direction = "rising"
    else:
        direction = "falling"

    return {
        "trend_total" : trend_total,
        "direction": direction
    }
    # return {
    #     "slope_per_day":   round(slope_per_day,   6),
    #     "slope_per_month": round(slope_per_month,  4),
    #     "slope_per_year":  round(slope_per_year,   4),
    #     "direction":       direction,
    #     "data_points":     n,
    # }



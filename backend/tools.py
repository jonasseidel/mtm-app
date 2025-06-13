from enum import Enum

class TimeWindow(Enum):
    LAST_WEEK = "last_week"
    LAST_MONTH = "last_month"
    LAST_3_MONTHS = "last_3_months"
    LAST_6_MONTHS = "last_6_months"
    LAST_YEAR = "last_year"
    LAST_3_YEARS = "last_3_years"
    LAST_6_YEARS = "last_6_years"

def getCurrentTemperature() -> float:
    """Gets the current water temperature.

    Args:
        None

    Returns:
        Gives current water temp.
    """
    print("Temperatur lookup")
    return 22.5  # Example temperature in Celsius

def getCurrentPh() -> float:
    """Gets the current ph.

    Args:
        None

    Returns:
        Gives current ph.
    """
    print("Ph lookup")
    return 7.2  # Example pH value


def getCurrenttCo2Emission() -> float:
    """Gets the current co2 emisiion.

    Args:
        None

    Returns:
        Gives current co2 emmision in ppm.
    """
    print("CO2 lookup")
    return 400.0  # Example CO2 emissions in ppm

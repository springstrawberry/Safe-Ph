#!/usr/bin/env python3
"""
Python script to fetch earthquake data from PHIVOLCS using pylindol
and output as JSON for Next.js API consumption.
"""

import sys
import json
import pandas as pd
from datetime import datetime

# Try to import dateutil, fallback to basic parsing if not available
try:
    from dateutil import parser as date_parser
    HAS_DATEUTIL = True
except ImportError:
    HAS_DATEUTIL = False

from pylindol import PhivolcsEarthquakeInfoScraper

def parse_datetime(date_str, time_str=None):
    """
    Parse date and time strings into ISO 8601 format.
    
    Args:
        date_str: Date string (e.g., "2025-01-15" or "15/01/2025")
        time_str: Optional time string (e.g., "14:30:00" or "14:30")
    
    Returns:
        ISO 8601 formatted datetime string or None if invalid
    """
    try:
        # Try to parse the date string
        if time_str:
            datetime_str = f"{date_str} {time_str}"
        else:
            datetime_str = date_str
        
        # Try parsing with dateutil (handles various formats)
        if HAS_DATEUTIL:
            try:
                dt = date_parser.parse(datetime_str)
                return dt.isoformat()
            except:
                pass
        
        # Fallback: try common formats
        formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y %H:%M",
            "%d/%m/%Y",
            "%m/%d/%Y %H:%M:%S",
            "%m/%d/%Y %H:%M",
            "%m/%d/%Y",
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(datetime_str, fmt)
                return dt.isoformat()
            except:
                continue
        
        return None
    except Exception as e:
        return None

def fetch_earthquakes(years_back=1, target_month=None, target_year=None):
    """
    Fetch earthquake data for the past N years from PHIVOLCS.
    
    Args:
        years_back: Number of years to fetch data for (default: 1 for faster loading)
        target_month: Optional specific month to fetch (1-12)
        target_year: Optional specific year to fetch
    
    Returns:
        List of earthquake dictionaries
    """
    all_quakes = []
    current_date = datetime.now()
    
    # If specific month/year requested, fetch only that
    if target_month and target_year:
        years_to_process = [(target_year, [target_month])]
        total_months = 1
    else:
        # Calculate total months for progress tracking
        total_months = 0
        years_to_process = []
        for year_offset in range(years_back):
            year = current_date.year - year_offset
            max_month = current_date.month if year_offset == 0 else 12
            months = list(range(1, max_month + 1))
            years_to_process.append((year, months))
            total_months += len(months)
    
    print(f"Will fetch {total_months} month(s) of data...", file=sys.stderr)
    months_fetched = 0
    
    # Fetch data for each month
    for year, months_list in years_to_process:
        for month in months_list:
            months_fetched += 1
            print(f"Fetching {year}-{month:02d} ({months_fetched}/{total_months})...", file=sys.stderr)
            
            try:
                # Create a scraper instance for this month/year
                scraper = PhivolcsEarthquakeInfoScraper()
                
                # Fetch data for this month/year
                # pylindol's run() method signature: run(month=None, year=None)
                # If month/year are provided, it should fetch that specific month
                df = None
                try:
                    # Try with month/year parameters first
                    # Check if pylindol supports keyword arguments
                    import inspect
                    sig = inspect.signature(scraper.run)
                    params = list(sig.parameters.keys())
                    print(f"  🔍 run() method parameters: {params}", file=sys.stderr)
                    
                    # Try calling with month/year
                    if 'month' in params and 'year' in params:
                        df = scraper.run(month=month, year=year)
                        if df is not None:
                            print(f"  📥 Fetched data using month/year params for {year}-{month:02d}: {len(df) if not df.empty else 0} rows", file=sys.stderr)
                        else:
                            print(f"  ⚠️  run(month={month}, year={year}) returned None", file=sys.stderr)
                    elif len(params) >= 2:
                        # Try positional arguments
                        df = scraper.run(month, year)
                        if df is not None:
                            print(f"  📥 Fetched data using positional args for {year}-{month:02d}: {len(df) if not df.empty else 0} rows", file=sys.stderr)
                        else:
                            print(f"  ⚠️  run({month}, {year}) returned None", file=sys.stderr)
                    else:
                        # No parameters supported, raise error to go to fallback
                        raise TypeError("run() doesn't accept month/year parameters")
                except (TypeError, AttributeError) as e:
                    # If run() doesn't accept parameters, try using CLI as fallback
                    print(f"  ⚠️  run(month, year) failed: {str(e)}", file=sys.stderr)
                    print(f"  🔄 Trying pylindol CLI as fallback...", file=sys.stderr)
                    
                    try:
                        import subprocess
                        import tempfile
                        import os
                        
                        # Create temp directory for output
                        with tempfile.TemporaryDirectory() as tmpdir:
                            output_file = os.path.join(tmpdir, f"earthquakes_{year}_{month}.csv")
                            
                            # Call pylindol CLI
                            cmd = ["pylindol", "--month", str(month), "--year", str(year), "--output-path", tmpdir]
                            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                            
                            if result.returncode == 0:
                                # Try to find the output file
                                csv_files = [f for f in os.listdir(tmpdir) if f.endswith('.csv')]
                                if csv_files:
                                    csv_path = os.path.join(tmpdir, csv_files[0])
                                    df = pd.read_csv(csv_path)
                                    print(f"  ✅ Fetched data using CLI for {year}-{month:02d}: {len(df)} rows", file=sys.stderr)
                                else:
                                    print(f"  ⚠️  CLI ran but no CSV file found", file=sys.stderr)
                                    df = None
                            else:
                                print(f"  ⚠️  CLI failed: {result.stderr}", file=sys.stderr)
                                df = None
                    except FileNotFoundError:
                        print(f"  ⚠️  pylindol CLI not found in PATH", file=sys.stderr)
                        df = None
                    except Exception as cli_err:
                        print(f"  ⚠️  CLI fallback failed: {str(cli_err)}", file=sys.stderr)
                        df = None
                except Exception as e:
                    # Other errors - log and continue
                    print(f"  ❌ Error fetching {year}-{month:02d}: {str(e)}", file=sys.stderr)
                    df = None
                
                if df is not None and not df.empty:
                    # Print column names for debugging (always print for first fetch)
                    if months_fetched == 1:
                        print(f"📋 DataFrame columns: {list(df.columns)}", file=sys.stderr)
                        print(f"📋 DataFrame shape: {df.shape}", file=sys.stderr)
                        # Print first row as sample
                        if len(df) > 0:
                            print(f"📋 Sample row: {df.iloc[0].to_dict()}", file=sys.stderr)
                    
                    month_quakes = []
                    # Convert DataFrame to list of dictionaries
                    for _, row in df.iterrows():
                        quake = {
                            "datetime": None,
                            "lat": None,
                            "lon": None,
                            "location": None,
                            "magnitude": None,
                            "depth": None,
                            "source": "https://www.phivolcs.dost.gov.ph/"
                        }
                        
                        # Map DataFrame columns to our format
                        # Try to find columns by common names
                        for col in df.columns:
                            col_lower = str(col).lower().strip()
                            col_value = row[col]
                            
                            # Skip NaN values
                            if pd.isna(col_value):
                                continue
                            
                            # Date/Time handling
                            if 'date' in col_lower and quake["datetime"] is None:
                                date_str = str(col_value).strip()
                                # Try to find time column
                                time_col = None
                                for tc in df.columns:
                                    if 'time' in str(tc).lower() and 'date' not in str(tc).lower():
                                        time_col = tc
                                        break
                                
                                time_str = None
                                if time_col and not pd.isna(row[time_col]):
                                    time_str = str(row[time_col]).strip()
                                
                                # Parse and format as ISO 8601
                                parsed_dt = parse_datetime(date_str, time_str)
                                if parsed_dt:
                                    quake["datetime"] = parsed_dt
                                else:
                                    # Fallback: try to create ISO format manually
                                    try:
                                        if time_str:
                                            quake["datetime"] = f"{date_str}T{time_str}"
                                        else:
                                            quake["datetime"] = f"{date_str}T00:00:00"
                                    except:
                                        pass
                            
                            # Latitude
                            if 'lat' in col_lower and 'lon' not in col_lower:
                                try:
                                    quake["lat"] = float(col_value)
                                except (ValueError, TypeError):
                                    pass
                            
                            # Longitude
                            if ('lon' in col_lower or 'long' in col_lower) and 'lat' not in col_lower:
                                try:
                                    quake["lon"] = float(col_value)
                                except (ValueError, TypeError):
                                    pass
                            
                            # Depth
                            if 'depth' in col_lower:
                                try:
                                    quake["depth"] = float(col_value)
                                except (ValueError, TypeError):
                                    pass
                            
                            # Magnitude
                            if 'magnitude' in col_lower or 'mag' in col_lower:
                                try:
                                    quake["magnitude"] = float(col_value)
                                except (ValueError, TypeError):
                                    pass
                            
                            # Location
                            if 'location' in col_lower or 'place' in col_lower or 'area' in col_lower:
                                quake["location"] = str(col_value).strip() if not pd.isna(col_value) else "Unknown location"
                        
                        # Only add if we have essential data and valid datetime
                        if (quake["datetime"] and 
                            quake["lat"] is not None and 
                            quake["lon"] is not None):
                            # Validate datetime can be parsed
                            try:
                                # Try multiple datetime parsing methods
                                test_date = None
                                try:
                                    test_date = datetime.fromisoformat(quake["datetime"].replace('Z', '+00:00'))
                                except:
                                    try:
                                        test_date = datetime.strptime(quake["datetime"], "%Y-%m-%dT%H:%M:%S")
                                    except:
                                        try:
                                            test_date = datetime.strptime(quake["datetime"], "%Y-%m-%d %H:%M:%S")
                                        except:
                                            # Last resort: try parsing with dateutil if available
                                            if HAS_DATEUTIL:
                                                test_date = date_parser.parse(quake["datetime"])
                                
                                if test_date and not pd.isna(pd.Timestamp(test_date)):
                                    # Additional validation: check if date matches the month/year we're processing
                                    # This ensures we only include earthquakes from the requested month/year
                                    quake_month = test_date.month
                                    quake_year = test_date.year
                                    
                                    if quake_month == month and quake_year == year:
                                        month_quakes.append(quake)
                                    else:
                                        # Log mismatches for debugging (only first few)
                                        if months_fetched == 1 and len(month_quakes) < 3:
                                            print(f"  ⚠️  Date mismatch: quake date {quake_year}-{quake_month:02d} != requested {year}-{month:02d}", file=sys.stderr)
                                    # else: skip this quake as it's not in the requested month/year
                            except Exception as date_err:
                                # Skip invalid datetime
                                if months_fetched == 1 and len(month_quakes) < 5:
                                    print(f"  ⚠️  Skipped invalid datetime '{quake['datetime']}': {date_err}", file=sys.stderr)
                                pass
                    
                    all_quakes.extend(month_quakes)
                    print(f"  ✅ {year}-{month:02d}: Found {len(month_quakes)} earthquakes", file=sys.stderr)
                else:
                    print(f"  ⚠️  {year}-{month:02d}: No data available", file=sys.stderr)
                
            except Exception as e:
                # Continue to next month if this one fails
                print(f"  ❌ Error fetching {year}-{month:02d}: {str(e)}", file=sys.stderr)
                continue
    
    return all_quakes

def main():
    """Main entry point for the script."""
    try:
        # Parse command line arguments
        years_back = int(sys.argv[1]) if len(sys.argv) > 1 else 1
        target_month = int(sys.argv[2]) if len(sys.argv) > 2 else None
        target_year = int(sys.argv[3]) if len(sys.argv) > 3 else None
        
        if target_month and target_year:
            print(f"Fetching earthquake data for {target_year}-{target_month:02d}...", file=sys.stderr)
        else:
            print(f"Fetching earthquake data for the past {years_back} year(s)...", file=sys.stderr)
        
        quakes = fetch_earthquakes(years_back, target_month, target_year)
        
        # Sort by datetime (most recent first)
        quakes.sort(key=lambda x: x.get("datetime", ""), reverse=True)
        
        # Output as JSON
        print(json.dumps({"quakes": quakes}, indent=2))
        
    except Exception as e:
        error_response = {
            "quakes": [],
            "error": str(e)
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()


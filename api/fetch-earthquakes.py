from http.server import BaseHTTPRequestHandler
import json
import sys
import pandas as pd
from datetime import datetime

# Try to import dateutil, fallback to basic parsing if not available
try:
    from dateutil import parser as date_parser
    HAS_DATEUTIL = True
except ImportError:
    HAS_DATEUTIL = False

try:
    from pylindol import PhivolcsEarthquakeInfoScraper
    HAS_PYLINDOL = True
except ImportError:
    HAS_PYLINDOL = False

def parse_datetime(date_str, time_str=None):
    """Parse date and time strings into ISO 8601 format."""
    try:
        if time_str:
            datetime_str = f"{date_str} {time_str}"
        else:
            datetime_str = date_str
        
        if HAS_DATEUTIL:
            try:
                dt = date_parser.parse(datetime_str)
                return dt.isoformat()
            except:
                pass
        
        formats = [
            "%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d",
            "%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y",
            "%m/%d/%Y %H:%M:%S", "%m/%d/%Y %H:%M", "%m/%d/%Y",
        ]
        
        for fmt in formats:
            try:
                dt = datetime.strptime(datetime_str, fmt)
                return dt.isoformat()
            except:
                continue
        
        return None
    except:
        return None

def fetch_earthquakes(years_back=1, target_month=None, target_year=None):
    """Fetch earthquake data from PHIVOLCS."""
    if not HAS_PYLINDOL:
        return []
    
    all_quakes = []
    current_date = datetime.now()
    
    if target_month and target_year:
        years_to_process = [(target_year, [target_month])]
    else:
        years_to_process = []
        for year_offset in range(years_back):
            year = current_date.year - year_offset
            max_month = current_date.month if year_offset == 0 else 12
            months = list(range(1, max_month + 1))
            years_to_process.append((year, months))
    
    for year, months_list in years_to_process:
        for month in months_list:
            try:
                scraper = PhivolcsEarthquakeInfoScraper()
                
                # Try to fetch data
                df = None
                try:
                    import inspect
                    sig = inspect.signature(scraper.run)
                    params = list(sig.parameters.keys())
                    
                    if 'month' in params and 'year' in params:
                        df = scraper.run(month=month, year=year)
                    elif len(params) >= 2:
                        df = scraper.run(month, year)
                except:
                    pass
                
                if df is not None and not df.empty:
                    month_quakes = []
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
                        
                        for col in df.columns:
                            col_lower = str(col).lower().strip()
                            col_value = row[col]
                            
                            if pd.isna(col_value):
                                continue
                            
                            if 'date' in col_lower and quake["datetime"] is None:
                                date_str = str(col_value).strip()
                                time_col = None
                                for tc in df.columns:
                                    if 'time' in str(tc).lower() and 'date' not in str(tc).lower():
                                        time_col = tc
                                        break
                                
                                time_str = None
                                if time_col and not pd.isna(row[time_col]):
                                    time_str = str(row[time_col]).strip()
                                
                                parsed_dt = parse_datetime(date_str, time_str)
                                if parsed_dt:
                                    quake["datetime"] = parsed_dt
                            
                            if 'lat' in col_lower and 'lon' not in col_lower:
                                try:
                                    quake["lat"] = float(col_value)
                                except:
                                    pass
                            
                            if ('lon' in col_lower or 'long' in col_lower) and 'lat' not in col_lower:
                                try:
                                    quake["lon"] = float(col_value)
                                except:
                                    pass
                            
                            if 'depth' in col_lower:
                                try:
                                    quake["depth"] = float(col_value)
                                except:
                                    pass
                            
                            if 'magnitude' in col_lower or 'mag' in col_lower:
                                try:
                                    quake["magnitude"] = float(col_value)
                                except:
                                    pass
                            
                            if 'location' in col_lower or 'place' in col_lower or 'area' in col_lower:
                                quake["location"] = str(col_value).strip() if not pd.isna(col_value) else "Unknown location"
                        
                        if (quake["datetime"] and quake["lat"] is not None and quake["lon"] is not None):
                            try:
                                test_date = datetime.fromisoformat(quake["datetime"].replace('Z', '+00:00'))
                                quake_month = test_date.month
                                quake_year = test_date.year
                                
                                if quake_month == month and quake_year == year:
                                    month_quakes.append(quake)
                            except:
                                pass
                    
                    all_quakes.extend(month_quakes)
            except Exception as e:
                continue
    
    return all_quakes

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            from urllib.parse import urlparse, parse_qs
            parsed_url = urlparse(self.path)
            params = parse_qs(parsed_url.query)
            
            years_back = int(params.get('years', ['1'])[0])
            target_month = int(params.get('month', [None])[0]) if params.get('month') else None
            target_year = int(params.get('year', [None])[0]) if params.get('year') else None
            
            quakes = fetch_earthquakes(years_back, target_month, target_year)
            quakes.sort(key=lambda x: x.get("datetime", ""), reverse=True)
            
            response = {"quakes": quakes}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            error_response = {"quakes": [], "error": str(e)}
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())


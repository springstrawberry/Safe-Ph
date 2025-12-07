"use client";

import { useEffect, useState } from "react";
import { Marker, CircleMarker, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";

type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};

// Get color based on earthquake magnitude (Richter scale)
const getMagnitudeColor = (magnitude?: number): string => {
  if (!magnitude) return "#9ca3af"; // Gray for unknown
  if (magnitude >= 7.0) return "#7f1d1d"; // Very dark red - Major
  if (magnitude >= 6.0) return "#991b1b"; // Dark red - Strong
  if (magnitude >= 5.0) return "#dc2626"; // Red - Moderate
  if (magnitude >= 4.0) return "#f97316"; // Orange - Light
  if (magnitude >= 3.0) return "#eab308"; // Yellow - Minor
  if (magnitude >= 2.0) return "#84cc16"; // Light green - Very minor
  return "#22c55e"; // Green - Micro
};

// Get intensity label
const getMagnitudeLabel = (magnitude?: number): string => {
  if (!magnitude) return "Unknown";
  if (magnitude >= 7.0) return "Major";
  if (magnitude >= 6.0) return "Strong";
  if (magnitude >= 5.0) return "Moderate";
  if (magnitude >= 4.0) return "Light";
  if (magnitude >= 3.0) return "Minor";
  if (magnitude >= 2.0) return "Very Minor";
  return "Micro";
};

// Create custom marker icon with dynamic color - small and simple
const createCustomIcon = (magnitude?: number) => {
  const color = getMagnitudeColor(magnitude);
  return L.divIcon({
    className: 'custom-earthquake-marker',
    html: `<div style="
      background-color: ${color};
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1.5px solid white;
      box-shadow: 0 0 4px ${color};
      position: relative;
      transform: translate(-4px, -4px);
    "></div>`,
    iconSize: [8, 8],
    iconAnchor: [4, 4],
  });
};

interface EarthquakeMarkersProps {
  onMonthYearChange?: (month: number, year: number, count: number) => void;
  onEarthquakeSelect?: (quake: Quake) => void;
  onQuakesLoaded?: (quakes: Quake[]) => void;
  onLoadingChange?: (loading: boolean) => void;
  selectedDate: Date;
}

export default function EarthquakeMarkers({ onMonthYearChange, onEarthquakeSelect, onQuakesLoaded, onLoadingChange, selectedDate }: EarthquakeMarkersProps) {
  const [allQuakes, setAllQuakes] = useState<Quake[]>([]);
  const [quakes, setQuakes] = useState<Quake[]>([]);
  const [loading, setLoading] = useState(true);
  const map = useMap();

  // Load earthquakes when selected date changes (fetch by month/year for speed)
  useEffect(() => {
    async function load() {
      setLoading(true);
      if (onLoadingChange) onLoadingChange(true);
      try {
        const selectedMonth = selectedDate.getMonth() + 1; // JavaScript months are 0-indexed
        const selectedYear = selectedDate.getFullYear();
        
        // Fetch only the selected month/year for faster loading
        const res = await fetch(`/api/earthquakes?month=${selectedMonth}&year=${selectedYear}`);
        const data = await res.json();
        console.log(`📍 Earthquake data loaded for ${selectedYear}-${selectedMonth.toString().padStart(2, '0')}:`, data.quakes?.length || 0, "earthquakes");
        
        const allData = data.quakes ?? [];
        setAllQuakes(allData);
        
      } catch (err) {
        console.error("❌ Failed to load quakes:", err);
      } finally {
        setLoading(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    }
    load();
  }, [selectedDate, map, onLoadingChange]);

  // Use allQuakes directly since we're already fetching by month/year
  useEffect(() => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    
    // Filter to ensure we only show earthquakes from selected month/year
    // (in case of any date mismatches)
    const filtered = allQuakes.filter((q) => {
      try {
        const date = new Date(q.datetime);
        if (isNaN(date.getTime())) return false;
        return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
      } catch {
        return false;
      }
    });
    
    setQuakes(filtered);
    console.log(`📅 Showing ${selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}: ${filtered.length} earthquakes`);
    
    // Notify parent component
    if (onMonthYearChange) {
      onMonthYearChange(selectedMonth, selectedYear, filtered.length);
    }
    
    // Fit map to filtered earthquakes
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(
        filtered.map((q: Quake) => [q.lat, q.lon])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
    
    // Notify parent that quakes are loaded
    if (onQuakesLoaded) {
      onQuakesLoaded(filtered);
    }
  }, [selectedDate, allQuakes, map, onMonthYearChange, onQuakesLoaded]);

  console.log("🗺️ Rendering markers for", quakes.length, "earthquakes");
  console.log("📊 Total earthquakes:", allQuakes.length);
  console.log("⏳ Loading state:", loading);

  return (
    <>

      {/* Render small circles first (behind markers) */}
      {!loading && quakes.map((q, i) => {
        const pos: LatLngExpression = [q.lat, q.lon];
        // Smaller, consistent circles - just showing the affected area
        const radius = q.magnitude 
          ? Math.max(4, Math.min(q.magnitude * 2, 15))  // 4-15 pixels - much smaller
          : 6; // Default 6px radius
        
        const color = getMagnitudeColor(q.magnitude);

        return (
          <CircleMarker 
            key={`circle-${i}`} 
            center={pos} 
            radius={radius} 
            pathOptions={{ 
              color: color, 
              fillColor: color,
              fillOpacity: 0.25,
              weight: 1,
              opacity: 0.6
            }} 
          />
        );
      })}

      {/* Render markers on top */}
      {!loading && quakes.map((q, i) => {
        const pos: LatLngExpression = [q.lat, q.lon];
        const customIcon = createCustomIcon(q.magnitude);
        return (
          <Marker 
            key={`marker-${i}`} 
            position={pos} 
            icon={customIcon}
            eventHandlers={{
              click: () => {
                if (onEarthquakeSelect) {
                  onEarthquakeSelect(q);
                }
              },
            }}
          />
        );
      })}
    </>
  );
}

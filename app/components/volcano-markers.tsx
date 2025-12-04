"use client";

import { useEffect, useState } from "react";
import { Marker, CircleMarker, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";

type Volcano = {
  id: string;
  title: string;
  description?: string | null;
  link: string;
  lat: number;
  lon: number;
  date: string;
  closed?: string | null;
  categories: Array<{
    id: string;
    title: string;
  }>;
  sources: Array<{
    id: string;
    url: string;
  }>;
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
};

// Create custom volcano icon - orange/red mountain shape
const createVolcanoIcon = () => {
  return L.divIcon({
    className: 'custom-volcano-marker',
    html: `<div style="
      position: relative;
      transform: translate(-8px, -8px);
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 22H22L12 2Z" fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
        <circle cx="12" cy="8" r="2" fill="#f97316"/>
      </svg>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

interface VolcanoMarkersProps {
  onVolcanoSelect?: (volcano: Volcano) => void;
  onVolcanoesLoaded?: (volcanoes: Volcano[]) => void;
  onYearChange?: (year: number, count: number) => void;
  selectedYear: number;
}

export default function VolcanoMarkers({ onVolcanoSelect, onVolcanoesLoaded, onYearChange, selectedYear }: VolcanoMarkersProps) {
  const [allVolcanoes, setAllVolcanoes] = useState<Volcano[]>([]);
  const [volcanoes, setVolcanoes] = useState<Volcano[]>([]);
  const [loading, setLoading] = useState(true);
  const map = useMap();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/volcanoes");
        const data = await res.json();
        console.log("🌋 Volcano activity data loaded:", data.volcanoes?.length || 0, "total activities");
        
        const volcanoData = data.volcanoes ?? [];
        setAllVolcanoes(volcanoData);
        
      } catch (err) {
        console.error("❌ Failed to load volcanoes:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [map]);

  // Filter volcanoes by selected year
  useEffect(() => {
    const filtered = allVolcanoes.filter((v) => {
      const date = new Date(v.date);
      return date.getFullYear() === selectedYear;
    });
    
    setVolcanoes(filtered);
    console.log(`📅 Showing year ${selectedYear}: ${filtered.length} volcanic activities`);
    
    // Notify parent component
    if (onYearChange) {
      onYearChange(selectedYear, filtered.length);
    }
    
    // Fit map to filtered volcanoes
    if (filtered.length > 0) {
      const bounds = L.latLngBounds(
        filtered.map((v: Volcano) => [v.lat, v.lon])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 });
    }
    
    // Notify parent that volcanoes are loaded
    if (onVolcanoesLoaded) {
      onVolcanoesLoaded(filtered);
    }
  }, [selectedYear, allVolcanoes, map, onYearChange, onVolcanoesLoaded]);

  console.log("🗺️ Rendering markers for", volcanoes.length, "volcanoes");
  console.log("⏳ Loading state:", loading);

  return (
    <>
      {/* Render circles for volcanic activity area */}
      {!loading && volcanoes.map((v, i) => {
        const pos: LatLngExpression = [v.lat, v.lon];
        const radius = 12; // Consistent radius for volcanic activity
        
        return (
          <CircleMarker 
            key={`circle-${i}`} 
            center={pos} 
            radius={radius} 
            pathOptions={{ 
              color: "#dc2626", 
              fillColor: "#f97316",
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.7
            }} 
          />
        );
      })}

      {/* Render volcano markers on top */}
      {!loading && volcanoes.map((v, i) => {
        const pos: LatLngExpression = [v.lat, v.lon];
        const customIcon = createVolcanoIcon();
        return (
          <Marker 
            key={`marker-${i}`} 
            position={pos} 
            icon={customIcon}
            eventHandlers={{
              click: () => {
                if (onVolcanoSelect) {
                  onVolcanoSelect(v);
                }
              },
            }}
          />
        );
      })}
    </>
  );
}


// app/components/Map.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression } from "leaflet";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { EarthquakeListCard } from "./earthquake-list-card";
import { EarthquakeDetailDialog } from "./earthquake-detail-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};



// Fix default marker icons
if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

const EarthquakeMarkersComponent = dynamic(() => import("./earthquake-markers"), { 
  ssr: false,
});

// Wrapper component to pass props
function EarthquakeMarkers({ 
  onMonthYearChange,
  onEarthquakeSelect,
  onQuakesLoaded,
  selectedDate
}: { 
  onMonthYearChange: (month: number, year: number, count: number) => void;
  onEarthquakeSelect: (quake: Quake) => void;
  onQuakesLoaded: (quakes: Quake[]) => void;
  selectedDate: Date;
}) {
  return <EarthquakeMarkersComponent onMonthYearChange={onMonthYearChange} onEarthquakeSelect={onEarthquakeSelect} onQuakesLoaded={onQuakesLoaded} selectedDate={selectedDate} />;
}

const positions: Record<string, LatLngExpression> = {
  "latest-earthquake": [12.8797, 121.7740], // Center Philippines
  "volcano-bulletin": [13.2563, 123.6857], // Mayon Volcano
  "tsunami-bulletin": [12.8797, 121.7740], // Central Philippines
  "landslide": [16.4023, 120.5960], // Baguio
};

const tabTitles: Record<string, string> = {
  "latest-earthquake": "Latest Earthquake Data",
  "volcano-bulletin": "Volcano Bulletin",
  "tsunami-bulletin": "Tsunami Bulletin",
  "landslide": "Landslide Information",
};

interface MapProps {
  tabId: string;
}

const Map = ({ tabId }: MapProps) => {
  const [mounted, setMounted] = useState(false);
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [earthquakeCount, setEarthquakeCount] = useState<number>(0);
  const [selectedEarthquake, setSelectedEarthquake] = useState<Quake | null>(null);
  const [currentMonthQuakes, setCurrentMonthQuakes] = useState<Quake[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [allQuakes, setAllQuakes] = useState<Quake[]>([]);
  const [loading, setLoading] = useState(true);
  
  const position = positions[tabId] || positions["latest-earthquake"];
  const title = tabTitles[tabId] || "Map View";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load all earthquakes for date range calculation
  useEffect(() => {
    if (tabId === "latest-earthquake") {
      fetch("/api/earthquakes")
        .then((res) => res.json())
        .then((data) => {
          const quakes = data.quakes ?? [];
          setAllQuakes(quakes);
          
          // Find the most recent earthquake date and set it as default
          if (quakes.length > 0) {
            const sorted = [...quakes].sort((a: Quake, b: Quake) => 
              new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
            );
            const mostRecent = new Date(sorted[0].datetime);
            setSelectedDate(mostRecent);
          }
          
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load earthquakes:", err);
          setLoading(false);
        });
    }
  }, [tabId]);

  const handleEarthquakeSelect = useCallback((quake: Quake) => {
    setSelectedEarthquake(quake);
    setDialogOpen(true);
  }, []);

  const handleQuakesLoaded = useCallback((quakes: Quake[]) => {
    setCurrentMonthQuakes(quakes);
  }, []);

  const handleMonthYearChange = useCallback((month: number, year: number, count: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
    setEarthquakeCount(count);
  }, []);

  // Get date range from earthquake data
  const minDate = allQuakes.length > 0 
    ? new Date(Math.min(...allQuakes.map(q => new Date(q.datetime).getTime())))
    : new Date(2000, 0, 1);
  const maxDate = new Date();

  if (!mounted) {
    return <div className="h-full w-full flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="relative h-full w-full flex gap-4">
      {/* Map Container */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={position}
          zoom={tabId === "latest-earthquake" ? 6 : 8}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          zoomControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Show earthquake markers with circles */}
          {tabId === "latest-earthquake" && (
            <EarthquakeMarkers 
              onMonthYearChange={handleMonthYearChange}
              onEarthquakeSelect={handleEarthquakeSelect}
              onQuakesLoaded={handleQuakesLoaded}
              selectedDate={selectedDate}
            />
          )}

          {/* Placeholder markers for other tabs */}
          {tabId !== "latest-earthquake" && (
            <Marker position={position}>
              <Popup>
                <div className="font-bold">{title}</div>
                {tabId === "volcano-bulletin" && "Volcano bulletin information will be displayed here."}
                {tabId === "tsunami-bulletin" && "Tsunami bulletin details will appear here."}
                {tabId === "landslide" && "Landslide information will be shown here."}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      
        {/* Month/Year Filter - Overlay on top of map */}
        {tabId === "latest-earthquake" && (
          <div className="absolute top-3 right-3 z-[1000] pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg font-sans pointer-events-auto">
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 min-w-[180px]"
                    disabled={loading}
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">
                      {loading ? "Loading..." : format(selectedDate, "MMMM yyyy")}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 font-sans z-10000" align="end">
                  <div className="p-4">
                    <div className="text-sm font-semibold text-gray-700 mb-3">📅 Select Month & Year</div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onMonthChange={(date) => {
                        setSelectedDate(date);
                        setIsPopoverOpen(false);
                      }}
                      month={selectedDate}
                      disabled={(date) => date > maxDate || date < minDate}
                      captionLayout="dropdown"
                      fromDate={minDate}
                      toDate={maxDate}
                      className="[&_table]:hidden [&_.rdp-weekdays]:hidden"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        
        {/* Intensity Legend - Overlay on top of map */}
        {tabId === "latest-earthquake" && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-white rounded-lg shadow-lg p-3 font-sans pointer-events-auto">
            <div className="text-xs font-bold text-gray-800 mb-2">🌋 Earthquake Intensity</div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#7f1d1d" }}></div>
                <span className="text-xs font-medium">≥7.0 Major</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#991b1b" }}></div>
                <span className="text-xs font-medium">6.0-6.9 Strong</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#dc2626" }}></div>
                <span className="text-xs font-medium">5.0-5.9 Moderate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#f97316" }}></div>
                <span className="text-xs font-medium">4.0-4.9 Light</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#eab308" }}></div>
                <span className="text-xs font-medium">3.0-3.9 Minor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#84cc16" }}></div>
                <span className="text-xs font-medium">2.0-2.9 Very Minor</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "#22c55e" }}></div>
                <span className="text-xs font-medium">&lt;2.0 Micro</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Earthquake List Card */}
      {tabId === "latest-earthquake" && (
        <div className="w-96 h-full">
          <EarthquakeListCard 
            earthquakes={currentMonthQuakes}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onSelectEarthquake={handleEarthquakeSelect}
          />
        </div>
      )}

      {/* Detail Dialog */}
      <EarthquakeDetailDialog 
        earthquake={selectedEarthquake}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default Map;
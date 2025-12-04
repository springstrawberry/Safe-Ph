// app/components/Map.tsx
"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L, { LatLngExpression } from "leaflet";
import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { EarthquakeListCard } from "./earthquake-list-card";
import { EarthquakeDetailDialog } from "./earthquake-detail-dialog";
import { VolcanoListCard } from "./volcano-list-card";
import { VolcanoDetailDialog } from "./volcano-detail-dialog";
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

const VolcanoMarkersComponent = dynamic(() => import("./volcano-markers"), { 
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

function VolcanoMarkers({ 
  onVolcanoSelect,
  onVolcanoesLoaded,
  onYearChange,
  selectedYear
}: { 
  onVolcanoSelect: (volcano: Volcano) => void;
  onVolcanoesLoaded: (volcanoes: Volcano[]) => void;
  onYearChange: (year: number, count: number) => void;
  selectedYear: number;
}) {
  return <VolcanoMarkersComponent onVolcanoSelect={onVolcanoSelect} onVolcanoesLoaded={onVolcanoesLoaded} onYearChange={onYearChange} selectedYear={selectedYear} />;
}

// Default fallback position - Center Philippines
const defaultPosition: LatLngExpression = [12.8797, 121.7740];

const tabTitles: Record<string, string> = {
  "latest-earthquake": "Latest Earthquake Data",
  "volcano-bulletin": "Volcano Bulletin",
  "floods": "Floods Bulletin",
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
  
  // Volcano state
  const [selectedVolcano, setSelectedVolcano] = useState<Volcano | null>(null);
  const [allVolcanoes, setAllVolcanoes] = useState<Volcano[]>([]);
  const [volcanoDialogOpen, setVolcanoDialogOpen] = useState(false);
  const [volcanoLoading, setVolcanoLoading] = useState(true);
  const [selectedVolcanoYear, setSelectedVolcanoYear] = useState<number>(now.getFullYear());
  const [volcanoActivityCount, setVolcanoActivityCount] = useState<number>(0);
  const [volcanoYearData, setVolcanoYearData] = useState<Volcano[]>([]);
  const [selectedVolcanoDate, setSelectedVolcanoDate] = useState<Date>(now);
  const [isVolcanoPopoverOpen, setIsVolcanoPopoverOpen] = useState(false);
  
  // Dynamic position based on data - defaults to center Philippines
  const [mapCenter, setMapCenter] = useState<LatLngExpression>(defaultPosition);
  
  const title = tabTitles[tabId] || "Map View";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load all earthquakes for date range calculation
  useEffect(() => {
    if (tabId === "latest-earthquake") {
      setLoading(true);
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
            
            // Set map center to most recent earthquake
            setMapCenter([sorted[0].lat, sorted[0].lon]);
          }
          
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load earthquakes:", err);
          setLoading(false);
        });
    }
  }, [tabId]);

  // Load all volcanoes
  useEffect(() => {
    if (tabId === "volcano-bulletin") {
      setVolcanoLoading(true);
      fetch("/api/volcanoes")
        .then((res) => res.json())
        .then((data) => {
          const volcanoes = data.volcanoes ?? [];
          setAllVolcanoes(volcanoes);
          
          // Find the most recent volcano activity date and set it as default
          if (volcanoes.length > 0) {
            const sorted = [...volcanoes].sort((a: Volcano, b: Volcano) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            const mostRecentDate = new Date(sorted[0].date);
            setSelectedVolcanoDate(mostRecentDate);
            setSelectedVolcanoYear(mostRecentDate.getFullYear());
            setMapCenter([sorted[0].lat, sorted[0].lon]);
          }
          
          setVolcanoLoading(false);
        })
        .catch((err) => {
          console.error("Failed to load volcanoes:", err);
          setVolcanoLoading(false);
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

  const handleVolcanoSelect = useCallback((volcano: Volcano) => {
    setSelectedVolcano(volcano);
    setVolcanoDialogOpen(true);
  }, []);

  const handleVolcanoesLoaded = useCallback((volcanoes: Volcano[]) => {
    setVolcanoYearData(volcanoes);
  }, []);

  const handleVolcanoYearChange = useCallback((year: number, count: number) => {
    setSelectedVolcanoYear(year);
    setVolcanoActivityCount(count);
  }, []);

  // Get date range from earthquake data
  const minDate = allQuakes.length > 0 
    ? new Date(Math.min(...allQuakes.map(q => new Date(q.datetime).getTime())))
    : new Date(2000, 0, 1);
  const maxDate = new Date();

  // Get date range from volcano data
  const volcanoMinDate = allVolcanoes.length > 0 
    ? new Date(Math.min(...allVolcanoes.map(v => new Date(v.date).getTime())))
    : new Date(2000, 0, 1);
  const volcanoMaxDate = new Date();

  if (!mounted) {
    return <div className="h-full w-full flex items-center justify-center">Loading map...</div>;
  }

  return (
    <div className="relative h-full w-full flex gap-4">
      {/* Map Container */}
      <div className="flex-1 relative h-full">
        <MapContainer
          center={mapCenter}
          zoom={tabId === "latest-earthquake" ? 6 : tabId === "volcano-bulletin" ? 6 : 8}
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

          {/* Show volcano markers with circles */}
          {tabId === "volcano-bulletin" && (
            <VolcanoMarkers 
              onVolcanoSelect={handleVolcanoSelect}
              onVolcanoesLoaded={handleVolcanoesLoaded}
              onYearChange={handleVolcanoYearChange}
              selectedYear={selectedVolcanoYear}
            />
          )}

          {/* Placeholder markers for other tabs */}
          {tabId !== "latest-earthquake" && tabId !== "volcano-bulletin" && (
            <Marker position={mapCenter}>
              <Popup>
                <div className="font-bold">{title}</div>
                {tabId === "floods" && "Flood bulletin details will appear here."}
                {tabId === "landslide" && "Landslide information will be shown here."}
              </Popup>
            </Marker>
          )}
        </MapContainer>
      
        {/* Month/Year Filter for Earthquakes - Overlay on top of map */}
        {tabId === "latest-earthquake" && (
          <div className="absolute top-3 right-3 z-1000 pointer-events-none">
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

        {/* Year Filter for Volcanoes - Overlay on top of map */}
        {tabId === "volcano-bulletin" && (
          <div className="absolute top-3 right-3 z-1000 pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg font-sans pointer-events-auto">
              <Popover open={isVolcanoPopoverOpen} onOpenChange={setIsVolcanoPopoverOpen}>
                <PopoverTrigger asChild>
                  <button 
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2 min-w-[120px]"
                    disabled={volcanoLoading}
                  >
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">
                      {volcanoLoading ? "Loading..." : selectedVolcanoYear}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-[100px] p-0 font-sans z-10000" align="end">
                  <div className="p-2 max-h-[300px] overflow-y-auto">
                    {(() => {
                      const years = [...new Set(allVolcanoes.map(v => new Date(v.date).getFullYear()))].sort((a, b) => b - a);
                      return years.map(year => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedVolcanoYear(year);
                            setSelectedVolcanoDate(new Date(year, 0, 1));
                            setIsVolcanoPopoverOpen(false);
                          }}
                          className={`w-full text-center px-2 py-1.5 rounded text-sm transition-colors ${
                            selectedVolcanoYear === year 
                              ? 'bg-orange-100 text-orange-900 font-semibold' 
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {year}
                        </button>
                      ));
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        
        {/* Intensity Legend - Overlay on top of map */}
        {tabId === "latest-earthquake" && (
          <div className="absolute bottom-3 left-3 z-1000 bg-white rounded-lg shadow-lg p-3 font-sans pointer-events-auto">
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

      {/* Volcano List Card */}
      {tabId === "volcano-bulletin" && (
        <div className="w-96 h-full">
          <VolcanoListCard 
            volcanoes={volcanoYearData}
            selectedYear={selectedVolcanoYear}
            onSelectVolcano={handleVolcanoSelect}
          />
        </div>
      )}

      {/* Earthquake Detail Dialog */}
      <EarthquakeDetailDialog 
        earthquake={selectedEarthquake}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Volcano Detail Dialog */}
      <VolcanoDetailDialog 
        volcano={selectedVolcano}
        open={volcanoDialogOpen}
        onOpenChange={setVolcanoDialogOpen}
      />
    </div>
  );
};

export default Map;
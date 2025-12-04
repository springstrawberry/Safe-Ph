"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, ArchiveX } from "lucide-react";

type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};

interface EarthquakeListCardProps {
  earthquakes: Quake[];
  selectedMonth: number;
  selectedYear: number;
  onSelectEarthquake: (quake: Quake) => void;
}

// Get color based on magnitude
const getMagnitudeColor = (magnitude?: number): string => {
  if (!magnitude) return "#9ca3af";
  if (magnitude >= 7.0) return "#7f1d1d";
  if (magnitude >= 6.0) return "#991b1b";
  if (magnitude >= 5.0) return "#dc2626";
  if (magnitude >= 4.0) return "#f97316";
  if (magnitude >= 3.0) return "#eab308";
  if (magnitude >= 2.0) return "#84cc16";
  return "#22c55e";
};

// Format month and year for display
const formatMonthYear = (month: number, year: number): string => {
  const date = new Date(year, month);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export function EarthquakeListCard({ earthquakes, selectedMonth, selectedYear, onSelectEarthquake }: EarthquakeListCardProps) {
  const sortedQuakes = [...earthquakes].sort((a, b) => 
    new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
  );

  return (
    <Card className="w-full h-full flex flex-col gap-0 py-0">
      <CardHeader className="border-b shrink-0 py-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span>{formatMonthYear(selectedMonth, selectedYear)}</span>
          </div>
          <span className="text-sm font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">
            {earthquakes.length} events
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-4">
          {earthquakes.length === 0 ? (
            <div className="text-center py-12">
              <ArchiveX className="w-10 h-10 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Earthquakes Found
              </h3>
              <p className="text-sm text-gray-500">
                No earthquake data available for {formatMonthYear(selectedMonth, selectedYear)}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedQuakes.map((quake, index) => {
                const date = new Date(quake.datetime);
                const formattedDate = date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                const formattedTime = date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <button
                    key={index}
                    onClick={() => onSelectEarthquake(quake)}
                    className="w-full text-left p-3 rounded-lg border hover:border-red-300 hover:bg-red-50/50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Magnitude Badge */}
                      <div
                        className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white text-lg"
                        style={{ backgroundColor: getMagnitudeColor(quake.magnitude) }}
                      >
                        {quake.magnitude?.toFixed(1) || "—"}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-red-600 transition-colors truncate">
                          {quake.location}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>📅 {formattedDate}</span>
                          <span>•</span>
                          <span>🕒 {formattedTime}</span>
                        </div>
                        {quake.depth !== undefined && (
                          <div className="text-xs text-gray-500 mt-1">
                            🌊 Depth: {quake.depth.toFixed(1)} km
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="shrink-0 text-gray-400 group-hover:text-red-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
      </CardContent>
    </Card>
  );
}


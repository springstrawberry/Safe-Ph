"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};

interface EarthquakeDetailDialogProps {
  earthquake: Quake | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function EarthquakeDetailDialog({ earthquake, open, onOpenChange }: EarthquakeDetailDialogProps) {
  if (!earthquake) return null;

  const date = new Date(earthquake.datetime);
  const formattedDate = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] z-10000">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <span>🌋</span>
            <span>Earthquake Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-6">
            {/* Location */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">📍 Location</h3>
              <p className="text-lg font-medium text-gray-900">{earthquake.location}</p>
            </div>

            {/* Magnitude & Intensity */}
            {earthquake.magnitude && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">⚡ Magnitude & Intensity</h3>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-bold" style={{ color: getMagnitudeColor(earthquake.magnitude) }}>
                    {earthquake.magnitude.toFixed(1)}
                  </div>
                  <div>
                    <div
                      className="px-4 py-2 rounded-full text-base font-semibold text-white inline-block"
                      style={{ backgroundColor: getMagnitudeColor(earthquake.magnitude) }}
                    >
                      {getMagnitudeLabel(earthquake.magnitude)}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Richter Scale</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date & Time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">📅 Date & Time</h3>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900">{formattedDate}</p>
                <p className="text-base text-gray-600">{formattedTime}</p>
                <p className="text-xs text-gray-400 font-mono">{earthquake.datetime}</p>
              </div>
            </div>

            {/* Coordinates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">🌐 Coordinates</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Latitude:</span>
                  <span className="font-mono font-semibold text-gray-900">{earthquake.lat.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Longitude:</span>
                  <span className="font-mono font-semibold text-gray-900">{earthquake.lon.toFixed(6)}°</span>
                </div>
              </div>
            </div>

            {/* Depth */}
            {earthquake.depth !== undefined && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">🌊 Depth</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{earthquake.depth.toFixed(1)}</span>
                  <span className="text-xl text-gray-600">kilometers</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Below surface</p>
              </div>
            )}

            {/* Source Link */}
            {earthquake.source && (
              <div className="pt-4 border-t">
                <a
                  href={earthquake.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                >
                  View detailed report on USGS
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


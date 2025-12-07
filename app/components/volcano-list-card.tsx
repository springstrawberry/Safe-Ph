"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Flame, ArchiveX, Loader2 } from "lucide-react";

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

interface VolcanoListCardProps {
  volcanoes: Volcano[];
  selectedYear: number;
  onSelectVolcano: (volcano: Volcano) => void;
  loading?: boolean;
}

export function VolcanoListCard({ volcanoes, selectedYear, onSelectVolcano, loading = false }: VolcanoListCardProps) {
  const sortedVolcanoes = [...volcanoes].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="w-full h-full flex flex-col gap-0 py-0">
      <CardHeader className="border-b shrink-0 py-4">
        <CardTitle className="text-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span>{selectedYear}</span>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {volcanoes.length} activities
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 overflow-y-auto scrollbar-hide py-4">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 mx-auto mb-4 text-orange-600 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Loading Volcanic Activity
              </h3>
              <p className="text-sm text-gray-500">
                Fetching data for {selectedYear}...
              </p>
            </div>
          ) : volcanoes.length === 0 ? (
            <div className="text-center py-12">
              <ArchiveX className="w-10 h-10 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Volcanic Activity Found
              </h3>
              <p className="text-sm text-gray-500">
                No volcanic activity data available for {selectedYear}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedVolcanoes.map((volcano, index) => {
                const date = new Date(volcano.date);
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
                    onClick={() => onSelectVolcano(volcano)}
                    className="w-full text-left p-3 rounded-lg border hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Volcano Icon */}
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-linear-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl">
                        🌋
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                          {volcano.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>📅 {formattedDate}</span>
                          <span>•</span>
                          <span>🕒 {formattedTime}</span>
                        </div>
                        {volcano.magnitudeValue && (
                          <div className="text-xs text-gray-600 mt-1 font-medium">
                            Magnitude: {volcano.magnitudeValue} {volcano.magnitudeUnit || ''}
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="shrink-0 text-gray-400 group-hover:text-orange-600 transition-colors">
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


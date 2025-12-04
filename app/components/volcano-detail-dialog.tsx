"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLink, Loader2, Image as ImageIcon } from "lucide-react";

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

interface VolcanoDetailDialogProps {
  volcano: Volcano | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VolcanoDetails = {
  images: string[];
  allImages?: string[];
  details: {
    name?: string;
    type?: string;
    lastEruption?: string;
    elevation?: string;
    description?: string;
    generalInformation?: string;
  };
};

export function VolcanoDetailDialog({ volcano, open, onOpenChange }: VolcanoDetailDialogProps) {
  const [volcanoDetails, setVolcanoDetails] = useState<VolcanoDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch additional volcano details from source URLs
  useEffect(() => {
    if (!volcano || !open) {
      setVolcanoDetails(null);
      return;
    }

    const fetchVolcanoDetails = async () => {
      // Check if we have source URLs
      if (!volcano.sources || volcano.sources.length === 0) {
        return;
      }

      setLoadingDetails(true);
      try {
        // Fetch details from the first source URL
        const sourceUrl = volcano.sources[0].url;
        const res = await fetch(`/api/volcano-details?url=${encodeURIComponent(sourceUrl)}`);
        const data = await res.json();
        
        if (data && !data.error) {
          setVolcanoDetails(data);
          console.log("🌋 Loaded volcano details:", data);
        }
      } catch (err) {
        console.error("Failed to load volcano details:", err);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchVolcanoDetails();
  }, [volcano, open]);

  if (!volcano) return null;

  const date = new Date(volcano.date);
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
            <span>Volcanic Activity Details</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto pr-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-6">
            {/* Loading State */}
            {loadingDetails && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                <span className="ml-2 text-sm text-gray-600">Loading additional details...</span>
              </div>
            )}

            {/* Volcano Photos - Full width display */}
            {volcanoDetails && volcanoDetails.allImages && volcanoDetails.allImages.length > 0 && (
              <div className="space-y-3">
                {volcanoDetails.allImages.slice(0, 8).map((image, index) => (
                  <div
                    key={index}
                    className="relative w-full aspect-video rounded-lg overflow-hidden border hover:border-orange-300 cursor-pointer group bg-gray-100 shadow-md"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`${volcano.title} - Photo ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                      onError={(e) => {
                        // Hide broken images and their container
                        const parent = (e.target as HTMLElement).parentElement;
                        if (parent) parent.style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      Click to enlarge
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Title */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">🏔️ Volcano Name</h3>
              <p className="text-xl font-bold text-gray-900">
                {volcanoDetails?.details?.name || volcano.title}
              </p>
            </div>

            {/* Volcano Type */}
            {volcanoDetails?.details?.type && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">🌋 Volcano Type</h3>
                <p className="text-base text-gray-900 font-medium">{volcanoDetails.details.type}</p>
              </div>
            )}

            {/* Elevation */}
            {volcanoDetails?.details?.elevation && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">⛰️ Elevation</h3>
                <p className="text-base text-gray-900 font-medium">{volcanoDetails.details.elevation}</p>
              </div>
            )}

            {/* Last Known Eruption */}
            {volcanoDetails?.details?.lastEruption && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">💥 Last Known Eruption</h3>
                <p className="text-base text-gray-900 font-medium">{volcanoDetails.details.lastEruption}</p>
              </div>
            )}

            {/* Description from source */}
            {volcanoDetails?.details?.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">📝 About</h3>
                <p className="text-base text-gray-700 leading-relaxed">{volcanoDetails.details.description}</p>
              </div>
            )}

            {/* Description from EONET */}
            {volcano.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">📝 Description</h3>
                <p className="text-base text-gray-700 leading-relaxed">{volcano.description}</p>
              </div>
            )}

            {/* Date & Time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">📅 Activity Date & Time</h3>
              <div className="space-y-1">
                <p className="text-base font-medium text-gray-900">{formattedDate}</p>
                <p className="text-base text-gray-600">{formattedTime}</p>
              </div>
            </div>

            {/* Magnitude */}
            {volcano.magnitudeValue && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">📊 Magnitude</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-orange-600">{volcano.magnitudeValue}</span>
                  {volcano.magnitudeUnit && (
                    <span className="text-lg text-gray-600">{volcano.magnitudeUnit}</span>
                  )}
                </div>
              </div>
            )}

            {/* Coordinates */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-2">🌐 Coordinates</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Latitude:</span>
                  <span className="font-mono font-semibold text-gray-900">{volcano.lat.toFixed(6)}°</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Longitude:</span>
                  <span className="font-mono font-semibold text-gray-900">{volcano.lon.toFixed(6)}°</span>
                </div>
              </div>
            </div>

            {/* Sources */}
            {volcano.sources && volcano.sources.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-3">🔗 Sources & References</h3>
                <div className="space-y-2">
                  {volcano.sources.map((source, index) => (
                    <a
                      key={index}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:border-orange-300 hover:bg-orange-50/50 transition-all group"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-orange-600" />
                      <span className="text-sm text-gray-700 group-hover:text-orange-600 font-medium flex-1">
                        {source.id || `Source ${index + 1}`}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

             {/* Event Link */}
             {volcano.link && (
               <div className="pt-4 border-t">
                 <a
                   href={volcano.link}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                 >
                   View detailed event on NASA EONET
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                   </svg>
                 </a>
               </div>
             )}
           </div>
         </div>
       </DialogContent>

       {/* Image Lightbox */}
       {selectedImage && (
         <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
           <DialogContent className="max-w-6xl max-h-[95vh] p-2 bg-black/95 border-none">
             <DialogHeader className="sr-only">
               <DialogTitle>{volcano.title} - Photo</DialogTitle>
             </DialogHeader>
             <div className="relative w-full h-full flex items-center justify-center">
               <img
                 src={selectedImage}
                 alt={`${volcano.title} - Full size`}
                 className="max-w-full max-h-[85vh] object-contain rounded-lg cursor-zoom-out"
                 onClick={() => setSelectedImage(null)}
               />
               <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-4 py-2 rounded-lg">
                 {volcano.title}
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}
     </Dialog>
   );
}


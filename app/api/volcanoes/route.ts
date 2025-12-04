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

export async function GET() {
  try {
    // Philippines bounding box (covers all PH territory)
    const minLat = 4.5;
    const maxLat = 21.5;
    const minLon = 116;
    const maxLon = 127;

    console.log("🌋 Fetching volcanic activities from NASA EONET API");
    console.log(`🗺️  Region: Philippines`);
    console.log(`📋 Fetching ALL activities (not just eruptions)`);
    
    // Fetch more events to get comprehensive activity data
    const url = `https://eonet.gsfc.nasa.gov/api/v3/events?category=volcanoes&status=all&limit=500`;
    
    const res = await fetch(url, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`⚠️ NASA EONET API returned ${res.status}`);
      return new Response(
        JSON.stringify({ volcanoes: [], error: `API returned ${res.status}` }), 
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();
    
    // Filter and map volcano events to Philippines region
    // Process ALL geometry points as individual activities (not just most recent)
    const allActivities: Volcano[] = [];
    
    (data.events || []).forEach((event: any) => {
      const geometries = event.geometry || event.geometries || [];
      if (geometries.length === 0) return;
      
      // Create an activity entry for EACH geometry point (each represents a separate activity/observation)
      geometries.forEach((geometry: any) => {
        const coords = geometry.coordinates;
        const lat = coords[1];
        const lon = coords[0];
        
        // Only include if in Philippines region
        if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) {
          allActivities.push({
            id: `${event.id}_${geometry.date}`,
            title: event.title || "Unknown Volcano",
            description: event.description || null,
            link: event.link || "",
            lat: lat,
            lon: lon,
            date: geometry.date,
            closed: event.closed || null,
            categories: event.categories || [],
            sources: event.sources || [],
            magnitudeValue: geometry.magnitudeValue || null,
            magnitudeUnit: geometry.magnitudeUnit || null,
          });
        }
      });
    });

    // Sort by most recent first
    allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Count activities by year
    const yearCounts: Record<number, number> = {};
    allActivities.forEach(activity => {
      const year = new Date(activity.date).getFullYear();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });

    console.log("✅ Total volcanic activities in Philippines:", allActivities.length);
    console.log("📊 Activities by year:", yearCounts);
    if (allActivities.length > 0) {
      console.log("🌋 Most recent:", allActivities[0].title, allActivities[0].date);
      console.log("🌋 Oldest:", allActivities[allActivities.length - 1].title, allActivities[allActivities.length - 1].date);
    }

    return new Response(JSON.stringify({ volcanoes: allActivities, yearCounts }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("❌ Error fetching NASA EONET volcanoes:", err);
    return new Response(JSON.stringify({ volcanoes: [], error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


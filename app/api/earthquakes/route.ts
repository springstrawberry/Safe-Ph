type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};

export async function GET() {
  try {
    // Philippines bounding box (covers all PH territory)
    const minLat = 4.5;
    const maxLat = 21.5;
    const minLon = 116;
    const maxLon = 127;

    const currentYear = new Date().getFullYear();
    const yearsToFetch = 10; // Current year + 9 previous years (2025 back to 2016)
    
    console.log("📡 Fetching earthquakes from USGS API");
    console.log(`🗺️  Region: Philippines`);
    console.log(`📅  Years: ${currentYear - yearsToFetch + 1} - ${currentYear}`);

    // Fetch earthquakes for multiple years
    const allQuakes: Quake[] = [];
    
    for (let i = 0; i < yearsToFetch; i++) {
      const year = currentYear - i;
      const startDate = `${year}-01-01`;
      const endDate = i === 0 ? new Date().toISOString().split('T')[0] : `${year}-12-31`;
      
      console.log(`  📆 Fetching ${year} data...`);
      
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${startDate}&endtime=${endDate}&minlatitude=${minLat}&maxlatitude=${maxLat}&minlongitude=${minLon}&maxlongitude=${maxLon}&orderby=time-asc`;
      
      try {
        const res = await fetch(url, {
          cache: "no-store",
        });

        if (!res.ok) {
          console.warn(`  ⚠️ ${year}: USGS API returned ${res.status}`);
          continue;
        }

        const data = await res.json();
        
        const yearQuakes: Quake[] = (data.features || []).map((feature: any) => {
          const props = feature.properties;
          const coords = feature.geometry.coordinates;
          
          return {
            datetime: new Date(props.time).toISOString(),
            lat: coords[1],
            lon: coords[0],
            location: props.place || "Unknown location",
            magnitude: props.mag,
            depth: coords[2], // depth in km
            source: props.url || "https://earthquake.usgs.gov/",
          };
        });

        console.log(`  ✅ ${year}: ${yearQuakes.length} earthquakes`);
        allQuakes.push(...yearQuakes);
      } catch (err) {
        console.error(`  ❌ Error fetching ${year}:`, err);
      }
    }

    // Sort by most recent first
    allQuakes.sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());

    console.log("✅ Total earthquakes fetched:", allQuakes.length);
    if (allQuakes.length > 0) {
      console.log("📍 Most recent:", allQuakes[0]);
      console.log("📍 Oldest:", allQuakes[allQuakes.length - 1]);
    }

    return new Response(JSON.stringify({ quakes: allQuakes }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("❌ Error fetching USGS earthquakes:", err);
    return new Response(JSON.stringify({ quakes: [], error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

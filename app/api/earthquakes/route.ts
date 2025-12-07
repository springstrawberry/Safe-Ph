type Quake = {
  datetime: string;
  lat: number;
  lon: number;
  location: string;
  source?: string;
  magnitude?: number;
  depth?: number;
};

export async function GET(request: Request) {
  try {
    // Get parameters from query string
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const yearsToFetch = Math.min(
      parseInt(searchParams.get('years') || '1', 10),
      10 // Max 10 years
    );
    
    const currentYear = new Date().getFullYear();
    const targetMonth = monthParam ? parseInt(monthParam, 10) : null;
    const targetYear = yearParam ? parseInt(yearParam, 10) : null;
    
    if (targetMonth && targetYear) {
      console.log("📡 Fetching earthquakes from PHIVOLCS");
      console.log(`🗺️  Region: Philippines`);
      console.log(`📅  Fetching data for ${targetYear}-${targetMonth.toString().padStart(2, '0')} (single month)`);
    } else {
      console.log("📡 Fetching earthquakes from PHIVOLCS");
      console.log(`🗺️  Region: Philippines`);
      console.log(`📅  Fetching ${yearsToFetch} year(s) of data (${currentYear - yearsToFetch + 1} - ${currentYear})`);
      console.log(`💡 Tip: Add ?month=X&year=YYYY to fetch specific month (faster)`);
    }

    // Check if we're on Vercel - use Python serverless function
    // Otherwise, use local Python script execution
    const isVercel = process.env.VERCEL === '1';
    let result: { quakes: Quake[]; error?: string };
    
    if (isVercel) {
      // On Vercel: Call Python serverless function
      console.log("  🚀 Using Vercel Python serverless function");
      
      // Build query string for Python function
      const queryParams = new URLSearchParams();
      queryParams.set('years', yearsToFetch.toString());
      if (targetMonth) queryParams.set('month', targetMonth.toString());
      if (targetYear) queryParams.set('year', targetYear.toString());
      
      // Get the base URL (Vercel provides VERCEL_URL)
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : request.url.split('/api')[0];
      
      const pythonFunctionUrl = `${baseUrl}/api/fetch-earthquakes?${queryParams.toString()}`;
      console.log(`  🔗 Calling: ${pythonFunctionUrl}`);
      
      try {
        const pythonResponse = await fetch(pythonFunctionUrl, {
          headers: {
            'User-Agent': 'Safe-PH-API',
          },
        });
        
        if (!pythonResponse.ok) {
          throw new Error(`Python function returned ${pythonResponse.status}`);
        }
        
        result = await pythonResponse.json();
      } catch (fetchErr) {
        console.error("  ❌ Error calling Python function:", fetchErr);
        throw new Error(`Failed to call Python serverless function: ${String(fetchErr)}`);
      }
    } else {
      // Local development: Execute Python script directly
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const { join } = await import('path');
      const execAsync = promisify(exec);
      
      console.log("  🐍 Running Python script locally");
      
      const scriptPath = join(process.cwd(), 'scripts', 'fetch_earthquakes.py');
      const pythonPath = process.env.PYTHON_PATH || 'python';
      const pythonInstallPath = process.env.PYTHON_INSTALL_PATH || 
        'C:\\Users\\Denise Valerie\\AppData\\Roaming\\Python\\Python312';
      
      const possibleSitePackages = pythonInstallPath ? [
        join(pythonInstallPath, 'site-packages'),
        join(pythonInstallPath, 'Lib', 'site-packages'),
        pythonInstallPath,
      ] : [];
      
      const env = {
        ...process.env,
        PYTHONPATH: possibleSitePackages.length > 0 
          ? `${possibleSitePackages.join(';')}${process.env.PYTHONPATH ? `;${process.env.PYTHONPATH}` : ''}`
          : process.env.PYTHONPATH || '',
        PATH: pythonInstallPath 
          ? `${join(pythonInstallPath, 'Scripts')}${process.env.PATH ? `;${process.env.PATH}` : ''}`
          : process.env.PATH || '',
      };

      let pythonCmd = `"${pythonPath}" "${scriptPath}" ${yearsToFetch}`;
      if (targetMonth && targetYear) {
        pythonCmd = `"${pythonPath}" "${scriptPath}" 1 ${targetMonth} ${targetYear}`;
      }
      
      const { stdout, stderr } = await execAsync(pythonCmd, {
        env,
        maxBuffer: 10 * 1024 * 1024,
        cwd: process.cwd(),
      });

      if (stderr) {
        console.log("  ℹ️  Python stderr output:", stderr);
      }
      
      try {
        result = JSON.parse(stdout);
      } catch (parseErr) {
        console.error("  ❌ Failed to parse Python script output:", parseErr);
        throw new Error("Failed to parse earthquake data from Python script");
      }
    }

    if (result.error) {
      console.error("  ❌ Error:", result.error);
      throw new Error(result.error);
    }

    let allQuakes: Quake[] = result.quakes || [];

    // Validate and filter out invalid datetime values
    allQuakes = allQuakes.filter(quake => {
      if (!quake.datetime) return false;
      try {
        const date = new Date(quake.datetime);
        return !isNaN(date.getTime());
      } catch {
        return false;
      }
    });

    // Sort by most recent first (if not already sorted)
    allQuakes.sort((a, b) => {
      try {
        return new Date(b.datetime).getTime() - new Date(a.datetime).getTime();
      } catch {
        return 0;
      }
    });

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
    console.error("❌ Error fetching PHIVOLCS earthquakes:", err);
    return new Response(JSON.stringify({ quakes: [], error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

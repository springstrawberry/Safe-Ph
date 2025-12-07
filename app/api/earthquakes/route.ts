import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';

const execAsync = promisify(exec);

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
    
    // If month and year specified, fetch only that month (fastest)
    const targetMonth = monthParam ? parseInt(monthParam, 10) : null;
    const targetYear = yearParam ? parseInt(yearParam, 10) : null;
    
    if (targetMonth && targetYear) {
      console.log("📡 Fetching earthquakes from PHIVOLCS using pylindol");
      console.log(`🗺️  Region: Philippines`);
      console.log(`📅  Fetching data for ${targetYear}-${targetMonth.toString().padStart(2, '0')} (single month)`);
    } else {
      console.log("📡 Fetching earthquakes from PHIVOLCS using pylindol");
      console.log(`🗺️  Region: Philippines`);
      console.log(`📅  Fetching ${yearsToFetch} year(s) of data (${currentYear - yearsToFetch + 1} - ${currentYear})`);
      console.log(`💡 Tip: Add ?month=X&year=YYYY to fetch specific month (faster)`);
    }

    // Get the path to the Python script
    const scriptPath = join(process.cwd(), 'scripts', 'fetch_earthquakes.py');
    
    // Set Python path to include pylindol installation location
    // PYTHON_INSTALL_PATH should point to the Python installation directory
    // Site-packages would be in a subdirectory (e.g., Lib/site-packages or site-packages)
    // Note: The fallback path below is for local development only
    // Set PYTHON_INSTALL_PATH environment variable for production deployments
    const pythonPath = process.env.PYTHON_PATH || 'python';
    // Use environment variable if set, otherwise fallback to local dev path
    // For production, set PYTHON_INSTALL_PATH in environment variables
    const pythonInstallPath = process.env.PYTHON_INSTALL_PATH || 
      'C:\\Users\\Denise Valerie\\AppData\\Roaming\\Python\\Python312';
    
    // Set PYTHONPATH to include pylindol location (site-packages directory)
    // Try common locations for site-packages
    const possibleSitePackages = pythonInstallPath ? [
      join(pythonInstallPath, 'site-packages'),
      join(pythonInstallPath, 'Lib', 'site-packages'),
      pythonInstallPath, // Fallback to the installation path itself
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

    console.log(`  🐍 Running Python script: ${scriptPath}`);
    console.log(`  📦 Using Python from: ${pythonInstallPath}`);

    // Build Python command with parameters
    let pythonCmd = `"${pythonPath}" "${scriptPath}" ${yearsToFetch}`;
    if (targetMonth && targetYear) {
      pythonCmd = `"${pythonPath}" "${scriptPath}" 1 ${targetMonth} ${targetYear}`;
    }
    
    // Execute the Python script
    const { stdout, stderr } = await execAsync(
      pythonCmd,
      {
        env,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large responses
        cwd: process.cwd(),
      }
    );

    // Log any stderr output (warnings, debug info)
    if (stderr) {
      console.log("  ℹ️  Python stderr output:", stderr);
    }
    
    // Also log a sample of stdout for debugging
    if (stdout && stdout.length > 0) {
      try {
        const preview = stdout.substring(0, 500);
        console.log("  📄 Python stdout preview:", preview);
      } catch {
        // Ignore
      }
    }

    // Parse the JSON output from Python script
    let result: { quakes: Quake[]; error?: string };
    try {
      result = JSON.parse(stdout);
    } catch (parseErr) {
      console.error("  ❌ Failed to parse Python script output:", parseErr);
      console.error("  📄 Raw output:", stdout);
      throw new Error("Failed to parse earthquake data from Python script");
    }

    if (result.error) {
      console.error("  ❌ Python script error:", result.error);
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

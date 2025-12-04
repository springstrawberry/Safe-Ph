import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return new Response(JSON.stringify({ error: "URL parameter is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("🌋 Fetching volcano details from:", url);

    // Fetch the volcano page
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`⚠️ Failed to fetch volcano details: ${res.status}`);
      return new Response(
        JSON.stringify({ error: `Failed to fetch: ${res.status}` }), 
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const html = await res.text();
    
    // Parse HTML to extract relevant information
    const volcanoData: any = {
      images: [],
      details: {},
    };

    // Extract images - very selective, only actual volcano photos
    const imageRegex = /<img[^>]+src="([^">]+)"[^>]*alt="([^"]*)"[^>]*>/gi;
    let match;
    const seenUrls = new Set<string>();
    
    while ((match = imageRegex.exec(html)) !== null) {
      const src = match[1];
      const alt = match[2] || '';
      
      // Very strict filtering - only actual volcano photos
      const isVolcanoPhoto = (
        // Must be an image file
        (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp')) &&
        // Must be in a photo directory or have volcano-related path
        (src.includes('/Photos/') || src.includes('/photo') || src.includes('/images/volcanoes/') || 
         src.includes('GVP-') || src.includes('volcano')) &&
        // Must NOT be UI elements
        !src.includes('icon') && !src.includes('logo') && !src.includes('button') && 
        !src.includes('banner') && !src.includes('header') && !src.includes('footer') &&
        !src.includes('nav') && !src.includes('menu') && !src.includes('arrow') &&
        !src.includes('thumbnail') && !src.includes('thumb') &&
        // Alt text should be relevant (if exists)
        (!alt || alt.toLowerCase().includes('volcano') || alt.toLowerCase().includes('erupt') || 
         alt.toLowerCase().includes('view') || alt.toLowerCase().includes('photo') ||
         alt.toLowerCase().includes('crater') || alt.toLowerCase().includes('lava'))
      );
      
      if (isVolcanoPhoto) {
        // Make absolute URLs
        let absoluteUrl = src.startsWith('http') ? src : `https://volcano.si.edu${src}`;
        
        // Remove duplicates
        if (!seenUrls.has(absoluteUrl)) {
          seenUrls.add(absoluteUrl);
          volcanoData.images.push(absoluteUrl);
        }
      }
    }
    
    // Also try to find images in specific photo gallery sections
    const photoGalleryRegex = /<div[^>]*class="[^"]*photo-gallery[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    const galleryMatch = photoGalleryRegex.exec(html);
    if (galleryMatch) {
      const galleryHtml = galleryMatch[1];
      const galleryImgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
      let imgMatch;
      while ((imgMatch = galleryImgRegex.exec(galleryHtml)) !== null) {
        const src = imgMatch[1];
        if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png') || src.includes('.webp')) {
          let absoluteUrl = src.startsWith('http') ? src : `https://volcano.si.edu${src}`;
          if (!seenUrls.has(absoluteUrl)) {
            seenUrls.add(absoluteUrl);
            volcanoData.images.push(absoluteUrl);
          }
        }
      }
    }

    // Extract volcano name
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (nameMatch) {
      volcanoData.details.name = nameMatch[1].trim();
    }

    // Extract volcano type
    const typeMatch = html.match(/Volcano Type[:\s]*<[^>]*>([^<]+)</i);
    if (typeMatch) {
      volcanoData.details.type = typeMatch[1].trim();
    }

    // Extract last known eruption
    const lastEruptionDetail = html.match(/Last Known Eruption[:\s]*<[^>]*>([^<]+)</i);
    if (lastEruptionDetail) {
      volcanoData.details.lastEruption = lastEruptionDetail[1].trim();
    }

    // Extract elevation
    const elevationMatch = html.match(/Elevation[:\s]*<[^>]*>([^<]+)</i);
    if (elevationMatch) {
      volcanoData.details.elevation = elevationMatch[1].trim();
    }

    // Extract summit elevation (alternative pattern)
    const summitMatch = html.match(/Summit Elevation[:\s]*<[^>]*>([^<]+)</i);
    if (summitMatch) {
      volcanoData.details.elevation = summitMatch[1].trim();
    }

    // Extract description/summary (look for content paragraphs)
    const descMatch = html.match(/<div class="volcano-description"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/<p class="summary"[^>]*>([\s\S]*?)<\/p>/i);
    if (descMatch) {
      // Clean HTML tags from description
      volcanoData.details.description = descMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // Extract General Information section
    // Note: The General Information tab content is loaded dynamically via JavaScript,
    // so we'll extract the static general info displayed at the top of the page instead
    let generalInfo = null;
    
    console.log("🔍 Searching for general volcano information...");
    
    // Try to construct general information from the page's static data
    const infoLines: string[] = [];
    
    // Extract Country
    const countryMatch = html.match(/Country[^<]*<[^>]*>([^<]+)</i);
    if (countryMatch) infoLines.push(`Country: ${countryMatch[1].trim()}`);
    
    // Extract Volcanic Region
    const regionMatch = html.match(/Volcanic Region[^<]*<[^>]*>([^<]+)</i);
    if (regionMatch) infoLines.push(`Volcanic Region: ${regionMatch[1].trim()}`);
    
    // Extract Landform/Volcano Type
    const infoTypeMatch = html.match(/Landform[^<]*Volc Type[^<]*<[^>]*>([^<]+)</i);
    if (infoTypeMatch) infoLines.push(`Type: ${infoTypeMatch[1].trim()}`);
    
    // Extract Last Known Eruption
    const infoEruptionMatch = html.match(/Last Known Eruption[^<]*<[^>]*>([^<]+)</i);
    if (infoEruptionMatch) infoLines.push(`Last Known Eruption: ${infoEruptionMatch[1].trim()}`);
    
    // Extract Coordinates
    const infoLatMatch = html.match(/Latitude[^<]*<[^>]*>([^<]+)</i);
    const infoLonMatch = html.match(/Longitude[^<]*<[^>]*>([^<]+)</i);
    if (infoLatMatch && infoLonMatch) {
      infoLines.push(`Coordinates: ${infoLatMatch[1].trim()}, ${infoLonMatch[1].trim()}`);
    }
    
    // Extract Summit Elevation
    const infoElevMatch = html.match(/Summit[^<]*Elevation[^<]*<[^>]*>([^<]+)</i);
    if (infoElevMatch) infoLines.push(`Summit Elevation: ${infoElevMatch[1].trim()}`);
    
    // Extract Volcano Number
    const infoNumMatch = html.match(/Volcano[^<]*Number[^<]*<[^>]*>([^<]+)</i);
    if (infoNumMatch) infoLines.push(`Volcano Number: ${infoNumMatch[1].trim()}`);
    
    if (infoLines.length > 0) {
      generalInfo = infoLines.join('\n');
      volcanoData.details.generalInformation = generalInfo;
      console.log("✅ General information extracted from page header");
      console.log("📝 Info:", generalInfo);
    } else {
      console.log("❌ Could not extract general information from page");
    }

    // If we found very few images, try alternate patterns
    if (volcanoData.images.length < 3) {
      // Look for background images in style attributes
      const bgImageRegex = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi;
      let bgMatch;
      while ((bgMatch = bgImageRegex.exec(html)) !== null) {
        const src = bgMatch[1];
        if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
          const absoluteUrl = src.startsWith('http') ? src : `https://volcano.si.edu${src}`;
          if (!volcanoData.images.includes(absoluteUrl)) {
            volcanoData.images.push(absoluteUrl);
          }
        }
      }
    }

    // Remove duplicates
    const uniqueImages = [...new Set(volcanoData.images)];
    
    // Return all images so we can select the correct one in the frontend
    volcanoData.allImages = uniqueImages;
    
    // Try different indices to find the volcano photo
    // Grid layout: 1(0) 2(1) / 3(2) 4(3)
    // The 4th position in a 2x2 grid is index 3
    let selectedImageIndex = 3; // Default to 4th image (index 3)
    
    if (uniqueImages.length > selectedImageIndex) {
      volcanoData.images = [uniqueImages[selectedImageIndex]];
    } else if (uniqueImages.length > 0) {
      // If there are fewer images, use the last one available
      volcanoData.images = [uniqueImages[uniqueImages.length - 1]];
      selectedImageIndex = uniqueImages.length - 1;
    } else {
      volcanoData.images = [];
    }

    console.log("✅ Volcano details extracted:", {
      totalImagesFound: uniqueImages.length,
      selectedIndex: selectedImageIndex,
      hasDetails: Object.keys(volcanoData.details).length > 0,
      hasGeneralInfo: !!volcanoData.details.generalInformation,
      generalInfoLength: volcanoData.details.generalInformation?.length || 0,
      selectedImage: volcanoData.images[0] || 'none',
    });

    return new Response(JSON.stringify(volcanoData), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("❌ Error fetching volcano details:", err);
    return new Response(JSON.stringify({ error: String(err), images: [], details: {} }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


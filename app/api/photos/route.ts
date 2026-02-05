import { NextResponse } from 'next/server';
import { getFreshUrls } from '@/lib/google-photos';
import { getLocations, getPhotos, getMeta, getCaptions } from '@/lib/storage';
import type { Location, Photo, PhotosApiResponse } from '@/lib/types';

/**
 * GET /api/photos
 * Returns all locations with photos, fetching fresh URLs from Google Photos
 * 
 * Query params:
 * - year: Filter by year (optional)
 * - locationId: Get specific location (optional)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearFilter = searchParams.get('year');
    const locationIdFilter = searchParams.get('locationId');

    // Get stored data
    let locations = await getLocations();
    const allPhotos = await getPhotos();
    const captions = await getCaptions();
    const meta = await getMeta();

    // Apply filters
    if (yearFilter) {
      const year = parseInt(yearFilter);
      locations = locations.filter(l => l.year <= year);
    }
    if (locationIdFilter) {
      locations = locations.filter(l => l.id === locationIdFilter);
    }

    // Collect all photo IDs we need URLs for
    const photoIds = locations.flatMap(l => l.photoIds);
    
    // Fetch fresh URLs from Google Photos API
    const urlMap = await getFreshUrls(photoIds);

    // Build response with full photo data
    const responseLocations: Location[] = locations.map(loc => {
      const photos: Photo[] = loc.photoIds
        .map(id => {
          const storedPhoto = allPhotos.find(p => p.id === id);
          if (!storedPhoto) return null;

          return {
            id,
            url: urlMap.get(id) || undefined,
            caption: captions[id] || storedPhoto.caption,
            takenAt: storedPhoto.takenAt,
          };
        })
        .filter((p): p is Photo => p !== null && p.url !== undefined);

      return {
        id: loc.id,
        name: loc.name,
        coords: [loc.lat, loc.lng] as [number, number],
        type: loc.type,
        year: loc.year,
        photos,
      };
    }).filter(loc => loc.photos.length > 0); // Only include locations with loadable photos

    const response: PhotosApiResponse = {
      locations: responseLocations,
      years: meta?.years || [],
      lastSynced: meta?.lastSynced || 'never',
    };

    return NextResponse.json(response, {
      headers: {
        // Cache for 30 minutes (URLs last ~1 hour)
        'Cache-Control': 'public, max-age=1800, stale-while-revalidate=3600',
      },
    });

  } catch (error) {
    console.error('Photos API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos', details: String(error) },
      { status: 500 }
    );
  }
}

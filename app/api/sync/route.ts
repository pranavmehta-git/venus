import { NextResponse } from 'next/server';
import { fetchAlbumPhotos, parsePhotoCaption, reverseGeocode } from '@/lib/google-photos';
import { storeLocations, storePhotos, storeMeta, getCaptions } from '@/lib/storage';
import type { StoredLocation, StoredPhoto } from '@/lib/types';

// Vercel cron authentication
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/sync
 * Called by Vercel Cron nightly to sync photos from Google Photos
 */
export async function POST(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const albumId = process.env.GOOGLE_PHOTOS_ALBUM_ID;
    if (!albumId) {
      return NextResponse.json({ error: 'Album ID not configured' }, { status: 500 });
    }

    console.log('Starting sync from Google Photos album:', albumId);

    // Fetch all photos from album
    const mediaItems = await fetchAlbumPhotos(albumId);
    console.log(`Fetched ${mediaItems.length} photos`);

    // Get existing user captions (preserve across syncs)
    const userCaptions = await getCaptions();

    // Process photos and group by location
    const photos: StoredPhoto[] = [];
    const locationGroups = new Map<string, StoredPhoto[]>();

    for (const item of mediaItems) {
      // Parse caption/description for location and type
      const parsed = parsePhotoCaption(item.description);
      
      // Get creation time
      const takenAt = item.mediaMetadata?.creationTime || new Date().toISOString();
      const year = new Date(takenAt).getFullYear();

      // Determine contributor (for together vs solo)
      const contributor = item.contributorInfo?.displayName;

      const photo: StoredPhoto = {
        id: item.id,
        caption: userCaptions[item.id] || parsed.caption || '',
        takenAt,
        lat: 0,  // Will be set from album/caption or manual entry
        lng: 0,
        contributor,
      };

      photos.push(photo);

      // Group by location (from parsed caption or manual entry)
      const locationKey = parsed.location || 'unlocated';
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(photo);
    }

    // Build location entries
    const locations: StoredLocation[] = [];
    
    for (const [locationName, locationPhotos] of locationGroups) {
      if (locationName === 'unlocated') continue; // Skip photos without location

      // Use first photo's year as location year
      const year = new Date(locationPhotos[0].takenAt).getFullYear();
      
      // Determine type based on contributors
      const contributors = new Set(locationPhotos.map(p => p.contributor).filter(Boolean));
      let type: 'together' | 'pranav' | 'pooja' = 'together';
      if (contributors.size === 1) {
        const name = [...contributors][0]?.toLowerCase() || '';
        if (name.includes('pranav')) type = 'pranav';
        else if (name.includes('pooja')) type = 'pooja';
      }

      locations.push({
        id: `${locationName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}`,
        name: locationName,
        lat: locationPhotos[0].lat,  // Would need geocoding from location name
        lng: locationPhotos[0].lng,
        type,
        year,
        photoIds: locationPhotos.map(p => p.id),
      });
    }

    // Store in KV
    await storePhotos(photos);
    await storeLocations(locations);
    await storeMeta({
      lastSynced: new Date().toISOString(),
      albumId,
      totalPhotos: photos.length,
      years: [...new Set(locations.map(l => l.year))].sort(),
    });

    console.log(`Sync complete: ${photos.length} photos, ${locations.length} locations`);

    return NextResponse.json({
      success: true,
      photos: photos.length,
      locations: locations.length,
      syncedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Sync failed', details: String(error) },
      { status: 500 }
    );
  }
}

// Also allow GET for manual triggering in development
export async function GET(request: Request) {
  // In development, allow GET without auth
  if (process.env.NODE_ENV === 'development') {
    return POST(new Request(request.url, {
      method: 'POST',
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    }));
  }
  return NextResponse.json({ error: 'Use POST' }, { status: 405 });
}

import { google } from 'googleapis';
import type { GoogleMediaItem, StoredPhoto } from './types';

// Initialize OAuth2 client
function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Use stored refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
}

/**
 * Fetch all media items from a shared album
 */
export async function fetchAlbumPhotos(albumId: string): Promise<GoogleMediaItem[]> {
  const auth = getAuthClient();
  const accessToken = (await auth.getAccessToken()).token;

  const allItems: GoogleMediaItem[] = [];
  let pageToken: string | undefined;

  do {
    const response = await fetch(
      'https://photoslibrary.googleapis.com/v1/mediaItems:search',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          albumId,
          pageSize: 100,
          pageToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Photos API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.mediaItems) {
      allItems.push(...data.mediaItems);
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allItems;
}

/**
 * Get fresh URLs for a list of media item IDs
 * URLs expire after ~1 hour, so we fetch on-demand
 */
export async function getFreshUrls(mediaItemIds: string[]): Promise<Map<string, string>> {
  const auth = getAuthClient();
  const accessToken = (await auth.getAccessToken()).token;

  const urlMap = new Map<string, string>();

  // Batch in groups of 50 (API limit)
  for (let i = 0; i < mediaItemIds.length; i += 50) {
    const batch = mediaItemIds.slice(i, i + 50);
    
    const response = await fetch(
      `https://photoslibrary.googleapis.com/v1/mediaItems:batchGet?${batch.map(id => `mediaItemIds=${id}`).join('&')}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch URLs: ${response.status}`);
      continue;
    }

    const data = await response.json();
    for (const result of data.mediaItemResults || []) {
      if (result.mediaItem) {
        // Append =w800 for reasonable size, =d for download
        urlMap.set(
          result.mediaItem.id,
          `${result.mediaItem.baseUrl}=w800-h600`
        );
      }
    }
  }

  return urlMap;
}

/**
 * Extract GPS coordinates from Google Photos metadata
 * Note: Google Photos API doesn't expose GPS directly, so we use a workaround
 */
export async function getPhotoLocation(mediaItemId: string): Promise<{ lat: number; lng: number } | null> {
  // Google Photos API doesn't expose GPS in the standard API
  // Options:
  // 1. Use the undocumented location data (not reliable)
  // 2. Download the image and read EXIF (slow, uses bandwidth)
  // 3. Store location manually when adding to album (recommended for accuracy)
  
  // For now, we return null and rely on album-level location tagging
  // or manual caption parsing like "[Tokyo]" or "#tokyo"
  return null;
}

/**
 * Parse location from photo description/caption
 * Format: First line is caption, hashtags or [brackets] indicate location
 * Example: "Cherry blossoms! #tokyo" or "Fun times [San Francisco, CA]"
 */
export function parsePhotoCaption(description: string | undefined): {
  caption: string;
  location?: string;
  type?: 'together' | 'pranav' | 'pooja';
} {
  if (!description) {
    return { caption: '' };
  }

  let caption = description;
  let location: string | undefined;
  let type: 'together' | 'pranav' | 'pooja' | undefined;

  // Extract [Location] bracket notation
  const bracketMatch = description.match(/\[([^\]]+)\]/);
  if (bracketMatch) {
    location = bracketMatch[1];
    caption = caption.replace(bracketMatch[0], '').trim();
  }

  // Extract #location hashtag
  const hashtagMatch = description.match(/#(\w+)/);
  if (hashtagMatch && !location) {
    location = hashtagMatch[1];
  }

  // Extract type tags
  if (description.toLowerCase().includes('#pranav') || description.toLowerCase().includes('@pranav')) {
    type = 'pranav';
  } else if (description.toLowerCase().includes('#pooja') || description.toLowerCase().includes('@pooja')) {
    type = 'pooja';
  } else {
    type = 'together'; // Default assumption for shared album
  }

  return { caption, location, type };
}

/**
 * Reverse geocode coordinates to location name
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          'User-Agent': 'JourneyMap/2.0',
        },
      }
    );

    if (!response.ok) {
      return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
    }

    const data = await response.json();
    const address = data.address || {};
    const city = address.city || address.town || address.village || address.municipality || '';
    const country = address.country || '';

    return city && country ? `${city}, ${country}` : data.display_name?.split(',')[0] || 'Unknown';
  } catch {
    return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

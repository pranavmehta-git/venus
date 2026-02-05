// Types for the Journey Map application

export interface Photo {
  id: string;                    // Google Photos mediaItemId
  url?: string;                  // Fresh URL (fetched on-demand)
  caption: string;               // User-editable caption
  takenAt: string;               // ISO date string
}

export interface Location {
  id: string;                    // Unique location ID
  name: string;                  // "Tokyo, Japan"
  coords: [number, number];      // [lat, lng]
  type: 'together' | 'pranav' | 'pooja';
  year: number;
  photos: Photo[];
}

export interface JourneyData {
  locations: Location[];
  lastSynced: string;            // ISO timestamp
  albumId: string;               // Google Photos album ID
}

// Google Photos API response types
export interface GoogleMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
    photo?: {
      cameraMake?: string;
      cameraModel?: string;
    };
  };
  contributorInfo?: {
    profilePictureBaseUrl: string;
    displayName: string;
  };
}

export interface GoogleMediaItemsResponse {
  mediaItems: GoogleMediaItem[];
  nextPageToken?: string;
}

// Stored metadata in Vercel KV (without URLs, since they expire)
export interface StoredPhoto {
  id: string;                    // Google Photos mediaItemId
  caption: string;
  takenAt: string;
  lat: number;
  lng: number;
  contributor?: string;          // Who uploaded (for together/solo detection)
}

export interface StoredLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'together' | 'pranav' | 'pooja';
  year: number;
  photoIds: string[];            // Just the IDs, URLs fetched on-demand
}

// API response types
export interface PhotosApiResponse {
  locations: Location[];
  years: number[];
  lastSynced: string;
}

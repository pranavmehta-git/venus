import { kv } from '@vercel/kv';
import type { StoredLocation, StoredPhoto } from './types';

const LOCATIONS_KEY = 'journey:locations';
const PHOTOS_KEY = 'journey:photos';
const CAPTIONS_KEY = 'journey:captions';  // User-editable captions
const META_KEY = 'journey:meta';

export interface JourneyMeta {
  lastSynced: string;
  albumId: string;
  totalPhotos: number;
  years: number[];
}

/**
 * Store synced location data
 */
export async function storeLocations(locations: StoredLocation[]): Promise<void> {
  await kv.set(LOCATIONS_KEY, locations);
}

/**
 * Get all stored locations
 */
export async function getLocations(): Promise<StoredLocation[]> {
  return (await kv.get<StoredLocation[]>(LOCATIONS_KEY)) || [];
}

/**
 * Store photo metadata (without URLs)
 */
export async function storePhotos(photos: StoredPhoto[]): Promise<void> {
  await kv.set(PHOTOS_KEY, photos);
}

/**
 * Get all stored photos
 */
export async function getPhotos(): Promise<StoredPhoto[]> {
  return (await kv.get<StoredPhoto[]>(PHOTOS_KEY)) || [];
}

/**
 * Store/update user captions (separate from sync data)
 */
export async function setCaption(photoId: string, caption: string): Promise<void> {
  const captions = (await kv.get<Record<string, string>>(CAPTIONS_KEY)) || {};
  captions[photoId] = caption;
  await kv.set(CAPTIONS_KEY, captions);
}

/**
 * Get all user captions
 */
export async function getCaptions(): Promise<Record<string, string>> {
  return (await kv.get<Record<string, string>>(CAPTIONS_KEY)) || {};
}

/**
 * Store sync metadata
 */
export async function storeMeta(meta: JourneyMeta): Promise<void> {
  await kv.set(META_KEY, meta);
}

/**
 * Get sync metadata
 */
export async function getMeta(): Promise<JourneyMeta | null> {
  return await kv.get<JourneyMeta>(META_KEY);
}

/**
 * Get photos for specific location
 */
export async function getPhotosForLocation(locationId: string): Promise<StoredPhoto[]> {
  const locations = await getLocations();
  const location = locations.find(l => l.id === locationId);
  if (!location) return [];

  const allPhotos = await getPhotos();
  return allPhotos.filter(p => location.photoIds.includes(p.id));
}

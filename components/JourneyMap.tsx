'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location, PhotosApiResponse } from '@/lib/types';
import Lightbox from './Lightbox';

import 'leaflet/dist/leaflet.css';

// Custom marker icons
function createMarkerIcon(type: 'together' | 'pranav' | 'pooja') {
  const colors = {
    together: '#ff6b9d',
    pranav: '#64b5f6',
    pooja: '#ba68c8',
  };
  const emojis = {
    together: '💕',
    pranav: '👨',
    pooja: '👩',
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${colors[type]};
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s;
      ">${emojis[type]}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

// Component to auto-fit map bounds
function MapBounds({ locations }: { locations: Location[] }) {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(l => l.coords));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
    }
  }, [locations, map]);

  return null;
}

export default function JourneyMap() {
  const [data, setData] = useState<PhotosApiResponse | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    open: boolean;
    photos: { url?: string; caption: string }[];
    index: number;
    location: string;
  }>({ open: false, photos: [], index: 0, location: '' });

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/photos');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
        if (json.years?.length > 0) {
          setCurrentYear(Math.max(...json.years));
        }
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter locations by year
  const visibleLocations = data?.locations.filter(l => l.year <= currentYear) || [];
  const years = data?.years || [];
  const minYear = years.length > 0 ? Math.min(...years) : currentYear;
  const maxYear = years.length > 0 ? Math.max(...years) : currentYear;

  // Stats
  const togetherCount = visibleLocations.filter(l => l.type === 'together').length;
  const totalPhotos = visibleLocations.reduce((acc, l) => acc + l.photos.length, 0);

  const openLightbox = useCallback((location: Location) => {
    setLightbox({
      open: true,
      photos: location.photos,
      index: 0,
      location: location.name,
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-xl animate-pulse">Loading our journey... 💕</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="text-center">
          <div className="text-xl mb-4">Something went wrong 😢</div>
          <div className="text-sm opacity-70">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Header */}
      <header className="p-6 text-center bg-black/30 backdrop-blur-md text-white">
        <h1 className="text-2xl font-light tracking-widest mb-2">
          Pranav <span className="text-pink-400">♥</span> Pooja
        </h1>
        <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-rose-600 bg-clip-text text-transparent">
          {currentYear}
        </div>
      </header>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[30, 0]}
          zoom={2}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          <MapBounds locations={visibleLocations} />

          {visibleLocations.map(location => (
            <Marker
              key={location.id}
              position={location.coords}
              icon={createMarkerIcon(location.type)}
              eventHandlers={{
                click: () => openLightbox(location),
              }}
            >
              <Popup>
                <div className="text-center p-2">
                  <h3 className="font-semibold text-pink-500 mb-1">{location.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {location.year} · {location.photos.length} photo{location.photos.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => openLightbox(location)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white text-sm rounded-full hover:scale-105 transition-transform"
                  >
                    View Photos 📷
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Slider */}
      <div className="p-6 bg-black/40 backdrop-blur-md">
        <div className="max-w-xl mx-auto">
          <div className="flex justify-between text-white/70 text-sm mb-2">
            {years.map(year => (
              <span key={year}>{year}</span>
            ))}
          </div>
          
          <input
            type="range"
            min={minYear}
            max={maxYear}
            value={currentYear}
            onChange={e => setCurrentYear(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none
                       [&::-webkit-slider-thumb]:w-6
                       [&::-webkit-slider-thumb]:h-6
                       [&::-webkit-slider-thumb]:rounded-full
                       [&::-webkit-slider-thumb]:bg-gradient-to-r
                       [&::-webkit-slider-thumb]:from-pink-400
                       [&::-webkit-slider-thumb]:to-rose-600
                       [&::-webkit-slider-thumb]:shadow-lg
                       [&::-webkit-slider-thumb]:shadow-pink-500/50
                       [&::-webkit-slider-thumb]:cursor-pointer
                       [&::-webkit-slider-thumb]:transition-transform
                       [&::-webkit-slider-thumb]:hover:scale-125"
          />
          
          <div className="text-center text-white/80 text-sm mt-3">
            {visibleLocations.length} places · {totalPhotos} memories · {togetherCount} together 💕
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={lightbox.open}
        photos={lightbox.photos}
        currentIndex={lightbox.index}
        location={lightbox.location}
        onClose={() => setLightbox({ ...lightbox, open: false })}
        onNext={() => setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.photos.length })}
        onPrev={() => setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.photos.length) % lightbox.photos.length })}
      />
    </div>
  );
}

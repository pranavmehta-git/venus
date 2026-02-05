'use client';

import { useEffect, useCallback } from 'react';

interface LightboxProps {
  open: boolean;
  photos: { url?: string; caption: string }[];
  currentIndex: number;
  location: string;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({
  open,
  photos,
  currentIndex,
  location,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return;
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowRight':
        onNext();
        break;
      case 'ArrowLeft':
        onPrev();
        break;
    }
  }, [open, onClose, onNext, onPrev]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative max-w-[90vw] max-h-[85vh] text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white text-4xl opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Close"
        >
          ×
        </button>

        {/* Navigation - Previous */}
        {photos.length > 1 && (
          <button
            onClick={onPrev}
            className="absolute left-[-80px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Previous photo"
          >
            ‹
          </button>
        )}

        {/* Navigation - Next */}
        {photos.length > 1 && (
          <button
            onClick={onNext}
            className="absolute right-[-80px] top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20 transition-colors"
            aria-label="Next photo"
          >
            ›
          </button>
        )}

        {/* Image */}
        {currentPhoto?.url ? (
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption || 'Photo'}
            className="max-w-full max-h-[70vh] rounded-xl shadow-2xl"
          />
        ) : (
          <div className="w-[400px] h-[300px] bg-gray-800 rounded-xl flex items-center justify-center text-white/50">
            Photo unavailable
          </div>
        )}

        {/* Caption */}
        <div className="mt-6 text-white">
          <span className="text-pink-400 font-semibold">{location}</span>
          {currentPhoto?.caption && (
            <div className="mt-1 text-white/70">{currentPhoto.caption}</div>
          )}
        </div>

        {/* Counter */}
        {photos.length > 1 && (
          <div className="mt-4 text-white/50 text-sm">
            {currentIndex + 1} / {photos.length}
          </div>
        )}
      </div>
    </div>
  );
}

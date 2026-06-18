"use client";

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { X, ChevronLeft, ChevronRight, Grid2x2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AUTOPLAY_MS = 5000;

function usePrefersReducedMotion() {
  const subscribe = React.useCallback((callback) => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', callback);
    return () => media.removeEventListener('change', callback);
  }, []);

  const getSnapshot = React.useCallback(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function PhotoGallery({ photos = [], name = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const overlayRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const photoCount = photos?.length ?? 0;

  const openAt = (i) => { setCurrentIndex(i); setIsPaused(false); setLightboxOpen(true); };
  const prev = () => { setIsPaused(true); setCurrentIndex(i => (i - 1 + photoCount) % photoCount); };
  const next = () => { setIsPaused(true); setCurrentIndex(i => (i + 1) % photoCount); };
  const selectThumb = (i) => { setIsPaused(true); setCurrentIndex(i); };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

  // Lock body scroll and focus the overlay for keyboard navigation while open.
  useEffect(() => {
    if (!lightboxOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlayRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [lightboxOpen]);

  // Auto-advance once through all photos, then stop on the last image.
  const canAutoplay =
    lightboxOpen &&
    !isPaused &&
    !prefersReducedMotion &&
    photoCount > 1 &&
    currentIndex < photoCount - 1;

  useEffect(() => {
    if (!canAutoplay) return;
    const timer = window.setInterval(() => {
      setCurrentIndex(i => Math.min(i + 1, photoCount - 1));
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [canAutoplay, photoCount]);

  if (!photos || photos.length === 0) return null;

  const main = photos[0];
  const thumbs = photos.slice(1, 5);

  return (
    <>
      {/* Airbnb-style grid */}
      <div className="relative rounded-2xl overflow-hidden">
        {photos.length === 1 ? (
          <div className="h-72 lg:h-96 cursor-pointer" onClick={() => openAt(0)}>
            <img src={main} alt={name} className="w-full h-full object-cover hover:brightness-95 transition-all" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 h-72 lg:h-96">
            {/* Large main photo */}
            <div
              className={`${photos.length >= 3 ? 'col-span-2 row-span-2' : 'col-span-2'} cursor-pointer overflow-hidden rounded-l-2xl`}
              onClick={() => openAt(0)}
            >
              <img src={main} alt={name} className="w-full h-full object-cover hover:brightness-95 transition-all" />
            </div>
            {/* Thumbnails */}
            {thumbs.map((img, i) => (
              <div
                key={i}
                className={`cursor-pointer overflow-hidden relative ${i === 1 ? 'rounded-tr-2xl' : ''} ${i === 3 ? 'rounded-br-2xl' : ''}`}
                onClick={() => openAt(i + 1)}
              >
                <img src={img} alt={`${name} ${i + 2}`} className="w-full h-full object-cover hover:brightness-90 transition-all" />
                {/* "Show all" overlay on last visible thumb */}
                {i === 3 && photos.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">+{photos.length - 5} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Show all photos button */}
        {photos.length > 1 && (
          <button
            onClick={() => openAt(0)}
            className="absolute bottom-3 right-3 bg-white text-foreground text-sm font-semibold px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5 border border-border hover:bg-muted transition-colors"
          >
            <Grid2x2 className="w-4 h-4" /> Show all photos
          </button>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col outline-none"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-white/70 text-sm">{currentIndex + 1} / {photos.length}</span>
            <span className="text-white font-semibold">{name}</span>
            <button onClick={() => setLightboxOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center px-16 relative">
            <img
              src={photos[currentIndex]}
              alt={`${name} ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Navigation — fixed to viewport center, always visible */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous photo"
                className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={next}
                aria-label="Next photo"
                className="fixed right-4 top-1/2 -translate-y-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white rounded-full p-3 backdrop-blur-sm transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Thumbnails strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 px-5 py-4 overflow-x-auto justify-center">
              {photos.map((img, i) => (
                <div
                  key={i}
                  onClick={() => selectThumb(i)}
                  className={`w-16 h-12 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${i === currentIndex ? 'border-white' : 'border-transparent opacity-60 hover:opacity-90'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
"use client";

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Grid2x2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PhotoGallery({ photos = [], name = '' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  const main = photos[0];
  const thumbs = photos.slice(1, 5);

  const openAt = (i) => { setCurrentIndex(i); setLightboxOpen(true); };
  const prev = () => setCurrentIndex(i => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrentIndex(i => (i + 1) % photos.length);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') setLightboxOpen(false);
  };

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
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          autoFocus
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
          <div className="flex-1 flex items-center justify-center px-4 relative">
            <button onClick={prev} className="absolute left-4 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <img
              src={photos[currentIndex]}
              alt={`${name} ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain rounded-xl"
            />
            <button onClick={next} className="absolute right-4 bg-white/10 hover:bg-white/25 text-white rounded-full p-2 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Thumbnails strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 px-5 py-4 overflow-x-auto justify-center">
              {photos.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentIndex(i)}
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
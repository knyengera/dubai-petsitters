"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ value = 0, onChange, size = 'md', showValue = false }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' };
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map(star => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={cn('transition-transform', onChange && 'hover:scale-110 cursor-pointer', !onChange && 'cursor-default')}
        >
          <Star
            className={cn(sizes[size], star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300 fill-slate-100')}
          />
        </button>
      ))}
      {showValue && value > 0 && (
        <span className="ml-1 text-sm font-bold text-foreground">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X, Star, RotateCcw } from 'lucide-react';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha'];
const SERVICE_TAGS = ['boarding', 'daycare', 'home_sitting', 'dog_walking'];
const SERVICE_LABELS = { boarding: 'Boarding', daycare: 'Daycare', home_sitting: 'Home Sitting', dog_walking: 'Dog Walking' };
const PET_TYPES = ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other'];
const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'city_asc', label: 'City: A–Z' },
];

export const DEFAULT_HOST_FILTERS = {
  search: '', city: 'all', neighborhood: '', services: [], petTypes: [],
  minRating: 0, maxPrice: 2000, availableOnly: true, sortBy: 'rating_desc',
};

export function applyHostFilters(hosts, filters) {
  let result = [...hosts];
  if (filters.availableOnly) result = result.filter(h => h.is_available);
  if (filters.city !== 'all') result = result.filter(h => h.city === filters.city);
  if (filters.neighborhood && filters.neighborhood.trim()) {
    const q = filters.neighborhood.toLowerCase();
    result = result.filter(h => h.neighborhood?.toLowerCase().includes(q));
  }
  if (filters.services.length > 0) result = result.filter(h => filters.services.every(s => h.services?.includes(s)));
  if (filters.petTypes.length > 0) result = result.filter(h => filters.petTypes.some(p => h.accepted_pet_types?.includes(p)));
  if (filters.minRating > 0) result = result.filter(h => (h.rating || 0) >= filters.minRating);
  if (filters.maxPrice < 2000) result = result.filter(h => (h.price_per_night || h.price_per_day || 0) <= filters.maxPrice);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(h => h.full_name?.toLowerCase().includes(q) || h.city?.toLowerCase().includes(q));
  }
  if (filters.sortBy === 'rating_desc') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (filters.sortBy === 'price_asc') result.sort((a, b) => (a.price_per_night || a.price_per_day || 0) - (b.price_per_night || b.price_per_day || 0));
  if (filters.sortBy === 'price_desc') result.sort((a, b) => (b.price_per_night || b.price_per_day || 0) - (a.price_per_night || a.price_per_day || 0));
  if (filters.sortBy === 'city_asc') result.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
  return result;
}

function countActiveFilters(f) {
  let n = 0;
  if (f.city !== 'all') n++;
  if (f.neighborhood && f.neighborhood.trim()) n++;
  if (f.services.length) n++;
  if (f.petTypes.length) n++;
  if (f.minRating > 0) n++;
  if (f.maxPrice < 2000) n++;
  if (!f.availableOnly) n++;
  return n;
}

export default function HostFilters({ filters, onChange }) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  const set = (key, val) => onChange({ ...filters, [key]: val });

  const toggleArr = (key, val) => {
    const arr = filters[key];
    onChange({ ...filters, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] });
  };

  return (
    <div className="space-y-3 mb-8">
      {/* Search + toggle row */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or neighborhood..."
            value={filters.search}
            onChange={e => set('search', e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filters.sortBy} onValueChange={v => set('sortBy', v)}>
          <SelectTrigger className="w-48 rounded-xl shrink-0"><SelectValue /></SelectTrigger>
          <SelectContent>{SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
        <Button
          variant={open ? 'default' : 'outline'}
          onClick={() => setOpen(v => !v)}
          className="rounded-xl gap-2 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters {active > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{active}</Badge>}
        </Button>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* City */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">City</Label>
            <Select value={filters.city} onValueChange={v => set('city', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="All Cities" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {CITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Neighborhood */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Neighborhood</Label>
            <Input
              placeholder="e.g., Al Olaya"
              value={filters.neighborhood}
              onChange={e => set('neighborhood', e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Min Rating */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Minimum Rating</Label>
            <div className="flex gap-1">
              {[0, 3, 3.5, 4, 4.5].map(r => (
                <button
                  key={r}
                  onClick={() => set('minRating', r)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${filters.minRating === r ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {r === 0 ? 'Any' : <><Star className="w-3 h-3 fill-current" />{r}+</>}
                </button>
              ))}
            </div>
          </div>

          {/* Max Price */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Max Price: SAR {filters.maxPrice === 2000 ? 'Any' : filters.maxPrice}
            </Label>
            <Slider
              min={50} max={2000} step={50}
              value={[filters.maxPrice]}
              onValueChange={(v) => set('maxPrice', Array.isArray(v) ? v[0] : v)}
              className="mt-3"
            />
          </div>

          {/* Availability */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Availability</Label>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${filters.availableOnly ? 'bg-emerald-50 border-emerald-300' : 'border-border'}`}
              onClick={() => set('availableOnly', !filters.availableOnly)}
            >
              <Checkbox checked={filters.availableOnly} onCheckedChange={v => set('availableOnly', v)} />
              <span className="text-sm">Available Now</span>
            </div>
          </div>

          {/* Services */}
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Services</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TAGS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArr('services', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.services.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {SERVICE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Pet Types */}
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Accepts Pet Type</Label>
            <div className="flex flex-wrap gap-2">
              {PET_TYPES.map(p => (
                <button
                  key={p}
                  onClick={() => toggleArr('petTypes', p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ${filters.petTypes.includes(p) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {active > 0 && (
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_HOST_FILTERS)} className="gap-1 text-muted-foreground">
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {active > 0 && !open && (
        <div className="flex flex-wrap gap-2">
          {filters.city !== 'all' && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('city', 'all')}>{filters.city}<X className="w-3 h-3" /></Badge>}
          {filters.neighborhood && filters.neighborhood.trim() && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('neighborhood', '')}>{filters.neighborhood}<X className="w-3 h-3" /></Badge>}
          {filters.services.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleArr('services', s)}>{SERVICE_LABELS[s]}<X className="w-3 h-3" /></Badge>)}
          {filters.petTypes.map(p => <Badge key={p} variant="secondary" className="gap-1 capitalize cursor-pointer" onClick={() => toggleArr('petTypes', p)}>{p}<X className="w-3 h-3" /></Badge>)}
          {filters.minRating > 0 && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('minRating', 0)}><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{filters.minRating}+<X className="w-3 h-3" /></Badge>}
          {filters.maxPrice < 2000 && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('maxPrice', 2000)}>≤ SAR {filters.maxPrice}<X className="w-3 h-3" /></Badge>}
        </div>
      )}
    </div>
  );
}
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, SlidersHorizontal, X, Star, RotateCcw } from 'lucide-react';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha'];
const SPECIALTY_TAGS = ['Dogs', 'Cats', 'Birds', 'Exotic Animals', 'Dental', 'Surgery', 'Dermatology', 'Ophthalmology', 'Oncology', 'Orthopedics'];
const SERVICE_TAGS = ['Vaccination', 'Grooming', 'X-Ray', 'Lab Tests', 'Microchipping', 'Emergency', 'Physiotherapy'];
const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'emergency_first', label: 'Emergency First' },
  { value: 'city_asc', label: 'City: A–Z' },
];

export const DEFAULT_VET_FILTERS = {
  search: '', city: 'all', emergencyOnly: false,
  minRating: 0, specialties: [], services: [], sortBy: 'rating_desc', neighborhood: '',
};

export function applyVetFilters(clinics, filters) {
  let result = [...clinics];
  if (filters.city !== 'all') result = result.filter(c => c.city === filters.city);
  if (filters.neighborhood && filters.neighborhood.trim()) {
    const q = filters.neighborhood.toLowerCase();
    result = result.filter(c => c.address?.toLowerCase().includes(q));
  }
  if (filters.emergencyOnly) result = result.filter(c => c.emergency_available);
  if (filters.minRating > 0) result = result.filter(c => (c.rating || 0) >= filters.minRating);
  if (filters.specialties.length > 0) result = result.filter(c =>
    filters.specialties.some(s => c.specialties?.some(cs => cs.toLowerCase().includes(s.toLowerCase())))
  );
  if (filters.services.length > 0) result = result.filter(c =>
    filters.services.some(s => c.services?.some(cs => cs.toLowerCase().includes(s.toLowerCase())))
  );
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(c => c.name?.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q));
  }
  if (filters.sortBy === 'rating_desc') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (filters.sortBy === 'name_asc') result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (filters.sortBy === 'emergency_first') result.sort((a, b) => (b.emergency_available ? 1 : 0) - (a.emergency_available ? 1 : 0));
  if (filters.sortBy === 'city_asc') result.sort((a, b) => (a.city || '').localeCompare(b.city || ''));
  return result;
}

function countActiveFilters(f) {
  let n = 0;
  if (f.city !== 'all') n++;
  if (f.neighborhood && f.neighborhood.trim()) n++;
  if (f.emergencyOnly) n++;
  if (f.minRating > 0) n++;
  if (f.specialties.length) n++;
  if (f.services.length) n++;
  return n;
}

export default function VetFilters({ filters, onChange }) {
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
            placeholder="Search clinics by name or city..."
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
        <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Area/Address</Label>
            <Input
              placeholder="e.g., downtown"
              value={filters.neighborhood}
              onChange={e => set('neighborhood', e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Min Rating */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Minimum Rating</Label>
            <div className="flex gap-1 flex-wrap">
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

          {/* Emergency */}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Availability</Label>
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${filters.emergencyOnly ? 'bg-red-50 border-red-300' : 'border-border'}`}
              onClick={() => set('emergencyOnly', !filters.emergencyOnly)}
            >
              <Checkbox checked={filters.emergencyOnly} onCheckedChange={v => set('emergencyOnly', v)} />
              <span className="text-sm">24/7 Emergency Only</span>
            </div>
          </div>

          {/* Specialties */}
          <div className="sm:col-span-2 lg:col-span-2">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Specialties</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALTY_TAGS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArr('specialties', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.specialties.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Services Offered</Label>
            <div className="flex flex-wrap gap-2">
              {SERVICE_TAGS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleArr('services', s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filters.services.includes(s) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Reset */}
          {active > 0 && (
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
              <Button variant="ghost" size="sm" onClick={() => onChange(DEFAULT_VET_FILTERS)} className="gap-1 text-muted-foreground">
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
          {filters.emergencyOnly && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('emergencyOnly', false)}>24/7 Emergency<X className="w-3 h-3" /></Badge>}
          {filters.specialties.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleArr('specialties', s)}>{s}<X className="w-3 h-3" /></Badge>)}
          {filters.services.map(s => <Badge key={s} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleArr('services', s)}>{s}<X className="w-3 h-3" /></Badge>)}
          {filters.minRating > 0 && <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => set('minRating', 0)}><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{filters.minRating}+<X className="w-3 h-3" /></Badge>}
        </div>
      )}
    </div>
  );
}
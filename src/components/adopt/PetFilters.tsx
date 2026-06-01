import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function PetFilters({ filters, setFilters }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search pets..."
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          className="pl-10 rounded-xl"
        />
      </div>

      <Select value={filters.species} onValueChange={(v) => setFilters(f => ({ ...f, species: v }))}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="All Species" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Species</SelectItem>
          <SelectItem value="dog">Dogs</SelectItem>
          <SelectItem value="cat">Cats</SelectItem>
          <SelectItem value="bird">Birds</SelectItem>
          <SelectItem value="rabbit">Rabbits</SelectItem>
          <SelectItem value="fish">Fish</SelectItem>
          <SelectItem value="reptile">Reptiles</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.gender} onValueChange={(v) => setFilters(f => ({ ...f, gender: v }))}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Any Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Gender</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.size} onValueChange={(v) => setFilters(f => ({ ...f, size: v }))}>
        <SelectTrigger className="rounded-xl">
          <SelectValue placeholder="Any Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Size</SelectItem>
          <SelectItem value="small">Small</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="large">Large</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
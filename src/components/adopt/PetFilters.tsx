import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const speciesItems = {
  all: 'All Species',
  dog: 'Dogs',
  cat: 'Cats',
  bird: 'Birds',
  rabbit: 'Rabbits',
  fish: 'Fish',
  reptile: 'Reptiles',
  other: 'Other',
};

const genderItems = {
  all: 'Any Gender',
  male: 'Male',
  female: 'Female',
};

const sizeItems = {
  all: 'Any Size',
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

export default function PetFilters({ filters, setFilters }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search pets..."
          value={filters.search}
          onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          className="pl-10 rounded-xl"
        />
      </div>

      <Select items={speciesItems} value={filters.species} onValueChange={(v) => setFilters(f => ({ ...f, species: v }))}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
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

      <Select items={genderItems} value={filters.gender} onValueChange={(v) => setFilters(f => ({ ...f, gender: v }))}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
          <SelectValue placeholder="Any Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any Gender</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>

      <Select items={sizeItems} value={filters.size} onValueChange={(v) => setFilters(f => ({ ...f, size: v }))}>
        <SelectTrigger className="w-full sm:w-44 rounded-xl">
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

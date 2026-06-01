"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Shield, Clock, Heart, CheckCircle, Star, Users, Search, Loader2 } from 'lucide-react';
import HostCard from '@/components/hosts/HostCard';
import HostBookingModal from '@/components/hosting/HostBookingModal';

const benefits = [
  { icon: Shield, text: 'Verified & Trusted Sitters' },
  { icon: Clock, text: '24/7 Support Available' },
  { icon: Heart, text: 'Insurance Coverage' },
  { icon: CheckCircle, text: 'Satisfaction Guaranteed' },
];

export default function Hosting() {
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedHost, setSelectedHost] = useState(null);

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['pet-hosts-hosting'],
    queryFn: () => entities.PetHost.filter({ is_available: true }, '-rating'),
    initialData: [],
  });

  const filtered = hosts.filter(h => {
    if (cityFilter !== 'all' && h.city !== cityFilter) return false;
    if (search && !h.full_name?.toLowerCase().includes(search.toLowerCase()) && !h.neighborhood?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cities = [...new Set(hosts.map(h => h.city).filter(Boolean))];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-3 mb-8">
          <Link href="/hosts">
            <Button className="rounded-xl px-6 font-bold">
              <Users className="w-4 h-4 mr-2" /> Browse All Hosts
            </Button>
          </Link>
          <Link href="/become-host">
            <Button variant="outline" className="rounded-xl px-6">
              <Star className="w-4 h-4 mr-2" /> Become a Host
            </Button>
          </Link>
        </div>
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or neighborhood..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue placeholder="All Cities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Host Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No hosts found. Try adjusting your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-14">
            {filtered.map((host, i) => (
              <motion.div key={host.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div onClick={() => setSelectedHost(host)} className="cursor-pointer h-full">
                  <HostCard host={host} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
              <b.icon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm font-medium text-foreground">{b.text}</span>
            </div>
          ))}
        </div>

      </div>

      <HostBookingModal host={selectedHost} open={!!selectedHost} onClose={() => setSelectedHost(null)} />
    </div>
  );
}
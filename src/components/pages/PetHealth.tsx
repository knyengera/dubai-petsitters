"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HealthOverview from '@/components/health/HealthOverview';
import VaccinationLog from '@/components/health/VaccinationLog';
import MedicalLog from '@/components/health/MedicalLog';
import WeightTracker from '@/components/health/WeightTracker';
import HealthPDFExport from '@/components/health/HealthPDFExport';

export default function PetHealth() {
  const { petId } = useParams();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: pet, isLoading: petLoading } = useQuery({
    queryKey: ['pet', petId],
    queryFn: () => entities.UserPet.get(petId),
    enabled: !!petId,
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations', petId],
    queryFn: () => entities.Vaccination.filter({ pet_id: petId }, '-date_given'),
    enabled: !!petId,
  });

  const { data: medicalRecords = [] } = useQuery({
    queryKey: ['medicalRecords', petId],
    queryFn: () => entities.MedicalRecord.filter({ pet_id: petId }, '-date'),
    enabled: !!petId,
  });

  if (petLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Pet not found</p>
          <Link href="/pets">
            <Button variant="outline">Back to Pets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vaccinations', label: 'Vaccinations' },
    { id: 'medical', label: 'Medical Records' },
    { id: 'weight', label: 'Weight Tracking' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <Link href="/pets" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Pets</span>
        </Link>
        <p className="text-muted-foreground text-sm capitalize mb-4">
          {pet.name} · {pet.species} • {pet.breed || 'Mixed'}
        </p>
        <HealthPDFExport pet={pet} vaccinations={vaccinations} medicalRecords={medicalRecords} />
      </div>

      {/* Tabs */}
      <div className="border-b border-border sticky top-0 bg-card/80 backdrop-blur-sm z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {activeTab === 'overview' && <HealthOverview pet={pet} vaccinations={vaccinations} medicalRecords={medicalRecords} />}
        {activeTab === 'vaccinations' && <VaccinationLog petId={petId} vaccinations={vaccinations} />}
        {activeTab === 'medical' && <MedicalLog petId={petId} medicalRecords={medicalRecords} />}
        {activeTab === 'weight' && <WeightTracker pet={pet} petId={petId} />}
      </div>
    </div>
  );
}
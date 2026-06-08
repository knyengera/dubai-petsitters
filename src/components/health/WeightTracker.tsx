"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function WeightTracker({ pet, petId }) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const queryClient = useQueryClient();

  const { mutate: updateWeight, isPending } = useMutation({
    mutationFn: async () => {
      return entities.UserPet.update(petId, {
        weight_kg: parseFloat(weight),
      });
    },
    onSuccess: () => {
      toast.success('Weight updated');
      setOpen(false);
      setWeight('');
      setDate(new Date().toISOString().split('T')[0]);
      queryClient.invalidateQueries({ queryKey: ['pet', petId] });
    },
    onError: () => {
      toast.error('Failed to update weight');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weight) {
      toast.error('Please enter a weight');
      return;
    }
    updateWeight();
  };

  const currentWeight = pet?.weight_kg;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Weight Tracking</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Log Weight
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Weight</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Enter weight in kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Weight'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Weight Card */}
      {currentWeight && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-8">
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-2">Current Weight</p>
            <p className="text-5xl font-bold text-foreground mb-2">{currentWeight} <span className="text-2xl text-muted-foreground">kg</span></p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>Last updated</span>
            </div>
          </div>
        </motion.div>
      )}

      {!currentWeight && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 bg-card border border-border rounded-xl">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">⚖️</span>
          </div>
          <p className="text-muted-foreground mb-4">No weight recorded yet. Start tracking your pet's weight for health monitoring.</p>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl">
                Log First Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Initial Weight</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="weight">Weight (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter weight in kg"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-2"
                  />
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
                  {isPending ? 'Saving...' : 'Save Weight'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>
      )}

      {/* Health Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-info-muted border border-info-border rounded-xl p-6">
        <h3 className="font-semibold text-info mb-3">Weight Monitoring Tips</h3>
        <ul className="space-y-2 text-sm text-info/90">
          <li className="flex items-start gap-2">
            <span className="text-lg mt-0.5">📊</span>
            <span>Regular weigh-ins help track your pet's health and detect weight-related issues early</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg mt-0.5">📅</span>
            <span>Try to weigh your pet at the same time of day for consistent measurements</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg mt-0.5">⚖️</span>
            <span>Discuss ideal weight ranges with your veterinarian based on breed and age</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-lg mt-0.5">💪</span>
            <span>Maintain healthy weight through proper nutrition and regular exercise</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
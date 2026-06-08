"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, CheckCircle2, Calendar, User, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function VaccinationLog({ petId, vaccinations }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    vaccine_name: '',
    date_given: '',
    next_due_date: '',
    administered_by: '',
    clinic_name: '',
    batch_number: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { mutate: addVaccination, isPending } = useMutation({
    mutationFn: async () => {
      const vaccinationData = {
        pet_id: petId,
        pet_name: '', // Will be filled by backend or from pet data
        ...formData,
      };
      return entities.Vaccination.create(vaccinationData);
    },
    onSuccess: () => {
      toast.success('Vaccination recorded');
      setOpen(false);
      setFormData({
        vaccine_name: '',
        date_given: '',
        next_due_date: '',
        administered_by: '',
        clinic_name: '',
        batch_number: '',
        notes: '',
      });
      queryClient.invalidateQueries({ queryKey: ['vaccinations', petId] });
    },
    onError: () => {
      toast.error('Failed to record vaccination');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.vaccine_name || !formData.date_given) {
      toast.error('Please fill in all required fields');
      return;
    }
    addVaccination();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Vaccination Records</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Log Vaccination
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Vaccination</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="vaccine">Vaccine Name *</Label>
                <Input
                  id="vaccine"
                  placeholder="e.g., Rabies, DHPP"
                  value={formData.vaccine_name}
                  onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="date_given">Date Given *</Label>
                <Input
                  id="date_given"
                  type="date"
                  value={formData.date_given}
                  onChange={(e) => setFormData({ ...formData, date_given: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="next_due">Next Due Date</Label>
                <Input
                  id="next_due"
                  type="date"
                  value={formData.next_due_date}
                  onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="vet">Administered By</Label>
                <Input
                  id="vet"
                  placeholder="Veterinarian name"
                  value={formData.administered_by}
                  onChange={(e) => setFormData({ ...formData, administered_by: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="clinic">Clinic Name</Label>
                <Input
                  id="clinic"
                  placeholder="Clinic name"
                  value={formData.clinic_name}
                  onChange={(e) => setFormData({ ...formData, clinic_name: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="batch">Batch Number</Label>
                <Input
                  id="batch"
                  placeholder="Batch number"
                  value={formData.batch_number}
                  onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Vaccination'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vaccination List */}
      {vaccinations.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No vaccinations recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vaccinations.map((vac, i) => (
            <motion.div
              key={vac.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <h3 className="font-semibold text-lg text-foreground">{vac.vaccine_name}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Administered: {format(new Date(vac.date_given), 'MMM dd, yyyy')}</span>
                    </div>

                    {vac.next_due_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Next Due: {format(new Date(vac.next_due_date), 'MMM dd, yyyy')}</span>
                      </div>
                    )}

                    {vac.administered_by && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" />
                        <span>{vac.administered_by}</span>
                      </div>
                    )}

                    {vac.clinic_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="w-4 h-4" />
                        <span>{vac.clinic_name}</span>
                      </div>
                    )}
                  </div>

                  {vac.batch_number && (
                    <p className="text-xs text-muted-foreground mt-3">Batch: {vac.batch_number}</p>
                  )}

                  {vac.notes && (
                    <p className="text-sm text-muted-foreground mt-3 italic">{vac.notes}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
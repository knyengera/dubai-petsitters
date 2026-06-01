"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, FileText, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function MedicalLog({ petId, medicalRecords }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    pet_name: '',
    date: '',
    type: 'note',
    title: '',
    description: '',
    vet_name: '',
    clinic_name: '',
    follow_up_date: '',
  });

  const queryClient = useQueryClient();

  const { mutate: addRecord, isPending } = useMutation({
    mutationFn: async () => {
      return entities.MedicalRecord.create({
        pet_id: petId,
        ...formData,
      });
    },
    onSuccess: () => {
      toast.success('Medical record added');
      setOpen(false);
      setFormData({
        pet_name: '',
        date: '',
        type: 'note',
        title: '',
        description: '',
        vet_name: '',
        clinic_name: '',
        follow_up_date: '',
      });
      queryClient.invalidateQueries({ queryKey: ['medicalRecords', petId] });
    },
    onError: () => {
      toast.error('Failed to add medical record');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }
    addRecord();
  };

  const typeLabels = {
    diagnosis: 'Diagnosis',
    treatment: 'Treatment',
    surgery: 'Surgery',
    lab_result: 'Lab Result',
    prescription: 'Prescription',
    note: 'Note',
  };

  const typeColors = {
    diagnosis: 'text-red-600',
    treatment: 'text-blue-600',
    surgery: 'text-purple-600',
    lab_result: 'text-orange-600',
    prescription: 'text-emerald-600',
    note: 'text-slate-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Medical Records</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl">
              <Plus className="w-4 h-4" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Medical Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="type">Record Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
                >
                  {Object.entries(typeLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Ear Infection Treatment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Details about the treatment or diagnosis"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background text-sm"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="vet">Veterinarian Name</Label>
                <Input
                  id="vet"
                  placeholder="Vet name"
                  value={formData.vet_name}
                  onChange={(e) => setFormData({ ...formData, vet_name: e.target.value })}
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
                <Label htmlFor="follow_up">Follow-up Date</Label>
                <Input
                  id="follow_up"
                  type="date"
                  value={formData.follow_up_date}
                  onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                  className="mt-2"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Medical Records List */}
      {medicalRecords.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No medical records yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {medicalRecords.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={`p-2 rounded-lg bg-card`}>
                  <FileText className={`w-5 h-5 ${typeColors[record.type]}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg text-foreground">{record.title}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full bg-primary/10 ${typeColors[record.type]}`}>
                      {typeLabels[record.type]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {record.description && (
                <p className="text-sm text-muted-foreground mb-3">{record.description}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {record.vet_name && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    {record.vet_name}
                  </div>
                )}
                {record.clinic_name && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Clinic:</span> {record.clinic_name}
                  </div>
                )}
              </div>

              {record.follow_up_date && (
                <div className="mt-3 text-sm text-amber-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Follow-up: {format(new Date(record.follow_up_date), 'MMM dd, yyyy')}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
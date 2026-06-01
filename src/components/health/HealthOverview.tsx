"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Calendar, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function HealthOverview({ pet, vaccinations, medicalRecords }) {
  const upcomingVaccines = vaccinations.filter(v => {
    if (!v.next_due_date) return false;
    const dueDate = new Date(v.next_due_date);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue >= 0 && daysUntilDue <= 30;
  });

  const allergies = pet.allergies || [];
  const medications = pet.medications || [];

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Total Vaccinations</p>
              <p className="text-3xl font-bold text-foreground">{vaccinations.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Medical Records</p>
              <p className="text-3xl font-bold text-foreground">{medicalRecords.length}</p>
            </div>
            <FileText className="w-8 h-8 text-primary" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Allergies</p>
              <p className="text-3xl font-bold text-foreground">{allergies.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Weight</p>
              <p className="text-3xl font-bold text-foreground">{pet.weight_kg || '—'} <span className="text-lg">kg</span></p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">⚖️</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Upcoming Vaccinations Alert */}
      {upcomingVaccines.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-2">Upcoming Vaccinations</h3>
              <div className="space-y-2">
                {upcomingVaccines.map(v => (
                  <p key={v.id} className="text-sm text-amber-800">
                    <span className="font-medium">{v.vaccine_name}</span> is due on {format(new Date(v.next_due_date), 'MMM dd, yyyy')}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Allergies & Medications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Allergies */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3 className="font-semibold text-lg text-foreground mb-4">Allergies</h3>
          {allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {allergies.map((allergy, i) => (
                <Badge key={i} variant="destructive" className="capitalize">
                  {allergy}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No known allergies recorded.</p>
          )}
        </motion.div>

        {/* Medications */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <h3 className="font-semibold text-lg text-foreground mb-4">Current Medications</h3>
          {medications.length > 0 ? (
            <div className="space-y-2">
              {medications.map((med, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{med}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No medications recorded.</p>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      {(vaccinations.length > 0 || medicalRecords.length > 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
          <h3 className="font-semibold text-lg text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[...vaccinations.slice(0, 2), ...medicalRecords.slice(0, 2)]
              .sort((a, b) => new Date(b.date_given || b.date) - new Date(a.date_given || a.date))
              .slice(0, 4)
              .map((item, i) => (
                <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0">
                  {item.vaccine_name ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.vaccine_name}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.date_given), 'MMM dd, yyyy')}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(item.date), 'MMM dd, yyyy')}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
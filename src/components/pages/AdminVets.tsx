"use client";

import { base44 } from "@/lib/data";

import { useState, useEffect } from 'react';
import type { AuthUser } from '@/lib/data/auth-api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Plus, Stethoscope, Loader2, Trash2, Star } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import { useToast } from '@/components/ui/use-toast';

const EMPTY_FORM = {
  name: '', city: '', address: '', phone: '', email: '',
  website: '', opening_hours: '', emergency_available: false,
  is_featured: false, image_url: '',
};

export default function AdminVets() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: vets = [], isLoading } = useQuery({
    queryKey: ['admin-vets'],
    queryFn: () => entities.VetClinic.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Access restricted to admins only.</p>
      </div>
    );
  }

  const handleApprove = async (vet) => {
    await entities.VetClinic.update(vet.id, { is_approved: !vet.is_approved });
    queryClient.invalidateQueries(['admin-vets']);
    toast({ title: vet.is_approved ? 'Approval removed' : `${vet.name} approved!` });
  };

  const handleFeature = async (vet) => {
    await entities.VetClinic.update(vet.id, { is_featured: !vet.is_featured });
    queryClient.invalidateQueries(['admin-vets']);
  };

  const handleDelete = async (vet) => {
    if (!confirm(`Delete ${vet.name}?`)) return;
    await entities.VetClinic.delete(vet.id);
    queryClient.invalidateQueries(['admin-vets']);
    toast({ title: 'Vet removed' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await entities.VetClinic.create({ ...form, is_approved: true });
    queryClient.invalidateQueries(['admin-vets']);
    toast({ title: `${form.name} added & approved!` });
    setForm(EMPTY_FORM);
    setShowForm(false);
    setSaving(false);
  };

  const approved = vets.filter(v => v.is_approved);
  const pending = vets.filter(v => !v.is_approved);

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Free listings during launch · {approved.length} approved · {pending.length} pending
          </p>
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Add Vet
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Approved */}
            <section>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Approved Vets ({approved.length})
              </h2>
              <div className="space-y-3">
                {approved.map(vet => <VetRow key={vet.id} vet={vet} onApprove={handleApprove} onFeature={handleFeature} onDelete={handleDelete} />)}
                {approved.length === 0 && <p className="text-sm text-muted-foreground">No approved vets yet.</p>}
              </div>
            </section>

            {/* Pending */}
            {pending.length > 0 && (
              <section>
                <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-orange-400" /> Pending Approval ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map(vet => <VetRow key={vet.id} vet={vet} onApprove={handleApprove} onFeature={handleFeature} onDelete={handleDelete} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Add Vet Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Trusted Vet (Free Listing)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Clinic Name *</Label>
                <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">City *</Label>
                <Input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="rounded-xl" placeholder="https://" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Address</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Opening Hours</Label>
                <Input value={form.opening_hours} onChange={e => setForm(f => ({ ...f, opening_hours: e.target.value }))} className="rounded-xl" placeholder="e.g. Sun–Thu 9am–6pm" />
              </div>
              <div className="col-span-2 flex flex-col items-center">
                <Label className="mb-2 block self-start">Clinic Photo</Label>
                <ImageUpload value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} label="Upload Clinic Photo" variant="wide" className="w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="emergency" checked={form.emergency_available} onChange={e => setForm(f => ({ ...f, emergency_available: e.target.checked }))} />
                <Label htmlFor="emergency">Emergency Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add & Approve'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VetRow({ vet, onApprove, onFeature, onDelete }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      {vet.image_url ? (
        <img src={vet.image_url} alt={vet.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6 text-emerald-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          {vet.name}
          {vet.is_approved && <Badge className="text-[10px] bg-emerald-500 text-white">Approved</Badge>}
          {vet.is_featured && <Badge className="text-[10px] bg-amber-500 text-white">Featured</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">{vet.city}{vet.address ? ` · ${vet.address}` : ''}</p>
        {vet.phone && <p className="text-xs text-muted-foreground">{vet.phone}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onApprove(vet)}
          title={vet.is_approved ? 'Remove approval' : 'Approve'}
          className={`p-2 rounded-lg transition-colors ${vet.is_approved ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50'}`}
        >
          <CheckCircle className="w-5 h-5" />
        </button>
        <button
          onClick={() => onFeature(vet)}
          title={vet.is_featured ? 'Unfeature' : 'Feature'}
          className={`p-2 rounded-lg transition-colors ${vet.is_featured ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-50'}`}
        >
          <Star className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(vet)}
          title="Delete"
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
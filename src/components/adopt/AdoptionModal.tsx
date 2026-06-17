"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { entities } from '@/lib/data/entities';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { Heart, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import StartChatButton from '@/components/messaging/StartChatButton';

const EMPTY_FORM = {
  applicant_name: '',
  applicant_email: '',
  applicant_phone: '',
  city: '',
  housing_type: '',
  has_pets: false,
  experience: '',
  message: '',
};

export default function AdoptionModal({ pet, open, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const created = await entities.AdoptionRequest.create({
        ...form,
        pet_id: pet.id,
      });
      toast({ title: 'Application Submitted!', description: `Your adoption request for ${pet.name} has been received. We'll be in touch soon!` });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
      setSubmittedRequest(created);
    } catch (err) {
      toast({
        title: 'Something went wrong',
        description: (err instanceof Error && err.message) || 'Could not submit your application. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmittedRequest(null);
    setForm(EMPTY_FORM);
    onClose();
  };

  if (!pet) return null;

  const canMessageLister = Boolean(user && pet.created_by);

  if (submittedRequest) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> Application Sent
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Your request to adopt {pet.name} has been received. The lister will review it and reach out. You can also start a conversation now.
            </p>
            {canMessageLister ? (
              <StartChatButton
                contactId={String(submittedRequest.id)}
                contactName={pet.name}
                contactType="adoption"
                contactEmail={pet.created_by}
                subject={`Adoption inquiry for ${pet.name}`}
                className="w-full justify-center"
              >
                Message the lister
              </StartChatButton>
            ) : null}
            <Button onClick={handleClose} variant="outline" className="w-full rounded-xl">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Adopt {pet.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Your Name *</Label>
              <Input required value={form.applicant_name} onChange={e => setForm(f => ({ ...f, applicant_name: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input required type="email" value={form.applicant_email} onChange={e => setForm(f => ({ ...f, applicant_email: e.target.value }))} className="rounded-xl mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={form.applicant_phone} onChange={e => setForm(f => ({ ...f, applicant_phone: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl mt-1" />
            </div>
          </div>
          <div>
            <Label>Housing Type</Label>
            <Select value={form.housing_type} onValueChange={v => setForm(f => ({ ...f, housing_type: v }))}>
              <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="farm">Farm</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={form.has_pets} onCheckedChange={v => setForm(f => ({ ...f, has_pets: v }))} />
            <Label>I currently have other pets</Label>
          </div>
          <div>
            <Label>Pet Experience</Label>
            <Textarea value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} placeholder="Tell us about your experience with pets..." className="rounded-xl mt-1" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Why would you like to adopt this pet?" className="rounded-xl mt-1" />
          </div>
          <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Heart className="w-4 h-4 mr-2" />}
            Submit Application
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
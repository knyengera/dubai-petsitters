"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { entities } from '@/lib/data/entities';
import { Loader2 } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'health', label: 'Health & Wellness' },
  { value: 'training', label: 'Training & Behavior' },
  { value: 'nutrition', label: 'Nutrition & Diet' },
  { value: 'lost_found', label: 'Lost & Found' },
  { value: 'hosting', label: 'Hosting & Boarding' },
  { value: 'adoption', label: 'Adoption' },
];

export default function NewThreadModal({ open, onClose, onCreated, user }) {
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setLoading(true);
    const thread = await entities.ForumThread.create({
      ...form,
      author_name: user.full_name || user.email.split('@')[0],
      author_email: user.email,
      upvotes: 0,
      upvoted_by: [],
      comment_count: 0,
    });
    setLoading(false);
    setForm({ title: '', content: '', category: 'general' });
    onCreated(thread);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Start a New Discussion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-1.5 block">Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Title</Label>
            <Input placeholder="What's your question or topic?" value={form.title} onChange={e => set('title', e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1.5 block">Details</Label>
            <Textarea placeholder="Share more context, details, or background..." value={form.content} onChange={e => set('content', e.target.value)} rows={5} className="rounded-xl resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !form.title.trim() || !form.content.trim()} className="flex-1 rounded-xl">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post Thread'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
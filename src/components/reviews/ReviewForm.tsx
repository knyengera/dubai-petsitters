"use client";

import { useState } from 'react';
import { base44 } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2 } from 'lucide-react';
import StarRating from './StarRating';

export default function ReviewForm({ targetId, targetType, targetName, onReviewSubmitted }) {
  const [form, setForm] = useState({ rating: 0, title: '', content: '', reviewer_name: '', reviewer_email: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.rating === 0) { setError('Please select a star rating.'); return; }
    setError('');
    setLoading(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.Review.create({
        target_id: targetId,
        target_type: targetType,
        target_name: targetName,
        rating: form.rating,
        title: form.title || undefined,
        content: form.content,
        reviewer_name: form.reviewer_name || user?.full_name || 'Anonymous',
        reviewer_email: form.reviewer_email || user?.email || '',
      });
      setDone(true);
      onReviewSubmitted?.();
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center py-8 gap-3">
        <CheckCircle2 className="w-10 h-10 text-success" />
        <p className="font-semibold text-foreground">Thank you for your review!</p>
        <p className="text-sm text-muted-foreground">Your feedback helps other pet owners make great choices.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Your Rating *</Label>
        <div className="mt-2">
          <StarRating value={form.rating} onChange={(r) => setForm(f => ({ ...f, rating: r }))} size="lg" />
        </div>
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Your Name *</Label>
          <Input
            value={form.reviewer_name}
            onChange={e => setForm(f => ({ ...f, reviewer_name: e.target.value }))}
            placeholder="Your name"
            required
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label className="text-xs">Your Email *</Label>
          <Input
            type="email"
            value={form.reviewer_email}
            onChange={e => setForm(f => ({ ...f, reviewer_email: e.target.value }))}
            placeholder="your@email.com"
            required
            className="rounded-xl mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Review Title</Label>
        <Input
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="Summarize your experience"
          className="rounded-xl mt-1"
        />
      </div>
      <div>
        <Label className="text-xs">Your Review *</Label>
        <Textarea
          value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="Share the details of your experience..."
          rows={4}
          required
          className="rounded-xl mt-1 text-sm"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full rounded-xl font-bold">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Submit Review
      </Button>
    </form>
  );
}
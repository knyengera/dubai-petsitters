"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/lib/data';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { Button } from '@/components/ui/button';
import { MessageSquarePlus, User } from 'lucide-react';
import { format } from 'date-fns';

function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-muted-foreground shrink-0">{star}</span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-muted-foreground shrink-0">{count}</span>
    </div>
  );
}

export default function ReviewsList({ targetId, targetType, targetName }) {
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], refetch } = useQuery({
    queryKey: ['reviews', targetId],
    queryFn: () => base44.entities.Review.filter({ target_id: targetId }, '-created_date', 50),
    enabled: !!targetId,
  });

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const starCounts = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 p-5 bg-muted/40 rounded-2xl border border-border">
          <div className="text-center sm:border-r sm:border-border sm:pr-6">
            <p className="text-5xl font-extrabold font-heading text-foreground">{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} size="sm" />
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 space-y-1.5 justify-center flex flex-col">
            {starCounts.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Write a review toggle */}
      <div>
        <Button
          onClick={() => setShowForm(v => !v)}
          variant={showForm ? 'secondary' : 'outline'}
          className="w-full sm:w-auto rounded-xl gap-2"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Write a Review'}
        </Button>
        {showForm && (
          <div className="mt-4 p-5 bg-card border border-border rounded-2xl">
            <ReviewForm
              targetId={targetId}
              targetType={targetType}
              targetName={targetName}
              onReviewSubmitted={() => { refetch(); setShowForm(false); }}
            />
          </div>
        )}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquarePlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review.id} className="p-4 bg-card border border-border rounded-2xl space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-foreground">{review.reviewer_name}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(review.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <StarRating value={review.rating} size="sm" />
                </div>
              </div>
              {review.title && <p className="font-semibold text-sm text-foreground">{review.title}</p>}
              <p className="text-sm text-muted-foreground leading-relaxed">{review.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
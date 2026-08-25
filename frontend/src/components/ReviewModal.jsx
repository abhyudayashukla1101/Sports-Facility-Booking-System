import { useState } from "react";
import { X, Star, Send, MessageSquare, Camera, Upload, Trash2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function ReviewModal({ facility, onClose, onSubmit }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach((file) => {
      if (images.length >= 4) return;
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setImages((prev) => [...prev, uploadEvent.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        facilityId: facility.id,
        studentName: user?.name || "Anonymous Student",
        rollNumber: user?.rollNumber || "220101000",
        rating,
        comment: comment.trim(),
        images
      });
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-surface-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-border p-5 bg-surface-hover/40">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-accent uppercase">
              Student Review & Photos
            </span>
            <h3 className="font-display text-xl font-bold text-white">
              {facility.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-border hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`h-7 w-7 ${
                      (hoverRating || rating) >= star
                        ? "fill-accent text-accent"
                        : "text-surface-border fill-surface"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-accent">
                {rating} / 5 Stars
              </span>
            </div>
          </div>

          {/* Comment Text Area */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              Review Comment
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted" />
              <textarea
                required
                rows={3}
                placeholder="Share your experience regarding court condition, lighting, equipment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-surface-border bg-base/90 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {/* Photo Upload Section (Amazon / Flipkart Style) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider">
                Add Photos of Ground / Facility (Optional)
              </label>
              <span className="text-[10px] text-muted">{images.length}/4 Photos</span>
            </div>

            {/* Photo Previews */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {images.map((imgSrc, idx) => (
                <div key={idx} className="relative group h-16 rounded-xl overflow-hidden border border-surface-border bg-base">
                  <img src={imgSrc} alt="Facility preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 text-booked transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {images.length < 4 && (
                <label className="flex flex-col items-center justify-center h-16 rounded-xl border border-dashed border-surface-border/80 bg-base/40 hover:bg-base/80 hover:border-accent/60 cursor-pointer transition text-muted hover:text-accent">
                  <Camera className="h-4 w-4" />
                  <span className="text-[9px] font-bold mt-1 uppercase">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* User info note */}
          <div className="text-xs text-muted pt-1">
            Posting as <span className="font-semibold text-white">{user?.name}</span> (Roll: {user?.rollNumber})
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-bold text-accent-foreground shadow-lg shadow-accent/20 transition hover:brightness-110 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting...</span>
            ) : (
              <>
                <Send className="h-4 w-4" /> Submit Review
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

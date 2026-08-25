import { useState, useEffect } from "react";

const REVIEWS_STORAGE_KEY = "playfield_iitg_reviews";

const INITIAL_REVIEWS = [
  {
    id: "rev_1",
    facilityId: "badminton-hall",
    studentName: "Rohan Sharma",
    rollNumber: "210101088",
    rating: 5,
    comment: "The wooden courts are in pristine condition! Anti-glare lighting makes evening matches amazing.",
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600&auto=format&fit=crop"
    ],
    date: "2026-08-20"
  },
  {
    id: "rev_2",
    facilityId: "badminton-hall",
    studentName: "Ananya Roy",
    rollNumber: "220102014",
    rating: 4,
    comment: "Courts are well maintained. Make sure to bring your own non-marking indoor shoes!",
    images: [],
    date: "2026-08-22"
  },
  {
    id: "rev_3",
    facilityId: "sac-gymnasium",
    studentName: "Vikramaditya Das",
    rollNumber: "200103045",
    rating: 5,
    comment: "Great variety of free weights and cardio equipment. Clean environment.",
    images: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop"
    ],
    date: "2026-08-18"
  },
  {
    id: "rev_4",
    facilityId: "main-football-ground",
    studentName: "Priyanjali Borgohain",
    rollNumber: "220108012",
    rating: 5,
    comment: "Floodlights are super bright for late evening practice sessions under the stars!",
    images: [
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop"
    ],
    date: "2026-08-23"
  }
];

export function useReviews() {
  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.error("Failed to save reviews to localStorage", e);
    }
  }, [reviews]);

  const getReviewsForFacility = (facilityId) => {
    return reviews.filter((r) => r.facilityId === facilityId);
  };

  const getAverageRating = (facilityId, defaultRating = 4.7) => {
    const list = getReviewsForFacility(facilityId);
    if (list.length === 0) return defaultRating;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / list.length).toFixed(1));
  };

  const addReview = (newReview) => {
    const item = {
      id: `rev_${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split("T")[0],
      images: newReview.images || [],
      ...newReview
    };
    setReviews((prev) => [item, ...prev]);
    return item;
  };

  return {
    reviews,
    getReviewsForFacility,
    getAverageRating,
    addReview
  };
}

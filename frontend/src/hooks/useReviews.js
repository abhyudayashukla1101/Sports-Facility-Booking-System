import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getReviews, addReview as apiAddReview } from "../api/client";

export function useReviews(facilityId) {
  const queryClient = useQueryClient();

  // Query: Get all reviews for a specific facility
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", facilityId],
    queryFn: () => getReviews(facilityId),
    enabled: Boolean(facilityId)
  });

  // Mutation: Submit a new review
  const addReviewMutation = useMutation({
    mutationFn: (reviewData) => apiAddReview(facilityId, reviewData),
    onSuccess: () => {
      // Invalidate queries to trigger re-fetches
      queryClient.invalidateQueries({ queryKey: ["reviews", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["facility", facilityId] });
      queryClient.invalidateQueries({ queryKey: ["facilities"] });
    }
  });

  const addReview = async (reviewData) => {
    return addReviewMutation.mutateAsync(reviewData);
  };

  const getReviewsForFacility = () => {
    return reviews;
  };

  const getAverageRating = (defaultRating = 4.7) => {
    if (reviews.length === 0) return defaultRating;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  };

  return {
    reviews,
    getReviewsForFacility,
    getAverageRating,
    addReview
  };
}

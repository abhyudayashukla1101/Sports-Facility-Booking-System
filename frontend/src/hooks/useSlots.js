import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSlots, createBooking } from "../api/client";

export function useSlots(facilityId, date) {
  return useQuery({
    queryKey: ["slots", facilityId, date],
    queryFn: () => getSlots(facilityId, date),
    enabled: Boolean(facilityId && date),
  });
}

// Not wired into the UI yet (that's the next build pass) — but living here
// now so SlotGrid.jsx can import it directly once the confirm flow is built.
export function useCreateBooking(facilityId, date) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId }) => createBooking({ slotId, facilityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", facilityId, date] });
    },
  });
}
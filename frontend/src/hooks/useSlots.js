import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { getSlots } from "../api/client";

export function useSlots(facilityId, date) {
  const { user } = useAuth();
  const rollNumber = user?.rollNumber;

  return useQuery({
    queryKey: ["slots", facilityId, date, rollNumber],
    queryFn: () => getSlots(facilityId, date, rollNumber),
    enabled: Boolean(facilityId && date),
  });
}
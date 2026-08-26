import { useQuery } from "@tanstack/react-query";
import { getFacilities, getFacilityById } from "../api/client";

export function useFacilities({ sport } = {}) {
  return useQuery({
    queryKey: ["facilities", sport ?? "all"],
    queryFn: () => getFacilities({ sport }),
  });
}

export function useFacility(id) {
  return useQuery({
    queryKey: ["facility", id],
    queryFn: () => getFacilityById(id),
    enabled: Boolean(id),
  });
}

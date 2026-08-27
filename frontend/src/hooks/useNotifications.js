import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import {
  getNotifications,
  markNotificationRead as apiMarkRead,
  clearNotifications as apiClearAll
} from "../api/client";

export function useNotifications() {
  const { user } = useAuth();
  const rollNumber = user?.rollNumber;
  const queryClient = useQueryClient();

  const { data = { notifications: [], unreadCount: 0 } } = useQuery({
    queryKey: ["notifications", rollNumber],
    queryFn: () => getNotifications(rollNumber),
    enabled: Boolean(rollNumber),
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  const markReadMutation = useMutation({
    mutationFn: apiMarkRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", rollNumber] });
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiClearAll(rollNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", rollNumber] });
    }
  });

  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
    markAsRead: markReadMutation.mutate,
    clearAll: clearAllMutation.mutate
  };
}

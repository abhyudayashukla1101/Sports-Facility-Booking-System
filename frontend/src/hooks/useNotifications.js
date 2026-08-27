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
  const studentName = user?.name;
  const queryClient = useQueryClient();

  const { data = { notifications: [], unreadCount: 0 } } = useQuery({
    queryKey: ["notifications", rollNumber, studentName],
    queryFn: () => getNotifications(rollNumber, studentName),
    enabled: Boolean(rollNumber && studentName),
    refetchInterval: 5000 // Poll every 5 seconds for real-time updates
  });

  const markReadMutation = useMutation({
    mutationFn: apiMarkRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiClearAll(rollNumber, studentName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  return {
    notifications: data.notifications ?? [],
    unreadCount: data.unreadCount ?? 0,
    markAsRead: markReadMutation.mutate,
    clearAll: clearAllMutation.mutate
  };
}

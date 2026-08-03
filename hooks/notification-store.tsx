import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/user-store';
import { apiFetch } from '@/utils/apiClient';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    is_read?: boolean;
    created_at: string;
}

const NotificationContext = createContext<ReturnType<typeof useNotificationStore> | null>(null);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

const useNotificationStore = () => {
    const { currentUser } = useUser();
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading, refetch } = useQuery({
        queryKey: ['notifications', currentUser?.id],
        queryFn: async () => {
            if (!currentUser) return [];
            return await apiFetch(`/api/notifications/${currentUser.id}`);
        },
        enabled: !!currentUser
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser) return;
            await apiFetch(`/api/notifications/read-all/${currentUser.id}`, { method: 'PUT' });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        }
    });

    const unreadCount = useMemo(() => {
        return notifications.filter((n: Notification) => !n.read).length;
    }, [notifications]);

    return {
        notifications,
        unreadCount,
        isLoading,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        refetch
    };
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const store = useNotificationStore();
    return React.createElement(NotificationContext.Provider, { value: store }, children);
};

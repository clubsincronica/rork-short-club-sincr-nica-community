import React, { createContext, useContext, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/user-store';
import { getApiBaseUrl } from '@/utils/api-config';

export interface Notification {
    id: number;
    user_id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    is_read: boolean;
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
            const response = await fetch(`${getApiBaseUrl()}/api/notifications/${currentUser.id}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            return await response.json();
        },
        enabled: !!currentUser
    });

    const markAsReadMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(`${getApiBaseUrl()}/api/notifications/${id}/read`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Failed to mark notification as read');
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: async () => {
            if (!currentUser) return;
            const response = await fetch(`${getApiBaseUrl()}/api/notifications/read-all/${currentUser.id}`, {
                method: 'PUT'
            });
            if (!response.ok) throw new Error('Failed to mark all notifications as read');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.id] });
        }
    });

    const unreadCount = useMemo(() => {
        return notifications.filter((n: Notification) => !n.is_read).length;
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

import { useEffect, useRef } from 'react';
import { useUser } from '@/hooks/user-store';
import { initSocket, getSocket } from '@/app/services/socket';

/**
 * Global Socket.IO connection hook
 * Sets up socket connection when user logs in and maintains it across all screens
 * This ensures message notifications work even when Messages tab hasn't been visited
 */
export function useGlobalSocketConnection() {
  const { currentUser } = useUser();
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);

  useEffect(() => {
    // Only initialize socket if user is logged in
    if (currentUser?.id) {
      // Check if socket already exists
      const existingSocket = getSocket();
      
      if (!existingSocket || !existingSocket.connected) {
        console.log('🌐 Initializing global Socket.IO connection for user:', currentUser.id);
        
        socketRef.current = initSocket({ userId: parseInt(currentUser.id as string) });
        const socket = socketRef.current;

        socket.on('connect', () => {
          console.log('🌐 Global socket connected');
          socket.emit('user:join', parseInt(currentUser.id as string));
        });

        socket.on('disconnect', () => {
          console.log('🌐 Global socket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.error('🌐 Global socket connection error:', error);
        });
      } else {
        console.log('🌐 Global socket already connected, reusing existing connection');
        socketRef.current = existingSocket;
      }

      // Note: Message handlers are set up in the Messages screen
      // This global connection just ensures the socket is always connected
    }

    // Cleanup on unmount or user logout
    return () => {
      if (!currentUser?.id && socketRef.current) {
        console.log('🌐 User logged out, keeping socket for cleanup in Messages screen');
        // Don't disconnect here - let the Messages screen handle it
      }
    };
  }, [currentUser?.id]);

  return socketRef.current;
}

import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useUser } from '@/hooks/user-store';
import { initSocket, getSocket } from '@/app/services/socket';
import { messageEventBus } from '@/utils/messageEventBus';

/**
 * Global Socket.IO connection hook
 * Sets up socket connection when user logs in and maintains it across all screens
 * This ensures message notifications work even when Messages tab hasn't been visited
 */
export function useGlobalSocketConnection() {
  const { currentUser } = useUser();
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const messageHandlerSet = useRef(false);
  const globalNotificationHandlerSet = useRef(false);

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
          console.log('🌐 Socket ID:', socket.id);
          socket.emit('user:join', parseInt(currentUser.id as string));
          console.log('🌐 Joined room: user:' + currentUser.id);
        });

        socket.on('disconnect', () => {
          console.log('🌐 Global socket disconnected');
        });

        socket.on('connect_error', (error) => {
          console.error('🌐 Global socket connection error:', error);
        });

        // Set up SINGLE message handler that emits to event bus
        if (!messageHandlerSet.current) {
          socket.on('message:new', (message: any) => {
            console.log('🌐 [GLOBAL] Received message:new event:', message);
            
            // Check if this message is for the current user AND not sent by them
            const isForMe = message.receiver_id === parseInt(currentUser.id as string);
            const isSentByMe = message.sender_id === parseInt(currentUser.id as string);
            
            console.log('🌐 [GLOBAL] Message check:', {
              receiver_id: message.receiver_id,
              sender_id: message.sender_id,
              currentUserId: currentUser.id,
              isForMe,
              isSentByMe
            });
            
            if (isForMe && !isSentByMe) {
              console.log('🌐 [GLOBAL] Message for current user - emitting to event bus');
              // Emit to event bus - let subscribers decide what to do
              messageEventBus.emitNewMessage(message);
            } else if (isSentByMe) {
              console.log('🌐 [GLOBAL] Message sent by me - emitting to event bus for conversation update');
              // Also emit messages sent by me so Messages screen can update
              messageEventBus.emitNewMessage(message);
            }
          });
          messageHandlerSet.current = true;
        }
      } else {
        console.log('🌐 Global socket already connected, reusing existing connection');
        socketRef.current = existingSocket;
        
        // Make sure we join the user room even when reusing socket
        if (existingSocket.connected) {
          console.log('🌐 Joining user room for user:', currentUser.id);
          existingSocket.emit('user:join', parseInt(currentUser.id as string));
        }
        
        // Still set up message handler if not already set
        if (!messageHandlerSet.current && existingSocket) {
          existingSocket.on('message:new', (message: any) => {
            console.log('🌐 [GLOBAL] Received message:new event:', message);
            
            const isForMe = message.receiver_id === parseInt(currentUser.id as string);
            const isSentByMe = message.sender_id === parseInt(currentUser.id as string);
            
            console.log('🌐 [GLOBAL] Message check:', {
              receiver_id: message.receiver_id,
              sender_id: message.sender_id,
              currentUserId: currentUser.id,
              isForMe,
              isSentByMe
            });
            
            if (isForMe && !isSentByMe) {
              console.log('🌐 [GLOBAL] Message for current user - emitting to event bus');
              messageEventBus.emitNewMessage(message);
            } else if (isSentByMe) {
              console.log('🌐 [GLOBAL] Message sent by me - emitting to event bus for conversation update');
              messageEventBus.emitNewMessage(message);
            }
          });
          messageHandlerSet.current = true;
        }
      }
    }

    // Cleanup on unmount or user logout
    return () => {
      if (!currentUser?.id && socketRef.current) {
        console.log('🌐 User logged out, cleaning up global socket');
        socketRef.current.off('message:new');
        messageHandlerSet.current = false;
        globalNotificationHandlerSet.current = false;
      }
    };
  }, [currentUser?.id]);

  // Set up global event bus subscriber for fallback notifications (Alert)
  useEffect(() => {
    if (!currentUser || globalNotificationHandlerSet.current) return;

    console.log('🌐 [GLOBAL] Setting up fallback notification handler');

    const unsubscribe = messageEventBus.onNewMessage((message) => {
      // Show a simple Alert as fallback notification
      // The Messages screen will suppress this if user is actively viewing the conversation
      const isForMe = message.receiver_id === parseInt(currentUser.id as string);
      const isSentByMe = message.sender_id === parseInt(currentUser.id as string);

      if (isForMe && !isSentByMe) {
        console.log('🌐 [GLOBAL] Showing Alert notification for message from:', message.sender_name);
        Alert.alert(
          `New message from ${message.sender_name || 'Unknown'} (ID: ${message.sender_id})`,
          message.text,
          [{ text: 'OK' }]
        );
      }
    });

    globalNotificationHandlerSet.current = true;

    return () => {
      unsubscribe();
      globalNotificationHandlerSet.current = false;
    };
  }, [currentUser]);

  return socketRef.current;
}

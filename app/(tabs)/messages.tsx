import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Search, MessageCircle, Send, ArrowLeft, X } from '../../components/SmartIcons';
import { Colors } from '@/constants/colors';
import { useUser } from '@/hooks/user-store';
import { initSocket, getSocket } from '@/utils/socket';
import { getApiBaseUrl } from '@/utils/api-config';
import { messageEventBus } from '@/utils/messageEventBus';
import { logger } from '@/utils/logger';

interface Conversation {
  id: number;
  other_user_id: number;
  name: string;
  avatar?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  sender: 'me' | 'other';
  timestamp: Date;
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { currentUser } = useUser();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<{
    userId: string;
    userName: string;
    userAvatar?: string;
    conversationId?: number;
  } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    senderName: string;
    senderAvatar?: string;
    messageText: string;
    senderId: number;
    conversationId: number;
  } | null>(null);

  const socketRef = useRef<any>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Load conversations from backend
  const loadConversations = async () => {

    console.log('🔎 [DEBUG] loadConversations called. currentUser:', currentUser, 'currentUser.id:', currentUser?.id);
    if (
      !currentUser ||
      currentUser.id === undefined ||
      currentUser.id === null ||
      currentUser.id === undefined || currentUser.id === null || isNaN(Number(currentUser.id)) ||
      isNaN(Number(currentUser.id))
    ) {
      console.warn('⚠️ [loadConversations] Skipping API call: currentUser or currentUser.id is invalid:', currentUser);
      return;
    }

    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/conversations/user/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔎 [DEBUG] Conversations API response:', data);
        if (__DEV__) {
          logger.debug('📬 Loaded conversations for user', currentUser.id, ':', data);
          logger.debug('📬 Current user name:', currentUser.name, 'ID:', currentUser.id);
          // Debug each conversation
          data.forEach((conv: any) => {
            logger.debug(`  📬 Conversation ${conv.id}:`);
            logger.debug(`     - name: "${conv.name}" (should be OTHER user's name)`);
            logger.debug(`     - other_user_id: ${conv.other_user_id}`);
            logger.debug(`     - avatar: ${conv.avatar}`);
            logger.debug(`     - ⚠️  ISSUE CHECK: Is name "${conv.name}" same as current user "${currentUser.name}"? ${conv.name === currentUser.name ? 'YES - BUG!' : 'No - OK'}`);
          });
        }
        if (Array.isArray(data)) {
          // Filter out any invalid items (null, undefined, or missing ID)
          const validConversations = data.filter((item: any) => item && typeof item === 'object' && item.id);
          console.log('🔎 [DEBUG] Filtered valid conversations:', validConversations);
          setConversations(validConversations);
        } else {
          console.error('❌ Expected array of conversations but got:', typeof data, data);
          setConversations([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Conversations API error:', response.status, errorText);
      }
    } catch (error) {
      logger.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    loadConversations();
  }, [currentUser]);

  // Load conversations on mount and when user changes or tab becomes focused
  useEffect(() => {
    if (isFocused && currentUser) {
      loadConversations();
    }
  }, [currentUser?.id, isFocused]);

  // Initialize socket connection - use existing global socket
  useEffect(() => {
    if (currentUser) {
      // Get the existing global socket instead of creating a new one
      const socket = getSocket();

      if (!socket) {
        console.warn('⚠️ Global socket not initialized, creating fallback socket');
        // Retrieve token for fallback connection
        import('@react-native-async-storage/async-storage').then(module => {
          module.default.getItem('authToken').then(token => {
            if (token) {
              socketRef.current = initSocket({ userId: currentUser.id, token });
            } else {
              console.warn('❌ No token found for fallback socket connection');
            }
          });
        });
      } else {
        console.log('✅ Using global socket connection for Messages screen');
        socketRef.current = socket;
      }

      if (socket) {
        // Update connection status immediately
        const currentConnectionState = socket.connected;
        setIsSocketConnected(currentConnectionState);
        if (__DEV__) {
          console.log('📡 Messages screen: Socket connection state:', currentConnectionState);
        }

        // If already connected, join immediately
        if (currentConnectionState) {
          console.log('Socket already connected, joining room for user:', currentUser.id);
          socket.emit('user:join', currentUser.id);
          console.log('[SOCKET] user:join emitted (already connected) for user:', currentUser.id);
        }

        // Set up connection event handlers
        const handleConnect = () => {
          console.log('Socket connected for messaging, user:', currentUser.id);
          setIsSocketConnected(true);
          // Join user room
          console.log('Emitting user:join for user:', currentUser.id);
          socket.emit('user:join', currentUser.id);
          console.log('[SOCKET] user:join emitted (on connect) for user:', currentUser.id);
        };

        const handleDisconnect = () => {
          console.log('Socket disconnected for user:', currentUser.id);
          setIsSocketConnected(false);
          console.log('[SOCKET] Disconnected event for user:', currentUser.id);
        };

        // Always remove previous listeners before adding new ones
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        // Extra: log socket events for debugging
        socket.on('connect_error', (err) => {
          console.error('Socket connect_error:', err);
        });

        // Cleanup function will remove these specific handlers
        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('connect_error');
        };
      }
    }
  }, [currentUser]);

  // Subscribe to message event bus (replaces duplicate socket handler)
  useEffect(() => {
    if (!currentUser) return;

    console.log('📬 [Messages Screen] Subscribing to message event bus');

    const unsubscribe = messageEventBus.onNewMessage((message) => {
      console.log('📬 [Messages Screen] [DEBUG] Event bus fired:', JSON.stringify(message));
      console.log('📬 [Messages Screen] [DEBUG] Current user:', currentUser?.id, currentUser?.name);
      console.log('📬 [Messages Screen] [DEBUG] Message sender_id:', message.sender_id, 'receiver_id:', message.receiver_id);

      // Safety check
      if (!message || !message.text) {
        console.warn('❌ [DEBUG] Invalid message from event bus:', message);
        return false; // Let other handlers try
      }

      // Always reload conversations list to show new message in list preview
      loadConversations();

      if (activeConversation && message.conversation_id === activeConversation.conversationId) {
        setMessages(prev => {
          const messageId = message.id?.toString();
          if (messageId && prev.some(m => m.id === messageId)) {
            console.log('⏭️ [DEBUG] Duplicate message ID, ignoring:', messageId);
            return prev;
          }
          const newMsg = {
            id: message.id?.toString() || Date.now().toString(),
            text: message.text,
            senderId: message.sender_id?.toString(),
            sender: message.sender_id === currentUser.id ? ('me' as 'me' | 'other') : ('other' as 'me' | 'other'),
            timestamp: new Date(message.created_at),
          };
          console.log('💬 [DEBUG] Adding message to local state:', newMsg);
          console.log('💬 [DEBUG] Previous messages state:', prev);
          return [newMsg, ...prev];
        });
      }

      // Show notification modal if not actively viewing this conversation
      const isReceivedByMe = message.receiver_id === currentUser.id;
      const isSentByMe = message.sender_id === currentUser.id;
      const activeUserId = activeConversation ? parseInt(activeConversation.userId) : null;
      const activeConvoId = activeConversation ? activeConversation.conversationId : null;
      let shouldStopPropagation = false;
      if (isReceivedByMe && !isSentByMe && isFocused) {
        const isActivelyViewingThisConversation =
          activeConversation &&
          activeUserId !== null &&
          activeConvoId !== null &&
          message.sender_id === activeUserId &&
          message.conversation_id === activeConvoId;
        if (!isActivelyViewingThisConversation) {
          setNewMessageNotification({
            senderName: message.sender_name || 'Usuario',
            senderAvatar: message.sender_avatar,
            messageText: message.text,
            senderId: message.sender_id,
            conversationId: message.conversation_id,
          });
        }
        shouldStopPropagation = true;
      }
      if (isSentByMe) {
        shouldStopPropagation = true;
      }
      if (shouldStopPropagation) {
        console.log('🚫 [DEBUG] Stopping propagation - Messages screen handled this message');
        return true;
      }
      console.log('⏩ [DEBUG] Continuing propagation - Messages screen did not handle this message');
      return false;
    });

    return unsubscribe;
  }, [currentUser, isFocused, activeConversation]);

  // Load message history for active conversation
  const loadConversationMessages = async (conversationId: number, pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoadingMessages(true);
      setPage(1);
      setHasMore(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/messages?page=${pageNum}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        console.log('🔎 [DEBUG] Messages API response:', data);
        // Backend returns { messages: [], page, limit, total }

        let messagesList = data.messages || [];
        console.log('💬 Loaded messages:', messagesList.length, 'page:', pageNum);

        // Reverse so newest messages are first (to match real-time prepend logic)
        if (messagesList.length > 1) messagesList = messagesList.slice().reverse();

        const newMessages = messagesList.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.text,
          senderId: msg.sender_id.toString(),
          sender: msg.sender_id === currentUser?.id ? 'me' : 'other',
          timestamp: new Date(msg.created_at),
        }));

        console.log('🔎 [DEBUG] Parsed newMessages (reversed):', newMessages);
        setMessages(prev => {
          if (pageNum === 1) return newMessages;
          // Append older messages to the end of the newest-to-oldest list
          return [...prev, ...newMessages];
        });

        setHasMore(messagesList.length === 20);
        setPage(pageNum);
      } else {
        const errorText = await response.text();
        console.error('❌ Messages API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
      setIsFetchingMore(false);
    }
  };

  // Create or get conversation ID
  const getOrCreateConversation = async (userId1: number, userId2: number): Promise<number | null> => {
    try {
      console.log('💬 Creating conversation between:', userId1, 'and', userId2);
      const url = `${getApiBaseUrl()}/api/conversations`;
      console.log('💬 POST URL:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id: userId1, user2Id: userId2 }),
      });

      console.log('💬 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('💬 Conversation created/found:', data);
        if (!data || !data.id) {
          console.error('❌ Server returned success but no conversation ID:', data);
          Alert.alert('Error', 'El servidor no devolvió un ID de conversación válido.');
          return null;
        }
        return data.id;
      } else {
        const errorText = await response.text();
        console.error('💬 Server error:', response.status, errorText);
        Alert.alert('Error de Servidor', `No se pudo crear la conversación. Estado: ${response.status}\n${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.error('💬 Network error creating conversation:', error);
      Alert.alert('Error de Conexión', 'No se pudo conectar con el servidor para iniciar el chat.');
    }
    return null;
  };

  // Auto-create conversation when startConversationWith param is present
  useEffect(() => {
    if (params.startConversationWith && params.userName && currentUser) {
      const initConversation = async () => {
        const otherUserId = parseInt(params.startConversationWith as string);
        const myUserId = currentUser.id;

        console.log('🔍 Starting conversation:');
        console.log('   My ID:', myUserId, '(type:', typeof currentUser.id, ')');
        console.log('   Other user ID:', otherUserId, '(type:', typeof params.startConversationWith, ')');
        console.log('   Other user name:', params.userName);

        // Validate IDs before making API call
        if (isNaN(myUserId) || myUserId > 2147483647) {
          console.error('❌ Invalid current user ID:', currentUser.id);
          Alert.alert('Error', 'Tu sesión es inválida. Por favor, cierra sesión y vuelve a iniciar.');
          return;
        }

        if (isNaN(otherUserId) || otherUserId > 2147483647) {
          console.error('❌ Invalid other user ID:', params.startConversationWith);
          Alert.alert('Error', 'El usuario seleccionado tiene un ID inválido. Por favor, actualiza la lista de usuarios.');
          return;
        }

        const conversationId = await getOrCreateConversation(myUserId, otherUserId);

        setActiveConversation({
          userId: params.startConversationWith as string,
          userName: params.userName as string,
          userAvatar: params.userAvatar as string | undefined,
          conversationId: conversationId || undefined,
        });

        // Load conversation history if we have a conversation ID
        if (conversationId) {
          await loadConversationMessages(conversationId);
        } else {
          setMessages([]);
        }
      };

      initConversation();
    }
  }, [params.startConversationWith, params.userName, params.userAvatar, currentUser]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation?.conversationId) {
      loadConversationMessages(activeConversation.conversationId);

      // Clear any pending notification for this conversation
      if (newMessageNotification &&
        newMessageNotification.conversationId === activeConversation.conversationId) {
        console.log('🧹 Clearing notification - conversation now open');
        setNewMessageNotification(null);
      }
    }
  }, [activeConversation?.conversationId]);

  // Scroll to bottom when messages change (not needed with inverted FlatList as index 0 is at bottom)
  /*
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // setTimeout(() => {
      //   flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      // }, 100);
    }
  }, [messages]);
  */

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeConversation || !currentUser) return;

    const socket = getSocket();
    if (!socket || !socket.connected) {
      console.warn('Socket not connected');
      Alert.alert('Error', 'No estás conectado. Por favor, intenta de nuevo.');
      return;
    }

    // Ensure we have a conversation ID
    let conversationId = activeConversation.conversationId;
    if (!conversationId) {
      console.log('Creating conversation...');
      conversationId = await getOrCreateConversation(
        currentUser.id,
        parseInt(activeConversation.userId)
      ) || undefined;

      if (!conversationId) {
        Alert.alert('Error', 'No se pudo crear la conversación');
        return;
      }

      // Update active conversation with the new ID
      setActiveConversation(prev => prev ? { ...prev, conversationId } : null);
    }

    console.log('Sending message via socket:', {
      conversationId,
      senderId: currentUser.id,
      receiverId: activeConversation.userId,
      text: messageText,
      socketConnected: socket?.connected
    });

    if (!socket || !socket.connected) {
      Alert.alert('Error', 'Socket not connected. Cannot send message.');
      console.error('❌ Socket not connected!');
      return;
    }

    // Emit to server (backend expects 'message:send')
    console.log('✅ Emitting message:send to backend...');
    socket.emit('message:send', {
      conversationId,
      senderId: currentUser.id,
      receiverId: parseInt(activeConversation.userId),
      text: messageText,
    });

    // Clear input immediately for better UX
    setMessageText('');
  };

  const handleCloseConversation = () => {
    setActiveConversation(null);
    setMessages([]);
    setMessageText('');
  };

  const renderConversation = () => (
    <KeyboardAvoidingView
      style={styles.conversationContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {/* Conversation Header */}
      <View style={[styles.conversationHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleCloseConversation} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.conversationHeaderInfo}>
          {activeConversation?.userAvatar && (
            <Image
              source={{ uri: activeConversation.userAvatar }}
              style={styles.conversationAvatar}
            />
          )}
          <View>
            <Text style={styles.conversationName}>{activeConversation?.userName}</Text>
            <Text style={[
              styles.conversationStatus,
              isSocketConnected ? styles.onlineStatus : styles.offlineStatus
            ]}>
              {isSocketConnected ? 'En línea' : 'Conectando...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleCloseConversation}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={[...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === 'me' ? styles.myMessage : styles.otherMessage
            ]}
          >
            <Text style={[
              styles.messageText,
              item.sender === 'me' ? styles.myMessageText : styles.otherMessageText
            ]}>
              {item.text}
            </Text>
            <Text style={[
              styles.messageTime,
              item.sender === 'me' ? styles.myMessageTime : styles.otherMessageTime
            ]}>
              {item.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onEndReached={() => {
          if (hasMore && !isFetchingMore && activeConversation?.conversationId) {
            loadConversationMessages(activeConversation.conversationId, page + 1);
          }
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingMore ? <ActivityIndicator color={Colors.gold} style={{ marginVertical: 10 }} /> : null}
        ListEmptyComponent={
          !isLoadingMessages ? (
            <View style={styles.emptyConversation}>
              <MessageCircle size={48} color={Colors.textLight} />
              <Text style={styles.emptyConversationText}>
                Comienza la conversación con {activeConversation?.userName}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Message Input */}
      <View style={[styles.messageInputContainer, { paddingBottom: insets.bottom }]}>
        <TextInput
          style={styles.messageInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={Colors.textLight}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Send size={20} color={messageText.trim() ? Colors.white : Colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* New message notification modal - also render when conversation is open */}
      {renderNewMessageModal()}
    </KeyboardAvoidingView>
  );

  const handleOpenConversation = async (conversation: Conversation) => {
    setActiveConversation({
      userId: conversation.other_user_id.toString(),
      userName: conversation.name,
      userAvatar: conversation.avatar,
      conversationId: conversation.id,
    });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
// ...existing code...

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MessageCircle size={64} color={Colors.textLight} />
      <Text style={styles.emptyStateTitle}>Sin Conversaciones</Text>
      <Text style={styles.emptyStateText}>
        Las conversaciones aparecerán aquí cuando te conectes con otros miembros de la comunidad.
      </Text>
      <Text style={styles.emptyStateHint}>
        Ve a "Cerca de Mí" o "Descubrir" para encontrar personas con quien conectar.
      </Text>
    </View>
  );

  const renderNewMessageModal = () => {
    // Safety check: Don't show modal if we're actively viewing a conversation
    if (newMessageNotification) {
      // Don't show modal if actively viewing this specific conversation
      if (activeConversation) {
        const isForActiveConvo =
          newMessageNotification.conversationId === activeConversation.conversationId ||
          newMessageNotification.senderId === parseInt(activeConversation.userId);

        if (isForActiveConvo) {
          console.log('⚠️ Suppressing modal - already viewing this conversation', {
            notificationConvoId: newMessageNotification.conversationId,
            activeConvoId: activeConversation.conversationId,
            notificationSenderId: newMessageNotification.senderId,
            activeUserId: parseInt(activeConversation.userId)
          });
          // Clear the notification without showing modal
          setNewMessageNotification(null);
          return null;
        }
      }

      // Don't show modal if tab is not focused (user on another screen)
      if (!isFocused) {
        console.log('⚠️ Suppressing modal - Messages tab not focused');
        // Don't clear - just don't render
        return null;
      }
    }

    return (
      <Modal
        visible={newMessageNotification !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setNewMessageNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Mensaje</Text>
              <TouchableOpacity onPress={() => {
                console.log('❌ Modal X button pressed');
                setNewMessageNotification(null);
              }}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {newMessageNotification && (
              <>
                <View style={styles.modalBody}>
                  <Image
                    source={{ uri: newMessageNotification.senderAvatar || 'https://via.placeholder.com/60' }}
                    style={styles.modalAvatar}
                  />
                  <Text style={styles.modalSenderName}>{newMessageNotification.senderName}</Text>
                  <Text style={styles.modalMessageText}>{newMessageNotification.messageText}</Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setNewMessageNotification(null);
                      // Force refresh conversations to ensure UI is updated
                      loadConversations();
                    }}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Cerrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => {
                      // Open conversation
                      const convo = conversations.find(c => c.id === newMessageNotification.conversationId);
                      if (convo) {
                        handleOpenConversation(convo);
                      } else {
                        // If conversation not in list yet, create it manually
                        setActiveConversation({
                          userId: newMessageNotification.senderId.toString(),
                          userName: newMessageNotification.senderName,
                          userAvatar: newMessageNotification.senderAvatar,
                          conversationId: newMessageNotification.conversationId,
                        });
                        loadConversationMessages(newMessageNotification.conversationId);
                      }
                      setNewMessageNotification(null);
                    }}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Abrir</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  // Show conversation view if active
  if (activeConversation) {
    return (
      <View style={styles.container}>
        {renderConversation()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Mensajes</Text>
          <Text style={styles.headerSubtitle}>Conecta con tu comunidad</Text>

          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar conversaciones..."
              placeholderTextColor={Colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              testID="search-conversations"
            />
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <MessageCircle size={20} color={Colors.textOnGold} />
            <Text style={styles.statValue}>{conversations.length}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.success }]} />
            <Text style={styles.statValue}>{isSocketConnected ? 1 : 0}</Text>
            <Text style={styles.statLabel}>En Línea</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: Colors.warning }]} />
            <Text style={styles.statValue}>
              {conversations.reduce((sum, c) => sum + c.unread_count, 0)}
            </Text>
            <Text style={styles.statLabel}>No Leídos</Text>
          </View>
        </View>

        {isLoadingConversations ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={Colors.gold} size="large" />
            <Text style={[styles.emptyStateText, { marginTop: 16 }]}>Cargando conversaciones...</Text>
          </View>
        ) : (
          <FlatList
            data={conversations.filter(c =>
              (typeof c.name === 'string' && c.name && c.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (typeof c.last_message === 'string' && c.last_message && c.last_message.toLowerCase().includes(searchQuery.toLowerCase()))
            )}
            renderItem={({ item }) => renderConversationItem(item)}
            keyExtractor={item => item.id.toString()}
            style={styles.conversationsList}
            ListEmptyComponent={renderEmptyState()}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingConversations}
                onRefresh={onRefresh}
                colors={[Colors.primary]}
                tintColor={Colors.primary}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )}
      </View>

      {/* New message notification modal */}
      {renderNewMessageModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingBottom: 20,
    backgroundColor: Colors.background,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.gold,
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textOnGold,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textOnGold,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  // Conversation styles
  conversationContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  conversationHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  conversationStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  onlineStatus: {
    color: Colors.success,
  },
  offlineStatus: {
    color: Colors.textLight,
  },
  messagesList: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messagesContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyConversation: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyConversationText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.gold,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: Colors.text,
  },
  otherMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: Colors.textLight,
    textAlign: 'right',
  },
  otherMessageTime: {
    color: Colors.textLight,
  },
  messageInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  messageInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    color: Colors.text,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: Colors.textLight,
  },
  unreadBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  modalSenderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  modalMessageText: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: Colors.gold,
  },
  modalButtonSecondary: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalButtonTextPrimary: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { Search, MessageCircle, Send, ArrowLeft, X } from '../../components/SmartIcons';
import { Colors } from '@/constants/colors';
import { useUser } from '@/hooks/user-store';
import { initSocket, getSocket } from '@/app/services/socket';
import { getApiBaseUrl } from '@/utils/api-config';
import { messageEventBus } from '@/utils/messageEventBus';

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
  const scrollViewRef = useRef<ScrollView>(null);
  const socketRef = useRef<ReturnType<typeof initSocket> | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState<{
    senderName: string;
    senderAvatar?: string;
    messageText: string;
    senderId: number;
    conversationId: number;
  } | null>(null);

  // Load conversations from backend
  const loadConversations = async () => {
    if (!currentUser) return;
    
    setIsLoadingConversations(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/conversations/user/${currentUser.id}`);
      if (response.ok) {
        const data = await response.json();
        console.log('📬 Loaded conversations for user', currentUser.id, ':', data);
        console.log('📬 Current user name:', currentUser.name, 'ID:', currentUser.id);
        // Debug each conversation
        data.forEach((conv: any) => {
          console.log(`  📬 Conversation ${conv.id}:`);
          console.log(`     - name: "${conv.name}" (should be OTHER user's name)`);
          console.log(`     - other_user_id: ${conv.other_user_id}`);
          console.log(`     - avatar: ${conv.avatar}`);
          console.log(`     - ⚠️  ISSUE CHECK: Is name "${conv.name}" same as current user "${currentUser.name}"? ${conv.name === currentUser.name ? 'YES - BUG!' : 'No - OK'}`);
        });
        setConversations(data);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load conversations on mount and when new messages arrive
  useEffect(() => {
    loadConversations();
  }, [currentUser]);

  // Initialize socket connection - use existing global socket
  useEffect(() => {
    if (currentUser) {
      // Get the existing global socket instead of creating a new one
      const socket = getSocket();
      
      if (!socket) {
        console.warn('⚠️ Global socket not initialized, creating fallback socket');
        socketRef.current = initSocket({ userId: parseInt(currentUser.id as string) });
      } else {
        console.log('✅ Using global socket connection for Messages screen');
        socketRef.current = socket;
      }
      
      if (socket) {
        // Update connection status
        setIsSocketConnected(socket.connected);
        
        // If already connected, join immediately
        if (socket.connected) {
          console.log('Socket already connected, joining room for user:', currentUser.id);
          socket.emit('user:join', parseInt(currentUser.id as string));
        }
        
        socket.on('connect', () => {
          console.log('Socket connected for messaging, user:', currentUser.id);
          setIsSocketConnected(true);
          // Join user room
          console.log('Emitting user:join for user:', currentUser.id);
          socket.emit('user:join', parseInt(currentUser.id as string));
        });

        socket.on('disconnect', () => {
          console.log('Socket disconnected for user:', currentUser.id);
          setIsSocketConnected(false);
        });
      }
    }

    return () => {
      // Don't disconnect the global socket, just clean up listeners
      if (socketRef.current) {
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
      }
    };
  }, [currentUser]);

  // Subscribe to message event bus (replaces duplicate socket handler)
  useEffect(() => {
    if (!currentUser) return;

    console.log('📬 [Messages Screen] Subscribing to message event bus');

    const unsubscribe = messageEventBus.onNewMessage((message) => {
      console.log('📬 [Messages Screen] Received message from event bus:', message);
      console.log('📬 [Messages Screen] Current user:', currentUser?.id, currentUser?.name);
      console.log('📬 [Messages Screen] Message sender_id:', message.sender_id, 'receiver_id:', message.receiver_id);
      
      // Safety check
      if (!message || !message.text) {
        console.warn('❌ Invalid message from event bus:', message);
        return;
      }

      // Reload conversations list to show new message
      loadConversations();

      // Check if this is a message I received (not sent by me)
      const isReceivedByMe = message.receiver_id === parseInt(currentUser.id as string);
      const isSentByMe = message.sender_id === parseInt(currentUser.id as string);
      
      if (isReceivedByMe && !isSentByMe) {
        // Check if we're ACTIVELY VIEWING this specific conversation right now
        const isActivelyViewingThisConversation = isFocused && 
          activeConversation && 
          message.sender_id === parseInt(activeConversation.userId) &&
          message.conversation_id === activeConversation.conversationId;
        
        console.log('📬 Notification check:', {
          isTabFocused: isFocused,
          hasActiveConversation: !!activeConversation,
          activeConvoUserId: activeConversation?.userId,
          activeConvoId: activeConversation?.conversationId,
          messageSenderId: message.sender_id,
          messageConvoId: message.conversation_id,
          isActivelyViewing: isActivelyViewingThisConversation
        });
        
        if (!isActivelyViewingThisConversation) {
          // Show notification modal - user is NOT actively viewing this conversation
          console.log('📬 Showing notification from:', message.sender_name || `User ${message.sender_id}`);
          
          setNewMessageNotification({
            senderName: message.sender_name || `User ${message.sender_id}`,
            senderAvatar: message.sender_avatar,
            messageText: message.text,
            senderId: message.sender_id,
            conversationId: message.conversation_id,
          });
          
          // Return true to stop propagation - we handled the notification
          return true;
        } else {
          console.log('✅ User is actively viewing this conversation - no notification needed');
          // Return true to stop propagation - actively viewing, no notification needed
          return true;
        }
      }
      
      // Add message to active conversation if applicable
      setMessages(prev => {
        if (activeConversation) {
          const isFromActiveUser = message.sender_id === parseInt(activeConversation.userId);
          const isToActiveUser = message.receiver_id === parseInt(activeConversation.userId);
          const isSentByMe = message.sender_id === parseInt(currentUser.id as string);
          const isReceivedByMe = message.receiver_id === parseInt(currentUser.id as string);
          
          // Only add if message is between me and the active conversation user
          if (!((isSentByMe && isToActiveUser) || (isReceivedByMe && isFromActiveUser))) {
            console.log('⏭️ Message not for active conversation, ignoring');
            return prev;
          }
        }
        
        // Check for duplicate by ID
        const messageId = message.id?.toString();
        if (messageId && prev.some(m => m.id === messageId)) {
          console.log('⏭️ Duplicate message ID, ignoring');
          return prev;
        }
        
        console.log('💬 Message added to local state');
        return [...prev, {
          id: message.id?.toString() || Date.now().toString(),
          text: message.text,
          senderId: message.sender_id?.toString(),
          sender: message.sender_id === parseInt(currentUser.id as string) ? 'me' : 'other',
          timestamp: new Date(message.created_at),
        }];
      });
    });

    return unsubscribe;
  }, [currentUser, isFocused, activeConversation]);

  // Load message history for active conversation
  const loadConversationMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        console.log('💬 Loaded messages:', data.length);
        setMessages(data.map((msg: any) => ({
          id: msg.id.toString(),
          text: msg.text,
          senderId: msg.sender_id.toString(),
          sender: msg.sender_id === parseInt(currentUser?.id as string) ? 'me' : 'other',
          timestamp: new Date(msg.created_at),
        })));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Create or get conversation ID
  const getOrCreateConversation = async (userId1: number, userId2: number): Promise<number | null> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user1Id: userId1, user2Id: userId2 }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('💬 Conversation ID:', data.id);
        return data.id;
      }
    } catch (error) {
      console.error('Failed to get/create conversation:', error);
    }
    return null;
  };

  // Auto-create conversation when startConversationWith param is present
  useEffect(() => {
    if (params.startConversationWith && params.userName && currentUser) {
      const initConversation = async () => {
        const conversationId = await getOrCreateConversation(
          parseInt(currentUser.id as string),
          parseInt(params.startConversationWith as string)
        );
        
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
    }
  }, [activeConversation?.conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

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
        parseInt(currentUser.id as string),
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
      senderId: parseInt(currentUser.id as string),
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
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyConversation}>
            <MessageCircle size={48} color={Colors.textLight} />
            <Text style={styles.emptyConversationText}>
              Comienza la conversación con {activeConversation?.userName}
            </Text>
          </View>
        ) : (
          messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.sender === 'me' ? styles.myMessage : styles.otherMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                message.sender === 'me' ? styles.myMessageText : styles.otherMessageText
              ]}>
                {message.text}
              </Text>
              <Text style={[
                styles.messageTime,
                message.sender === 'me' ? styles.myMessageTime : styles.otherMessageTime
              ]}>
                {message.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

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

  const renderConversationItem = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationItem}
      onPress={() => handleOpenConversation(conversation)}
    >
      <Image
        source={{ uri: conversation.avatar || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.conversationInfo}>
        <View style={styles.conversationItemHeader}>
          <Text style={styles.conversationName}>{conversation.name}</Text>
          {conversation.last_message_time && (
            <Text style={styles.timestamp}>
              {new Date(conversation.last_message_time).toLocaleTimeString('es', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
        <View style={styles.lastMessageRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {conversation.last_message || 'Sin mensajes'}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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

  const renderNewMessageModal = () => (
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
            <TouchableOpacity onPress={() => setNewMessageNotification(null)}>
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
                  onPress={() => setNewMessageNotification(null)}
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
            <Text style={styles.emptyStateText}>Cargando conversaciones...</Text>
          </View>
        ) : conversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView style={styles.conversationsList}>
            {conversations.map(renderConversationItem)}
          </ScrollView>
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

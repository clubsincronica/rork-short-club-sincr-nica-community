import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MessageCircle, Phone, Video, MoreHorizontal } from 'lucide-react-native';
import { mockUsers } from '@/mocks/data';
import { Colors } from '@/constants/colors';



interface MockConversation {
  id: string;
  participant: typeof mockUsers[0];
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

const mockConversations: MockConversation[] = [
  {
    id: '1',
    participant: mockUsers[0],
    lastMessage: '¡Gracias por la increíble sesión de Reiki! Me siento mucho mejor.',
    timestamp: 'hace 2m',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: '2',
    participant: mockUsers[1],
    lastMessage: 'Esperando con ansias nuestra sesión de coaching mañana a las 3 PM.',
    timestamp: 'hace 1h',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: '3',
    participant: mockUsers[2],
    lastMessage: '¡El baño de sonido fue increíble! ¿Podemos programar otro?',
    timestamp: 'hace 3h',
    unreadCount: 1,
    isOnline: false,
  },
];

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  const filteredConversations = mockConversations.filter(conversation =>
    conversation.participant.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversationList = () => (
    <ScrollView style={styles.conversationsList} showsVerticalScrollIndicator={false}>
      {filteredConversations.map((conversation) => (
        <TouchableOpacity
          key={conversation.id}
          style={[
            styles.conversationItem,
            selectedConversation === conversation.id && styles.selectedConversation
          ]}
          onPress={() => setSelectedConversation(conversation.id)}
          testID={`conversation-${conversation.id}`}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: conversation.participant.avatar }} style={styles.avatar} />
            {conversation.isOnline && <View style={styles.onlineIndicator} />}
          </View>
          
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <Text style={styles.participantName}>{conversation.participant.name}</Text>
              <Text style={styles.timestamp}>{conversation.timestamp}</Text>
            </View>
            <View style={styles.messagePreview}>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {conversation.lastMessage}
              </Text>
              {conversation.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>{conversation.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderChatView = () => {
    const conversation = mockConversations.find(c => c.id === selectedConversation);
    if (!conversation) return null;

    return (
      <View style={styles.chatContainer}>
        <View style={styles.chatHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setSelectedConversation(null)}
            testID="back-button"
          >
            <Text style={styles.backButtonText}>← Atrás</Text>
          </TouchableOpacity>
          
          <View style={styles.chatHeaderInfo}>
            <Image source={{ uri: conversation.participant.avatar }} style={styles.chatAvatar} />
            <View>
              <Text style={styles.chatParticipantName}>{conversation.participant.name}</Text>
              <Text style={styles.chatStatus}>
                {conversation.isOnline ? 'En línea' : 'Visto hace 2h'}
              </Text>
            </View>
          </View>
          
          <View style={styles.chatActions}>
            <TouchableOpacity style={styles.chatActionButton} testID="phone-button">
              <Phone size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatActionButton} testID="video-button">
              <Video size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.chatActionButton} testID="more-button">
              <MoreHorizontal size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.messageReceived}>
            <Text style={styles.messageText}>
              ¡Hola! Estoy interesado en reservar una sesión de Reiki. ¿Qué horarios tienes disponibles esta semana?
            </Text>
            <Text style={styles.messageTime}>Ayer, 2:30 PM</Text>
          </View>
          
          <View style={styles.messageSent}>
            <Text style={styles.messageText}>
              ¡Hola! Tengo disponibilidad el miércoles a las 3 PM o el viernes a las 10 AM. Ambas sesiones serían de 60 minutos. ¿Te funcionaría alguna de esas?
            </Text>
            <Text style={styles.messageTime}>Ayer, 3:15 PM</Text>
          </View>
          
          <View style={styles.messageReceived}>
            <Text style={styles.messageText}>
              {conversation.lastMessage}
            </Text>
            <Text style={styles.messageTime}>Hoy, 10:30 AM</Text>
          </View>
        </ScrollView>

        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={Colors.textLight}
            multiline
            testID="message-input"
          />
          <TouchableOpacity style={styles.sendButton} testID="send-button">
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!selectedConversation ? (
        <>
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
                <MessageCircle size={20} color={Colors.primary} />
                <Text style={styles.statValue}>{mockConversations.length}</Text>
                <Text style={styles.statLabel}>Chats Activos</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: Colors.success }]} />
                <Text style={styles.statValue}>
                  {mockConversations.filter(c => c.isOnline).length}
                </Text>
                <Text style={styles.statLabel}>En Línea Ahora</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, { backgroundColor: Colors.warning }]} />
                <Text style={styles.statValue}>
                  {mockConversations.reduce((sum, c) => sum + c.unreadCount, 0)}
                </Text>
                <Text style={styles.statLabel}>No Leídos</Text>
              </View>
            </View>

            {renderConversationList()}
          </View>
        </>
      ) : (
        renderChatView()
      )}
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
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: -10,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
  },
  conversationsList: {
    flex: 1,
    paddingTop: 20,
  },
  conversationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedConversation: {
    backgroundColor: Colors.secondary,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textLight,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textLight,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  chatParticipantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  chatStatus: {
    fontSize: 12,
    color: Colors.textLight,
  },
  chatActions: {
    flexDirection: 'row',
    gap: 12,
  },
  chatActionButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
    marginBottom: 16,
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  messageInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
    gap: 12,
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
});

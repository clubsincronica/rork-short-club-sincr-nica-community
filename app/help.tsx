import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  Book,
  Video,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Send,
  ExternalLink,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRouter } from 'expo-router';
import { TouchableScale } from '@/components/TouchableScale';
import { AccessibleText } from '@/components/AccessibleText';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    email: '',
  });
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'resources'>('faq');

  const faqs: FAQ[] = [
    {
      id: '1',
      question: '¿Cómo puedo crear mi primer evento?',
      answer: 'Para crear un evento, ve a la sección "Mi Calendario" desde tu perfil. Toca el botón "+" y completa la información del evento. Asegúrate de ser un proveedor de servicios verificado.',
      category: 'Eventos',
    },
    {
      id: '2',
      question: '¿Cómo puedo reservar una sesión?',
      answer: 'Navega por los servicios disponibles en las pestañas principales, selecciona el que te interese y toca "Reservar". Podrás elegir fecha, hora y completar el pago.',
      category: 'Reservas',
    },
    {
      id: '3',
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard), PayPal y transferencias bancarias. Todos los pagos son procesados de forma segura.',
      category: 'Pagos',
    },
    {
      id: '4',
      question: '¿Puedo cancelar una reserva?',
      answer: 'Sí, puedes cancelar una reserva hasta 24 horas antes del evento. Ve a "Mi Calendario" > "Reservas" y selecciona la reserva que deseas cancelar.',
      category: 'Reservas',
    },
    {
      id: '5',
      question: '¿Cómo me convierto en proveedor de servicios?',
      answer: 'Contacta con nuestro equipo a través del formulario de contacto o envía un email a proveedores@clubsincronica.com con tu información y certificaciones.',
      category: 'Proveedores',
    },
    {
      id: '6',
      question: '¿Hay servicios online disponibles?',
      answer: 'Sí, muchos de nuestros proveedores ofrecen sesiones online. Busca el ícono de "Online" en las descripciones de los servicios.',
      category: 'Servicios',
    },
    {
      id: '7',
      question: '¿Cómo puedo cambiar mi contraseña?',
      answer: 'Ve a tu perfil, toca "Editar Perfil" y luego "Cambiar Contraseña". También puedes usar la opción "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión.',
      category: 'Cuenta',
    },
    {
      id: '8',
      question: '¿Puedo obtener un reembolso?',
      answer: 'Los reembolsos se procesan según la política de cancelación de cada proveedor. Generalmente, las cancelaciones con más de 24 horas de anticipación son elegibles para reembolso completo.',
      category: 'Pagos',
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = [...new Set(faqs.map((faq) => faq.category))];

  const handleSendMessage = () => {
    if (!contactForm.subject || !contactForm.message || !contactForm.email) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    Alert.alert(
      'Mensaje Enviado',
      'Hemos recibido tu mensaje. Te responderemos en las próximas 24 horas.',
      [
        {
          text: 'OK',
          onPress: () => {
            setContactForm({ subject: '', message: '', email: '' });
          },
        },
      ]
    );
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'soporte@clubsincronica.com',
      action: () => Linking.openURL('mailto:soporte@clubsincronica.com'),
    },
    {
      icon: Phone,
      title: 'Teléfono',
      description: '+34 900 123 456',
      action: () => Linking.openURL('tel:+34900123456'),
    },
    {
      icon: MessageCircle,
      title: 'Chat en Vivo',
      description: 'Lun-Vie 9:00-18:00',
      action: () => Alert.alert('Próximamente', 'El chat en vivo estará disponible pronto'),
    },
  ];

  const resources = [
    {
      icon: Book,
      title: 'Guía de Usuario',
      description: 'Manual completo de la aplicación',
      action: () => Alert.alert('Próximamente', 'La guía estará disponible pronto'),
    },
    {
      icon: Video,
      title: 'Tutoriales en Video',
      description: 'Aprende con videos paso a paso',
      action: () => Alert.alert('Próximamente', 'Los tutoriales estarán disponibles pronto'),
    },
    {
      icon: ExternalLink,
      title: 'Centro de Ayuda Web',
      description: 'Visita nuestro sitio web para más información',
      action: () => Linking.openURL('https://clubsincronica.com/ayuda'),
    },
  ];

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayuda y Soporte</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.tabActive]}
          onPress={() => setActiveTab('faq')}
        >
          <HelpCircle size={18} color={activeTab === 'faq' ? Colors.white : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contact' && styles.tabActive]}
          onPress={() => setActiveTab('contact')}
        >
          <MessageCircle size={18} color={activeTab === 'contact' ? Colors.white : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>Contacto</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resources' && styles.tabActive]}
          onPress={() => setActiveTab('resources')}
        >
          <Book size={18} color={activeTab === 'resources' ? Colors.white : Colors.textLight} />
          <Text style={[styles.tabText, activeTab === 'resources' && styles.tabTextActive]}>Recursos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'faq' && (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchBox}>
                <Search size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar en preguntas frecuentes..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.textLight}
                />
              </View>
            </View>

            <View style={styles.categoriesContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.categoryChip, !searchQuery && styles.categoryChipActive]}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={[styles.categoryChipText, !searchQuery && styles.categoryChipTextActive]}>
                    Todas
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryChip}
                    onPress={() => setSearchQuery(category)}
                  >
                    <Text style={styles.categoryChipText}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.faqContainer}>
              {filteredFAQs.map((faq) => (
                <View key={faq.id} style={styles.faqItem}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  >
                    <View style={styles.faqQuestionContent}>
                      <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      <View style={styles.faqCategory}>
                        <Text style={styles.faqCategoryText}>{faq.category}</Text>
                      </View>
                    </View>
                    {expandedFAQ === faq.id ? (
                      <ChevronUp size={20} color={Colors.primary} />
                    ) : (
                      <ChevronDown size={20} color={Colors.textLight} />
                    )}
                  </TouchableOpacity>
                  {expandedFAQ === faq.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}

        {activeTab === 'contact' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Métodos de Contacto</Text>
              {contactMethods.map((method, index) => (
                <TouchableOpacity key={index} style={styles.contactMethod} onPress={method.action}>
                  <View style={styles.contactMethodLeft}>
                    <View style={styles.contactMethodIcon}>
                      <method.icon size={20} color={Colors.primary} />
                    </View>
                    <View style={styles.contactMethodInfo}>
                      <Text style={styles.contactMethodTitle}>{method.title}</Text>
                      <Text style={styles.contactMethodDescription}>{method.description}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enviar Mensaje</Text>
              <View style={styles.contactForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={contactForm.email}
                    onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
                    placeholder="tu@email.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Asunto</Text>
                  <TextInput
                    style={styles.input}
                    value={contactForm.subject}
                    onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                    placeholder="¿En qué podemos ayudarte?"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mensaje</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={contactForm.message}
                    onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                    placeholder="Describe tu consulta o problema..."
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>
                <TouchableScale style={styles.sendButton} onPress={handleSendMessage}>
                  <Send size={20} color={Colors.white} />
                  <AccessibleText style={styles.sendButtonText}>Enviar Mensaje</AccessibleText>
                </TouchableScale>
              </View>
            </View>
          </>
        )}

        {activeTab === 'resources' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recursos de Ayuda</Text>
            {resources.map((resource, index) => (
              <TouchableOpacity key={index} style={styles.resourceItem} onPress={resource.action}>
                <View style={styles.resourceLeft}>
                  <View style={styles.resourceIcon}>
                    <resource.icon size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.textLight} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No encuentras lo que buscas?</Text>
          <Text style={styles.footerSubtext}>
            Nuestro equipo de soporte está aquí para ayudarte
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textLight,
  },
  tabTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: Colors.white,
  },
  faqContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  faqItem: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionContent: {
    flex: 1,
    marginRight: 12,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 4,
  },
  faqCategory: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  faqCategoryText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  faqAnswerText: {
    fontSize: 14,
    color: Colors.textLight,
    lineHeight: 20,
    paddingTop: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactMethodInfo: {
    flex: 1,
  },
  contactMethodTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  contactMethodDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  contactForm: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resourceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceInfo: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  resourceDescription: {
    fontSize: 12,
    color: Colors.textLight,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  footerSubtext: {
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
  },
});

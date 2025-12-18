# Functional Diagnostic Checklist
**Date:** November 6, 2025  
**Server Status:** ✅ Running on http://192.168.100.12:8081  
**Build Status:** ✅ No TypeScript errors

---

## 🛒 Cart & Reservation Flow

### Service Discovery & Selection
- [ ] **Discover Tab** - Browse services and lodging
  - [ ] Click on service card opens service detail
  - [ ] "Inscribirme" button opens ServiceReservationModal
  - [ ] Modal shows correct service provider (not Luna Moonwhisper)
  
### Adding to Cart
- [ ] **ServiceReservationModal** - Select slot and add to cart
  - [ ] Date picker works
  - [ ] Time slot selection works
  - [ ] Number of spots selector works
  - [ ] "Añadir al Carrito" button adds item to cart
  - [ ] Success toast appears: "Añadido al carrito. Ve a Perfil > Carrito para pagar"
  - [ ] Provider information is correct (providerId and provider object)
  - [ ] Modal closes after adding to cart

### Cart Management (Profile > Cuenta > Carrito)
- [ ] **Profile Tab** - Navigate to cart
  - [ ] "Carrito" menu item shows item count badge
  - [ ] Badge shows correct number (e.g., "2 items en tu carrito")
  - [ ] Click on Carrito navigates to /payment
  
- [ ] **Payment Screen** - Review and manage cart
  - [ ] All cart items display correctly
  - [ ] Each item shows: title, provider name, date, time, spots
  - [ ] Provider name is correct (River Sage, Sage Martinez, Crystal Moon, etc.)
  - [ ] Delete button (trash icon) appears for each item
  - [ ] Click delete shows confirmation dialog
  - [ ] Confirm delete removes item from cart
  - [ ] Cart total calculates correctly
  - [ ] Console logs show correct providerId and providerName

### Checkout Flow
- [ ] **Payment Screen** - Complete purchase
  - [ ] Payment method selector works (Tarjeta, PayPal, Transferencia)
  - [ ] "Pagar Ahora" button is enabled when payment method selected
  - [ ] Click "Pagar Ahora" shows confirmation modal
  - [ ] "Confirmar Pago" processes checkout
  - [ ] Success message appears
  - [ ] Cart clears after successful payment
  - [ ] Navigates back to Profile

### Calendar Verification
- [ ] **Services Tab > Mi Calendario** - Verify reservations appear
  - [ ] All purchased services show in calendar
  - [ ] Provider names are correct (not Luna Moonwhisper)
  - [ ] Click on event shows detail modal
  - [ ] Event details show correct provider name

---

## 💬 Messages Functionality

### Message List
- [ ] **Messages Tab** - Conversation list
  - [ ] All mock conversations display
  - [ ] Online indicators show for active users
  - [ ] Last message preview shows
  - [ ] Unread count badges show
  - [ ] Search functionality works

### Chat View
- [ ] **Open Conversation** - Chat interface
  - [ ] Click conversation opens chat view
  - [ ] Back button returns to list
  - [ ] Participant name and avatar display
  - [ ] Online status shows correctly
  - [ ] Phone, video, more buttons present

### Message Display
- [ ] **Message Alignment** - Left/right positioning
  - [ ] Other person's messages appear on **LEFT** (light mauve background)
  - [ ] Your messages appear on **RIGHT** (purple background)
  - [ ] Message history shows all previous messages
  - [ ] Timestamps display correctly
  - [ ] Text is readable (white text on sent messages)

### Sending Messages
- [ ] **Message Input** - Type and send
  - [ ] TextInput accepts typing
  - [ ] Text appears as you type
  - [ ] "Enviar" button is clickable
  - [ ] Click "Enviar" sends message
  - [ ] New message appears on right side
  - [ ] Input clears after sending
  - [ ] Conversation's lastMessage updates
  - [ ] Console logs confirm message sent

### Starting New Conversation
- [ ] **From User Profile** - Message button
  - [ ] Click user profile
  - [ ] Click "Enviar Mensaje" button
  - [ ] Opens Messages tab with conversation
  - [ ] Can type and send first message
  - [ ] Message appears correctly

---

## 📅 Calendar Features

### Calendar View
- [ ] **Services Tab > Mi Calendario**
  - [ ] Month view displays correctly
  - [ ] Days with events show indicators
  - [ ] Can navigate between months
  - [ ] Today is highlighted
  - [ ] Selected date shows events list below

### Event Management
- [ ] **Event Details**
  - [ ] Click event opens detail modal
  - [ ] All event info displays (title, time, location, price)
  - [ ] Provider information is correct
  - [ ] Can close modal

### Creating Events (Service Providers)
- [ ] **Add Event Button**
  - [ ] Navigate to /add-event
  - [ ] Form accepts all fields
  - [ ] Can create new event
  - [ ] Event appears in calendar

---

## 👤 User Profile

### Own Profile
- [ ] **Profile Tab** - View own profile
  - [ ] Avatar and name display
  - [ ] Bio shows
  - [ ] Location and rating visible
  - [ ] Specialties list shows

### Profile Sections
- [ ] **Cuenta Section**
  - [ ] Carrito shows with badge
  - [ ] Métodos de pago
  - [ ] Cuentas Bancarias
  - [ ] Notificaciones
  - [ ] Configuración

- [ ] **Community Section**
  - [ ] Mi Tablero
  - [ ] Gestión de Tablero
  - [ ] Crear Acción

- [ ] **Other Options**
  - [ ] Ayuda
  - [ ] Privacidad
  - [ ] Cerrar Sesión

### Visiting Other Profiles
- [ ] **User Profile View**
  - [ ] Click user from services
  - [ ] Profile loads correctly
  - [ ] Services tab shows user's services
  - [ ] Can reserve services
  - [ ] "Enviar Mensaje" button works

---

## 🔍 Discovery & Services

### Discover Tab
- [ ] **Browse Content**
  - [ ] Service cards display
  - [ ] Lodging cards display
  - [ ] Category filter works
  - [ ] Search functionality
  - [ ] Online/offline indicators

### Service Details
- [ ] **Service Detail Screen**
  - [ ] Click service opens detail
  - [ ] All info displays correctly
  - [ ] Provider info correct
  - [ ] "Inscribirme" opens reservation modal
  - [ ] No direct reservation (uses cart flow)

### Services Tab (Provider Dashboard)
- [ ] **Provider View**
  - [ ] Mi Calendario shows
  - [ ] Reservas de Clientes
  - [ ] QR Scanner button
  - [ ] No cart section (moved to Profile)

---

## 🎫 Tickets & Reservations

### Ticket Wallet
- [ ] **Profile > Mi Tablero**
  - [ ] Opens ticket wallet
  - [ ] Shows all reservations
  - [ ] QR codes display
  - [ ] Can share tickets

### Managing Reservations
- [ ] **Services > Reservas de Clientes**
  - [ ] Shows client bookings
  - [ ] Can check in clients
  - [ ] QR scanner works
  - [ ] Status updates correctly

---

## 🏦 Payment Methods

### Payment Options
- [ ] **Profile > Métodos de pago**
  - [ ] Add credit card
  - [ ] Add PayPal
  - [ ] Add bank transfer info
  - [ ] Can edit/delete methods

### Bank Accounts
- [ ] **Profile > Cuentas Bancarias**
  - [ ] View account list
  - [ ] Add new account
  - [ ] Edit existing accounts
  - [ ] Delete accounts

---

## 🔔 Notifications

### Notification Center
- [ ] **Notifications Screen**
  - [ ] All notifications display
  - [ ] Unread badges show
  - [ ] Can mark as read
  - [ ] Can delete notifications

### Notification Settings
- [ ] **Profile > Notificaciones**
  - [ ] Toggle settings
  - [ ] Save preferences
  - [ ] Updates apply

---

## 🎨 UI/UX Elements

### Visual Components
- [ ] **Constellation Background** animates
- [ ] **Floating Cards** work correctly
- [ ] **Touch Scale** animations smooth
- [ ] **Loading Spinners** show during operations
- [ ] **Skeleton Loaders** display while loading

### Navigation
- [ ] **Tab Bar** switches between tabs
- [ ] **Back Buttons** navigate correctly
- [ ] **Deep Links** work (profile, messages)
- [ ] **Modal Transitions** smooth

---

## 🐛 Critical Bug Fixes Completed

### ✅ Fixed Issues
1. **Provider Attribution Bug**
   - ❌ OLD: All services showing "Luna Moonwhisper"
   - ✅ NEW: Services show correct provider (River Sage, Sage Martinez, Crystal Moon)
   - Files: ServiceReservationModal.tsx, calendar-store.tsx

2. **Cart Flow**
   - ❌ OLD: Direct reservations bypassing cart
   - ✅ NEW: All reservations go through cart → payment → checkout
   - Files: service-detail.tsx, discover.tsx

3. **Cart Location**
   - ❌ OLD: Cart in Services tab (confusing for customers)
   - ✅ NEW: Cart moved to Profile > Cuenta section
   - Files: services.tsx, profile.tsx

4. **Payment Screen**
   - ❌ OLD: Showing mock data
   - ✅ NEW: Shows real cart items with delete functionality
   - Files: payment.tsx

5. **Messages TextInput**
   - ❌ OLD: No text appears, send button doesn't work
   - ✅ NEW: Can type messages, send button works, proper left/right alignment
   - Files: messages.tsx

6. **Old Code Cleanup**
   - ❌ OLD: Multiple onReserve callbacks bypassing cart
   - ✅ NEW: Removed all dead code
   - Files: calendar.tsx, user-profile.tsx

---

## 📝 Testing Priority Order

### Priority 1 (Critical Path)
1. Cart Flow: Discover → Add to Cart → Payment → Checkout → Calendar
2. Provider Attribution: Verify correct names throughout
3. Messages: Type and send messages with proper alignment

### Priority 2 (Core Features)
4. Calendar: View events, correct provider info
5. Profile Navigation: Access cart, settings, manage account
6. Service Discovery: Browse and select services

### Priority 3 (Additional Features)
7. Ticket Wallet: View and share tickets
8. QR Scanner: Check in clients
9. Bank Accounts: Manage payment info
10. Notifications: View and manage alerts

---

## 🚀 Ready for Testing

**Server:** http://192.168.100.12:8081  
**Build Status:** Clean (No TypeScript errors)  
**Recent Changes:** 
- Fixed provider attribution throughout app
- Implemented message sending with proper alignment
- Removed old reservation bypass code
- Cart management with delete functionality

**Recommended Test Flow:**
1. Start with Messages tab - verify typing and alignment
2. Go to Discover → Select service → Add to Cart
3. Profile → Carrito → Verify provider names → Delete one item → Checkout
4. Services → Mi Calendario → Verify reservations show correct providers
5. Test message sending with proper left/right alignment

---

## 📊 Console Debugging

Watch for these console logs during testing:
- `ServiceReservationModal: service providerId: [ID]`
- `ServiceReservationModal: provider.id: [ID]`
- `ServiceReservationModal: provider name: [NAME]`
- `Calendar Store: Adding event with providerId: [ID]`
- `Calendar Store: provider name: [NAME]`
- `Payment screen cart item: [DETAILS]`
- `Message sent: [TEXT]`

These logs help verify data flow is correct at each step.

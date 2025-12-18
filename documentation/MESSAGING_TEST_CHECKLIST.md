# Messaging System Testing Checklist
**Date:** December 5, 2025  
**Railway Deployment:** In Progress  
**Expo Dev Server:** Starting

---

## Pre-Test Verification

### ✅ Railway Backend
1. **Deployment Status**
   - [ ] Check Railway dashboard shows "Deployed" status
   - [ ] Build logs show no errors
   - [ ] Health endpoint responds: `https://rork-short-club-sincr-nica-community-production.up.railway.app/health`
   - Expected: `{"status":"ok","timestamp":"..."}`

2. **Database Changes Deployed**
   - [x] `updateConversation()` function added
   - [x] Enhanced queries with sender_name and sender_avatar
   - [x] Backend creates conversation IDs if missing
   - All changes committed: `b35b0f0` and `ab96059`

---

## Test Scenario 1: Fresh Conversation

### On Matias's Phone (User ID: 1)
1. **Navigate to Messages Tab**
   - [ ] Tab loads without errors
   - [ ] Shows "Sin Conversaciones" empty state (if no prior messages)
   - [ ] Stats show: 0 Chats, 0 No Leídos

2. **Go to Near Me → Find Tomas**
   - [ ] Click on Tomas's profile
   - [ ] Click "Enviar Mensaje" button
   - [ ] Conversation opens automatically

3. **Send First Message**
   - [ ] Type: "Hola Tomas, probando mensajería"
   - [ ] Click send button
   - [ ] Message appears in conversation
   - [ ] Input clears immediately
   - [ ] Message shows on right side (sender)

4. **Check Console Logs**
   - Expected logs:
   ```
   ✅ Socket connected
   🔔 Transport: polling
   💬 Sending message via socket
   📨 RECEIVED message:new event for user 1
   ✅ Message is valid, sender: 1 receiver: 2
   💬 Message added to local state
   ```

### On Tomas's Phone (User ID: 2)
1. **Already in Messages Tab**
   - [ ] Conversation auto-opens with Matias
   - [ ] Header shows "Matias Cazeaux" (not "User 1")
   - [ ] Avatar shows Matias's profile picture
   - [ ] Message appears: "Hola Tomas, probando mensajería"

2. **Check Console Logs**
   - Expected logs:
   ```
   📡 RECEIVED message:new event for user 2
   ✅ Message is valid, sender: 1 receiver: 2
   📬 New message from user 1 - opening conversation
   📬 Opening conversation with: {senderId: "1", senderName: "Matias Cazeaux", senderAvatar: "file://..."}
   💬 Message added to local state
   ```

3. **Reply to Matias**
   - [ ] Type: "Hola Matii! Funciona perfecto 👍"
   - [ ] Click send
   - [ ] Message appears on right side (sender)
   - [ ] No duplicate messages

---

## Test Scenario 2: Conversation Persistence

### On Tomas's Phone
1. **Close Conversation**
   - [ ] Click back button (arrow or X)
   - [ ] Returns to Messages tab
   - [ ] Conversation list shows: "Matias Cazeaux"
   - [ ] Last message: "Hola Matii! Funciona perfecto 👍"
   - [ ] Timestamp shows when message was sent

2. **Reopen Conversation**
   - [ ] Click on Matias conversation
   - [ ] **CRITICAL:** Previous messages still visible
   - [ ] Both messages in conversation:
     - "Hola Tomas, probando mensajería"
     - "Hola Matii! Funciona perfecto 👍"
   - [ ] Message history loaded from database

### On Matias's Phone
1. **Back to Messages Tab**
   - [ ] Click back from conversation
   - [ ] Conversation list shows: "Tomas De La Llosa"
   - [ ] Last message visible
   - [ ] Unread count: 1 (if not opened yet)

2. **Reopen and Check History**
   - [ ] Click conversation
   - [ ] All messages still there
   - [ ] Header shows "Tomas De La Llosa" (not "User 2")
   - [ ] Avatar shows Tomas's picture

---

## Test Scenario 3: Multiple Messages

### Send 5 Messages Back and Forth
1. **Matias → Tomas:**
   - [ ] "Mensaje 1"
   - [ ] Arrives immediately at Tomas

2. **Tomas → Matias:**
   - [ ] "Respuesta 1"
   - [ ] Arrives immediately at Matias

3. **Continue for 5 rounds**
   - [ ] No messages duplicated on sender's phone
   - [ ] All messages appear in correct order
   - [ ] Timestamps are accurate

4. **Close and Reopen on Both**
   - [ ] All 10 messages still visible
   - [ ] Order preserved
   - [ ] No gaps or missing messages

---

## Test Scenario 4: Conversation While Other User is Away

### On Matias's Phone (Tomas NOT in conversation)
1. **Send Message to Tomas**
   - [ ] Type: "Mensaje mientras no estás viendo"
   - [ ] Send successfully
   - [ ] Message appears in Matias's view

### On Tomas's Phone (In different tab/app closed)
1. **Navigate to Messages Tab**
   - [ ] Conversation auto-opens
   - [ ] New message visible: "Mensaje mientras no estás viendo"
   - [ ] Unread count was 1 (before opening)

2. **Check if message was actually saved**
   - [ ] Close conversation
   - [ ] Reopen it
   - [ ] Message still there

---

## Test Scenario 5: Edge Cases

### 1. Send Message While Socket Disconnected
- [ ] Turn off WiFi/Data
- [ ] Try to send message
- [ ] Should show alert: "No estás conectado"
- [ ] Turn WiFi/Data back on
- [ ] Socket reconnects automatically

### 2. Multiple Fast Messages
- [ ] Send 5 messages rapidly (within 1 second)
- [ ] All 5 should appear
- [ ] No duplicates
- [ ] Correct order

### 3. Special Characters
- [ ] Send: "Émojis 😀🎉✨ and special çhärs"
- [ ] Receives correctly formatted
- [ ] No encoding issues

### 4. Long Message
- [ ] Send 500 character message
- [ ] Input accepts it (max: 500)
- [ ] Displays correctly
- [ ] No truncation

---

## Verification Points

### ✅ Database (Railway)
```sql
-- Check conversations created
SELECT * FROM conversations WHERE participant1_id IN (1,2) OR participant2_id IN (1,2);

-- Check messages
SELECT m.*, u.name as sender_name 
FROM messages m 
LEFT JOIN users u ON m.sender_id = u.id 
WHERE conversation_id = [CONVERSATION_ID]
ORDER BY created_at ASC;
```

### ✅ API Endpoints Working
- [ ] `GET /api/conversations/user/1` → Returns conversations for Matias
- [ ] `GET /api/conversations/user/2` → Returns conversations for Tomas
- [ ] `GET /api/conversations/[ID]/messages` → Returns message history
- [ ] `POST /api/conversations` → Creates new conversation

### ✅ Socket.IO Events
- [ ] `user:join` emitted on connection
- [ ] `message:send` emitted when sending
- [ ] `message:new` received by both users
- [ ] No errors in console

---

## Common Issues & Solutions

### Issue: "Failed to load conversations"
**Solution:** Backend not deployed yet or wrong API URL
- Check Railway deployment status
- Verify `getApiBaseUrl()` returns Railway URL
- Check network tab in browser/debugger

### Issue: Messages duplicate on sender
**Solution:** Should be fixed, but if happens:
- Check for optimistic updates in code
- Verify duplicate detection by message ID

### Issue: "User 1" and "User 2" instead of names
**Solution:** Backend queries not returning sender info
- Verify backend deployed with JOIN queries
- Check `getMessageById` includes LEFT JOIN with users table

### Issue: Conversation starts fresh each time
**Solution:** Not loading message history
- Verify `loadConversationMessages()` called
- Check conversation ID is passed correctly
- Inspect network request to `/api/conversations/[ID]/messages`

### Issue: Messages don't reach other user
**Solution:** Socket.IO rooms issue
- Check both users emitted `user:join`
- Verify backend emits to both `user:${senderId}` and `user:${receiverId}`
- Check conversation ID is valid (not 0 or null)

---

## Success Criteria

All boxes must be checked for messaging to be production-ready:

- [ ] ✅ Conversations show in Messages tab list
- [ ] ✅ Real names and avatars (not "User 1" or "User 2")
- [ ] ✅ Messages persist when conversation closed and reopened
- [ ] ✅ Messages deliver even when receiver not viewing conversation
- [ ] ✅ No duplicate messages on sender's phone
- [ ] ✅ Conversation list updates when new message arrives
- [ ] ✅ Timestamps are accurate
- [ ] ✅ Message history loads from database
- [ ] ✅ Socket.IO stays connected (auto-reconnect works)
- [ ] ✅ Empty states show when no conversations

---

## Next Steps After Testing

### If All Tests Pass ✅
1. Test on physical devices (not just simulator)
2. Test with poor network conditions
3. Test with background app (iOS/Android)
4. Proceed with iOS TestFlight build

### If Issues Found ❌
1. Document specific error messages
2. Check backend logs in Railway dashboard
3. Review Socket.IO connection state
4. Verify database has correct schema
5. Report findings for debugging

---

**Testing Started:** _________  
**Testing Completed:** _________  
**Result:** ⬜ PASS | ⬜ FAIL | ⬜ PARTIAL  
**Notes:**


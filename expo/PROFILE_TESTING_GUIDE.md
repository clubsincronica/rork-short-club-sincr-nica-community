# Profile Tab Testing Guide

This guide explains how to test all the functions in the Profile tab of Club Sincrónica.

## Authentication Functions

### When NOT logged in:
1. **Sign In Button** - Opens login modal
   - Enter any email and password
   - Creates a demo user account
   - Test: Try empty fields (should show error)

2. **Create Account Button** - Opens signup modal
   - Fill in name, email, password, confirm password
   - Creates a new demo user account
   - Test: Try mismatched passwords (should show error)

### When logged in:

## Profile Management

3. **Edit Profile Button** - Opens profile editing modal
   - Change avatar (opens image picker)
   - Edit name, email, bio, location
   - Add specialties and interests (comma-separated)
   - Test: Save changes and verify they persist

4. **Payment Methods Button** - Opens payment management modal
   - View existing payment methods
   - Delete payment methods (shows confirmation)
   - Add new payment method (shows "coming soon" alert)

## Navigation Functions

5. **Mi Calendario Button** - Navigates to `/calendar`
   - Full calendar functionality
   - Create events (if service provider)
   - Make reservations
   - View different tabs: Calendar, My Events, Reservations, Settings

6. **Privacy and Security Button** - Navigates to `/privacy`
   - Toggle privacy settings
   - Export data functionality
   - Delete account (with confirmations)
   - View privacy policies

7. **App Settings Button** - Navigates to `/settings`
   - Notification preferences
   - Theme settings (dark/light mode)
   - Data synchronization options
   - Clear cache and reset settings

8. **Help and Support Button** - Navigates to `/help`
   - Browse FAQ with search
   - Contact form
   - Contact methods (email, phone)
   - Resource links

## Interactive Elements

9. **Notifications Toggle** - Switches notification preferences
   - Toggles between on/off
   - Updates user preferences

10. **Activity/Achievements Tabs**
    - Switch between activity feed and achievements
    - View user's activity history
    - See earned and unearned achievements

11. **Logout Button** - Signs out the user
    - Returns to login screen
    - Clears user session

## Testing Tips

### Data Persistence
- All user data is stored in AsyncStorage
- Changes persist between app restarts
- Test by making changes, closing app, and reopening

### Error Handling
- Try submitting forms with empty fields
- Test network-dependent features
- Verify error messages are user-friendly

### Navigation
- Use back buttons to return to profile
- Test deep linking between screens
- Verify proper header titles and navigation

### User States
- Test both logged-in and logged-out states
- Verify different user types (regular vs service provider)
- Test with different user data (empty vs filled profiles)

## Mock Data Available

- Demo users with different profiles
- Sample payment methods
- Mock achievements and activities
- Test events and reservations

## Common Test Scenarios

1. **New User Flow**:
   - Create account → Edit profile → Add payment method → Browse calendar

2. **Returning User Flow**:
   - Login → Check notifications → View achievements → Update settings

3. **Service Provider Flow**:
   - Login → Go to calendar → Create event → Manage settings

4. **Privacy-Conscious User Flow**:
   - Login → Privacy settings → Disable tracking → Export data

5. **Support Flow**:
   - Help → Search FAQ → Contact support → Submit message

All functions are now fully implemented and ready for testing!
// Utility to clear problematic date formats from AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearProblematicEvent = async () => {
  try {
    console.log('🧹 Clearing problematic event data...');
    
    // Get current events
    const eventsData = await AsyncStorage.getItem('calendar_events');
    if (!eventsData) {
      console.log('No events found in storage');
      return;
    }

    const events = JSON.parse(eventsData);
    console.log('Found events:', events.length);

    // Filter out problematic events (those with DD/MM/YYYY format that cause crashes)
    const cleanedEvents = events.filter((event: any) => {
      // Remove events with DD/MM/YYYY format or any problematic title
      if (event.date && event.date.includes('/')) {
        console.log('Removing problematic event with slash date:', event.title, event.date);
        return false;
      }
      if (event.title && (event.title.includes('Brunch Inauguración') || event.title.includes('Test Date:'))) {
        console.log('Removing specific problematic event:', event.title);
        return false;
      }
      return true;
    });

    console.log('Events after cleanup:', cleanedEvents.length);

    // Save cleaned events back to storage
    await AsyncStorage.setItem('calendar_events', JSON.stringify(cleanedEvents));
    console.log('✅ Cleaned events saved successfully');

    // Also clear priority items if they exist
    const priorityData = await AsyncStorage.getItem('priority_items');
    if (priorityData) {
      const items = JSON.parse(priorityData);
      const cleanedItems = items.filter((item: any) => {
        if (item.date && item.date.includes('/')) {
          console.log('Removing problematic priority item:', item.title, item.date);
          return false;
        }
        if (item.title && item.title.includes('Brunch Inauguración Test')) {
          console.log('Removing specific problematic priority item:', item.title);
          return false;
        }
        return true;
      });
      
      await AsyncStorage.setItem('priority_items', JSON.stringify(cleanedItems));
      console.log('✅ Cleaned priority items saved successfully');
    }

  } catch (error) {
    console.error('❌ Error clearing problematic data:', error);
  }
};
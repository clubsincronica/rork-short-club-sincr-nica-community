import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lodging } from '@/types/user';
import { getApiBaseUrl } from '@/utils/api-config';

interface LodgingStore {
  lodgings: Lodging[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLodgings: () => Promise<void>;
  addLodging: (lodging: Omit<Lodging, 'id'>) => Promise<void>;
  updateLodging: (id: string, updates: Partial<Lodging>) => Promise<void>;
  deleteLodging: (id: string) => Promise<void>;
  getLodgingById: (id: string) => Lodging | undefined;
  getLodgingsByHostId: (hostId: string) => Lodging[];
  setLodgings: (lodgings: Lodging[]) => void;
}

export const useLodging = create<LodgingStore>((set, get) => ({
  lodgings: [],
  isLoading: false,
  error: null,

  fetchLodgings: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/lodging`);
      if (!response.ok) throw new Error('Failed to fetch lodging');
      const data = await response.json();
      set({ lodgings: data, isLoading: false, error: null });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  addLodging: async (lodging) => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/lodging`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lodging),
      });
      if (!response.ok) throw new Error('Failed to create lodging');
      await get().fetchLodgings();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateLodging: async (id, updates) => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/lodging/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update lodging');
      await get().fetchLodgings();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteLodging: async (id) => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${getApiBaseUrl()}/api/lodging/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to delete lodging');
      await get().fetchLodgings();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getLodgingById: (id) => {
    return get().lodgings.find((lodging) => String(lodging.id) === id);
  },

  getLodgingsByHostId: (hostId) => {
    return get().lodgings.filter((lodging) => String(lodging.hostId) === hostId);
  },

  setLodgings: (lodgings) => {
    set({ lodgings, error: null });
  },
}));

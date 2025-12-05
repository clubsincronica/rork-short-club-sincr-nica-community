import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lodging } from '@/types/user';

interface LodgingStore {
  lodgings: Lodging[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addLodging: (lodging: Omit<Lodging, 'id'>) => void;
  updateLodging: (id: string, updates: Partial<Lodging>) => void;
  deleteLodging: (id: string) => void;
  getLodgingById: (id: string) => Lodging | undefined;
  getLodgingsByHostId: (hostId: string) => Lodging[];
  setLodgings: (lodgings: Lodging[]) => void;
}

export const useLodging = create<LodgingStore>()(
  persist(
    (set, get) => ({
      lodgings: [],
      isLoading: false,
      error: null,

      addLodging: (lodging) => {
        console.log('🏡 Lodging Store: Adding new lodging:', lodging.title);
        const newLodging: Lodging = {
          ...lodging,
          id: `lodging_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
        
        set((state) => ({
          lodgings: [...state.lodgings, newLodging],
          error: null,
        }));
        
        console.log('✅ Lodging Store: Lodging added successfully, total:', get().lodgings.length);
      },

      updateLodging: (id, updates) => {
        console.log('🏡 Lodging Store: Updating lodging:', id);
        set((state) => ({
          lodgings: state.lodgings.map((lodging) =>
            lodging.id === id ? { ...lodging, ...updates } : lodging
          ),
          error: null,
        }));
        console.log('✅ Lodging Store: Lodging updated successfully');
      },

      deleteLodging: (id) => {
        console.log('🏡 Lodging Store: Deleting lodging:', id);
        set((state) => ({
          lodgings: state.lodgings.filter((lodging) => lodging.id !== id),
          error: null,
        }));
        console.log('✅ Lodging Store: Lodging deleted successfully');
      },

      getLodgingById: (id) => {
        return get().lodgings.find((lodging) => lodging.id === id);
      },

      getLodgingsByHostId: (hostId) => {
        return get().lodgings.filter((lodging) => lodging.hostId === hostId);
      },

      setLodgings: (lodgings) => {
        set({ lodgings, error: null });
      },
    }),
    {
      name: 'lodging-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

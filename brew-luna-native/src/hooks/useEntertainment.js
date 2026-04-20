import { create } from 'zustand';

export const useEntertainmentStore = create((set) => ({
  totalPoints: 1250,
  sessionPoints: 0,
  streak: 4,
  lastPlayedDate: null,

  addPoints: (amount) => set((state) => ({ 
    totalPoints: state.totalPoints + amount,
    sessionPoints: state.sessionPoints + amount 
  })),

  updateStreak: (date) => set((state) => {
    // Basic logic for demo - in reality would check consecutive days
    return { streak: state.streak + 1, lastPlayedDate: date };
  }),
}));

export const usePoints = () => {
  const { totalPoints, sessionPoints, addPoints } = useEntertainmentStore();
  return { totalPoints, sessionPoints, addPoints };
};

export const useStreak = () => {
  const { streak, updateStreak } = useEntertainmentStore();
  return { streak, updateStreak };
};

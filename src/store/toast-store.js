import { create } from 'zustand';

let nextId = 1;

// Small pop-up messages ("Member approved"). They remove themselves after a few seconds.
// A message toast also has a title (the sender) and a `to` address that opens when it is clicked.
export const useToastStore = create((set, get) => ({
  toasts: [],
  show: (message, tone = 'success', options = {}) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, message, tone, ...options }] }));
    setTimeout(() => get().dismiss(id), tone === 'error' ? 7000 : options.to ? 6000 : 4000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (m) => useToastStore.getState().show(m, 'success'),
  error: (m) => useToastStore.getState().show(m, 'error'),
  // "Priya Nair: see you there!" that opens the conversation when clicked.
  message: ({ title, message, to }) =>
    useToastStore.getState().show(message, 'message', { title, to }),
};

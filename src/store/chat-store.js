import { create } from 'zustand';

// Which conversation is open right now, so a message from that person does not also pop up a toast.
export const useChatStore = create((set) => ({
  activePartnerId: null,
  setActivePartner: (id) => set({ activePartnerId: id }),
}));

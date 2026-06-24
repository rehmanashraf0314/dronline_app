import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isGuest: false,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        const res = await authAPI.getMe();
        set({ user: res.data.user, token, isLoading: false, isGuest: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await SecureStore.deleteItemAsync('auth_token');
      set({ isLoading: false, user: null, token: null });
    }
  },

  login: async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    await SecureStore.setItemAsync('auth_token', token);
    set({ user, token, isGuest: false });
    return user;
  },

  setAuthFromOTP: async ({ token, user, isGuest }) => {
    await SecureStore.setItemAsync('auth_token', token);
    set({ user, token, isGuest: !!isGuest });
  },

  setPassword: async (password) => {
    await authAPI.setPassword({ password });
    set({ isGuest: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null, isGuest: false });
  },
}));

import { AuthUser, ExtensionSettings } from '../types';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  apiUrl: 'https://digital-media-vault-api.onrender.com/api',
  webUrl: 'https://digital-media-vault.vercel.app',
  token: null,
  user: null,
  showFloatingButton: true,
};

export const storage = {
  /**
   * Get all extension settings
   */
  async getSettings(): Promise<ExtensionSettings> {
    return new Promise((resolve) => {
      chrome.storage.local.get(
        ['apiUrl', 'webUrl', 'token', 'user', 'showFloatingButton'],
        (res) => {
          resolve({
            apiUrl: res.apiUrl || DEFAULT_SETTINGS.apiUrl,
            webUrl: res.webUrl || DEFAULT_SETTINGS.webUrl,
            token: res.token || null,
            user: res.user || null,
            showFloatingButton:
              res.showFloatingButton !== undefined
                ? res.showFloatingButton
                : DEFAULT_SETTINGS.showFloatingButton,
          });
        }
      );
    });
  },

  /**
   * Update settings in chrome.storage.local
   */
  async updateSettings(updates: Partial<ExtensionSettings>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(updates, () => {
        resolve();
      });
    });
  },

  /**
   * Save user session
   */
  async saveSession(token: string, user: AuthUser): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ token, user }, () => {
        resolve();
      });
    });
  },

  /**
   * Clear user session
   */
  async clearSession(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['token', 'user'], () => {
        resolve();
      });
    });
  },

  /**
   * Get current auth token
   */
  async getToken(): Promise<string | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['token'], (res) => {
        resolve(res.token || null);
      });
    });
  },
};

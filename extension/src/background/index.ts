import { storage } from '../services/storage';
import { vaultApi, VaultApiError } from '../services/api';
import { SavedProduct } from '../types';

/**
 * Set extension action badge state
 */
function setBadge(text: string, color: string, autoClearMs?: number) {
  try {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
    if (autoClearMs) {
      setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
      }, autoClearMs);
    }
  } catch (err) {
    console.warn('Could not set badge:', err);
  }
}

/**
 * Attempt to auto-sync cookie session from VaultXMedia web app domain
 */
async function autoSyncSessionFromCookies(webUrl: string, apiUrl: string): Promise<string | null> {
  try {
    const parsedWeb = new URL(webUrl);
    const parsedApi = new URL(apiUrl);

    const domains = [parsedWeb.hostname, parsedApi.hostname, 'localhost', 'digital-media-vault.vercel.app'];
    const uniqueDomains = Array.from(new Set(domains.filter(Boolean)));

    for (const domain of uniqueDomains) {
      const cookies = await chrome.cookies.getAll({ domain });
      const sessionCookie = cookies.find(
        (c) => c.name === 'pdl_session' || c.name === 'vaultx_session' || c.name === 'token'
      );
      if (sessionCookie && sessionCookie.value) {
        try {
          const user = await vaultApi.getMe(sessionCookie.value, apiUrl);
          await storage.saveSession(sessionCookie.value, user);
          return sessionCookie.value;
        } catch {
          // Cookie expired or invalid, continue checking
        }
      }
    }
  } catch (err) {
    console.warn('Cookie sync notice:', err);
  }
  return null;
}

/**
 * Core function to save a product URL to VaultXMedia
 */
async function saveProductToVault(
  targetUrl: string,
  tabId?: number
): Promise<{ success: boolean; product?: SavedProduct; error?: string }> {
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return { success: false, error: 'Cannot save a non-web URL.' };
  }

  setBadge('...', '#8b5cf6'); // Purple loading badge

  const settings = await storage.getSettings();
  const token = settings.token;

  // Strictly enforce authentication in the extension. Never silently grab cookies behind user's back.
  if (!token || !token.trim()) {
    setBadge('AUTH', '#ef4444', 4000);

    const authErrorMsg =
      'Authentication required: Please open extension settings and log into your VaultXMedia account before saving.';

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: 'Authentication Required',
        message: authErrorMsg,
        isError: true,
      }).catch(() => {});
    }

    // Open options page so user can log in
    chrome.runtime.openOptionsPage();

    return {
      success: false,
      error: authErrorMsg,
    };
  }

  try {
    // Call existing VaultXMedia backend extraction & save endpoint
    const product = await vaultApi.saveProduct(targetUrl, token, settings.apiUrl);

    // Success badge
    setBadge('✓', '#10b981', 3500);

    // Notify tab content script with rich product details
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: product.title || 'Product saved!',
        store: product.store,
        price: product.price ?? undefined,
        currencySymbol: product.currencySymbol,
        imageUrl: product.imageUrl ?? undefined,
        url: `${settings.webUrl}/products`,
        isError: false,
      }).catch(() => {});
    }

    // Chrome system notification fallback
    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Saved to VaultXMedia Wishlist',
        message: `${product.title || 'Product'} has been saved to your Vault.`,
        priority: 1,
      });
    } catch {
      // Notification permission optional
    }

    return { success: true, product };
  } catch (err: any) {
    console.error('Save product error:', err);
    setBadge('ERR', '#ef4444', 4000);

    const isAuthError = err instanceof VaultApiError && err.status === 401;
    if (isAuthError) {
      await storage.clearSession();
      chrome.runtime.openOptionsPage();
    }

    const errorMsg = err.message || 'Failed to save product to VaultXMedia.';

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: 'Failed to Save',
        message: errorMsg,
        isError: true,
      }).catch(() => {});
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * 1-Click Action Click Handler
 * When the user clicks the extension toolbar icon, directly save the current active tab product!
 * No popup or banner is shown.
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && tab.id) {
    await saveProductToVault(tab.url, tab.id);
  }
});

/**
 * Context Menu: Right click page or link -> "Save to VaultXMedia Wishlist"
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-vaultxmedia',
    title: 'Save to VaultXMedia Wishlist',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-vaultxmedia') {
    const targetUrl = info.linkUrl || info.pageUrl || tab?.url;
    if (targetUrl) {
      await saveProductToVault(targetUrl, tab?.id);
    }
  }
});

/**
 * Message Dispatcher for Content Scripts and Options Page
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'SAVE_CURRENT_PRODUCT') {
    const url = message.url || sender.tab?.url;
    saveProductToVault(url, sender.tab?.id).then(sendResponse);
    return true; // async sendResponse
  }

  if (message.action === 'CHECK_AUTH') {
    storage.getSettings().then((s) => {
      sendResponse({ isAuthenticated: !!s.token, user: s.user });
    });
    return true;
  }

  if (message.action === 'SYNC_SESSION') {
    storage.getSettings().then(async (s) => {
      const token = await autoSyncSessionFromCookies(s.webUrl, s.apiUrl);
      sendResponse({ success: !!token });
    });
    return true;
  }
});

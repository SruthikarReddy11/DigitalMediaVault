import { storage } from '../services/storage';
import { vaultApi, VaultApiError } from '../services/api';
import { SavedProduct, UrlClassification } from '../types';

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
 * Classify a URL into PRODUCT, YOUTUBE, or GENERIC (Secret Vault)
 */
export function classifyUrl(rawUrl: string): UrlClassification {
  if (!rawUrl || typeof rawUrl !== 'string') return 'GENERIC';
  const url = rawUrl.toLowerCase();

  // 1. YouTube & video stream platforms
  const isYouTube = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.test(rawUrl);
  if (isYouTube || url.includes('vimeo.com') || url.includes('dailymotion.com')) {
    return 'YOUTUBE';
  }

  const cleanPath = url.split('?')[0];
  if (
    cleanPath.endsWith('.mp4') ||
    cleanPath.endsWith('.webm') ||
    cleanPath.endsWith('.m3u8') ||
    cleanPath.endsWith('.mov') ||
    cleanPath.endsWith('.mkv')
  ) {
    return 'YOUTUBE';
  }

  // 2. Ecommerce websites
  const ecommerceHosts = [
    'amazon.',
    'flipkart.com',
    'myntra.com',
    'ajio.com',
    'meesho.com',
    'nykaa.com',
    'tatacliq.com',
    'croma.com',
    'reliancedigital.in',
  ];

  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    for (const d of ecommerceHosts) {
      if (host.includes(d)) {
        return 'PRODUCT';
      }
    }
  } catch {
    for (const d of ecommerceHosts) {
      if (url.includes(d)) {
        return 'PRODUCT';
      }
    }
  }

  return 'GENERIC';
}

/**
 * Core function to save a product URL to VaultXMedia Wishlist
 */
async function saveProductToVault(
  targetUrl: string,
  tabId?: number
): Promise<{ success: boolean; product?: SavedProduct; error?: string; alreadyExists?: boolean }> {
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return { success: false, error: 'Cannot save a non-web URL.' };
  }

  setBadge('...', '#8b5cf6'); // Purple loading badge

  const settings = await storage.getSettings();
  const token = settings.token;

  // Strictly enforce authentication in the extension
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

    chrome.runtime.openOptionsPage();
    return { success: false, error: authErrorMsg };
  }

  try {
    const result = await vaultApi.saveProduct(targetUrl, token, settings.apiUrl);
    const product = result.product;
    const isDuplicate = !!result.alreadyExists;

    setBadge(isDuplicate ? 'SAVED' : '✓', isDuplicate ? '#8b5cf6' : '#10b981', 3500);

    const toastSub = isDuplicate
      ? '✓ Product is already in your Wishlist'
      : '✓ Saved to your Wishlist';

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: product.title || 'Product in Wishlist',
        store: product.store,
        price: product.price ?? undefined,
        currencySymbol: product.currencySymbol,
        imageUrl: product.imageUrl ?? undefined,
        url: `${settings.webUrl}/products`,
        isError: false,
        alreadyExists: isDuplicate,
        message: toastSub,
      }).catch(() => {});
    }

    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: isDuplicate
          ? 'Already in VaultXMedia Wishlist'
          : 'Saved to VaultXMedia Wishlist',
        message: `${product.title || 'Product'} is in your Vault.`,
        priority: 1,
      });
    } catch {}

    return { success: true, product, alreadyExists: isDuplicate };
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
 * Core function to save/import a YouTube or video stream URL to Vault Videos
 */
async function saveVideoToVault(
  targetUrl: string,
  title?: string,
  tabId?: number
): Promise<{ success: boolean; error?: string }> {
  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return { success: false, error: 'Cannot save a non-web URL.' };
  }

  setBadge('...', '#8b5cf6'); // Purple loading badge

  const settings = await storage.getSettings();
  const token = settings.token;

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

    chrome.runtime.openOptionsPage();
    return { success: false, error: authErrorMsg };
  }

  try {
    const video = await vaultApi.importVideo(targetUrl, title, token, settings.apiUrl);
    setBadge('✓', '#10b981', 3500);

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: video.originalName || title || 'YouTube Video',
        url: `${settings.webUrl}/videos`,
        isError: false,
        message: '✓ Saved to Vault Theater & Videos!',
      }).catch(() => {});
    }

    try {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Saved to VaultXMedia Videos',
        message: `${video.originalName || 'Video'} has been added to your Videos library.`,
        priority: 1,
      });
    } catch {}

    return { success: true };
  } catch (err: any) {
    console.error('Save video error:', err);
    setBadge('ERR', '#ef4444', 4000);

    const isAuthError = err instanceof VaultApiError && err.status === 401;
    if (isAuthError) {
      await storage.clearSession();
      chrome.runtime.openOptionsPage();
    }

    const errorMsg = err.message || 'Failed to save video to VaultXMedia.';

    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_TOAST',
        title: 'Failed to Save Video',
        message: errorMsg,
        isError: true,
      }).catch(() => {});
    }

    return { success: false, error: errorMsg };
  }
}

/**
 * Open Secret Vault interactive save modal on the active tab
 */
async function openSecretVaultModal(tabId: number, targetUrl: string, title?: string) {
  const settings = await storage.getSettings();
  if (!settings.token || !settings.token.trim()) {
    setBadge('AUTH', '#ef4444', 4000);
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    await chrome.tabs.sendMessage(tabId, {
      action: 'OPEN_VAULT_SAVE_MODAL',
      url: targetUrl,
      title: title || '',
    });
  } catch {
    // If content script was not injected on tab, inject it on-demand
    try {
      await chrome.scripting.insertCSS({
        target: { tabId },
        files: ['content.css'],
      });
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js'],
      });
      setTimeout(() => {
        chrome.tabs.sendMessage(tabId, {
          action: 'OPEN_VAULT_SAVE_MODAL',
          url: targetUrl,
          title: title || '',
        }).catch((e) => console.warn('Could not dispatch modal trigger:', e));
      }, 250);
    } catch (injectErr) {
      console.error('Failed to inject content script:', injectErr);
    }
  }
}

/**
 * Smart Extension Click Handler:
 * Routes automatically depending on URL:
 * 1. Product -> Wishlist
 * 2. YouTube / Video -> Videos
 * 3. Other website -> Secret Vault (opens interactive unlock & folder modal)
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !tab.id) return;
  const classification = classifyUrl(tab.url);

  if (classification === 'PRODUCT') {
    await saveProductToVault(tab.url, tab.id);
  } else if (classification === 'YOUTUBE') {
    await saveVideoToVault(tab.url, tab.title, tab.id);
  } else {
    await openSecretVaultModal(tab.id, tab.url, tab.title);
  }
});

/**
 * Context Menu: Right click -> "Save to VaultXMedia"
 */
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-vaultxmedia',
    title: 'Save to VaultXMedia',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'save-to-vaultxmedia') {
    const targetUrl = info.linkUrl || info.pageUrl || tab?.url;
    if (targetUrl && tab?.id) {
      const classification = classifyUrl(targetUrl);
      if (classification === 'PRODUCT') {
        await saveProductToVault(targetUrl, tab.id);
      } else if (classification === 'YOUTUBE') {
        await saveVideoToVault(targetUrl, tab.title, tab.id);
      } else {
        await openSecretVaultModal(tab.id, targetUrl, tab.title);
      }
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

  if (message.action === 'SAVE_VIDEO') {
    const url = message.url || sender.tab?.url;
    saveVideoToVault(url, message.title, sender.tab?.id).then(sendResponse);
    return true;
  }

  if (message.action === 'GET_2FA_STATUS') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.get2FAStatus(s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'VERIFY_2FA') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.verify2FA(message.code, s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'LIST_VAULT_FOLDERS') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.listVaultFolders(s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'UNLOCK_VAULT_FOLDER') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.unlockVaultFolder(message.folderId, message.password, s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'CREATE_VAULT_CELL') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.createVaultCell(message.folderId, message.data, s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'CREATE_VAULT_FOLDER') {
    storage.getSettings().then(async (s) => {
      try {
        if (!s.token) throw new Error('Not logged into VaultXMedia.');
        const res = await vaultApi.createVaultFolder(message.data, s.token, s.apiUrl);
        sendResponse({ success: true, data: res });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true;
  }

  if (message.action === 'CHECK_PRODUCT_EXISTS') {
    const url = message.url || sender.tab?.url;
    if (!url) {
      sendResponse({ exists: false, product: null });
      return true;
    }
    storage.getSettings().then(async (settings) => {
      if (!settings.token) {
        sendResponse({ exists: false, product: null });
        return;
      }
      const checkRes = await vaultApi.checkProductExists(url, settings.token, settings.apiUrl);
      sendResponse(checkRes);
    });
    return true;
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

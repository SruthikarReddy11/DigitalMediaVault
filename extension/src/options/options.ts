import { storage, DEFAULT_SETTINGS } from '../services/storage';
import { vaultApi, VaultApiError } from '../services/api';
import { AuthUser } from '../types';

// DOM Elements
const statusBadge = document.getElementById('status-badge') as HTMLDivElement;
const alertBanner = document.getElementById('alert-banner') as HTMLDivElement;

const authViewConnected = document.getElementById('auth-view-connected') as HTMLDivElement;
const authViewLogin = document.getElementById('auth-view-login') as HTMLDivElement;
const userAvatar = document.getElementById('user-avatar') as HTMLDivElement;
const userName = document.getElementById('user-name') as HTMLHeadingElement;
const userEmail = document.getElementById('user-email') as HTMLParagraphElement;
const userRole = document.getElementById('user-role') as HTMLSpanElement;
const btnOpenVault = document.getElementById('btn-open-vault') as HTMLAnchorElement;
const btnLogout = document.getElementById('btn-logout') as HTMLButtonElement;

const formLogin = document.getElementById('form-login') as HTMLFormElement;
const loginIdentifier = document.getElementById('login-identifier') as HTMLInputElement;
const loginPassword = document.getElementById('login-password') as HTMLInputElement;
const btnLogin = document.getElementById('btn-login') as HTMLButtonElement;
const btnAutoSync = document.getElementById('btn-auto-sync') as HTMLButtonElement;

const formSettings = document.getElementById('form-settings') as HTMLFormElement;
const settingApiUrl = document.getElementById('setting-api-url') as HTMLInputElement;
const settingWebUrl = document.getElementById('setting-web-url') as HTMLInputElement;
const settingFloatingBtn = document.getElementById('setting-floating-btn') as HTMLInputElement;
const presetLocal = document.getElementById('preset-local') as HTMLButtonElement;
const presetProd = document.getElementById('preset-prod') as HTMLButtonElement;

/**
 * Show temporary banner message
 */
function showAlert(message: string, isError = false) {
  alertBanner.textContent = message;
  alertBanner.className = `alert ${isError ? 'alert-error' : 'alert-success'}`;
  alertBanner.classList.remove('hidden');

  setTimeout(() => {
    alertBanner.classList.add('hidden');
  }, 4500);
}

/**
 * Update UI for authenticated state
 */
function setAuthenticatedState(user: AuthUser, webUrl: string) {
  statusBadge.textContent = '● Connected';
  statusBadge.className = 'badge badge-connected';

  userName.textContent = user.name || user.username;
  userEmail.textContent = user.email;
  userRole.textContent = user.role;

  if (user.avatarUrl) {
    userAvatar.innerHTML = `<img src="${user.avatarUrl}" alt="Avatar" />`;
  } else {
    userAvatar.textContent = (user.name || user.username || 'U').charAt(0).toUpperCase();
  }

  btnOpenVault.href = `${webUrl}/products`;

  authViewConnected.classList.remove('hidden');
  authViewLogin.classList.add('hidden');
}

/**
 * Update UI for unauthenticated state
 */
function setUnauthenticatedState() {
  statusBadge.textContent = '● Not Connected';
  statusBadge.className = 'badge badge-disconnected';

  authViewConnected.classList.add('hidden');
  authViewLogin.classList.remove('hidden');
}

/**
 * Load and display current settings and auth
 */
async function initialize() {
  const settings = await storage.getSettings();

  settingApiUrl.value = settings.apiUrl;
  settingWebUrl.value = settings.webUrl;
  settingFloatingBtn.checked = settings.showFloatingButton;

  if (settings.token) {
    try {
      const user = await vaultApi.getMe(settings.token, settings.apiUrl);
      await storage.saveSession(settings.token, user);
      setAuthenticatedState(user, settings.webUrl);
      return;
    } catch {
      await storage.clearSession();
    }
  }

  setUnauthenticatedState();
}

/**
 * Form Submit: Login
 */
formLogin.addEventListener('submit', async (e) => {
  e.preventDefault();
  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value;
  const apiUrl = settingApiUrl.value.trim();
  const webUrl = settingWebUrl.value.trim();

  if (!identifier || !password) return;

  btnLogin.disabled = true;
  btnLogin.textContent = 'Signing in...';

  try {
    const { token, user } = await vaultApi.login(identifier, password, apiUrl);
    await storage.saveSession(token, user);
    setAuthenticatedState(user, webUrl);
    showAlert(`Welcome, ${user.name || user.username}! Connected to VaultXMedia.`);
    loginPassword.value = '';
  } catch (err: any) {
    showAlert(err.message || 'Login failed. Check your credentials and API URL.', true);
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Sign In to VaultXMedia';
  }
});

/**
 * Button: Auto-Sync Session from Web App Tab or Cookies
 */
btnAutoSync.addEventListener('click', async () => {
  btnAutoSync.disabled = true;
  btnAutoSync.textContent = 'Scanning session...';

  try {
    const response: any = await chrome.runtime.sendMessage({ action: 'SYNC_SESSION' });
    if (response && response.success) {
      await initialize();
      showAlert('Session synced successfully from VaultXMedia web app!');
    } else {
      showAlert('No active VaultXMedia session found. Please sign in with your credentials above.', true);
    }
  } catch (err: any) {
    showAlert('Failed to auto-sync session: ' + err.message, true);
  } finally {
    btnAutoSync.disabled = false;
    btnAutoSync.textContent = 'Auto-Sync Active Session';
  }
});

/**
 * Button: Sign Out
 */
btnLogout.addEventListener('click', async () => {
  await storage.clearSession();
  setUnauthenticatedState();
  showAlert('Signed out from VaultXMedia extension.');
});

/**
 * Form Submit: Save Server Settings
 */
formSettings.addEventListener('submit', async (e) => {
  e.preventDefault();
  const apiUrl = settingApiUrl.value.trim();
  const webUrl = settingWebUrl.value.trim();
  const showFloatingButton = settingFloatingBtn.checked;

  await storage.updateSettings({
    apiUrl,
    webUrl,
    showFloatingButton,
  });

  showAlert('Connection settings saved successfully.');
  await initialize();
});

/**
 * Presets: Localhost vs Production
 */
presetLocal.addEventListener('click', () => {
  settingApiUrl.value = 'http://localhost:5000/api';
  settingWebUrl.value = 'http://localhost:5173';
});

presetProd.addEventListener('click', () => {
  settingApiUrl.value = 'https://digital-media-vault-api-g2hc.onrender.com/api';
  settingWebUrl.value = 'https://digital-media-vault.vercel.app';
});

// Initialize on page load
initialize();

// VaultXMedia Content Script: In-Page "Save to VaultXMedia" Button & Toast System

const VAULT_BUTTON_ID = 'vaultxmedia-floating-save-btn';
const VAULT_TOAST_ID = 'vaultxmedia-save-toast';

/**
 * Check if the current page looks like an e-commerce product page
 */
function isProductPage(): boolean {
  const url = window.location.href.toLowerCase();
  const host = window.location.hostname.toLowerCase();

  // Amazon
  if (host.includes('amazon.')) {
    return url.includes('/dp/') || url.includes('/gp/product/') || url.includes('/d/');
  }

  // Flipkart
  if (host.includes('flipkart.com')) {
    return url.includes('/p/') || url.includes('pid=');
  }

  // Myntra
  if (host.includes('myntra.com')) {
    return /\/\d+\/buy/.test(url) || url.includes('/buy');
  }

  // Ajio
  if (host.includes('ajio.com')) {
    return url.includes('/p/');
  }

  // Meesho
  if (host.includes('meesho.com')) {
    return url.includes('/s/p/') || url.includes('/p/');
  }

  // Nykaa
  if (host.includes('nykaa.com')) {
    return url.includes('/p/');
  }

  // Tata CLiQ
  if (host.includes('tatacliq.com')) {
    return url.includes('/p-');
  }

  // Croma
  if (host.includes('croma.com')) {
    return url.includes('/p/');
  }

  // Reliance Digital
  if (host.includes('reliancedigital.in')) {
    return url.includes('/p/');
  }

  // Generic fallback: check if schema.org Product is in DOM
  const hasProductSchema = document.querySelector('script[type="application/ld+json"]');
  if (hasProductSchema && hasProductSchema.textContent?.includes('"Product"')) {
    return true;
  }

  return true; // Show on all matched domains in manifest
}

/**
 * Create and show a rich in-page toast notification
 */
function showToast(options: {
  title: string;
  store?: string;
  price?: number;
  currencySymbol?: string;
  imageUrl?: string;
  url?: string;
  message?: string;
  isError?: boolean;
}) {
  const existing = document.getElementById(VAULT_TOAST_ID);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = VAULT_TOAST_ID;
  toast.className = `vaultx-toast ${options.isError ? 'vaultx-toast-error' : 'vaultx-toast-success'}`;

  const priceText =
    options.price !== undefined && options.price !== null
      ? `${options.currencySymbol || '₹'}${options.price.toLocaleString('en-IN')}`
      : '';

  const imgHtml = options.imageUrl
    ? `<img src="${options.imageUrl}" class="vaultx-toast-img" alt="Product" onerror="this.style.display='none'" />`
    : `<div class="vaultx-toast-icon-box">${options.isError ? '✕' : '✓'}</div>`;

  toast.innerHTML = `
    <div class="vaultx-toast-content">
      ${imgHtml}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${options.store || 'VaultXMedia'}</span>
          ${priceText ? `<span class="vaultx-toast-price">${priceText}</span>` : ''}
        </div>
        <div class="vaultx-toast-title" title="${options.title}">${options.title}</div>
        <div class="vaultx-toast-sub">${options.isError ? (options.message || 'Error occurred') : '✓ Saved to your Wishlist'}</div>
      </div>
      <button class="vaultx-toast-close" title="Dismiss">&times;</button>
    </div>
    ${
      options.url && !options.isError
        ? `<div class="vaultx-toast-action">
             <a href="${options.url}" target="_blank" rel="noopener noreferrer" class="vaultx-toast-link">
               Open in VaultXMedia Wishlist &rarr;
             </a>
           </div>`
        : ''
    }
  `;

  // Close button
  toast.querySelector('.vaultx-toast-close')?.addEventListener('click', () => {
    toast.classList.add('vaultx-toast-fadeout');
    setTimeout(() => toast.remove(), 300);
  });

  document.body.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('vaultx-toast-fadeout');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

/**
 * Inject floating "Save to VaultXMedia" button on supported product pages
 */
function injectSaveButton() {
  if (document.getElementById(VAULT_BUTTON_ID)) return;
  if (!isProductPage()) return;

  const btn = document.createElement('button');
  btn.id = VAULT_BUTTON_ID;
  btn.className = 'vaultx-floating-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('title', 'Save product directly to your VaultXMedia Wishlist');

  btn.innerHTML = `
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.classList.contains('vaultx-loading')) return;

    // Loading state
    btn.classList.add('vaultx-loading');
    const originalText = btn.querySelector('.vaultx-btn-text')!.textContent;
    btn.querySelector('.vaultx-btn-text')!.textContent = 'Saving...';

    try {
      const response: any = await chrome.runtime.sendMessage({
        action: 'SAVE_CURRENT_PRODUCT',
        url: window.location.href,
      });

      btn.classList.remove('vaultx-loading');

      if (response && response.success) {
        btn.classList.add('vaultx-saved');
        btn.querySelector('.vaultx-btn-text')!.textContent = '✓ Saved to Vault!';

        setTimeout(() => {
          btn.classList.remove('vaultx-saved');
          btn.querySelector('.vaultx-btn-text')!.textContent = originalText;
        }, 3500);
      } else {
        btn.classList.add('vaultx-error');
        btn.querySelector('.vaultx-btn-text')!.textContent = 'Failed';

        setTimeout(() => {
          btn.classList.remove('vaultx-error');
          btn.querySelector('.vaultx-btn-text')!.textContent = originalText;
        }, 3500);
      }
    } catch (err: any) {
      btn.classList.remove('vaultx-loading');
      btn.classList.add('vaultx-error');
      btn.querySelector('.vaultx-btn-text')!.textContent = 'Failed';

      setTimeout(() => {
        btn.classList.remove('vaultx-error');
        btn.querySelector('.vaultx-btn-text')!.textContent = originalText;
      }, 3500);
    }
  });

  document.body.appendChild(btn);
}

/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'SHOW_TOAST') {
    showToast(message);
  }
});

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectSaveButton);
} else {
  injectSaveButton();
}

// Watch for single-page application navigation (Amazon/Flipkart dynamic loads)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(injectSaveButton, 1000);
  }
}).observe(document, { subtree: true, childList: true });

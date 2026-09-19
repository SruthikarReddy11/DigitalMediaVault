// VaultXMedia Content Script: Multi-Section Smart Link Saver & Secret Vault Modal System

const VAULT_BUTTON_ID = 'vaultxmedia-floating-save-btn';
const VAULT_YT_BUTTON_ID = 'vaultxmedia-floating-yt-btn';
const VAULT_MAPS_BUTTON_ID = 'vaultxmedia-floating-maps-btn';
const VAULT_TOAST_ID = 'vaultxmedia-save-toast';
const VAULT_MODAL_ID = 'vaultxmedia-secret-modal';
const VAULT_PLACE_MODAL_ID = 'vaultxmedia-place-modal';

/**
 * Check if the current page is an e-commerce product page
 */
function isProductPage(): boolean {
  const url = window.location.href.toLowerCase();
  const host = window.location.hostname.toLowerCase();

  // NEVER treat video platforms as ecommerce products!
  if (
    host.includes('youtube.com') ||
    host.includes('youtu.be') ||
    host.includes('vimeo.com') ||
    host.includes('dailymotion.com')
  ) {
    return false;
  }

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

  return false;
}

/**
 * Check if the current page is a YouTube watch / shorts page
 */
function isYouTubeWatchPage(): boolean {
  const host = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  if (host.includes('youtube.com') || host.includes('youtu.be')) {
    return (
      url.includes('/watch') ||
      url.includes('/shorts/') ||
      url.includes('/live/') ||
      url.includes('/embed/') ||
      url.includes('/clip/') ||
      host.includes('youtu.be')
    );
  }
  return false;
}

/**
 * Check if the current page is a Google Maps page (place, search, or directions)
 */
function isGoogleMapsPlacePage(): boolean {
  const host = window.location.hostname.toLowerCase();
  const url = window.location.href.toLowerCase();
  if (
    host.includes('maps.google.') ||
    host.includes('maps.app.goo.gl') ||
    (host.includes('google.') && (url.includes('/maps') || url.includes('/place/'))) ||
    (host.includes('goo.gl') && url.includes('/maps'))
  ) {
    return true;
  }
  return false;
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
    ? `<img src="${options.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`
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
        <div class="vaultx-toast-sub">${options.isError ? (options.message || 'Error occurred') : (options.message || '✓ Saved successfully')}</div>
      </div>
      <button class="vaultx-toast-close" title="Dismiss">&times;</button>
    </div>
    ${
      options.url && !options.isError
        ? `<div class="vaultx-toast-action">
             <a href="${options.url}" target="_blank" rel="noopener noreferrer" class="vaultx-toast-link">
               Open in VaultXMedia &rarr;
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
 * ============================================================================
 * ECOMMERCE FLOATING BUTTON
 * ============================================================================
 */
let currentSavedProduct: any = null;

function setButtonAlreadyInWishlist(btn: HTMLElement, product?: any) {
  currentSavedProduct = product || currentSavedProduct;
  btn.classList.remove('vaultx-loading', 'vaultx-error', 'vaultx-saved');
  btn.classList.add('vaultx-already-saved');
  btn.setAttribute('title', 'This product is already in your VaultXMedia Wishlist (Click to view)');

  const iconSpan = btn.querySelector('.vaultx-btn-icon');
  const textSpan = btn.querySelector('.vaultx-btn-text');

  if (iconSpan) {
    iconSpan.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;
  }
  if (textSpan) {
    textSpan.textContent = 'Already in Wishlist';
  }
}

async function checkCurrentProductStatus(btn: HTMLElement) {
  try {
    const res: any = await chrome.runtime.sendMessage({
      action: 'CHECK_PRODUCT_EXISTS',
      url: window.location.href,
    });
    if (res && res.exists) {
      setButtonAlreadyInWishlist(btn, res.product);
    }
  } catch {}
}

/**
 * Robust in-browser DOM product extractor.
 * Bypasses server-side anti-bot protections (e.g. Akamai, Cloudflare) by directly
 * reading the already-rendered DOM, JSON-LD, and meta tags from the user's active session.
 */
function extractInPageProductData(): any {
  const url = window.location.href;
  const host = window.location.hostname.toLowerCase();

  let title = '';
  let brand = '';
  let price: number | undefined = undefined;
  let originalPrice: number | undefined = undefined;
  let imageUrl = '';
  let category = 'General';
  let inStock = true;
  let store = '';
  let currency = 'INR';
  let currencySymbol = '₹';

  // Determine store
  if (host.includes('amazon.')) store = 'Amazon';
  else if (host.includes('flipkart.com')) store = 'Flipkart';
  else if (host.includes('myntra.com')) store = 'Myntra';
  else if (host.includes('ajio.com')) store = 'Ajio';
  else if (host.includes('meesho.com')) store = 'Meesho';
  else if (host.includes('nykaa.com')) store = 'Nykaa';
  else if (host.includes('tatacliq.com')) store = 'Tata CLiQ';
  else if (host.includes('croma.com')) store = 'Croma';
  else if (host.includes('reliancedigital.in')) store = 'Reliance Digital';
  else {
    const cleanName = host.replace(/^www\./, '').split('.')[0];
    store = cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || 'Other';
  }

  const parseNumber = (str: any): number | undefined => {
    if (typeof str === 'number' && !isNaN(str)) return str;
    if (!str || typeof str !== 'string') return undefined;
    const clean = str.replace(/[^\d.]/g, '').trim();
    const val = parseFloat(clean);
    return isNaN(val) || val <= 0 ? undefined : val;
  };

  // 1. JSON-LD structured data extraction
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach((el) => {
    try {
      const text = el.textContent;
      if (!text) return;
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];

      for (const item of items) {
        if (
          item['@type'] === 'Product' ||
          item['@type'] === 'IndividualProduct' ||
          item['@type'] === 'ProductModel'
        ) {
          if (!title && item.name) title = String(item.name).trim();
          if (!brand) {
            if (typeof item.brand === 'string') brand = item.brand.trim();
            else if (item.brand?.name) brand = String(item.brand.name).trim();
          }
          if (!imageUrl) {
            if (typeof item.image === 'string') {
              imageUrl = item.image;
            } else if (Array.isArray(item.image) && item.image.length > 0) {
              const first = item.image[0];
              imageUrl = typeof first === 'string' ? first : first?.url || '';
            } else if (item.image?.url) {
              imageUrl = item.image.url;
            }
          }
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers) {
            if (price === undefined) {
              const p = parseNumber(offers.price || offers.lowPrice);
              if (p) price = p;
            }
            if (offers.priceCurrency) {
              currency = offers.priceCurrency;
              currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
            }
            if (offers.availability) {
              const av = String(offers.availability).toLowerCase();
              inStock = !av.includes('outofstock');
            }
          }
        }
      }
    } catch {}
  });

  // 2. Platform-Specific DOM Selectors
  if (store === 'Ajio') {
    category = 'Fashion';
    const b =
      document.querySelector('.brand-name')?.textContent ||
      document.querySelector('h2.brand-name')?.textContent ||
      document.querySelector('.prod-brand')?.textContent;
    if (b && b.trim()) brand = b.trim();

    const t =
      document.querySelector('.prod-name')?.textContent ||
      document.querySelector('h1.prod-title')?.textContent;
    if (t && t.trim()) {
      title = brand && !t.trim().toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${t.trim()}`
        : t.trim();
    }

    if (price === undefined) {
      const sp =
        document.querySelector('.prod-sp')?.textContent ||
        document.querySelector('.price-value')?.textContent;
      const p = parseNumber(sp);
      if (p) price = p;
    }

    if (originalPrice === undefined) {
      const cp =
        document.querySelector('.prod-cp')?.textContent ||
        document.querySelector('.original-price')?.textContent;
      const mrp = parseNumber(cp);
      if (mrp) originalPrice = mrp;
    }

    if (!imageUrl) {
      const ajioImgs = Array.from(document.querySelectorAll('img')).filter((img) => {
        const src = img.getAttribute('src') || '';
        return src.includes('assets.ajio.com') && (src.includes('medias') || src.includes('root') || src.includes('images'));
      });
      if (ajioImgs.length > 0) {
        imageUrl = (ajioImgs[0] as HTMLImageElement).src || ajioImgs[0].getAttribute('src') || '';
      }
    }
  } else if (store === 'Myntra') {
    category = 'Fashion';
    const b = document.querySelector('.pdp-title')?.textContent;
    if (b && b.trim()) brand = b.trim();
    const t = document.querySelector('.pdp-name')?.textContent;
    if (t && t.trim()) {
      title = brand && !t.trim().toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${t.trim()}`
        : t.trim();
    }
    if (price === undefined) {
      const p = parseNumber(document.querySelector('.pdp-price strong')?.textContent || document.querySelector('.pdp-price')?.textContent);
      if (p) price = p;
    }
    if (originalPrice === undefined) {
      const mrp = parseNumber(document.querySelector('.pdp-mrp s')?.textContent || document.querySelector('.pdp-mrp')?.textContent);
      if (mrp) originalPrice = mrp;
    }
    if (!imageUrl) {
      const img = document.querySelector('.image-grid-image') || document.querySelector('img[src*="assets.myntassets.com"]');
      if (img) imageUrl = (img as HTMLImageElement).src || img.getAttribute('src') || '';
    }
  } else if (store === 'Flipkart') {
    const fkTitle =
      document.querySelector('span.B_NuCI')?.textContent ||
      document.querySelector('h1.yhB1nd')?.textContent ||
      document.querySelector('span._35KyD6')?.textContent;
    if (fkTitle && fkTitle.trim()) title = fkTitle.trim();
    if (price === undefined) {
      const fkPrice =
        document.querySelector('div._30jeq3._16Jk6d')?.textContent ||
        document.querySelector('div._30jeq3')?.textContent ||
        document.querySelector('div.Nx9bqj.CxhGGd')?.textContent;
      const p = parseNumber(fkPrice);
      if (p) price = p;
    }
    if (originalPrice === undefined) {
      const fkMrp =
        document.querySelector('div._3I9_wc._2p6lqe')?.textContent ||
        document.querySelector('div._3I9_wc')?.textContent ||
        document.querySelector('div.yRaY8j.A68aAq')?.textContent;
      const mrp = parseNumber(fkMrp);
      if (mrp) originalPrice = mrp;
    }
    if (!imageUrl) {
      const img = document.querySelector('img._396cs4') || document.querySelector('img.DByuf4') || document.querySelector('img._2r_T1I');
      if (img) imageUrl = (img as HTMLImageElement).src || img.getAttribute('src') || '';
    }
  } else if (store === 'Amazon') {
    const azTitle = document.querySelector('#productTitle')?.textContent || document.querySelector('span#title')?.textContent;
    if (azTitle && azTitle.trim()) title = azTitle.trim();
    if (price === undefined) {
      const azPrice =
        document.querySelector('.a-price .a-offscreen')?.textContent ||
        document.querySelector('#priceblock_ourprice')?.textContent ||
        document.querySelector('#corePrice_desktop .a-offscreen')?.textContent;
      const p = parseNumber(azPrice);
      if (p) price = p;
    }
    if (originalPrice === undefined) {
      const azMrp =
        document.querySelector('.a-text-price span.a-offscreen')?.textContent ||
        document.querySelector('#listPrice')?.textContent;
      const mrp = parseNumber(azMrp);
      if (mrp) originalPrice = mrp;
    }
    if (!imageUrl) {
      const img = document.querySelector('#landingImage') || document.querySelector('#imgBlkFront');
      if (img) imageUrl = (img as HTMLImageElement).src || img.getAttribute('data-old-hires') || img.getAttribute('src') || '';
    }
  }

  // 3. OpenGraph & Meta tag fallbacks
  if (!title) {
    title =
      (document.querySelector('meta[property="og:title"]') as HTMLMetaElement)?.content ||
      (document.querySelector('meta[name="twitter:title"]') as HTMLMetaElement)?.content ||
      document.title ||
      '';
  }
  if (!imageUrl) {
    imageUrl =
      (document.querySelector('meta[property="og:image"]') as HTMLMetaElement)?.content ||
      (document.querySelector('meta[property="og:image:secure_url"]') as HTMLMetaElement)?.content ||
      (document.querySelector('meta[name="twitter:image"]') as HTMLMetaElement)?.content ||
      '';
  }

  // 4. URL slug fallback for Ajio if title is missing or contains Access Denied
  if (store === 'Ajio' && (!title || title.toLowerCase().includes('access denied'))) {
    try {
      const parsedUrl = new URL(url);
      const match = parsedUrl.pathname.match(/\/([^/]+)\/p\/([^/?#]+)/i);
      if (match && match[1]) {
        const slugWords = match[1].split('-').filter(Boolean);
        if (slugWords.length > 0) {
          const capitalizedWords = slugWords.map((w) => w.charAt(0).toUpperCase() + w.slice(1));
          brand = brand || capitalizedWords[0];
          title = capitalizedWords.join(' ');
        }
      }
    } catch {}
  }

  // Clean title
  title = title
    .replace(/\s*\|\s*Flipkart\.com$/i, '')
    .replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i, '')
    .replace(/\s*:\s*Amazon\.in:.*$/i, '')
    .replace(/\s*Buy Online at Ajio\.com$/i, '')
    .replace(/\s*-\s*Ajio$/i, '')
    .replace(/\s*Buy.*Online at Myntra$/i, '')
    .replace(/\s*\|\s*Myntra$/i, '')
    .trim();

  if (!title || title.toLowerCase().includes('access denied')) {
    title = `Product from ${store}`;
  }

  return {
    url,
    title,
    brand: brand || undefined,
    store,
    category,
    price,
    originalPrice,
    currency,
    currencySymbol,
    imageUrl: imageUrl || undefined,
    inStock,
  };
}

function injectProductSaveButton() {
  let btn = document.getElementById(VAULT_BUTTON_ID);

  if (btn) {
    checkCurrentProductStatus(btn);
    return;
  }

  if (!isProductPage()) return;

  btn = document.createElement('button');
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

  checkCurrentProductStatus(btn);

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.classList.contains('vaultx-loading')) return;

    if (btn.classList.contains('vaultx-already-saved')) {
      showToast({
        title: currentSavedProduct?.title || 'Product in Wishlist',
        store: currentSavedProduct?.store,
        price: currentSavedProduct?.price ?? undefined,
        currencySymbol: currentSavedProduct?.currencySymbol,
        imageUrl: currentSavedProduct?.imageUrl ?? undefined,
        message: '✓ This product is already in your VaultXMedia Wishlist',
        url: 'https://digital-media-vault.vercel.app/products',
        isError: false,
      });
      return;
    }

    btn.classList.add('vaultx-loading');
    const textSpan = btn.querySelector('.vaultx-btn-text')!;
    const originalText = textSpan.textContent;
    textSpan.textContent = 'Saving...';

    // Extract product details directly from the active DOM session
    const productData = extractInPageProductData();

    try {
      const response: any = await chrome.runtime.sendMessage({
        action: 'SAVE_CURRENT_PRODUCT',
        url: window.location.href,
        title: productData?.title || document.title,
        productData,
      });

      btn.classList.remove('vaultx-loading');

      if (response && response.success) {
        currentSavedProduct = response.product;
        const isDuplicate = !!response.alreadyExists;

        if (isDuplicate) {
          setButtonAlreadyInWishlist(btn, response.product);
          showToast({
            title: response.product?.title || 'Product in Wishlist',
            store: response.product?.store,
            price: response.product?.price ?? undefined,
            currencySymbol: response.product?.currencySymbol,
            imageUrl: response.product?.imageUrl ?? undefined,
            message: '✓ This product is already in your Wishlist',
            url: 'https://digital-media-vault.vercel.app/products',
            isError: false,
          });
        } else {
          btn.classList.add('vaultx-saved');
          textSpan.textContent = '✓ Saved to Vault!';
          setTimeout(() => {
            setButtonAlreadyInWishlist(btn, response.product);
          }, 2500);
        }
      } else {
        btn.classList.add('vaultx-error');
        textSpan.textContent = 'Failed';
        showToast({
          title: 'Failed to Save',
          message: response?.error || 'Could not save product to VaultXMedia.',
          isError: true,
        });
        setTimeout(() => {
          btn.classList.remove('vaultx-error');
          textSpan.textContent = originalText;
        }, 3500);
      }
    } catch (err: any) {
      btn.classList.remove('vaultx-loading');
      btn.classList.add('vaultx-error');
      textSpan.textContent = 'Failed';
      showToast({
        title: 'Failed to Save',
        message: err.message || 'Error communicating with extension worker.',
        isError: true,
      });
      setTimeout(() => {
        btn.classList.remove('vaultx-error');
        textSpan.textContent = originalText;
      }, 3500);
    }
  });

  document.body.appendChild(btn);
}

/**
 * ============================================================================
 * YOUTUBE FLOATING BUTTON
 * ============================================================================
 */
function injectYouTubeSaveButton() {
  if (!isYouTubeWatchPage()) {
    const existing = document.getElementById(VAULT_YT_BUTTON_ID);
    if (existing) existing.remove();
    return;
  }

  let btn = document.getElementById(VAULT_YT_BUTTON_ID);
  if (btn) return;

  btn = document.createElement('button');
  btn.id = VAULT_YT_BUTTON_ID;
  btn.className = 'vaultx-floating-btn vaultx-youtube-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('title', 'Save YouTube video to Vault Theater & Videos');

  btn.innerHTML = `
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `;

  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (btn.classList.contains('vaultx-loading')) return;

    btn.classList.add('vaultx-loading');
    const textSpan = btn.querySelector('.vaultx-btn-text')!;
    const originalText = textSpan.textContent;
    textSpan.textContent = 'Saving Video...';

    try {
      const response: any = await chrome.runtime.sendMessage({
        action: 'SAVE_VIDEO',
        url: window.location.href,
        title: document.title,
      });

      btn.classList.remove('vaultx-loading');

      if (response && response.success) {
        btn.classList.add('vaultx-saved');
        textSpan.textContent = '✓ Saved to Videos!';
        setTimeout(() => {
          btn.classList.remove('vaultx-saved');
          textSpan.textContent = originalText;
        }, 3000);
      } else {
        btn.classList.add('vaultx-error');
        textSpan.textContent = 'Failed';
        showToast({
          title: 'Failed to Save Video',
          message: response?.error || 'Could not save video to VaultXMedia.',
          isError: true,
        });
        setTimeout(() => {
          btn.classList.remove('vaultx-error');
          textSpan.textContent = originalText;
        }, 3500);
      }
    } catch (err: any) {
      btn.classList.remove('vaultx-loading');
      btn.classList.add('vaultx-error');
      textSpan.textContent = 'Failed';
      showToast({
        title: 'Failed to Save Video',
        message: err.message || 'Error communicating with extension worker.',
        isError: true,
      });
      setTimeout(() => {
        btn.classList.remove('vaultx-error');
        textSpan.textContent = originalText;
      }, 3500);
    }
  });

  document.body.appendChild(btn);
}

/**
 * ============================================================================
 * GOOGLE MAPS FLOATING BUTTON & PLACE SAVE MODAL
 * ============================================================================
 */
function injectGoogleMapsSaveButton() {
  if (!isGoogleMapsPlacePage()) {
    const existing = document.getElementById(VAULT_MAPS_BUTTON_ID);
    if (existing) existing.remove();
    return;
  }

  let btn = document.getElementById(VAULT_MAPS_BUTTON_ID);
  if (btn) return;

  btn = document.createElement('button');
  btn.id = VAULT_MAPS_BUTTON_ID;
  btn.className = 'vaultx-floating-btn vaultx-maps-btn';
  btn.setAttribute('type', 'button');
  btn.setAttribute('title', 'Save place to VaultXMedia Places & Plans');

  btn.innerHTML = `
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save Place</span>
  `;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openGoogleMapsModal(window.location.href);
  });

  document.body.appendChild(btn);
}

function openGoogleMapsModal(
  targetUrl: string = window.location.href,
  webUrl = 'https://digital-media-vault.vercel.app'
) {
  const existing = document.getElementById(VAULT_PLACE_MODAL_ID);
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = VAULT_PLACE_MODAL_ID;
  backdrop.className = 'vaultx-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'vaultx-modal';

  modal.innerHTML = `
    <div class="vaultx-modal-header">
      <div class="vaultx-modal-title-wrap">
        <div class="vaultx-modal-icon-badge" style="background: rgba(14, 165, 233, 0.2); color: #38bdf8;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <div>
          <h3 class="vaultx-modal-title">Save to Places &amp; Plans</h3>
          <p class="vaultx-modal-subtitle">Save Google Maps location &amp; set reminders</p>
        </div>
      </div>
      <button class="vaultx-modal-close-btn" title="Close (Esc)">&times;</button>
    </div>

    <div class="vaultx-modal-body">
      <div id="vaultx-place-step-container">
        <div style="text-align:center; padding: 28px 0; color: #94a3b8; font-size: 13px;">
          <div style="margin-bottom:8px; display:inline-block; animation: vaultx-pulse 1s infinite ease-in-out; font-size:24px;">📍</div>
          <div>Resolving Google Maps place details...</div>
        </div>
      </div>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  const closeModal = () => {
    backdrop.remove();
    document.removeEventListener('keydown', handleEsc);
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleEsc);

  modal.querySelector('.vaultx-modal-close-btn')?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  const stepContainer = modal.querySelector('#vaultx-place-step-container') as HTMLElement;

  const resolveAndRender = async () => {
    try {
      const res: any = await chrome.runtime.sendMessage({
        action: 'RESOLVE_PLACE',
        url: targetUrl,
      });

      if (!res || !res.success || !res.data) {
        stepContainer.innerHTML = `
          <div class="vaultx-modal-error">
            ${res?.error || 'Could not resolve place details automatically.'}
          </div>
          <div class="vaultx-modal-actions">
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-cancel">Cancel</button>
            <button type="button" class="vaultx-btn-primary" id="vaultx-place-retry">Retry</button>
          </div>
        `;
        stepContainer.querySelector('#vaultx-place-cancel')?.addEventListener('click', closeModal);
        stepContainer.querySelector('#vaultx-place-retry')?.addEventListener('click', resolveAndRender);
        return;
      }

      const place = res.data;
      renderPlaceSaveForm(place);
    } catch (err: any) {
      stepContainer.innerHTML = `
        <div class="vaultx-modal-error">${err.message || 'Error communicating with extension worker.'}</div>
        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-close">Close</button>
        </div>
      `;
      stepContainer.querySelector('#vaultx-place-err-close')?.addEventListener('click', closeModal);
    }
  };

  const renderPlaceSaveForm = (place: any) => {
    const photoHtml = place.photoUrl
      ? `<img src="${place.photoUrl}" class="vaultx-place-preview-img" alt="${place.name}" onerror="this.style.display='none'" />`
      : `<div class="vaultx-place-preview-placeholder">📍</div>`;

    const ratingHtml = place.rating
      ? `<span class="vaultx-place-tag vaultx-place-tag-rating">⭐ ${place.rating.toFixed(1)}${
          place.userRatingsTotal ? ` (${place.userRatingsTotal.toLocaleString()})` : ''
        }</span>`
      : '';

    const categoryHtml = place.category
      ? `<span class="vaultx-place-tag">${place.category}</span>`
      : '';

    stepContainer.innerHTML = `
      <form id="vaultx-save-place-form">
        <div class="vaultx-place-preview-card">
          ${photoHtml}
          <div class="vaultx-place-preview-meta">
            <div class="vaultx-place-preview-title" title="${place.name}">${place.name}</div>
            <div class="vaultx-place-preview-address" title="${place.address || ''}">${place.address || 'Address not specified'}</div>
            <div class="vaultx-place-preview-tags">
              ${categoryHtml}
              ${ratingHtml}
            </div>
          </div>
        </div>

        <div id="vaultx-place-form-error"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Status</label>
          <select id="vaultx-place-status" class="vaultx-input" style="cursor:pointer;">
            <option value="WANT_TO_VISIT" selected>📌 Want to Visit</option>
            <option value="PLANNED">🗓️ Planned</option>
            <option value="UPCOMING">⏰ Upcoming</option>
            <option value="VISITED">✅ Visited</option>
          </select>
        </div>

        <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="vaultx-place-favorite" style="cursor:pointer; accent-color:#8b5cf6;" />
          <label for="vaultx-place-favorite" style="font-size:12.5px; color:#f1f5f9; cursor:pointer; user-select:none; font-weight:500;">
            ⭐ Mark as Favorite
          </label>
        </div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Set Visit Reminder</label>
          <select id="vaultx-place-reminder-preset" class="vaultx-input" style="cursor:pointer; margin-bottom:8px;">
            <option value="NONE">No reminder</option>
            <option value="1_DAY">In 1 day</option>
            <option value="1_WEEK">In 1 week</option>
            <option value="1_MONTH">In 1 month</option>
            <option value="CUSTOM">Custom date &amp; time...</option>
          </select>
          <div id="vaultx-custom-reminder-wrap" style="display:none;">
            <input type="datetime-local" id="vaultx-place-custom-date" class="vaultx-input" />
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label class="vaultx-label">Personal Notes (optional)</label>
          <input type="text" id="vaultx-place-notes" class="vaultx-input" placeholder="e.g. Try the seafood pasta, reserve outdoor table..." />
        </div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-cancel-btn">Cancel</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-place-submit-btn" style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);">
            Save Place &rarr;
          </button>
        </div>
      </form>
    `;

    const form = stepContainer.querySelector('#vaultx-save-place-form') as HTMLFormElement;
    const statusSelect = stepContainer.querySelector('#vaultx-place-status') as HTMLSelectElement;
    const favCheckbox = stepContainer.querySelector('#vaultx-place-favorite') as HTMLInputElement;
    const presetSelect = stepContainer.querySelector('#vaultx-place-reminder-preset') as HTMLSelectElement;
    const customWrap = stepContainer.querySelector('#vaultx-custom-reminder-wrap') as HTMLElement;
    const customInput = stepContainer.querySelector('#vaultx-place-custom-date') as HTMLInputElement;
    const notesInput = stepContainer.querySelector('#vaultx-place-notes') as HTMLInputElement;
    const submitBtn = stepContainer.querySelector('#vaultx-place-submit-btn') as HTMLButtonElement;
    const errBox = stepContainer.querySelector('#vaultx-place-form-error') as HTMLElement;

    presetSelect.addEventListener('change', () => {
      if (presetSelect.value === 'CUSTOM') {
        customWrap.style.display = 'block';
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        tomorrow.setHours(10, 0, 0, 0);
        customInput.value = tomorrow.toISOString().slice(0, 16);
      } else {
        customWrap.style.display = 'none';
      }
    });

    stepContainer.querySelector('#vaultx-place-cancel-btn')?.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving Place...';
      errBox.innerHTML = '';

      const tags: string[] = [];
      if (favCheckbox?.checked) {
        tags.push('Favorite');
      }

      let reminderDate: string | undefined = undefined;
      const now = new Date();
      if (presetSelect.value === '1_DAY') {
        reminderDate = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (presetSelect.value === '1_WEEK') {
        reminderDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (presetSelect.value === '1_MONTH') {
        reminderDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (presetSelect.value === 'CUSTOM' && customInput.value) {
        try {
          const parsed = new Date(customInput.value);
          if (!isNaN(parsed.getTime())) {
            reminderDate = parsed.toISOString();
          }
        } catch {}
      }

      const payload = {
        googleMapsUrl: place.googleMapsUrl || targetUrl,
        name: place.name,
        address: place.address,
        placeId: place.placeId,
        latitude: place.latitude,
        longitude: place.longitude,
        category: place.category,
        rating: place.rating,
        userRatingsTotal: place.userRatingsTotal,
        imageUrl: place.photoUrl || place.imageUrl,
        photoUrl: place.photoUrl || place.imageUrl,
        photoAttributions: place.photoAttributions,
        status: statusSelect.value,
        tags,
        notes: notesInput.value.trim() || undefined,
        reminderDate,
      };

      try {
        const res: any = await chrome.runtime.sendMessage({
          action: 'SAVE_PLACE',
          data: payload,
        });

        if (res && res.success) {
          closeModal();
          showToast({
            title: place.name || 'Place Saved',
            store: 'Places & Plans',
            imageUrl: place.photoUrl || undefined,
            message: '✓ Saved to Places & Plans!',
            url: `${webUrl}/places`,
            isError: false,
          });
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Save Place →';
          errBox.innerHTML = `<div class="vaultx-modal-error">${res?.error || 'Failed to save place.'}</div>`;
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Place →';
        errBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Communication error.'}</div>`;
      }
    });
  };

  resolveAndRender();
}

/**
 * ============================================================================
 * INTERACTIVE SECRET VAULT SAVE MODAL
 * ============================================================================
 */
function openSecretVaultModal(
  targetUrl: string,
  pageTitle: string,
  webUrl = 'https://digital-media-vault.vercel.app'
) {
  // Remove existing modal if already open
  const existing = document.getElementById(VAULT_MODAL_ID);
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = VAULT_MODAL_ID;
  backdrop.className = 'vaultx-modal-backdrop';

  const modal = document.createElement('div');
  modal.className = 'vaultx-modal';

  modal.innerHTML = `
    <div class="vaultx-modal-header">
      <div class="vaultx-modal-title-wrap">
        <div class="vaultx-modal-icon-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div>
          <h3 class="vaultx-modal-title">Save to Secret Vault</h3>
          <p class="vaultx-modal-subtitle">Private password-protected link cell</p>
        </div>
      </div>
      <button class="vaultx-modal-close-btn" title="Close (Esc)">&times;</button>
    </div>

    <div class="vaultx-modal-body">
      <!-- Link info card -->
      <div class="vaultx-modal-link-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
        </svg>
        <div style="min-width:0; flex:1;">
          <div class="vaultx-modal-link-title" title="${pageTitle || targetUrl}">${pageTitle || targetUrl}</div>
          <div class="vaultx-modal-link-url" title="${targetUrl}">${targetUrl}</div>
        </div>
      </div>

      <!-- Dynamic Step Content -->
      <div id="vaultx-dynamic-step-container">
        <div style="text-align:center; padding: 24px 0; color: #94a3b8; font-size: 13px;">
          <div style="margin-bottom:8px; display:inline-block; animation: vaultx-pulse 1s infinite ease-in-out;">🔐</div>
          <div>Connecting to Secret Vault...</div>
        </div>
      </div>
    </div>
  `;

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  // Close handlers
  const closeModal = () => {
    backdrop.remove();
    document.removeEventListener('keydown', handleEsc);
  };

  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeModal();
  };
  document.addEventListener('keydown', handleEsc);

  modal.querySelector('.vaultx-modal-close-btn')?.addEventListener('click', closeModal);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  const stepContainer = modal.querySelector('#vaultx-dynamic-step-container') as HTMLElement;

  // Generic Error Handler
  const renderError = (msg: string, showRetry = true) => {
    stepContainer.innerHTML = `
      <div class="vaultx-modal-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${msg}</span>
      </div>
      <div class="vaultx-modal-actions">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-err-cancel">Cancel</button>
        ${showRetry ? '<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>' : ''}
      </div>
    `;
    stepContainer.querySelector('#vaultx-err-cancel')?.addEventListener('click', closeModal);
    stepContainer.querySelector('#vaultx-err-retry')?.addEventListener('click', initFlow);
  };

  // STEP 0: Inline Authorization / Login View
  const renderAuthorizeView = (initialError?: string) => {
    stepContainer.innerHTML = `
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:13.5px; font-weight:700; color:#f1f5f9; margin-bottom:4px;">
          Authorize Secret Vault
        </div>
        <div style="font-size:11.5px; color:#94a3b8; line-height:1.4;">
          Please authorize your VaultXMedia account to access and save into your Secret Vault folders.
        </div>
      </div>

      <div id="vaultx-auth-error-box">
        ${initialError ? `<div class="vaultx-modal-error">${initialError}</div>` : ''}
      </div>

      <div style="margin-bottom:14px;">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-auth-autosync" style="width:100%; display:flex; align-items:center; justify-content:center; gap:6px; background:#1e293b; border-color:rgba(99,102,241,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span style="color:#c7d2fe; font-weight:600;">Auto-Detect Active Web Session</span>
        </button>
      </div>

      <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>
        <span style="font-size:10px; text-transform:uppercase; color:#64748b; letter-spacing:0.5px; font-weight:600;">Or Sign In</span>
        <div style="flex:1; height:1px; background:rgba(255,255,255,0.1);"></div>
      </div>

      <form id="vaultx-inline-login-form">
        <div style="margin-bottom:10px;">
          <label class="vaultx-label">Username or Email</label>
          <input type="text" id="vaultx-auth-id" class="vaultx-input" placeholder="e.g. user@vault.com" required autocomplete="username" />
        </div>

        <div style="margin-bottom:14px;">
          <label class="vaultx-label">Password</label>
          <input type="password" id="vaultx-auth-pw" class="vaultx-input" placeholder="Your password" required autocomplete="current-password" />
        </div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-auth-cancel">Cancel</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-auth-submit">
            Authorize & Unlock &rarr;
          </button>
        </div>
      </form>
    `;

    const errBox = stepContainer.querySelector('#vaultx-auth-error-box') as HTMLElement;
    const syncBtn = stepContainer.querySelector('#vaultx-auth-autosync') as HTMLButtonElement;
    const loginForm = stepContainer.querySelector('#vaultx-inline-login-form') as HTMLFormElement;
    const idInput = stepContainer.querySelector('#vaultx-auth-id') as HTMLInputElement;
    const pwInput = stepContainer.querySelector('#vaultx-auth-pw') as HTMLInputElement;
    const submitBtn = stepContainer.querySelector('#vaultx-auth-submit') as HTMLButtonElement;

    stepContainer.querySelector('#vaultx-auth-cancel')?.addEventListener('click', closeModal);

    // 1-Click Auto-Detect Session
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `<span>Detecting browser session...</span>`;
      errBox.innerHTML = '';

      try {
        const res: any = await chrome.runtime.sendMessage({ action: 'SYNC_SESSION' });
        if (res && res.success) {
          initFlow();
        } else {
          syncBtn.disabled = false;
          syncBtn.innerHTML = `<span>Auto-Detect Active Web Session</span>`;
          errBox.innerHTML = `<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>`;
          idInput.focus();
        }
      } catch (err: any) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = `<span>Auto-Detect Active Web Session</span>`;
        errBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Auto-detection failed.'}</div>`;
      }
    });

    // Inline Sign In Form
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const identifier = idInput.value.trim();
      const password = pwInput.value;

      if (!identifier || !password) return;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Authorizing...';
      errBox.innerHTML = '';

      try {
        const res: any = await chrome.runtime.sendMessage({
          action: 'LOGIN',
          identifier,
          password,
        });

        if (res && res.success) {
          initFlow();
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Authorize & Unlock →';
          errBox.innerHTML = `<div class="vaultx-modal-error">${res?.error || 'Invalid credentials.'}</div>`;
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Authorize & Unlock →';
        errBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Authorization failed.'}</div>`;
      }
    });
  };

  // STEP 1: Secret Vault Gate (2FA verification if enabled)
  const renderStep1_2FA = () => {
    stepContainer.innerHTML = `
      <form id="vaultx-2fa-form">
        <div style="text-align:center; margin-bottom: 14px;">
          <div style="font-size:13px; font-weight:600; color:#f1f5f9; margin-bottom: 4px;">
            Google Authenticator 2FA
          </div>
          <div style="font-size:11.5px; color:#94a3b8;">
            Enter the 6-digit Authenticator code to unlock your Secret Vault.
          </div>
        </div>

        <div id="vaultx-2fa-error-box"></div>

        <div style="margin-bottom: 14px;">
          <input
            type="text"
            id="vaultx-totp-input"
            class="vaultx-input vaultx-totp-input"
            placeholder="000000"
            maxlength="6"
            pattern="\\d*"
            required
            autocomplete="off"
            autofocus
          />
        </div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-2fa-cancel">Cancel</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-2fa-submit">
            Unlock Vault &rarr;
          </button>
        </div>
      </form>
    `;

    const form = stepContainer.querySelector('#vaultx-2fa-form') as HTMLFormElement;
    const input = stepContainer.querySelector('#vaultx-totp-input') as HTMLInputElement;
    const submitBtn = stepContainer.querySelector('#vaultx-2fa-submit') as HTMLButtonElement;
    const errorBox = stepContainer.querySelector('#vaultx-2fa-error-box') as HTMLElement;

    setTimeout(() => input?.focus(), 80);

    stepContainer.querySelector('#vaultx-2fa-cancel')?.addEventListener('click', closeModal);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const code = input.value.trim();
      if (code.length !== 6) {
        errorBox.innerHTML = `<div class="vaultx-modal-error">Please enter all 6 digits.</div>`;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';

      try {
        const res: any = await chrome.runtime.sendMessage({
          action: 'VERIFY_2FA',
          code,
        });

        if (res && res.success) {
          renderStep2_SelectFolder();
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock Vault →';
          errorBox.innerHTML = `<div class="vaultx-modal-error">${res?.error || 'Invalid 6-digit code. Please check your app.'}</div>`;
          input.value = '';
          input.focus();
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Unlock Vault →';
        errorBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Error communicating with extension.'}</div>`;
      }
    });
  };

  // STEP 2: Select a Secret Vault Folder
  const renderStep2_SelectFolder = async () => {
    stepContainer.innerHTML = `
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">📂</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;

    try {
      const res: any = await chrome.runtime.sendMessage({ action: 'LIST_VAULT_FOLDERS' });
      if (!res || !res.success) {
        if (res?.needAuth) {
          renderAuthorizeView(res.error);
        } else {
          renderError(res?.error || 'Failed to fetch vault folders.');
        }
        return;
      }

      const folders = res.data || [];

      if (folders.length === 0) {
        // No folders yet, prompt creation
        renderCreateFolderView();
        return;
      }

      stepContainer.innerHTML = `
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${folders
              .map(
                (f: any) => `
                <div class="vaultx-folder-item" data-folder-id="${f.id}" data-folder-name="${f.name}" data-folder-color="${f.color || '#3b82f6'}">
                  <div class="vaultx-folder-left">
                    <div class="vaultx-folder-dot" style="background-color: ${f.color || '#3b82f6'};"></div>
                    <span class="vaultx-folder-name">${f.name}</span>
                  </div>
                  <span class="vaultx-folder-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>${f.cellCount || 0} links</span>
                  </span>
                </div>
              `
              )
              .join('')}
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <button type="button" id="vaultx-new-folder-btn" style="background:none; border:none; color:#a78bfa; font-size:12px; font-weight:600; cursor:pointer; padding:4px 0;">
              + Create New Folder
            </button>
            <button type="button" class="vaultx-btn-secondary" id="vaultx-step2-cancel" style="padding:6px 12px; font-size:12px;">
              Cancel
            </button>
          </div>
        </div>
      `;

      stepContainer.querySelector('#vaultx-step2-cancel')?.addEventListener('click', closeModal);
      stepContainer.querySelector('#vaultx-new-folder-btn')?.addEventListener('click', renderCreateFolderView);

      stepContainer.querySelectorAll('.vaultx-folder-item').forEach((item) => {
        item.addEventListener('click', () => {
          const folderId = item.getAttribute('data-folder-id')!;
          const folderName = item.getAttribute('data-folder-name')!;
          const folderColor = item.getAttribute('data-folder-color')!;
          renderStep3_UnlockAndSave(folderId, folderName, folderColor);
        });
      });
    } catch (err: any) {
      renderError(err.message || 'Could not load folders.');
    }
  };

  // INLINE FOLDER CREATOR
  const renderCreateFolderView = () => {
    stepContainer.innerHTML = `
      <form id="vaultx-create-folder-form">
        <label class="vaultx-label">Folder Name</label>
        <input type="text" id="vaultx-new-folder-name" class="vaultx-input" placeholder="e.g. Work, Crypto, Bookmarks" required style="margin-bottom:12px;" />

        <label class="vaultx-label">Folder Password (min 4 characters)</label>
        <input type="password" id="vaultx-new-folder-pw" class="vaultx-input" placeholder="Create password for this folder..." minlength="4" required style="margin-bottom:14px;" />

        <div id="vaultx-create-folder-error"></div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-create-folder-back">Back</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-create-folder-submit">Create & Continue &rarr;</button>
        </div>
      </form>
    `;

    stepContainer.querySelector('#vaultx-create-folder-back')?.addEventListener('click', renderStep2_SelectFolder);
    const form = stepContainer.querySelector('#vaultx-create-folder-form') as HTMLFormElement;
    const nameInput = stepContainer.querySelector('#vaultx-new-folder-name') as HTMLInputElement;
    const pwInput = stepContainer.querySelector('#vaultx-new-folder-pw') as HTMLInputElement;
    const submitBtn = stepContainer.querySelector('#vaultx-create-folder-submit') as HTMLButtonElement;
    const errBox = stepContainer.querySelector('#vaultx-create-folder-error') as HTMLElement;

    setTimeout(() => nameInput?.focus(), 80);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const password = pwInput.value.trim();

      if (!name || password.length < 4) {
        errBox.innerHTML = `<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>`;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      try {
        const res: any = await chrome.runtime.sendMessage({
          action: 'CREATE_VAULT_FOLDER',
          data: { name, password, color: '#6366f1' },
        });

        if (res && res.success && res.data) {
          renderStep3_UnlockAndSave(res.data.id, res.data.name, res.data.color || '#6366f1', password);
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Create & Continue →';
          errBox.innerHTML = `<div class="vaultx-modal-error">${res?.error || 'Failed to create folder.'}</div>`;
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create & Continue →';
        errBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Error creating folder.'}</div>`;
      }
    });
  };

  // STEP 3: Unlock Folder & Save Link
  const renderStep3_UnlockAndSave = (
    folderId: string,
    folderName: string,
    folderColor: string,
    prefilledPassword = ''
  ) => {
    stepContainer.innerHTML = `
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Indicator -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${folderColor};"></div>
          <span style="font-size:12px; font-weight:700; color:#f1f5f9;">Destination: ${folderName}</span>
        </div>

        <div id="vaultx-save-error-box"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Folder Password</label>
          <input
            type="password"
            id="vaultx-folder-pw-input"
            class="vaultx-input"
            placeholder="Enter password for ${folderName}..."
            value="${prefilledPassword}"
            required
            autofocus
          />
        </div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Link Title</label>
          <input
            type="text"
            id="vaultx-cell-title-input"
            class="vaultx-input"
            value="${pageTitle.replace(/"/g, '&quot;')}"
            required
          />
        </div>

        <div style="margin-bottom:14px;">
          <label class="vaultx-label">Notes (optional)</label>
          <input
            type="text"
            id="vaultx-cell-notes-input"
            class="vaultx-input"
            placeholder="Add private notes..."
          />
        </div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-save-back">Back</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-save-submit">
            Unlock & Save Link
          </button>
        </div>
      </form>
    `;

    const form = stepContainer.querySelector('#vaultx-save-cell-form') as HTMLFormElement;
    const pwInput = stepContainer.querySelector('#vaultx-folder-pw-input') as HTMLInputElement;
    const titleInput = stepContainer.querySelector('#vaultx-cell-title-input') as HTMLInputElement;
    const notesInput = stepContainer.querySelector('#vaultx-cell-notes-input') as HTMLInputElement;
    const submitBtn = stepContainer.querySelector('#vaultx-save-submit') as HTMLButtonElement;
    const errorBox = stepContainer.querySelector('#vaultx-save-error-box') as HTMLElement;

    setTimeout(() => {
      if (!prefilledPassword) {
        pwInput?.focus();
      } else {
        titleInput?.focus();
      }
    }, 80);

    stepContainer.querySelector('#vaultx-save-back')?.addEventListener('click', renderStep2_SelectFolder);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = pwInput.value.trim();
      const title = titleInput.value.trim() || pageTitle || targetUrl;
      const notes = notesInput.value.trim() || undefined;

      if (!password) {
        errorBox.innerHTML = `<div class="vaultx-modal-error">Please enter the folder password.</div>`;
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying Password...';

      try {
        // 1. Unlock folder
        const unlockRes: any = await chrome.runtime.sendMessage({
          action: 'UNLOCK_VAULT_FOLDER',
          folderId,
          password,
        });

        if (!unlockRes || !unlockRes.success) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock & Save Link';
          errorBox.innerHTML = `<div class="vaultx-modal-error">${unlockRes?.error || 'Incorrect folder password.'}</div>`;
          pwInput.focus();
          return;
        }

        // 2. Save Cell (link)
        submitBtn.textContent = 'Saving Link...';
        const cellRes: any = await chrome.runtime.sendMessage({
          action: 'CREATE_VAULT_CELL',
          folderId,
          data: { url: targetUrl, title, notes },
        });

        if (cellRes && cellRes.success) {
          closeModal();
          showToast({
            title,
            message: `✓ Saved in Secret Vault / ${folderName}`,
            url: `${webUrl}/vault`,
            isError: false,
          });
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Unlock & Save Link';
          errorBox.innerHTML = `<div class="vaultx-modal-error">${cellRes?.error || 'Failed to save link in folder.'}</div>`;
        }
      } catch (err: any) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Unlock & Save Link';
        errorBox.innerHTML = `<div class="vaultx-modal-error">${err.message || 'Error saving link.'}</div>`;
      }
    });
  };

  // INITIALIZE FLOW: Check session & 2FA
  const initFlow = async () => {
    try {
      const authRes: any = await chrome.runtime.sendMessage({ action: 'CHECK_AUTH' });
      if (!authRes || !authRes.isAuthenticated) {
        const syncRes: any = await chrome.runtime.sendMessage({ action: 'SYNC_SESSION' });
        if (!syncRes || !syncRes.success) {
          renderAuthorizeView();
          return;
        }
      }

      const res: any = await chrome.runtime.sendMessage({ action: 'GET_2FA_STATUS' });
      if (!res || !res.success) {
        if (res?.needAuth) {
          renderAuthorizeView(res.error);
        } else {
          renderError(res?.error || 'Failed to connect to Secret Vault.');
        }
        return;
      }

      if (res.data?.enabled) {
        renderStep1_2FA();
      } else {
        renderStep2_SelectFolder();
      }
    } catch (err: any) {
      renderError(err.message || 'Failed to connect to extension.');
    }
  };

  initFlow();
}

/**
 * ============================================================================
 * MESSAGE DISPATCHER & INJECTION SYSTEM
 * ============================================================================
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'EXTRACT_PAGE_PRODUCT') {
    try {
      const data = extractInPageProductData();
      sendResponse({ success: true, data });
    } catch (err: any) {
      sendResponse({ success: false, error: err.message });
    }
    return true;
  } else if (message.action === 'SHOW_TOAST') {
    showToast(message);
  } else if (message.action === 'OPEN_VAULT_SAVE_MODAL') {
    openSecretVaultModal(
      message.url || window.location.href,
      message.title || document.title,
      message.webUrl
    );
  } else if (message.action === 'OPEN_PLACE_SAVE_MODAL') {
    openGoogleMapsModal(
      message.url || window.location.href
    );
  }
});

function evaluatePageInjections() {
  if (isGoogleMapsPlacePage()) {
    const prodBtn = document.getElementById(VAULT_BUTTON_ID);
    if (prodBtn) prodBtn.remove();
    const ytBtn = document.getElementById(VAULT_YT_BUTTON_ID);
    if (ytBtn) ytBtn.remove();
    injectGoogleMapsSaveButton();
  } else if (isYouTubeWatchPage()) {
    const prodBtn = document.getElementById(VAULT_BUTTON_ID);
    if (prodBtn) prodBtn.remove();
    const mapsBtn = document.getElementById(VAULT_MAPS_BUTTON_ID);
    if (mapsBtn) mapsBtn.remove();
    injectYouTubeSaveButton();
  } else if (isProductPage()) {
    const ytBtn = document.getElementById(VAULT_YT_BUTTON_ID);
    if (ytBtn) ytBtn.remove();
    const mapsBtn = document.getElementById(VAULT_MAPS_BUTTON_ID);
    if (mapsBtn) mapsBtn.remove();
    injectProductSaveButton();
  } else {
    const prodBtn = document.getElementById(VAULT_BUTTON_ID);
    if (prodBtn) prodBtn.remove();
    const ytBtn = document.getElementById(VAULT_YT_BUTTON_ID);
    if (ytBtn) ytBtn.remove();
    const mapsBtn = document.getElementById(VAULT_MAPS_BUTTON_ID);
    if (mapsBtn) mapsBtn.remove();
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', evaluatePageInjections);
} else {
  evaluatePageInjections();
}

// Watch for single-page navigation (YouTube / Amazon dynamic page loads)
let lastUrl = location.href;
new MutationObserver(() => {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    setTimeout(evaluatePageInjections, 1000);
  }
}).observe(document, { subtree: true, childList: true });

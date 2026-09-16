# VaultXMedia Chrome Extension: 1-Click Product Wishlist Saver

A lightweight, high-performance Chrome Extension built with **Manifest V3 and TypeScript** for **VaultXMedia Product Wishlist**.

When you're browsing products on **Amazon, Flipkart, Myntra, Ajio, Meesho, Nykaa, Tata CLiQ, Croma, Reliance Digital**, or other ecommerce websites, save products directly to your VaultXMedia account with **1 click**.

---

## Key Features

- **Direct 1-Click Save (No Popups / Panels)**:
  - Click the **VaultXMedia icon** in your Chrome toolbar on any product page.
  - The extension instantly sends the URL to your existing VaultXMedia backend extraction engine.
  - The extension badge animates (`...` ➔ `✔`), and an in-page toast notification confirms the product was added to your wishlist.
- **In-Page Floating Button**:
  - An unobtrusive floating button (`✦ Save to VaultXMedia`) appears on supported ecommerce sites.
  - Click to save immediately with a rich feedback toast showing product title, store, and price.
- **Right-Click Context Menu**:
  - Right-click any link or product page and choose *"Save to VaultXMedia Wishlist"*.
- **100% Backend Scraping Engine Reuse**:
  - Reuses VaultXMedia's existing `POST /api/products` (powered by `ProductExtractorService` and Cheerio/JSON-LD).
  - Extracts title, image, price, original price, discount %, stock availability, description, store brand, etc.
- **Account & Session Management**:
  - Automatic session detection from active VaultXMedia web app sessions or cookies (`pdl_session`).
  - Dedicated **Options Page** (`chrome://extensions` ➔ Details ➔ Extension options) for one-time login or custom API URL configuration.

---

## How to Install & Load in Google Chrome

1. Build the extension:
   ```bash
   npm run build:extension
   ```
   *(Or navigate into `extension/` and run `node build.js`)*

2. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** using the toggle in the top-right corner.

4. Click **"Load unpacked"** in the top-left corner.

5. Select the **`extension/dist`** folder:
   ```
   <PROJECT_ROOT>/extension/dist
   ```

6. Pin the **VaultXMedia** icon to your Chrome toolbar for fast 1-click saving!

---

## Connecting Your Account

1. Right-click the VaultXMedia extension icon in your Chrome toolbar and choose **Options** (or open via `chrome://extensions` ➔ Details ➔ Extension options).
2. Enter your VaultXMedia **Username/Email** and **Password** to sign in.
   *(Alternatively, click **"Auto-Sync Active Session"** if you're already logged in on your VaultXMedia web app)*.
3. Configure your API URL:
   - **Localhost (Dev)**: `http://localhost:5000/api` (Web: `http://localhost:5173`)
   - **Cloud (Production)**: `https://digital-media-vault-api.onrender.com/api` (Web: `https://digital-media-vault.vercel.app`)
4. Click **Save Settings**.

---

## Supported Stores

- Amazon (`amazon.in`, `amazon.com`)
- Flipkart (`flipkart.com`)
- Myntra (`myntra.com`)
- Ajio (`ajio.com`)
- Meesho (`meesho.com`)
- Nykaa (`nykaa.com`)
- Tata CLiQ (`tatacliq.com`)
- Croma (`croma.com`)
- Reliance Digital (`reliancedigital.in`)
- And generic ecommerce pages with Schema.org / OpenGraph metadata

---

## Architecture & Code Structure

```
extension/
├── manifest.json              # Manifest V3 configuration (no default_popup)
├── build.js                   # High-speed bundler (ESM background, IIFE content, ESM options)
├── package.json               # Extension package manifest
├── tsconfig.json              # TypeScript configuration
├── icons/                     # Generated icon sizes (16, 48, 128)
├── dist/                      # Production-ready unpacked extension folder
└── src/
    ├── background/
    │   └── index.ts           # Service worker: 1-click action listener, context menu, badge states
    ├── content/
    │   ├── index.ts           # In-page floating button injector & rich toast notification
    │   └── content.css        # Styles for floating button & animated toast
    ├── options/
    │   ├── options.html       # Clean dark-themed options & login page
    │   ├── options.ts         # Options logic, auth state, API settings
    │   └── options.css        # Options styling
    ├── services/
    │   ├── api.ts             # VaultXMedia API client (POST /api/products, /api/auth)
    │   └── storage.ts         # Chrome storage wrapper
    └── types/
        └── index.ts           # TypeScript interfaces
```

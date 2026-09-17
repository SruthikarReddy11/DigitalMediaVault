"use strict";(()=>{var A="vaultxmedia-floating-save-btn",M="vaultxmedia-floating-yt-btn",F="vaultxmedia-save-toast",U="vaultxmedia-secret-modal";function N(){let e=window.location.href.toLowerCase(),r=window.location.hostname.toLowerCase();return r.includes("youtube.com")||r.includes("youtu.be")||r.includes("vimeo.com")||r.includes("dailymotion.com")?!1:r.includes("amazon.")?e.includes("/dp/")||e.includes("/gp/product/")||e.includes("/d/"):r.includes("flipkart.com")?e.includes("/p/")||e.includes("pid="):r.includes("myntra.com")?/\/\d+\/buy/.test(e)||e.includes("/buy"):r.includes("ajio.com")?e.includes("/p/"):r.includes("meesho.com")?e.includes("/s/p/")||e.includes("/p/"):r.includes("nykaa.com")?e.includes("/p/"):r.includes("tatacliq.com")?e.includes("/p-"):r.includes("croma.com")||r.includes("reliancedigital.in")?e.includes("/p/"):!1}function z(){let e=window.location.hostname.toLowerCase(),r=window.location.href.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")?r.includes("/watch")||r.includes("/shorts/")||r.includes("/live/")||r.includes("/embed/")||r.includes("/clip/")||e.includes("youtu.be"):!1}function w(e){let r=document.getElementById(F);r&&r.remove();let a=document.createElement("div");a.id=F,a.className=`vaultx-toast ${e.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let s=e.price!==void 0&&e.price!==null?`${e.currencySymbol||"\u20B9"}${e.price.toLocaleString("en-IN")}`:"",d=e.imageUrl?`<img src="${e.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${e.isError?"\u2715":"\u2713"}</div>`;a.innerHTML=`
    <div class="vaultx-toast-content">
      ${d}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${e.store||"VaultXMedia"}</span>
          ${s?`<span class="vaultx-toast-price">${s}</span>`:""}
        </div>
        <div class="vaultx-toast-title" title="${e.title}">${e.title}</div>
        <div class="vaultx-toast-sub">${e.isError?e.message||"Error occurred":e.message||"\u2713 Saved successfully"}</div>
      </div>
      <button class="vaultx-toast-close" title="Dismiss">&times;</button>
    </div>
    ${e.url&&!e.isError?`<div class="vaultx-toast-action">
             <a href="${e.url}" target="_blank" rel="noopener noreferrer" class="vaultx-toast-link">
               Open in VaultXMedia &rarr;
             </a>
           </div>`:""}
  `,a.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{a.classList.add("vaultx-toast-fadeout"),setTimeout(()=>a.remove(),300)}),document.body.appendChild(a),setTimeout(()=>{a.parentElement&&(a.classList.add("vaultx-toast-fadeout"),setTimeout(()=>a.remove(),300))},5e3)}var L=null;function $(e,r){L=r||L,e.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),e.classList.add("vaultx-already-saved"),e.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let a=e.querySelector(".vaultx-btn-icon"),s=e.querySelector(".vaultx-btn-text");a&&(a.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),s&&(s.textContent="Already in Wishlist")}async function P(e){try{let r=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});r&&r.exists&&$(e,r.product)}catch{}}function j(){let e=window.location.href,r=window.location.hostname.toLowerCase(),a="",s="",d,u,m="",E="General",l=!0,p="",S="INR",q="\u20B9";if(r.includes("amazon."))p="Amazon";else if(r.includes("flipkart.com"))p="Flipkart";else if(r.includes("myntra.com"))p="Myntra";else if(r.includes("ajio.com"))p="Ajio";else if(r.includes("meesho.com"))p="Meesho";else if(r.includes("nykaa.com"))p="Nykaa";else if(r.includes("tatacliq.com"))p="Tata CLiQ";else if(r.includes("croma.com"))p="Croma";else if(r.includes("reliancedigital.in"))p="Reliance Digital";else{let c=r.replace(/^www\./,"").split(".")[0];p=c.charAt(0).toUpperCase()+c.slice(1)||"Other"}let b=c=>{if(typeof c=="number"&&!isNaN(c))return c;if(!c||typeof c!="string")return;let i=c.replace(/[^\d.]/g,"").trim(),t=parseFloat(i);return isNaN(t)||t<=0?void 0:t};if(document.querySelectorAll('script[type="application/ld+json"]').forEach(c=>{try{let i=c.textContent;if(!i)return;let t=JSON.parse(i),o=Array.isArray(t)?t:t["@graph"]?t["@graph"]:[t];for(let n of o)if(n["@type"]==="Product"||n["@type"]==="IndividualProduct"||n["@type"]==="ProductModel"){if(!a&&n.name&&(a=String(n.name).trim()),s||(typeof n.brand=="string"?s=n.brand.trim():n.brand?.name&&(s=String(n.brand.name).trim())),!m)if(typeof n.image=="string")m=n.image;else if(Array.isArray(n.image)&&n.image.length>0){let x=n.image[0];m=typeof x=="string"?x:x?.url||""}else n.image?.url&&(m=n.image.url);let v=Array.isArray(n.offers)?n.offers[0]:n.offers;if(v){if(d===void 0){let x=b(v.price||v.lowPrice);x&&(d=x)}v.priceCurrency&&(S=v.priceCurrency,q=S==="INR"?"\u20B9":S==="USD"?"$":S),v.availability&&(l=!String(v.availability).toLowerCase().includes("outofstock"))}}}catch{}}),p==="Ajio"){E="Fashion";let c=document.querySelector(".brand-name")?.textContent||document.querySelector("h2.brand-name")?.textContent||document.querySelector(".prod-brand")?.textContent;c&&c.trim()&&(s=c.trim());let i=document.querySelector(".prod-name")?.textContent||document.querySelector("h1.prod-title")?.textContent;if(i&&i.trim()&&(a=s&&!i.trim().toLowerCase().startsWith(s.toLowerCase())?`${s} ${i.trim()}`:i.trim()),d===void 0){let t=document.querySelector(".prod-sp")?.textContent||document.querySelector(".price-value")?.textContent,o=b(t);o&&(d=o)}if(u===void 0){let t=document.querySelector(".prod-cp")?.textContent||document.querySelector(".original-price")?.textContent,o=b(t);o&&(u=o)}if(!m){let t=Array.from(document.querySelectorAll("img")).filter(o=>{let n=o.getAttribute("src")||"";return n.includes("assets.ajio.com")&&(n.includes("medias")||n.includes("root")||n.includes("images"))});t.length>0&&(m=t[0].src||t[0].getAttribute("src")||"")}}else if(p==="Myntra"){E="Fashion";let c=document.querySelector(".pdp-title")?.textContent;c&&c.trim()&&(s=c.trim());let i=document.querySelector(".pdp-name")?.textContent;if(i&&i.trim()&&(a=s&&!i.trim().toLowerCase().startsWith(s.toLowerCase())?`${s} ${i.trim()}`:i.trim()),d===void 0){let t=b(document.querySelector(".pdp-price strong")?.textContent||document.querySelector(".pdp-price")?.textContent);t&&(d=t)}if(u===void 0){let t=b(document.querySelector(".pdp-mrp s")?.textContent||document.querySelector(".pdp-mrp")?.textContent);t&&(u=t)}if(!m){let t=document.querySelector(".image-grid-image")||document.querySelector('img[src*="assets.myntassets.com"]');t&&(m=t.src||t.getAttribute("src")||"")}}else if(p==="Flipkart"){let c=document.querySelector("span.B_NuCI")?.textContent||document.querySelector("h1.yhB1nd")?.textContent||document.querySelector("span._35KyD6")?.textContent;if(c&&c.trim()&&(a=c.trim()),d===void 0){let i=document.querySelector("div._30jeq3._16Jk6d")?.textContent||document.querySelector("div._30jeq3")?.textContent||document.querySelector("div.Nx9bqj.CxhGGd")?.textContent,t=b(i);t&&(d=t)}if(u===void 0){let i=document.querySelector("div._3I9_wc._2p6lqe")?.textContent||document.querySelector("div._3I9_wc")?.textContent||document.querySelector("div.yRaY8j.A68aAq")?.textContent,t=b(i);t&&(u=t)}if(!m){let i=document.querySelector("img._396cs4")||document.querySelector("img.DByuf4")||document.querySelector("img._2r_T1I");i&&(m=i.src||i.getAttribute("src")||"")}}else if(p==="Amazon"){let c=document.querySelector("#productTitle")?.textContent||document.querySelector("span#title")?.textContent;if(c&&c.trim()&&(a=c.trim()),d===void 0){let i=document.querySelector(".a-price .a-offscreen")?.textContent||document.querySelector("#priceblock_ourprice")?.textContent||document.querySelector("#corePrice_desktop .a-offscreen")?.textContent,t=b(i);t&&(d=t)}if(u===void 0){let i=document.querySelector(".a-text-price span.a-offscreen")?.textContent||document.querySelector("#listPrice")?.textContent,t=b(i);t&&(u=t)}if(!m){let i=document.querySelector("#landingImage")||document.querySelector("#imgBlkFront");i&&(m=i.src||i.getAttribute("data-old-hires")||i.getAttribute("src")||"")}}if(a||(a=document.querySelector('meta[property="og:title"]')?.content||document.querySelector('meta[name="twitter:title"]')?.content||document.title||""),m||(m=document.querySelector('meta[property="og:image"]')?.content||document.querySelector('meta[property="og:image:secure_url"]')?.content||document.querySelector('meta[name="twitter:image"]')?.content||""),p==="Ajio"&&(!a||a.toLowerCase().includes("access denied")))try{let i=new URL(e).pathname.match(/\/([^/]+)\/p\/([^/?#]+)/i);if(i&&i[1]){let t=i[1].split("-").filter(Boolean);if(t.length>0){let o=t.map(n=>n.charAt(0).toUpperCase()+n.slice(1));s=s||o[0],a=o.join(" ")}}}catch{}return a=a.replace(/\s*\|\s*Flipkart\.com$/i,"").replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i,"").replace(/\s*:\s*Amazon\.in:.*$/i,"").replace(/\s*Buy Online at Ajio\.com$/i,"").replace(/\s*-\s*Ajio$/i,"").replace(/\s*Buy.*Online at Myntra$/i,"").replace(/\s*\|\s*Myntra$/i,"").trim(),(!a||a.toLowerCase().includes("access denied"))&&(a=`Product from ${p}`),{url:e,title:a,brand:s||void 0,store:p,category:E,price:d,originalPrice:u,currency:S,currencySymbol:q,imageUrl:m||void 0,inStock:l}}function R(){let e=document.getElementById(A);if(e){P(e);return}N()&&(e=document.createElement("button"),e.id=A,e.className="vaultx-floating-btn",e.setAttribute("type","button"),e.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,P(e),e.addEventListener("click",async r=>{if(r.preventDefault(),r.stopPropagation(),e.classList.contains("vaultx-loading"))return;if(e.classList.contains("vaultx-already-saved")){w({title:L?.title||"Product in Wishlist",store:L?.store,price:L?.price??void 0,currencySymbol:L?.currencySymbol,imageUrl:L?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}e.classList.add("vaultx-loading");let a=e.querySelector(".vaultx-btn-text"),s=a.textContent;a.textContent="Saving...";let d=j();try{let u=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href,title:d?.title||document.title,productData:d});e.classList.remove("vaultx-loading"),u&&u.success?(L=u.product,!!u.alreadyExists?($(e,u.product),w({title:u.product?.title||"Product in Wishlist",store:u.product?.store,price:u.product?.price??void 0,currencySymbol:u.product?.currencySymbol,imageUrl:u.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(e.classList.add("vaultx-saved"),a.textContent="\u2713 Saved to Vault!",setTimeout(()=>{$(e,u.product)},2500))):(e.classList.add("vaultx-error"),a.textContent="Failed",w({title:"Failed to Save",message:u?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),a.textContent=s},3500))}catch(u){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),a.textContent="Failed",w({title:"Failed to Save",message:u.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),a.textContent=s},3500)}}),document.body.appendChild(e))}function W(){if(!z()){let r=document.getElementById(M);r&&r.remove();return}let e=document.getElementById(M);e||(e=document.createElement("button"),e.id=M,e.className="vaultx-floating-btn vaultx-youtube-btn",e.setAttribute("type","button"),e.setAttribute("title","Save YouTube video to Vault Theater & Videos"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,e.addEventListener("click",async r=>{if(r.preventDefault(),r.stopPropagation(),e.classList.contains("vaultx-loading"))return;e.classList.add("vaultx-loading");let a=e.querySelector(".vaultx-btn-text"),s=a.textContent;a.textContent="Saving Video...";try{let d=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});e.classList.remove("vaultx-loading"),d&&d.success?(e.classList.add("vaultx-saved"),a.textContent="\u2713 Saved to Videos!",setTimeout(()=>{e.classList.remove("vaultx-saved"),a.textContent=s},3e3)):(e.classList.add("vaultx-error"),a.textContent="Failed",w({title:"Failed to Save Video",message:d?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),a.textContent=s},3500))}catch(d){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),a.textContent="Failed",w({title:"Failed to Save Video",message:d.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),a.textContent=s},3500)}}),document.body.appendChild(e))}function X(e,r,a="https://digital-media-vault.vercel.app"){let s=document.getElementById(U);s&&s.remove();let d=document.createElement("div");d.id=U,d.className="vaultx-modal-backdrop";let u=document.createElement("div");u.className="vaultx-modal",u.innerHTML=`
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
          <div class="vaultx-modal-link-title" title="${r||e}">${r||e}</div>
          <div class="vaultx-modal-link-url" title="${e}">${e}</div>
        </div>
      </div>

      <!-- Dynamic Step Content -->
      <div id="vaultx-dynamic-step-container">
        <div style="text-align:center; padding: 24px 0; color: #94a3b8; font-size: 13px;">
          <div style="margin-bottom:8px; display:inline-block; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F510}</div>
          <div>Connecting to Secret Vault...</div>
        </div>
      </div>
    </div>
  `,d.appendChild(u),document.body.appendChild(d);let m=()=>{d.remove(),document.removeEventListener("keydown",E)},E=t=>{t.key==="Escape"&&m()};document.addEventListener("keydown",E),u.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",m),d.addEventListener("click",t=>{t.target===d&&m()});let l=u.querySelector("#vaultx-dynamic-step-container"),p=(t,o=!0)=>{l.innerHTML=`
      <div class="vaultx-modal-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${t}</span>
      </div>
      <div class="vaultx-modal-actions">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-err-cancel">Cancel</button>
        ${o?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>':""}
      </div>
    `,l.querySelector("#vaultx-err-cancel")?.addEventListener("click",m),l.querySelector("#vaultx-err-retry")?.addEventListener("click",i)},S=t=>{l.innerHTML=`
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:13.5px; font-weight:700; color:#f1f5f9; margin-bottom:4px;">
          Authorize Secret Vault
        </div>
        <div style="font-size:11.5px; color:#94a3b8; line-height:1.4;">
          Please authorize your VaultXMedia account to access and save into your Secret Vault folders.
        </div>
      </div>

      <div id="vaultx-auth-error-box">
        ${t?`<div class="vaultx-modal-error">${t}</div>`:""}
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
    `;let o=l.querySelector("#vaultx-auth-error-box"),n=l.querySelector("#vaultx-auth-autosync"),v=l.querySelector("#vaultx-inline-login-form"),x=l.querySelector("#vaultx-auth-id"),g=l.querySelector("#vaultx-auth-pw"),y=l.querySelector("#vaultx-auth-submit");l.querySelector("#vaultx-auth-cancel")?.addEventListener("click",m),n.addEventListener("click",async()=>{n.disabled=!0,n.innerHTML="<span>Detecting browser session...</span>",o.innerHTML="";try{let h=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});h&&h.success?i():(n.disabled=!1,n.innerHTML="<span>Auto-Detect Active Web Session</span>",o.innerHTML='<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>',x.focus())}catch(h){n.disabled=!1,n.innerHTML="<span>Auto-Detect Active Web Session</span>",o.innerHTML=`<div class="vaultx-modal-error">${h.message||"Auto-detection failed."}</div>`}}),v.addEventListener("submit",async h=>{h.preventDefault();let f=x.value.trim(),C=g.value;if(!(!f||!C)){y.disabled=!0,y.textContent="Authorizing...",o.innerHTML="";try{let T=await chrome.runtime.sendMessage({action:"LOGIN",identifier:f,password:C});T&&T.success?i():(y.disabled=!1,y.textContent="Authorize & Unlock \u2192",o.innerHTML=`<div class="vaultx-modal-error">${T?.error||"Invalid credentials."}</div>`)}catch(T){y.disabled=!1,y.textContent="Authorize & Unlock \u2192",o.innerHTML=`<div class="vaultx-modal-error">${T.message||"Authorization failed."}</div>`}}})},q=()=>{l.innerHTML=`
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
    `;let t=l.querySelector("#vaultx-2fa-form"),o=l.querySelector("#vaultx-totp-input"),n=l.querySelector("#vaultx-2fa-submit"),v=l.querySelector("#vaultx-2fa-error-box");setTimeout(()=>o?.focus(),80),l.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",m),t.addEventListener("submit",async x=>{x.preventDefault();let g=o.value.trim();if(g.length!==6){v.innerHTML='<div class="vaultx-modal-error">Please enter all 6 digits.</div>';return}n.disabled=!0,n.textContent="Verifying...";try{let y=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:g});y&&y.success?b():(n.disabled=!1,n.textContent="Unlock Vault \u2192",v.innerHTML=`<div class="vaultx-modal-error">${y?.error||"Invalid 6-digit code. Please check your app."}</div>`,o.value="",o.focus())}catch(y){n.disabled=!1,n.textContent="Unlock Vault \u2192",v.innerHTML=`<div class="vaultx-modal-error">${y.message||"Error communicating with extension."}</div>`}})},b=async()=>{l.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let t=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!t||!t.success){t?.needAuth?S(t.error):p(t?.error||"Failed to fetch vault folders.");return}let o=t.data||[];if(o.length===0){H();return}l.innerHTML=`
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${o.map(n=>`
                <div class="vaultx-folder-item" data-folder-id="${n.id}" data-folder-name="${n.name}" data-folder-color="${n.color||"#3b82f6"}">
                  <div class="vaultx-folder-left">
                    <div class="vaultx-folder-dot" style="background-color: ${n.color||"#3b82f6"};"></div>
                    <span class="vaultx-folder-name">${n.name}</span>
                  </div>
                  <span class="vaultx-folder-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>${n.cellCount||0} links</span>
                  </span>
                </div>
              `).join("")}
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
      `,l.querySelector("#vaultx-step2-cancel")?.addEventListener("click",m),l.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",H),l.querySelectorAll(".vaultx-folder-item").forEach(n=>{n.addEventListener("click",()=>{let v=n.getAttribute("data-folder-id"),x=n.getAttribute("data-folder-name"),g=n.getAttribute("data-folder-color");c(v,x,g)})})}catch(t){p(t.message||"Could not load folders.")}},H=()=>{l.innerHTML=`
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
    `,l.querySelector("#vaultx-create-folder-back")?.addEventListener("click",b);let t=l.querySelector("#vaultx-create-folder-form"),o=l.querySelector("#vaultx-new-folder-name"),n=l.querySelector("#vaultx-new-folder-pw"),v=l.querySelector("#vaultx-create-folder-submit"),x=l.querySelector("#vaultx-create-folder-error");setTimeout(()=>o?.focus(),80),t.addEventListener("submit",async g=>{g.preventDefault();let y=o.value.trim(),h=n.value.trim();if(!y||h.length<4){x.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}v.disabled=!0,v.textContent="Creating...";try{let f=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:y,password:h,color:"#6366f1"}});f&&f.success&&f.data?c(f.data.id,f.data.name,f.data.color||"#6366f1",h):(v.disabled=!1,v.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${f?.error||"Failed to create folder."}</div>`)}catch(f){v.disabled=!1,v.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${f.message||"Error creating folder."}</div>`}})},c=(t,o,n,v="")=>{l.innerHTML=`
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Indicator -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${n};"></div>
          <span style="font-size:12px; font-weight:700; color:#f1f5f9;">Destination: ${o}</span>
        </div>

        <div id="vaultx-save-error-box"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Folder Password</label>
          <input
            type="password"
            id="vaultx-folder-pw-input"
            class="vaultx-input"
            placeholder="Enter password for ${o}..."
            value="${v}"
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
            value="${r.replace(/"/g,"&quot;")}"
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
    `;let x=l.querySelector("#vaultx-save-cell-form"),g=l.querySelector("#vaultx-folder-pw-input"),y=l.querySelector("#vaultx-cell-title-input"),h=l.querySelector("#vaultx-cell-notes-input"),f=l.querySelector("#vaultx-save-submit"),C=l.querySelector("#vaultx-save-error-box");setTimeout(()=>{v?y?.focus():g?.focus()},80),l.querySelector("#vaultx-save-back")?.addEventListener("click",b),x.addEventListener("submit",async T=>{T.preventDefault();let B=g.value.trim(),V=y.value.trim()||r||e,O=h.value.trim()||void 0;if(!B){C.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}f.disabled=!0,f.textContent="Verifying Password...";try{let k=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:t,password:B});if(!k||!k.success){f.disabled=!1,f.textContent="Unlock & Save Link",C.innerHTML=`<div class="vaultx-modal-error">${k?.error||"Incorrect folder password."}</div>`,g.focus();return}f.textContent="Saving Link...";let I=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:t,data:{url:e,title:V,notes:O}});I&&I.success?(m(),w({title:V,message:`\u2713 Saved in Secret Vault / ${o}`,url:`${a}/vault`,isError:!1})):(f.disabled=!1,f.textContent="Unlock & Save Link",C.innerHTML=`<div class="vaultx-modal-error">${I?.error||"Failed to save link in folder."}</div>`)}catch(k){f.disabled=!1,f.textContent="Unlock & Save Link",C.innerHTML=`<div class="vaultx-modal-error">${k.message||"Error saving link."}</div>`}})},i=async()=>{try{let t=await chrome.runtime.sendMessage({action:"CHECK_AUTH"});if(!t||!t.isAuthenticated){let n=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});if(!n||!n.success){S();return}}let o=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!o||!o.success){o?.needAuth?S(o.error):p(o?.error||"Failed to connect to Secret Vault.");return}o.data?.enabled?q():b()}catch(t){p(t.message||"Failed to connect to extension.")}};i()}chrome.runtime.onMessage.addListener((e,r,a)=>{if(e.action==="EXTRACT_PAGE_PRODUCT"){try{let s=j();a({success:!0,data:s})}catch(s){a({success:!1,error:s.message})}return!0}else e.action==="SHOW_TOAST"?w(e):e.action==="OPEN_VAULT_SAVE_MODAL"&&X(e.url||window.location.href,e.title||document.title,e.webUrl)});function _(){if(z()){let e=document.getElementById(A);e&&e.remove(),W()}else if(N()){let e=document.getElementById(M);e&&e.remove(),R()}else{let e=document.getElementById(A);e&&e.remove();let r=document.getElementById(M);r&&r.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",_):_();var D=location.href;new MutationObserver(()=>{let e=location.href;e!==D&&(D=e,setTimeout(_,1e3))}).observe(document,{subtree:!0,childList:!0});})();

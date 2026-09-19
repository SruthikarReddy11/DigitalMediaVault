"use strict";(()=>{var $="vaultxmedia-floating-save-btn",q="vaultxmedia-floating-yt-btn",A="vaultxmedia-floating-maps-btn",U="vaultxmedia-save-toast",D="vaultxmedia-secret-modal",F="vaultxmedia-place-modal";function z(){let e=window.location.href.toLowerCase(),t=window.location.hostname.toLowerCase();return t.includes("youtube.com")||t.includes("youtu.be")||t.includes("vimeo.com")||t.includes("dailymotion.com")?!1:t.includes("amazon.")?e.includes("/dp/")||e.includes("/gp/product/")||e.includes("/d/"):t.includes("flipkart.com")?e.includes("/p/")||e.includes("pid="):t.includes("myntra.com")?/\/\d+\/buy/.test(e)||e.includes("/buy"):t.includes("ajio.com")?e.includes("/p/"):t.includes("meesho.com")?e.includes("/s/p/")||e.includes("/p/"):t.includes("nykaa.com")?e.includes("/p/"):t.includes("tatacliq.com")?e.includes("/p-"):t.includes("croma.com")||t.includes("reliancedigital.in")?e.includes("/p/"):!1}function j(){let e=window.location.hostname.toLowerCase(),t=window.location.href.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")?t.includes("/watch")||t.includes("/shorts/")||t.includes("/live/")||t.includes("/embed/")||t.includes("/clip/")||e.includes("youtu.be"):!1}function R(){let e=window.location.hostname.toLowerCase(),t=window.location.href.toLowerCase();return!!(e.includes("maps.google.")||e.includes("maps.app.goo.gl")||e.includes("google.")&&(t.includes("/maps")||t.includes("/place/"))||e.includes("goo.gl")&&t.includes("/maps"))}function C(e){let t=document.getElementById(U);t&&t.remove();let o=document.createElement("div");o.id=U,o.className=`vaultx-toast ${e.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let c=e.price!==void 0&&e.price!==null?`${e.currencySymbol||"\u20B9"}${e.price.toLocaleString("en-IN")}`:"",u=e.imageUrl?`<img src="${e.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${e.isError?"\u2715":"\u2713"}</div>`;o.innerHTML=`
    <div class="vaultx-toast-content">
      ${u}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${e.store||"VaultXMedia"}</span>
          ${c?`<span class="vaultx-toast-price">${c}</span>`:""}
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
  `,o.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{o.classList.add("vaultx-toast-fadeout"),setTimeout(()=>o.remove(),300)}),document.body.appendChild(o),setTimeout(()=>{o.parentElement&&(o.classList.add("vaultx-toast-fadeout"),setTimeout(()=>o.remove(),300))},5e3)}var k=null;function P(e,t){k=t||k,e.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),e.classList.add("vaultx-already-saved"),e.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let o=e.querySelector(".vaultx-btn-icon"),c=e.querySelector(".vaultx-btn-text");o&&(o.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),c&&(c.textContent="Already in Wishlist")}async function N(e){try{let t=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});t&&t.exists&&P(e,t.product)}catch{}}function W(){let e=window.location.href,t=window.location.hostname.toLowerCase(),o="",c="",u,d,p="",y="General",s=!0,f="",r="INR",M="\u20B9";if(t.includes("amazon."))f="Amazon";else if(t.includes("flipkart.com"))f="Flipkart";else if(t.includes("myntra.com"))f="Myntra";else if(t.includes("ajio.com"))f="Ajio";else if(t.includes("meesho.com"))f="Meesho";else if(t.includes("nykaa.com"))f="Nykaa";else if(t.includes("tatacliq.com"))f="Tata CLiQ";else if(t.includes("croma.com"))f="Croma";else if(t.includes("reliancedigital.in"))f="Reliance Digital";else{let v=t.replace(/^www\./,"").split(".")[0];f=v.charAt(0).toUpperCase()+v.slice(1)||"Other"}let L=v=>{if(typeof v=="number"&&!isNaN(v))return v;if(!v||typeof v!="string")return;let l=v.replace(/[^\d.]/g,"").trim(),n=parseFloat(l);return isNaN(n)||n<=0?void 0:n};if(document.querySelectorAll('script[type="application/ld+json"]').forEach(v=>{try{let l=v.textContent;if(!l)return;let n=JSON.parse(l),i=Array.isArray(n)?n:n["@graph"]?n["@graph"]:[n];for(let a of i)if(a["@type"]==="Product"||a["@type"]==="IndividualProduct"||a["@type"]==="ProductModel"){if(!o&&a.name&&(o=String(a.name).trim()),c||(typeof a.brand=="string"?c=a.brand.trim():a.brand?.name&&(c=String(a.brand.name).trim())),!p)if(typeof a.image=="string")p=a.image;else if(Array.isArray(a.image)&&a.image.length>0){let g=a.image[0];p=typeof g=="string"?g:g?.url||""}else a.image?.url&&(p=a.image.url);let m=Array.isArray(a.offers)?a.offers[0]:a.offers;if(m){if(u===void 0){let g=L(m.price||m.lowPrice);g&&(u=g)}m.priceCurrency&&(r=m.priceCurrency,M=r==="INR"?"\u20B9":r==="USD"?"$":r),m.availability&&(s=!String(m.availability).toLowerCase().includes("outofstock"))}}}catch{}}),f==="Ajio"){y="Fashion";let v=document.querySelector(".brand-name")?.textContent||document.querySelector("h2.brand-name")?.textContent||document.querySelector(".prod-brand")?.textContent;v&&v.trim()&&(c=v.trim());let l=document.querySelector(".prod-name")?.textContent||document.querySelector("h1.prod-title")?.textContent;if(l&&l.trim()&&(o=c&&!l.trim().toLowerCase().startsWith(c.toLowerCase())?`${c} ${l.trim()}`:l.trim()),u===void 0){let n=document.querySelector(".prod-sp")?.textContent||document.querySelector(".price-value")?.textContent,i=L(n);i&&(u=i)}if(d===void 0){let n=document.querySelector(".prod-cp")?.textContent||document.querySelector(".original-price")?.textContent,i=L(n);i&&(d=i)}if(!p){let n=Array.from(document.querySelectorAll("img")).filter(i=>{let a=i.getAttribute("src")||"";return a.includes("assets.ajio.com")&&(a.includes("medias")||a.includes("root")||a.includes("images"))});n.length>0&&(p=n[0].src||n[0].getAttribute("src")||"")}}else if(f==="Myntra"){y="Fashion";let v=document.querySelector(".pdp-title")?.textContent;v&&v.trim()&&(c=v.trim());let l=document.querySelector(".pdp-name")?.textContent;if(l&&l.trim()&&(o=c&&!l.trim().toLowerCase().startsWith(c.toLowerCase())?`${c} ${l.trim()}`:l.trim()),u===void 0){let n=L(document.querySelector(".pdp-price strong")?.textContent||document.querySelector(".pdp-price")?.textContent);n&&(u=n)}if(d===void 0){let n=L(document.querySelector(".pdp-mrp s")?.textContent||document.querySelector(".pdp-mrp")?.textContent);n&&(d=n)}if(!p){let n=document.querySelector(".image-grid-image")||document.querySelector('img[src*="assets.myntassets.com"]');n&&(p=n.src||n.getAttribute("src")||"")}}else if(f==="Flipkart"){let v=document.querySelector("span.B_NuCI")?.textContent||document.querySelector("h1.yhB1nd")?.textContent||document.querySelector("span._35KyD6")?.textContent;if(v&&v.trim()&&(o=v.trim()),u===void 0){let l=document.querySelector("div._30jeq3._16Jk6d")?.textContent||document.querySelector("div._30jeq3")?.textContent||document.querySelector("div.Nx9bqj.CxhGGd")?.textContent,n=L(l);n&&(u=n)}if(d===void 0){let l=document.querySelector("div._3I9_wc._2p6lqe")?.textContent||document.querySelector("div._3I9_wc")?.textContent||document.querySelector("div.yRaY8j.A68aAq")?.textContent,n=L(l);n&&(d=n)}if(!p){let l=document.querySelector("img._396cs4")||document.querySelector("img.DByuf4")||document.querySelector("img._2r_T1I");l&&(p=l.src||l.getAttribute("src")||"")}}else if(f==="Amazon"){let v=document.querySelector("#productTitle")?.textContent||document.querySelector("span#title")?.textContent;if(v&&v.trim()&&(o=v.trim()),u===void 0){let l=document.querySelector(".a-price .a-offscreen")?.textContent||document.querySelector("#priceblock_ourprice")?.textContent||document.querySelector("#corePrice_desktop .a-offscreen")?.textContent,n=L(l);n&&(u=n)}if(d===void 0){let l=document.querySelector(".a-text-price span.a-offscreen")?.textContent||document.querySelector("#listPrice")?.textContent,n=L(l);n&&(d=n)}if(!p){let l=document.querySelector("#landingImage")||document.querySelector("#imgBlkFront");l&&(p=l.src||l.getAttribute("data-old-hires")||l.getAttribute("src")||"")}}if(o||(o=document.querySelector('meta[property="og:title"]')?.content||document.querySelector('meta[name="twitter:title"]')?.content||document.title||""),p||(p=document.querySelector('meta[property="og:image"]')?.content||document.querySelector('meta[property="og:image:secure_url"]')?.content||document.querySelector('meta[name="twitter:image"]')?.content||""),f==="Ajio"&&(!o||o.toLowerCase().includes("access denied")))try{let l=new URL(e).pathname.match(/\/([^/]+)\/p\/([^/?#]+)/i);if(l&&l[1]){let n=l[1].split("-").filter(Boolean);if(n.length>0){let i=n.map(a=>a.charAt(0).toUpperCase()+a.slice(1));c=c||i[0],o=i.join(" ")}}}catch{}return o=o.replace(/\s*\|\s*Flipkart\.com$/i,"").replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i,"").replace(/\s*:\s*Amazon\.in:.*$/i,"").replace(/\s*Buy Online at Ajio\.com$/i,"").replace(/\s*-\s*Ajio$/i,"").replace(/\s*Buy.*Online at Myntra$/i,"").replace(/\s*\|\s*Myntra$/i,"").trim(),(!o||o.toLowerCase().includes("access denied"))&&(o=`Product from ${f}`),{url:e,title:o,brand:c||void 0,store:f,category:y,price:u,originalPrice:d,currency:r,currencySymbol:M,imageUrl:p||void 0,inStock:s}}function Y(){let e=document.getElementById($);if(e){N(e);return}z()&&(e=document.createElement("button"),e.id=$,e.className="vaultx-floating-btn",e.setAttribute("type","button"),e.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,N(e),e.addEventListener("click",async t=>{if(t.preventDefault(),t.stopPropagation(),e.classList.contains("vaultx-loading"))return;if(e.classList.contains("vaultx-already-saved")){C({title:k?.title||"Product in Wishlist",store:k?.store,price:k?.price??void 0,currencySymbol:k?.currencySymbol,imageUrl:k?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}e.classList.add("vaultx-loading");let o=e.querySelector(".vaultx-btn-text"),c=o.textContent;o.textContent="Saving...";let u=W();try{let d=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href,title:u?.title||document.title,productData:u});e.classList.remove("vaultx-loading"),d&&d.success?(k=d.product,!!d.alreadyExists?(P(e,d.product),C({title:d.product?.title||"Product in Wishlist",store:d.product?.store,price:d.product?.price??void 0,currencySymbol:d.product?.currencySymbol,imageUrl:d.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(e.classList.add("vaultx-saved"),o.textContent="\u2713 Saved to Vault!",setTimeout(()=>{P(e,d.product)},2500))):(e.classList.add("vaultx-error"),o.textContent="Failed",C({title:"Failed to Save",message:d?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500))}catch(d){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),o.textContent="Failed",C({title:"Failed to Save",message:d.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500)}}),document.body.appendChild(e))}function K(){if(!j()){let t=document.getElementById(q);t&&t.remove();return}let e=document.getElementById(q);e||(e=document.createElement("button"),e.id=q,e.className="vaultx-floating-btn vaultx-youtube-btn",e.setAttribute("type","button"),e.setAttribute("title","Save YouTube video to Vault Theater & Videos"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,e.addEventListener("click",async t=>{if(t.preventDefault(),t.stopPropagation(),e.classList.contains("vaultx-loading"))return;e.classList.add("vaultx-loading");let o=e.querySelector(".vaultx-btn-text"),c=o.textContent;o.textContent="Saving Video...";try{let u=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});e.classList.remove("vaultx-loading"),u&&u.success?(e.classList.add("vaultx-saved"),o.textContent="\u2713 Saved to Videos!",setTimeout(()=>{e.classList.remove("vaultx-saved"),o.textContent=c},3e3)):(e.classList.add("vaultx-error"),o.textContent="Failed",C({title:"Failed to Save Video",message:u?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500))}catch(u){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),o.textContent="Failed",C({title:"Failed to Save Video",message:u.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500)}}),document.body.appendChild(e))}function J(){if(!R()){let t=document.getElementById(A);t&&t.remove();return}let e=document.getElementById(A);e||(e=document.createElement("button"),e.id=A,e.className="vaultx-floating-btn vaultx-maps-btn",e.setAttribute("type","button"),e.setAttribute("title","Save place to VaultXMedia Places & Plans"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save Place</span>
  `,e.addEventListener("click",t=>{t.preventDefault(),t.stopPropagation(),G(window.location.href)}),document.body.appendChild(e))}function G(e=window.location.href,t="https://digital-media-vault.vercel.app"){let o=document.getElementById(F);o&&o.remove();let c=document.createElement("div");c.id=F,c.className="vaultx-modal-backdrop";let u=document.createElement("div");u.className="vaultx-modal",u.innerHTML=`
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
          <div style="margin-bottom:8px; display:inline-block; animation: vaultx-pulse 1s infinite ease-in-out; font-size:24px;">\u{1F4CD}</div>
          <div>Resolving Google Maps place details...</div>
        </div>
      </div>
    </div>
  `,c.appendChild(u),document.body.appendChild(c);let d=()=>{c.remove(),document.removeEventListener("keydown",p)},p=r=>{r.key==="Escape"&&d()};document.addEventListener("keydown",p),u.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",d),c.addEventListener("click",r=>{r.target===c&&d()});let y=u.querySelector("#vaultx-place-step-container"),s=async()=>{try{let r=await chrome.runtime.sendMessage({action:"RESOLVE_PLACE",url:e});if(!r||!r.success||!r.data){y.innerHTML=`
          <div class="vaultx-modal-error">
            ${r?.error||"Could not resolve place details automatically."}
          </div>
          <div class="vaultx-modal-actions">
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-cancel">Cancel</button>
            <button type="button" class="vaultx-btn-primary" id="vaultx-place-retry">Retry</button>
          </div>
        `,y.querySelector("#vaultx-place-cancel")?.addEventListener("click",d),y.querySelector("#vaultx-place-retry")?.addEventListener("click",s);return}let M=r.data;f(M)}catch(r){y.innerHTML=`
        <div class="vaultx-modal-error">${r.message||"Error communicating with extension worker."}</div>
        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-close">Close</button>
        </div>
      `,y.querySelector("#vaultx-place-err-close")?.addEventListener("click",d)}},f=r=>{let M=r.photoUrl?`<img src="${r.photoUrl}" class="vaultx-place-preview-img" alt="${r.name}" onerror="this.style.display='none'" />`:'<div class="vaultx-place-preview-placeholder">\u{1F4CD}</div>',L=r.rating?`<span class="vaultx-place-tag vaultx-place-tag-rating">\u2B50 ${r.rating.toFixed(1)}${r.userRatingsTotal?` (${r.userRatingsTotal.toLocaleString()})`:""}</span>`:"",H=r.category?`<span class="vaultx-place-tag">${r.category}</span>`:"";y.innerHTML=`
      <form id="vaultx-save-place-form">
        <div class="vaultx-place-preview-card">
          ${M}
          <div class="vaultx-place-preview-meta">
            <div class="vaultx-place-preview-title" title="${r.name}">${r.name}</div>
            <div class="vaultx-place-preview-address" title="${r.address||""}">${r.address||"Address not specified"}</div>
            <div class="vaultx-place-preview-tags">
              ${H}
              ${L}
            </div>
          </div>
        </div>

        <div id="vaultx-place-form-error"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Status</label>
          <select id="vaultx-place-status" class="vaultx-input" style="cursor:pointer;">
            <option value="WANT_TO_VISIT" selected>\u{1F4CC} Want to Visit</option>
            <option value="PLANNED">\u{1F5D3}\uFE0F Planned</option>
            <option value="UPCOMING">\u23F0 Upcoming</option>
            <option value="VISITED">\u2705 Visited</option>
          </select>
        </div>

        <div style="margin-bottom:12px; display:flex; align-items:center; gap:8px;">
          <input type="checkbox" id="vaultx-place-favorite" style="cursor:pointer; accent-color:#8b5cf6;" />
          <label for="vaultx-place-favorite" style="font-size:12.5px; color:#f1f5f9; cursor:pointer; user-select:none; font-weight:500;">
            \u2B50 Mark as Favorite
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
    `;let v=y.querySelector("#vaultx-save-place-form"),l=y.querySelector("#vaultx-place-status"),n=y.querySelector("#vaultx-place-favorite"),i=y.querySelector("#vaultx-place-reminder-preset"),a=y.querySelector("#vaultx-custom-reminder-wrap"),m=y.querySelector("#vaultx-place-custom-date"),g=y.querySelector("#vaultx-place-notes"),h=y.querySelector("#vaultx-place-submit-btn"),b=y.querySelector("#vaultx-place-form-error");i.addEventListener("change",()=>{if(i.value==="CUSTOM"){a.style.display="block";let S=new Date(Date.now()+1440*60*1e3);S.setHours(10,0,0,0),m.value=S.toISOString().slice(0,16)}else a.style.display="none"}),y.querySelector("#vaultx-place-cancel-btn")?.addEventListener("click",d),v.addEventListener("submit",async S=>{S.preventDefault(),h.disabled=!0,h.textContent="Saving Place...",b.innerHTML="";let x=[];n?.checked&&x.push("Favorite");let w,E=new Date;if(i.value==="1_DAY")w=new Date(E.getTime()+1440*60*1e3).toISOString();else if(i.value==="1_WEEK")w=new Date(E.getTime()+10080*60*1e3).toISOString();else if(i.value==="1_MONTH")w=new Date(E.getTime()+720*60*60*1e3).toISOString();else if(i.value==="CUSTOM"&&m.value)try{let T=new Date(m.value);isNaN(T.getTime())||(w=T.toISOString())}catch{}let _={googleMapsUrl:r.googleMapsUrl||e,name:r.name,address:r.address,placeId:r.placeId,latitude:r.latitude,longitude:r.longitude,category:r.category,rating:r.rating,userRatingsTotal:r.userRatingsTotal,imageUrl:r.photoUrl||r.imageUrl,photoUrl:r.photoUrl||r.imageUrl,photoAttributions:r.photoAttributions,status:l.value,tags:x,notes:g.value.trim()||void 0,reminderDate:w};try{let T=await chrome.runtime.sendMessage({action:"SAVE_PLACE",data:_});T&&T.success?(d(),C({title:r.name||"Place Saved",store:"Places & Plans",imageUrl:r.photoUrl||void 0,message:"\u2713 Saved to Places & Plans!",url:`${t}/places`,isError:!1})):(h.disabled=!1,h.textContent="Save Place \u2192",b.innerHTML=`<div class="vaultx-modal-error">${T?.error||"Failed to save place."}</div>`)}catch(T){h.disabled=!1,h.textContent="Save Place \u2192",b.innerHTML=`<div class="vaultx-modal-error">${T.message||"Communication error."}</div>`}})};s()}function Q(e,t,o="https://digital-media-vault.vercel.app"){let c=document.getElementById(D);c&&c.remove();let u=document.createElement("div");u.id=D,u.className="vaultx-modal-backdrop";let d=document.createElement("div");d.className="vaultx-modal",d.innerHTML=`
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
          <div class="vaultx-modal-link-title" title="${t||e}">${t||e}</div>
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
  `,u.appendChild(d),document.body.appendChild(u);let p=()=>{u.remove(),document.removeEventListener("keydown",y)},y=n=>{n.key==="Escape"&&p()};document.addEventListener("keydown",y),d.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",p),u.addEventListener("click",n=>{n.target===u&&p()});let s=d.querySelector("#vaultx-dynamic-step-container"),f=(n,i=!0)=>{s.innerHTML=`
      <div class="vaultx-modal-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${n}</span>
      </div>
      <div class="vaultx-modal-actions">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-err-cancel">Cancel</button>
        ${i?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>':""}
      </div>
    `,s.querySelector("#vaultx-err-cancel")?.addEventListener("click",p),s.querySelector("#vaultx-err-retry")?.addEventListener("click",l)},r=n=>{s.innerHTML=`
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:13.5px; font-weight:700; color:#f1f5f9; margin-bottom:4px;">
          Authorize Secret Vault
        </div>
        <div style="font-size:11.5px; color:#94a3b8; line-height:1.4;">
          Please authorize your VaultXMedia account to access and save into your Secret Vault folders.
        </div>
      </div>

      <div id="vaultx-auth-error-box">
        ${n?`<div class="vaultx-modal-error">${n}</div>`:""}
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
    `;let i=s.querySelector("#vaultx-auth-error-box"),a=s.querySelector("#vaultx-auth-autosync"),m=s.querySelector("#vaultx-inline-login-form"),g=s.querySelector("#vaultx-auth-id"),h=s.querySelector("#vaultx-auth-pw"),b=s.querySelector("#vaultx-auth-submit");s.querySelector("#vaultx-auth-cancel")?.addEventListener("click",p),a.addEventListener("click",async()=>{a.disabled=!0,a.innerHTML="<span>Detecting browser session...</span>",i.innerHTML="";try{let S=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});S&&S.success?l():(a.disabled=!1,a.innerHTML="<span>Auto-Detect Active Web Session</span>",i.innerHTML='<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>',g.focus())}catch(S){a.disabled=!1,a.innerHTML="<span>Auto-Detect Active Web Session</span>",i.innerHTML=`<div class="vaultx-modal-error">${S.message||"Auto-detection failed."}</div>`}}),m.addEventListener("submit",async S=>{S.preventDefault();let x=g.value.trim(),w=h.value;if(!(!x||!w)){b.disabled=!0,b.textContent="Authorizing...",i.innerHTML="";try{let E=await chrome.runtime.sendMessage({action:"LOGIN",identifier:x,password:w});E&&E.success?l():(b.disabled=!1,b.textContent="Authorize & Unlock \u2192",i.innerHTML=`<div class="vaultx-modal-error">${E?.error||"Invalid credentials."}</div>`)}catch(E){b.disabled=!1,b.textContent="Authorize & Unlock \u2192",i.innerHTML=`<div class="vaultx-modal-error">${E.message||"Authorization failed."}</div>`}}})},M=()=>{s.innerHTML=`
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
    `;let n=s.querySelector("#vaultx-2fa-form"),i=s.querySelector("#vaultx-totp-input"),a=s.querySelector("#vaultx-2fa-submit"),m=s.querySelector("#vaultx-2fa-error-box");setTimeout(()=>i?.focus(),80),s.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",p),n.addEventListener("submit",async g=>{g.preventDefault();let h=i.value.trim();if(h.length!==6){m.innerHTML='<div class="vaultx-modal-error">Please enter all 6 digits.</div>';return}a.disabled=!0,a.textContent="Verifying...";try{let b=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:h});b&&b.success?L():(a.disabled=!1,a.textContent="Unlock Vault \u2192",m.innerHTML=`<div class="vaultx-modal-error">${b?.error||"Invalid 6-digit code. Please check your app."}</div>`,i.value="",i.focus())}catch(b){a.disabled=!1,a.textContent="Unlock Vault \u2192",m.innerHTML=`<div class="vaultx-modal-error">${b.message||"Error communicating with extension."}</div>`}})},L=async()=>{s.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let n=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!n||!n.success){n?.needAuth?r(n.error):f(n?.error||"Failed to fetch vault folders.");return}let i=n.data||[];if(i.length===0){H();return}s.innerHTML=`
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${i.map(a=>`
                <div class="vaultx-folder-item" data-folder-id="${a.id}" data-folder-name="${a.name}" data-folder-color="${a.color||"#3b82f6"}">
                  <div class="vaultx-folder-left">
                    <div class="vaultx-folder-dot" style="background-color: ${a.color||"#3b82f6"};"></div>
                    <span class="vaultx-folder-name">${a.name}</span>
                  </div>
                  <span class="vaultx-folder-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>${a.cellCount||0} links</span>
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
      `,s.querySelector("#vaultx-step2-cancel")?.addEventListener("click",p),s.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",H),s.querySelectorAll(".vaultx-folder-item").forEach(a=>{a.addEventListener("click",()=>{let m=a.getAttribute("data-folder-id"),g=a.getAttribute("data-folder-name"),h=a.getAttribute("data-folder-color");v(m,g,h)})})}catch(n){f(n.message||"Could not load folders.")}},H=()=>{s.innerHTML=`
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
    `,s.querySelector("#vaultx-create-folder-back")?.addEventListener("click",L);let n=s.querySelector("#vaultx-create-folder-form"),i=s.querySelector("#vaultx-new-folder-name"),a=s.querySelector("#vaultx-new-folder-pw"),m=s.querySelector("#vaultx-create-folder-submit"),g=s.querySelector("#vaultx-create-folder-error");setTimeout(()=>i?.focus(),80),n.addEventListener("submit",async h=>{h.preventDefault();let b=i.value.trim(),S=a.value.trim();if(!b||S.length<4){g.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}m.disabled=!0,m.textContent="Creating...";try{let x=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:b,password:S,color:"#6366f1"}});x&&x.success&&x.data?v(x.data.id,x.data.name,x.data.color||"#6366f1",S):(m.disabled=!1,m.textContent="Create & Continue \u2192",g.innerHTML=`<div class="vaultx-modal-error">${x?.error||"Failed to create folder."}</div>`)}catch(x){m.disabled=!1,m.textContent="Create & Continue \u2192",g.innerHTML=`<div class="vaultx-modal-error">${x.message||"Error creating folder."}</div>`}})},v=(n,i,a,m="")=>{s.innerHTML=`
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Indicator -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${a};"></div>
          <span style="font-size:12px; font-weight:700; color:#f1f5f9;">Destination: ${i}</span>
        </div>

        <div id="vaultx-save-error-box"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Folder Password</label>
          <input
            type="password"
            id="vaultx-folder-pw-input"
            class="vaultx-input"
            placeholder="Enter password for ${i}..."
            value="${m}"
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
            value="${t.replace(/"/g,"&quot;")}"
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
    `;let g=s.querySelector("#vaultx-save-cell-form"),h=s.querySelector("#vaultx-folder-pw-input"),b=s.querySelector("#vaultx-cell-title-input"),S=s.querySelector("#vaultx-cell-notes-input"),x=s.querySelector("#vaultx-save-submit"),w=s.querySelector("#vaultx-save-error-box");setTimeout(()=>{m?b?.focus():h?.focus()},80),s.querySelector("#vaultx-save-back")?.addEventListener("click",L),g.addEventListener("submit",async E=>{E.preventDefault();let _=h.value.trim(),T=b.value.trim()||t||e,X=S.value.trim()||void 0;if(!_){w.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}x.disabled=!0,x.textContent="Verifying Password...";try{let I=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:n,password:_});if(!I||!I.success){x.disabled=!1,x.textContent="Unlock & Save Link",w.innerHTML=`<div class="vaultx-modal-error">${I?.error||"Incorrect folder password."}</div>`,h.focus();return}x.textContent="Saving Link...";let B=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:n,data:{url:e,title:T,notes:X}});B&&B.success?(p(),C({title:T,message:`\u2713 Saved in Secret Vault / ${i}`,url:`${o}/vault`,isError:!1})):(x.disabled=!1,x.textContent="Unlock & Save Link",w.innerHTML=`<div class="vaultx-modal-error">${B?.error||"Failed to save link in folder."}</div>`)}catch(I){x.disabled=!1,x.textContent="Unlock & Save Link",w.innerHTML=`<div class="vaultx-modal-error">${I.message||"Error saving link."}</div>`}})},l=async()=>{try{let n=await chrome.runtime.sendMessage({action:"CHECK_AUTH"});if(!n||!n.isAuthenticated){let a=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});if(!a||!a.success){r();return}}let i=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!i||!i.success){i?.needAuth?r(i.error):f(i?.error||"Failed to connect to Secret Vault.");return}i.data?.enabled?M():L()}catch(n){f(n.message||"Failed to connect to extension.")}};l()}chrome.runtime.onMessage.addListener((e,t,o)=>{if(e.action==="EXTRACT_PAGE_PRODUCT"){try{let c=W();o({success:!0,data:c})}catch(c){o({success:!1,error:c.message})}return!0}else e.action==="SHOW_TOAST"?C(e):e.action==="OPEN_VAULT_SAVE_MODAL"?Q(e.url||window.location.href,e.title||document.title,e.webUrl):e.action==="OPEN_PLACE_SAVE_MODAL"&&G(e.url||window.location.href)});function V(){if(R()){let e=document.getElementById($);e&&e.remove();let t=document.getElementById(q);t&&t.remove(),J()}else if(j()){let e=document.getElementById($);e&&e.remove();let t=document.getElementById(A);t&&t.remove(),K()}else if(z()){let e=document.getElementById(q);e&&e.remove();let t=document.getElementById(A);t&&t.remove(),Y()}else{let e=document.getElementById($);e&&e.remove();let t=document.getElementById(q);t&&t.remove();let o=document.getElementById(A);o&&o.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",V):V();var O=location.href;new MutationObserver(()=>{let e=location.href;e!==O&&(O=e,setTimeout(V,1e3))}).observe(document,{subtree:!0,childList:!0});})();

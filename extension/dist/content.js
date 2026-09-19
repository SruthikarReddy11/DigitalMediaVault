"use strict";(()=>{var I="vaultxmedia-floating-save-btn",k="vaultxmedia-floating-yt-btn",q="vaultxmedia-floating-maps-btn",U="vaultxmedia-save-toast",D="vaultxmedia-secret-modal",F="vaultxmedia-place-modal";function z(){let e=window.location.href.toLowerCase(),n=window.location.hostname.toLowerCase();return n.includes("youtube.com")||n.includes("youtu.be")||n.includes("vimeo.com")||n.includes("dailymotion.com")?!1:n.includes("amazon.")?e.includes("/dp/")||e.includes("/gp/product/")||e.includes("/d/"):n.includes("flipkart.com")?e.includes("/p/")||e.includes("pid="):n.includes("myntra.com")?/\/\d+\/buy/.test(e)||e.includes("/buy"):n.includes("ajio.com")?e.includes("/p/"):n.includes("meesho.com")?e.includes("/s/p/")||e.includes("/p/"):n.includes("nykaa.com")?e.includes("/p/"):n.includes("tatacliq.com")?e.includes("/p-"):n.includes("croma.com")||n.includes("reliancedigital.in")?e.includes("/p/"):!1}function j(){let e=window.location.hostname.toLowerCase(),n=window.location.href.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")?n.includes("/watch")||n.includes("/shorts/")||n.includes("/live/")||n.includes("/embed/")||n.includes("/clip/")||e.includes("youtu.be"):!1}function R(){let e=window.location.hostname.toLowerCase(),n=window.location.href.toLowerCase();return!!(e.includes("maps.google.")||e.includes("maps.app.goo.gl")||e.includes("google.")&&(n.includes("/maps")||n.includes("/place/"))||e.includes("goo.gl")&&n.includes("/maps"))}function T(e){let n=document.getElementById(U);n&&n.remove();let o=document.createElement("div");o.id=U,o.className=`vaultx-toast ${e.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let c=e.price!==void 0&&e.price!==null?`${e.currencySymbol||"\u20B9"}${e.price.toLocaleString("en-IN")}`:"",u=e.imageUrl?`<img src="${e.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${e.isError?"\u2715":"\u2713"}</div>`;o.innerHTML=`
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
  `,o.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{o.classList.add("vaultx-toast-fadeout"),setTimeout(()=>o.remove(),300)}),document.body.appendChild(o),setTimeout(()=>{o.parentElement&&(o.classList.add("vaultx-toast-fadeout"),setTimeout(()=>o.remove(),300))},5e3)}var M=null;function _(e,n){M=n||M,e.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),e.classList.add("vaultx-already-saved"),e.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let o=e.querySelector(".vaultx-btn-icon"),c=e.querySelector(".vaultx-btn-text");o&&(o.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),c&&(c.textContent="Already in Wishlist")}async function O(e){try{let n=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});n&&n.exists&&_(e,n.product)}catch{}}function W(){let e=window.location.href,n=window.location.hostname.toLowerCase(),o="",c="",u,d,m="",b="General",s=!0,y="",r="INR",C="\u20B9";if(n.includes("amazon."))y="Amazon";else if(n.includes("flipkart.com"))y="Flipkart";else if(n.includes("myntra.com"))y="Myntra";else if(n.includes("ajio.com"))y="Ajio";else if(n.includes("meesho.com"))y="Meesho";else if(n.includes("nykaa.com"))y="Nykaa";else if(n.includes("tatacliq.com"))y="Tata CLiQ";else if(n.includes("croma.com"))y="Croma";else if(n.includes("reliancedigital.in"))y="Reliance Digital";else{let v=n.replace(/^www\./,"").split(".")[0];y=v.charAt(0).toUpperCase()+v.slice(1)||"Other"}let S=v=>{if(typeof v=="number"&&!isNaN(v))return v;if(!v||typeof v!="string")return;let l=v.replace(/[^\d.]/g,"").trim(),t=parseFloat(l);return isNaN(t)||t<=0?void 0:t};if(document.querySelectorAll('script[type="application/ld+json"]').forEach(v=>{try{let l=v.textContent;if(!l)return;let t=JSON.parse(l),i=Array.isArray(t)?t:t["@graph"]?t["@graph"]:[t];for(let a of i)if(a["@type"]==="Product"||a["@type"]==="IndividualProduct"||a["@type"]==="ProductModel"){if(!o&&a.name&&(o=String(a.name).trim()),c||(typeof a.brand=="string"?c=a.brand.trim():a.brand?.name&&(c=String(a.brand.name).trim())),!m)if(typeof a.image=="string")m=a.image;else if(Array.isArray(a.image)&&a.image.length>0){let x=a.image[0];m=typeof x=="string"?x:x?.url||""}else a.image?.url&&(m=a.image.url);let p=Array.isArray(a.offers)?a.offers[0]:a.offers;if(p){if(u===void 0){let x=S(p.price||p.lowPrice);x&&(u=x)}p.priceCurrency&&(r=p.priceCurrency,C=r==="INR"?"\u20B9":r==="USD"?"$":r),p.availability&&(s=!String(p.availability).toLowerCase().includes("outofstock"))}}}catch{}}),y==="Ajio"){b="Fashion";let v=document.querySelector(".brand-name")?.textContent||document.querySelector("h2.brand-name")?.textContent||document.querySelector(".prod-brand")?.textContent;v&&v.trim()&&(c=v.trim());let l=document.querySelector(".prod-name")?.textContent||document.querySelector("h1.prod-title")?.textContent;if(l&&l.trim()&&(o=c&&!l.trim().toLowerCase().startsWith(c.toLowerCase())?`${c} ${l.trim()}`:l.trim()),u===void 0){let t=document.querySelector(".prod-sp")?.textContent||document.querySelector(".price-value")?.textContent,i=S(t);i&&(u=i)}if(d===void 0){let t=document.querySelector(".prod-cp")?.textContent||document.querySelector(".original-price")?.textContent,i=S(t);i&&(d=i)}if(!m){let t=Array.from(document.querySelectorAll("img")).filter(i=>{let a=i.getAttribute("src")||"";return a.includes("assets.ajio.com")&&(a.includes("medias")||a.includes("root")||a.includes("images"))});t.length>0&&(m=t[0].src||t[0].getAttribute("src")||"")}}else if(y==="Myntra"){b="Fashion";let v=document.querySelector(".pdp-title")?.textContent;v&&v.trim()&&(c=v.trim());let l=document.querySelector(".pdp-name")?.textContent;if(l&&l.trim()&&(o=c&&!l.trim().toLowerCase().startsWith(c.toLowerCase())?`${c} ${l.trim()}`:l.trim()),u===void 0){let t=S(document.querySelector(".pdp-price strong")?.textContent||document.querySelector(".pdp-price")?.textContent);t&&(u=t)}if(d===void 0){let t=S(document.querySelector(".pdp-mrp s")?.textContent||document.querySelector(".pdp-mrp")?.textContent);t&&(d=t)}if(!m){let t=document.querySelector(".image-grid-image")||document.querySelector('img[src*="assets.myntassets.com"]');t&&(m=t.src||t.getAttribute("src")||"")}}else if(y==="Flipkart"){let v=document.querySelector("span.B_NuCI")?.textContent||document.querySelector("h1.yhB1nd")?.textContent||document.querySelector("span._35KyD6")?.textContent;if(v&&v.trim()&&(o=v.trim()),u===void 0){let l=document.querySelector("div._30jeq3._16Jk6d")?.textContent||document.querySelector("div._30jeq3")?.textContent||document.querySelector("div.Nx9bqj.CxhGGd")?.textContent,t=S(l);t&&(u=t)}if(d===void 0){let l=document.querySelector("div._3I9_wc._2p6lqe")?.textContent||document.querySelector("div._3I9_wc")?.textContent||document.querySelector("div.yRaY8j.A68aAq")?.textContent,t=S(l);t&&(d=t)}if(!m){let l=document.querySelector("img._396cs4")||document.querySelector("img.DByuf4")||document.querySelector("img._2r_T1I");l&&(m=l.src||l.getAttribute("src")||"")}}else if(y==="Amazon"){let v=document.querySelector("#productTitle")?.textContent||document.querySelector("span#title")?.textContent;if(v&&v.trim()&&(o=v.trim()),u===void 0){let l=document.querySelector(".a-price .a-offscreen")?.textContent||document.querySelector("#priceblock_ourprice")?.textContent||document.querySelector("#corePrice_desktop .a-offscreen")?.textContent,t=S(l);t&&(u=t)}if(d===void 0){let l=document.querySelector(".a-text-price span.a-offscreen")?.textContent||document.querySelector("#listPrice")?.textContent,t=S(l);t&&(d=t)}if(!m){let l=document.querySelector("#landingImage")||document.querySelector("#imgBlkFront");l&&(m=l.src||l.getAttribute("data-old-hires")||l.getAttribute("src")||"")}}if(o||(o=document.querySelector('meta[property="og:title"]')?.content||document.querySelector('meta[name="twitter:title"]')?.content||document.title||""),m||(m=document.querySelector('meta[property="og:image"]')?.content||document.querySelector('meta[property="og:image:secure_url"]')?.content||document.querySelector('meta[name="twitter:image"]')?.content||""),y==="Ajio"&&(!o||o.toLowerCase().includes("access denied")))try{let l=new URL(e).pathname.match(/\/([^/]+)\/p\/([^/?#]+)/i);if(l&&l[1]){let t=l[1].split("-").filter(Boolean);if(t.length>0){let i=t.map(a=>a.charAt(0).toUpperCase()+a.slice(1));c=c||i[0],o=i.join(" ")}}}catch{}return o=o.replace(/\s*\|\s*Flipkart\.com$/i,"").replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i,"").replace(/\s*:\s*Amazon\.in:.*$/i,"").replace(/\s*Buy Online at Ajio\.com$/i,"").replace(/\s*-\s*Ajio$/i,"").replace(/\s*Buy.*Online at Myntra$/i,"").replace(/\s*\|\s*Myntra$/i,"").trim(),(!o||o.toLowerCase().includes("access denied"))&&(o=`Product from ${y}`),{url:e,title:o,brand:c||void 0,store:y,category:b,price:u,originalPrice:d,currency:r,currencySymbol:C,imageUrl:m||void 0,inStock:s}}function Y(){let e=document.getElementById(I);if(e){O(e);return}z()&&(e=document.createElement("button"),e.id=I,e.className="vaultx-floating-btn",e.setAttribute("type","button"),e.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,O(e),e.addEventListener("click",async n=>{if(n.preventDefault(),n.stopPropagation(),e.classList.contains("vaultx-loading"))return;if(e.classList.contains("vaultx-already-saved")){T({title:M?.title||"Product in Wishlist",store:M?.store,price:M?.price??void 0,currencySymbol:M?.currencySymbol,imageUrl:M?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}e.classList.add("vaultx-loading");let o=e.querySelector(".vaultx-btn-text"),c=o.textContent;o.textContent="Saving...";let u=W();try{let d=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href,title:u?.title||document.title,productData:u});e.classList.remove("vaultx-loading"),d&&d.success?(M=d.product,!!d.alreadyExists?(_(e,d.product),T({title:d.product?.title||"Product in Wishlist",store:d.product?.store,price:d.product?.price??void 0,currencySymbol:d.product?.currencySymbol,imageUrl:d.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(e.classList.add("vaultx-saved"),o.textContent="\u2713 Saved to Vault!",setTimeout(()=>{_(e,d.product)},2500))):(e.classList.add("vaultx-error"),o.textContent="Failed",T({title:"Failed to Save",message:d?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500))}catch(d){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),o.textContent="Failed",T({title:"Failed to Save",message:d.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500)}}),document.body.appendChild(e))}function K(){if(!j()){let n=document.getElementById(k);n&&n.remove();return}let e=document.getElementById(k);e||(e=document.createElement("button"),e.id=k,e.className="vaultx-floating-btn vaultx-youtube-btn",e.setAttribute("type","button"),e.setAttribute("title","Save YouTube video to Vault Theater & Videos"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,e.addEventListener("click",async n=>{if(n.preventDefault(),n.stopPropagation(),e.classList.contains("vaultx-loading"))return;e.classList.add("vaultx-loading");let o=e.querySelector(".vaultx-btn-text"),c=o.textContent;o.textContent="Saving Video...";try{let u=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});e.classList.remove("vaultx-loading"),u&&u.success?(e.classList.add("vaultx-saved"),o.textContent="\u2713 Saved to Videos!",setTimeout(()=>{e.classList.remove("vaultx-saved"),o.textContent=c},3e3)):(e.classList.add("vaultx-error"),o.textContent="Failed",T({title:"Failed to Save Video",message:u?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500))}catch(u){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),o.textContent="Failed",T({title:"Failed to Save Video",message:u.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),o.textContent=c},3500)}}),document.body.appendChild(e))}function J(){if(!R()){let n=document.getElementById(q);n&&n.remove();return}let e=document.getElementById(q);e||(e=document.createElement("button"),e.id=q,e.className="vaultx-floating-btn vaultx-maps-btn",e.setAttribute("type","button"),e.setAttribute("title","Save place to VaultXMedia Places & Plans"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save Place</span>
  `,e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),G(window.location.href)}),document.body.appendChild(e))}function G(e=window.location.href,n="https://digital-media-vault.vercel.app"){let o=document.getElementById(F);o&&o.remove();let c=document.createElement("div");c.id=F,c.className="vaultx-modal-backdrop";let u=document.createElement("div");u.className="vaultx-modal",u.innerHTML=`
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
  `,c.appendChild(u),document.body.appendChild(c);let d=()=>{c.remove(),document.removeEventListener("keydown",m)},m=r=>{r.key==="Escape"&&d()};document.addEventListener("keydown",m),u.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",d),c.addEventListener("click",r=>{r.target===c&&d()});let b=u.querySelector("#vaultx-place-step-container"),s=async()=>{try{let r=await chrome.runtime.sendMessage({action:"RESOLVE_PLACE",url:e});if(!r||!r.success||!r.data){b.innerHTML=`
          <div class="vaultx-modal-error">
            ${r?.error||"Could not resolve place details automatically."}
          </div>
          <div class="vaultx-modal-actions">
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-cancel">Cancel</button>
            <button type="button" class="vaultx-btn-primary" id="vaultx-place-retry">Retry</button>
          </div>
        `,b.querySelector("#vaultx-place-cancel")?.addEventListener("click",d),b.querySelector("#vaultx-place-retry")?.addEventListener("click",s);return}let C=r.data;y(C)}catch(r){b.innerHTML=`
        <div class="vaultx-modal-error">${r.message||"Error communicating with extension worker."}</div>
        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-close">Close</button>
        </div>
      `,b.querySelector("#vaultx-place-err-close")?.addEventListener("click",d)}},y=r=>{let C=r.photoUrl?`<img src="${r.photoUrl}" class="vaultx-place-preview-img" alt="${r.name}" onerror="this.style.display='none'" />`:'<div class="vaultx-place-preview-placeholder">\u{1F4CD}</div>',S=r.rating?`<span class="vaultx-place-tag vaultx-place-tag-rating">\u2B50 ${r.rating.toFixed(1)}${r.userRatingsTotal?` (${r.userRatingsTotal.toLocaleString()})`:""}</span>`:"",A=r.category?`<span class="vaultx-place-tag">${r.category}</span>`:"";b.innerHTML=`
      <form id="vaultx-save-place-form">
        <div class="vaultx-place-preview-card">
          ${C}
          <div class="vaultx-place-preview-meta">
            <div class="vaultx-place-preview-title" title="${r.name}">${r.name}</div>
            <div class="vaultx-place-preview-address" title="${r.address||""}">${r.address||"Address not specified"}</div>
            <div class="vaultx-place-preview-tags">
              ${A}
              ${S}
            </div>
          </div>
        </div>

        <div id="vaultx-place-form-error"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Status</label>
          <select id="vaultx-place-status" class="vaultx-input" style="cursor:pointer;">
            <option value="WANT_TO_VISIT" selected>\u{1F4CC} Want to Visit</option>
            <option value="PLANNED">\u{1F5D3}\uFE0F Planned</option>
            <option value="VISITED">\u2705 Visited</option>
            <option value="FAVORITE">\u2B50 Favorite</option>
          </select>
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
    `;let v=b.querySelector("#vaultx-save-place-form"),l=b.querySelector("#vaultx-place-status"),t=b.querySelector("#vaultx-place-reminder-preset"),i=b.querySelector("#vaultx-custom-reminder-wrap"),a=b.querySelector("#vaultx-place-custom-date"),p=b.querySelector("#vaultx-place-notes"),x=b.querySelector("#vaultx-place-submit-btn"),L=b.querySelector("#vaultx-place-form-error");t.addEventListener("change",()=>{if(t.value==="CUSTOM"){i.style.display="block";let g=new Date(Date.now()+1440*60*1e3);g.setHours(10,0,0,0),a.value=g.toISOString().slice(0,16)}else i.style.display="none"}),b.querySelector("#vaultx-place-cancel-btn")?.addEventListener("click",d),v.addEventListener("submit",async g=>{g.preventDefault(),x.disabled=!0,x.textContent="Saving Place...",L.innerHTML="";let h,f=new Date;t.value==="1_DAY"?h=new Date(f.getTime()+1440*60*1e3).toISOString():t.value==="1_WEEK"?h=new Date(f.getTime()+10080*60*1e3).toISOString():t.value==="1_MONTH"?h=new Date(f.getTime()+720*60*60*1e3).toISOString():t.value==="CUSTOM"&&a.value&&(h=new Date(a.value).toISOString());let E={googleMapsUrl:r.googleMapsUrl||e,name:r.name,address:r.address,placeId:r.placeId,latitude:r.latitude,longitude:r.longitude,category:r.category,rating:r.rating,userRatingsTotal:r.userRatingsTotal,photoUrl:r.photoUrl,photoAttributions:r.photoAttributions,status:l.value,notes:p.value.trim()||void 0,reminderDate:h};try{let w=await chrome.runtime.sendMessage({action:"SAVE_PLACE",data:E});w&&w.success?(d(),T({title:r.name||"Place Saved",store:"Places & Plans",imageUrl:r.photoUrl||void 0,message:"\u2713 Saved to Places & Plans!",url:`${n}/places`,isError:!1})):(x.disabled=!1,x.textContent="Save Place \u2192",L.innerHTML=`<div class="vaultx-modal-error">${w?.error||"Failed to save place."}</div>`)}catch(w){x.disabled=!1,x.textContent="Save Place \u2192",L.innerHTML=`<div class="vaultx-modal-error">${w.message||"Communication error."}</div>`}})};s()}function Q(e,n,o="https://digital-media-vault.vercel.app"){let c=document.getElementById(D);c&&c.remove();let u=document.createElement("div");u.id=D,u.className="vaultx-modal-backdrop";let d=document.createElement("div");d.className="vaultx-modal",d.innerHTML=`
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
          <div class="vaultx-modal-link-title" title="${n||e}">${n||e}</div>
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
  `,u.appendChild(d),document.body.appendChild(u);let m=()=>{u.remove(),document.removeEventListener("keydown",b)},b=t=>{t.key==="Escape"&&m()};document.addEventListener("keydown",b),d.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",m),u.addEventListener("click",t=>{t.target===u&&m()});let s=d.querySelector("#vaultx-dynamic-step-container"),y=(t,i=!0)=>{s.innerHTML=`
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
        ${i?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>':""}
      </div>
    `,s.querySelector("#vaultx-err-cancel")?.addEventListener("click",m),s.querySelector("#vaultx-err-retry")?.addEventListener("click",l)},r=t=>{s.innerHTML=`
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
    `;let i=s.querySelector("#vaultx-auth-error-box"),a=s.querySelector("#vaultx-auth-autosync"),p=s.querySelector("#vaultx-inline-login-form"),x=s.querySelector("#vaultx-auth-id"),L=s.querySelector("#vaultx-auth-pw"),g=s.querySelector("#vaultx-auth-submit");s.querySelector("#vaultx-auth-cancel")?.addEventListener("click",m),a.addEventListener("click",async()=>{a.disabled=!0,a.innerHTML="<span>Detecting browser session...</span>",i.innerHTML="";try{let h=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});h&&h.success?l():(a.disabled=!1,a.innerHTML="<span>Auto-Detect Active Web Session</span>",i.innerHTML='<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>',x.focus())}catch(h){a.disabled=!1,a.innerHTML="<span>Auto-Detect Active Web Session</span>",i.innerHTML=`<div class="vaultx-modal-error">${h.message||"Auto-detection failed."}</div>`}}),p.addEventListener("submit",async h=>{h.preventDefault();let f=x.value.trim(),E=L.value;if(!(!f||!E)){g.disabled=!0,g.textContent="Authorizing...",i.innerHTML="";try{let w=await chrome.runtime.sendMessage({action:"LOGIN",identifier:f,password:E});w&&w.success?l():(g.disabled=!1,g.textContent="Authorize & Unlock \u2192",i.innerHTML=`<div class="vaultx-modal-error">${w?.error||"Invalid credentials."}</div>`)}catch(w){g.disabled=!1,g.textContent="Authorize & Unlock \u2192",i.innerHTML=`<div class="vaultx-modal-error">${w.message||"Authorization failed."}</div>`}}})},C=()=>{s.innerHTML=`
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
    `;let t=s.querySelector("#vaultx-2fa-form"),i=s.querySelector("#vaultx-totp-input"),a=s.querySelector("#vaultx-2fa-submit"),p=s.querySelector("#vaultx-2fa-error-box");setTimeout(()=>i?.focus(),80),s.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",m),t.addEventListener("submit",async x=>{x.preventDefault();let L=i.value.trim();if(L.length!==6){p.innerHTML='<div class="vaultx-modal-error">Please enter all 6 digits.</div>';return}a.disabled=!0,a.textContent="Verifying...";try{let g=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:L});g&&g.success?S():(a.disabled=!1,a.textContent="Unlock Vault \u2192",p.innerHTML=`<div class="vaultx-modal-error">${g?.error||"Invalid 6-digit code. Please check your app."}</div>`,i.value="",i.focus())}catch(g){a.disabled=!1,a.textContent="Unlock Vault \u2192",p.innerHTML=`<div class="vaultx-modal-error">${g.message||"Error communicating with extension."}</div>`}})},S=async()=>{s.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let t=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!t||!t.success){t?.needAuth?r(t.error):y(t?.error||"Failed to fetch vault folders.");return}let i=t.data||[];if(i.length===0){A();return}s.innerHTML=`
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
      `,s.querySelector("#vaultx-step2-cancel")?.addEventListener("click",m),s.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",A),s.querySelectorAll(".vaultx-folder-item").forEach(a=>{a.addEventListener("click",()=>{let p=a.getAttribute("data-folder-id"),x=a.getAttribute("data-folder-name"),L=a.getAttribute("data-folder-color");v(p,x,L)})})}catch(t){y(t.message||"Could not load folders.")}},A=()=>{s.innerHTML=`
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
    `,s.querySelector("#vaultx-create-folder-back")?.addEventListener("click",S);let t=s.querySelector("#vaultx-create-folder-form"),i=s.querySelector("#vaultx-new-folder-name"),a=s.querySelector("#vaultx-new-folder-pw"),p=s.querySelector("#vaultx-create-folder-submit"),x=s.querySelector("#vaultx-create-folder-error");setTimeout(()=>i?.focus(),80),t.addEventListener("submit",async L=>{L.preventDefault();let g=i.value.trim(),h=a.value.trim();if(!g||h.length<4){x.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}p.disabled=!0,p.textContent="Creating...";try{let f=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:g,password:h,color:"#6366f1"}});f&&f.success&&f.data?v(f.data.id,f.data.name,f.data.color||"#6366f1",h):(p.disabled=!1,p.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${f?.error||"Failed to create folder."}</div>`)}catch(f){p.disabled=!1,p.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${f.message||"Error creating folder."}</div>`}})},v=(t,i,a,p="")=>{s.innerHTML=`
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
            value="${p}"
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
            value="${n.replace(/"/g,"&quot;")}"
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
    `;let x=s.querySelector("#vaultx-save-cell-form"),L=s.querySelector("#vaultx-folder-pw-input"),g=s.querySelector("#vaultx-cell-title-input"),h=s.querySelector("#vaultx-cell-notes-input"),f=s.querySelector("#vaultx-save-submit"),E=s.querySelector("#vaultx-save-error-box");setTimeout(()=>{p?g?.focus():L?.focus()},80),s.querySelector("#vaultx-save-back")?.addEventListener("click",S),x.addEventListener("submit",async w=>{w.preventDefault();let P=L.value.trim(),V=g.value.trim()||n||e,X=h.value.trim()||void 0;if(!P){E.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}f.disabled=!0,f.textContent="Verifying Password...";try{let H=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:t,password:P});if(!H||!H.success){f.disabled=!1,f.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${H?.error||"Incorrect folder password."}</div>`,L.focus();return}f.textContent="Saving Link...";let $=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:t,data:{url:e,title:V,notes:X}});$&&$.success?(m(),T({title:V,message:`\u2713 Saved in Secret Vault / ${i}`,url:`${o}/vault`,isError:!1})):(f.disabled=!1,f.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${$?.error||"Failed to save link in folder."}</div>`)}catch(H){f.disabled=!1,f.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${H.message||"Error saving link."}</div>`}})},l=async()=>{try{let t=await chrome.runtime.sendMessage({action:"CHECK_AUTH"});if(!t||!t.isAuthenticated){let a=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});if(!a||!a.success){r();return}}let i=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!i||!i.success){i?.needAuth?r(i.error):y(i?.error||"Failed to connect to Secret Vault.");return}i.data?.enabled?C():S()}catch(t){y(t.message||"Failed to connect to extension.")}};l()}chrome.runtime.onMessage.addListener((e,n,o)=>{if(e.action==="EXTRACT_PAGE_PRODUCT"){try{let c=W();o({success:!0,data:c})}catch(c){o({success:!1,error:c.message})}return!0}else e.action==="SHOW_TOAST"?T(e):e.action==="OPEN_VAULT_SAVE_MODAL"?Q(e.url||window.location.href,e.title||document.title,e.webUrl):e.action==="OPEN_PLACE_SAVE_MODAL"&&G(e.url||window.location.href)});function B(){if(R()){let e=document.getElementById(I);e&&e.remove();let n=document.getElementById(k);n&&n.remove(),J()}else if(j()){let e=document.getElementById(I);e&&e.remove();let n=document.getElementById(q);n&&n.remove(),K()}else if(z()){let e=document.getElementById(k);e&&e.remove();let n=document.getElementById(q);n&&n.remove(),Y()}else{let e=document.getElementById(I);e&&e.remove();let n=document.getElementById(k);n&&n.remove();let o=document.getElementById(q);o&&o.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B();var N=location.href;new MutationObserver(()=>{let e=location.href;e!==N&&(N=e,setTimeout(B,1e3))}).observe(document,{subtree:!0,childList:!0});})();

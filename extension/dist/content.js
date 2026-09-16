"use strict";(()=>{var u="vaultxmedia-floating-save-btn",c="vaultxmedia-save-toast";function m(){let t=window.location.href.toLowerCase(),r=window.location.hostname.toLowerCase();if(r.includes("amazon."))return t.includes("/dp/")||t.includes("/gp/product/")||t.includes("/d/");if(r.includes("flipkart.com"))return t.includes("/p/")||t.includes("pid=");if(r.includes("myntra.com"))return/\/\d+\/buy/.test(t)||t.includes("/buy");if(r.includes("ajio.com"))return t.includes("/p/");if(r.includes("meesho.com"))return t.includes("/s/p/")||t.includes("/p/");if(r.includes("nykaa.com"))return t.includes("/p/");if(r.includes("tatacliq.com"))return t.includes("/p-");if(r.includes("croma.com")||r.includes("reliancedigital.in"))return t.includes("/p/");let e=document.querySelector('script[type="application/ld+json"]');return e&&e.textContent?.includes('"Product"'),!0}function n(t){let r=document.getElementById(c);r&&r.remove();let e=document.createElement("div");e.id=c,e.className=`vaultx-toast ${t.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let i=t.price!==void 0&&t.price!==null?`${t.currencySymbol||"\u20B9"}${t.price.toLocaleString("en-IN")}`:"",s=t.imageUrl?`<img src="${t.imageUrl}" class="vaultx-toast-img" alt="Product" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${t.isError?"\u2715":"\u2713"}</div>`;e.innerHTML=`
    <div class="vaultx-toast-content">
      ${s}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${t.store||"VaultXMedia"}</span>
          ${i?`<span class="vaultx-toast-price">${i}</span>`:""}
        </div>
        <div class="vaultx-toast-title" title="${t.title}">${t.title}</div>
        <div class="vaultx-toast-sub">${t.isError?t.message||"Error occurred":"\u2713 Saved to your Wishlist"}</div>
      </div>
      <button class="vaultx-toast-close" title="Dismiss">&times;</button>
    </div>
    ${t.url&&!t.isError?`<div class="vaultx-toast-action">
             <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="vaultx-toast-link">
               Open in VaultXMedia Wishlist &rarr;
             </a>
           </div>`:""}
  `,e.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{e.classList.add("vaultx-toast-fadeout"),setTimeout(()=>e.remove(),300)}),document.body.appendChild(e),setTimeout(()=>{e.parentElement&&(e.classList.add("vaultx-toast-fadeout"),setTimeout(()=>e.remove(),300))},5e3)}var a=null;function l(t,r){a=r||a,t.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),t.classList.add("vaultx-already-saved"),t.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let e=t.querySelector(".vaultx-btn-icon"),i=t.querySelector(".vaultx-btn-text");e&&(e.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),i&&(i.textContent="Already in Wishlist")}async function d(t){try{let r=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});r&&r.exists&&l(t,r.product)}catch{}}function o(){let t=document.getElementById(u);if(t){d(t);return}m()&&(t=document.createElement("button"),t.id=u,t.className="vaultx-floating-btn",t.setAttribute("type","button"),t.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,d(t),t.addEventListener("click",async r=>{if(r.preventDefault(),r.stopPropagation(),t.classList.contains("vaultx-loading"))return;if(t.classList.contains("vaultx-already-saved")){n({title:a?.title||"Product in Wishlist",store:a?.store,price:a?.price??void 0,currencySymbol:a?.currencySymbol,imageUrl:a?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1,alreadyExists:!0});return}t.classList.add("vaultx-loading");let e=t.querySelector(".vaultx-btn-text"),i=e.textContent;e.textContent="Saving...";try{let s=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href});t.classList.remove("vaultx-loading"),s&&s.success?(a=s.product,!!s.alreadyExists?(l(t,s.product),n({title:s.product?.title||"Product in Wishlist",store:s.product?.store,price:s.product?.price??void 0,currencySymbol:s.product?.currencySymbol,imageUrl:s.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1,alreadyExists:!0})):(t.classList.add("vaultx-saved"),e.textContent="\u2713 Saved to Vault!",setTimeout(()=>{l(t,s.product)},2500))):(t.classList.add("vaultx-error"),e.textContent="Failed",n({title:"Failed to Save",message:s?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),e.textContent=i},3500))}catch(s){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),e.textContent="Failed",n({title:"Failed to Save",message:s.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),e.textContent=i},3500)}}),document.body.appendChild(t))}chrome.runtime.onMessage.addListener(t=>{t.action==="SHOW_TOAST"&&n(t)});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o):o();var v=location.href;new MutationObserver(()=>{let t=location.href;t!==v&&(v=t,setTimeout(o,1e3))}).observe(document,{subtree:!0,childList:!0});})();

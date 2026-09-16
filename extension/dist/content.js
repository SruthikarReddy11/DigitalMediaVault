"use strict";(()=>{var i="vaultxmedia-floating-save-btn",l="vaultxmedia-save-toast";function c(){let t=window.location.href.toLowerCase(),a=window.location.hostname.toLowerCase();if(a.includes("amazon."))return t.includes("/dp/")||t.includes("/gp/product/")||t.includes("/d/");if(a.includes("flipkart.com"))return t.includes("/p/")||t.includes("pid=");if(a.includes("myntra.com"))return/\/\d+\/buy/.test(t)||t.includes("/buy");if(a.includes("ajio.com"))return t.includes("/p/");if(a.includes("meesho.com"))return t.includes("/s/p/")||t.includes("/p/");if(a.includes("nykaa.com"))return t.includes("/p/");if(a.includes("tatacliq.com"))return t.includes("/p-");if(a.includes("croma.com")||a.includes("reliancedigital.in"))return t.includes("/p/");let e=document.querySelector('script[type="application/ld+json"]');return e&&e.textContent?.includes('"Product"'),!0}function r(t){let a=document.getElementById(l);a&&a.remove();let e=document.createElement("div");e.id=l,e.className=`vaultx-toast ${t.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let s=t.price!==void 0&&t.price!==null?`${t.currencySymbol||"\u20B9"}${t.price.toLocaleString("en-IN")}`:"",u=t.imageUrl?`<img src="${t.imageUrl}" class="vaultx-toast-img" alt="Product" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${t.isError?"\u2715":"\u2713"}</div>`;e.innerHTML=`
    <div class="vaultx-toast-content">
      ${u}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${t.store||"VaultXMedia"}</span>
          ${s?`<span class="vaultx-toast-price">${s}</span>`:""}
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
  `,e.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{e.classList.add("vaultx-toast-fadeout"),setTimeout(()=>e.remove(),300)}),document.body.appendChild(e),setTimeout(()=>{e.parentElement&&(e.classList.add("vaultx-toast-fadeout"),setTimeout(()=>e.remove(),300))},5e3)}function n(){if(document.getElementById(i)||!c())return;let t=document.createElement("button");t.id=i,t.className="vaultx-floating-btn",t.setAttribute("type","button"),t.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,t.addEventListener("click",async a=>{if(a.preventDefault(),a.stopPropagation(),t.classList.contains("vaultx-loading"))return;t.classList.add("vaultx-loading");let e=t.querySelector(".vaultx-btn-text").textContent;t.querySelector(".vaultx-btn-text").textContent="Saving...";try{let s=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href});t.classList.remove("vaultx-loading"),s&&s.success?(t.classList.add("vaultx-saved"),t.querySelector(".vaultx-btn-text").textContent="\u2713 Saved to Vault!",setTimeout(()=>{t.classList.remove("vaultx-saved"),t.querySelector(".vaultx-btn-text").textContent=e},3500)):(t.classList.add("vaultx-error"),t.querySelector(".vaultx-btn-text").textContent="Failed",r({title:"Failed to Save",message:s?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),t.querySelector(".vaultx-btn-text").textContent=e},3500))}catch(s){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),t.querySelector(".vaultx-btn-text").textContent="Failed",r({title:"Failed to Save",message:s.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),t.querySelector(".vaultx-btn-text").textContent=e},3500)}}),document.body.appendChild(t)}chrome.runtime.onMessage.addListener(t=>{t.action==="SHOW_TOAST"&&r(t)});document.readyState==="loading"?document.addEventListener("DOMContentLoaded",n):n();var o=location.href;new MutationObserver(()=>{let t=location.href;t!==o&&(o=t,setTimeout(n,1e3))}).observe(document,{subtree:!0,childList:!0});})();

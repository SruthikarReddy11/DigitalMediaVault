"use strict";(()=>{var w="vaultxmedia-floating-save-btn",g="vaultxmedia-floating-yt-btn",q="vaultxmedia-save-toast",B="vaultxmedia-secret-modal";function F(){let t=window.location.href.toLowerCase(),e=window.location.hostname.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")||e.includes("vimeo.com")||e.includes("dailymotion.com")?!1:e.includes("amazon.")?t.includes("/dp/")||t.includes("/gp/product/")||t.includes("/d/"):e.includes("flipkart.com")?t.includes("/p/")||t.includes("pid="):e.includes("myntra.com")?/\/\d+\/buy/.test(t)||t.includes("/buy"):e.includes("ajio.com")?t.includes("/p/"):e.includes("meesho.com")?t.includes("/s/p/")||t.includes("/p/"):e.includes("nykaa.com")?t.includes("/p/"):e.includes("tatacliq.com")?t.includes("/p-"):e.includes("croma.com")||e.includes("reliancedigital.in")?t.includes("/p/"):!1}function U(){let t=window.location.hostname.toLowerCase(),e=window.location.href.toLowerCase();return t.includes("youtube.com")||t.includes("youtu.be")?e.includes("/watch")||e.includes("/shorts/")||e.includes("/live/")||e.includes("/embed/")||e.includes("/clip/")||t.includes("youtu.be"):!1}function f(t){let e=document.getElementById(q);e&&e.remove();let a=document.createElement("div");a.id=q,a.className=`vaultx-toast ${t.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let i=t.price!==void 0&&t.price!==null?`${t.currencySymbol||"\u20B9"}${t.price.toLocaleString("en-IN")}`:"",l=t.imageUrl?`<img src="${t.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${t.isError?"\u2715":"\u2713"}</div>`;a.innerHTML=`
    <div class="vaultx-toast-content">
      ${l}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${t.store||"VaultXMedia"}</span>
          ${i?`<span class="vaultx-toast-price">${i}</span>`:""}
        </div>
        <div class="vaultx-toast-title" title="${t.title}">${t.title}</div>
        <div class="vaultx-toast-sub">${t.isError?t.message||"Error occurred":t.message||"\u2713 Saved successfully"}</div>
      </div>
      <button class="vaultx-toast-close" title="Dismiss">&times;</button>
    </div>
    ${t.url&&!t.isError?`<div class="vaultx-toast-action">
             <a href="${t.url}" target="_blank" rel="noopener noreferrer" class="vaultx-toast-link">
               Open in VaultXMedia &rarr;
             </a>
           </div>`:""}
  `,a.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{a.classList.add("vaultx-toast-fadeout"),setTimeout(()=>a.remove(),300)}),document.body.appendChild(a),setTimeout(()=>{a.parentElement&&(a.classList.add("vaultx-toast-fadeout"),setTimeout(()=>a.remove(),300))},5e3)}var p=null;function k(t,e){p=e||p,t.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),t.classList.add("vaultx-already-saved"),t.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let a=t.querySelector(".vaultx-btn-icon"),i=t.querySelector(".vaultx-btn-text");a&&(a.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),i&&(i.textContent="Already in Wishlist")}async function I(t){try{let e=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});e&&e.exists&&k(t,e.product)}catch{}}function N(){let t=document.getElementById(w);if(t){I(t);return}F()&&(t=document.createElement("button"),t.id=w,t.className="vaultx-floating-btn",t.setAttribute("type","button"),t.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,I(t),t.addEventListener("click",async e=>{if(e.preventDefault(),e.stopPropagation(),t.classList.contains("vaultx-loading"))return;if(t.classList.contains("vaultx-already-saved")){f({title:p?.title||"Product in Wishlist",store:p?.store,price:p?.price??void 0,currencySymbol:p?.currencySymbol,imageUrl:p?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}t.classList.add("vaultx-loading");let a=t.querySelector(".vaultx-btn-text"),i=a.textContent;a.textContent="Saving...";try{let l=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href});t.classList.remove("vaultx-loading"),l&&l.success?(p=l.product,!!l.alreadyExists?(k(t,l.product),f({title:l.product?.title||"Product in Wishlist",store:l.product?.store,price:l.product?.price??void 0,currencySymbol:l.product?.currencySymbol,imageUrl:l.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(t.classList.add("vaultx-saved"),a.textContent="\u2713 Saved to Vault!",setTimeout(()=>{k(t,l.product)},2500))):(t.classList.add("vaultx-error"),a.textContent="Failed",f({title:"Failed to Save",message:l?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),a.textContent=i},3500))}catch(l){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),a.textContent="Failed",f({title:"Failed to Save",message:l.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),a.textContent=i},3500)}}),document.body.appendChild(t))}function R(){if(!U()){let e=document.getElementById(g);e&&e.remove();return}let t=document.getElementById(g);t||(t=document.createElement("button"),t.id=g,t.className="vaultx-floating-btn vaultx-youtube-btn",t.setAttribute("type","button"),t.setAttribute("title","Save YouTube video to Vault Theater & Videos"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,t.addEventListener("click",async e=>{if(e.preventDefault(),e.stopPropagation(),t.classList.contains("vaultx-loading"))return;t.classList.add("vaultx-loading");let a=t.querySelector(".vaultx-btn-text"),i=a.textContent;a.textContent="Saving Video...";try{let l=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});t.classList.remove("vaultx-loading"),l&&l.success?(t.classList.add("vaultx-saved"),a.textContent="\u2713 Saved to Videos!",setTimeout(()=>{t.classList.remove("vaultx-saved"),a.textContent=i},3e3)):(t.classList.add("vaultx-error"),a.textContent="Failed",f({title:"Failed to Save Video",message:l?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),a.textContent=i},3500))}catch(l){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),a.textContent="Failed",f({title:"Failed to Save Video",message:l.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),a.textContent=i},3500)}}),document.body.appendChild(t))}function j(t,e){let a=document.getElementById(B);a&&a.remove();let i=document.createElement("div");i.id=B,i.className="vaultx-modal-backdrop";let l=document.createElement("div");l.className="vaultx-modal",l.innerHTML=`
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
          <div class="vaultx-modal-link-title" title="${e||t}">${e||t}</div>
          <div class="vaultx-modal-link-url" title="${t}">${t}</div>
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
  `,i.appendChild(l),document.body.appendChild(i);let m=()=>{i.remove(),document.removeEventListener("keydown",C)},C=o=>{o.key==="Escape"&&m()};document.addEventListener("keydown",C),l.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",m),i.addEventListener("click",o=>{o.target===i&&m()});let n=l.querySelector("#vaultx-dynamic-step-container"),h=(o,d=!1)=>{n.innerHTML=`
      <div class="vaultx-modal-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${o}</span>
      </div>
      <div class="vaultx-modal-actions">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-err-cancel">Cancel</button>
        ${d?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-login">Open Settings / Login</button>':'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>'}
      </div>
    `,n.querySelector("#vaultx-err-cancel")?.addEventListener("click",m),n.querySelector("#vaultx-err-login")?.addEventListener("click",()=>{chrome.runtime.sendMessage({action:"CHECK_AUTH"}),m()}),n.querySelector("#vaultx-err-retry")?.addEventListener("click",H)},D=()=>{n.innerHTML=`
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
    `;let o=n.querySelector("#vaultx-2fa-form"),d=n.querySelector("#vaultx-totp-input"),r=n.querySelector("#vaultx-2fa-submit"),c=n.querySelector("#vaultx-2fa-error-box");setTimeout(()=>d?.focus(),80),n.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",m),o.addEventListener("submit",async x=>{x.preventDefault();let v=d.value.trim();if(v.length!==6){c.innerHTML=`
          <div class="vaultx-modal-error">Please enter all 6 digits.</div>
        `;return}r.disabled=!0,r.textContent="Verifying...";try{let u=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:v});u&&u.success?L():(r.disabled=!1,r.textContent="Unlock Vault \u2192",c.innerHTML=`
            <div class="vaultx-modal-error">${u?.error||"Invalid 6-digit code. Please check your app."}</div>
          `,d.value="",d.focus())}catch(u){r.disabled=!1,r.textContent="Unlock Vault \u2192",c.innerHTML=`
          <div class="vaultx-modal-error">${u.message||"Error communicating with extension."}</div>
        `}})},L=async()=>{n.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let o=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!o||!o.success){h(o?.error||"Failed to fetch vault folders.");return}let d=o.data||[];if(d.length===0){M();return}n.innerHTML=`
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${d.map(r=>`
                <div class="vaultx-folder-item" data-folder-id="${r.id}" data-folder-name="${r.name}" data-folder-color="${r.color||"#3b82f6"}">
                  <div class="vaultx-folder-left">
                    <div class="vaultx-folder-dot" style="background-color: ${r.color||"#3b82f6"};"></div>
                    <span class="vaultx-folder-name">${r.name}</span>
                  </div>
                  <span class="vaultx-folder-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>${r.cellCount||0} links</span>
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
      `,n.querySelector("#vaultx-step2-cancel")?.addEventListener("click",m),n.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",M),n.querySelectorAll(".vaultx-folder-item").forEach(r=>{r.addEventListener("click",()=>{let c=r.getAttribute("data-folder-id"),x=r.getAttribute("data-folder-name"),v=r.getAttribute("data-folder-color");V(c,x,v)})})}catch(o){h(o.message||"Could not load folders.")}},M=()=>{n.innerHTML=`
      <form id="vaultx-create-folder-form">
        <label class="vaultx-label">Folder Name</label>
        <input type="text" id="vaultx-new-folder-name" class="vaultx-input" placeholder="e.g. Work Bookmarks, Crypto, Personal" required style="margin-bottom:12px;" />

        <label class="vaultx-label">Folder Password (min 4 chars)</label>
        <input type="password" id="vaultx-new-folder-pw" class="vaultx-input" placeholder="Create password for this folder..." minlength="4" required style="margin-bottom:14px;" />

        <div id="vaultx-create-folder-error"></div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-create-folder-back">Back</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-create-folder-submit">Create & Continue &rarr;</button>
        </div>
      </form>
    `,n.querySelector("#vaultx-create-folder-back")?.addEventListener("click",L);let o=n.querySelector("#vaultx-create-folder-form"),d=n.querySelector("#vaultx-new-folder-name"),r=n.querySelector("#vaultx-new-folder-pw"),c=n.querySelector("#vaultx-create-folder-submit"),x=n.querySelector("#vaultx-create-folder-error");setTimeout(()=>d?.focus(),80),o.addEventListener("submit",async v=>{v.preventDefault();let u=d.value.trim(),y=r.value.trim();if(!u||y.length<4){x.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}c.disabled=!0,c.textContent="Creating...";try{let s=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:u,password:y,color:"#6366f1"}});s&&s.success&&s.data?V(s.data.id,s.data.name,s.data.color||"#6366f1",y):(c.disabled=!1,c.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${s?.error||"Failed to create folder."}</div>`)}catch(s){c.disabled=!1,c.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${s.message||"Error creating folder."}</div>`}})},V=(o,d,r,c="")=>{n.innerHTML=`
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Pill -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${r};"></div>
          <span style="font-size:12px; font-weight:700; color:#f1f5f9;">Destination: ${d}</span>
        </div>

        <div id="vaultx-save-error-box"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Folder Password</label>
          <input
            type="password"
            id="vaultx-folder-pw-input"
            class="vaultx-input"
            placeholder="Enter password for ${d}..."
            value="${c}"
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
            value="${e.replace(/"/g,"&quot;")}"
            required
          />
        </div>

        <div style="margin-bottom:14px;">
          <label class="vaultx-label">Notes (optional)</label>
          <input
            type="text"
            id="vaultx-cell-notes-input"
            class="vaultx-input"
            placeholder="Add secret notes..."
          />
        </div>

        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-save-back">Back</button>
          <button type="submit" class="vaultx-btn-primary" id="vaultx-save-submit">
            Unlock & Save Link
          </button>
        </div>
      </form>
    `;let x=n.querySelector("#vaultx-save-cell-form"),v=n.querySelector("#vaultx-folder-pw-input"),u=n.querySelector("#vaultx-cell-title-input"),y=n.querySelector("#vaultx-cell-notes-input"),s=n.querySelector("#vaultx-save-submit"),E=n.querySelector("#vaultx-save-error-box");setTimeout(()=>{c?u?.focus():v?.focus()},80),n.querySelector("#vaultx-save-back")?.addEventListener("click",L),x.addEventListener("submit",async P=>{P.preventDefault();let $=v.value.trim(),A=u.value.trim()||e||t,O=y.value.trim()||void 0;if(!$){E.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}s.disabled=!0,s.textContent="Verifying Password...";try{let b=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:o,password:$});if(!b||!b.success){s.disabled=!1,s.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${b?.error||"Incorrect folder password."}</div>`,v.focus();return}s.textContent="Saving Link...";let S=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:o,data:{url:t,title:A,notes:O}});S&&S.success?(m(),f({title:A,message:`\u2713 Saved in Secret Vault / ${d}`,url:"https://digital-media-vault.vercel.app/vault",isError:!1})):(s.disabled=!1,s.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${S?.error||"Failed to save link in folder."}</div>`)}catch(b){s.disabled=!1,s.textContent="Unlock & Save Link",E.innerHTML=`<div class="vaultx-modal-error">${b.message||"Error saving link."}</div>`}})},H=async()=>{try{let o=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!o||!o.success){h(o?.error||"Please log into VaultXMedia before saving.",!0);return}o.data?.enabled?D():L()}catch(o){h(o.message||"Failed to connect to extension.",!0)}};H()}chrome.runtime.onMessage.addListener(t=>{t.action==="SHOW_TOAST"?f(t):t.action==="OPEN_VAULT_SAVE_MODAL"&&j(t.url||window.location.href,t.title||document.title)});function T(){if(U()){let t=document.getElementById(w);t&&t.remove(),R()}else if(F()){let t=document.getElementById(g);t&&t.remove(),N()}else{let t=document.getElementById(w);t&&t.remove();let e=document.getElementById(g);e&&e.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",T):T();var _=location.href;new MutationObserver(()=>{let t=location.href;t!==_&&(_=t,setTimeout(T,1e3))}).observe(document,{subtree:!0,childList:!0});})();

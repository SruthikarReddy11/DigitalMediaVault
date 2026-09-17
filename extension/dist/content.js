"use strict";(()=>{var k="vaultxmedia-floating-save-btn",w="vaultxmedia-floating-yt-btn",F="vaultxmedia-save-toast",_="vaultxmedia-secret-modal";function P(){let t=window.location.href.toLowerCase(),e=window.location.hostname.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")||e.includes("vimeo.com")||e.includes("dailymotion.com")?!1:e.includes("amazon.")?t.includes("/dp/")||t.includes("/gp/product/")||t.includes("/d/"):e.includes("flipkart.com")?t.includes("/p/")||t.includes("pid="):e.includes("myntra.com")?/\/\d+\/buy/.test(t)||t.includes("/buy"):e.includes("ajio.com")?t.includes("/p/"):e.includes("meesho.com")?t.includes("/s/p/")||t.includes("/p/"):e.includes("nykaa.com")?t.includes("/p/"):e.includes("tatacliq.com")?t.includes("/p-"):e.includes("croma.com")||e.includes("reliancedigital.in")?t.includes("/p/"):!1}function O(){let t=window.location.hostname.toLowerCase(),e=window.location.href.toLowerCase();return t.includes("youtube.com")||t.includes("youtu.be")?e.includes("/watch")||e.includes("/shorts/")||e.includes("/live/")||e.includes("/embed/")||e.includes("/clip/")||t.includes("youtu.be"):!1}function y(t){let e=document.getElementById(F);e&&e.remove();let l=document.createElement("div");l.id=F,l.className=`vaultx-toast ${t.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let u=t.price!==void 0&&t.price!==null?`${t.currencySymbol||"\u20B9"}${t.price.toLocaleString("en-IN")}`:"",o=t.imageUrl?`<img src="${t.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${t.isError?"\u2715":"\u2713"}</div>`;l.innerHTML=`
    <div class="vaultx-toast-content">
      ${o}
      <div class="vaultx-toast-details">
        <div class="vaultx-toast-header">
          <span class="vaultx-toast-badge">${t.store||"VaultXMedia"}</span>
          ${u?`<span class="vaultx-toast-price">${u}</span>`:""}
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
  `,l.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{l.classList.add("vaultx-toast-fadeout"),setTimeout(()=>l.remove(),300)}),document.body.appendChild(l),setTimeout(()=>{l.parentElement&&(l.classList.add("vaultx-toast-fadeout"),setTimeout(()=>l.remove(),300))},5e3)}var f=null;function H(t,e){f=e||f,t.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),t.classList.add("vaultx-already-saved"),t.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let l=t.querySelector(".vaultx-btn-icon"),u=t.querySelector(".vaultx-btn-text");l&&(l.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),u&&(u.textContent="Already in Wishlist")}async function U(t){try{let e=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});e&&e.exists&&H(t,e.product)}catch{}}function R(){let t=document.getElementById(k);if(t){U(t);return}P()&&(t=document.createElement("button"),t.id=k,t.className="vaultx-floating-btn",t.setAttribute("type","button"),t.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z"></path>
        <path d="M12 11v6"></path>
        <path d="M9 14h6"></path>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,U(t),t.addEventListener("click",async e=>{if(e.preventDefault(),e.stopPropagation(),t.classList.contains("vaultx-loading"))return;if(t.classList.contains("vaultx-already-saved")){y({title:f?.title||"Product in Wishlist",store:f?.store,price:f?.price??void 0,currencySymbol:f?.currencySymbol,imageUrl:f?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}t.classList.add("vaultx-loading");let l=t.querySelector(".vaultx-btn-text"),u=l.textContent;l.textContent="Saving...";try{let o=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href});t.classList.remove("vaultx-loading"),o&&o.success?(f=o.product,!!o.alreadyExists?(H(t,o.product),y({title:o.product?.title||"Product in Wishlist",store:o.product?.store,price:o.product?.price??void 0,currencySymbol:o.product?.currencySymbol,imageUrl:o.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(t.classList.add("vaultx-saved"),l.textContent="\u2713 Saved to Vault!",setTimeout(()=>{H(t,o.product)},2500))):(t.classList.add("vaultx-error"),l.textContent="Failed",y({title:"Failed to Save",message:o?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),l.textContent=u},3500))}catch(o){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),l.textContent="Failed",y({title:"Failed to Save",message:o.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),l.textContent=u},3500)}}),document.body.appendChild(t))}function W(){if(!O()){let e=document.getElementById(w);e&&e.remove();return}let t=document.getElementById(w);t||(t=document.createElement("button"),t.id=w,t.className="vaultx-floating-btn vaultx-youtube-btn",t.setAttribute("type","button"),t.setAttribute("title","Save YouTube video to Vault Theater & Videos"),t.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,t.addEventListener("click",async e=>{if(e.preventDefault(),e.stopPropagation(),t.classList.contains("vaultx-loading"))return;t.classList.add("vaultx-loading");let l=t.querySelector(".vaultx-btn-text"),u=l.textContent;l.textContent="Saving Video...";try{let o=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});t.classList.remove("vaultx-loading"),o&&o.success?(t.classList.add("vaultx-saved"),l.textContent="\u2713 Saved to Videos!",setTimeout(()=>{t.classList.remove("vaultx-saved"),l.textContent=u},3e3)):(t.classList.add("vaultx-error"),l.textContent="Failed",y({title:"Failed to Save Video",message:o?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),l.textContent=u},3500))}catch(o){t.classList.remove("vaultx-loading"),t.classList.add("vaultx-error"),l.textContent="Failed",y({title:"Failed to Save Video",message:o.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{t.classList.remove("vaultx-error"),l.textContent=u},3500)}}),document.body.appendChild(t))}function j(t,e,l="https://digital-media-vault.vercel.app"){let u=document.getElementById(_);u&&u.remove();let o=document.createElement("div");o.id=_,o.className="vaultx-modal-backdrop";let h=document.createElement("div");h.className="vaultx-modal",h.innerHTML=`
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
  `,o.appendChild(h),document.body.appendChild(o);let p=()=>{o.remove(),document.removeEventListener("keydown",V)},V=s=>{s.key==="Escape"&&p()};document.addEventListener("keydown",V),h.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",p),o.addEventListener("click",s=>{s.target===o&&p()});let a=h.querySelector("#vaultx-dynamic-step-container"),S=(s,r=!0)=>{a.innerHTML=`
      <div class="vaultx-modal-error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${s}</span>
      </div>
      <div class="vaultx-modal-actions">
        <button type="button" class="vaultx-btn-secondary" id="vaultx-err-cancel">Cancel</button>
        ${r?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>':""}
      </div>
    `,a.querySelector("#vaultx-err-cancel")?.addEventListener("click",p),a.querySelector("#vaultx-err-retry")?.addEventListener("click",T)},M=s=>{a.innerHTML=`
      <div style="text-align:center; margin-bottom:14px;">
        <div style="font-size:13.5px; font-weight:700; color:#f1f5f9; margin-bottom:4px;">
          Authorize Secret Vault
        </div>
        <div style="font-size:11.5px; color:#94a3b8; line-height:1.4;">
          Please authorize your VaultXMedia account to access and save into your Secret Vault folders.
        </div>
      </div>

      <div id="vaultx-auth-error-box">
        ${s?`<div class="vaultx-modal-error">${s}</div>`:""}
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
    `;let r=a.querySelector("#vaultx-auth-error-box"),n=a.querySelector("#vaultx-auth-autosync"),c=a.querySelector("#vaultx-inline-login-form"),v=a.querySelector("#vaultx-auth-id"),m=a.querySelector("#vaultx-auth-pw"),d=a.querySelector("#vaultx-auth-submit");a.querySelector("#vaultx-auth-cancel")?.addEventListener("click",p),n.addEventListener("click",async()=>{n.disabled=!0,n.innerHTML="<span>Detecting browser session...</span>",r.innerHTML="";try{let x=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});x&&x.success?T():(n.disabled=!1,n.innerHTML="<span>Auto-Detect Active Web Session</span>",r.innerHTML='<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>',v.focus())}catch(x){n.disabled=!1,n.innerHTML="<span>Auto-Detect Active Web Session</span>",r.innerHTML=`<div class="vaultx-modal-error">${x.message||"Auto-detection failed."}</div>`}}),c.addEventListener("submit",async x=>{x.preventDefault();let i=v.value.trim(),b=m.value;if(!(!i||!b)){d.disabled=!0,d.textContent="Authorizing...",r.innerHTML="";try{let g=await chrome.runtime.sendMessage({action:"LOGIN",identifier:i,password:b});g&&g.success?T():(d.disabled=!1,d.textContent="Authorize & Unlock \u2192",r.innerHTML=`<div class="vaultx-modal-error">${g?.error||"Invalid credentials."}</div>`)}catch(g){d.disabled=!1,d.textContent="Authorize & Unlock \u2192",r.innerHTML=`<div class="vaultx-modal-error">${g.message||"Authorization failed."}</div>`}}})},z=()=>{a.innerHTML=`
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
    `;let s=a.querySelector("#vaultx-2fa-form"),r=a.querySelector("#vaultx-totp-input"),n=a.querySelector("#vaultx-2fa-submit"),c=a.querySelector("#vaultx-2fa-error-box");setTimeout(()=>r?.focus(),80),a.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",p),s.addEventListener("submit",async v=>{v.preventDefault();let m=r.value.trim();if(m.length!==6){c.innerHTML='<div class="vaultx-modal-error">Please enter all 6 digits.</div>';return}n.disabled=!0,n.textContent="Verifying...";try{let d=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:m});d&&d.success?E():(n.disabled=!1,n.textContent="Unlock Vault \u2192",c.innerHTML=`<div class="vaultx-modal-error">${d?.error||"Invalid 6-digit code. Please check your app."}</div>`,r.value="",r.focus())}catch(d){n.disabled=!1,n.textContent="Unlock Vault \u2192",c.innerHTML=`<div class="vaultx-modal-error">${d.message||"Error communicating with extension."}</div>`}})},E=async()=>{a.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let s=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!s||!s.success){s?.needAuth?M(s.error):S(s?.error||"Failed to fetch vault folders.");return}let r=s.data||[];if(r.length===0){q();return}a.innerHTML=`
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${r.map(n=>`
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
      `,a.querySelector("#vaultx-step2-cancel")?.addEventListener("click",p),a.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",q),a.querySelectorAll(".vaultx-folder-item").forEach(n=>{n.addEventListener("click",()=>{let c=n.getAttribute("data-folder-id"),v=n.getAttribute("data-folder-name"),m=n.getAttribute("data-folder-color");$(c,v,m)})})}catch(s){S(s.message||"Could not load folders.")}},q=()=>{a.innerHTML=`
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
    `,a.querySelector("#vaultx-create-folder-back")?.addEventListener("click",E);let s=a.querySelector("#vaultx-create-folder-form"),r=a.querySelector("#vaultx-new-folder-name"),n=a.querySelector("#vaultx-new-folder-pw"),c=a.querySelector("#vaultx-create-folder-submit"),v=a.querySelector("#vaultx-create-folder-error");setTimeout(()=>r?.focus(),80),s.addEventListener("submit",async m=>{m.preventDefault();let d=r.value.trim(),x=n.value.trim();if(!d||x.length<4){v.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}c.disabled=!0,c.textContent="Creating...";try{let i=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:d,password:x,color:"#6366f1"}});i&&i.success&&i.data?$(i.data.id,i.data.name,i.data.color||"#6366f1",x):(c.disabled=!1,c.textContent="Create & Continue \u2192",v.innerHTML=`<div class="vaultx-modal-error">${i?.error||"Failed to create folder."}</div>`)}catch(i){c.disabled=!1,c.textContent="Create & Continue \u2192",v.innerHTML=`<div class="vaultx-modal-error">${i.message||"Error creating folder."}</div>`}})},$=(s,r,n,c="")=>{a.innerHTML=`
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Indicator -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${n};"></div>
          <span style="font-size:12px; font-weight:700; color:#f1f5f9;">Destination: ${r}</span>
        </div>

        <div id="vaultx-save-error-box"></div>

        <div style="margin-bottom:12px;">
          <label class="vaultx-label">Folder Password</label>
          <input
            type="password"
            id="vaultx-folder-pw-input"
            class="vaultx-input"
            placeholder="Enter password for ${r}..."
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
    `;let v=a.querySelector("#vaultx-save-cell-form"),m=a.querySelector("#vaultx-folder-pw-input"),d=a.querySelector("#vaultx-cell-title-input"),x=a.querySelector("#vaultx-cell-notes-input"),i=a.querySelector("#vaultx-save-submit"),b=a.querySelector("#vaultx-save-error-box");setTimeout(()=>{c?d?.focus():m?.focus()},80),a.querySelector("#vaultx-save-back")?.addEventListener("click",E),v.addEventListener("submit",async g=>{g.preventDefault();let I=m.value.trim(),B=d.value.trim()||e||t,N=x.value.trim()||void 0;if(!I){b.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}i.disabled=!0,i.textContent="Verifying Password...";try{let L=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:s,password:I});if(!L||!L.success){i.disabled=!1,i.textContent="Unlock & Save Link",b.innerHTML=`<div class="vaultx-modal-error">${L?.error||"Incorrect folder password."}</div>`,m.focus();return}i.textContent="Saving Link...";let C=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:s,data:{url:t,title:B,notes:N}});C&&C.success?(p(),y({title:B,message:`\u2713 Saved in Secret Vault / ${r}`,url:`${l}/vault`,isError:!1})):(i.disabled=!1,i.textContent="Unlock & Save Link",b.innerHTML=`<div class="vaultx-modal-error">${C?.error||"Failed to save link in folder."}</div>`)}catch(L){i.disabled=!1,i.textContent="Unlock & Save Link",b.innerHTML=`<div class="vaultx-modal-error">${L.message||"Error saving link."}</div>`}})},T=async()=>{try{let s=await chrome.runtime.sendMessage({action:"CHECK_AUTH"});if(!s||!s.isAuthenticated){let n=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});if(!n||!n.success){M();return}}let r=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!r||!r.success){r?.needAuth?M(r.error):S(r?.error||"Failed to connect to Secret Vault.");return}r.data?.enabled?z():E()}catch(s){S(s.message||"Failed to connect to extension.")}};T()}chrome.runtime.onMessage.addListener(t=>{t.action==="SHOW_TOAST"?y(t):t.action==="OPEN_VAULT_SAVE_MODAL"&&j(t.url||window.location.href,t.title||document.title,t.webUrl)});function A(){if(O()){let t=document.getElementById(k);t&&t.remove(),W()}else if(P()){let t=document.getElementById(w);t&&t.remove(),R()}else{let t=document.getElementById(k);t&&t.remove();let e=document.getElementById(w);e&&e.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",A):A();var D=location.href;new MutationObserver(()=>{let t=location.href;t!==D&&(D=t,setTimeout(A,1e3))}).observe(document,{subtree:!0,childList:!0});})();

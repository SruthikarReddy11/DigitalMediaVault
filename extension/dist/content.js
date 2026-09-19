"use strict";(()=>{var G="vaultxmedia-floating-save-btn",z="vaultxmedia-floating-yt-btn",j="vaultxmedia-floating-maps-btn",ee="vaultxmedia-save-toast",te="vaultxmedia-secret-modal",ne="vaultxmedia-place-modal";function ie(){let e=window.location.href.toLowerCase(),n=window.location.hostname.toLowerCase();return n.includes("youtube.com")||n.includes("youtu.be")||n.includes("vimeo.com")||n.includes("dailymotion.com")?!1:n.includes("amazon.")?e.includes("/dp/")||e.includes("/gp/product/")||e.includes("/d/"):n.includes("flipkart.com")?e.includes("/p/")||e.includes("pid="):n.includes("myntra.com")?/\/\d+\/buy/.test(e)||e.includes("/buy"):n.includes("ajio.com")?e.includes("/p/"):n.includes("meesho.com")?e.includes("/s/p/")||e.includes("/p/"):n.includes("nykaa.com")?e.includes("/p/"):n.includes("tatacliq.com")?e.includes("/p-"):n.includes("croma.com")||n.includes("reliancedigital.in")?e.includes("/p/"):!1}function le(){let e=window.location.hostname.toLowerCase(),n=window.location.href.toLowerCase();return e.includes("youtube.com")||e.includes("youtu.be")?n.includes("/watch")||n.includes("/shorts/")||n.includes("/live/")||n.includes("/embed/")||n.includes("/clip/")||e.includes("youtu.be"):!1}function re(){let e=window.location.hostname.toLowerCase(),n=window.location.href.toLowerCase();return!!(e.includes("maps.google.")||e.includes("maps.app.goo.gl")||e.includes("google.")&&(n.includes("/maps")||n.includes("/place/"))||e.includes("goo.gl")&&n.includes("/maps"))}function q(e){let n=document.getElementById(ee);n&&n.remove();let i=document.createElement("div");i.id=ee,i.className=`vaultx-toast ${e.isError?"vaultx-toast-error":"vaultx-toast-success"}`;let s=e.price!==void 0&&e.price!==null?`${e.currencySymbol||"\u20B9"}${e.price.toLocaleString("en-IN")}`:"",v=e.imageUrl?`<img src="${e.imageUrl}" class="vaultx-toast-img" alt="Item" onerror="this.style.display='none'" />`:`<div class="vaultx-toast-icon-box">${e.isError?"\u2715":"\u2713"}</div>`;i.innerHTML=`
    <div class="vaultx-toast-content">
      ${v}
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
  `,i.querySelector(".vaultx-toast-close")?.addEventListener("click",()=>{i.classList.add("vaultx-toast-fadeout"),setTimeout(()=>i.remove(),300)}),document.body.appendChild(i),setTimeout(()=>{i.parentElement&&(i.classList.add("vaultx-toast-fadeout"),setTimeout(()=>i.remove(),300))},5e3)}var $=null;function K(e,n){$=n||$,e.classList.remove("vaultx-loading","vaultx-error","vaultx-saved"),e.classList.add("vaultx-already-saved"),e.setAttribute("title","This product is already in your VaultXMedia Wishlist (Click to view)");let i=e.querySelector(".vaultx-btn-icon"),s=e.querySelector(".vaultx-btn-text");i&&(i.innerHTML=`
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `),s&&(s.textContent="Already in Wishlist")}async function ae(e){try{let n=await chrome.runtime.sendMessage({action:"CHECK_PRODUCT_EXISTS",url:window.location.href});n&&n.exists&&K(e,n.product)}catch{}}function se(){let e=window.location.href,n=window.location.hostname.toLowerCase(),i="",s="",v,c,m="",d="General",u=!0,f="",w="INR",E="\u20B9";if(n.includes("amazon."))f="Amazon";else if(n.includes("flipkart.com"))f="Flipkart";else if(n.includes("myntra.com"))f="Myntra";else if(n.includes("ajio.com"))f="Ajio";else if(n.includes("meesho.com"))f="Meesho";else if(n.includes("nykaa.com"))f="Nykaa";else if(n.includes("tatacliq.com"))f="Tata CLiQ";else if(n.includes("croma.com"))f="Croma";else if(n.includes("reliancedigital.in"))f="Reliance Digital";else{let a=n.replace(/^www\./,"").split(".")[0];f=a.charAt(0).toUpperCase()+a.slice(1)||"Other"}let b=a=>{if(typeof a=="number"&&!isNaN(a))return a;if(!a||typeof a!="string")return;let l=a.replace(/[^\d.]/g,"").trim(),t=parseFloat(l);return isNaN(t)||t<=0?void 0:t};if(document.querySelectorAll('script[type="application/ld+json"]').forEach(a=>{try{let l=a.textContent;if(!l)return;let t=JSON.parse(l),r=Array.isArray(t)?t:t["@graph"]?t["@graph"]:[t];for(let o of r)if(o["@type"]==="Product"||o["@type"]==="IndividualProduct"||o["@type"]==="ProductModel"){if(!i&&o.name&&(i=String(o.name).trim()),s||(typeof o.brand=="string"?s=o.brand.trim():o.brand?.name&&(s=String(o.brand.name).trim())),!m)if(typeof o.image=="string")m=o.image;else if(Array.isArray(o.image)&&o.image.length>0){let x=o.image[0];m=typeof x=="string"?x:x?.url||""}else o.image?.url&&(m=o.image.url);let p=Array.isArray(o.offers)?o.offers[0]:o.offers;if(p){if(v===void 0){let x=b(p.price||p.lowPrice);x&&(v=x)}p.priceCurrency&&(w=p.priceCurrency,E=w==="INR"?"\u20B9":w==="USD"?"$":w),p.availability&&(u=!String(p.availability).toLowerCase().includes("outofstock"))}}}catch{}}),f==="Ajio"){d="Fashion";let a=document.querySelector(".brand-name")?.textContent||document.querySelector("h2.brand-name")?.textContent||document.querySelector(".prod-brand")?.textContent;a&&a.trim()&&(s=a.trim());let l=document.querySelector(".prod-name")?.textContent||document.querySelector("h1.prod-title")?.textContent;if(l&&l.trim()&&(i=s&&!l.trim().toLowerCase().startsWith(s.toLowerCase())?`${s} ${l.trim()}`:l.trim()),v===void 0){let t=document.querySelector(".prod-sp")?.textContent||document.querySelector(".price-value")?.textContent,r=b(t);r&&(v=r)}if(c===void 0){let t=document.querySelector(".prod-cp")?.textContent||document.querySelector(".original-price")?.textContent,r=b(t);r&&(c=r)}if(!m){let t=Array.from(document.querySelectorAll("img")).filter(r=>{let o=r.getAttribute("src")||"";return o.includes("assets.ajio.com")&&(o.includes("medias")||o.includes("root")||o.includes("images"))});t.length>0&&(m=t[0].src||t[0].getAttribute("src")||"")}}else if(f==="Myntra"){d="Fashion";let a=document.querySelector(".pdp-title")?.textContent;a&&a.trim()&&(s=a.trim());let l=document.querySelector(".pdp-name")?.textContent;if(l&&l.trim()&&(i=s&&!l.trim().toLowerCase().startsWith(s.toLowerCase())?`${s} ${l.trim()}`:l.trim()),v===void 0){let t=b(document.querySelector(".pdp-price strong")?.textContent||document.querySelector(".pdp-price")?.textContent);t&&(v=t)}if(c===void 0){let t=b(document.querySelector(".pdp-mrp s")?.textContent||document.querySelector(".pdp-mrp")?.textContent);t&&(c=t)}if(!m){let t=document.querySelector(".image-grid-image")||document.querySelector('img[src*="assets.myntassets.com"]');t&&(m=t.src||t.getAttribute("src")||"")}}else if(f==="Flipkart"){let a=document.querySelector("span.B_NuCI")?.textContent||document.querySelector("h1.yhB1nd")?.textContent||document.querySelector("span._35KyD6")?.textContent;if(a&&a.trim()&&(i=a.trim()),v===void 0){let l=document.querySelector("div._30jeq3._16Jk6d")?.textContent||document.querySelector("div._30jeq3")?.textContent||document.querySelector("div.Nx9bqj.CxhGGd")?.textContent,t=b(l);t&&(v=t)}if(c===void 0){let l=document.querySelector("div._3I9_wc._2p6lqe")?.textContent||document.querySelector("div._3I9_wc")?.textContent||document.querySelector("div.yRaY8j.A68aAq")?.textContent,t=b(l);t&&(c=t)}if(!m){let l=document.querySelector("img._396cs4")||document.querySelector("img.DByuf4")||document.querySelector("img._2r_T1I");l&&(m=l.src||l.getAttribute("src")||"")}}else if(f==="Amazon"){let a=document.querySelector("#productTitle")?.textContent||document.querySelector("span#title")?.textContent;if(a&&a.trim()&&(i=a.trim()),v===void 0){let l=document.querySelector(".a-price .a-offscreen")?.textContent||document.querySelector("#priceblock_ourprice")?.textContent||document.querySelector("#corePrice_desktop .a-offscreen")?.textContent,t=b(l);t&&(v=t)}if(c===void 0){let l=document.querySelector(".a-text-price span.a-offscreen")?.textContent||document.querySelector("#listPrice")?.textContent,t=b(l);t&&(c=t)}if(!m){let l=document.querySelector("#landingImage")||document.querySelector("#imgBlkFront");l&&(m=l.src||l.getAttribute("data-old-hires")||l.getAttribute("src")||"")}}if(i||(i=document.querySelector('meta[property="og:title"]')?.content||document.querySelector('meta[name="twitter:title"]')?.content||document.title||""),m||(m=document.querySelector('meta[property="og:image"]')?.content||document.querySelector('meta[property="og:image:secure_url"]')?.content||document.querySelector('meta[name="twitter:image"]')?.content||""),f==="Ajio"&&(!i||i.toLowerCase().includes("access denied")))try{let l=new URL(e).pathname.match(/\/([^/]+)\/p\/([^/?#]+)/i);if(l&&l[1]){let t=l[1].split("-").filter(Boolean);if(t.length>0){let r=t.map(o=>o.charAt(0).toUpperCase()+o.slice(1));s=s||r[0],i=r.join(" ")}}}catch{}return i=i.replace(/\s*\|\s*Flipkart\.com$/i,"").replace(/\s*:\s*Buy Online at Best Price in India - Amazon\.in$/i,"").replace(/\s*:\s*Amazon\.in:.*$/i,"").replace(/\s*Buy Online at Ajio\.com$/i,"").replace(/\s*-\s*Ajio$/i,"").replace(/\s*Buy.*Online at Myntra$/i,"").replace(/\s*\|\s*Myntra$/i,"").trim(),(!i||i.toLowerCase().includes("access denied"))&&(i=`Product from ${f}`),{url:e,title:i,brand:s||void 0,store:f,category:d,price:v,originalPrice:c,currency:w,currencySymbol:E,imageUrl:m||void 0,inStock:u}}function Z(e,n="vaultx_floating_pos"){let i=!1,s=!1,v=0,c=0,m=0,d=0;requestAnimationFrame(()=>{try{let t=localStorage.getItem(n);if(t){let{x:r,y:o}=JSON.parse(t);if(typeof r=="number"&&typeof o=="number"){let p=e.offsetWidth||160,x=e.offsetHeight||44,h=Math.max(10,window.innerWidth-p-10),g=Math.max(10,window.innerHeight-x-10),L=Math.min(Math.max(10,r),h),y=Math.min(Math.max(10,o),g);e.style.setProperty("left",`${L}px`,"important"),e.style.setProperty("top",`${y}px`,"important"),e.style.setProperty("right","auto","important"),e.style.setProperty("bottom","auto","important")}}}catch{}});let f=t=>{if("button"in t&&t.button!==0)return;let r="touches"in t?t.touches[0].clientX:t.clientX,o="touches"in t?t.touches[0].clientY:t.clientY;if(t.target.closest("input, textarea, select, a, button:not(.vaultx-floating-btn)"))return;i=!0,s=!1,v=r,c=o;let x=e.getBoundingClientRect();m=x.left,d=x.top,window.addEventListener("mousemove",E,{passive:!1}),window.addEventListener("mouseup",a),window.addEventListener("touchmove",b,{passive:!1}),window.addEventListener("touchend",l)},w=(t,r,o)=>{if(!i)return;let p=t-v,x=r-c;if(s||Math.hypot(p,x)>4&&(s=!0,e.classList.add("vaultx-dragging")),s){o.preventDefault();let h=e.offsetWidth||160,g=e.offsetHeight||44,L=Math.max(10,window.innerWidth-h-10),y=Math.max(10,window.innerHeight-g-10),M=Math.min(Math.max(10,m+p),L),C=Math.min(Math.max(10,d+x),y);e.style.setProperty("left",`${M}px`,"important"),e.style.setProperty("top",`${C}px`,"important"),e.style.setProperty("right","auto","important"),e.style.setProperty("bottom","auto","important")}},E=t=>w(t.clientX,t.clientY,t),b=t=>{t.touches.length>0&&w(t.touches[0].clientX,t.touches[0].clientY,t)},k=()=>{if(i&&(i=!1,e.classList.remove("vaultx-dragging"),window.removeEventListener("mousemove",E),window.removeEventListener("mouseup",a),window.removeEventListener("touchmove",b),window.removeEventListener("touchend",l),s)){let t=r=>{r.stopPropagation(),r.preventDefault(),window.removeEventListener("click",t,!0)};window.addEventListener("click",t,!0);try{let r=e.getBoundingClientRect();localStorage.setItem(n,JSON.stringify({x:r.left,y:r.top}))}catch{}}},a=()=>k(),l=()=>k();e.addEventListener("mousedown",f),e.addEventListener("touchstart",f,{passive:!0})}function ce(e,n){if(!n)return;let i=!1,s=0,v=0,c=0,m=0;n.addEventListener("mousedown",d=>{if(d.button!==0||d.target.closest("button, input, select, textarea"))return;i=!0,s=d.clientX,v=d.clientY;let u=e.getBoundingClientRect();c=u.left,m=u.top,e.classList.add("vaultx-modal-dragging");let f=E=>{if(!i)return;let b=E.clientX-s,k=E.clientY-v,a=Math.max(10,window.innerWidth-e.offsetWidth-10),l=Math.max(10,window.innerHeight-e.offsetHeight-10),t=Math.min(Math.max(10,c+b),a),r=Math.min(Math.max(10,m+k),l);e.style.setProperty("left",`${t}px`,"important"),e.style.setProperty("top",`${r}px`,"important"),e.style.setProperty("transform","none","important"),e.style.setProperty("margin","0","important")},w=()=>{i=!1,e.classList.remove("vaultx-modal-dragging"),window.removeEventListener("mousemove",f),window.removeEventListener("mouseup",w)};window.addEventListener("mousemove",f),window.addEventListener("mouseup",w)})}function me(){let e=document.getElementById(G);if(e){ae(e);return}ie()&&(e=document.createElement("button"),e.id=G,e.className="vaultx-floating-btn",e.setAttribute("type","button"),e.setAttribute("title","Save product directly to your VaultXMedia Wishlist"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="20" height="20" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="btnTopGrad" x1="60" y1="14" x2="60" y2="62" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#7dd3fc" />
            <stop offset="100%" stop-color="#6366f1" />
          </linearGradient>
          <linearGradient id="btnLeftGrad" x1="18" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#030712" />
          </linearGradient>
          <linearGradient id="btnRightGrad" x1="102" y1="38" x2="60" y2="106" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6366f1" />
            <stop offset="100%" stop-color="#4c1d95" />
          </linearGradient>
        </defs>
        <path d="M18 38L60 62V106L18 82V38Z" fill="url(#btnLeftGrad)" stroke="#38bdf8" stroke-width="2" stroke-linejoin="round" />
        <path d="M60 62L102 38V82L60 106V62Z" fill="url(#btnRightGrad)" stroke="#c084fc" stroke-width="2" stroke-linejoin="round" />
        <path d="M60 14L102 38L60 62L18 38L60 14Z" fill="url(#btnTopGrad)" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
        <circle cx="60" cy="54" r="5" fill="#ffffff" />
        <circle cx="60" cy="54" r="2.5" fill="#0284c7" />
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to VaultXMedia</span>
  `,ae(e),e.addEventListener("click",async n=>{if(n.preventDefault(),n.stopPropagation(),e.classList.contains("vaultx-loading"))return;if(e.classList.contains("vaultx-already-saved")){q({title:$?.title||"Product in Wishlist",store:$?.store,price:$?.price??void 0,currencySymbol:$?.currencySymbol,imageUrl:$?.imageUrl??void 0,message:"\u2713 This product is already in your VaultXMedia Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1});return}e.classList.add("vaultx-loading");let i=e.querySelector(".vaultx-btn-text"),s=i.textContent;i.textContent="Saving...";let v=se();try{let c=await chrome.runtime.sendMessage({action:"SAVE_CURRENT_PRODUCT",url:window.location.href,title:v?.title||document.title,productData:v});e.classList.remove("vaultx-loading"),c&&c.success?($=c.product,!!c.alreadyExists?(K(e,c.product),q({title:c.product?.title||"Product in Wishlist",store:c.product?.store,price:c.product?.price??void 0,currencySymbol:c.product?.currencySymbol,imageUrl:c.product?.imageUrl??void 0,message:"\u2713 This product is already in your Wishlist",url:"https://digital-media-vault.vercel.app/products",isError:!1})):(e.classList.add("vaultx-saved"),i.textContent="\u2713 Saved to Vault!",setTimeout(()=>{K(e,c.product)},2500))):(e.classList.add("vaultx-error"),i.textContent="Failed",q({title:"Failed to Save",message:c?.error||"Could not save product to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),i.textContent=s},3500))}catch(c){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),i.textContent="Failed",q({title:"Failed to Save",message:c.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),i.textContent=s},3500)}}),document.body.appendChild(e),Z(e,"vaultx_floating_btn_pos"))}function pe(){if(!le()){let n=document.getElementById(z);n&&n.remove();return}let e=document.getElementById(z);e||(e=document.createElement("button"),e.id=z,e.className="vaultx-floating-btn vaultx-youtube-btn",e.setAttribute("type","button"),e.setAttribute("title","Save YouTube video to Vault Theater & Videos"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save to Vault Videos</span>
  `,e.addEventListener("click",async n=>{if(n.preventDefault(),n.stopPropagation(),e.classList.contains("vaultx-loading"))return;e.classList.add("vaultx-loading");let i=e.querySelector(".vaultx-btn-text"),s=i.textContent;i.textContent="Saving Video...";try{let v=await chrome.runtime.sendMessage({action:"SAVE_VIDEO",url:window.location.href,title:document.title});e.classList.remove("vaultx-loading"),v&&v.success?(e.classList.add("vaultx-saved"),i.textContent="\u2713 Saved to Videos!",setTimeout(()=>{e.classList.remove("vaultx-saved"),i.textContent=s},3e3)):(e.classList.add("vaultx-error"),i.textContent="Failed",q({title:"Failed to Save Video",message:v?.error||"Could not save video to VaultXMedia.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),i.textContent=s},3500))}catch(v){e.classList.remove("vaultx-loading"),e.classList.add("vaultx-error"),i.textContent="Failed",q({title:"Failed to Save Video",message:v.message||"Error communicating with extension worker.",isError:!0}),setTimeout(()=>{e.classList.remove("vaultx-error"),i.textContent=s},3500)}}),document.body.appendChild(e),Z(e,"vaultx_floating_btn_pos"))}function xe(){if(!re()){let n=document.getElementById(j);n&&n.remove();return}let e=document.getElementById(j);e||(e=document.createElement("button"),e.id=j,e.className="vaultx-floating-btn vaultx-maps-btn",e.setAttribute("type","button"),e.setAttribute("title","Save place to VaultXMedia Places & Plans"),e.innerHTML=`
    <span class="vaultx-btn-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </span>
    <span class="vaultx-btn-text">Save Place</span>
  `,e.addEventListener("click",n=>{n.preventDefault(),n.stopPropagation(),de(window.location.href)}),document.body.appendChild(e),Z(e,"vaultx_floating_btn_pos"))}function de(e=window.location.href,n="https://digital-media-vault.vercel.app"){let i=document.getElementById(ne);i&&i.remove();let s=document.createElement("div");s.id=ne,s.className="vaultx-modal-backdrop";let v=document.createElement("div");v.className="vaultx-modal",v.innerHTML=`
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
  `,s.appendChild(v),document.body.appendChild(s),ce(v,v.querySelector(".vaultx-modal-header"));let c=()=>{s.remove(),document.removeEventListener("keydown",m)},m=a=>{a.key==="Escape"&&c()};document.addEventListener("keydown",m),v.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",c),s.addEventListener("click",a=>{a.target===s&&c()});let d=v.querySelector("#vaultx-place-step-container"),u=(document.querySelector("h1.DUwDvf, h1")?.textContent||document.title.replace(/- Google Maps.*/i,"")).trim(),f=(document.querySelector('button[data-item-id*="address"] div.Io6YTe, button[data-item-id*="address"]')?.textContent||"").trim(),E=document.querySelector('button[aria-label*="Photo"] img, img[src*="googleusercontent.com"], img[src*="ggpht.com"], .widget-scene img')?.src||"",b=async()=>{try{let a=await chrome.runtime.sendMessage({action:"RESOLVE_PLACE",url:e});if(!a||!a.success||!a.data){d.innerHTML=`
          <div class="vaultx-modal-error">
            ${a?.error||"Could not resolve place details automatically."}
          </div>
          <div class="vaultx-modal-actions">
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-cancel">Cancel</button>
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-manual-btn">Enter Details Manually</button>
            <button type="button" class="vaultx-btn-primary" id="vaultx-place-retry">Retry</button>
          </div>
        `,d.querySelector("#vaultx-place-cancel")?.addEventListener("click",c),d.querySelector("#vaultx-place-retry")?.addEventListener("click",b),d.querySelector("#vaultx-place-manual-btn")?.addEventListener("click",()=>{k({name:u||"Saved Place",address:f||"",photoUrl:E||"",googleMapsUrl:e})});return}let l=a.data;k(l)}catch(a){let l=String(a?.message||"");if(l.includes("context invalidated")){d.innerHTML=`
          <div class="vaultx-modal-error" style="line-height: 1.5;">
            <strong>\u26A0\uFE0F Extension Reconnected/Updated</strong><br/>
            The extension was reloaded in Chrome. Please refresh this page to reconnect with the extension.
          </div>
          <div class="vaultx-modal-actions">
            <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-close">Close</button>
            <button type="button" class="vaultx-btn-primary" id="vaultx-place-reload-btn" style="background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);">
              \u21BB Refresh Page
            </button>
          </div>
        `,d.querySelector("#vaultx-place-reload-btn")?.addEventListener("click",()=>{window.location.reload()}),d.querySelector("#vaultx-place-err-close")?.addEventListener("click",c);return}d.innerHTML=`
        <div class="vaultx-modal-error">${l||"Error communicating with extension worker."}</div>
        <div class="vaultx-modal-actions">
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-close">Close</button>
          <button type="button" class="vaultx-btn-secondary" id="vaultx-place-err-manual">Enter Manually</button>
          <button type="button" class="vaultx-btn-primary" id="vaultx-place-retry">Retry</button>
        </div>
      `,d.querySelector("#vaultx-place-err-close")?.addEventListener("click",c),d.querySelector("#vaultx-place-retry")?.addEventListener("click",b),d.querySelector("#vaultx-place-err-manual")?.addEventListener("click",()=>{k({name:u||"Saved Place",address:f||"",photoUrl:E||"",googleMapsUrl:e})})}},k=a=>{let l=(a.photoUrl||a.imageUrl||E||"").trim(),t=a.rating?`<span class="vaultx-place-tag vaultx-place-tag-rating">\u2B50 ${a.rating.toFixed(1)}${a.userRatingsTotal?` (${a.userRatingsTotal.toLocaleString()})`:""}</span>`:"",r=a.category?`<span class="vaultx-place-tag">${a.category}</span>`:"";d.innerHTML=`
      <form id="vaultx-save-place-form">
        <div class="vaultx-place-preview-card">
          <div id="vaultx-place-img-box" style="flex-shrink:0;">
            ${l?`<img src="${l}" class="vaultx-place-preview-img" alt="${a.name}" onerror="this.outerHTML='<div class=\\'vaultx-place-preview-placeholder\\'>\u{1F4CD}</div>';" />`:'<div class="vaultx-place-preview-placeholder">\u{1F4CD}</div>'}
          </div>
          <div class="vaultx-place-preview-meta">
            <div class="vaultx-place-preview-title" title="${a.name}">${a.name}</div>
            <div class="vaultx-place-preview-address" title="${a.address||""}">${a.address||"Address not specified"}</div>
            <div class="vaultx-place-preview-tags">
              ${r}
              ${t}
            </div>
          </div>
        </div>

        <div id="vaultx-place-form-error"></div>

        <!-- Custom Image URL or Upload Section -->
        <div class="vaultx-img-section">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <label class="vaultx-label" style="margin-bottom:0; font-size:12px;">Place Image / Photo</label>
            <button type="button" id="vaultx-place-clear-img" class="vaultx-btn-text-link" style="color:#f87171; display:${l?"inline":"none"};">
              \u2715 Clear Photo
            </button>
          </div>

          <div class="vaultx-img-tabs">
            <button type="button" class="vaultx-img-tab active" id="vaultx-tab-btn-url">\u{1F517} Image URL</button>
            <button type="button" class="vaultx-img-tab" id="vaultx-tab-btn-file">\u{1F4C1} Upload Image</button>
          </div>

          <!-- URL Input View -->
          <div id="vaultx-tab-pane-url" style="display:block;">
            <div style="display:flex; gap:6px;">
              <input type="url" id="vaultx-place-img-url" class="vaultx-input" placeholder="Paste image link (https://...)" value="${l&&!l.startsWith("data:")?l:""}" style="font-size:12px; flex:1;" />
              <button type="button" id="vaultx-place-img-apply-btn" class="vaultx-btn-secondary" style="padding:6px 12px; font-size:12px; white-space:nowrap;">
                Apply
              </button>
            </div>
          </div>

          <!-- File Upload View -->
          <div id="vaultx-tab-pane-file" style="display:none;">
            <label for="vaultx-place-file-input" class="vaultx-upload-dropzone">
              <span style="font-size:18px; margin-bottom:2px;">\u{1F5BC}\uFE0F</span>
              <span style="font-size:12px; color:#f1f5f9; font-weight:500;">Click to choose photo from computer</span>
              <span style="font-size:10px; color:#94a3b8; margin-top:2px;">Supports JPG, PNG, WEBP</span>
              <input type="file" id="vaultx-place-file-input" accept="image/*" style="display:none;" />
            </label>
            <div id="vaultx-place-upload-msg" style="font-size:11px; color:#10b981; margin-top:6px; text-align:center; display:none;"></div>
          </div>
        </div>

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
    `;let o=d.querySelector("#vaultx-save-place-form"),p=d.querySelector("#vaultx-place-img-box"),x=d.querySelector("#vaultx-place-clear-img"),h=d.querySelector("#vaultx-tab-btn-url"),g=d.querySelector("#vaultx-tab-btn-file"),L=d.querySelector("#vaultx-tab-pane-url"),y=d.querySelector("#vaultx-tab-pane-file"),M=d.querySelector("#vaultx-place-img-url"),C=d.querySelector("#vaultx-place-img-apply-btn"),B=d.querySelector("#vaultx-place-file-input"),H=d.querySelector("#vaultx-place-upload-msg"),_=(S,A)=>{l=S.trim(),l?(p.innerHTML=`<img src="${l}" class="vaultx-place-preview-img" alt="${a.name}" onerror="this.outerHTML='<div class=\\'vaultx-place-preview-placeholder\\'>\u{1F4CD}</div>';" />`,x.style.display="inline"):(p.innerHTML='<div class="vaultx-place-preview-placeholder">\u{1F4CD}</div>',x.style.display="none"),A&&H?(H.style.display="block",H.textContent=A):H&&(H.style.display="none")};h.addEventListener("click",()=>{h.classList.add("active"),g.classList.remove("active"),L.style.display="block",y.style.display="none"}),g.addEventListener("click",()=>{g.classList.add("active"),h.classList.remove("active"),y.style.display="block",L.style.display="none"}),C.addEventListener("click",()=>{_(M.value.trim())}),M.addEventListener("keydown",S=>{S.key==="Enter"&&(S.preventDefault(),_(M.value.trim()))}),x.addEventListener("click",()=>{M.value="",B&&(B.value=""),_("")}),B.addEventListener("change",()=>{let S=B.files?.[0];if(!S)return;let A=new FileReader;A.onload=V=>{let N=V.target?.result,I=new Image;I.onload=()=>{let T=document.createElement("canvas"),P=I.width,U=I.height,R=1200;(P>R||U>R)&&(P>U?(U=Math.round(U*R/P),P=R):(P=Math.round(P*R/U),U=R)),T.width=P,T.height=U,T.getContext("2d")?.drawImage(I,0,0,P,U);let ve=T.toDataURL("image/jpeg",.88);_(ve,`\u2713 Uploaded: ${S.name} (${Math.round(S.size/1024)} KB)`)},I.onerror=()=>{_(N,`\u2713 Uploaded: ${S.name}`)},I.src=N},A.readAsDataURL(S)});let D=d.querySelector("#vaultx-place-status"),W=d.querySelector("#vaultx-place-favorite"),F=d.querySelector("#vaultx-place-reminder-preset"),Q=d.querySelector("#vaultx-custom-reminder-wrap"),X=d.querySelector("#vaultx-place-custom-date"),ue=d.querySelector("#vaultx-place-notes"),O=d.querySelector("#vaultx-place-submit-btn"),Y=d.querySelector("#vaultx-place-form-error");F.addEventListener("change",()=>{if(F.value==="CUSTOM"){Q.style.display="block";let S=new Date(Date.now()+1440*60*1e3);S.setHours(10,0,0,0),X.value=S.toISOString().slice(0,16)}else Q.style.display="none"}),d.querySelector("#vaultx-place-cancel-btn")?.addEventListener("click",c),o.addEventListener("submit",async S=>{S.preventDefault(),O.disabled=!0,O.textContent="Saving Place...",Y.innerHTML="";let A=[];W?.checked&&A.push("Favorite");let V,N=new Date;if(F.value==="1_DAY")V=new Date(N.getTime()+1440*60*1e3).toISOString();else if(F.value==="1_WEEK")V=new Date(N.getTime()+10080*60*1e3).toISOString();else if(F.value==="1_MONTH")V=new Date(N.getTime()+720*60*60*1e3).toISOString();else if(F.value==="CUSTOM"&&X.value)try{let T=new Date(X.value);isNaN(T.getTime())||(V=T.toISOString())}catch{}let I={googleMapsUrl:a.googleMapsUrl||e,name:a.name,address:a.address,placeId:a.placeId,latitude:a.latitude,longitude:a.longitude,category:a.category,rating:a.rating,userRatingsTotal:a.userRatingsTotal,imageUrl:l||a.photoUrl||a.imageUrl||null,photoUrl:l||a.photoUrl||a.imageUrl||null,photoAttributions:a.photoAttributions,status:D.value,tags:A,notes:ue.value.trim()||void 0,reminderDate:V};try{let T=await chrome.runtime.sendMessage({action:"SAVE_PLACE",data:I});T&&T.success?(c(),q({title:a.name||"Place Saved",store:"Places & Plans",imageUrl:l||a.photoUrl||void 0,message:"\u2713 Saved to Places & Plans!",url:`${n}/places`,isError:!1})):(O.disabled=!1,O.textContent="Save Place \u2192",Y.innerHTML=`<div class="vaultx-modal-error">${T?.error||"Failed to save place."}</div>`)}catch(T){O.disabled=!1,O.textContent="Save Place \u2192",Y.innerHTML=`<div class="vaultx-modal-error">${T.message||"Communication error."}</div>`}})};b()}function fe(e,n,i="https://digital-media-vault.vercel.app"){let s=document.getElementById(te);s&&s.remove();let v=document.createElement("div");v.id=te,v.className="vaultx-modal-backdrop";let c=document.createElement("div");c.className="vaultx-modal",c.innerHTML=`
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
  `,v.appendChild(c),document.body.appendChild(v),ce(c,c.querySelector(".vaultx-modal-header"));let m=()=>{v.remove(),document.removeEventListener("keydown",d)},d=t=>{t.key==="Escape"&&m()};document.addEventListener("keydown",d),c.querySelector(".vaultx-modal-close-btn")?.addEventListener("click",m),v.addEventListener("click",t=>{t.target===v&&m()});let u=c.querySelector("#vaultx-dynamic-step-container"),f=(t,r=!0)=>{u.innerHTML=`
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
        ${r?'<button type="button" class="vaultx-btn-primary" id="vaultx-err-retry">Retry</button>':""}
      </div>
    `,u.querySelector("#vaultx-err-cancel")?.addEventListener("click",m),u.querySelector("#vaultx-err-retry")?.addEventListener("click",l)},w=t=>{u.innerHTML=`
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
    `;let r=u.querySelector("#vaultx-auth-error-box"),o=u.querySelector("#vaultx-auth-autosync"),p=u.querySelector("#vaultx-inline-login-form"),x=u.querySelector("#vaultx-auth-id"),h=u.querySelector("#vaultx-auth-pw"),g=u.querySelector("#vaultx-auth-submit");u.querySelector("#vaultx-auth-cancel")?.addEventListener("click",m),o.addEventListener("click",async()=>{o.disabled=!0,o.innerHTML="<span>Detecting browser session...</span>",r.innerHTML="";try{let L=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});L&&L.success?l():(o.disabled=!1,o.innerHTML="<span>Auto-Detect Active Web Session</span>",r.innerHTML='<div class="vaultx-modal-error">No active web session found. Please sign in below.</div>',x.focus())}catch(L){o.disabled=!1,o.innerHTML="<span>Auto-Detect Active Web Session</span>",r.innerHTML=`<div class="vaultx-modal-error">${L.message||"Auto-detection failed."}</div>`}}),p.addEventListener("submit",async L=>{L.preventDefault();let y=x.value.trim(),M=h.value;if(!(!y||!M)){g.disabled=!0,g.textContent="Authorizing...",r.innerHTML="";try{let C=await chrome.runtime.sendMessage({action:"LOGIN",identifier:y,password:M});C&&C.success?l():(g.disabled=!1,g.textContent="Authorize & Unlock \u2192",r.innerHTML=`<div class="vaultx-modal-error">${C?.error||"Invalid credentials."}</div>`)}catch(C){g.disabled=!1,g.textContent="Authorize & Unlock \u2192",r.innerHTML=`<div class="vaultx-modal-error">${C.message||"Authorization failed."}</div>`}}})},E=()=>{u.innerHTML=`
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
    `;let t=u.querySelector("#vaultx-2fa-form"),r=u.querySelector("#vaultx-totp-input"),o=u.querySelector("#vaultx-2fa-submit"),p=u.querySelector("#vaultx-2fa-error-box");setTimeout(()=>r?.focus(),80),u.querySelector("#vaultx-2fa-cancel")?.addEventListener("click",m),t.addEventListener("submit",async x=>{x.preventDefault();let h=r.value.trim();if(h.length!==6){p.innerHTML='<div class="vaultx-modal-error">Please enter all 6 digits.</div>';return}o.disabled=!0,o.textContent="Verifying...";try{let g=await chrome.runtime.sendMessage({action:"VERIFY_2FA",code:h});g&&g.success?b():(o.disabled=!1,o.textContent="Unlock Vault \u2192",p.innerHTML=`<div class="vaultx-modal-error">${g?.error||"Invalid 6-digit code. Please check your app."}</div>`,r.value="",r.focus())}catch(g){o.disabled=!1,o.textContent="Unlock Vault \u2192",p.innerHTML=`<div class="vaultx-modal-error">${g.message||"Error communicating with extension."}</div>`}})},b=async()=>{u.innerHTML=`
      <div style="text-align:center; padding: 20px 0; color: #94a3b8; font-size: 13px;">
        <div style="margin-bottom:6px; animation: vaultx-pulse 1s infinite ease-in-out;">\u{1F4C2}</div>
        <div>Loading Secret Vault folders...</div>
      </div>
    `;try{let t=await chrome.runtime.sendMessage({action:"LIST_VAULT_FOLDERS"});if(!t||!t.success){t?.needAuth?w(t.error):f(t?.error||"Failed to fetch vault folders.");return}let r=t.data||[];if(r.length===0){k();return}u.innerHTML=`
        <div>
          <label class="vaultx-label">Select Destination Vault Folder:</label>
          <div class="vaultx-folders-list" id="vaultx-folder-list-wrap">
            ${r.map(o=>`
                <div class="vaultx-folder-item" data-folder-id="${o.id}" data-folder-name="${o.name}" data-folder-color="${o.color||"#3b82f6"}">
                  <div class="vaultx-folder-left">
                    <div class="vaultx-folder-dot" style="background-color: ${o.color||"#3b82f6"};"></div>
                    <span class="vaultx-folder-name">${o.name}</span>
                  </div>
                  <span class="vaultx-folder-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span>${o.cellCount||0} links</span>
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
      `,u.querySelector("#vaultx-step2-cancel")?.addEventListener("click",m),u.querySelector("#vaultx-new-folder-btn")?.addEventListener("click",k),u.querySelectorAll(".vaultx-folder-item").forEach(o=>{o.addEventListener("click",()=>{let p=o.getAttribute("data-folder-id"),x=o.getAttribute("data-folder-name"),h=o.getAttribute("data-folder-color");a(p,x,h)})})}catch(t){f(t.message||"Could not load folders.")}},k=()=>{u.innerHTML=`
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
    `,u.querySelector("#vaultx-create-folder-back")?.addEventListener("click",b);let t=u.querySelector("#vaultx-create-folder-form"),r=u.querySelector("#vaultx-new-folder-name"),o=u.querySelector("#vaultx-new-folder-pw"),p=u.querySelector("#vaultx-create-folder-submit"),x=u.querySelector("#vaultx-create-folder-error");setTimeout(()=>r?.focus(),80),t.addEventListener("submit",async h=>{h.preventDefault();let g=r.value.trim(),L=o.value.trim();if(!g||L.length<4){x.innerHTML='<div class="vaultx-modal-error">Folder password must be at least 4 characters.</div>';return}p.disabled=!0,p.textContent="Creating...";try{let y=await chrome.runtime.sendMessage({action:"CREATE_VAULT_FOLDER",data:{name:g,password:L,color:"#6366f1"}});y&&y.success&&y.data?a(y.data.id,y.data.name,y.data.color||"#6366f1",L):(p.disabled=!1,p.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${y?.error||"Failed to create folder."}</div>`)}catch(y){p.disabled=!1,p.textContent="Create & Continue \u2192",x.innerHTML=`<div class="vaultx-modal-error">${y.message||"Error creating folder."}</div>`}})},a=(t,r,o,p="")=>{u.innerHTML=`
      <form id="vaultx-save-cell-form">
        <!-- Target Folder Indicator -->
        <div style="display:flex; align-items:center; gap:8px; background:#1e293b; border-radius:10px; padding:8px 12px; margin-bottom:14px;">
          <div class="vaultx-folder-dot" style="background-color:${o};"></div>
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
    `;let x=u.querySelector("#vaultx-save-cell-form"),h=u.querySelector("#vaultx-folder-pw-input"),g=u.querySelector("#vaultx-cell-title-input"),L=u.querySelector("#vaultx-cell-notes-input"),y=u.querySelector("#vaultx-save-submit"),M=u.querySelector("#vaultx-save-error-box");setTimeout(()=>{p?g?.focus():h?.focus()},80),u.querySelector("#vaultx-save-back")?.addEventListener("click",b),x.addEventListener("submit",async C=>{C.preventDefault();let B=h.value.trim(),H=g.value.trim()||n||e,_=L.value.trim()||void 0;if(!B){M.innerHTML='<div class="vaultx-modal-error">Please enter the folder password.</div>';return}y.disabled=!0,y.textContent="Verifying Password...";try{let D=await chrome.runtime.sendMessage({action:"UNLOCK_VAULT_FOLDER",folderId:t,password:B});if(!D||!D.success){y.disabled=!1,y.textContent="Unlock & Save Link",M.innerHTML=`<div class="vaultx-modal-error">${D?.error||"Incorrect folder password."}</div>`,h.focus();return}y.textContent="Saving Link...";let W=await chrome.runtime.sendMessage({action:"CREATE_VAULT_CELL",folderId:t,data:{url:e,title:H,notes:_}});W&&W.success?(m(),q({title:H,message:`\u2713 Saved in Secret Vault / ${r}`,url:`${i}/vault`,isError:!1})):(y.disabled=!1,y.textContent="Unlock & Save Link",M.innerHTML=`<div class="vaultx-modal-error">${W?.error||"Failed to save link in folder."}</div>`)}catch(D){y.disabled=!1,y.textContent="Unlock & Save Link",M.innerHTML=`<div class="vaultx-modal-error">${D.message||"Error saving link."}</div>`}})},l=async()=>{try{let t=await chrome.runtime.sendMessage({action:"CHECK_AUTH"});if(!t||!t.isAuthenticated){let o=await chrome.runtime.sendMessage({action:"SYNC_SESSION"});if(!o||!o.success){w();return}}let r=await chrome.runtime.sendMessage({action:"GET_2FA_STATUS"});if(!r||!r.success){r?.needAuth?w(r.error):f(r?.error||"Failed to connect to Secret Vault.");return}r.data?.enabled?E():b()}catch(t){f(t.message||"Failed to connect to extension.")}};l()}chrome.runtime.onMessage.addListener((e,n,i)=>{if(e.action==="EXTRACT_PAGE_PRODUCT"){try{let s=se();i({success:!0,data:s})}catch(s){i({success:!1,error:s.message})}return!0}else e.action==="SHOW_TOAST"?q(e):e.action==="OPEN_VAULT_SAVE_MODAL"?fe(e.url||window.location.href,e.title||document.title,e.webUrl):e.action==="OPEN_PLACE_SAVE_MODAL"&&de(e.url||window.location.href)});function J(){if(re()){let e=document.getElementById(G);e&&e.remove();let n=document.getElementById(z);n&&n.remove(),xe()}else if(le()){let e=document.getElementById(G);e&&e.remove();let n=document.getElementById(j);n&&n.remove(),pe()}else if(ie()){let e=document.getElementById(z);e&&e.remove();let n=document.getElementById(j);n&&n.remove(),me()}else{let e=document.getElementById(G);e&&e.remove();let n=document.getElementById(z);n&&n.remove();let i=document.getElementById(j);i&&i.remove()}}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",J):J();var oe=location.href;new MutationObserver(()=>{let e=location.href;e!==oe&&(oe=e,setTimeout(J,1e3))}).observe(document,{subtree:!0,childList:!0});})();

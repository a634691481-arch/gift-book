/* eslint-disable */
// @ts-nocheck
export function bootGuestScreen() {

      /**
       * 绠€鏄撶紦瀛樼鐞嗗櫒
       */
      const CacheManager = {
        CACHE_NAME: "guest-screen-qr-cache",
        SETTINGS_KEY: "guest-screen-settings",

        async storeImage(key, file) {
          try {
            const cache = await caches.open(this.CACHE_NAME);
            const response = new Response(file);
            await cache.put(key, response);
            console.log(`Image ${key} stored in cache.`);
          } catch (error) {
            console.error(`Failed to store image ${key}:`, error);
          }
        },

        async getImage(key) {
          try {
            const cache = await caches.open(this.CACHE_NAME);
            const response = await cache.match(key);
            if (response) {
              return response.blob();
            }
            return null;
          } catch (error) {
            console.error(`Failed to get image ${key}:`, error);
            return null;
          }
        },

        // 鏂板: 鍒犻櫎鍥剧墖缂撳瓨
        async deleteImage(key) {
          try {
            const cache = await caches.open(this.CACHE_NAME);
            await cache.delete(key);
            console.log(`Image ${key} deleted from cache.`);
          } catch (error) {
            console.error(`Failed to delete image ${key}:`, error);
          }
        },

        storeSettings(settings) {
          try {
            const currentSettings = this.getSettings();
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(newSettings));
          } catch (error) {
            console.error("Failed to store settings:", error);
          }
        },

        getSettings() {
          try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            const defaults = { layout: "hidden", customText: "" };
            return settings ? { ...defaults, ...JSON.parse(settings) } : defaults;
          } catch (error) {
            console.error("Failed to get settings:", error);
            return { layout: "hidden", customText: "" };
          }
        },
      };

      // 宸ュ叿鍑芥暟锛氶殣钘忓鍚?
      function maskName(name, hidePrivacy, isLatest) {
        if (!hidePrivacy || isLatest) {
          return name;
        }
        const nameLength = name.length;
        if (nameLength <= 1) return name;
        if (nameLength === 2) return name[0] + "**";
        if (nameLength === 3) return name[0] + "**";
        return name.substring(0, 2) + "**";
      }

      // 鍓睆鐘舵€佺鐞?
      class GuestScreen {
        constructor() {
          this.currentData = null;
          this.cacheDOMElements();
        }

        cacheDOMElements() {
          const $ = (id) => document.getElementById(id);
          this.appContainer = $("app-container");
          this.eventTitle = $("event-title");
          this.giftBookContent = $("gift-book-content");
          this.fullscreenBtn = $("fullscreen-btn");
          this.fullscreenIcon = $("fullscreen-icon");
          this.fullscreenHint = $("fullscreen-hint");

          this.layoutRoot = $("layout-root");
          this.qrCodeArea = $("qr-code-area");
          this.qrAlipayContainer = $("alipay-qr-container");
          this.qrWechatContainer = $("wechat-qr-container");
          this.qrAlipayImg = $("qr-alipay-img");
          this.qrWechatImg = $("qr-wechat-img");
          this.customTextDisplay = $("custom-text-display");

          this.settingsBtn = $("settings-btn");
          this.modalContainer = $("modal-container");
          this.modal = $("modal");
          this.modalTitle = $("modal-title");
          this.modalContent = $("modal-content");
          this.modalActions = $("modal-actions");

          this.pendingAlipayFile = null;
          this.pendingWechatFile = null;
          // 鏂板: 鏍囪鏄惁娓呯┖
          this.alipayCleared = false;
          this.wechatCleared = false;
        }

        init() {
          window.addEventListener("message", (e) => this.handleMessage(e));
          window.opener?.postMessage({ type: "guest_screen_ready" }, "*");
          this.bindControlEvents();
          this.loadAndApplySettings();
        }

        bindControlEvents() {
          document.addEventListener("fullscreenchange", () => {
            if (document.fullscreenElement) {
              this.fullscreenHint.style.display = "none";
              this.fullscreenIcon.className = "ri-fullscreen-exit-line text-2xl";
            } else {
              this.fullscreenIcon.className = "ri-fullscreen-line text-2xl";
            }
          });

          this.fullscreenBtn.addEventListener("click", () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
              });
            } else {
              document.exitFullscreen();
            }
          });

          this.settingsBtn.addEventListener("click", () => this.showSettingsModal());
        }

        handleMessage(event) {
          const { type, data } = event.data || {};
          switch (type) {
            case "guest_screen_update":
              this.updateDisplay(data);
              break;
            case "guest_screen_heartbeat":
              break;
          }
        }

        updateDisplay(data) {
          if (!data) return;
          this.currentData = data;
          document.body.className = data.theme || "theme-festive";
          this.eventTitle.textContent = data.eventName || "绀肩翱";
          this.renderGiftBook(data);
          this.appContainer.classList.remove("hidden");
        }

        renderGiftBook(data) {
          const { gifts, hidePrivacy, typeText } = data;
          const ITEMS_PER_PAGE = 12;
          const latestGiftId = gifts[gifts.length - 1]?.id;
          const displayGifts = [...gifts];
          while (displayGifts.length < ITEMS_PER_PAGE) {
            displayGifts.push(null);
          }
          const nameRow = document.createElement("div");
          nameRow.className = "gift-book-row";
          const typeRow = document.createElement("div");
          typeRow.className = "gift-book-row";
          const amountRow = document.createElement("div");
          amountRow.className = "gift-book-row";
          displayGifts.forEach((gift) => {
            const nameCell = document.createElement("div");
            nameCell.className = "book-cell name-cell";
            if (gift) {
              const isLatest = gift.id === latestGiftId;
              const displayName = maskName(gift.name, hidePrivacy, isLatest);
              const formattedName = displayName.length === 2 ? `${displayName[0]}\u3000${displayName[1]}` : displayName;
              nameCell.innerHTML = `<div class="name ${displayName.length > 4 ? "scale" : ""}">${formattedName}</div>`;
              if (isLatest) nameCell.classList.add("latest-entry");
            }
            nameRow.appendChild(nameCell);
            const typeCell = document.createElement("div");
            typeCell.className = "book-cell type-cell";
            typeCell.textContent = typeText || "璐虹ぜ";
            typeRow.appendChild(typeCell);
            const amountCell = document.createElement("div");
            amountCell.className = "book-cell amount-cell";
            if (gift) {
              const amountChinese = gift.amountChinese;
              amountCell.innerHTML = `
                <div class="amount-chinese ${amountChinese.length > 16 ? "scale" : ""}">${amountChinese}</div>
                <div class="amount-numeric ${Math.abs(gift.amount).toString().length > 8 ? "scale" : ""}">锟?{gift.amount}</div>
              `;
              if (gift.id === latestGiftId) amountCell.classList.add("latest-entry");
            }
            amountRow.appendChild(amountCell);
          });
          this.giftBookContent.innerHTML = "";
          this.giftBookContent.append(nameRow, typeRow, amountRow);
        }

        async loadAndApplySettings() {
          const settings = CacheManager.getSettings();
          const alipayBlob = await CacheManager.getImage("alipay-qr");
          const wechatBlob = await CacheManager.getImage("wechat-qr");
          const customText = settings.customText || "";

          const hasContent = !!alipayBlob || !!wechatBlob || (customText && customText.trim() !== "");
          this.applyLayout(settings.layout, hasContent);

          if (alipayBlob) {
            this.qrAlipayImg.src = URL.createObjectURL(alipayBlob);
            this.qrAlipayContainer.style.display = "flex";
          } else {
            this.qrAlipayImg.src = "";
            this.qrAlipayContainer.style.display = "none";
          }
          if (wechatBlob) {
            this.qrWechatImg.src = URL.createObjectURL(wechatBlob);
            this.qrWechatContainer.style.display = "flex";
          } else {
            this.qrWechatImg.src = "";
            this.qrWechatContainer.style.display = "none";
          }
          this.customTextDisplay.innerHTML = customText;
        }

        applyLayout(layout, hasContent) {
          this.layoutRoot.classList.remove("flex-row", "flex-row-reverse");
          const showQrArea = layout !== "hidden" && hasContent;
          if (showQrArea) {
            this.qrCodeArea.style.display = "flex";
            if (layout === "left") this.layoutRoot.classList.add("flex-row");
            else if (layout === "right") this.layoutRoot.classList.add("flex-row-reverse");
          } else {
            this.qrCodeArea.style.display = "none";
          }
        }

        async showSettingsModal() {
          this.pendingAlipayFile = null;
          this.pendingWechatFile = null;
          this.alipayCleared = false; // 閲嶇疆鐘舵€?
          this.wechatCleared = false; // 閲嶇疆鐘舵€?

          const settings = CacheManager.getSettings();
          const currentLayout = settings.layout || "hidden";
          const customText = settings.customText || "";

          const alipayBlob = await CacheManager.getImage("alipay-qr");
          const wechatBlob = await CacheManager.getImage("wechat-qr");
          const alipaySrc = alipayBlob ? URL.createObjectURL(alipayBlob) : "";
          const wechatSrc = wechatBlob ? URL.createObjectURL(wechatBlob) : "";

          this.modalTitle.textContent = "鍓睆鏄剧ず璁剧疆";
          this.modalContent.innerHTML = `
            <div class="space-y-6 text-left">
              <div>
                <label class="block text-sm font-medium text-gray-700">鏄剧ず鏀舵鐮?/label>
                <div class="flex space-x-4 mt-2">
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="layout-position" value="hidden" class="themed-text-radio themed-ring" ${currentLayout === "hidden" ? "checked" : ""}>
                    <span>涓嶆樉绀?/span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="layout-position" value="left" class="themed-text-radio themed-ring" ${currentLayout === "left" ? "checked" : ""}>
                    <span>宸︿晶鏄剧ず</span>
                  </label>
                  <label class="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="layout-position" value="right" class="themed-text-radio themed-ring" ${currentLayout === "right" ? "checked" : ""}>
                    <span>鍙充晶鏄剧ず</span>
                  </label>
                </div>
              </div>

              <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <label class="block text-sm font-medium text-gray-700">鏀粯瀹?鏀舵鐮?/label>
                    <button id="alipay-clear-btn" class="text-xs text-red-600 hover:underline ${alipaySrc ? "" : "hidden"}">娓呯┖</button>
                  </div>
                  <input type="file" id="alipay-upload" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300">
                  <img id="alipay-preview" src="${alipaySrc}" class="mt-2 rounded-lg ${alipaySrc ? "" : "hidden"} max-w-full h-auto max-h-32 object-contain border p-1 bg-white">
                </div>
                <div class="flex-1">
                  <div class="flex justify-between items-center mb-1">
                    <label class="block text-sm font-medium text-gray-700">寰俊 鏀舵鐮?/label>
                    <button id="wechat-clear-btn" class="text-xs text-red-600 hover:underline ${wechatSrc ? "" : "hidden"}">娓呯┖</button>
                  </div>
                  <input type="file" id="wechat-upload" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300">
                  <img id="wechat-preview" src="${wechatSrc}" class="mt-2 rounded-lg ${wechatSrc ? "" : "hidden"} max-w-full h-auto max-h-32 object-contain border p-1 bg-white">
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700">鑷畾涔夋枃瀛?/label>
                <div id="pell-editor-container" class="mt-1"></div>
              </div>
            </div>
          `;

          this.modalActions.innerHTML = `
            <button id="modal-cancel-btn" class="themed-button-secondary">鍙栨秷</button>
            <button id="modal-save-btn" class="themed-button-primary">淇濆瓨璁剧疆</button>
          `;

          if (!window.pell) {
            console.error("Pell.js 鏈姞杞?");
            return;
          }

          const editor = window.pell.init({
            element: document.getElementById("pell-editor-container"),
            onChange: () => {},
            defaultParagraphSeparator: "div",
            styleWithCSS: false,
            actions: [
              { icon: '<i class="ri-bold" title="鍔犵矖"></i>', title: "Bold", result: () => window.pell.exec("bold") },
              { icon: '<i class="ri-italic" title="鏂滀綋"></i>', title: "Italic", result: () => window.pell.exec("italic") },
              { icon: '<i class="ri-underline" title="涓嬪垝绾?></i>', title: "Underline", result: () => window.pell.exec("underline") },
            ],
          });
          editor.content.innerHTML = customText;

          const actionbar = document.getElementById("pell-editor-container").querySelector(".pell-actionbar");
          const select = document.createElement("select");
          select.className = "custom-pell-select";
          select.title = "瀛楀彿";
          select.innerHTML = `<option value="1">灏?/option><option value="3" selected>涓?/option><option value="5">澶?/option><option value="7">鐗瑰ぇ</option>`;
          select.onchange = () => {
            window.pell.exec("fontSize", select.value);
            editor.content.focus();
          };
          actionbar.appendChild(select);
          const colorInput = document.createElement("input");
          colorInput.type = "color";
          colorInput.className = "custom-pell-color";
          colorInput.title = "鏂囧瓧棰滆壊";
          colorInput.value = "var(--primary-color)";
          colorInput.onchange = () => {
            window.pell.exec("foreColor", colorInput.value);
            editor.content.focus();
          };
          actionbar.appendChild(colorInput);
          const updateToolbarState = () => {
            const size = document.queryCommandValue("fontSize") || "3";
            if (select.value !== size) select.value = size;
          };
          editor.content.addEventListener("keyup", updateToolbarState);
          editor.content.addEventListener("mouseup", updateToolbarState);

          document.getElementById("modal-cancel-btn").onclick = () => this.closeSettingsModal();
          document.getElementById("modal-save-btn").onclick = () => this.handleSaveSettings(editor);
          document.getElementById("alipay-upload").onchange = (e) => this.handleFilePreview(e, "alipay");
          document.getElementById("wechat-upload").onchange = (e) => this.handleFilePreview(e, "wechat");
          document.getElementById("alipay-clear-btn").onclick = () => this.handleClearPreview("alipay");
          document.getElementById("wechat-clear-btn").onclick = () => this.handleClearPreview("wechat");

          this.modalContainer.classList.remove("hidden");
        }

        handleClearPreview(type) {
          const preview = document.getElementById(`${type}-preview`);
          const uploadInput = document.getElementById(`${type}-upload`);
          const clearBtn = document.getElementById(`${type}-clear-btn`);

          preview.src = "";
          preview.classList.add("hidden");
          uploadInput.value = "";
          clearBtn.classList.add("hidden");

          if (type === "alipay") {
            this.pendingAlipayFile = null;
            this.alipayCleared = true;
          } else if (type === "wechat") {
            this.pendingWechatFile = null;
            this.wechatCleared = true;
          }
        }

        closeSettingsModal() {
          this.modalContainer.classList.add("hidden");
          this.modalContent.innerHTML = "";
          this.modalActions.innerHTML = "";
        }

        handleFilePreview(event, type) {
          const file = event.target.files[0];
          if (!file) return;

          if (type === "alipay") {
            this.pendingAlipayFile = file;
            this.alipayCleared = false;
          }
          if (type === "wechat") {
            this.pendingWechatFile = file;
            this.wechatCleared = false;
          }

          const preview = document.getElementById(`${type}-preview`);
          const clearBtn = document.getElementById(`${type}-clear-btn`);
          const oldSrc = preview.src;
          preview.src = URL.createObjectURL(file);
          preview.classList.remove("hidden");
          clearBtn.classList.remove("hidden");

          preview.onload = () => {
            if (oldSrc.startsWith("blob:")) {
              URL.revokeObjectURL(oldSrc);
            }
          };
        }

        async handleSaveSettings(editor) {
          try {
            // 1. 鏍规嵁鏍囪鍜屾柊鏂囦欢鏇存柊鍥剧墖
            if (this.alipayCleared) {
              await CacheManager.deleteImage("alipay-qr");
            } else if (this.pendingAlipayFile) {
              await CacheManager.storeImage("alipay-qr", this.pendingAlipayFile);
            }

            if (this.wechatCleared) {
              await CacheManager.deleteImage("wechat-qr");
            } else if (this.pendingWechatFile) {
              await CacheManager.storeImage("wechat-qr", this.pendingWechatFile);
            }

            // 2. 淇濆瓨甯冨眬鍜屾枃瀛?
            const layout = document.querySelector('input[name="layout-position"]:checked').value;
            const customText = editor.content.innerHTML;
            CacheManager.storeSettings({ layout, customText });

            // 3. 閲嶆柊鍔犺浇骞跺簲鐢?
            await this.loadAndApplySettings();

            // 4. 鍏抽棴寮圭獥
            this.closeSettingsModal();
          } catch (error) {
            console.error("淇濆瓨璁剧疆澶辫触:", error);
            alert("淇濆瓨璁剧疆澶辫触锛岃閲嶈瘯銆?);
          }
        }
      }

      const guestScreen = new GuestScreen();
      guestScreen.init();

      document.addEventListener("keydown", (e) => {
        if (e.target.closest(".pell-content")) return;
        if (e.key === "F11") {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
              console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
          } else {
            document.exitFullscreen();
          }
        }
        if (e.key === "Escape" && !document.fullscreenElement) {
          if (confirm("纭畾瑕佸叧闂壇灞忓悧锛?)) {
            window.close();
          }
        }
      });
    
  return guestScreen;
}

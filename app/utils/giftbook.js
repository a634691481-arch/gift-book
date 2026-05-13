/* eslint-disable */
// @ts-nocheck
export function bootGiftBookApp() {

      /**
       * 搴旂敤閰嶇疆甯搁噺
       * 闆嗕腑绠＄悊鎵€鏈夊叏灞€閰嶇疆鍙傛暟锛屼究浜庣粺涓€缁存姢鍜岃皟鏁?
       */
      const CONFIG = {
        /**
         * 姣忛〉鏄剧ず鐨勭ぜ閲戣褰曟暟閲?
         * 褰卞搷锛?
         * - 涓荤晫闈㈢ぜ绨挎樉绀?
         * - 鎵撳嵃PDF姣忛〉瀹归噺
         * - 鍒嗛〉瀵艰埅璁＄畻
         */
        ITEMS_PER_PAGE: 12,

        /**
         * 绀肩翱灏侀潰鍥炬渶澶ф枃浠跺ぇ灏忥紙2MB锛?
         * 瓒呰繃姝ゅぇ灏忕殑鍥剧墖灏嗚鎷掔粷涓婁紶
         * 鍘熷洜锛氶伩鍏?IndexedDB 瀛樺偍鍘嬪姏鍜屾墦鍗版€ц兘闂
         */
        MAX_COVER_SIZE: 2 * 1024 * 1024,

        /**
         * 鎵撳嵃鍒嗘壒闃堝€硷紙1008 鏉¤褰?= 84 椤碉級
         * 瓒呰繃姝ゆ暟閲忓皢鍚敤鍒嗘壒鎵撳嵃妯″紡
         * 鍘熷洜锛?
         * - 闃叉娴忚鍣ㄦ覆鏌撳ぇ閲?DOM 瀵艰嚧鍗℃
         * - 閬垮厤鍐呭瓨婧㈠嚭
         * - 鎻愰珮鎵撳嵃鎴愬姛鐜?
         * 鍚屾椂鐢ㄤ簬 GridJS 琛ㄦ牸鍒嗛〉鍒ゆ柇
         */
        PRINT_SPLIT_THRESHOLD: 1008,
        APP_NAME: "鐢靛瓙绀肩翱绯荤粺 - 涓撲笟鐗?,
        DB_NAME: "GiftRegistryDB",
        DB_VERSION: 1,
        /**
         * 瀹惧绛夌骇绯荤粺閰嶇疆
         * 浣跨敤鏁扮粍瀛樺偍绛夌骇鍚嶇О锛岀储寮曞嵆涓虹瓑绾ф潈閲嶏紙鐢ㄤ簬鎺掑簭锛?
         * 绱㈠紩瓒婂ぇ锛岀瓑绾ц秺楂橈紝鍦ㄦ墦鍗?瀵煎嚭鏃舵帓鍚嶈秺闈犲墠
         * 绱㈠紩鑼冨洿锛?-4
         */
        GUEST_LEVELS: ["鏅", ...Array.from({ length: 100 }, (_, index) => `鎺掑簭${100 - index}`)],
        PASSWORD_CACHE_DURATION: 5,
      };

      const DEFAULT_PRINT_OPTIONS = Object.freeze({
        printCover: true,
        printEndPage: true,
        printAppendix: true,
        printSummary: true,
        printAbolished: true,
        showCoverTitle: true,
        pdfEngine: "browser",
      });

      /**
       * 宸ュ叿绫?- 鎻愪緵閫氱敤宸ュ叿鏂规硶
       * 闆嗕腑绠＄悊鏁版嵁鏍煎紡鍖栥€佽浆鎹㈢瓑閫氱敤鍔熻兘
       */
      class Utils {
        /**
         * 鏍煎紡鍖栭噾棰濅负浜烘皯甯佹牸寮?
         * @param {number} amount - 閲戦鏁板€?
         * @returns {string} 鏍煎紡鍖栧悗鐨勫瓧绗︿覆锛屽 "锟?,234.56"
         */
        static formatCurrency(amount) {
          return new Intl.NumberFormat("zh-CN", {
            style: "currency",
            currency: "CNY",
          }).format(amount || 0);
        }

        /**
         * 灏嗘暟瀛楅噾棰濊浆鎹负涓枃澶у啓閲戦
         * @param {number|string} n - 瑕佽浆鎹㈢殑閲戦
         * @returns {string} 涓枃澶у啓閲戦瀛楃涓?
         * @example
         */
        static amountToChinese(n) {
          if (typeof n !== "number" && typeof n !== "string") return "";
          n = parseFloat(n);
          if (isNaN(n) || n === null) return "";
          if (n === 0) return "闆跺厓鏁?;

          let unit = "浜嚎涓囦粺浣版嬀鍏嗕竾浠熶桨鎷句嚎浠熶桨鎷句竾浠熶桨鎷惧厓瑙掑垎";
          let str = "";
          let s = n.toString();

          if (s.indexOf(".") > -1) s = (n * 100).toFixed(0);
          else s += "00";

          if (s.length > unit.length) return "閲戦杩囧ぇ";
          unit = unit.substr(unit.length - s.length);

          for (let i = 0; i < s.length; i++) {
            str += "闆跺９璐板弫鑲嗕紞闄嗘煉鎹岀帠".charAt(s.charAt(i)) + unit.charAt(i);
          }

          return str
            .replace(/闆?浠焲浣皘鎷緗瑙?/g, "闆?)
            .replace(/(闆?+/g, "闆?)
            .replace(/闆?鍏唡涓噟浜縷鍏?/g, "$1")
            .replace(/(鍏唡浜?涓?g, "$1")
            .replace(/(浜瑋鍏?浜?g, "$1")
            .replace(/(浜?鍏?g, "$1")
            .replace(/(浜?涓?g, "$1")
            .replace(/(浜瑋鍏唡浜縷浠焲浣皘鎷?(涓?)(.)/g, "$1$2$3")
            .replace(/闆跺厓/g, "鍏?)
            .replace(/闆跺垎/g, "")
            .replace(/闆惰/g, "闆?)
            .replace(/鍏?/g, "鍏冩暣")
            .replace(/瑙?/g, "瑙掓暣");
        }

        /**
         * 灏嗘枃浠惰鍙栦负 Base64 缂栫爜瀛楃涓?
         * @param {File} file - 瑕佽鍙栫殑鏂囦欢瀵硅薄
         * @returns {Promise<string>} Base64 缂栫爜鐨勬暟鎹?URL锛堝寘鍚?data:image/...;base64, 鍓嶇紑锛?
         * @throws {Error} 鏂囦欢璇诲彇澶辫触鏃舵姏鍑洪敊璇?
         * 鐢ㄩ€旓細灏嗙ぜ绨垮皝闈㈠浘瀛樺偍鍒?IndexedDB
         */
        static async readFileAsBase64(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        /**
         * 鑾峰彇褰撳墠鏃ユ湡鏃堕棿鐨勬牸寮忓寲瀛楃涓?
         * @returns {{date: string, time: string}} 鍖呭惈 date 鍜?time 鐨勫璞?
         * @example
         *   Utils.getCurrentDateTime()
         *   // => { date: "2025-10-12", time: "14:30" }
         * 鐢ㄩ€旓細涓哄垱寤轰簨椤硅〃鍗曡缃粯璁ゆ椂闂?
         */
        static getCurrentDateTime() {
          const now = new Date();
          const pad = (num) => num.toString().padStart(2, "0");
          const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
          const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
          return { date, time };
        }

        /**
         */
        static getEventDateInfo(dateInput) {
          const date = new Date(dateInput);
          if (Number.isNaN(date.getTime())) {
            return { date, formattedDisplay: "", localeDate: "" };
          }
          const formattedDisplay = `${date.getFullYear()}骞?{date.getMonth() + 1}鏈?{date.getDate()}鏃;
          return {
            date,
            formattedDisplay,
            localeDate: date.toLocaleDateString("zh-CN"),
          };
        }

        /**
         * 鐢熸垚鐢ㄤ簬鏂囦欢鍚嶇殑鏃堕棿鎴?
         * @param {Date} date
         * @returns {string} yyyy-mm-dd hh:mm:ss
         */
        static formatTimestampForFilename(date = new Date()) {
          const pad = (num) => num.toString().padStart(2, "0");
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        }

        /**
         * @returns {boolean}
         */
        static isMobile() {
          // 涓€涓€氱敤涓斿彲闈犵殑绉诲姩璁惧妫€娴嬫柟娉?
          return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        }
      }

      /**
       * 鍔犲瘑绠＄悊鍣?- 澶勭悊鎵€鏈夊姞瀵嗙浉鍏虫搷浣?
       * 浣跨敤 CryptoJS 搴撳疄鐜?AES 鍔犲瘑鍜?SHA-256 鍝堝笇
       * 鐢ㄩ€旓細淇濇姢绀奸噾鏁版嵁鐨勯殣绉佹€у拰瀹屾暣鎬?
       */
      class CryptoService {
        /**
         * 鍔犲瘑鏁版嵁 - 浣跨敤 AES 瀵圭О鍔犲瘑绠楁硶
         * @param {Object} data - 瑕佸姞瀵嗙殑鏁版嵁瀵硅薄锛堜細鍏堣浆涓篔SON瀛楃涓诧級
         * @param {string} key - 鍔犲瘑瀵嗛挜锛堢敤鎴疯緭鍏ョ殑瀵嗙爜锛?
         * @returns {string} 鍔犲瘑鍚庣殑瀵嗘枃瀛楃涓?
         */
        static encrypt(data, key) {
          return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
        }

        /**
         * 瑙ｅ瘑鏁版嵁 - 浣跨敤 AES 瀵圭О瑙ｅ瘑绠楁硶
         * @param {string} ciphertext - 瀵嗘枃瀛楃涓?
         * @param {string} key - 瑙ｅ瘑瀵嗛挜锛堝繀椤讳笌鍔犲瘑鏃剁殑瀵嗛挜涓€鑷达級
         * @returns {Object|null} 瑙ｅ瘑鍚庣殑鏁版嵁瀵硅薄锛屽け璐ユ椂杩斿洖 null
         */
        static decrypt(ciphertext, key) {
          try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, key);
            return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
          } catch (e) {
            console.error("瑙ｅ瘑澶辫触:", e);
            return null; // 瀵嗛挜閿欒鎴栨暟鎹崯鍧忔椂杩斿洖null
          }
        }

        /**
         * 鍝堝笇瀵嗙爜 - 浣跨敤 SHA-256 鍗曞悜鍝堝笇绠楁硶
         * @param {string} password - 鍘熷瀵嗙爜
         * @returns {string} 鍝堝笇鍊硷紙鐢ㄤ簬瀵嗙爜楠岃瘉锛屼笉鍙€嗭級
         * 娉ㄦ剰锛氬搱甯屽€煎瓨鍌ㄥ湪鏁版嵁搴撲腑锛岀敤浜庨獙璇佸瘑鐮佽€屼笉瀛樺偍鏄庢枃
         */
        static hash(password) {
          return CryptoJS.SHA256(password).toString();
        }
      }

      /**
       * 鏁版嵁搴撶鐞嗗櫒 - IndexedDB 灏佽
       * 鎻愪緵瀵规祻瑙堝櫒鏈湴鏁版嵁搴撶殑缁熶竴鎿嶄綔鎺ュ彛
       * 瀛樺偍缁撴瀯锛?
       *   - events: 浜嬮」淇℃伅锛堝寘鍚悕绉般€佹椂闂淬€佸瘑鐮佸搱甯屻€佷富棰樼瓑锛?
       *   - gifts: 绀奸噾璁板綍锛堝寘鍚姞瀵嗘暟鎹拰鍏宠仈鐨勪簨椤笽D锛?
       */
      class DBManager {
        /**
         */
        constructor() {
          this.db = null; // IndexedDB 鏁版嵁搴撹繛鎺ュ璞?
        }

        /**
         * 鍒濆鍖栨暟鎹簱 - 鎵撳紑鎴栧垱寤?IndexedDB 鏁版嵁搴?
         * @returns {Promise<void>} 鍒濆鍖栧畬鎴愬悗 resolve
         */
        async init() {
          return new Promise((resolve, reject) => {
            const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);

            request.onerror = () => reject(request.error);

            request.onsuccess = () => {
              this.db = request.result;
              // 鍒濆鍖栨垚鍔熷悗锛岀洿鎺?resolve 鍗冲彲锛屾棤闇€杩斿洖浠讳綍淇℃伅
              resolve();
            };

            // 鏁版嵁搴撳崌绾т簨浠?- 浠呭湪棣栨鍒涘缓鏁版嵁搴撴椂瑙﹀彂
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              console.log("棣栨鍒涘缓鏁版嵁搴擄紝鐗堟湰:", db.version);

              // 1. 鍒涘缓 events 琛?
              if (!db.objectStoreNames.contains("events")) {
                db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
              }

              // 2. 鍒涘缓 gifts 琛ㄥ苟寤虹珛鎵€鏈夐渶瑕佺殑绱㈠紩
              if (!db.objectStoreNames.contains("gifts")) {
                const giftStore = db.createObjectStore("gifts", { keyPath: "id", autoIncrement: true });
                giftStore.createIndex("eventId", "eventId", { unique: false });
                giftStore.createIndex("byEventAndLevel", ["eventId", "guestLevelWeight", "levelUpdateTime", "id"], { unique: false });
              }
            };
          });
        }

        /**
         * 鏍规嵁澶嶅悎绱㈠紩杩涜鎺掑簭鏌ヨ
         * @param {string} storeName 琛ㄥ悕
         * @param {string} indexName 绱㈠紩鍚?
         * @param {*} key1 澶嶅悎绱㈠紩鐨勭涓€涓敭 (eventId)
         * @returns {Promise<Array>} 鎺掑簭鍚庣殑缁撴灉鏁扮粍
         *
         * 鎺掑簭閫昏締锛堢敱 IndexedDB 绱㈠紩鑷姩瀹屾垚锛?
         * 1. 鎸?guestLevelWeight 闄嶅簭 (绛夌骇楂樼殑鍦ㄥ墠)
         * 2. 鐩稿悓绛夌骇鍐呮寜 levelUpdateTime 闄嶅簭 (淇敼杩囩瓑绾х殑鍦ㄥ墠锛? 鎺掑湪鍚?
         * 3. levelUpdateTime 鐩稿悓鏃舵寜 id 鍗囧簭 (褰曞叆椤哄簭)
         *
         * 娉ㄦ剰锛氫负浜嗗疄鐜伴檷搴忥紝闇€瑕佸湪鍐呭瓨涓繘琛屾帓搴忥紝鍥犱负 IndexedDB 绱㈠紩鍙敮鎸佸崌搴?
         */
        async getAllByCompoundIndex(storeName, indexName, key1) {
          const transaction = this.db.transaction(storeName, "readonly");
          const store = transaction.objectStore(storeName);
          const index = store.index(indexName);

          return new Promise((resolve, reject) => {
            const results = [];
            // 浣跨敤娓告爣閬嶅巻锛屽彧鑾峰彇鍖归厤 eventId 鐨勮褰?
            const range = IDBKeyRange.bound([key1, -Infinity, -Infinity, -Infinity], [key1, Infinity, Infinity, Infinity]);

            const request = index.openCursor(range);

            request.onsuccess = (event) => {
              const cursor = event.target.result;
              if (cursor) {
                results.push(cursor.value);
                cursor.continue();
              } else {
                // 鎺掑簭锛氱瓑绾ч檷搴?-> levelUpdateTime 闄嶅簭 -> id 鍗囧簭
                // 娉ㄦ剰锛氳繖閲屽繀椤绘帓搴忥紝鍥犱负 IndexedDB 绱㈠紩鍙兘鍗囧簭锛屾垜浠渶瑕侀檷搴?
                results.sort((a, b) => {
                  const weightDiff = (b.guestLevelWeight || 0) - (a.guestLevelWeight || 0);
                  if (weightDiff !== 0) return weightDiff;

                  // levelUpdateTime 闄嶅簭锛? 鎺掑湪鏈€鍚庯級
                  const aTime = a.levelUpdateTime || 0;
                  const bTime = b.levelUpdateTime || 0;
                  const timeDiff = bTime - aTime;
                  if (timeDiff !== 0) return timeDiff;

                  // id 鍗囧簭锛堝綍鍏ラ『搴忥級
                  return (a.id || 0) - (b.id || 0);
                });
                resolve(results);
              }
            };

            request.onerror = () => reject(request.error);
          });
        }
        /**
         */
        async add(storeName, data) {
          const transaction = this.db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.add(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }

        /**
         */
        async get(storeName, key) {
          const transaction = this.db.transaction(storeName, "readonly");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }

        /**
         */
        async getAll(storeName) {
          const transaction = this.db.transaction(storeName, "readonly");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }

        /**
         */
        async getAllByIndex(storeName, indexName, value) {
          const transaction = this.db.transaction(storeName, "readonly");
          const store = transaction.objectStore(storeName);
          const index = store.index(indexName);
          return new Promise((resolve, reject) => {
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }

        /**
         */
        async update(storeName, data) {
          const transaction = this.db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        }

        /**
         */
        async delete(storeName, key) {
          const transaction = this.db.transaction(storeName, "readwrite");
          const store = transaction.objectStore(storeName);
          return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      }

      /**
       * UI绠＄悊鍣?- DOM鎿嶄綔灏佽
       */
      class UIManager {
        constructor() {
          this.elements = this.cacheElements();
          this.elements.modalCloseBtn?.addEventListener("click", () => this.closeModal());
        }

        cacheElements() {
          const $ = (id) => document.getElementById(id);
          return {
            setupScreen: $("setup-screen"),
            mainScreen: $("main-screen"),
            eventSelector: $("event-selector"),
            unlockEventBtn: $("unlock-event-btn"),
            createEventForm: $("create-event-form"),
            addGiftForm: $("add-gift-form"),
            giftBookContent: $("gift-book-content"),
            totalAmountEl: $("total-amount"),
            pageSubtotalEl: $("page-subtotal"),
            totalGiversEl: $("total-givers"),
            pageInfoEl: $("page-info"),
            prevPageBtn: $("prev-page-btn"),
            nextPageBtn: $("next-page-btn"),
            currentEventTitleEl: $("current-event-title"),
            eventSwitcherTrigger: $("event-switcher-trigger"),
            eventDropdown: $("event-dropdown"),
            printBtn: $("print-btn"),
            exportExcelBtn: $("export-excel-btn"),
            statsBtn: $("stats-btn"),
            searchNameInput: $("search-name"),
            searchIcon: $("search-icon"),
            selectEventSection: $("select-event-section"),
            speechToggle: $("speech-toggle"),
            modalContainer: $("modal-container"),
            modal: $("modal"),
            modalTitle: $("modal-title"),
            modalContent: $("modal-content"),
            modalActions: $("modal-actions"),
            modalCloseBtn: $("modal-close-btn"),
            guestNameInput: $("guest-name"),
            giftAmountInput: $("gift-amount"),
            eventNameInput: $("event-name"),
            startDateInput: $("start-date"),
            startTimeInput: $("start-time"),
            endDateInput: $("end-date"),
            endTimeInput: $("end-time"),
            adminPasswordInput: $("admin-password"),
            eventThemeSelect: $("event-theme"),
            eventVoiceSelect: $("event-voice"),
            previewCreateVoiceBtn: $("preview-create-voice-btn"),
            fullscreenBtn: $("fullscreen-btn"),
            fullscreenIcon: $("fullscreen-icon"),
            supportBtn: $("support-btn"),
          };
        }

        showScreen(screen) {
          if (screen === "setup") {
            this.elements.mainScreen.classList.add("hidden");
            this.elements.setupScreen.classList.remove("hidden");
          } else if (screen === "main") {
            this.elements.setupScreen.classList.add("hidden");
            this.elements.mainScreen.classList.remove("hidden");
          }
        }

        /**
         * 鏄剧ず妯℃€佸璇濇 - 缁熶竴鐨勫脊绐楁樉绀烘帴鍙?
         * @param {string} title - 瀵硅瘽妗嗘爣棰橈紙鏀寔HTML锛?
         * @param {string} content - 瀵硅瘽妗嗗唴瀹癸紙鏀寔HTML锛?
         * @param {Array<Object>} actions - 鎸夐挳鏁扮粍锛屾瘡涓厓绱犲寘鍚細
         *   - text: 鎸夐挳鏂囧瓧
         *   - class: CSS绫诲悕
         *   - handler: 鐐瑰嚮鍥炶皟鍑芥暟
         *   - keepOpen: 鏄惁淇濇寔寮圭獥鎵撳紑锛堥粯璁ゅ叧闂級
         *   - id: 鍙€夛紝鎸夐挳ID
         *   - role: 鍙€夛紝鎸夐挳瑙掕壊锛坧rimary/secondary锛夈€傞粯璁ゆ渶鍚庝竴涓负 primary
         */
        showModal(title, content, actions = []) {
          // 璁剧疆瀵硅瘽妗嗗唴瀹?
          this.elements.modalTitle.innerHTML = title;
          this.elements.modalContent.innerHTML = content;
          // 纭繚鎸夐挳鍖哄煙鍙锛堥槻姝㈣鍏堝墠娴佺▼闅愯棌锛?
          this.elements.modalActions.classList.remove("hidden");
          this.elements.modalActions.innerHTML = ""; // 娓呯┖鏃ф寜閽槻姝㈤噸澶?

          // 鍔ㄦ€佸垱寤烘寜閽?
          let primaryButton = null;
          actions.forEach((action, idx) => {
            const button = document.createElement("button");
            button.innerHTML = action.text;
            button.className = `${action.class} themed-ring focus:outline-none`;
            if (action.id) button.id = action.id;
            const role = action.role || (idx === actions.length - 1 ? "primary" : "secondary");
            button.dataset.role = role;
            button.onclick = () => {
              action.handler?.(); // 鎵ц鍥炶皟锛堝鏋滃瓨鍦級
              if (!action.keepOpen) this.closeModal(); // 闄ら潪鎸囧畾淇濇寔鎵撳紑锛屽惁鍒欒嚜鍔ㄥ叧闂?
            };
            if (role === "primary") primaryButton = button;
            this.elements.modalActions.appendChild(button);
          });

          // 鏄剧ず瀵硅瘽妗嗗苟閿佸畾鑳屾櫙婊氬姩
          this.elements.modalContainer.classList.remove("hidden");
          document.body.style.overflow = "hidden";

          // 灏嗙劍鐐归粯璁よ缃埌涓绘搷浣滄寜閽紝閬垮厤鍥炶溅瑙﹀彂鍙栨秷
          if (primaryButton) setTimeout(() => primaryButton.focus(), 10);
        }

        /**
         */
        closeModal() {
          this.elements.modalContainer.classList.add("hidden");
          this.elements.modal.classList.remove("modal-large");
          document.body.style.overflow = "auto";
        }

        /**
         */
        showNotification(message, type = "info") {
          const notification = document.createElement("div");
          notification.className = "fixed top-5 right-5 flex items-center px-4 py-3 rounded-lg shadow-xl text-white z-[100] transition-all duration-500 ease-in-out opacity-0 -translate-y-full";

          const styles = {
            info: { icon: "ri-information-line", bg: "bg-blue-600" },
            success: { icon: "ri-check-line", bg: "bg-green-600" },
            error: { icon: "ri-error-warning-line", bg: "themed-button-primary" },
          };

          const style = styles[type] || styles.info;
          notification.classList.add(style.bg);
          notification.innerHTML = `<i class="${style.icon} text-xl mr-1"></i><span>${message}</span>`;

          document.body.appendChild(notification);
          setTimeout(() => notification.classList.remove("opacity-0", "-translate-y-full"), 10);

          setTimeout(() => {
            notification.classList.add("opacity-0", "-translate-y-full");
            notification.addEventListener("transitionend", () => notification.remove());
          }, 3000);
        }

        /**
         */
        applyTheme(theme) {
          document.body.className = `bg-gray-100 flex items-center justify-center min-h-screen ${theme || "theme-festive"}`;
        }
      }

      /**
       * 鏁版嵁缃戝叧 - 灏佽 DBManager 鐨勪笟鍔＄骇璁块棶鎺ュ彛
       */
      class GiftRepository {
        /**
         */
        constructor(database) {
          this.database = database;
        }

        /**
         */
        async fetchAllEvents() {
          return this.database.getAll("events");
        }

        /**
         */
        async fetchEvent(eventId) {
          return this.database.get("events", eventId);
        }

        /**
         */
        async createEvent(event) {
          return this.database.add("events", event);
        }

        /**
         */
        async updateEvent(event) {
          return this.database.update("events", event);
        }

        /**
         */
        async deleteEvent(eventId) {
          return this.database.delete("events", eventId);
        }

        /**
         */
        async fetchOrderedGifts(eventId) {
          return this.database.getAllByCompoundIndex("gifts", "byEventAndLevel", eventId);
        }

        /**
         */
        async fetchGiftsByEvent(eventId) {
          return this.database.getAllByIndex("gifts", "eventId", eventId);
        }

        /**
         */
        async createGift(gift) {
          return this.database.add("gifts", gift);
        }

        /**
         */
        async updateGift(gift) {
          return this.database.update("gifts", gift);
        }

        /**
         */
        async deleteGift(giftId) {
          return this.database.delete("gifts", giftId);
        }
      }

      class SessionManager {
        /**
         * @param {string} [storageKey="activeEventSession"] - sessionStorage key
         */
        constructor(storageKey = "activeEventSession") {
          this.storageKey = storageKey;
        }

        /**
         */
        save(event, password) {
          const encryptedPassword = CryptoJS.AES.encrypt(password, event.passwordHash).toString();
          sessionStorage.setItem(this.storageKey, JSON.stringify({ event, encryptedPassword }));
        }

        /**
         */
        load() {
          const stored = sessionStorage.getItem(this.storageKey);
          if (!stored) return null;
          try {
            return JSON.parse(stored);
          } catch (error) {
            console.error("浼氳瘽璇诲彇澶辫触", error);
            sessionStorage.removeItem(this.storageKey);
            return null;
          }
        }

        /**
         */
        clear() {
          sessionStorage.removeItem(this.storageKey);
        }

        /**
         */
        _notificationKey(eventId) {
          return `eventEndedNotif_${eventId}`;
        }

        /**
         */
        hasNotification(eventId) {
          return !!sessionStorage.getItem(this._notificationKey(eventId));
        }

        /**
         */
        markNotification(eventId) {
          sessionStorage.setItem(this._notificationKey(eventId), "true");
        }
      }

      class PasswordCache {
        /**
         */
        constructor(durationMinutes) {
          this.durationMinutes = durationMinutes;
          this.storagePrefix = "adminPwdCache_";
        }

        /**
         */
        _key(eventId) {
          return `${this.storagePrefix}${eventId}`;
        }

        /**
         */
        store(eventId, password, passwordHash) {
          try {
            const encrypted = CryptoJS.AES.encrypt(password, passwordHash).toString();
            const expireTime = Date.now() + this.durationMinutes * 60 * 1000;
            localStorage.setItem(this._key(eventId), JSON.stringify({ encrypted, expireTime }));
          } catch (error) {
            console.error("瀵嗙爜缂撳瓨澶辫触:", error);
          }
        }

        /**
         */
        retrieve(eventId, passwordHash) {
          try {
            const cached = localStorage.getItem(this._key(eventId));
            if (!cached) return null;
            const { encrypted, expireTime } = JSON.parse(cached);
            if (Date.now() > expireTime) {
              localStorage.removeItem(this._key(eventId));
              return null;
            }
            const bytes = CryptoJS.AES.decrypt(encrypted, passwordHash);
            return bytes.toString(CryptoJS.enc.Utf8);
          } catch (error) {
            console.error("瀵嗙爜缂撳瓨璇诲彇澶辫触:", error);
            return null;
          }
        }

        /**
         */
        clear(eventId) {
          localStorage.removeItem(this._key(eventId));
        }
      }

      /**
       * 缁熻绀奸噾璁板綍濮撳悕绾犻敊鐨勬鏁?
       * - 鍏煎鏃у巻鍙茶褰曚腑鏈啓鍏?changedFields 鐨勬儏鍐?
       * - 浠呯粺璁＄被鍨嬩负 correction 鐨勫巻鍙茶妭鐐?
       * @param {Array} history - 绀奸噾鍘嗗彶璁板綍
       * @returns {number} 宸茬粡鎵ц鐨勫鍚嶇籂閿欐鏁?
       */
      function countNameCorrections(history) {
        if (!Array.isArray(history)) return 0;
        return history.reduce((total, entry) => {
          if (!entry || entry.type !== "correction") return total;
          if (Array.isArray(entry.changedFields) && entry.changedFields.includes("name")) return total + 1;
          if (typeof entry.changeLog === "string" && entry.changeLog.includes("绾犻敊濮撳悕")) return total + 1;
          return total;
        }, 0);
      }

      /**
       * 缁熻绀奸噾璁板綍閲戦琚慨鏀圭殑娆℃暟
       * @param {Array} history - 绀奸噾鍘嗗彶璁板綍
       * @returns {number} 宸茬粡鎵ц鐨勯噾棰濊皟鏁存鏁?
       */
      function countAmountCorrections(history) {
        if (!Array.isArray(history)) return 0;
        return history.reduce((total, entry) => {
          if (!entry || entry.type !== "correction") return total;
          if (Array.isArray(entry.changedFields) && entry.changedFields.includes("amount")) return total + 1;
          if (typeof entry.changeLog === "string" && (/閲戦/.test(entry.changeLog) || entry.changeLog.toLowerCase().includes("amount"))) return total + 1;
          return total;
        }, 0);
      }

      class GiftManager {
        /**
         */
        constructor(app) {
          this.app = app;
        }

        /**
         * 鏋勯€犲啓鍥炴暟鎹簱鎵€闇€鐨勭ぜ閲戣褰曞璞?
         * 浠呬繚鐣欑储寮曞瓧娈典笌瀵嗘枃锛岄伩鍏嶅皢瑙ｅ瘑鏁版嵁鍐欏叆 IndexedDB
         */
        buildGiftRecordForUpdate(giftObject, overrides = {}) {
          if (!giftObject) return { ...overrides };
          return {
            id: giftObject.id,
            eventId: giftObject.eventId,
            guestLevelWeight: giftObject.guestLevelWeight ?? 0,
            levelUpdateTime: giftObject.levelUpdateTime ?? 0,
            encryptedData: giftObject.encryptedData,
            ...overrides,
          };
        }

        /**
         */
        generateGiftCellHTML(gift, giftIndex) {
          const app = this.app;
          const g = gift.data;
          // 缁熻濮撳悕涓庨噾棰濈籂閿欐鏁帮紝鐢ㄤ簬闄愬埗鎸夐挳鐘舵€?
          const isModified = g.history?.some((h) => h.type === "correction");
          const hasRemarks = app.hasRemarkData(g);
          const isAbolished = g.abolished === true;

          const statusIndicators = `<div class="mark">
                            ${hasRemarks ? "<p>*宸插娉?/p>" : ""}
                            ${isModified ? "<p>*宸蹭慨鏀?/p>" : ""}
                            ${isAbolished ? '<p class="text-red-600">*宸蹭綔搴?/p>' : ""}
                          </div>`;

          const nameClasses = isAbolished ? "opacity-50" : "";
          const amountClasses = isAbolished ? "opacity-50 line-through" : "";

          const amountChinese = Utils.amountToChinese(g.amount);
          const displayName = g.name.length === 2 ? `${g.name[0]}\u3000${g.name[1]}` : g.name;
          return {
            nameHTML: `<div class="name ${g.name.length > 4 ? "scale" : ""} ${nameClasses}">${displayName}</div>${statusIndicators}`,
            amountHTML: `<div class="amount-chinese ${amountChinese.length > 16 ? "scale" : ""} ${amountClasses}">${amountChinese}</div>
                      <div class="amount-numeric ${Math.abs(g.amount).toString().length > 8 ? "scale" : ""} ${amountClasses}">锟?{g.amount}</div>`,
            giftIndex,
          };
        }

        /**
         * 鎬ц兘浼樺寲锛氬閲忔覆鏌撳崟鏉＄ぜ閲戣褰?
         * 鍙洿鏂颁笅涓€涓┖浣嶏紝鑰屼笉鏄噸缁樻暣涓〉闈?
         * 浼樺娍锛?
         * - 閬垮厤鍏ㄩ〉閲嶇粯锛屾彁鍗囨€ц兘
         * - 鍑忓皯 DOM 鎿嶄綔娆℃暟
         * - 鎻愪緵鏇存祦鐣呯殑鐢ㄦ埛浣撻獙
         */
        renderSingleGift(gift, giftIndex) {
          const app = this.app;
          if (!gift?.data) return;
          const itemIndexOnPage = giftIndex % app.getItemsPerPage();
          const nameCells = app.ui.elements.giftBookContent.querySelectorAll(".name-cell");
          const amountCells = app.ui.elements.giftBookContent.querySelectorAll(".amount-cell");

          const targetNameCell = nameCells[itemIndexOnPage];
          const targetAmountCell = amountCells[itemIndexOnPage];

          if (!targetNameCell || !targetAmountCell) {
            app.giftManager.render();
            app.guestScreenService.syncToGuestScreen();
            return;
          }

          const { nameHTML, amountHTML } = app.giftManager.generateGiftCellHTML(gift, giftIndex);
          targetNameCell.innerHTML = nameHTML;
          targetNameCell.dataset.giftIndex = giftIndex;
          targetAmountCell.innerHTML = amountHTML;
          targetAmountCell.dataset.giftIndex = giftIndex;
        }

        /**
         * 鎬ц兘浼樺寲锛氬閲忔洿鏂板崟鏉＄ぜ閲戣褰?DOM
         * 鍙洿鏂版寚瀹氫綅缃殑鍗曞厓鏍硷紝閬垮厤鏁撮〉閲嶆柊娓叉煋
         * @param {number} giftIndex - 绀奸噾绱㈠紩
         * @param {object} updatedData - 鏈€鏂扮殑绀奸噾鏁版嵁
         */
        updateSingleGiftDOM(giftIndex, updatedData) {
          const app = this.app;
          const targetNameCell = app.ui.elements.giftBookContent.querySelector(`.name-cell[data-gift-index="${giftIndex}"]`);
          const targetAmountCell = app.ui.elements.giftBookContent.querySelector(`.amount-cell[data-gift-index="${giftIndex}"]`);

          if (!targetNameCell || !targetAmountCell) return;

          const { nameHTML, amountHTML } = app.giftManager.generateGiftCellHTML({ data: updatedData }, giftIndex);
          targetNameCell.innerHTML = nameHTML;
          targetAmountCell.innerHTML = amountHTML;
        }

        /**
         * 鎬ц兘浼樺寲锛氶噸寤虹紦瀛樻暟鎹?
         * 閲嶆柊璁＄畻鎬婚噾棰濄€佹€讳汉鏁扮瓑缁熻淇℃伅
         * 鍦ㄥ姞杞戒簨椤规垨鎵归噺瑙ｅ瘑鍚庤皟鐢?
         */
        rebuildCache() {
          const app = this.app;
          app.totalAmountCache = app.gifts.reduce((sum, gift) => {
            return gift.data && !gift.data.abolished ? sum + gift.data.amount : sum;
          }, 0);
          app.totalGiversCache = app.gifts.filter((g) => g.data && !g.data.abolished).length;
          app.statsAreDirty = true; // 鏍囪缁熻璇︽儏闇€瑕侀噸鏂拌绠?
        }

        /**
         * 鎬ц兘浼樺寲锛氬閲忔洿鏂扮紦瀛橈紙娣诲姞璁板綍锛?
         * 鐩存帴鍦ㄧ紦瀛樹笂绱姞閲戦涓庝汉鏁帮紝閬垮厤閲嶆柊閬嶅巻
         * @param {number} amount - 鏂板璁板綍閲戦
         */
        updateCacheOnAdd(amount) {
          const app = this.app;
          app.totalAmountCache += amount;
          app.totalGiversCache += 1;
          app.statsAreDirty = true;
        }

        /**
         * 鎬ц兘浼樺寲锛氬閲忔洿鏂扮紦瀛橈紙淇敼璁板綍锛?
         * 鏍规嵁閲戦宸鏇存柊缂撳瓨锛岄伩鍏嶉噸鏂伴亶鍘?
         * @param {number} oldAmount - 鍘熼噾棰?
         * @param {number} newAmount - 鏂伴噾棰?
         */
        updateCacheOnUpdate(oldAmount, newAmount) {
          const app = this.app;
          app.totalAmountCache = app.totalAmountCache - oldAmount + newAmount;
          // 浜烘暟涓嶅彉
          app.statsAreDirty = true;
        }

        /**
         * 缁熶竴鐨勮В瀵嗘柟娉?- 閬垮厤浠ｇ爜鍐椾綑
         * 瑙ｅ瘑鎸囧畾鑼冨洿鍐呯殑绀奸噾璁板綍锛岃嚜鍔ㄨ烦杩囧凡瑙ｅ瘑鏉＄洰
         * @param {number} startIdx - 璧峰绱㈠紩锛堝寘鍚級
         * @param {number} endIdx - 缁撴潫绱㈠紩锛堜笉鍖呭惈锛?
         * @returns {number} 瀹為檯瑙ｅ瘑璁板綍鏁?
         */
        decryptGiftsRange(startIdx, endIdx) {
          const app = this.app;
          if (app.allGiftsDecrypted) {
            return 0; // 娌℃湁瑙ｅ瘑浠讳綍鏂版潯鐩?
          }
          let decryptedCount = 0;
          const actualEnd = Math.min(endIdx, app.gifts.length);

          for (let i = startIdx; i < actualEnd; i++) {
            if (app.gifts[i] && app.gifts[i]._needsDecrypt) {
              const decryptedData = CryptoService.decrypt(app.gifts[i].encryptedData, app.currentPassword);
              app.gifts[i].data = decryptedData;
              app.gifts[i]._needsDecrypt = false;
              app.gifts[i].encryptedData = null; // 閲婃斁鍐呭瓨
              decryptedCount++;
            }
          }

          return decryptedCount;
        }

        /**
         * 鍔犺浇褰撳墠浜嬮」鐨勬墍鏈夌ぜ閲戣褰?
         * 浣跨敤澶嶅悎绱㈠紩鏌ヨ锛岀粨鏋滄寜绛夌骇涓庢洿鏂版椂闂存帓搴?
         * @returns {Promise<void>}
         */
        async loadGiftsForCurrentEvent() {
          const app = this.app;
          app.allGiftsDecrypted = false;
          const encryptedGifts = await app.giftRepository.fetchOrderedGifts(app.currentEvent.id);

          // 瀹归敊澶勭悊锛氱‘淇濇墍鏈夎褰曢兘鏈?guestLevelWeight 鍜?levelUpdateTime
          app.gifts = encryptedGifts.map((g) => {
            if (g.guestLevelWeight === undefined || g.guestLevelWeight === null) {
              g.guestLevelWeight = 0; // 榛樿绛夌骇
            }
            if (g.levelUpdateTime === undefined || g.levelUpdateTime === null) {
              g.levelUpdateTime = 0; // 榛樿涓?0锛堟湭淇敼杩囩瓑绾э級
            }
            return { ...g, data: null, _needsDecrypt: true };
          });
          const pageSize = app.getItemsPerPage();
          const totalPages = Math.ceil(app.gifts.length / pageSize) || 1;

          // 鏅鸿兘閫夋嫨鍒濆椤电爜锛氬凡缁撴潫鏄剧ず绗竴椤碉紝杩涜涓樉绀烘渶鍚庝竴椤?
          const now = new Date();
          const endTime = new Date(app.currentEvent.endDateTime);
          const isEventEnded = now > endTime;
          app.currentPage = isEventEnded ? 1 : totalPages;
          if (!this.allGiftsDecrypted) {
            // 瑙ｅ瘑褰撳墠椤垫暟鎹?
            const pageStart = (app.currentPage - 1) * pageSize;
            const pageEnd = Math.min(pageStart + pageSize, app.gifts.length);
            app.giftManager.decryptGiftsRange(pageStart, pageEnd);
          }

          app.giftManager.rebuildCache();
          app.giftManager.render();

          // 寮傛瑙ｅ瘑鍓╀綑鏁版嵁
          if (app.gifts.length > 0) {
            const scheduleIdle = typeof requestIdleCallback === "function" ? requestIdleCallback : (cb) => setTimeout(cb, 16);
            scheduleIdle(() => app.giftManager.decryptRemainingGifts(0));
          }
        }

        /**
         * 鍒╃敤 requestIdleCallback 鍦ㄦ祻瑙堝櫒绌洪棽鏃惰В瀵?
         * 閬垮厤涓€娆℃€цВ瀵嗛樆濉炰富绾跨▼锛屽ぇ閲忔暟鎹椂鍒嗘壒澶勭悊
         */
        async decryptRemainingGifts(startIndex) {
          const app = this.app;
          const BATCH_SIZE = 300;
          let didDecrypt = false;

          for (let i = startIndex; i < app.gifts.length; i += BATCH_SIZE) {
            const batchEnd = Math.min(i + BATCH_SIZE, app.gifts.length);

            // 浣跨敤缁熶竴鐨勮В瀵嗘柟娉?
            const decryptedCount = app.giftManager.decryptGiftsRange(i, batchEnd);
            if (decryptedCount > 0) {
              didDecrypt = true;
            }

            // 绛夊緟娴忚鍣ㄧ┖闂插啀缁х画
            await new Promise((resolve) => {
              if ("requestIdleCallback" in window) {
                requestIdleCallback(resolve);
              } else {
                setTimeout(resolve, 16); //
              }
            });

            // 鏇存柊缂撳瓨鍜?UI
            if (didDecrypt) {
              app.giftManager.rebuildCache();
              app.giftManager.updateTotals();
              didDecrypt = false; // 閲嶇疆鏍囧織
            }
          }
          app.allGiftsDecrypted = true; // 鏍囪鎵€鏈夋暟鎹凡瑙ｅ瘑
        }

        /**
         * 娓叉煋涓荤晫闈?- 缁熶竴鍏ュ彛
         * 渚濇娓叉煋绀肩翱銆佹洿鏂扮粺璁′笌鍒嗛〉淇℃伅
         */
        render() {
          const app = this.app;
          app.giftManager.renderGiftBook();
          app.giftManager.updateTotals();
          app.giftManager.updatePageInfo();
        }

        /**
         * 娓叉煋绀肩翱鍐呭 - 鐢熸垚褰撳墠椤?DOM
         * 浣跨敤 DocumentFragment 涓€娆℃€ф彃鍏ワ紝鍑忓皯閲嶆帓
         */
        renderGiftBook() {
          const app = this.app;
          const pageSize = app.getItemsPerPage();
          const items = app.gifts.slice((app.currentPage - 1) * pageSize, app.currentPage * pageSize);
          app.ui.elements.giftBookContent.innerHTML = "";
          app.ui.elements.giftBookContent.appendChild(app.exportService.createGiftBookRows(items, false, pageSize));
        }

        /**
         * 鏇存柊鐣岄潰缁熻鏁版嵁鏄剧ず
         * 璁＄畻鏈〉灏忚骞跺睍绀虹紦瀛樼殑鎬婚銆佹€讳汉鏁?
         */
        updateTotals() {
          const app = this.app;
          const itemsOnPage = app.gifts.slice((app.currentPage - 1) * app.getItemsPerPage(), app.currentPage * app.getItemsPerPage());
          // 鍙绠楁湭浣滃簾璁板綍鐨勯噾棰?
          const pageSubtotal = itemsOnPage.reduce((sum, gift) => {
            if (gift.data && !gift.data.abolished) {
              return sum + gift.data.amount;
            }
            return sum;
          }, 0);
          app.ui.elements.pageSubtotalEl.textContent = Utils.formatCurrency(pageSubtotal);
          app.ui.elements.totalAmountEl.textContent = Utils.formatCurrency(app.totalAmountCache);
          app.ui.elements.totalGiversEl.textContent = app.totalGiversCache;
        }

        /**
         */
        updatePageInfo() {
          const app = this.app;
          const totalPages = Math.ceil(app.gifts.length / app.getItemsPerPage()) || 1;
          app.ui.elements.pageInfoEl.innerHTML = `
                        绗?
                        <input type="number" id="current-page-input" value="${app.currentPage}"
                              min="1" max="${totalPages}"
                              class="w-[${app.currentPage.toString().length}em] text-center bg-transparent themed-ring rounded border p-0 mx-2 font-bold focus:w-[4em]">
                        / ${totalPages} 椤?
                      `;
          app.ui.elements.prevPageBtn.disabled = app.currentPage === 1;
          app.ui.elements.nextPageBtn.disabled = app.currentPage === totalPages;
        }

        /**
         * 缈婚〉鍔熻兘
         * @param {number} direction - 鏂瑰悜锛? 涓轰笅涓€椤碉紝-1 涓轰笂涓€椤?
         */
        changePage(direction) {
          const app = this.app;
          const totalPages = Math.ceil(app.gifts.length / app.getItemsPerPage()) || 1;
          const newPage = app.currentPage + direction;

          if (newPage >= 1 && newPage <= totalPages) {
            app.currentPage = newPage;
            app.giftManager.ensureCurrentPageDecrypted();
            app.giftManager.render();
          }
          app.guestScreenService.syncToGuestScreen();
        }

        /**
         * 纭繚褰撳墠椤垫暟鎹В瀵?- 鎳掑姞杞戒紭鍖栫瓥鐣?
         * 鍙В瀵嗗綋鍓嶉〉闇€瑕佹樉绀虹殑鏁版嵁锛屽噺灏戝唴瀛樺崰鐢ㄥ拰鍔犺浇鏃堕棿
         * 鍘熺悊锛氬埄鐢?_needsDecrypt 鏍囧織浣嶈窡韪摢浜涙暟鎹渶瑕佽В瀵?
         * 鎬ц兘锛氬浜庡ぇ閲忔暟鎹紙>500鏉★級鍙樉钁楁彁鍗囬〉闈㈠搷搴旈€熷害
         */
        ensureCurrentPageDecrypted() {
          const app = this.app;
          // 璁＄畻褰撳墠椤电殑璧峰鍜岀粨鏉熺储寮?
          const start = (app.currentPage - 1) * app.getItemsPerPage();
          const end = Math.min(start + app.getItemsPerPage(), app.gifts.length);

          // 浣跨敤缁熶竴鐨勮В瀵嗘柟娉?
          !this.allGiftsDecrypted && app.giftManager.decryptGiftsRange(start, end);
        }

        /**
         * 鎸夌瓑绾?绛夌骇淇敼鏃堕棿鎺掑簭绀奸噾鏁扮粍锛堥€氱敤鏂规硶锛?
         * 鎺掑簭閫昏緫锛?
         * 1. 绛夌骇闄嶅簭锛堥珮绛夌骇鍦ㄥ墠锛?
         * 2. 鐩稿悓绛夌骇鍐呮寜 levelUpdateTime 闄嶅簭锛堜慨鏀硅繃绛夌骇鐨勫湪鍓嶏級
         * 3. levelUpdateTime 鐩稿悓鏃舵寜 id 鍗囧簭锛堝綍鍏ラ『搴忥級
         */
        sortGiftsByLevel() {
          const app = this.app;
          app.gifts.sort((a, b) => {
            const weightDiff = (b.guestLevelWeight || 0) - (a.guestLevelWeight || 0);
            if (weightDiff !== 0) return weightDiff;

            // levelUpdateTime 闄嶅簭锛? 鎺掑湪鏈€鍚庯級
            const aTime = a.levelUpdateTime || 0;
            const bTime = b.levelUpdateTime || 0;
            const timeDiff = bTime - aTime;
            if (timeDiff !== 0) return timeDiff;

            // id 鍗囧簭锛堝綍鍏ラ『搴忥級
            return (a.id || 0) - (b.id || 0);
          });
        }

        /**
         * 鍒涘缓鏁版嵁蹇収锛堥€氱敤鏂规硶锛? 纭繚蹇収淇℃伅瀹屾暣
         * @param {Object} data - 鍘熷鏁版嵁 (淇敼鍓嶇殑鐘舵€?
         * @param {Object} changedFields - 鍙樺寲鐨勫瓧娈?(鍙€?
         * @returns {Object} 蹇収瀵硅薄
         */
        createSnapshot(data, changedFields = null) {
          const app = this.app;
          const snapshot = {
            name: data.name,
            amount: data.amount,
            type: data.type, // 纭繚 type 瀛楁鎬绘槸琚寘鍚?
            remarkData: data.remarkData, // 鍖呭惈褰撳墠鐨勫娉ㄥ璞?
            guestLevel: data.guestLevel !== undefined ? data.guestLevel : 0,
            timestamp: data.timestamp,
          };

          // 濡傛灉浼犲叆浜?changedFields锛岀敤 data 涓搴旂殑鏃у€艰鐩栧揩鐓т腑鐨勫瓧娈?
          // 杩欎竴姝ョ‘淇濅簡蹇収璁板綍鐨勬槸 *鍙樺寲鍙戠敓鍓? 鐨勭‘鍒囩姸鎬?
          if (changedFields && typeof changedFields === "object") {
            Object.keys(changedFields).forEach((key) => {
              if (data.hasOwnProperty(key)) {
                snapshot[key] = data[key];
              }
            });
          }

          return snapshot;
        }

        /**
         * 鎵ц绀奸噾鏁版嵁鏇存柊鐨勭粺涓€鍏ュ彛
         * - 鍏煎濮撳悕绾犻敊銆侀噾棰濊皟鏁淬€佸娉ㄦ洿鏂扮瓑鍦烘櫙
         * - 鍦ㄦ彁浜ゅ墠澶勭悊绠＄悊鍛樺瘑鐮佹牳楠屼笌鍘嗗彶璁板綍蹇収
         * - 鎴愬姛鍚庡悓姝ユ洿鏂版湰鍦扮紦瀛樸€佺粺璁′俊鎭笌鐣岄潰
         */
        async performUpdate(giftIndex, newFields, changeLogText, updateType) {
          const app = this.app;
          const giftObject = app.gifts[giftIndex];
          if (!giftObject || !giftObject.data) return;

          const currentData = { ...giftObject.data };
          const changedFieldKeys = Object.keys(newFields || {}).filter((key) => Object.prototype.hasOwnProperty.call(currentData, key) && currentData[key] !== newFields[key]);

          // 鏍规嵁鍙樻洿绫诲瀷鍒ゆ柇鏄惁闇€瑕佺鐞嗗憳瀵嗙爜锛堢籂閿欏己鍒堕獙璇侊級
          let password = null;
          if (updateType === "correction") {
            const forceVerify = changedFieldKeys.includes("name") || changedFieldKeys.includes("amount");
            password = await app.requestAdminPassword("淇敼纭", "濡傝璋冩暣绀奸噾淇℃伅锛岃杈撳叆绠＄悊鍛樺瘑鐮併€?, null, forceVerify);
          } else if (updateType === "remark") {
            const isOutOfTime = new Date() < new Date(app.currentEvent.startDateTime) || new Date() > new Date(app.currentEvent.endDateTime);
            if (isOutOfTime) {
              password = await app.requestAdminPassword("澶囨敞璁板綍", "褰撳墠宸茶秴杩囨湁鏁堝綍鍏ユ椂闂达紝璇疯緭鍏ョ鐞嗗憳瀵嗙爜鍚庣户缁慨鏀瑰娉ㄣ€?);
            } else {
              password = app.currentPassword; // 鍦ㄦ湁鏁堟椂娈靛唴锛岀洿鎺ヤ娇鐢ㄥ綋鍓嶅瘑鐮?
            }
          }

          if (password === null) {
            // 鐢ㄦ埛鍙栨秷鎴栭獙璇佸け璐ワ紝鐩存帴杩斿洖璇︽儏椤?
            app.showGiftDetails(giftIndex);
            return;
          }

          const oldAmount = currentData.amount;
          const now = new Date().toISOString();
          // 璁板綍鍙樻洿鏃ュ織骞惰ˉ榻愭洿鏂板墠鐨勫揩鐓ф暟鎹紝渚夸簬鍥炴函
          const historyEntry = {
            timestamp: now,
            changeLog: changeLogText,
            snapshot: app.giftManager.createSnapshot(currentData, newFields),
            type: updateType,
            changedFields: changedFieldKeys,
          };

          // 鍚堝苟鏃ф暟鎹笌鏂板瓧娈碉紝骞跺皢鍘嗗彶璁板綍杩藉姞鑷虫湯灏?
          const updatedData = {
            ...currentData,
            ...newFields,
            timestamp: now,
            history: currentData.history ? [...currentData.history, historyEntry] : [historyEntry],
          };
          const newAmount = updatedData.amount; // 鑾峰彇鏈€鏂扮増閲戦
          // 灏嗘渶鏂版暟鎹姞瀵嗕繚瀛橈紝骞跺湪鎴愬姛鍚庡埛鏂?UI 涓庣粺璁′俊鎭?
          try {
            const encryptedData = CryptoService.encrypt(updatedData, app.currentPassword);
            const recordToUpdate = this.buildGiftRecordForUpdate(giftObject, { encryptedData });
            await app.giftRepository.updateGift(recordToUpdate);

            app.gifts[giftIndex].data = updatedData;
            app.gifts[giftIndex].encryptedData = encryptedData;
            app.giftManager.updateSingleGiftDOM(giftIndex, updatedData);

            if (oldAmount !== newAmount) {
              app.giftManager.updateCacheOnUpdate(oldAmount, newAmount);
              app.giftManager.updateTotals();
            }
            app.ui.closeModal();
            app.ui.showNotification("淇敼鎴愬姛", "success");
            app.guestScreenService.syncToGuestScreen();

            setTimeout(() => app.showGiftDetails(giftIndex), 300);
          } catch (error) {
            console.error("鏇存柊澶辫触", error);
            app.ui.showNotification("鏇存柊璁板綍澶辫触锛岃绋嶅悗閲嶈瘯", "error");
            app.showGiftDetails(giftIndex);
          }
        }

        /**
         */
        async abolishGift(giftIndex) {
          const app = this.app;
          const gift = app.gifts[giftIndex];
          app.guestScreenService.syncToGuestScreen();
          if (!gift || !gift.data) return;
          if (gift.data.abolished) {
            app.ui.showNotification("璇ヨ褰曞凡琚綔搴熴€?);
            return;
          }

          // 杈撳叆浣滃簾鐞嗙敱
          const reason = await new Promise((resolve) => {
            app.ui.elements.modalActions.classList.remove("hidden");
            app.ui.elements.modal.classList.remove("modal-large");
            const content = `
                        <div class="space-y-3 text-left">
                          <p class="text-sm text-red-600">璇疯緭鍏ヤ綔搴熺悊鐢憋紙蹇呭～锛夛細</p>
                          <textarea id="abolish-reason-input" class="w-full p-3 border rounded themed-ring" rows="4"
                            placeholder="渚嬪锛氶噸澶嶅綍鍏ャ€侀敊璇褰曘€佸浜烘挙閿€绀奸噾绛?
                            required></textarea>
                          <p class="text-xs text-gray-500">娉細浣滃簾鍚庯紝璇ヨ褰曞皢淇濈暀鍦ㄧ郴缁熶腑浣嗕笉璁″叆鎬婚噾棰濓紝骞朵笖涓嶄細鍦ㄦ墦鍗癙DF鏃舵樉绀恒€?/p>
                        </div>
                      `;
            app.ui.showModal("璇疯緭鍏ヤ綔搴熺悊鐢?, content, [
              { text: "鍙栨秷", class: "themed-button-secondary border px-4 py-2 rounded", handler: () => resolve(null) },
              {
                text: "涓嬩竴姝?,
                class: "themed-button-primary text-white px-4 py-2 rounded  ",
                handler: () => {
                  const reasonText = document.getElementById("abolish-reason-input").value.trim();
                  if (!reasonText) {
                    app.ui.showNotification("璇峰～鍐欎綔搴熺悊鐢便€?, "error");
                    return; // 淇濇寔寮圭獥鎵撳紑
                  }
                  resolve(reasonText);
                },
                keepOpen: true,
              },
            ]);
            setTimeout(() => document.getElementById("abolish-reason-input")?.focus(), 50);
          });

          if (reason === null) {
            app.ui.closeModal();
            return;
          }

          // 鏍￠獙绠＄悊鍛樺瘑鐮?
          const password = await app.requestAdminPassword("浣滃簾纭", `鍗冲皢浣滃簾 \"${gift.data.name}\" 鐨勭ぜ閲戣褰曘€傝杈撳叆绠＄悊瀵嗙爜浠ョ户缁€俙, null, true);

          if (password === null) return;

          // 鎵ц浣滃簾鎿嶄綔
          try {
            const amountToAbolish = gift.data.amount;
            const currentData = { ...gift.data };
            const now = new Date().toISOString();

            const historyEntry = {
              timestamp: now,
              changeLog: `璇ヨ褰曞凡浣滃簾銆傦紝鐞嗙敱锛?{reason}`,
              snapshot: app.giftManager.createSnapshot(currentData),
              type: "abolish",
            };
            const updatedData = {
              ...currentData,
              abolished: true,
              abolishReason: reason,
              abolishTime: now,
              timestamp: now,
              history: currentData.history ? [...currentData.history, historyEntry] : [historyEntry],
            };
            const encryptedData = CryptoService.encrypt(updatedData, app.currentPassword);
            await app.giftRepository.updateGift(this.buildGiftRecordForUpdate(gift, { encryptedData }));

            app.gifts[giftIndex].data = updatedData;
            app.gifts[giftIndex].encryptedData = encryptedData;
            app.totalAmountCache -= amountToAbolish;
            app.totalGiversCache -= 1;
            app.statsAreDirty = true;
            app.giftManager.render();
            app.ui.closeModal();
            app.ui.showNotification("璁板綍宸蹭綔搴熴€?, "success");
            app.guestScreenService.syncToGuestScreen();
          } catch (error) {
            console.error("浣滃簾澶辫触:", error);
            app.ui.showNotification("浣滃簾鎿嶄綔鏃跺彂鐢熸湭鐭ラ敊璇紝璇烽噸璇曘€?, "error");
          }
        }
      }
      class ExportService {
        constructor(app) {
          this.app = app;
        }

        /**
         * 鍑嗗鎵撳嵃/瀵煎嚭 PDF
         * 鏍规嵁璁板綍鏁伴噺鍜岃澶囩幆澧冨喅瀹氭墦鍗版柟寮忥紝骞跺湪蹇呰鏃舵彁绀洪厤缃?
         */
        async prepareForPrint() {
          const app = this.app;
          // 璁＄畻鏈夋晥璁板綍鏁帮紙涓嶅惈浣滃簾锛?
          const activeGiftsCount = app.gifts.filter((g) => g.data && !g.data.abolished).length;

          if (activeGiftsCount === 0) {
            app.ui.showNotification("褰撳墠浜嬮」娌℃湁鏈夋晥鐨勭ぜ閲戣褰曪紝鏃犻渶鎵撳嵃銆?);
            return;
          }

          const canProceed = await app.exportService.ensurePrintPreferences();
          if (!canProceed) return;

          // 澶ч噺鏁版嵁鏃舵樉绀哄垎鎵归€夋嫨瀵硅瘽妗?
          if (app.gifts.length > CONFIG.PRINT_SPLIT_THRESHOLD) {
            app.exportService.showPrintChunkModal();
            return;
          }

          // 灏戦噺鏁版嵁鐩存帴鎵撳嵃
          const selectedEngine = app.currentEvent.printOptions?.pdfEngine || "browser";
          const shouldUsePdfLib = Utils.isMobile() || selectedEngine === "pdf-lib";

          if (shouldUsePdfLib) {
            // 绉诲姩绔垨寮哄埗 PDF-LIB 鎯呭喌涓嬬洿鎺ョ敓鎴?PDF
            app.exportService.generatePdf(0, app.gifts.length);
          } else {
            // 妗岄潰璁惧涓婅皟鐢ㄦ祻瑙堝櫒鍘熺敓鎵撳嵃鍔熻兘/鐢熸垚 PDF
            app.exportService.executePrint(0, app.gifts.length);
          }
        }

        /**
         * 鏄剧ず鍒嗘壒鎵撳嵃閫夋嫨瀵硅瘽妗?
         * 鐢ㄤ簬璁板綍鏁拌秴闃堝€兼椂鎸夊潡瀵煎嚭
         */
        showPrintChunkModal() {
          const app = this.app;
          const chunkSize = CONFIG.PRINT_SPLIT_THRESHOLD;
          const totalChunks = Math.ceil(app.gifts.length / chunkSize);

          let contentHtml = `<p class="mb-4 text-sm text-gray-700">鐢变簬绀奸噾璁板綍鏁拌緝澶氾紝涓洪槻姝㈡覆鏌撴椂鍗℃锛岄渶瑕佸垎鎵规墦鍗板鍑猴紝璇烽€夋嫨瑕佸鍑虹殑閮ㄥ垎锛?/p>`;
          contentHtml += `<div class="space-y-2 border rounded-lg p-2 max-h-[50vh] overflow-y-auto">`;

          for (let i = 0; i < totalChunks; i++) {
            const startRecord = i * chunkSize + 1;
            const endRecord = Math.min((i + 1) * chunkSize, app.gifts.length);
            contentHtml += `
                      <div class="print-chunk-item flex justify-between items-center p-3 rounded-lg cursor-pointer themed-link-hover"
                           data-start="${i * chunkSize}" data-end="${endRecord}"
                           data-part-index="${i + 1}"
                           data-original-text="鐢熸垚鎵撳嵃绗?${i + 1} 閮ㄥ垎 (璁板綍 ${startRecord} - ${endRecord})">
                        <span class="main-text">鎵撳嵃绗?${i + 1} 閮ㄥ垎 (璁板綍 ${startRecord} - ${endRecord})</span>
                        <span class="status-icon text-green-600 font-bold"></span>
                      </div>`;
          }
          contentHtml += `</div>`;

          app.ui.showModal("鍒嗘壒鎵撳嵃/瀵煎嚭PDF", contentHtml, [{ text: "鍏抽棴", class: "themed-button-secondary border px-4 py-2 rounded" }]);

          setTimeout(() => {
            document.querySelectorAll(".print-chunk-item").forEach((item) => {
              item.onclick = async (e) => {
                const el = e.currentTarget;
                if (el.dataset.status === "completed") return;
                const start = parseInt(el.dataset.start);
                const end = parseInt(el.dataset.end);
                const partIndex = parseInt(el.dataset.partIndex);
                const mainTextSpan = el.querySelector(".main-text");
                const originalText = el.dataset.originalText || "";
                mainTextSpan.textContent = "鐢熸垚涓?..";
                el.classList.add("cursor-wait");

                const selectedEngine = app.currentEvent.printOptions?.pdfEngine || "browser";
                const usePdfLib = Utils.isMobile() || selectedEngine === "pdf-lib";
                if (usePdfLib) {
                  await app.exportService.generatePdf(start, end, partIndex);
                } else {
                  await app.exportService.executePrint(start, end, partIndex, totalChunks);
                }

                el.dataset.status = "completed";
                mainTextSpan.textContent = `${originalText} (宸插畬鎴?`;
                const statusIcon = el.querySelector(".status-icon");
                statusIcon.innerHTML = "&#10004;";
                el.classList.remove("cursor-wait");
                el.classList.add("cursor-default", "opacity-70");
              };
            });
          }, 50);
        }

        /**
         * 鐢熸垚 PDF
         * @param {number} startIndex - 璧峰绱㈠紩
         * @param {number} endIndex - 缁撴潫绱㈠紩
         * @param {number|null} partIndex - 鍒嗘壒缂栧彿锛堜负 null 鏃惰〃绀轰笉鍒嗘壒锛?
         */
        async generatePdf(startIndex, endIndex, partIndex = null) {
          const app = this.app;
          if (app.isGeneratingPdf) {
            app.ui.showNotification("姝ｅ湪鐢熸垚 PDF锛岃鍕块噸澶嶆搷浣?..", "info");
            return;
          }

          const printBtn = app.ui.elements.printBtn;
          const originalBtnText = printBtn.innerHTML;
          const blobUrlsToRevoke = [];

          try {
            app.isGeneratingPdf = true;
            printBtn.disabled = true;
            printBtn.innerHTML = '<i class="ri-loader-4-line animate-spin mr-2"></i>姝ｅ湪鐢熸垚...';
            app.ui.showNotification("姝ｅ湪鐢熸垚 PDF 鏂囦欢锛岃绋嶅€?..", "info");

            // ====================== 1. 瑙ｆ瀽鑷畾涔夐厤缃紙缁熶竴澶勭悊鈥滆嚜瀹氫箟 or 鍏滃簳鈥濓級 ======================
            const customStyle = app.currentEvent.customStyle || {};
            const isSolemnTheme = app.currentEvent.theme === "theme-solemn";

            const resolve = {
              size: (val, fallback) => (Number(val) > 0 ? Number(val) : fallback),
              color: (val, fallback) => (typeof val === "string" && val.trim() ? val : fallback),
              font: (val) => (typeof val === "string" && val.trim() ? val : null),
            };

            const giftBookStyles = {
              name: { fontSize: resolve.size(customStyle.name?.size, 25), color: resolve.color(customStyle.name?.color, "#333333") },
              label: { fontSize: resolve.size(customStyle.type?.size, 22), color: resolve.color(customStyle.type?.color, isSolemnTheme ? "#374151" : "#cc0000") },
              amount: { fontSize: resolve.size(customStyle.amountChinese?.size, 25), color: resolve.color(customStyle.amountChinese?.color, "#333333") },
              coverText: { fontSize: resolve.size(customStyle.coverText?.size, 30), color: resolve.color(customStyle.coverText?.color, "#f5d4ab") },
              pageInfo: {
                fontSize: 12,
                themeColor: resolve.color(customStyle.pageInfo?.themeColor, isSolemnTheme ? "#374151" : "#ec403c"),
                baseColor: resolve.color(customStyle.pageInfo?.baseColor, "#1f2937"),
              },
            };

            // 鑷畾涔夊浘鐗囷紙灏侀潰 + 鑳屾櫙锛?
            const coverImageUrl = app.currentEvent.coverType === "custom" ? (await ImageCache.getEventCoverUrl(app.currentEvent.id)) || "/cover1.jpg" : "/cover1.jpg";

            const bgImageUrl = (await ImageCache.getBackgroundUrl(app.currentEvent.id)) || "/bg.jpg";

            // ====================== 2. 缁熶竴鍔犺浇鑷畾涔夊瓧浣?======================
            const customFontNames = {
              name: resolve.font(customStyle.name?.font),
              label: resolve.font(customStyle.type?.font),
              amount: resolve.font(customStyle.amountChinese?.font),
              cover: resolve.font(customStyle.coverText?.font),
              pageInfo: resolve.font(customStyle.pageInfo?.font),
            };

            const fontBytesMap = { name: null, label: null, amount: null, cover: null, pageInfo: null };

            if (window.queryLocalFonts) {
              const loadFont = async (postscriptName, key) => {
                if (!postscriptName) return;
                try {
                  const fonts = await window.queryLocalFonts();
                  const font = fonts.find((f) => f.postscriptName === postscriptName);
                  if (font?.blob) {
                    const buffer = await font.blob().then((b) => b.arrayBuffer());
                    fontBytesMap[key] = new Uint8Array(buffer);
                  }
                } catch (e) {
                  console.warn(`鍔犺浇瀛椾綋澶辫触: ${postscriptName}`, e);
                }
              };

              await Promise.all(Object.keys(customFontNames).map((key) => loadFont(customFontNames[key], key)));
            }

            // 杞垚 Blob URL锛堢粺涓€绠＄悊锛宖inally 涓?revoke锛?
            const createBlobUrl = (bytes) => {
              if (!bytes?.length) return null;
              const blob = new Blob([bytes], { type: "font/ttf" });
              const url = URL.createObjectURL(blob);
              blobUrlsToRevoke.push(url);
              return url;
            };

            const fontUrls = {
              name: createBlobUrl(fontBytesMap.name),
              label: createBlobUrl(fontBytesMap.label),
              amount: createBlobUrl(fontBytesMap.amount),
              cover: createBlobUrl(fontBytesMap.cover),
              pageInfo: createBlobUrl(fontBytesMap.pageInfo),
            };

            // ====================== 3. 鏋勯€犳渶缁?PDF 鍙傛暟锛堝眰绾ф竻鏅般€佸悎骞堕泦涓級 ======================
            const eventDateInfo = Utils.getEventDateInfo(app.currentEvent.startDateTime);
            const totalParts = app.gifts.length > CONFIG.PRINT_SPLIT_THRESHOLD ? Math.ceil(app.gifts.length / CONFIG.PRINT_SPLIT_THRESHOLD) : null;

            const baseOptions = {
              ...DEFAULT_PRINT_OPTIONS,
              ...(app.currentEvent.printOptions || {}),

              coverImage: coverImageUrl,
              title: app.currentEvent.name,
              recorder: app.currentEvent.recorder || null,
              subtitle: eventDateInfo.formattedDisplay,
              giftLabel: isSolemnTheme ? "绀奸噾" : "璐虹ぜ",
              backgroundImage: bgImageUrl,
              backCoverImage: "/cover2.jpg",
              partIndex,
              totalParts,
              grandTotalAmount: app.totalAmountCache,
              grandTotalGivers: app.totalGiversCache,
              mainFontUrl: "/MaShanZheng-Regular.ttf",
              giftLabelFontUrl: "/SourceHanSerifCN-Heavy.ttf",
              formalFontUrl: "/NotoSansSCMedium-mini.ttf",
              itemsPerPage: app.getItemsPerPage(),
            };

            const generatorOptions = {
              ...baseOptions,
              giftBookStyles,
              // 鑷畾涔夊瓧浣撲紭鍏堬紝娌℃湁鍒欒蛋榛樿闈欐€佸瓧浣?
              mainFontUrl: fontUrls.name || baseOptions.mainFontUrl,
              giftLabelFontUrl: fontUrls.label || baseOptions.giftLabelFontUrl,
              formalFontUrl: fontUrls.pageInfo || baseOptions.formalFontUrl,
              amountFontUrl: fontUrls.amount || null,
              coverFontUrl: fontUrls.cover || null,
            };

            // ====================== 4. 鐢熸垚 PDF ======================
            app.pdfGenerator = new GiftRegistryPDF(generatorOptions);

            const data = app.gifts.slice(startIndex, endIndex).map(({ data }) => ({
              name: data.name,
              amount: data.amount,
              type: data.type,
              remark: app.formatRemarkDisplay(data.remarkData) || null,
              abolished: !!data.abolished,
              amountText: Utils.amountToChinese(data.amount),
            }));

            const pdfBytes = await app.pdfGenerator.generate(data, generatorOptions);
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const pdfUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = pdfUrl;
            const safeEventName = (app.currentEvent.name || "绀肩翱").replace(/[\\/:*?"<>|]/g, "_");
            const dateStr = eventDateInfo.localeDate.replace(/\//g, "-");
            const partSuffix = partIndex ? `_Part${partIndex}` : "";
            link.download = `${safeEventName}_绀奸噾璁板綍_${dateStr}${partSuffix}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (error) {
            console.error(error);
            app.ui.showNotification("鐢熸垚 PDF 鏃跺嚭鐜伴敊璇紝璇烽噸璇曘€?, "error");
          } finally {
            app.isGeneratingPdf = false;
            printBtn.disabled = false;
            printBtn.innerHTML = originalBtnText;
            blobUrlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
          }
        }

        /**
         * 鎵ц鎵撳嵃/鐢熸垚瀵煎嚭 PDF (娴忚鍣ㄥ師鐢熸墦鍗版柟寮?
         */
        executePrint(startIdx, endIdx, partIndex = null, totalParts = null) {
          const app = this.app;
          // 纭繚鏁版嵁宸茶В瀵?
          !this.allGiftsDecrypted && app.giftManager.decryptGiftsRange(startIdx, endIdx);
          const allGiftsSubset = app.gifts.slice(startIdx, endIdx);

          return new Promise(async (resolve) => {
            let printView = document.getElementById("print-view");
            if (printView) printView.remove();

            printView = document.createElement("div");
            printView.id = "print-view";
            printView.className = "absolute top-0 left-[-9999px]";

            const printOptions = {
              ...DEFAULT_PRINT_OPTIONS,
              ...(app.currentEvent.printOptions || {}),
            };
            const eventDateInfo = Utils.getEventDateInfo(app.currentEvent.startDateTime);

            document.title = `${app.currentEvent.name}绀奸噾璁板綍{partIndex ? "-P" + partIndex : ""}-${eventDateInfo.localeDate}`;

            // 灏侀潰椤?
            if (printOptions.printCover) {
              const coverPage = document.createElement("div");
              coverPage.className = "print-page print-cover-page";
              const formattedDate = eventDateInfo.formattedDisplay || "";
              coverPage.innerHTML = `
                  <div class="print-cover">
                      ${printOptions.showCoverTitle ? `<p>${app.currentEvent.name}</p><p>${formattedDate}</p>` : ""}
                      ${printOptions.showCoverTitle && partIndex ? `<p class="absolute top-[25mm] left-[30mm] !text-6xl">P${partIndex}</p>` : ""}
                  </div>
                `;
              printView.appendChild(coverPage);
            }

            // 鍐呭椤?
            const giftsSubset = allGiftsSubset.filter((g) => g.data && !g.data.abolished);
            const totalGiftPages = Math.ceil(giftsSubset.length / app.getItemsPerPage()) || 1;

            for (let i = 0; i < totalGiftPages; i++) {
              const pageGifts = giftsSubset.slice(i * app.getItemsPerPage(), (i + 1) * app.getItemsPerPage());
              const pageContainer = document.createElement("div");
              pageContainer.className = "print-page"; // 鑷姩搴旂敤鑳屾櫙鍥?CSS 鍙橀噺
              const content = document.createElement("div");
              content.className = "print-book-content";
              this.renderGiftBookForPrint(content, pageGifts);
              pageContainer.appendChild(content);

              const pageSubtotal = pageGifts.reduce((sum, gift) => sum + (gift.data?.amount || 0), 0);
              const partInfo = partIndex ? `( P${partIndex}/P${totalParts} )` : "";

              pageContainer.innerHTML += `
                    <div class="print-footer">
                      <p>鐢熸垚鏃ユ湡: ${new Date().toLocaleString("sv-SE")}</p>
                      <p class="print-page-number">绗?${i + 1} / ${totalGiftPages} 椤?${partInfo}</p>
                      <div class="print-footer-totals">
                        <span class="total-amount-print">鏈〉灏忚: ${Utils.formatCurrency(pageSubtotal)}</span>
                      </div>
                    </div>`;
              printView.appendChild(pageContainer);
            }

            // 闄勫綍涓庣粺璁?
            printOptions.printAppendix && this.appendAppendixPages(printView, giftsSubset, partIndex, totalParts);
            printOptions.printSummary && this.appendSummaryPage(printView, giftsSubset, partIndex);

            // 灏佸簳椤?
            if (printOptions.printEndPage) {
              const afterPage = document.createElement("div");
              afterPage.className = "print-page print-cover-page";
              // 灏佸簳鏆傛湭鍋氳嚜瀹氫箟鍙橀噺锛屼繚鎸佸師鏍?
              afterPage.innerHTML = `<div class="w-full h-full" style="background: url('/cover2.jpg') center/cover no-repeat;"></div>`;
              printView.appendChild(afterPage);
            }

            document.body.appendChild(printView);
            document.body.classList.add("printing");

            setTimeout(() => {
              window.print();
              setTimeout(() => {
                document.body.classList.remove("printing");
                if (printView) printView.remove();
                document.title = CONFIG.APP_NAME;
                resolve();
              }, 500);
            }, 1000);
          });
        }

        /**
         * 瀵煎嚭浜嬮」鏁版嵁涓?JSON锛堟槑鏂囧浠斤級
         */
        async exportEventAsJson() {
          const app = this.app;
          if (!app.currentEvent) return;

          try {
            const eventId = app.currentEvent.id;
            const rawGifts = await app.giftRepository.fetchGiftsByEvent(eventId);

            const decryptedGifts = rawGifts.map((gift) => {
              const decrypted = CryptoService.decrypt(gift.encryptedData, app.currentPassword);
              if (!decrypted) {
                throw new Error("decrypt_failed");
              }
              return {
                id: gift.id,
                eventId,
                guestLevelWeight: gift.guestLevelWeight ?? 0,
                levelUpdateTime: gift.levelUpdateTime ?? 0,
                ...decrypted,
              };
            });

            const safeEvent = { ...app.currentEvent };
            delete safeEvent.passwordHash;

            const payload = {
              version: 1,
              exportedAt: new Date().toISOString(),
              event: safeEvent,
              gifts: decryptedGifts,
            };

            const safeName = (app.currentEvent.name || "event").replace(/[\\/:*?"<>|]/g, "_");
            const timestamp = Utils.formatTimestampForFilename();
            const filename = `${safeName}_${timestamp}.json`;

            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            app.ui.showNotification("JSON 澶囦唤宸插鍑恒€?, "success");
          } catch (error) {
            console.error("瀵煎嚭 JSON 澶囦唤澶辫触:", error);
            app.ui.showNotification("瀵煎嚭 JSON 鏂囦欢澶辫触锛岃閲嶈瘯銆?, "error");
          }
        }

        /**
         * 瀵煎嚭浜嬮」鏁版嵁涓轰簩杩涘埗鍔犲瘑澶囦唤
         * 鏂囦欢鏍煎紡锛歔8瀛楄妭鏂囦欢澶碷 + [AES 瀵嗘枃瀛楄妭娴乚
         * 鏂囦欢澶寸粨鏋勶細
         *   - 0-3: Magic Number "EGLB" (0x45 0x47 0x4C 0x42)
         *   - 4:   鐗堟湰鍙?(0x01)
         *   - 5-7: 淇濈暀瀛楄妭
         */
        async exportEventAsBinary() {
          const app = this.app;
          if (!app.currentEvent) return;

          try {
            // 瀹氫箟鏂囦欢鏍煎紡甯搁噺
            const MAGIC_HEADER = [0x45, 0x47, 0x4c, 0x42]; // "EGLB"
            const FILE_VERSION = 0x01;
            const HEADER_LENGTH = 8;

            // 鑾峰彇骞跺鐞嗙ぜ閲戞暟鎹?
            const eventId = app.currentEvent.id;
            const rawGifts = await app.giftRepository.fetchGiftsByEvent(eventId);

            const sanitizedGifts = rawGifts.map((gift) => {
              const decrypted = CryptoService.decrypt(gift.encryptedData, app.currentPassword);
              if (!decrypted) {
                throw new Error("decrypt_failed");
              }
              const encryptedData = CryptoService.encrypt(decrypted, app.currentPassword);
              return {
                encryptedData,
                guestLevelWeight: gift.guestLevelWeight ?? 0,
                levelUpdateTime: gift.levelUpdateTime ?? 0,
              };
            });

            // 鍑嗗瀵煎嚭鏁版嵁锛堢Щ闄ゅ瘑鐮佸搱甯岋級
            const safeEvent = { ...app.currentEvent };
            delete safeEvent.passwordHash;

            const payload = {
              version: 1,
              exportedAt: new Date().toISOString(),
              event: safeEvent,
              gifts: sanitizedGifts,
            };

            // 鍔犲瘑鏁翠釜 payload
            const encryptedPayloadString = CryptoService.encrypt(JSON.stringify(payload), app.currentPassword);

            // 鐢熸垚鏂囦欢鍚?
            const safeName = (app.currentEvent.name || "event").replace(/[\\/:*?"<>|]/g, "_");
            const timestamp = Utils.formatTimestampForFilename();
            const filename = `${safeName}_${timestamp}.bin`;

            // 鏋勫缓鏂囦欢澶?
            const header = new Uint8Array(HEADER_LENGTH);
            header.set(MAGIC_HEADER, 0); // 瀛楄妭 0-3: Magic Number
            header[4] = FILE_VERSION; // 瀛楄妭 4: 鐗堟湰鍙?
            header[5] = 0x00; // 瀛楄妭 5-7: 淇濈暀
            header[6] = 0x00;
            header[7] = 0x00;

            // 灏?Base64 瀵嗘枃杞崲涓哄師濮嬪瓧鑺傛祦
            const binaryString = atob(encryptedPayloadString);
            const payloadBytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              payloadBytes[i] = binaryString.charCodeAt(i);
            }

            // 缁勫悎鏂囦欢澶村拰鏁版嵁浣?
            const finalBuffer = new Uint8Array(header.length + payloadBytes.length);
            finalBuffer.set(header, 0);
            finalBuffer.set(payloadBytes, header.length);

            // 鍒涘缓 Blob 骞朵笅杞?
            const blob = new Blob([finalBuffer], { type: "application/octet-stream" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            app.ui.showNotification("鍔犲瘑澶囦唤宸插鍑恒€?, "success");
          } catch (error) {
            console.error("瀵煎嚭鍔犲瘑澶囦唤澶辫触:", error);
            app.ui.showNotification("瀵煎嚭鍔犲瘑澶囦唤澶辫触锛岃閲嶈瘯銆?, "error");
          }
        }

        /**
         * 浠庡姞瀵嗗浠芥枃浠舵仮澶嶄簨椤规暟鎹?
         * @param {File} file - 澶囦唤鏂囦欢锛堝繀椤绘槸甯︽枃浠跺ご鐨勪簩杩涘埗鏍煎紡锛?
         */
        async importEventFromBinary(file) {
          const app = this.app;
          if (!app.currentEvent || !file) {
            app.ui.showNotification("璇峰厛閫夋嫨瑕佸鍏ョ殑澶囦唤鏂囦欢銆?, "error");
            return;
          }

          // 鍦ㄥ脊鍑哄叾浠栭獙璇佸脊绐椾箣鍓嶇紦瀛樺閫夋鐘舵€侊紝閬垮厤 DOM 琚浛鎹㈠悗璇诲彇澶辫触
          const shouldClearOldData = !!document.getElementById("clear-old-data-on-import")?.checked;

          try {
            // 瀹氫箟鏂囦欢鏍煎紡甯搁噺
            const MAGIC_HEADER = [0x45, 0x47, 0x4c, 0x42]; // "EGLB"
            const FILE_VERSION = 0x01;
            const HEADER_LENGTH = 8;

            // 姝ラ1锛氶獙璇佸綋鍓嶄簨椤圭殑绠＄悊瀵嗙爜
            const currentEventPassword = await app.requestAdminPassword("瀵煎叆楠岃瘉", "璇疯緭鍏ュ綋鍓嶄簨椤圭殑绠＄悊瀵嗙爜浠ョ户缁€?, app.currentEvent.passwordHash, true);
            if (currentEventPassword === null) return;

            // 姝ラ2锛氳鍙栧苟楠岃瘉鏂囦欢鏍煎紡
            const arrayBuffer = await file.arrayBuffer();
            const fileBytes = new Uint8Array(arrayBuffer);

            // 楠岃瘉鏂囦欢鏈€灏忛暱搴?
            if (fileBytes.length < HEADER_LENGTH) {
              app.ui.showNotification("鏂囦欢鏍煎紡閿欒锛氭枃浠惰繃灏忋€?, "error");
              return;
            }

            // 楠岃瘉 Magic Number
            if (fileBytes[0] !== MAGIC_HEADER[0] || fileBytes[1] !== MAGIC_HEADER[1] || fileBytes[2] !== MAGIC_HEADER[2] || fileBytes[3] !== MAGIC_HEADER[3]) {
              app.ui.showNotification("鏂囦欢鏍煎紡閿欒锛氫笉鏄湁鏁堢殑澶囦唤鏂囦欢銆?, "error");
              return;
            }

            // 楠岃瘉鐗堟湰鍙?
            const version = fileBytes[4];
            if (version > FILE_VERSION) {
              app.ui.showNotification(`鏂囦欢鐗堟湰 (v${version}) 杩囬珮锛屽綋鍓嶇郴缁熸渶楂樻敮鎸?v${FILE_VERSION}銆俙, "error");
              return;
            }

            // 姝ラ3锛氭彁鍙栧苟瑙ｅ瘑鏁版嵁锛堝瘑鏂囧凡涓哄師濮嬪瓧鑺傛祦锛?
            const payloadBytes = fileBytes.slice(HEADER_LENGTH);
            let binaryString = "";
            const chunkSize = 0x8000;
            for (let i = 0; i < payloadBytes.length; i += chunkSize) {
              const chunk = payloadBytes.subarray(i, i + chunkSize);
              binaryString += String.fromCharCode(...chunk);
            }
            const encryptedContent = btoa(binaryString);

            // 灏濊瘯鐢ㄥ綋鍓嶄簨椤瑰瘑鐮佽В瀵?
            let decrypted = CryptoService.decrypt(encryptedContent, currentEventPassword);
            let finalPassword = currentEventPassword;

            // 濡傛灉瑙ｅ瘑澶辫触锛岃姹傝緭鍏ュ浠芥枃浠剁殑瀵嗙爜
            if (!decrypted) {
              const backupPassword = await new Promise((resolve) => {
                const content = `
                        <p class="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md mb-3">
                          浣跨敤褰撳墠浜嬮」瀵嗙爜瑙ｅ瘑澶辫触銆傚浠芥枃浠跺彲鑳戒娇鐢ㄤ簡涓嶅悓鐨勫瘑鐮併€?
                        </p>
                        <input type="password" id="backup-pwd-input"
                               class="w-full p-2 border rounded themed-ring"
                               placeholder="璇疯緭鍏ュ浠芥枃浠剁殑瑙ｅ瘑瀵嗙爜">
                      `;
                app.ui.showModal("杈撳叆瑙ｅ瘑瀵嗙爜", content, [
                  {
                    text: "鍙栨秷",
                    class: "themed-button-secondary border px-4 py-2 rounded",
                    handler: () => resolve(null),
                  },
                  {
                    text: "纭",
                    class: "themed-button-primary px-4 py-2 rounded",
                    handler: () => {
                      const pwd = document.getElementById("backup-pwd-input").value;
                      resolve(pwd);
                    },
                  },
                ]);
                setTimeout(() => document.getElementById("backup-pwd-input")?.focus(), 50);
              });

              if (backupPassword === null) {
                app.ui.showNotification("宸插彇娑堝鍏ャ€?, "info");
                return;
              }

              decrypted = CryptoService.decrypt(encryptedContent, backupPassword);
              finalPassword = backupPassword;

              if (!decrypted) {
                app.ui.showNotification("瑙ｅ瘑澶辫触锛屽瘑鐮侀敊璇垨鏂囦欢宸叉崯鍧忋€?, "error");
                return;
              }
            }

            // 姝ラ4锛氳В鏋愭暟鎹?
            const payload = JSON.parse(decrypted);
            const giftRecords = Array.isArray(payload?.gifts) ? payload.gifts : [];

            // 姝ラ5锛氭牴鎹紦瀛樼殑鍕鹃€夌姸鎬佸喅瀹氭槸鍚︽竻绌烘棫鏁版嵁
            if (shouldClearOldData) {
              const existingGifts = await app.giftRepository.fetchGiftsByEvent(app.currentEvent.id);
              for (const gift of existingGifts) {
                await app.giftRepository.deleteGift(gift.id);
              }
              app.ui.showNotification("鏃ф暟鎹凡娓呯┖銆?, "info");
            }

            // 姝ラ6锛氬鍏ョぜ閲戞暟鎹?
            for (const record of giftRecords) {
              let encryptedData = record.encryptedData;
              if (!encryptedData && record.data) {
                encryptedData = CryptoService.encrypt(record.data, finalPassword);
              }
              if (!encryptedData) continue;

              await app.giftRepository.createGift({
                eventId: app.currentEvent.id,
                encryptedData,
                guestLevelWeight: record.guestLevelWeight ?? 0,
                levelUpdateTime: record.levelUpdateTime ?? 0,
              });
            }

            // 姝ラ7锛氭洿鏂颁簨椤逛俊鎭?
            const eventSnapshot = payload?.event || {};
            const mergedPrintOptions = {
              ...DEFAULT_PRINT_OPTIONS,
              ...(app.currentEvent.printOptions || {}),
              ...(eventSnapshot.printOptions || {}),
            };
            const updatedEvent = {
              ...app.currentEvent,
              ...eventSnapshot,
              id: app.currentEvent.id,
              passwordHash: app.currentEvent.passwordHash,
              printOptions: mergedPrintOptions,
            };
            await app.giftRepository.updateEvent(updatedEvent);
            app.currentEvent = updatedEvent;

            // 姝ラ8锛氬埛鏂扮晫闈?
            await app.giftManager.loadGiftsForCurrentEvent();
            app.session.save(app.currentEvent, app.currentPassword);

            app.ui.closeModal();
            app.ui.showNotification(`鏁版嵁鎭㈠鎴愬姛锛?{shouldClearOldData ? "鏇挎崲" : "杩藉姞"}浜?${giftRecords.length} 鏉¤褰曘€俙, "success");
          } catch (error) {
            console.error("瀵煎叆澶囦唤澶辫触:", error);
            app.ui.showNotification("瀵煎叆澶辫触锛屾枃浠舵牸寮忓彲鑳芥棤鏁堟垨宸叉崯鍧忋€?, "error");
          }
        }
        /**
         * 鏄剧ず澶囦唤/鎭㈠寮圭獥锛屾彁渚?JSON 涓?BIN 瀵煎嚭鎴栧鍏?
         */
        showBackupRestoreModal() {
          const app = this.app;
          if (!app.currentEvent) return;

          const modalContent = `
                        <div class="space-y-5 text-left">
                          <div>
                            <p class="text-sm text-gray-600">鍙皢褰撳墠浜嬮」鏁版嵁澶囦唤涓?JSON 鎴栨暟鎹簱锛圔IN锛夋枃浠讹紝浜﹀彲瀵煎叆 BIN 鏂囦欢杩涜鎭㈠銆?/p>
                          </div>
                          <div class="grid sm:grid-cols-2 gap-3">
                            <button id="btn-backup-json" class="w-full themed-button-secondary border px-4 py-2 rounded">瀵煎嚭 JSON 鏁版嵁</button>
                            <button id="btn-backup-bin" class="w-full themed-button-primary px-4 py-2 rounded">瀵煎嚭澶囦唤 (BIN)</button>
                          </div>
                          <div class="border-t pt-4 space-y-3">
                            <label class="block text-sm font-medium text-gray-700">瀵煎叆澶囦唤鏂囦欢</label>
                            <input type="file" id="backup-import-file" accept=".bin" class="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                            <div class="flex items-center mt-2">
                              <input type="checkbox" id="clear-old-data-on-import" class="h-4 w-4 themed-ring rounded border-gray-300">
                              <label for="clear-old-data-on-import" class="ml-2 block text-sm text-gray-800">瀵煎叆鍓嶆竻绌哄綋鍓嶄簨椤圭殑鎵€鏈夋棫鏁版嵁</label>
                            </div>
                            <p class="text-xs text-gray-500 -mt-1">榛樿涓嶅嬀閫夛紝鍗充互杩藉姞鏂瑰紡瀵煎叆鏂版暟鎹€?/p>
                            <button id="btn-restore-backup" class="w-full themed-button-primary px-4 py-2 rounded">瀵煎叆骞舵仮澶?/button>
                            <p class="text-xs text-gray-500">瀵煎叆鏃堕渶杈撳叆褰撳墠浜嬮」鐨勭鐞嗗瘑鐮侊紝璇风‘淇濆浠芥潵婧愬彲闈犮€?/p>
                          </div>
                        </div>
                      `;

          app.ui.showModal("澶囦唤 / 鎭㈠鏁版嵁", modalContent, [{ text: "鍏抽棴", class: "themed-button-secondary border px-4 py-2 rounded" }]);

          setTimeout(() => {
            const exportJsonBtn = document.getElementById("btn-backup-json");
            const exportBinBtn = document.getElementById("btn-backup-bin");
            const restoreBtn = document.getElementById("btn-restore-backup");
            const fileInput = document.getElementById("backup-import-file");

            if (exportJsonBtn) {
              exportJsonBtn.addEventListener("click", async () => {
                exportJsonBtn.disabled = true;
                await app.exportService.exportEventAsJson();
                exportJsonBtn.disabled = false;
              });
            }

            if (exportBinBtn) {
              exportBinBtn.addEventListener("click", async () => {
                exportBinBtn.disabled = true;
                await app.exportService.exportEventAsBinary();
                exportBinBtn.disabled = false;
              });
            }

            if (restoreBtn) {
              restoreBtn.addEventListener("click", async () => {
                if (!fileInput?.files?.length) {
                  app.ui.showNotification("璇峰厛閫夋嫨瑕佸鍏ョ殑澶囦唤鏂囦欢銆?, "error");
                  return;
                }
                restoreBtn.disabled = true;
                await app.exportService.importEventFromBinary(fileInput.files[0]);
                restoreBtn.disabled = false;
              });
            }
          }, 50);
        }

        /**
         * 棣栨鎵撳嵃鍓嶆彁绀虹敤鎴风‘璁ゅ紩鎿庝笌璁拌处浜轰俊鎭?
         * 缂撳瓨缁撴灉浠ラ伩鍏嶉噸澶嶅脊绐?
         */
        async ensurePrintPreferences() {
          const app = this.app;
          if (!app.currentEvent) return false;
          const cacheKey = `printSetupShown_${app.currentEvent.id}`;
          if (sessionStorage.getItem(cacheKey)) return true;

          return new Promise((resolve) => {
            const isMobile = Utils.isMobile();
            const currentEngine = app.currentEvent.printOptions?.pdfEngine || "browser";
            const currentRecorder = app.currentEvent.recorder || "";
            const currentPrintOptions = {
              ...DEFAULT_PRINT_OPTIONS,
              ...(app.currentEvent.printOptions || {}),
            };
            const currentPrintEndPage = !!currentPrintOptions.printEndPage;

            const engineSelector = isMobile
              ? `<p class="text-sm text-gray-600 bg-red-50 border border-red-200 rounded p-3">妫€娴嬪埌绉诲姩绔幆澧冿紝绯荤粺灏嗚嚜鍔ㄤ娇鐢?<strong>PDF-LIB</strong> 寮曟搸瀵煎嚭銆?/p>`
              : `<div class="space-y-2">
                              <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="print-engine-select" value="browser" class="themed-text-radio themed-ring" ${currentEngine === "browser" ? "checked" : ""}>
                                <span class="text-sm">娴忚鍣ㄥ彟瀛樹负PDF锛堟枃浠跺皬,涓嶅吋瀹圭Щ鍔ㄧ锛?/span>
                              </label>
                              <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="print-engine-select" value="pdf-lib" class="themed-text-radio themed-ring" ${currentEngine === "pdf-lib" ? "checked" : ""}>
                                <span class="text-sm">PDF-LIB.JS寮曟搸锛堟枃浠剁◢澶?鍏煎PC/绉诲姩绔級</span>
                              </label>
                            </div>`;

            const modalContent = `
                        <div class="space-y-5 text-left">
                          <p class="text-sm text-gray-600">棣栨鎵撳嵃鍓嶅缓璁ˉ鍏呭叧閿俊鎭紝鍚庣画鍙湪鈥滆缃簨椤光€濅腑缁х画淇敼銆?/p>
                          <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">璁拌处浜?<span class="text-xs text-red-400">(寤鸿濉啓锛岄潪蹇呭～)</span></label>
                            <input id="print-first-recorder" type="text" class="w-full p-2 border rounded themed-ring" maxlength="30" value="${currentRecorder}" placeholder="绀轰緥锛氱帇浜?>
                          </div>
                          <div>
                            <span class="block text-sm font-medium text-gray-700 mb-1">PDF娓叉煋鏂瑰紡</span>
                            ${engineSelector}
                            <div class="mt-3 space-y-2">
                              <span class="block text-sm font-medium text-gray-700 mb-1">绀肩翱闄勯〉閫夐」</span>
                              <div class="flex gap-2 text-sm flex-wrap text-gray-700">
                                <label class="flex items-center gap-2 text-sm text-gray-700">
                                  <input id="print-init-cover" type="checkbox" class="w-4 h-4 themed-ring rounded" ${currentPrintOptions.printCover ? "checked" : ""}>
                                  <span>灏侀潰</span>
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-700">
                                  <input id="print-init-show-cover-title" type="checkbox" class="w-4 h-4 themed-ring rounded" ${currentPrintOptions.showCoverTitle ? "checked" : ""}>
                                  <span>灏侀潰鏍囬</span>
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-700">
                                  <input id="print-init-appendix" type="checkbox" class="w-4 h-4 themed-ring rounded" ${currentPrintOptions.printAppendix ? "checked" : ""}>
                                  <span>澶囨敞闄勫綍</span>
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-700">
                                  <input id="print-init-summary" type="checkbox" class="w-4 h-4 themed-ring rounded" ${currentPrintOptions.printSummary ? "checked" : ""}>
                                  <span>鎬昏椤?/span>
                                </label>
                                <label class="flex items-center gap-2 text-sm text-gray-700">
                                  <input id="print-init-end-page" type="checkbox" class="w-4 h-4 themed-ring rounded" ${currentPrintEndPage ? "checked" : ""}>
                                  <span>灏佸簳</span>
                                </label>
                              </div>
                            </div>
                            <p class="text-xs text-gray-400 mt-2">鍙湪鈥滆缃簨椤光€濅腑鍐嶆璋冩暣銆?/p>
                          </div>
                        </div>
                      `;

            app.ui.showModal("鎵撳嵃鍒濆鍖?, modalContent, [
              {
                text: "鍙栨秷",
                class: "themed-button-secondary border px-4 py-2 rounded",
                handler: () => resolve(false),
              },
              {
                text: "纭骞剁户缁?,
                class: "themed-button-primary px-4 py-2 rounded",
                keepOpen: true,
                handler: async () => {
                  try {
                    const recorderInput = document.getElementById("print-first-recorder");
                    const recorderValue = recorderInput ? recorderInput.value.trim() : "";
                    const selectedEngine = isMobile ? "pdf-lib" : document.querySelector('input[name="print-engine-select"]:checked')?.value || "browser";

                    const printCoverInput = document.getElementById("print-init-cover");
                    const showCoverTitleInput = document.getElementById("print-init-show-cover-title");
                    const printAppendixInput = document.getElementById("print-init-appendix");
                    const printSummaryInput = document.getElementById("print-init-summary");
                    const printEndPageInput = document.getElementById("print-init-end-page");
                    const mergedPrintOptions = {
                      ...currentPrintOptions,
                      pdfEngine: selectedEngine,
                      printCover: printCoverInput ? printCoverInput.checked : currentPrintOptions.printCover,
                      showCoverTitle: showCoverTitleInput ? showCoverTitleInput.checked : currentPrintOptions.showCoverTitle,
                      printAppendix: printAppendixInput ? printAppendixInput.checked : currentPrintOptions.printAppendix,
                      printSummary: printSummaryInput ? printSummaryInput.checked : currentPrintOptions.printSummary,
                      printEndPage: printEndPageInput ? printEndPageInput.checked : currentPrintOptions.printEndPage,
                    };

                    const updatedEvent = {
                      ...app.currentEvent,
                      recorder: recorderValue,
                      printOptions: mergedPrintOptions,
                    };

                    await app.giftRepository.updateEvent(updatedEvent);
                    app.currentEvent = updatedEvent;
                    app.session.save(app.currentEvent, app.currentPassword);
                    sessionStorage.setItem(cacheKey, "true");
                    app.ui.closeModal();
                    resolve(true);
                  } catch (error) {
                    console.error("棣栨鎵撳嵃閰嶇疆淇濆瓨澶辫触:", error);
                    app.ui.showNotification("淇濆瓨鎵撳嵃閰嶇疆澶辫触锛岃閲嶈瘯銆?, "error");
                    resolve(false);
                  }
                },
              },
            ]);
          });
        }

        /**
         */
        createGiftBookRows(gifts, isPrint = false) {
          const app = this.app;
          const fragment = document.createDocumentFragment();
          const nameRow = document.createElement("div");
          nameRow.className = "gift-book-row";
          const typeRow = document.createElement("div");
          typeRow.className = "gift-book-row";
          const amountRow = document.createElement("div");
          amountRow.className = "gift-book-row";

          const typeText = app.currentEvent.theme === "theme-solemn" ? "绀奸噾" : "璐虹ぜ";

          for (let i = 0; i < app.getItemsPerPage(); i++) {
            const gift = gifts[i];
            const giftIndex = isPrint ? null : (app.currentPage - 1) * app.getItemsPerPage() + i;

            // 濮撳悕鍗曞厓鏍?
            const nameCell = document.createElement("div");
            nameCell.className = "book-cell name-cell";
            if (gift?.data) {
              const { nameHTML } = app.giftManager.generateGiftCellHTML(gift, giftIndex);
              nameCell.innerHTML = nameHTML;
              if (!isPrint) nameCell.dataset.giftIndex = giftIndex;
            }
            nameRow.appendChild(nameCell);

            // 绫诲瀷鍗曞厓鏍?
            const typeCell = document.createElement("div");
            typeCell.className = "book-cell type-cell";
            typeCell.textContent = typeText;
            typeRow.appendChild(typeCell);

            // 閲戦鍗曞厓鏍?
            const amountCell = document.createElement("div");
            amountCell.className = "book-cell amount-cell";
            if (gift?.data) {
              const { amountHTML } = app.giftManager.generateGiftCellHTML(gift, giftIndex);
              amountCell.innerHTML = amountHTML;
              if (!isPrint) amountCell.dataset.giftIndex = giftIndex;
            }
            amountRow.appendChild(amountCell);
          }

          fragment.append(nameRow, typeRow, amountRow);
          return fragment;
        }

        /**
         * 娓叉煋鎵撳嵃鐢ㄧ殑绀肩翱鍐呭
         * @param {HTMLElement} container - 鎵撳嵃 DOM 瀹瑰櫒
         * @param {Array} gifts - 宸茶繃婊ょ殑绀奸噾璁板綍
         */
        renderGiftBookForPrint(container, gifts) {
          const app = this.app;
          container.innerHTML = "";
          container.appendChild(this.createGiftBookRows(gifts, true));
        }

        /**
         * 闄勫姞澶囨敞闄勫綍椤碉紙鏀寔闀挎枃鏈垎椤碉級
         * @param {HTMLElement} printView - 鎵撳嵃瑙嗗浘鏍硅妭鐐?
         * @param {Array} gifts - 鏈夋晥绀奸噾璁板綍
         * @param {number|null} partIndex - 鍒嗘壒缂栧彿
         * @param {number|null} totalParts - 鎬诲垎鎵规暟
         */
        appendAppendixPages(printView, gifts, partIndex = null, totalParts = null) {
          const app = this.app;
          const giftsWithRemarks = gifts
            .map((g, idx) => {
              const recordIndex = idx + 1;
              const pageNumber = Math.ceil(recordIndex / app.getItemsPerPage());
              const positionInPage = ((recordIndex - 1) % app.getItemsPerPage()) + 1;
              return {
                ...g,
                indexLabel: `绗?{pageNumber}椤电${positionInPage}浜篳,
              };
            })
            .filter((g) => g.data && app.hasRemarkData(g.data));

          if (giftsWithRemarks.length === 0) {
            return;
          }

          const ruler = document.createElement("div");
          ruler.style.cssText = `
                          position: absolute; top: -9999px; left: -9999px; visibility: hidden;
                          font-family: "KaiTi", "妤蜂綋", serif; font-weight: bold; letter-spacing: 2px;
                          word-break: break-word; padding: 8px; line-height: 2em; width: 103.14mm;
                        `;
          document.body.appendChild(ruler);

          try {
            const MAX_PAGE_CONTENT_HEIGHT_PX = 710;
            const TABLE_HEADER_HEIGHT_PX = 120;
            const ROW_BORDER_HEIGHT_PX = 4;
            const getRemarkCellHeight = (text) => {
              if (!text) text = " ";
              ruler.innerHTML = text.replace(/\n/g, "<br>").replace(/  /g, "&nbsp; ");
              return ruler.scrollHeight;
            };
            const findFittingText = (fullText, availableHeight) => {
              if (getRemarkCellHeight(fullText) <= availableHeight) {
                return [fullText, ""];
              }
              let low = 0,
                high = fullText.length,
                bestFitIndex = 0;
              while (low <= high) {
                let mid = Math.floor((low + high) / 2);
                if (getRemarkCellHeight(fullText.substring(0, mid)) <= availableHeight) {
                  bestFitIndex = mid;
                  low = mid + 1;
                } else {
                  high = mid - 1;
                }
              }
              let splitIndex = bestFitIndex;
              const breakChars = new Set([" ", ",", "锛?, ".", "銆?, ";", "锛?, "!", "锛?, "?", "锛?, "\n"]);
              for (let i = bestFitIndex - 1; i > bestFitIndex / 2; i--) {
                if (breakChars.has(fullText[i])) {
                  splitIndex = i + 1;
                  break;
                }
              }
              if (splitIndex === 0 && fullText.length > 0) {
                splitIndex = 1;
              }
              return [fullText.substring(0, splitIndex), fullText.substring(splitIndex)];
            };
            const pages = [];
            let currentPageItems = [];
            let remainingPageHeight = MAX_PAGE_CONTENT_HEIGHT_PX - TABLE_HEADER_HEIGHT_PX - 100;
            for (const gift of giftsWithRemarks) {
              let remainingRemarkText = app.formatRemarkDisplay(gift.data.remarkData || {}, " / ");
              let isFirstChunk = true;
              while (remainingRemarkText.length > 0) {
                if (remainingPageHeight <= 50 && currentPageItems.length > 0) {
                  pages.push(currentPageItems);
                  currentPageItems = [];
                  remainingPageHeight = MAX_PAGE_CONTENT_HEIGHT_PX - TABLE_HEADER_HEIGHT_PX;
                }
                const [textThatFits, textLeftOver] = findFittingText(remainingRemarkText, remainingPageHeight);
                if (textThatFits.length > 0) {
                  const chunkHeight = getRemarkCellHeight(textThatFits) + ROW_BORDER_HEIGHT_PX;
                  currentPageItems.push({ gift: gift, remarkText: textThatFits, isContinuation: !isFirstChunk });
                  remainingPageHeight -= chunkHeight;
                  isFirstChunk = false;
                }
                remainingRemarkText = textLeftOver;
                if (textLeftOver.length > 0) {
                  if (currentPageItems.length > 0) {
                    pages.push(currentPageItems);
                  }
                  currentPageItems = [];
                  remainingPageHeight = MAX_PAGE_CONTENT_HEIGHT_PX - TABLE_HEADER_HEIGHT_PX;
                }
              }
            }
            if (currentPageItems.length > 0) {
              pages.push(currentPageItems);
            }

            pages.forEach((pageItems, pageIndex) => {
              const appendixPage = document.createElement("div");
              appendixPage.className = "print-page";
              const tableRows = pageItems
                .map((item) => {
                  const nameCellContent = item.gift.data.name;
                  const indexCellContent = item.isContinuation ? " (缁笂)" : item.gift.indexLabel;
                  return `<tr><td>${nameCellContent}</td><td>${indexCellContent}</td><td class="text-left">${item.remarkText || "鏃?}</td></tr>`;
                })
                .join("");

              const partInfo = partIndex ? `P${partIndex}/P${totalParts}` : "";

              appendixPage.innerHTML = `
                            ${pageIndex === 0 ? '<h1 class="print-header">闄勫綍锛氬瀹㈠娉?/h1>' : ""}
                            <table class="print-appendix-table text-lg" style="line-height: 2em;">
                              <thead><tr><th>濮撳悕</th><th>璁板綍浣嶇疆</th><th>澶囨敞淇℃伅</th></tr></thead>
                              <tbody>${tableRows}</tbody>
                            </table>
                            <div class="print-footer">
                              <p>鐢熸垚鏃ユ湡: ${new Date().toLocaleString("sv-SE")}</p>
                              <p class="print-page-number">澶囨敞闄勫綍 绗?${pageIndex + 1} / ${pages.length} 椤?/p>
                              <div class="print-footer-totals">${partInfo}</div>
                            </div>
                          `;
              printView.appendChild(appendixPage);
            });
          } finally {
            document.body.removeChild(ruler);
          }
        }

        /**
         * 闄勫姞缁熻鎬昏椤?
         * @param {HTMLElement} printView - 鎵撳嵃瑙嗗浘鏍硅妭鐐?
         * @param {Array} gifts - 鏈夋晥绀奸噾璁板綍锛堜笉鍚綔搴燂級
         * @param {number|null} partIndex - 鍒嗘壒缂栧彿
         */
        appendSummaryPage(printView, gifts, partIndex = null) {
          const app = this.app;
          if (gifts.length === 0) return;

          const stats = {
            鐜伴噾: { count: 0, amount: 0 },
            鏀粯瀹? { count: 0, amount: 0 },
            寰俊: { count: 0, amount: 0 },
            鍏朵粬: { count: 0, amount: 0 },
          };
          gifts.forEach((gift) => {
            const type = gift.data.type;
            if (stats[type]) {
              stats[type].count += 1;
              stats[type].amount += gift.data.amount;
            }
          });

          const eventDateInfo = Utils.getEventDateInfo(app.currentEvent.startDateTime);

          const partTotalCount = gifts.length;
          const partTotalAmount = gifts.reduce((sum, gift) => sum + gift.data.amount, 0);

          const tableRows = Object.entries(stats)
            .filter(([type, data]) => data.count > 0)
            .map(([type, data]) => `<tr><td>${type}</td><td>${data.count} 浜?/td><td>${Utils.formatCurrency(data.amount)}</td></tr>`)
            .join("");

          let totalRowsHtml = "";
          if (partIndex) {
            // 鍒嗘壒鎵撳嵃鐨勫満鏅?
            totalRowsHtml = `
                        <tr class="themed-text">
                          <td>鏈儴鍒嗘€昏</td>
                          <td>${partTotalCount} 浜?/td>
                          <td>${Utils.formatCurrency(partTotalAmount)}</td>
                        </tr>
                        <tr class="themed-text">
                          <td>浜嬮」鎬婚噾棰?/td>
                          <td>${app.totalGiversCache} 浜?/td>
                          <td>${Utils.formatCurrency(app.totalAmountCache)}</td>
                        </tr>
                      `;
          } else {
            // 瀹屾暣鎵撳嵃鐨勫満鏅?
            totalRowsHtml = `
                        <tr>
                          <td>鎬昏</td>
                          <td>${partTotalCount} 浜?/td>
                          <td>${Utils.formatCurrency(partTotalAmount)}</td>
                        </tr>
                      `;
          }

          const summaryPage = document.createElement("div");
          summaryPage.className = "print-page";
          summaryPage.innerHTML = `
                      <h1 class="print-header">鎬?璁?/h1>
                      <table class="print-appendix-table text-xl" style="line-height: 2em; margin-top: 20px;">
                        <thead>
                          <tr><th style="width: 20%;">閫佺ぜ鏂瑰紡</th><th style="width: 20%;">浜烘暟</th><th>鎬婚噾棰?/th></tr>
                        </thead>
                        <tbody>
                          ${tableRows}
                          ${totalRowsHtml}
                        </tbody>
                      </table>
                      <div class="w-[90%] mx-auto flex justify-end mt-20 pr-20">
                        <div class="text-center space-y-2 font-bold text-2xl">
                          ${app.currentEvent.recorder ? `<p>璁拌处浜?  ${app.currentEvent.recorder}</p>` : ""}
                          <p>${eventDateInfo.formattedDisplay}</p>
                        </div>
                      </div>`;
          printView.appendChild(summaryPage);
        }

        /**
         * 瀵煎嚭 Excel
         * 鐢熸垚绀奸噾鏄庣粏鍙婄ぜ鍝佹竻鍗曪紙濡傛湁锛?
         */
        exportToExcel() {
          const app = this.app;
          if (app.gifts.length === 0) {
            app.ui.showNotification("娌℃湁鍙鍑虹殑鏁版嵁銆?);
            return;
          }

          const formatHistoryToString = (historyArray) => {
            if (!historyArray || historyArray.length === 0) return "鏃犱慨鏀硅褰?;
            return [...historyArray]
              .reverse()
              .map((record, index) => {
                const recordTime = new Date(record.timestamp).toLocaleString("zh-CN");
                return `[${index + 1}] ${recordTime}: ${record.changeLog}`;
              })
              .join("\n");
          };

          const dataToExport = [];
          const giftSheetData = [];

          let totalAmount = 0;
          let activeCount = 0;
          let abolishedCount = 0;

          // 鐩存帴閬嶅巻宸叉帓搴忕殑 app.gifts 鏁扮粍
          for (let i = 0; i < app.gifts.length; i++) {
            const g = app.gifts[i];
            const isAbolished = g.data.abolished === true;
            const guestLevel = g.data.guestLevel !== undefined ? g.data.guestLevel : 0;
            const guestLevelName = CONFIG.GUEST_LEVELS[guestLevel] || CONFIG.GUEST_LEVELS[0];

            // 澶囨敞澶勭悊 - 鍒嗗埆鎻愬彇鍚勪釜瀛楁
            const remarkData = app.normalizeRemarkData(g.data.remarkData);
            const customRemark = remarkData.custom || "";
            const giftRemark = remarkData.gift || "";
            const relationRemark = remarkData.relation || "";
            const phoneRemark = remarkData.phone || "";
            const addressRemark = remarkData.address || "";

            // 濡傛灉璁板綍鏈夋晥锛堟湭浣滃簾锛変笖绀煎搧澶囨敞涓嶄负绌猴紝鍒欐坊鍔犲埌绀煎搧娓呭崟
            if (!isAbolished && giftRemark) {
              giftSheetData.push({
                濮撳悕: g.data.name,
                绀煎搧鍚嶇О: giftRemark,
                鍏崇郴: relationRemark,
                鐧昏鏃堕棿: new Date(g.data.timestamp).toLocaleString("zh-CN"),
              });
            }

            dataToExport.push({
              濮撳悕: g.data.name,
              閲戦: g.data.amount,
              鏀舵绫诲瀷: g.data.type,
              瀹惧绛夌骇: guestLevelName,
              澶囨敞: customRemark,
              绀煎搧: giftRemark,
              鍏崇郴: relationRemark,
              鐢佃瘽: phoneRemark,
              浣忓潃: addressRemark,
              鐘舵€? isAbolished ? "宸蹭綔搴? : "姝ｅ父",
              浣滃簾鐞嗙敱: isAbolished ? g.data.abolishReason || "" : "",
              鐧昏鏃堕棿: new Date(g.data.timestamp).toLocaleString("zh-CN"),
              淇敼鏃ュ織: formatHistoryToString(g.data.history),
            });

            if (isAbolished) {
              abolishedCount++;
            } else {
              activeCount++;
              totalAmount += g.data.amount;
            }
          }

          dataToExport.push({});
          dataToExport.push({
            濮撳悕: "鎬昏",
            閲戦: totalAmount,
            鏀舵绫诲瀷: `鏈夋晥璁板綍 ${activeCount} 鏉?浣滃簾 ${abolishedCount} 鏉?鍏?${app.gifts.length} 鏉,
          });

          const worksheet = XLSX.utils.json_to_sheet(dataToExport);

          // 璋冩暣鍒楀,涓烘柊澧炵殑鍒楀垎閰嶅悎閫傜殑瀹藉害
          const columnWidths = [
            { wch: 10 }, // 濮撳悕
            { wch: 12 }, // 閲戦
            { wch: 12 }, // 鏀舵绫诲瀷
            { wch: 10 }, // 瀹惧绛夌骇
            { wch: 30 }, // 澶囨敞(鑷畾涔?
            { wch: 20 }, // 绀煎搧 (鍔犲涓€浜?
            { wch: 15 }, // 鍏崇郴
            { wch: 18 }, // 鐢佃瘽
            { wch: 25 }, // 浣忓潃
            { wch: 10 }, // 鐘舵€?
            { wch: 30 }, // 浣滃簾鐞嗙敱
            { wch: 22 }, // 鐧昏鏃堕棿
            { wch: 60 }, // 淇敼鏃ュ織
          ];
          worksheet["!cols"] = columnWidths;

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "绀奸噾鏄庣粏");

          if (giftSheetData.length > 0) {
            // 鍒涘缓绀煎搧娓呭崟鐨?worksheet
            const giftWorksheet = XLSX.utils.json_to_sheet(giftSheetData, {
              header: ["濮撳悕", "绀煎搧鍚嶇О", "鍏崇郴", "鐧昏鏃堕棿"], // 纭繚琛ㄥご椤哄簭
            });

            // 涓虹ぜ鍝佹竻鍗曡缃垪瀹?
            giftWorksheet["!cols"] = [
              { wch: 10 }, // 濮撳悕
              { wch: 30 }, // 绀煎搧鍚嶇О
              { wch: 18 }, // 鍏崇郴
              { wch: 22 }, // 鐧昏鏃堕棿
            ];

            // 灏嗘柊鐨?worksheet 闄勫姞鍒板伐浣滅翱涓紝
            XLSX.utils.book_append_sheet(workbook, giftWorksheet, "绀煎搧娓呭崟");
          }
          const eventDateInfo = Utils.getEventDateInfo(app.currentEvent.startDateTime);
          XLSX.writeFile(workbook, `${app.currentEvent.name}-绀奸噾鏄庣粏(${eventDateInfo.localeDate}).xlsx`);
          app.ui.showNotification("瀵煎嚭鎴愬姛锛?, "success");
        }
      }
      class StatsService {
        /**
         */
        constructor(app) {
          this.app = app;
        }

        /**
         * 鏄剧ず缁熻璇︽儏
         * 鏋勫缓 GridJS 缁熻瑙嗗浘骞舵彁渚涚瓫閫夈€佸鍑鸿兘鍔?
         */
        showStatistics() {
          const app = this.app;
          app.ui.elements.modal.classList.add("modal-large");

          if (app.statsAreDirty || !app.cachedStats) {
            const activeGifts = app.gifts.filter((g) => g.data && !g.data.abolished);
            const abolishedGifts = app.gifts.filter((g) => g.data && g.data.abolished);

            const stats = {
              totalAmount: 0,
              totalGivers: activeGifts.length,
              byType: { 鐜伴噾: 0, 鏀粯瀹? 0, 寰俊: 0, 鍏朵粬: 0 },
              abolishedCount: abolishedGifts.length,
              abolishedAmount: 0,
            };

            activeGifts.forEach(({ data }) => {
              if (data) {
                stats.totalAmount += data.amount;
                stats.byType[data.type] = (stats.byType[data.type] || 0) + data.amount;
              }
            });

            abolishedGifts.forEach(({ data }) => {
              if (data) {
                stats.abolishedAmount += data.amount;
              }
            });

            app.cachedStats = stats;
            app.statsAreDirty = false;
          }

          const stats = app.cachedStats;

          const statsHtml = `
                      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div id="grid-container" class="md:col-span-3 relative">
                          <!-- 绛涢€夋爮 -->
                          <div class="w-1/2 flex items-center gap-3 sm:absolute right-0 z-40">
                            <label class="text-sm font-medium text-gray-700 whitespace-nowrap">绛涢€夋潯浠讹細</label>
                            <select id="stats-filter-select" class="w-full p-3 border rounded-lg themed-ring pr-10">
                              <option value="all">鍏ㄩ儴璁板綍</option>
                              <option value="max-amount">绀奸噾鏈€澶?/option>
                              <option value="min-amount">绀奸噾鏈€灏?/option>
                              <option value="has-remarks">鏈夊娉?/option>
                              <option value="has-gifts">鏈夌ぜ鍝?/option>
                              <option value="abolished">宸蹭綔搴?/option>
                              <optgroup label="鎸夋敹娆炬柟寮忕瓫閫?>
                                <option value="cash">绛涢€夈€岀幇閲戙€?/option>
                                <option value="alipay">绛涢€夈€屾敮浠樺疂銆?/option>
                                <option value="wechat">绛涢€夈€屽井淇°€?/option>
                                <option value="other">绛涢€夈€屽叾浠栥€?/option>
                              </optgroup>
                            </select>
                          </div>
                          <!-- GridJS 琛ㄦ牸瀹瑰櫒 -->
                          <div id="grid-table-container"></div>
                        </div>
                        <div class="space-y-4">
                          <div class="flex justify-between p-3 bg-green-50  border-green-500 rounded-lg">
                            <span class="font-bold text-green-800">鏈夋晥璁板綍浜烘暟:</span>
                            <span class="font-bold text-green-600">${stats.totalGivers} 浜?/span>
                          </div>
                          <div class="flex justify-between p-3 bg-green-50  border-green-500 rounded-lg">
                            <span class="font-bold text-green-800">鏈夋晥鎬婚噾棰?</span>
                            <span class="font-bold text-green-600">${Utils.formatCurrency(stats.totalAmount)}</span>
                          </div>
                          ${
                            stats.abolishedCount > 0
                              ? `
                            <div class="flex justify-between p-3 bg-red-50  border-red-500 rounded-lg">
                              <span class="font-bold text-red-800">浣滃簾璁板綍:</span>
                              <span class="font-bold text-red-600">${stats.abolishedCount} 浜?/span>
                            </div>
                            <div class="flex justify-between p-3 bg-red-50  border-red-500 rounded-lg">
                              <span class="font-bold text-red-800">浣滃簾閲戦:</span>
                              <span class="font-bold text-red-600">${Utils.formatCurrency(stats.abolishedAmount)}</span>
                            </div>
                          `
                              : ""
                          }
                          <div class="border-t pt-4 mt-4">
                            <h4 class="font-semibold mb-2">鎸夋敹娆炬柟寮忕粺璁★紙鏈夋晥璁板綍锛?</h4>
                            <ul class="space-y-2">${Object.entries(stats.byType)
                              .map(([type, amount]) => `<li class="flex justify-between"><span>${type}:</span> <span>${Utils.formatCurrency(amount)}</span></li>`)
                              .join("")}</ul>
                          </div>
                          <div class="border-t pt-4 mt-4">
                            <button id="export-excel-stats-btn" class="w-full themed-button-primary p-3 rounded-lg flex items-center justify-center gap-2">
                              <i class="ri-file-excel-line text-xl"></i>
                              <span>瀵煎嚭 Excel</span>
                            </button>
                          </div>
                        </div>
                      </div>`;

          app.ui.showModal("绀奸噾缁熻璇︽儏", statsHtml, [{ text: "鍏抽棴", class: "themed-button-secondary border px-4 py-2 rounded" }]);

          setTimeout(() => {
            let currentFilteredGifts = [...app.gifts];
            let currentGrid = null;
            const renderGrid = (giftsToShow) => {
              const tableData = giftsToShow.map((g) => {
                const guestLevel = g.data.guestLevel !== undefined ? g.data.guestLevel : 0;
                const guestLevelName = CONFIG.GUEST_LEVELS[guestLevel] || CONFIG.GUEST_LEVELS[0];
                const remarkTextForTable = app.formatRemarkDisplay(g.data.remarkData || {}, " / ") || "鏃?;
                return [
                  g.data.name,
                  g.data.amount,
                  remarkTextForTable, // 浣跨敤鏍煎紡鍖栨柟娉?
                  g.data.type,
                  new Date(g.data.timestamp).toLocaleString("zh-CN"),
                  g.data.abolished ? "宸蹭綔搴? : "姝ｅ父",
                ];
              });

              const shouldPaginate = giftsToShow.length > CONFIG.PRINT_SPLIT_THRESHOLD;
              const gridConfig = {
                columns: ["濮撳悕", "閲戦 (鍏?", "澶囨敞", "鏀舵绫诲瀷", "褰曞叆鏃堕棿", "鐘舵€?],
                data: tableData,
                search: true,
                sort: true,
                fixedHeader: true,
                width: "100%",
                height: "62vh",
                language: {
                  search: { placeholder: "鎼滅储..." },
                  pagination: { previous: "涓婁竴椤?, next: "涓嬩竴椤?, showing: "鏄剧ず", results: () => "鏉＄粨鏋?, to: "鍒?, of: "鍏? },
                  loading: "鍔犺浇涓?..",
                  noRecordsFound: "鏈壘鍒板尮閰嶇殑璁板綍",
                  error: "鑾峰彇鏁版嵁鏃跺彂鐢熼敊璇?,
                },
                style: {
                  th: { "background-color": "var(--primary-color)", color: "#fff" },
                  td: { cursor: "pointer" },
                },
              };

              if (shouldPaginate) {
                gridConfig.pagination = { enabled: true, limit: 50, summary: true };
              } else {
                gridConfig.pagination = false;
              }

              if (currentGrid) {
                try {
                  currentGrid.destroy();
                } catch (e) {}
              }
              const container = document.getElementById("grid-table-container");
              container.innerHTML = "";
              currentGrid = new gridjs.Grid(gridConfig);
              currentGrid.render(container);

              currentGrid.on("rowClick", (...args) => {
                const row = args.length > 1 ? args[1] : args[0];
                const clickedName = row.cells[0].data;
                const clickedTime = row.cells[5].data;

                const clickedGift = giftsToShow.find((g) => g.data.name === clickedName && new Date(g.data.timestamp).toLocaleString("zh-CN") === clickedTime);

                if (clickedGift) {
                  const giftIndex = app.gifts.findIndex((g) => g.id === clickedGift.id);
                  if (giftIndex !== -1) {
                    app.ui.closeModal();
                    setTimeout(() => app.showGiftDetails(giftIndex, { fromStats: true }), 150);
                  }
                }
              });
            };

            renderGrid(currentFilteredGifts);
            const filterSelect = document.getElementById("stats-filter-select");
            filterSelect.addEventListener("change", (event) => {
              const filterType = event.target.value;

              switch (filterType) {
                case "all":
                  currentFilteredGifts = [...app.gifts];
                  break;
                case "max-amount":
                  currentFilteredGifts = [...app.gifts].sort((a, b) => b.data.amount - a.data.amount);
                  break;
                case "min-amount":
                  currentFilteredGifts = [...app.gifts].sort((a, b) => a.data.amount - b.data.amount);
                  break;
                case "has-remarks":
                  currentFilteredGifts = app.gifts.filter((g) => app.hasRemarkData(g.data));
                  break;
                case "has-gifts":
                  currentFilteredGifts = app.gifts.filter((g) => {
                    const remark = app.normalizeRemarkData(g.data.remarkData);
                    return remark.gift && remark.gift.trim() !== "";
                  });
                  break;
                case "abolished":
                  currentFilteredGifts = app.gifts.filter((g) => g.data.abolished === true);
                  break;
                case "cash":
                  currentFilteredGifts = app.gifts.filter((g) => g.data && g.data.type === "鐜伴噾");
                  break;
                case "alipay":
                  currentFilteredGifts = app.gifts.filter((g) => g.data && g.data.type === "鏀粯瀹?);
                  break;
                case "wechat":
                  currentFilteredGifts = app.gifts.filter((g) => g.data && g.data.type === "寰俊");
                  break;
                case "other":
                  currentFilteredGifts = app.gifts.filter((g) => g.data && g.data.type === "鍏朵粬");
                  break;
                default:
                  currentFilteredGifts = [...app.gifts];
              }

              renderGrid(currentFilteredGifts);
            });

            const exportBtn = document.getElementById("export-excel-stats-btn");
            if (exportBtn) {
              exportBtn.addEventListener("click", () => {
                app.exportService.exportToExcel();
              });
            }
          }, 100);
        }

        /**
         * 鏋勫缓绀奸噾璁板綍鍘嗗彶鏃堕棿绾?HTML
         * @param {Array} history - 鍙樻洿鍘嗗彶
         * @param {Object} currentGift - 褰撳墠绀奸噾鏁版嵁
         */
        generateTimelineHTML(history, currentGift) {
          const app = this.app;
          const reversedHistory = [...history].reverse();
          return `
                        <ul class="space-y-4 border-l-2 border-gray-300 ml-2">
                          <li class="relative pl-6 pb-4">
                            <div class="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                            <div class="text-sm text-gray-500">褰撳墠鐘舵€?(${new Date(currentGift.timestamp).toLocaleString("zh-CN")})</div>
                          </li>
                          ${reversedHistory
                            .map(
                              (record, index) => `
                            <li class="relative pl-6 pb-4">
                              <div class="absolute w-3 h-3 bg-gray-400 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                              <div class="text-sm text-gray-500">${new Date(record.timestamp).toLocaleString("zh-CN")}</div>
                              <div class="font-medium text-gray-800 mt-1">${record.changeLog}</div>
                              ${
                                index === reversedHistory.length - 1
                                  ? `<button class="btn-view-original mt-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700" data-history-index="0">鏌ョ湅鏈€鍘熷璁板綍</button>`
                                  : `<button class="btn-view-snapshot mt-2 text-xs text-blue-500 hover:underline" data-history-index="${history.length - 1 - index}">鏌ョ湅姝ょ増鏈揩鐓?/button>`
                              }
                            </li>
                          `
                            )
                            .join("")}
                        </ul>
                      `;
        }
      }

      /**
       * 鍓睆鏈嶅姟
       */
      class GuestScreenService {
        /**
         */
        constructor(app) {
          this.app = app;
          this.guestWindow = null;
          this.isConnected = false;
          this.heartbeatInterval = null;
          this.MESSAGE_TYPES = {
            INIT: "guest_screen_init",
            UPDATE: "guest_screen_update",
            HEARTBEAT: "guest_screen_heartbeat",
            CONFIG: "guest_screen_config",
          };

          window.addEventListener("message", (e) => this.handleMessage(e));
        }

        /**
         */
        handleMessage(event) {
          if (event.data?.type === "guest_screen_ready") {
            this.isConnected = true;
            this.syncToGuestScreen();
            this.startHeartbeat();
          }
        }

        /**
         */
        open() {
          if (this.guestWindow && !this.guestWindow.closed) {
            this.guestWindow.focus();
            return;
          }

          const screenWidth = window.screen.availWidth;
          const screenHeight = window.screen.availHeight;

          this.guestWindow = window.open("./guest-screen.html", "GuestScreen", `width=${screenWidth},height=${screenHeight},left=0,top=0,location=no,menubar=no,toolbar=no`);

          if (this.guestWindow) {
            setTimeout(() => {
              if (this.guestWindow?.document.documentElement.requestFullscreen) {
                this.guestWindow.document.documentElement.requestFullscreen().catch(() => console.log("鏃犳硶鑷姩鍏ㄥ睆"));
              }
            }, 500);
          }
        }

        /**
         */
        syncToGuestScreen() {
          if (!this.guestWindow || this.guestWindow.closed) {
            this.isConnected = false;
            this.stopHeartbeat();
            return;
          }

          const currentPageGifts = this.app.gifts.slice((this.app.currentPage - 1) * app.getItemsPerPage(), this.app.currentPage * app.getItemsPerPage());

          const activeGifts = currentPageGifts.filter((g) => g.data && !g.data.abolished);

          const message = {
            type: this.MESSAGE_TYPES.UPDATE,
            data: {
              eventName: this.app.currentEvent.name,
              theme: this.app.currentEvent.theme,
              currentPage: this.app.currentPage,
              gifts: activeGifts.map((g) => ({
                id: g.id,
                name: g.data.name,
                amount: g.data.amount,
                type: g.data.type,
                amountChinese: Utils.amountToChinese(g.data.amount),
              })),
              hidePrivacy: this.app.currentEvent.hidePrivacy || false,
              typeText: this.app.currentEvent.theme === "theme-solemn" ? "绀奸噾" : "璐虹ぜ",
            },
            timestamp: Date.now(),
          };

          try {
            this.guestWindow.postMessage(message, "*");
          } catch (error) {
            console.error("鍙戦€佹秷鎭埌鍓睆澶辫触:", error);
            this.isConnected = false;
          }
        }

        /**
         */
        startHeartbeat() {
          this.stopHeartbeat();
          this.heartbeatInterval = setInterval(() => {
            if (!this.guestWindow || this.guestWindow.closed) {
              this.isConnected = false;
              this.stopHeartbeat();
              return;
            }

            try {
              this.guestWindow.postMessage(
                {
                  type: this.MESSAGE_TYPES.HEARTBEAT,
                  timestamp: Date.now(),
                },
                "*"
              );
            } catch (error) {
              this.isConnected = false;
              this.stopHeartbeat();
            }
          }, 30000);
        }

        /**
         */
        stopHeartbeat() {
          if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
          }
        }

        /**
         */
        close() {
          this.stopHeartbeat();
          if (this.guestWindow && !this.guestWindow.closed) {
            this.guestWindow.close();
          }
          this.guestWindow = null;
          this.isConnected = false;
        }
      }

      /**
       * GiftBookApp 搴旂敤鏍稿績
       * - 绠＄悊鐢熷懡鍛ㄦ湡銆佷簨浠剁粦瀹氫笌鏁版嵁娴佽浆
       */
      class GiftBookApp {
        /**
         */
        constructor() {
          this.dbManager = new DBManager();
          this.giftRepository = new GiftRepository(this.dbManager);
          this.session = new SessionManager();
          this.passwordCache = new PasswordCache(CONFIG.PASSWORD_CACHE_DURATION);
          this.ui = new UIManager();
          this.giftManager = new GiftManager(this);
          this.exportService = new ExportService(this);
          this.statsService = new StatsService(this);
          this.guestScreenService = new GuestScreenService(this);

          this.currentEvent = null;
          this.currentPassword = null;
          this.gifts = [];
          this.currentPage = 1;
          this.isSpeechEnabled = true;
          this.totalAmountCache = 0;
          this.totalGiversCache = 0;
          this.cachedStats = null;
          this.statsAreDirty = true;
          this.selectedRemarkPresets = new Set();
          this.pdfGenerator = null;
          this.isGeneratingPdf = false;
          this.allGiftsDecrypted = false;
          this.REMARK_LABELS = [
            { key: "custom", label: "澶囨敞" },
            { key: "gift", label: "绀煎搧" },
            { key: "relation", label: "鍏崇郴" },
            { key: "phone", label: "鐢佃瘽" },
            { key: "address", label: "浣忓潃" },
          ];
        }

        /**
         * 搴旂敤鍒濆鍖栧叆鍙?
         * 鍒濆鍖栨暟鎹簱銆佺粦瀹氫簨浠跺苟灏濊瘯鎭㈠涓婃浼氳瘽
         */
        async init() {
          try {
            await this.dbManager.init();
            this.setupInitialUI();
            this.bindEvents();
            await this.tryRestoreSession();
          } catch (error) {
            console.error("搴旂敤鍒濆鍖栧け璐?", error);
            this.ui.showNotification("绯荤粺鍒濆鍖栧け璐ワ紝璇峰埛鏂板悗閲嶈瘯銆?, "error");
          }
        }

        /**
         * 璁剧疆鍒濆 UI 鐘舵€侊紝渚嬪榛樿鏃堕棿涓庤闊冲垪琛?
         */
        setupInitialUI() {
          const { date, time } = Utils.getCurrentDateTime();
          this.ui.elements.startDateInput.value = date;
          this.ui.elements.startTimeInput.value = "00:00"; //time;
          this.ui.elements.endDateInput.value = date;
          this.ui.elements.endTimeInput.value = "23:59";
          this.populateVoiceList();
        }

        /**
         * 灏濊瘯鎭㈠浼氳瘽锛屽鏋滄垚鍔熷垯鐩存帴杩涘叆涓荤晫闈?
         */
        async tryRestoreSession() {
          const savedSession = this.session.load();
          if (!savedSession) {
            await this.loadEvents();
            this.ui.showScreen("setup");
            return;
          }

          try {
            const { event, encryptedPassword } = savedSession;
            const bytes = CryptoJS.AES.decrypt(encryptedPassword, event.passwordHash);
            const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

            if (decryptedPassword) {
              this.currentEvent = event;
              this.currentPassword = decryptedPassword;
              await this.startSession();
            }
          } catch (error) {
            console.error("浼氳瘽鎭㈠澶辫触", error);
            this.session.clear();
            await this.loadEvents();
            this.ui.showScreen("setup");
          }
        }

        /**
         * 鍔犺浇鎵€鏈変簨椤瑰埌閫夋嫨鍒楄〃
         */
        async loadEvents() {
          const events = await this.giftRepository.fetchAllEvents();
          this.ui.elements.eventSelector.innerHTML = '<option value="">璇烽€夋嫨涓€涓簨椤?/option>';

          if (events.length > 0) {
            this.ui.elements.selectEventSection.classList.remove("hidden");
            document.getElementById("or-text").classList.remove("hidden");
            events.forEach((event, index) => {
              const option = document.createElement("option");
              option.value = event.id;
              option.textContent = event.name;
              if (index === events.length - 1) {
                option.selected = true;
              }
              this.ui.elements.eventSelector.appendChild(option);
            });
          } else {
            this.ui.elements.selectEventSection.classList.add("hidden");
            document.getElementById("or-text").classList.add("hidden");
          }
        }

        /**
         * 鍚姩浜嬮」浼氳瘽锛屽簲鐢ㄤ富棰樸€佸姞杞界ぜ閲戞暟鎹苟灞曠ず涓荤晫闈?
         */
        async startSession() {
          this.ui.elements.currentEventTitleEl.textContent = this.currentEvent.name;
          this.ui.applyTheme(this.currentEvent.theme);

          this.applyCustomGiftBookStyle();

          this.currentEvent.printOptions = {
            ...DEFAULT_PRINT_OPTIONS,
            ...(this.currentEvent.printOptions || {}),
          };

          try {
            this.session.save(this.currentEvent, this.currentPassword);
          } catch (error) {
            console.error("浼氳瘽瀛樺偍澶辫触", error);
          }

          // 妫€鏌ヤ簨椤规槸鍚︾粨鏉燂紝鎻愰啋鐢ㄦ埛瀵煎嚭鏁版嵁
          const endTime = new Date(this.currentEvent.endDateTime);
          const now = new Date();

          if (now > endTime && !this.session.hasNotification(this.currentEvent.id)) {
            const title = "璇峰強鏃跺鍑烘暟鎹?;
            const message = `褰撳墠浜嬮」宸茬粨鏉燂紝涓虹‘淇濇暟鎹畨鍏紝寮虹儓寤鸿鎮ㄥ敖蹇€氳繃銆?strong>瀵煎嚭涓?Excel</strong>銆戞垨銆?strong>鎵撳嵃/鍙﹀瓨涓篜DF</strong>銆戝姛鑳斤紝灏嗙ぜ閲戞暟鎹畬鏁村浠借嚦鎮ㄧ殑鐢佃剳鎴栬€呭井淇°€?br>
                             <span class="text-sm text-gray-600">鍘熷洜锛氭椂闂撮暱浜嗭紝瀛樺偍绌洪棿鍙兘浼氬洜娴忚鍣ㄦ竻鐞嗐€佺紦瀛樻竻闄ょ瓑鎿嶄綔琚噸缃紝瀵艰嚧鏁版嵁鎰忓涓㈠け銆?/span>`;

            setTimeout(() => {
              this.ui.showModal(title, message, [{ text: "鎴戝凡鐭ユ檽", class: "themed-button-primary px-4 py-2 rounded", role: "secondary" }]);
              this.session.markNotification(this.currentEvent.id);
            }, 500);
          }

          await this.giftManager.loadGiftsForCurrentEvent();
          this.ui.showScreen("main");
        }
        /**
         * 鏄剧ず鑱旂郴涓庢敮鎸佷綔鑰呭脊绐?
         */
        showAuthorSupportModal() {
          // 瀹氫箟鏍峰紡甯搁噺
          const containerClass = "flex flex-col md:flex-row gap-1 justify-center items-center py-4 px-2";
          const cardClass = "text-center flex-1 w-full flex flex-col items-center";
          const imgBoxClass = "w-48 h-48 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center overflow-hidden mb-3 relative group transition-all hover:border-solid";
          const imgClass = "w-full h-full object-contain p-1";
          const wechatQrSrc = "/addme.jpg";
          const payQrSrc = "/support.jpg";

          const html = `
          <div class="${containerClass}">
            
            <div class="${cardClass}">
              <h4 class="font-bold text-lg text-gray-800 mb-1">鑱旂郴浣滆€?/h4>
              <p class="text-md text-gray-500 mb-4">鍙嶉銆佸姛鑳藉缓璁?路 浜ゆ祦</p>
              <div class="${imgBoxClass} hover:border-blue-400">
                <img src="${wechatQrSrc}" alt="寰俊浜岀淮鐮? class="${imgClass}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-50 text-sm">
                  姝ゅ鏀惧井淇′簩缁寸爜<br>(璇锋浛鎹㈠浘鐗囪矾寰?
                </div>
              </div>
              <p class="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-full mt-1">寰俊浜ゆ祦</p>
            </div>

            <div class="w-full h-px md:w-px md:h-64 bg-gray-200"></div>

            <div class="${cardClass}">
              <h4 class="font-bold text-lg text-gray-800 mb-1">鎵撹祻鏀寔</h4>
              <p class="text-md text-gray-500 mb-4">寮€婧愪笉鏄擄紝璇蜂綔鑰呭枬鏉挅鍟?/p>

              <div class="${imgBoxClass} hover:border-red-400">
                <img src="${payQrSrc}" alt="鏀舵鐮? class="${imgClass}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                <div class="absolute inset-0 hidden items-center justify-center text-gray-400 bg-gray-50 text-sm">
                  姝ゅ鏀炬敹娆剧爜<br>(璇锋浛鎹㈠浘鐗囪矾寰?
                </div>
              </div>
              <p class="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full mt-1">鎰熻阿鎮ㄧ殑榧撳姳涓庢敮鎸?鉂わ笍</p>
            </div>

          </div>
          
          <div class="text-center mt-2 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700 border border-yellow-200">
            <i class="ri-information-line align-middle mr-1"></i>
            鏈▼搴忎负寮€婧愬厤璐圭▼搴忥紝濡傛灉鎮ㄨ寰楄繖涓郴缁熷鎮ㄦ湁甯姪锛屾杩庤仈绯讳綔鑰呮彁寤鸿銆?
          </div>
        `;
          this.ui.showModal("鑱旂郴寮€鍙戣€?, html, [{ text: "鍏抽棴", class: "themed-button-secondary border px-6 py-2 rounded-lg" }]);
        }
        /**
         * 缁戝畾椤甸潰浜や簰浜嬩欢锛岃礋璐ｈ〃鍗曘€佸揩鎹烽敭涓庤緟鍔╁姛鑳?
         */
        bindEvents() {
          // 琛ㄥ崟鎻愪氦浜嬩欢
          this.ui.elements.createEventForm.addEventListener("submit", (e) => this.handleCreateEvent(e));
          this.ui.elements.addGiftForm.addEventListener("submit", (e) => this.handleAddGift(e));
          this.ui.elements.unlockEventBtn.addEventListener("click", () => {
            const eventId = parseInt(this.ui.elements.eventSelector.value, 10);
            if (eventId) this.handleUnlockEvent(eventId);
            else this.ui.showNotification("璇峰厛閫夋嫨涓€涓簨椤广€?);
          });

          // 娣诲姞澶囨敞棰勮鎸夐挳鐨勪簨浠剁洃鍚?
          const presetButtons = document.querySelectorAll(".remark-preset-btn");
          presetButtons.forEach((btn) => {
            btn.addEventListener("click", (e) => {
              e.preventDefault();
              const preset = btn.dataset.preset;
              this.toggleRemarkPreset(preset, btn);
            });
          });
          // 鍒嗛〉鎸夐挳
          this.ui.elements.prevPageBtn.addEventListener("click", () => this.giftManager.changePage(-1));
          this.ui.elements.nextPageBtn.addEventListener("click", () => this.giftManager.changePage(1));

          // 鍔熻兘鎸夐挳
          this.ui.elements.printBtn.addEventListener("click", () => this.exportService.prepareForPrint());
          this.ui.elements.exportExcelBtn.addEventListener("click", () => this.exportService.exportToExcel());
          this.ui.elements.statsBtn.addEventListener("click", () => this.statsService.showStatistics());
          this.ui.elements.searchIcon.addEventListener("click", () => this.handleSearch());
          this.ui.elements.searchNameInput.addEventListener("keyup", (e) => e.key === "Enter" && this.handleSearch());

          // 璇煶寮€鍏?
          this.ui.elements.speechToggle.addEventListener("change", (e) => {
            this.isSpeechEnabled = e.target.checked;
          });

          // 绀肩翱鐐瑰嚮浜嬩欢
          this.ui.elements.giftBookContent.addEventListener("click", (e) => {
            const cell = e.target.closest("[data-gift-index]");
            if (!cell) return;
            const giftIndex = parseInt(cell.dataset.giftIndex, 10);
            if (isNaN(giftIndex)) return;

            if (cell.classList.contains("name-cell")) {
              this.showGiftDetails(giftIndex);
            } else if (cell.classList.contains("amount-cell") && this.gifts[giftIndex]) {
              const { name, amount } = this.gifts[giftIndex].data;
              this.speakGift(name, amount);
            }
          });

          // 浜嬮」涓嬫媺鑿滃崟
          this.ui.elements.eventSwitcherTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            const dropdown = this.ui.elements.eventDropdown;
            const isHidden = dropdown.classList.contains("hidden");
            if (isHidden) {
              dropdown.innerHTML = `
                            <a href="#" class="block px-4 py-2 text-sm themed-text font-semibold themed-link-hover" data-action="switch">鍒囨崲/鍒涘缓浜嬮」</a>
                            <a href="#" class="block px-4 py-2 text-sm themed-text font-semibold themed-link-hover" data-action="backup">澶囦唤/鎭㈠鏁版嵁</a>
                            <a href="#" class="block px-4 py-2 text-sm themed-text font-semibold themed-link-hover" data-action="guest-screen">杩涘叆鍓睆</a>
                            <a href="#" class="block px-4 py-2 text-sm themed-text font-semibold themed-link-hover" data-action="edit">璁剧疆姝や簨椤?/a>
                            <a href="#" class="block px-4 py-2 text-sm themed-text font-semibold themed-link-hover" data-action="delete">鍒犻櫎姝や簨椤?/a>`;
            }
            dropdown.classList.toggle("hidden");
          });

          this.ui.elements.eventDropdown.addEventListener("click", (e) => {
            e.preventDefault();
            const action = e.target.dataset.action;
            if (action) {
              this.ui.elements.eventDropdown.classList.add("hidden");
              switch (action) {
                case "switch":
                  this.showSetupScreen();
                  break;
                case "edit":
                  this.showEditEventInfoModal();
                  break;
                case "backup":
                  this.exportService.showBackupRestoreModal();
                  break;
                case "guest-screen":
                  this.openGuestScreen();
                  break;
                case "delete":
                  this.deleteCurrentEvent();
                  break;
              }
            }
          });

          // 璺抽〉鍔熻兘
          this.ui.elements.pageInfoEl.addEventListener("focusout", (e) => {
            if (e.target && e.target.id === "current-page-input") {
              this.handlePageInputChange(e);
            }
          });

          this.ui.elements.pageInfoEl.addEventListener("keydown", (e) => {
            if (e.target && e.target.id === "current-page-input" && e.key === "Enter") {
              e.preventDefault();
              this.handlePageInputChange(e);
              e.target.blur();
            }
          });

          // 鍏ㄥ睆鎸夐挳
          this.ui.elements.fullscreenBtn.addEventListener("click", () => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen();
            } else if (document.exitFullscreen) {
              document.exitFullscreen();
            }
          });
          this.ui.elements.supportBtn?.addEventListener("click", () => this.showAuthorSupportModal());
          document.addEventListener("fullscreenchange", () => {
            const isFullscreen = !!document.fullscreenElement;
            if (isFullscreen) {
              this.ui.elements.fullscreenIcon.classList.remove("ri-fullscreen-line");
              this.ui.elements.fullscreenIcon.classList.add("ri-fullscreen-exit-line");
            } else {
              this.ui.elements.fullscreenIcon.classList.remove("ri-fullscreen-exit-line");
              this.ui.elements.fullscreenIcon.classList.add("ri-fullscreen-line");
            }
          });

          // 璇煶棰勮
          this.ui.elements.previewCreateVoiceBtn.addEventListener("click", () => {
            this.previewSelectedVoice(this.ui.elements.eventVoiceSelect);
          });

          // 鐐瑰嚮绌虹櫧鍏抽棴涓嬫媺鑿滃崟
          window.addEventListener("click", () => this.ui.elements.eventDropdown.classList.add("hidden"));

          // 閿洏蹇嵎閿?
          document.addEventListener("keydown", (e) => {
            if (e.ctrlKey && e.key.toLowerCase() === "p") {
              e.preventDefault();
              this.exportService.prepareForPrint();
              return;
            }

            const isModalVisible = !this.ui.elements.modalContainer.classList.contains("hidden");
            const activeElement = document.activeElement;
            const isMainScreenVisible = !this.ui.elements.mainScreen.classList.contains("hidden");

            if (isModalVisible) {
              if (e.key === "Escape") {
                e.preventDefault();
                // 浼樺厛瑙﹀彂 secondary锛堥€氬父涓哄彇娑堬級
                this.ui.elements.modalActions.querySelector('button[data-role="secondary"]')?.click();
                return;
              }
              if (e.key === "Enter" && activeElement.tagName !== "TEXTAREA" && !activeElement.classList.contains("gridjs-input")) {
                e.preventDefault();
                // 濮嬬粓瑙﹀彂 primary锛堢‘璁わ級鎸夐挳锛岄伩鍏嶈瑙﹀彇娑?
                const primaryBtn = this.ui.elements.modalActions.querySelector('button[data-role="primary"]') || this.ui.elements.modalActions.querySelector("button:last-child");
                primaryBtn?.click();
                return;
              }
              return;
            }

            // 鍦ㄤ富鐣岄潰涓斾笉鍦ㄨ緭鍏ユ涓椂锛屾敮鎸佹柟鍚戦敭缈婚〉
            if (isMainScreenVisible && activeElement.tagName !== "INPUT" && activeElement.tagName !== "TEXTAREA") {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                // 宸︾澶?= 涓婁竴椤?
                if (!this.ui.elements.prevPageBtn.disabled) {
                  this.giftManager.changePage(-1);
                }
                return;
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                // 鍙崇澶?= 涓嬩竴椤?
                if (!this.ui.elements.nextPageBtn.disabled) {
                  this.giftManager.changePage(1);
                }
                return;
              }
            }

            if (e.key === "Enter" && isMainScreenVisible && activeElement.tagName !== "TEXTAREA") {
              const guestName = this.ui.elements.guestNameInput.value.trim();
              const giftAmount = this.ui.elements.giftAmountInput.value.trim();

              if (guestName && giftAmount) {
                e.preventDefault();
                this.ui.elements.addGiftForm.querySelector('button[type="submit"]')?.click();
              }
            }
          });
        }

        /**
         */
        handlePageInputChange(e) {
          const input = e.target;
          const newPage = parseInt(input.value, 10);
          const totalPages = Math.ceil(this.gifts.length / app.getItemsPerPage()) || 1;

          if (!isNaN(newPage) && newPage >= 1 && newPage <= totalPages && newPage !== this.currentPage) {
            this.currentPage = newPage;
            this.giftManager.ensureCurrentPageDecrypted();
            this.giftManager.render();
          } else {
            input.value = this.currentPage;
          }
        }

        /**
         * 鏍规嵁浜嬮」 ID 鏍￠獙绠＄悊鍛樺瘑鐮佸苟杩涘叆浼氳瘽
         */
        async handleUnlockEvent(eventId) {
          const event = await this.giftRepository.fetchEvent(eventId);
          if (!event) {
            this.ui.showNotification("鏈壘鍒拌浜嬮」銆?, "error");
            return;
          }

          // 浣跨敤缁熶竴鐨勫瘑鐮佹牎楠屾柟娉?
          const password = await this.requestAdminPassword("杈撳叆绠＄悊瀵嗙爜", null, event.passwordHash, true);

          if (password === null) {
            // 鐢ㄦ埛鍙栨秷
            return;
          }

          if (password) {
            this.currentEvent = event;
            this.currentPassword = password;
            await this.startSession();
          }
        }

        /**
         * 杩斿洖鍒涘缓/閫夋嫨浜嬮」鐣岄潰骞舵竻闄ゅ綋鍓嶄細璇?
         */
        showSetupScreen() {
          const previousEventId = this.currentEvent?.id;
          this.session.clear();
          this.currentEvent = null;
          this.currentPassword = null;
          this.gifts = [];
          if (previousEventId) {
            this.passwordCache.clear(previousEventId);
          }
          // 鎭㈠鍒涘缓琛ㄥ崟鐨勫紑濮?缁撴潫榛樿鏃堕棿
          this.setupInitialUI();
          this.ui.showScreen("setup");
          this.loadEvents();
        }

        /**
         * 鍒涘缓鏂颁簨椤癸紝鍖呭惈琛ㄥ崟鏍￠獙涓庡皝闈€佹墦鍗伴厤缃鐞?
         */
        async handleCreateEvent(e) {
          e.preventDefault();
          const name = this.ui.elements.eventNameInput.value.trim();
          const startDateTime = `${this.ui.elements.startDateInput.value}T${this.ui.elements.startTimeInput.value}`;
          const endDateTime = `${this.ui.elements.endDateInput.value}T${this.ui.elements.endTimeInput.value}`;
          const password = this.ui.elements.adminPasswordInput.value;
          const theme = this.ui.elements.eventThemeSelect.value;
          const voiceName = this.ui.elements.eventVoiceSelect.value;
          const recorder = document.getElementById("event-recorder").value.trim();
          const pdfEngine = "browser";

          if (!name || !password || !startDateTime || !endDateTime) {
            this.ui.showNotification("璇峰～鍐欐墍鏈夊繀濉」銆?, "error");
            return;
          }

          if (new Date(startDateTime) >= new Date(endDateTime)) {
            this.ui.showNotification("寮€濮嬫椂闂村繀椤绘棭浜庣粨鏉熸椂闂淬€?, "error");
            return;
          }

          let coverType = "default";
          // 寮圭獥浜屾楠岃瘉鍒氳緭鍏ョ殑绠＄悊瀵嗙爜锛岄槻姝㈣閿?
          const verifyContent = `
                        <div class="text-left">
                          <p class="mb-2">涓虹‘淇濈鐞嗗瘑鐮佽緭鍏ユ棤璇紝璇峰啀娆¤緭鍏ヤ互纭锛?/p>
                          <input type="password" id="verify-create-pwd" class="w-full p-2 border rounded themed-ring" placeholder="鍐嶆杈撳叆绠＄悊瀵嗙爜">
                          <p class="text-xs text-gray-500 mt-2">鎻愮ず锛氫袱娆″瘑鐮侀渶瀹屽叏涓€鑷达紝鎵嶅彲浠ュ垱寤轰簨椤广€?/p>
                        </div>
                      `;

          this.ui.showModal("纭绠＄悊瀵嗙爜", verifyContent, [
            { text: "鍙栨秷", class: "themed-button-secondary border px-4 py-2 rounded", role: "secondary" },
            {
              text: "纭鍒涘缓",
              class: "themed-button-primary px-4 py-2 rounded",
              role: "primary",
              keepOpen: true,
              handler: async () => {
                const verifyPwd = document.getElementById("verify-create-pwd").value;
                if (verifyPwd !== password) {
                  this.ui.showNotification("涓ゆ杈撳叆鐨勭鐞嗗瘑鐮佷笉涓€鑷达紝璇烽噸鏂扮‘璁?, "error");
                  return;
                }

                const newEvent = {
                  name,
                  startDateTime,
                  endDateTime,
                  passwordHash: CryptoService.hash(password),
                  theme,
                  voiceName,
                  coverType: coverType,
                  recorder: recorder,
                  minSpeechAmount: 0,
                  coverType,
                  printOptions: {
                    ...DEFAULT_PRINT_OPTIONS,
                    pdfEngine,
                  },
                };

                try {
                  const newEventId = await this.giftRepository.createEvent(newEvent);
                  this.currentEvent = { ...newEvent, id: newEventId };
                  this.currentPassword = password;

                  this.ui.elements.createEventForm.reset();
                  this.ui.closeModal();
                  await this.startSession();
                  this.ui.showNotification("浜嬮」鍒涘缓鎴愬姛銆?, "success");
                } catch (error) {
                  this.ui.showNotification("鍒涘缓浜嬮」澶辫触锛岃閲嶈瘯銆?, "error");
                }
              },
            },
          ]);

          setTimeout(() => document.getElementById("verify-create-pwd")?.focus(), 50);
        }

        /**
         * 澶勭悊绀奸噾褰曞叆琛ㄥ崟鎻愪氦
         * 楠岃瘉杈撳叆骞舵鏌ラ噸澶嶄俊鎭悗缁欏嚭纭鎻愮ず
         */
        async handleAddGift(e) {
          e.preventDefault();
          const name = this.ui.elements.guestNameInput.value.trim();
          const amountStr = this.ui.elements.giftAmountInput.value;
          const type = document.querySelector('input[name="payment-type"]:checked')?.value;
          const remarkData = this.collectRemarkData();
          // 楠岃瘉蹇呭～瀛楁
          if (!name || !amountStr || !type) {
            this.ui.showNotification("淇℃伅涓嶅畬鏁达紝璇峰～鍐欏鍚嶃€侀噾棰濆苟閫夋嫨鏀舵绫诲瀷銆?, "error");
            return;
          }

          // 楠岃瘉閲戦鏈夋晥鎬?
          const amount = parseFloat(amountStr);
          if (isNaN(amount) || amount < 0) {
            this.ui.showNotification("閲戦鏃犳晥锛岃杈撳叆闈炶礋閲戦銆?, "error");
            return;
          }

          if (type === "鍏朵粬" && (!remarkData.custom || remarkData.custom.trim() === "")) {
            this.ui.showNotification("褰撴敹娆剧被鍨嬩负鈥滃叾浠栤€濇椂锛岃鍦ㄥ娉ㄤ腑璇存槑鍏蜂綋鎯呭喌銆?, "error");
            return; // 闃绘鎻愪氦
          }
          // 妫€鏌ラ噸澶嶈褰曪細鍚屽悕鎴栧悓鍚嶅悓閲戦
          const sameNameGifts = this.gifts.filter((g) => g.data?.name === name);
          const exactMatchExists = sameNameGifts.some((g) => g.data?.amount === amount);

          // 鏄剧ず纭瀵硅瘽妗嗭紙鏍规嵁閲嶅鎯呭喌鏄剧ず涓嶅悓鐨勮鍛婄骇鍒級
          this.showGiftConfirmationModal(name, amount, remarkData, type, sameNameGifts.length > 0, exactMatchExists);
        }

        /**
         * 绀奸噾褰曞叆纭寮圭獥
         * 鏍规嵁閲嶅鎯呭喌灞曠ず鎻愮ず骞跺厑璁歌ˉ鍏呭娉?
         */
        showGiftConfirmationModal(name, amount, remarkData, type, nameExists, exactMatchExists) {
          let modalTitle, modalContent;
          this.ui.elements.giftAmountInput.blur();
          const remarkDisplay = this.formatRemarkDisplay(remarkData);

          // 鐢熸垚澶囨敞杈撳叆妗咹TML锛堜娇鐢ㄩ€氱敤鏂规硶锛?
          const remarkInputsHTML = `
                          <label class="block text-sm font-medium text-gray-700">濡傞潪閲嶅锛屽缓璁～鍐欏娉?閫夊～)</label>
                          <div class="space-y-2">
                            ${this.generateRemarkInputsHTML(remarkData)}
                          </div>
                      `;

          if (exactMatchExists) {
            modalTitle = "閲嶅淇℃伅纭";
            modalContent = `
                          <div class="space-y-3 text-left">
                            <div class="p-3 bg-red-100 border-red-500 text-red-800 rounded-md">
                              <strong class="font-bold">璀﹀憡锛?/strong>
                              <p class="text-sm">绯荤粺涓凡瀛樺湪鈥滅浉鍚屽鍚嶁€濅笖鈥滅浉鍚岄噾棰濃€濈殑璁板綍锛屼负閬垮厤閲嶅褰曞叆锛岃浠旂粏鏍稿銆?/p>
                            </div>
                            <p><strong>鏉ュ濮撳悕:</strong> <span class="text-lg">${name}</span></p>
                            <p><strong>閲戦:</strong> <span class="font-bold text-xl themed-text">${Utils.formatCurrency(amount)}</span></p>
                            ${remarkInputsHTML}
                          </div>`;
          } else if (nameExists) {
            modalTitle = "鍚屽悕淇℃伅纭";
            modalContent = `
                          <div class="space-y-3 text-left">
                            <div class="p-2 bg-yellow-100 text-yellow-800 rounded-md text-sm">
                              <strong>娉ㄦ剰锛?/strong>绯荤粺涓凡瀛樺湪鍚嶄负 <strong>${name}</strong> 鐨勮褰曘€備负閬垮厤娣锋穯锛屽缓璁偍娣诲姞澶囨敞銆?
                            </div>
                            <p><strong>鏉ュ濮撳悕:</strong> <span class="text-lg">${name}</span></p>
                            <p><strong>閲戦:</strong> <span class="font-bold text-xl themed-text">${Utils.formatCurrency(amount)}</span></p>
                            ${remarkInputsHTML}
                          </div>`;
          } else {
            modalTitle = "璇风‘璁ゅ綍鍏ヤ俊鎭?;
            modalContent = `
                          <div class="space-y-3 text-left">
                            <p><strong>鏉ュ濮撳悕:</strong> <span class="text-lg">${name}</span></p>
                            <p><strong>鏁板瓧閲戦:</strong> <span class="font-bold text-xl themed-text">${Utils.formatCurrency(amount)}</span></p>
                            <p><strong>澶у啓閲戦:</strong> <span class="font-bold text-xl themed-text">${Utils.amountToChinese(amount)}</span></p>
                            ${remarkDisplay ? `<p><strong>澶囨敞:</strong> ${remarkDisplay}</p>` : ""}
                          </div>`;
          }

          const confirmationHandler = () => {
            // 鍦ㄥ悓鍚嶆垨閲嶅纭鐨勬儏鍐典笅锛屾敹闆嗘洿鏂板悗鐨勫娉ㄦ暟鎹?
            const finalRemarkData = nameExists || exactMatchExists ? this.collectRemarkData(true) : remarkData;
            this.saveGift({ name, amount, type, remarkData: finalRemarkData });
          };

          this.ui.showModal(modalTitle, modalContent, [
            { text: "杩斿洖淇敼", class: "themed-button-secondary border px-4 py-2 rounded" },
            { text: "纭鎻愪氦", class: "themed-button-primary px-4 py-2 rounded", handler: confirmationHandler, keepOpen: true },
          ]);
        }

        /**
         * 鎵撳紑鍓睆绐楀彛
         */
        openGuestScreen() {
          if (!this.currentEvent) {
            this.ui.showNotification("璇峰厛杩涘叆涓€涓簨椤广€?, "error");
            return;
          }

          this.guestScreenService.open();
          this.ui.showNotification("鍓睆宸叉墦寮€锛屽鏈嚜鍔ㄥ叏灞忚鎸?F11銆?, "info");
        }

        /**
         * 淇濆瓨绀奸噾璁板綍
         * @param {Object} giftData - 绀奸噾鏁版嵁
         */
        async saveGift(giftData) {
          const isOutOfTime = new Date() < new Date(this.currentEvent.startDateTime) || new Date() > new Date(this.currentEvent.endDateTime);

          if (isOutOfTime) {
            const password = await this.requestAdminPassword("绀奸噾琛ュ綍", "褰撳墠宸茶秴鍑烘湁鏁堝綍鍏ユ椂闂?璇疯緭鍏ョ鐞嗗瘑鐮佽繘琛岃ˉ褰曘€?, null, false);
            if (password === null) {
              this.ui.closeModal();
              return;
            }
          }

          try {
            // 榛樿绛夌骇涓?0锛堥泤瀹撅級
            const guestLevel = giftData.guestLevel !== undefined ? giftData.guestLevel : 0;

            // timestamp 鏀惧叆 encryptedData锛岀敤浜庢樉绀哄垱寤?淇敼鏃堕棿
            const fullGiftData = {
              ...giftData,
              timestamp: new Date().toISOString(),
              guestLevel,
            };
            const encryptedData = CryptoService.encrypt(fullGiftData, this.currentPassword);

            // levelUpdateTime 榛樿涓?0锛堟湭淇敼杩囩瓑绾э級
            const newGiftId = await this.giftRepository.createGift({
              eventId: this.currentEvent.id,
              encryptedData,
              guestLevelWeight: guestLevel,
              levelUpdateTime: 0, // 鏂板鏃朵负 0锛岃〃绀烘湭淇敼杩囩瓑绾?
            });

            // 浼樺寲锛氱洿鎺ユ彃鍏ユ柊璁板綍鍒板唴瀛橈紝閬垮厤閲嶆柊鏌ヨ
            const newGift = {
              id: newGiftId,
              eventId: this.currentEvent.id,
              encryptedData,
              guestLevelWeight: guestLevel,
              levelUpdateTime: 0,
              data: fullGiftData,
              _needsDecrypt: false,
            };

            this.gifts.push(newGift);
            this.giftManager.sortGiftsByLevel();

            // 鏇存柊缂撳瓨
            this.giftManager.updateCacheOnAdd(giftData.amount);

            // 璺宠浆鍒版柊璁板綍鎵€鍦ㄩ〉
            const newIndex = this.gifts.findIndex((g) => g.id === newGiftId);
            if (newIndex !== -1) {
              this.currentPage = Math.floor(newIndex / app.getItemsPerPage()) + 1;
            }

            this.ui.closeModal();
            this.ui.elements.addGiftForm.reset();
            document.querySelector('input[name="payment-type"][value="鐜伴噾"]').checked = true;
            this.resetRemarkPresets();
            this.ui.elements.guestNameInput.focus();
            this.giftManager.render();
            this.speakGift(giftData.name, giftData.amount);
            this.ui.showNotification("褰曞叆鎴愬姛锛?, "success");
            this.guestScreenService.syncToGuestScreen();
          } catch (error) {
            this.ui.closeModal();
            console.error("褰曞叆澶辫触:", error);
            this.ui.showNotification("褰曞叆澶辫触锛岃閲嶈瘯銆?, "error");
          }
        }

        /**
         * 濮撳悕鎼滅储
         * 鏀寔鍚屽悕绛涢€変笌蹇嵎璺宠浆璇︽儏
         */
        handleSearch() {
          const searchTerm = this.ui.elements.searchNameInput.value.trim();
          if (!searchTerm) {
            this.ui.showNotification("璇疯緭鍏ュ鍚嶈繘琛屾悳绱€?);
            return;
          }

          const results = [];
          for (let i = 0; i < this.gifts.length; i++) {
            // 纭繚瑙ｅ瘑鍚庣殑 data 瀛樺湪
            if (this.gifts[i].data?.name.includes(searchTerm)) {
              results.push({ ...this.gifts[i], originalIndex: i });
            }
          }
          this.ui.elements.searchNameInput.blur();

          if (results.length === 0) {
            this.ui.showNotification(`娌℃湁鎵惧埌濮撳悕涓?\"${searchTerm}\" 鐨勮褰昤);
            return;
          }

          const resultsHtml = results
            .map((r) => {
              const giftData = r.data;
              const remarkText = this.formatRemarkDisplay(giftData.remarkData || null);

              // 鍙湁褰?remarkText 鏈夊唴瀹规椂锛屾墠鐢熸垚澶囨敞鐨凥TML
              const remarkHtml = remarkText ? `<p class="text-sm text-red-500 mt-1"><strong>澶囨敞:</strong> ${remarkText}</p>` : "";

              return `
                        <div class="p-3 border-b flex justify-between items-center">
                          <div>
                            <p><strong>濮撳悕:</strong> ${giftData.name}</p>
                            <p><strong>閲戦:</strong> ${giftData.amount.toFixed(2)} 鍏?(${giftData.type})</p>
                            ${remarkHtml}
                          </div>
                          <button class="view-details-btn themed-button-primary px-3 py-1 rounded" data-gift-index="${r.originalIndex}">鏌ョ湅璇︽儏</button>
                        </div>
                      `;
            })
            .join("");

          this.ui.showModal(`"${searchTerm}" 鐨勬悳绱㈢粨鏋渀, `<div class="max-h-80 overflow-y-auto">${resultsHtml}</div>`, [{ text: "鍏抽棴", class: "themed-button-secondary border px-4 py-2 rounded" }]);

          setTimeout(() => {
            document.querySelectorAll(".view-details-btn").forEach((btn) => {
              btn.onclick = () => {
                const giftIndex = parseInt(btn.dataset.giftIndex, 10);
                this.ui.closeModal();
                setTimeout(() => this.showGiftDetails(giftIndex), 150);
              };
            });
          }, 50);
        }

        /**
         * 灞曠ず绀奸噾璇︽儏寮圭獥锛屽苟缁戝畾璇︽儏鍖哄煙鎿嶄綔鎸夐挳
         * @param {number} giftIndex - 褰撳墠绀奸噾鍦?this.gifts 涓殑涓嬫爣
         * @param {Object} options - 棰濆閰嶇疆
         * @param {boolean} options.fromStats - 鏄惁鏉ヨ嚜缁熻椤碉紙闅愯棌杩斿洖鎸夐挳锛?
         *
         * 鏍稿績鑱岃矗锛?
         * - 娓叉煋绀奸噾鍩虹淇℃伅銆佸槈瀹剧瓑绾с€佸娉ㄨ鎯?
         * - 鎺у埗绾犻敊銆佷慨鏀归噾棰濄€佸娉ㄣ€佹挙閿€绛夊叆鍙?
         * - 鍦ㄥ瓨鍦ㄥ巻鍙茶褰曟椂鎷艰鏃堕棿绾垮苟鏀寔蹇収鏌ョ湅
         */
        showGiftDetails(giftIndex, options = {}) {
          const { fromStats = false } = options;
          const gift = this.gifts[giftIndex];
          if (!gift || !gift.data) return;

          const g = gift.data;
          const hasHistory = g.history && g.history.length > 0;
          const isAbolished = g.abolished === true;
          const nameCorrectionCount = countNameCorrections(g.history);
          const remainingNameCorrections = Math.max(0, 2 - nameCorrectionCount);
          const canCorrectName = !isAbolished && remainingNameCorrections > 0;
          const amountCorrectionCount = countAmountCorrections(g.history);
          const remainingAmountCorrections = Math.max(0, 1 - amountCorrectionCount);
          const canModifyAmount = !isAbolished && remainingAmountCorrections > 0;

          // 鐢熸垚鍢夊绛夌骇閫夐」锛堜娇寰楀槈瀹剧瓑绾ч珮鐨勬帓鍦ㄥ墠闈級
          const guestLevel = g.guestLevel !== undefined ? g.guestLevel : 0;
          const levelOptions = CONFIG.GUEST_LEVELS.map((levelName, index) => ({ levelName, index }))
            .reverse() // 鍙嶈浆鏁扮粍锛屽緱绛夌骇楂樼殑鎺掑墠闈?
            .map(({ levelName, index }) => `<option value="${index}" ${index === guestLevel ? "selected" : ""}>${levelName}</option>`)
            .join("");

          // 鏍规嵁鍓╀綑绾犻敊/淇敼娆℃暟鎺у埗鎸夐挳鏄惁鍙敤鍙婃彁绀烘枃妗?
          const correctNameButtonHtml = !isAbolished
            ? `<button id="btn-correct-name" data-remaining-corrections="${remainingNameCorrections}" class="text-sm text-blue-600 hover:underline px-2 py-1 ${canCorrectName ? "" : "opacity-50 cursor-not-allowed"}" ${
                canCorrectName ? "" : 'disabled data-fixed-disabled="true" title="濮撳悕绾犻敊娆℃暟宸茶揪涓婇檺"'
              }>绾犻敊</button>`
            : "";
          const modifyAmountButtonHtml = !isAbolished
            ? `<button id="btn-modify-amount" data-remaining-amount-corrections="${remainingAmountCorrections}" class="text-sm text-blue-600 hover:underline px-2 py-1 ${
                canModifyAmount ? "" : "opacity-50 cursor-not-allowed"
              }" ${canModifyAmount ? "" : 'disabled data-fixed-disabled="true" title="閲戦宸蹭慨鏀癸紝鏃犳硶鍐嶆璋冩暣"'}>淇敼</button>`
            : "";
          const detailsHtml = `
                      <div class="space-y-4 text-left h-full flex flex-col" id="current-details-container" data-gift-index="${giftIndex}">
                        <div class="flex justify-between items-center border-b pb-2 mb-2">
                          <h4 class="font-bold text-lg">褰撳墠璁板綍淇℃伅</h4>
                        </div>
                        ${
                          isAbolished
                            ? `
                          <div class="p-3 bg-red-50  border-red-500 text-red-800 rounded">
                            <p class="font-bold flex items-center"><i class="ri-error-warning-line mr-2"></i>姝よ褰曞凡浣滃簾銆?/p>
                            <p class="text-sm mt-1"><strong>浣滃簾鐞嗙敱锛?/strong>${g.abolishReason || "鏃?}</p>
                            <p class="text-xs text-gray-600 mt-1">浣滃簾鏃堕棿锛?{new Date(g.abolishTime).toLocaleString("zh-CN")}</p>
                          </div>
                        `
                            : ""
                        }

                        <div id="name-display-area" class="flex justify-between items-center p-2 hover:bg-gray-50 rounded ${isAbolished ? "opacity-60" : ""}">
                          <div class="flex items-center gap-3 flex-wrap">
                            <div><strong>濮撳悕:</strong> <span class="text-lg ml-2">${g.name}</span></div>
                            ${
                              !isAbolished
                                ? `
                              <div class="flex items-center gap-2">
                                <select id="guest-level-select" class="text-sm px-3 py-1.5 border border-gray-300 rounded-md bg-white themed-ring cursor-pointer">
                                  ${levelOptions}
                                </select>
                              </div>
                            `
                                : ""
                            }
                          </div>
                          ${correctNameButtonHtml}
                        </div>

                        <div id="amount-display-area" class="flex justify-between items-center p-2 hover:bg-gray-50 rounded ${isAbolished ? "opacity-60" : ""}">
                          <div>
                            <p><strong>閲戦:</strong> <span class="font-bold themed-text text-lg ml-2 ${isAbolished ? "line-through" : ""}">${Utils.formatCurrency(g.amount)}</span></p>
                            <p class="text-sm text-gray-500 mt-1"><strong>绫诲瀷:</strong> ${g.type}</p>
                          </div>
                          ${modifyAmountButtonHtml}
                        </div>

                        <div id="remarks-display-area" class="p-2 hover:bg-gray-50 rounded ${isAbolished ? "opacity-60" : ""}">
                          <div class="flex justify-between items-start">
                            <strong>澶囨敞:</strong>
                            ${!isAbolished ? '<button id="btn-edit-remarks" class="text-sm text-blue-600 hover:underline px-2 py-1">淇敼</button>' : ""}
                          </div>
                          <div class="mt-1 text-gray-700 space-y-1">
                            ${this.formatRemarkDetailsDisplay(g.remarkData)}
                          </div>
                        </div>

                        <div class="text-sm text-gray-400 border-t pt-2 mt-auto">
                          褰曞叆/淇敼鏃堕棿: ${new Date(g.timestamp).toLocaleString("zh-CN")}
                        </div>
                      </div>`;

          let modalContent = "";
          if (hasHistory) {
            this.ui.elements.modal.classList.add("modal-large");
            const timelineHtml = this.statsService.generateTimelineHTML(g.history, g);
            modalContent = `
                        <div class="grid grid-cols-1 md:grid-cols-6 gap-6 h-[60vh]">
                          <div class="md:col-span-3 border-r pr-4 overflow-y-auto">${detailsHtml}</div>
                          <div class="md:col-span-3 pl-2 bg-gray-50 rounded-lg p-4">
                            <h4 class="font-bold text-lg border-b pb-2 mb-4 flex justify-between items-center">
                              <span>鍘嗗彶淇敼鐥曡抗</span>
                            </h4>
                            ${timelineHtml}
                          </div>
                        </div>`;
          } else {
            this.ui.elements.modal.classList.remove("modal-large");
            modalContent = detailsHtml;
          }

          // 纭繚妯℃€佹寜閽彲瑙?
          this.ui.elements.modalActions.classList.remove("hidden");

          // 鏍规嵁鏉ユ簮鍐冲畾鎸夐挳鏂囧瓧鍜岃涓?
          const modalButtons = fromStats
            ? [
                {
                  text: "杩斿洖缁熻",
                  class: "themed-button-secondary border px-4 py-2 rounded",
                  handler: () => this.statsService.showStatistics(),
                  keepOpen: true,
                },
              ]
            : [
                { text: '<i class="ri-delete-bin-line mr-1"></i>浣滃簾姝よ褰?, class: "themed-button-secondary border px-4 py-2 rounded mr-auto", handler: () => this.giftManager.abolishGift(giftIndex), keepOpen: true },
                { text: "鍏抽棴", class: "themed-button-secondary border px-4 py-2 rounded" },
              ];

          this.ui.showModal(`${g.name} 鐨勭ぜ閲戣鎯?${hasHistory ? '<p class="text-sm text-orange-600 font-normal">锛堣鍛婏細姝ゅ瀹㈡暟鎹瓨鍦ㄤ慨鏀癸紝璇疯嚜琛岄獙璇佹暟鎹湡瀹炴€э紒锛?/p>' : ""}`, modalContent, modalButtons);

          // 缁戝畾缂栬緫鍜屼綔搴熸寜閽簨浠?
          setTimeout(() => {
            const btnCorrectName = document.getElementById("btn-correct-name");
            const btnModifyAmount = document.getElementById("btn-modify-amount");
            const btnEditRemarks = document.getElementById("btn-edit-remarks");
            const levelSelect = document.getElementById("guest-level-select");

            if (btnCorrectName && !btnCorrectName.disabled) btnCorrectName.onclick = () => this.enableInlineEdit(giftIndex, "name");
            if (btnModifyAmount && !btnModifyAmount.disabled) btnModifyAmount.onclick = () => this.enableInlineEdit(giftIndex, "amount");
            if (btnEditRemarks) btnEditRemarks.onclick = () => this.enableInlineEdit(giftIndex, "remarks");

            // 缁戝畾瀹惧绛夌骇閫夋嫨鍣ㄥ彉鍖栦簨浠?
            if (levelSelect) {
              levelSelect.addEventListener("change", async (e) => {
                const newLevel = parseInt(e.target.value, 10);
                const oldLevel = g.guestLevel !== undefined ? g.guestLevel : 0;
                if (newLevel !== oldLevel) {
                  const oldLevelName = CONFIG.GUEST_LEVELS[oldLevel];
                  const newLevelName = CONFIG.GUEST_LEVELS[newLevel];

                  // 闇€瑕侀獙璇佸瘑鐮侊紝浣嗘敮鎸丯鍒嗛挓鍏嶅瘑
                  const password = await this.requestAdminPassword("淇敼瀹惧绛夌骇", `鍗冲皢鎶?"${g.name}" 浠?"${oldLevelName}" 淇敼涓?"${newLevelName}"`, null);

                  if (password === null) {
                    // 鐢ㄦ埛鍙栨秷锛屾仮澶嶅師鏉ョ殑鍊?
                    e.target.value = oldLevel;
                    return;
                  }

                  // 鏇存柊瀹惧绛夌骇
                  await this.updateGuestLevel(giftIndex, newLevel, oldLevel);
                }
              });
            }

            if (hasHistory) {
              this.bindViewOriginalEvents(g.history, giftIndex);
            }
          }, 50);
        }

        /**
         * 绀肩翱鏍峰紡璁剧疆
         */
        async showGiftBookStyleModal() {
          if (Utils.isMobile()) {
            this.ui.showNotification("绉诲姩绔浣跨敤榛樿鏍峰紡", "info");
            return;
          }

          const isSolemn = this.currentEvent.theme === "theme-solemn";

          // 瀹氫箟榛樿鏍峰紡鍊?
          const getDefaults = () => {
            return {
              name: { size: 20, color: "#333333", font: "" },
              type: { size: 20, color: isSolemn ? "#374151" : "#cc0000", font: "" },
              amountChinese: { size: 20, color: "#333333", font: "" },
              coverText: { size: 30, color: "#f5d4ab", font: "" },
              pageInfo: {
                themeColor: isSolemn ? "#1f2937" : "#b91c1c",
                baseColor: isSolemn ? "#1f2937" : "#1f2937",
                font: "",
              },
            };
          };

          const style = this.currentEvent.customStyle || {};
          const localFonts = style.localFonts || [];
          const defaults = getDefaults();

          // 鑾峰彇褰撳墠鍥剧墖 URL
          const bgUrl = await ImageCache.getBackgroundUrl(this.currentEvent.id);
          let currentCoverUrl = "";
          if (this.currentEvent.coverType === "custom") {
            currentCoverUrl = await ImageCache.getEventCoverUrl(this.currentEvent.id);
          }

          const printOptions = {
            ...DEFAULT_PRINT_OPTIONS,
            ...(this.currentEvent.printOptions || {}),
          };

          // === 4. 鏋勫缓鏂囧瓧鏍峰紡 HTML (浣跨敤閰嶇疆鏁扮粍) ===
          const fieldConfigs = [
            { key: "name", label: "绀肩翱椤靛鍚?, type: "std" },
            { key: "type", label: "绀肩翱椤垫爣绛?(绀奸噾/璐虹ぜ)", type: "std" },
            { key: "amountChinese", label: "绀肩翱椤碉紙澶у啓閲戦锛?, type: "std" },
            { key: "coverText", label: "灏侀潰椤垫爣棰?, type: "std" },
            { key: "pageInfo", label: "鍩虹鏍峰紡", type: "print-special" }, // 鐗规畩绫诲瀷
          ];

          const textStyleHtml = fieldConfigs
            .map((config) => {
              const field = config.key;
              const custom = style[field] || {};
              const def = defaults[field];

              // 鏋勫缓瀛椾綋涓嬫媺妗?
              const displayFont = custom.font || "";
              const fontOptions = localFonts
                .map(
                  (f) =>
                    `<option value="${f.postscriptName}" style="font-family: '${f.family}', sans-serif;" ${f.postscriptName === displayFont ? "selected" : ""}>
                          ${f.fullName || f.family}
                      </option>`
                )
                .join("");
              const fontSelectHtml = `
                    <div class="flex items-center">
                      <label class="block font-medium text-gray-500 mr-1 whitespace-nowrap">瀛椾綋</label>
                      <select data-field="${field}" data-prop="font"
                              class="flex-1 w-full p-2 border border-gray-300 rounded themed-ring text-sm bg-white text-gray-700"
                              ${localFonts.length === 0 ? "disabled" : ""}>
                        <option value="">绯荤粺榛樿瀛椾綋</option>
                        ${fontOptions}
                      </select>
                    </div>`;

              // 鏍规嵁绫诲瀷鐢熸垚涓嶅悓鐨勮緭鍏ユ帶浠?
              let inputsHtml = "";

              if (config.type === "print-special") {
                // pageInfo 鐗规畩甯冨眬锛氫富棰樿壊 + 鍩虹瀛楄壊 + 瀛椾綋
                const displayThemeColor = custom.themeColor || def.themeColor;
                const displayBaseColor = custom.baseColor || def.baseColor;
                inputsHtml = `
                      <!-- 涓婚鑹?(杈规/椤靛ご) -->
                      <div class="flex items-center">
                          <label class="block font-medium text-gray-500 mr-1 whitespace-nowrap">涓婚鑹?/label>
                          <div class="flex flex-1 items-center w-full border border-gray-300 rounded overflow-hidden h-[38px] relative">
                              <input type="color" data-field="${field}" data-prop="themeColor" value="${displayThemeColor}"
                                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                              <div class="color-preview w-8 h-full border-r border-gray-200" style="background-color: ${displayThemeColor}"></div>
                              <span class="color-text flex-1 text-center text-sm text-gray-600 font-mono bg-white h-full leading-[38px]">
                                  ${displayThemeColor}
                              </span>
                          </div>
                      </div>
                      <!-- 鍩虹瀛楄壊 (椤佃剼/鍐呭) -->
                      <div class="flex items-center">
                          <label class="block font-medium text-gray-500 mr-1 whitespace-nowrap">鍩虹瀛楄壊</label>
                          <div class="flex flex-1 items-center w-full border border-gray-300 rounded overflow-hidden h-[38px] relative">
                              <input type="color" data-field="${field}" data-prop="baseColor" value="${displayBaseColor}"
                                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                              <div class="color-preview w-8 h-full border-r border-gray-200" style="background-color: ${displayBaseColor}"></div>
                              <span class="color-text flex-1 text-center text-sm text-gray-600 font-mono bg-white h-full leading-[38px]">
                                  ${displayBaseColor}
                              </span>
                          </div>
                      </div>
                      ${fontSelectHtml}
                   `;
              } else {
                // 鏍囧噯甯冨眬锛氬瓧鍙?+ 棰滆壊 + 瀛椾綋
                const displaySize = custom.size || def.size;
                const displayColor = custom.color || def.color;

                inputsHtml = `
                      <!-- 瀛楀彿 -->
                      <div class="flex items-center">
                          <label class="block font-medium text-gray-500 mr-1 whitespace-nowrap">瀛楀彿 (px)</label>
                          <input type="number" data-field="${field}" data-prop="size" value="${displaySize}"
                              class="flex-1 w-full p-2 border border-gray-300 rounded themed-ring text-center font-bold text-gray-700 bg-gray-50 focus:bg-white">
                      </div>
                      <!-- 棰滆壊 -->
                      <div class="flex items-center">
                          <label class="block font-medium text-gray-500 mr-1 whitespace-nowrap">棰滆壊</label>
                          <div class="flex flex-1 items-center w-full border border-gray-300 rounded overflow-hidden h-[38px] relative">
                              <input type="color" data-field="${field}" data-prop="color" value="${displayColor}"
                                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10">
                              <div class="color-preview w-8 h-full border-r border-gray-200" style="background-color: ${displayColor}"></div>
                              <span class="color-text flex-1 text-center text-sm text-gray-600 font-mono bg-white h-full leading-[38px]">
                                  ${displayColor}
                              </span>
                          </div>
                      </div>
                      ${fontSelectHtml}
                   `;
              }

              return `
                <div class="p-4 border rounded-lg bg-white shadow-sm flex flex-col h-full">
                  <h4 class="font-bold text-gray-800 mb-3 text-center pb-2 border-b border-gray-100 text-sm">${config.label}</h4>
                  <div class="space-y-3 flex-1">
                    ${inputsHtml}
                  </div>
                </div>`;
            })
            .join("");

          // === HTML 鏋勫缓 ===
          // 缁熶竴 ID 鍛藉悕瑙勮寖锛?style-cover-* 鍜?style-bg-*
          const content = `
              <div class="space-y-6 text-left max-h-[75vh] pr-1">

                <!-- 绗竴閮ㄥ垎锛氬浘鐗囪祫婧?(灏侀潰 & 鑳屾櫙) -->
                <div class="p-3 rounded border border-gray-200">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <!-- 灏侀潰鍥鹃儴鍒?-->
                      <div>
                          <div class="flex items-center justify-between mb-2">
                              <div class="flex items-center gap-3">
                                  <label class="block text-sm font-bold text-gray-700">绀肩翱灏侀潰鍥?/label>
                                  <!-- 鍒囨崲寮€鍏?-->
                                  <label class="relative h-5 w-16 cursor-pointer">
                                      <input type="checkbox" id="style-cover-toggle" class="sr-only peer" ${this.currentEvent.coverType === "custom" ? "checked" : ""}>
                                      <div class="h-full w-full rounded-full bg-gray-300 transition-colors duration-300 peer-checked:bg-[var(--button-bg-color)]"></div>
                                      <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold transition-opacity duration-300 peer-checked:opacity-0">榛樿</span>
                                      <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white opacity-0 transition-opacity duration-300 peer-checked:opacity-100">鑷畾涔?/span>
                                      <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 peer-checked:translate-x-[2.8rem]"></div>
                                  </label>
                              </div>
                          </div>
                          <div id="style-cover-section" class="mt-2 pl-1 ${this.currentEvent.coverType === "custom" ? "" : "hidden"}">
                              <!-- 棰勮鍖?-->
                              <div id="style-cover-preview-area" class="items-center gap-4 ${currentCoverUrl ? "flex" : "hidden"}">
                                <img id="style-cover-img" src="${currentCoverUrl || ""}" alt="灏侀潰棰勮" class="rounded border bg-white p-1 h-16 w-auto object-contain shadow-sm">
                                <button id="style-cover-remove-btn" class="text-sm text-red-600 hover:underline">鍒犻櫎灏侀潰鍥?/button>
                              </div>
                              <!-- 涓婁紶鍖?-->
                              <div id="style-cover-upload-area" class="${currentCoverUrl ? "hidden" : "block"}">
                                <input type="file" id="style-cover-upload" accept="image/*" class="w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                                 <p class="text-xs text-gray-500 mt-2 ml-1"> 寤鸿灏哄 595 x 842px (A4绾靛悜), 澶у皬涓嶈秴杩?M銆?/p>
                              </div>
                          </div>
                      </div>

                      <!-- 鑳屾櫙鍥鹃儴鍒?-->
                      <div>
                          <label class="block text-sm font-bold text-gray-700 mb-2">绀肩翱椤佃儗鏅浘</label>

                          <!-- 棰勮鍖?-->
                          <div id="style-bg-preview-area" class="${bgUrl ? "flex" : "hidden"} items-center gap-4 transition-all">
                            <img id="style-bg-img" src="${bgUrl || ""}" class="rounded border bg-white p-1 h-16 w-auto object-contain shadow-sm">
                            <button id="style-bg-remove-btn" class="text-sm text-red-600 hover:underline">鍒犻櫎鑳屾櫙鍥?/button>
                          </div>

                          <!-- 涓婁紶鍖?-->
                          <div id="style-bg-upload-area" class="${bgUrl ? "hidden" : "block"} transition-all">
                             <input type="file" id="style-bg-upload" accept="image/*" class="w-full mt-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300" />
                             <p class="text-xs text-gray-500 mt-2 ml-1"> 寤鸿娴呰壊搴曠汗銆侫4妯増, 寤鸿灏哄 842 x 595px銆?/p>
                          </div>
                      </div>
                  </div>
                </div>
                
                <!-- 绗簩閮ㄥ垎锛氭墦鍗板鍑洪€夐」 -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- 淇濇寔鍘熸湁鎵撳嵃閫夐」閫昏緫涓嶅彉 -->
                    <div class="flex gap-2 text-sm items-center flex-wrap">
                      <label class="block text-sm font-bold text-gray-700 ">绀肩翱闄勯〉閫夐」锛?/label>
                        <label class="flex items-center"><input type="checkbox" id="style-print-cover" class="w-4 h-4 themed-ring rounded mr-1" ${printOptions.printCover ? "checked" : ""}><span>灏侀潰</span></label>
                        <label class="flex items-center"><input type="checkbox" id="style-show-cover-title" class="w-4 h-4 themed-ring rounded mr-1" ${
                          printOptions.showCoverTitle ? "checked" : ""
                        }><span>灏侀潰鏍囬</span></label>
                        <label class="flex items-center"><input type="checkbox" id="style-print-appendix" class="w-4 h-4 themed-ring rounded mr-1" ${
                          printOptions.printAppendix ? "checked" : ""
                        }><span>澶囨敞闄勫綍</span></label>
                        <label class="flex items-center"><input type="checkbox" id="style-print-summary" class="w-4 h-4 themed-ring rounded mr-1" ${printOptions.printSummary ? "checked" : ""}><span>鎬昏椤?/span></label>
                        <label class="flex items-center"><input type="checkbox" id="style-print-end-page" class="w-4 h-4 themed-ring rounded mr-1" ${printOptions.printEndPage ? "checked" : ""}><span>灏佸簳</span></label>
                    </div>
                    <div class="flex gap-2 text-sm items-center">
                        <label class="block text-sm font-bold text-gray-700 mr-1">绀肩翱姣忛〉鏄剧ず鏉℃暟:</label>
                        <div class="flex items-center gap-2">
                            <input type="number" id="style-items-per-page" min="6" max="20" step="1" value="${this.getItemsPerPage()}"
                                class="w-12 p-2 border border-gray-300 rounded themed-ring text-center font-bold bg-white">
                            <span class="text-xs text-gray-500">寤鸿 10-20</span>
                        </div>
                    </div>
                  </div>

                <!-- 绗笁閮ㄥ垎锛氭枃瀛楁牱寮忛厤缃?-->
                <div>
                  <div class="flex justify-between items-center mb-3 pb-2 border-b">
                      <h3 class="font-bold text-gray-800 text-sm">绀肩翱瀛椾綋涓庨鑹?/h3>
                      <div class="flex gap-2">
                          <button id="reset-style-btn" class="text-xs border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1.5 rounded shadow-sm transition-colors flex items-center">
                              <i class="ri-refresh-line mr-1"></i>鎭㈠榛樿
                          </button>
                          ${
                            "queryLocalFonts" in window
                              ? `<button id="load-local-fonts-btn" class="text-xs themed-button-primary px-3 py-1.5 rounded shadow-sm transition-colors flex items-center"><i class="ri-font-size mr-1"></i>浣跨敤鏈湴瀛椾綋</button>`
                              : ""
                          }
                      </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      ${textStyleHtml}
                  </div>
                </div>
              </div>`;

          this.ui.showModal("绀肩翱鏍峰紡璁剧疆", content, [
            { text: "鍙栨秷", class: "themed-button-secondary border px-4 py-2 rounded" },
            {
              text: "淇濆瓨璁剧疆",
              class: "themed-button-primary px-6 py-2 rounded font-bold",
              handler: async () => {
                try {
                  // --- 鑳屾櫙鍥?---
                  const bgFile = document.getElementById("style-bg-upload")?.files[0];
                  const isBgRemoved = document.getElementById("style-bg-preview-area").classList.contains("hidden");

                  if (bgFile) {
                    if (bgFile.size > 10 * 1024 * 1024) {
                      this.ui.showNotification("鑳屾櫙鍥剧墖杩囧ぇ", "error");
                      return;
                    }
                    await ImageCache.saveBackground(this.currentEvent.id, bgFile);
                  } else if (isBgRemoved) {
                    // 浠呭湪鐐逛簡鍒犻櫎涓旀病鏈夋柊涓婁紶鏃舵墠鎵ц鍒犻櫎
                    await ImageCache.deleteBackground(this.currentEvent.id);
                  }

                  // --- 灏侀潰鍥?---
                  const coverFile = document.getElementById("style-cover-upload")?.files[0];
                  const isCoverRemoved = document.getElementById("style-cover-preview-area").classList.contains("hidden");
                  const isCoverCustom = document.getElementById("style-cover-toggle").checked;
                  let newCoverType = isCoverCustom ? "custom" : "default";

                  // 鐗规畩鎯呭喌淇锛氶€変簡鑷畾涔夛紝浣嗘病鍥撅紙鏃х殑琚垹浜嗕笖娌℃柊鐨勶級锛屽己鍒跺洖閫€榛樿
                  if (newCoverType === "custom" && !coverFile && isCoverRemoved) {
                    newCoverType = "default";
                  }

                  if (coverFile) {
                    await ImageCache.saveEventCover(this.currentEvent.id, coverFile);
                    newCoverType = "custom"; // 鍙涓婁紶浜嗗浘灏辨槸鑷畾涔?
                  } else if (newCoverType === "default") {
                    await ImageCache.deleteEventCover(this.currentEvent.id);
                  }

                  // === 淇濆瓨鎵撳嵃閫夐」 ===
                  const pdfEngine = this.currentEvent.printOptions?.pdfEngine || "browser";
                  const newPrintOptions = {
                    printCover: document.getElementById("style-print-cover").checked,
                    showCoverTitle: document.getElementById("style-show-cover-title").checked,
                    printAppendix: document.getElementById("style-print-appendix").checked,
                    printSummary: document.getElementById("style-print-summary").checked,
                    printEndPage: document.getElementById("style-print-end-page").checked,
                    pdfEngine: pdfEngine,
                  };

                  // === 淇濆瓨鏂囧瓧鏍峰紡 ===
                  const currentDefaults = getDefaults();
                  const newStyle = { localFonts: this.currentEvent.customStyle?.localFonts || [] };

                  ["coverText", "pageInfo", "name", "type", "amountChinese"].forEach((field) => {
                    // 鏀堕泦杈撳叆鍊?
                    const fontSel = document.querySelector(`select[data-field="${field}"][data-prop="font"]`);
                    const inputFont = fontSel ? fontSel.value : "";

                    const fieldConfig = {};
                    if (inputFont) fieldConfig.font = inputFont;
                    const def = currentDefaults[field];

                    if (field === "pageInfo") {
                      // 鐗规畩澶勭悊 pageInfo 鐨勪袱涓鑹?
                      const themeColorInp = document.querySelector(`input[data-field="${field}"][data-prop="themeColor"]`);
                      const baseColorInp = document.querySelector(`input[data-field="${field}"][data-prop="baseColor"]`);

                      const themeVal = themeColorInp ? themeColorInp.value.trim().toLowerCase() : null;
                      const baseVal = baseColorInp ? baseColorInp.value.trim().toLowerCase() : null;

                      if (themeVal && themeVal !== def.themeColor.toLowerCase()) fieldConfig.themeColor = themeVal;
                      if (baseVal && baseVal !== def.baseColor.toLowerCase()) fieldConfig.baseColor = baseVal;
                    } else {
                      // 鏍囧噯澶勭悊 Size / Color
                      const sizeInp = document.querySelector(`input[data-field="${field}"][data-prop="size"]`);
                      const colorInp = document.querySelector(`input[data-field="${field}"][data-prop="color"]`);

                      let inputSize = sizeInp && sizeInp.value ? parseInt(sizeInp.value) : null;
                      if (inputSize && isNaN(inputSize)) inputSize = null;
                      const inputColor = colorInp ? colorInp.value.trim().toLowerCase() : null;

                      if (inputSize !== null && inputSize !== def.size) fieldConfig.size = inputSize;
                      if (inputColor && inputColor !== def.color.toLowerCase()) fieldConfig.color = inputColor;
                    }

                    // 濡傛灉鏈夎嚜瀹氫箟閰嶇疆鍒欎繚瀛?
                    if (Object.keys(fieldConfig).length > 0) newStyle[field] = fieldConfig;
                  });

                  const itemsPerPageInput = document.getElementById("style-items-per-page");
                  let newItemsPerPage = Math.min(Math.max(parseInt(itemsPerPageInput.value) || 12, 6), 24);

                  this.currentEvent.itemsPerPage = newItemsPerPage;
                  this.currentEvent.customStyle = newStyle;
                  this.currentEvent.coverType = newCoverType;
                  this.currentEvent.printOptions = newPrintOptions;

                  await this.giftRepository.updateEvent(this.currentEvent);

                  this.ui.closeModal();
                  this.applyCustomGiftBookStyle();

                  const totalPages = Math.ceil(this.gifts.length / newItemsPerPage) || 1;
                  if (this.currentPage > totalPages) {
                    this.currentPage = totalPages;
                  }
                  this.giftManager.ensureCurrentPageDecrypted();
                  this.giftManager.render();
                  this.session.save(this.currentEvent, this.currentPassword);
                  this.ui.showNotification("鏍峰紡鍙婃墦鍗拌缃凡淇濆瓨", "success");
                } catch (error) {
                  console.error("淇濆瓨鏍峰紡澶辫触:", error);
                  this.ui.showNotification("淇濆瓨澶辫触锛岃閲嶈瘯", "error");
                }
              },
            },
          ]);

          // === 浜嬩欢缁戝畾 ===
          setTimeout(() => {
            // 杈呭姪鍑芥暟锛氱粦瀹氬浘鐗囬瑙?绉婚櫎閫昏緫
            const bindImageLogic = (prefix) => {
              const uploadInput = document.getElementById(`${prefix}-upload`);
              const previewArea = document.getElementById(`${prefix}-preview-area`);
              const uploadArea = document.getElementById(`${prefix}-upload-area`);
              const previewImg = document.getElementById(`${prefix}-img`);
              const removeBtn = document.getElementById(`${prefix}-remove-btn`);

              if (uploadInput) {
                uploadInput.addEventListener("change", (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      previewImg.src = evt.target.result;
                      previewArea.classList.remove("hidden");
                      previewArea.classList.add("flex");
                      uploadArea.classList.add("hidden");
                    };
                    reader.readAsDataURL(file);
                  }
                });
              }
              if (removeBtn) {
                removeBtn.onclick = () => {
                  previewImg.src = "";
                  uploadInput.value = ""; // 娓呯┖ input value
                  previewArea.classList.add("hidden");
                  previewArea.classList.remove("flex");
                  uploadArea.classList.remove("hidden");
                };
              }
            };

            // 缁戝畾灏侀潰鍜岃儗鏅?
            bindImageLogic("style-cover");
            bindImageLogic("style-bg");

            // 灏侀潰鍒囨崲寮€鍏?
            const coverToggle = document.getElementById("style-cover-toggle");
            const coverSection = document.getElementById("style-cover-section");
            if (coverToggle) {
              coverToggle.addEventListener("change", (e) => {
                coverSection.classList.toggle("hidden", !e.target.checked);
              });
            }

            // 棰滆壊閫夋嫨鍣ㄥ疄鏃堕瑙?
            document.querySelectorAll('input[type="color"]').forEach((input) => {
              input.addEventListener("input", (e) => {
                const val = e.target.value;
                const parent = e.target.parentNode;
                if (parent) {
                  const preview = parent.querySelector(".color-preview");
                  const text = parent.querySelector(".color-text");
                  if (preview) preview.style.backgroundColor = val;
                  if (text) text.innerText = val;
                }
              });
            });

            // 閲嶇疆鎸夐挳閫昏緫
            document.getElementById("reset-style-btn")?.addEventListener("click", () => {
              const defs = getDefaults();
              // 閲嶇疆鏍囧噯瀛楁
              ["name", "type", "amountChinese", "coverText"].forEach((key) => {
                const sInput = document.querySelector(`input[data-field="${key}"][data-prop="size"]`);
                const cInput = document.querySelector(`input[data-field="${key}"][data-prop="color"]`);
                if (sInput) sInput.value = defs[key].size;
                if (cInput) {
                  cInput.value = defs[key].color;
                  cInput.dispatchEvent(new Event("input")); // 瑙﹀彂棰勮鏇存柊
                }
              });
              // 閲嶇疆 pageInfo 鐗规畩瀛楁
              const themeInput = document.querySelector(`input[data-field="pageInfo"][data-prop="themeColor"]`);
              const baseInput = document.querySelector(`input[data-field="pageInfo"][data-prop="baseColor"]`);
              if (themeInput) {
                themeInput.value = defs.pageInfo.themeColor;
                themeInput.dispatchEvent(new Event("input"));
              }
              if (baseInput) {
                baseInput.value = defs.pageInfo.baseColor;
                baseInput.dispatchEvent(new Event("input"));
              }

              // 閲嶇疆鎵€鏈夊瓧浣撻€夋嫨
              document.querySelectorAll('select[data-prop="font"]').forEach((sel) => (sel.value = ""));

              this.ui.showNotification("宸查噸缃粯璁ゅ€?(闇€鐐瑰嚮淇濆瓨鐢熸晥)", "info");
            });

            // 鍔犺浇鏈湴瀛椾綋
            document.getElementById("load-local-fonts-btn")?.addEventListener("click", async () => {
              try {
                const fonts = await window.queryLocalFonts();
                const safeFonts = fonts.map((f) => ({
                  postscriptName: f.postscriptName,
                  family: f.family,
                  fullName: f.fullName || f.family,
                }));
                this.currentEvent.customStyle = this.currentEvent.customStyle || {};
                this.currentEvent.customStyle.localFonts = safeFonts;
                await this.giftRepository.updateEvent(this.currentEvent);
                this.showGiftBookStyleModal(); // 閲嶆柊鎵撳紑浠ュ埛鏂板垪琛?
                this.ui.showNotification(`宸插姞杞?${safeFonts.length} 绉嶅瓧浣揱, "success");
              } catch (e) {
                this.ui.showNotification("瀛椾綋鍔犺浇鍙栨秷鎴栦笉鏀寔", "info");
              }
            });
          }, 50);
        }

        /**
         * 搴旂敤鑷畾涔夌ぜ绨挎牱寮忓埌灞忓箷 + 鎵撳嵃鍙橀噺
         */
        async applyCustomGiftBookStyle() {
          const s = this.currentEvent?.customStyle || {};
          const root = document.documentElement;

          const customBgUrl = await ImageCache.getBackgroundUrl(this.currentEvent.id);
          if (customBgUrl) {
            const img = new Image();
            img.src = customBgUrl;
            root.style.setProperty("--custom-bg-image", `url("${customBgUrl}")`);
          } else {
            root.style.removeProperty("--custom-bg-image");
          }

          let customCoverUrl = null;
          if (this.currentEvent.coverType === "custom") {
            const cachedUrl = await ImageCache.getEventCoverUrl(this.currentEvent.id);
            if (cachedUrl) customCoverUrl = cachedUrl;
          }

          if (customCoverUrl) {
            const img = new Image();
            img.src = customCoverUrl;
            root.style.setProperty("--custom-cover-image", `url("${customCoverUrl}")`);
          } else {
            root.style.removeProperty("--custom-cover-image");
          }

          const itemsCount = this.getItemsPerPage();
          root.style.setProperty("--gift-grid-columns", itemsCount.toString());

          // === 鏇存柊锛氬瓧娈垫槧灏勪笌鍙橀噺搴旂敤 ===
          const stdFields = { name: "name", type: "type", amountChinese: "amount-chinese", coverText: "cover-text" };
          Object.entries(stdFields).forEach(([field, cssPrefix]) => {
            const cfg = s[field];
            const sizeVar = `--custom-${cssPrefix}-size`;
            const colorVar = `--custom-${cssPrefix}-color`;
            const fontVar = `--custom-${cssPrefix}-font`;

            if (cfg?.size) root.style.setProperty(sizeVar, cfg.size + "px");
            else root.style.removeProperty(sizeVar);

            if (cfg?.color) root.style.setProperty(colorVar, cfg.color);
            else root.style.removeProperty(colorVar);

            applyFontVar(cfg?.font, fontVar);
          });

          const pInfo = s.pageInfo || {};
          const themeColorVar = "--custom-print-theme-color";
          const baseColorVar = "--custom-print-base-color";
          const baseFontVar = "--custom-print-base-font";

          if (pInfo.themeColor) root.style.setProperty(themeColorVar, pInfo.themeColor);
          else root.style.removeProperty(themeColorVar);

          if (pInfo.baseColor) root.style.setProperty(baseColorVar, pInfo.baseColor);
          else root.style.removeProperty(baseColorVar);
          applyFontVar(pInfo.font, "--custom-page-info-font");
          applyFontVar(pInfo.font, "--custom-print-base-font");

          function applyFontVar(fontName, cssVarName) {
            if (fontName && s.localFonts) {
              const font = s.localFonts.find((f) => f.postscriptName === fontName);
              if (font) root.style.setProperty(cssVarName, `"${font.family}"`);
              else root.style.removeProperty(cssVarName);
            } else {
              root.style.removeProperty(cssVarName);
            }
          }
        }

        /**
         * 缁戝畾鍘嗗彶璁板綍鏌ョ湅鎸夐挳浜嬩欢
         * @param {Array} history - 鍙樻洿鍘嗗彶
         * @param {number} giftIndex - 绀奸噾绱㈠紩
         */
        bindViewOriginalEvents(history, giftIndex) {
          const showSnapshot = (historyIndex) => {
            const snapshot = history[historyIndex].snapshot;
            const snapshotLevel = snapshot.guestLevel !== undefined ? snapshot.guestLevel : 0;
            const snapshotLevelName = CONFIG.GUEST_LEVELS[snapshotLevel] || CONFIG.GUEST_LEVELS[0];

            const remarkDisplay = this.formatRemarkDisplay(snapshot.remarkData || "");

            const content = `
                        <div class="space-y-2 p-4 bg-gray-100 rounded text-left">
                          <p><strong>濮撳悕:</strong> ${snapshot.name}</p>
                          <p><strong>閲戦:</strong> ${Utils.formatCurrency(snapshot.amount)} (${snapshot.type})</p>
                          <p><strong>瀹惧绛夌骇:</strong> ${snapshotLevelName}</p>
                          <p><strong>澶囨敞:</strong> ${remarkDisplay || "鏃?}</p>
                          <p class="text-xs text-gray-500 border-t pt-2 mt-2">姝よ褰曚簬 ${new Date(history[historyIndex].timestamp).toLocaleString()} 琚慨鏀瑰瓨妗ｃ€?/p>
                        </div>
                      `;

            this.ui.elements.modal.classList.remove("modal-large");
            // 纭繚妯℃€佹寜閽彲瑙?
            this.ui.elements.modalActions.classList.remove("hidden");
            this.ui.showModal("鍘嗗彶璁板綍蹇収", content, [
              {
                text: "杩斿洖璇︽儏",
                class: "themed-button-secondary border px-4 py-2 rounded",
                handler: () => this.showGiftDetails(giftIndex),
                keepOpen: true,
              },
            ]);
          };

          document.querySelectorAll(".btn-view-original, .btn-view-snapshot").forEach((btn) => {
            btn.onclick = (e) => showSnapshot(parseInt(e.target.dataset.historyIndex));
          });
        }

        /**
         * 鍚姩绀奸噾璇︽儏鍖哄煙鐨勮鍐呯紪杈戣兘鍔?
         * 鏍规嵁 fieldType 涓嶅悓鐢熸垚濮撳悕銆侀噾棰濄€佸娉ㄧ殑缂栬緫鐣岄潰
         * - 濮撳悕锛氭寜瀛楃鎷嗗垎骞堕檺鍒舵瘡娆＄籂閿欑殑淇敼鏁伴噺
         * - 閲戦锛氭彁渚涢噾棰濊緭鍏ヤ笌鏀舵鏂瑰紡鍒囨崲
         * - 澶囨敞锛氬鐢ㄦā鎬佺獥琛ㄥ崟鏀堕泦缁撴瀯鍖栧娉?
         */
        enableInlineEdit(giftIndex, fieldType) {
          const g = this.gifts[giftIndex].data;
          let targetAreaId, editHtml, saveHandler;
          let nameEditConfig = null;

          // 缁熶竴绠＄悊璇︽儏鍖哄煙鐨勬搷浣滄寜閽紝鏂逛究鍦ㄧ紪杈戞椂绂佺敤/鎭㈠鐘舵€?
          const allButtons = ["btn-correct-name", "btn-modify-amount", "btn-edit-remarks"];
          // 鏍规嵁缂栬緫鐘舵€佷复鏃剁鐢?鎭㈠绾犻敊銆侀噾棰濅笌澶囨敞鎸夐挳
          const setInlineButtonsDisabled = (disabled) => {
            allButtons.forEach((btnId) => {
              const btn = document.getElementById(btnId);
              if (!btn) return;
              if (disabled) {
                btn.dataset.inlineDisabled = "true";
                btn.disabled = true;
                btn.classList.add("opacity-50", "cursor-not-allowed");
              } else if (btn.dataset.inlineDisabled === "true") {
                delete btn.dataset.inlineDisabled;
                if (btn.dataset.fixedDisabled === "true") {
                  btn.disabled = true;
                  btn.classList.add("opacity-50", "cursor-not-allowed");
                } else {
                  btn.disabled = false;
                  btn.classList.remove("opacity-50", "cursor-not-allowed");
                }
              }
            });
          };

          const cancelHandler = () => this.showGiftDetails(giftIndex);
          const cancelBtnHtml = `<button id="inline-cancel" class="text-sm px-3 py-1 rounded themed-button-secondary border">鍙栨秷</button>`;
          const saveBtnHtml = `<button id="inline-save" class="text-sm px-3 py-1 rounded themed-button-primary">淇濆瓨</button>`;

          // 濮撳悕绾犻敊锛氭寜瀛楃鎷嗗垎骞跺熀浜庡巻鍙叉鏁伴檺鍒跺彲缂栬緫鏁伴噺
          if (fieldType === "name") {
            let originalChars = Array.from(g.name || "");
            if (originalChars.length === 0) originalChars = [""];
            const nameLength = originalChars.length;
            const computedLimit = nameLength <= 2 ? 1 : nameLength === 3 ? 2 : 3;
            const correctionCount = countNameCorrections(g.history);
            if (correctionCount >= 2) {
              this.ui.showNotification("璇ョぜ閲戝鍚嶇籂閿欐鏁板凡杈句笂闄愩€?, "info");
              return;
            }
            let maxEditable = Math.max(1, Math.min(computedLimit, nameLength));
            if (correctionCount === 1) {
              // 绗簩娆＄籂閿欙細鏃犺濮撳悕闀垮害锛屾渶澶氬彧鑳戒慨鏀逛竴涓瓧绗?
              maxEditable = 1;
            }
            setInlineButtonsDisabled(true);
            // 灞曠ず鍓╀綑绾犻敊娆℃暟锛屼究浜庢彁绀虹敤鎴峰綋鍓嶉搴?
            const remainingCorrections = Math.max(0, 2 - correctionCount);
            // 杞箟鍗曞瓧杈撳叆鍐呭锛岄伩鍏嶇壒娈婂瓧绗︾牬鍧?HTML
            const escapeChar = (char) => String(char).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            nameEditConfig = { originalChars, maxEditable };
            targetAreaId = "name-display-area";
            editHtml = `
                      <div class="themed-edit-area text-center space-y-3">
                        <label class="block font-medium">绾犻敊濮撳悕</label>
                        <div id="inline-name-inputs" class="flex justify-center gap-2 flex-wrap mb-1">
                          ${originalChars
                            .map(
                              (char, index) =>
                                `<input type="text" data-index="${index}" value="${escapeChar(
                                  char
                                )}" maxlength="1" class="w-10 h-10 text-center border rounded themed-ring focus:outline-none focus:ring-2 focus:ring-blue-400 selection:bg-blue-200" autocomplete="off" inputmode="text">`
                            )
                            .join("")}
                        </div>
                        <p class="text-xs text-gray-500">鏈鏈€澶氬彲淇敼${maxEditable}涓瓧锛屽墿浣欑籂閿欐鏁?{remainingCorrections}娆°€?/p>
                        <div class="flex justify-center space-x-2">${cancelBtnHtml}${saveBtnHtml}</div>
                      </div>`;
            saveHandler = async () => {
              if (!nameEditConfig) return cancelHandler();
              const { originalChars, maxEditable } = nameEditConfig;
              const inputs = Array.from(document.querySelectorAll("#inline-name-inputs input"));
              if (inputs.length !== originalChars.length) return cancelHandler();
              const updatedChars = inputs.map((input) => input.value.trim());
              if (updatedChars.some((char) => char.length === 0)) {
                this.ui.showNotification("濮撳悕鐨勬瘡涓瓧閮戒笉鑳戒负绌恒€?, "error");
                return;
              }
              // 缁熻涓庡師濮嬪鍚嶄笉鍚岀殑瀛楃鏁伴噺锛岀敤浜庨搴︽牎楠?
              const changedCount = updatedChars.reduce((count, value, index) => (value !== originalChars[index] ? count + 1 : count), 0);
              if (changedCount === 0) {
                this.ui.showNotification("濮撳悕鏈彂鐢熷彉鍖栥€?, "info");
                return;
              }
              if (changedCount > maxEditable) {
                this.ui.showNotification(`鏈鏈€澶氬彲淇敼${maxEditable}涓瓧銆俙, "error");
                return;
              }
              // 楠岃瘉閫氳繃鍚庡悎鎴愭柊鐨勫畬鏁村鍚嶅苟鎻愪氦淇濆瓨
              const newName = updatedChars.join("");
              if (!newName || newName === g.name) return cancelHandler();
              const changeLog = `灏嗗鍚嶇敱 "${g.name}" 鏇存涓?"${newName}"`;
              await this.giftManager.performUpdate(giftIndex, { name: newName }, changeLog, "correction");
            };
            // 閲戦璋冩暣锛氬悓鏃跺厑璁镐慨鏀归噾棰濅笌鏀舵鏂瑰紡
          } else if (fieldType === "amount") {
            const amountCorrectionCount = countAmountCorrections(g.history);
            if (amountCorrectionCount >= 1) {
              this.ui.showNotification("璇ョぜ閲戦噾棰濆凡淇敼杩囷紝鏃犳硶鍐嶆璋冩暣銆?, "info");
              return;
            }
            setInlineButtonsDisabled(true);
            targetAreaId = "amount-display-area";
            editHtml = `
                      <div class="themed-edit-area">
                        <label>淇敼閲戦涓庣被鍨?/label>
                        <input type="number" id="inline-edit-amount" value="${g.amount}" min="0" step="0.01" class="w-full p-2 border rounded themed-ring mb-2">
                        <div class="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                          ${["鐜伴噾", "鏀粯瀹?, "寰俊", "鍏朵粬"]
                            .map(
                              (type) => `
                            <label class="flex items-center text-sm font-normal">
                              <input type="radio" name="inline-edit-type" value="${type}" ${g.type === type ? "checked" : ""} class="mr-1 themed-ring">${type}
                            </label>
                          `
                            )
                            .join("")}
                        </div>
                        <p class="text-xs text-gray-500 mb-2">鎻愮ず锛氶噾棰濅粎鏀寔淇敼涓€娆★紝璇疯皑鎱庢搷浣溿€?/p>
                        <div class="flex justify-end space-x-2">${cancelBtnHtml}${saveBtnHtml}</div>
                      </div>`;
            saveHandler = async () => {
              // 瑙ｆ瀽鐢ㄦ埛杈撳叆鐨勯噾棰濓紝骞跺悓姝ヨ褰曟柊鐨勬敹娆炬柟寮?
              const newAmount = parseFloat(document.getElementById("inline-edit-amount").value);
              const newType = document.querySelector('input[name="inline-edit-type"]:checked').value;
              if (isNaN(newAmount) || newAmount < 0) return this.ui.showNotification("璇疯緭鍏ユ湁鏁堥噾棰濄€?, "error");

              if (newAmount === g.amount && newType === g.type) return cancelHandler();

              let logs = [];
              if (newAmount !== g.amount) logs.push(`灏嗛噾棰濈敱 ${g.amount} 淇敼涓?${newAmount}`);
              if (newType !== g.type) logs.push(`灏嗙被鍨嬬敱 ${g.type} 淇敼涓?${newType}`);
              await this.giftManager.performUpdate(giftIndex, { amount: newAmount, type: newType }, logs.join("锛?), "correction");
            };
            // 澶囨敞缂栬緫锛氬鐢ㄧ粺涓€妯℃€佺獥鍙ｄ互淇濇寔浣撻獙涓€鑷?
          } else if (fieldType === "remarks") {
            setInlineButtonsDisabled(true);
            // 澶囨敞缂栬緫锛氱洿鎺ュ湪涓€涓柊鐨勩€佸共鍑€鐨勬ā鎬佺獥鍙ｄ腑澶勭悊
            // 澶囨敞缂栬緫鐩存帴鍞よ捣妯℃€佺獥锛屽鐢ㄧ粺涓€鐨勫瓧娈垫覆鏌撻€昏緫
            const currentRemarkData = this.normalizeRemarkData(g.remarkData);

            // 浣跨敤缁熶竴鐨勬柟娉曞姩鎬佺敓鎴愭墍鏈夊娉ㄥ瓧娈电殑杈撳叆琛ㄥ崟HTML
            const modalContent = `
                        <div class="space-y-3 text-left">
                          ${this.generateRemarkInputsHTML(currentRemarkData)}
                        </div>
                      `;

            // 瀹氫箟淇濆瓨鎸夐挳鐨勭偣鍑讳簨浠跺鐞嗗櫒
            const saveRemarkHandler = async () => {
              // 浠庢ā鎬佹鐨勮緭鍏ユ涓敹闆嗘渶鏂扮殑澶囨敞鏁版嵁
              const newRemarkData = this.collectRemarkData(true);

              // 姣旇緝鏂版棫鏁版嵁锛屽鏋滄病鏈夊疄闄呭彉鍖栵紝鍒欑洿鎺ヨ繑鍥炶鎯呴〉锛岄伩鍏嶄笉蹇呰鐨勬搷浣?
              if (JSON.stringify(currentRemarkData) === JSON.stringify(newRemarkData)) {
                this.showGiftDetails(giftIndex); // 鐩存帴杩斿洖锛屼笉鍏抽棴锛岃鐢ㄦ埛鐪嬪埌鍘熸牱
                return;
              }

              // 濡傛灉鏈夊彉鍖栵紝鍒欏姩鎬佺敓鎴愯缁嗙殑淇敼鏃ュ織
              const changes = [];
              this.REMARK_LABELS.forEach(({ key, label }) => {
                const oldValue = currentRemarkData[key] || "";
                const newValue = newRemarkData[key] || "";
                if (oldValue !== newValue) {
                  const fieldName = label;
                  const from = oldValue ? `"${oldValue}"` : "锛堢┖锛?;
                  const to = newValue ? `"${newValue}"` : "锛堢┖锛?;
                  changes.push(`${fieldName}浠?${from} 淇敼涓?${to}`);
                }
              });

              const changeLog = changes.join("锛?);

              // 鐞嗚涓婏紝濡傛灉 changeLog 涓虹┖锛屼笂闈㈢殑 JSON 姣旇緝灏变細杩斿洖锛屼絾浣滀负鍙岄噸淇濋殰
              if (!changeLog) {
                this.showGiftDetails(giftIndex);
                return;
              }

              // 鎵ц鏇存柊鎿嶄綔
              await this.giftManager.performUpdate(giftIndex, { remarkData: newRemarkData }, changeLog, "remark");
            };

            // 鏄剧ず妯℃€佹
            this.ui.showModal("淇敼澶囨敞", modalContent, [
              {
                text: "杩斿洖璇︽儏",
                class: "themed-button-secondary border px-4 py-2 rounded",
                role: "secondary",
                handler: () => this.showGiftDetails(giftIndex), // 鐐瑰嚮杩斿洖鏃讹紝閲嶆柊娓叉煋璇︽儏寮圭獥
                keepOpen: true,
              },
              {
                text: "淇濆瓨",
                class: "themed-button-primary px-4 py-2 rounded",
                role: "primary",
                handler: saveRemarkHandler,
                keepOpen: true, // 淇濇寔鎵撳紑锛岀洿鍒颁繚瀛樻垚鍔熸垨澶辫触鍚庣敱绋嬪簭鍐冲畾涓嬩竴姝?
              },
            ]);

            // 纭繚妯℃€佹涓嶆槸澶у昂瀵告ā寮?
            this.ui.elements.modal.classList.remove("modal-large");

            // 寤惰繜鍚庯紝鑷姩鑱氱劍鍒扮涓€涓娉ㄨ緭鍏ユ锛屾彁鍗囩敤鎴蜂綋楠?
            // 浣跨敤 querySelector 淇濊瘉鑳芥壘鍒扮敱 REMARK_LABELS 瀹氫箟鐨勭涓€涓瓧娈?
            setTimeout(() => {
              const firstRemarkKey = this.REMARK_LABELS.find((f) => f.key !== "custom")?.key;
              if (firstRemarkKey) {
                document.querySelector(`[data-remark-type="${firstRemarkKey}"]`)?.focus();
              }
            }, 50);

            return;
          }
          const targetArea = document.getElementById(targetAreaId);
          if (targetArea) {
            targetArea.innerHTML = editHtml;
            document.getElementById("inline-cancel").onclick = cancelHandler;
            document.getElementById("inline-save").onclick = saveHandler;

            // 缁戝畾鍥炶溅閿繚瀛橀€昏緫
            const handleEnterKey = (e) => {
              const isTextarea = e.target?.tagName === "TEXTAREA";
              const shouldSave = e.key === "Enter" && !isTextarea;
              if (shouldSave) {
                e.preventDefault();
                e.stopPropagation();
                saveHandler();
              }
            };
            targetArea.addEventListener("keydown", handleEnterKey);

            this.ui.elements.modalActions.classList.add("hidden");

            // 濮撳悕绾犻敊涓撶敤浜や簰锛氱洃鍚緭鍏ュ苟鍦ㄨ揪涓婇檺鏃剁鐢ㄥ叾浠栧瓧绗?
            if (fieldType === "name" && nameEditConfig) {
              const nameInputsContainer = document.getElementById("inline-name-inputs");
              if (nameInputsContainer) {
                const inputs = Array.from(nameInputsContainer.querySelectorAll("input"));
                const changedIndices = new Set();

                // 鏍规嵁宸蹭慨鏀圭殑瀛楃鏁伴噺鍚敤/绂佺敤杈撳叆妗?
                const enforceLimit = () => {
                  const reachedLimit = changedIndices.size >= nameEditConfig.maxEditable;
                  // 閫愪釜杈撳叆妗嗙粦瀹?IME銆佽緭鍏ャ€佽仛鐒︾瓑浜嬩欢锛屼繚鎸佹牎楠屽噯纭?
                  inputs.forEach((input) => {
                    const index = parseInt(input.dataset.index, 10);
                    if (Number.isNaN(index)) return;
                    if (!reachedLimit || changedIndices.has(index)) {
                      input.disabled = false;
                      input.classList.remove("bg-gray-100", "cursor-not-allowed");
                    } else {
                      input.disabled = true;
                      input.classList.add("bg-gray-100", "cursor-not-allowed");
                    }
                  });
                };

                inputs.forEach((input) => {
                  let isComposing = false;
                  const handleChange = () => {
                    const index = parseInt(input.dataset.index, 10);
                    if (Number.isNaN(index)) return;
                    const trimmedValue = input.value.trim();
                    if (trimmedValue !== input.value) input.value = trimmedValue;
                    if (trimmedValue.length > 1) {
                      const normalized = Array.from(trimmedValue).slice(-1).join("");
                      input.value = normalized;
                    }
                    if (input.value !== nameEditConfig.originalChars[index]) {
                      if (input.value.length > 0) {
                        changedIndices.add(index);
                      } else {
                        changedIndices.delete(index);
                      }
                    } else {
                      changedIndices.delete(index);
                    }
                    enforceLimit();
                  };
                  input.addEventListener("compositionstart", () => {
                    isComposing = true;
                  });
                  input.addEventListener("compositionend", () => {
                    isComposing = false;
                    handleChange();
                  });
                  input.addEventListener("input", () => {
                    if (isComposing) return;
                    handleChange();
                  });
                  input.addEventListener("focus", () => input.select());
                });

                enforceLimit();
              }
            }
          }
        }

        /**
         * 鏇存柊瀹惧绛夌骇
         * @param {number} giftIndex - 绀奸噾绱㈠紩
         * @param {number} newLevel - 鏂扮瓑绾х储寮?(0-4)
         * @param {number} oldLevel - 鏃х瓑绾х储寮?(0-4)
         */
        async updateGuestLevel(giftIndex, newLevel, oldLevel) {
          try {
            const giftObject = this.gifts[giftIndex];
            const currentData = { ...giftObject.data };
            const now = new Date().toISOString();
            const newlevelUpdateTime = Date.now();

            const oldLevelName = CONFIG.GUEST_LEVELS[oldLevel];
            const newLevelName = CONFIG.GUEST_LEVELS[newLevel];

            // 绛夌骇鍙樺寲锛岃褰曞巻鍙诧紝鏇存柊 levelUpdateTime
            const historyEntry = {
              timestamp: now,
              changeLog: `灏嗗瀹㈢瓑绾т粠 "${oldLevelName}" 淇敼涓?"${newLevelName}"`,
              snapshot: this.giftManager.createSnapshot(currentData),
              type: "levelChange",
            };

            const updatedData = {
              ...currentData,
              guestLevel: newLevel,
              timestamp: now,
              history: currentData.history ? [...currentData.history, historyEntry] : [historyEntry],
            };

            // timestamp 鍦?encryptedData 涓紝levelUpdateTime 鍗曠嫭瀛樺偍
            const encryptedData = CryptoService.encrypt(updatedData, this.currentPassword);
            await this.giftRepository.updateGift(
              this.giftManager.buildGiftRecordForUpdate(giftObject, {
                encryptedData,
                guestLevelWeight: newLevel,
                levelUpdateTime: newlevelUpdateTime,
              })
            );

            // 浼樺寲锛氬彧閲嶆柊鎺掑簭鍐呭瓨鏁版嵁锛岄伩鍏嶉噸澶嶆煡璇㈠拰瑙ｅ瘑
            const updatedGiftId = giftObject.id;
            this.gifts[giftIndex].data = updatedData;
            this.gifts[giftIndex].encryptedData = encryptedData;
            this.gifts[giftIndex].guestLevelWeight = newLevel;
            this.gifts[giftIndex].levelUpdateTime = newlevelUpdateTime;
            this.giftManager.sortGiftsByLevel();

            const newIndex = this.gifts.findIndex((g) => g.id === updatedGiftId);
            this.currentPage = newIndex !== -1 ? Math.floor(newIndex / app.getItemsPerPage()) + 1 : this.currentPage;
            this.giftManager.render();

            this.ui.closeModal();
            setTimeout(() => this.showGiftDetails(newIndex, { fromStats: false }), 150);
            this.ui.showNotification(`瀹惧绛夌骇宸叉洿鏂颁负 "${newLevelName}"銆俙, "success");
          } catch (error) {
            console.error("绛夌骇鏇存柊澶辫触锛岃閲嶈瘯銆?", error);
            this.ui.showNotification("绛夌骇鏇存柊澶辫触锛岃閲嶈瘯銆?, "error");
          }
        }

        /**
         * 缁熶竴鐨勭鐞嗗憳瀵嗙爜鏍￠獙鏂规硶
         * @param {string} title - 寮圭獥鏍囬
         * @param {string} message - 鎻愮ず淇℃伅
         * @param {string} expectedHash - 鏈熸湜鐨勫瘑鐮佸搱甯屽€硷紙鍙€夛紝榛樿浣跨敤褰撳墠浜嬮」锛?
         * @param {boolean} forceVerify - 鏄惁寮哄埗楠岃瘉锛坱rue 鏃跺繀椤昏緭鍏ュ瘑鐮侊紝涓嶄娇鐢ㄥ厤瀵嗙紦瀛橈級
         * @returns {Promise<string|null>} 杩斿洖鍘熷瀵嗙爜锛堟垚鍔燂級鎴?null锛堝彇娑?閿欒锛?
         */
        async requestAdminPassword(title, message = "", expectedHash = null, forceVerify = false) {
          const hashToCompare = expectedHash || this.currentEvent.passwordHash;

          // 濡傛灉涓嶅己鍒堕獙璇侊紝灏濊瘯浠庣紦瀛樹腑鑾峰彇瀵嗙爜
          if (!forceVerify) {
            const cachedPassword = this.getCachedAdminPassword();
            if (cachedPassword && CryptoService.hash(cachedPassword) === hashToCompare) {
              return cachedPassword; // 鑷姩楠岃瘉閫氳繃
            }
          }

          return new Promise((resolve) => {
            this.ui.elements.modal.classList.remove("modal-large");
            const content = `
                        ${(message && `<p class="text-sm text-gray-600 mb-3">${message}</p>`) || ""}
                        <input type="password" id="admin-pwd-input" class="w-full p-2 border rounded themed-ring" placeholder="璇疯緭鍏ョ鐞嗗瘑鐮?>
                      `;

            this.ui.showModal(title, content, [
              { text: "鍙栨秷", class: "themed-button-secondary border px-4 py-2 rounded", handler: () => resolve(null) },
              {
                text: "纭",
                class: "themed-button-primary px-4 py-2 rounded",
                handler: () => {
                  const inputPassword = document.getElementById("admin-pwd-input").value;
                  const isCorrect = CryptoService.hash(inputPassword) === hashToCompare;

                  if (isCorrect) {
                    // 濡傛灉鍕鹃€変簡N鍒嗛挓鍏嶅瘑锛屽垯缂撳瓨瀵嗙爜
                    if (!forceVerify) {
                      const skipVerify = document.getElementById("skip-verify-5min")?.checked;
                      if (skipVerify) {
                        this.cacheAdminPassword(inputPassword, hashToCompare);
                      }
                    }
                    resolve(inputPassword); // 杩斿洖鍘熷瀵嗙爜
                  } else {
                    this.ui.showNotification("瀵嗙爜閿欒锛岃閲嶆柊杈撳叆銆?, "error");
                    resolve(null); // 瀵嗙爜閿欒
                  }
                },
              },
            ]);

            setTimeout(() => {
              // 灏嗗閫夋娣诲姞鍒?modal-actions 宸︿晶
              if (!forceVerify) {
                const actionsContainer = this.ui.elements.modalActions;
                const checkboxDiv = document.createElement("div");
                checkboxDiv.className = "flex items-center mr-auto";
                const minutes = CONFIG.PASSWORD_CACHE_DURATION;
                checkboxDiv.innerHTML = `
                            <input type="checkbox" id="skip-verify-5min" class="w-4 h-4  rounded themed-ring cursor-pointer">
                            <label for="skip-verify-5min" class="ml-2 text-sm text-gray-600 cursor-pointer select-none whitespace-nowrap">${minutes}鍒嗛挓鍐呬笉鍐嶆牎楠岀鐞嗗瘑鐮?/label>
                          `;
                actionsContainer.insertBefore(checkboxDiv, actionsContainer.firstChild);
              }
              document.getElementById("admin-pwd-input")?.focus();
            }, 50);
          });
        }

        /**
         * 缂撳瓨绠＄悊鍛樺瘑鐮?- N 鍒嗛挓鏈夋晥
         * @param {string} password - 鍘熷瀵嗙爜
         * @param {string} passwordHash - 瀵嗙爜鍝堝笇鍊硷紙浣滀负鍔犲瘑瀵嗛挜锛?
         */
        cacheAdminPassword(password, passwordHash) {
          if (!this.currentEvent) return;
          this.passwordCache.store(this.currentEvent.id, password, passwordHash);
        }

        /**
         * 浠庣紦瀛樹腑鑾峰彇绠＄悊鍛樺瘑鐮?
         * @returns {string|null} 杩斿洖瀵嗙爜鎴?null锛堝鏋滆繃鏈熸垨涓嶅瓨鍦級
         */
        getCachedAdminPassword() {
          if (!this.currentEvent) return null;
          return this.passwordCache.retrieve(this.currentEvent.id, this.currentEvent.passwordHash);
        }

        /**
         * 濉厖璇煶鎾姤闊宠壊鍒楄〃
         * 浠庢祻瑙堝櫒鑾峰彇鍙敤涓枃璇煶骞跺～鍏呬笅鎷夋
         * 浣跨敤 DocumentFragment 鍑忓皯閲嶇粯
         */
        populateVoiceList(targetSelect = this.ui.elements.eventVoiceSelect, selectedValue = targetSelect?.value || "") {
          if (!targetSelect) return;
          if (!("speechSynthesis" in window)) {
            // 濡傛灉涓嶆敮鎸佽闊筹紝鐩存帴娓呯┖鎴栨樉绀洪粯璁わ紝骞堕€€鍑哄嚱鏁伴槻姝㈡姤閿?
            targetSelect.innerHTML = '<option value="">璁惧涓嶆敮鎸佽闊?/option>';
            return;
          }
          const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith("zh"));
          const fragment = document.createDocumentFragment();
          const defaultOption = document.createElement("option");
          defaultOption.value = "";
          defaultOption.textContent = "榛樿闊宠壊";
          fragment.appendChild(defaultOption);

          let hasSelectedVoice = false;
          voices.forEach((voice) => {
            const option = document.createElement("option");
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.name === selectedValue) {
              option.selected = true;
              hasSelectedVoice = true;
            }
            fragment.appendChild(option);
          });

          if (selectedValue && !hasSelectedVoice) {
            defaultOption.selected = true;
          } else if (!selectedValue) {
            defaultOption.selected = true;
          }

          targetSelect.innerHTML = "";
          targetSelect.appendChild(fragment);
        }

        /**
         * 鍒囨崲澶囨敞棰勮閫夐」
         * @param {string} preset - 棰勮閿?
         * @param {HTMLElement} btn - 瑙﹀彂鎸夐挳
         */
        toggleRemarkPreset(preset, btn) {
          const activeClass = "themed-button-primary";
          const inactiveClass = "themed-button-secondary";
          if (this.selectedRemarkPresets.has(preset)) {
            this.selectedRemarkPresets.delete(preset);
            btn.classList.remove(activeClass, inactiveClass);
          } else {
            this.selectedRemarkPresets.add(preset);
            btn.classList.add(activeClass, inactiveClass);
          }
          this.updateRemarkInputs();
        }

        /**
         * 鏇存柊澶囨敞杈撳叆妗?
         * 鏍规嵁宸查€夐璁惧姩鎬佺敓鎴愯緭鍏ュ瓧娈?
         */
        updateRemarkInputs() {
          const container = document.getElementById("remark-inputs-container");

          // 淇濆瓨褰撳墠鍊?
          const currentValues = {};
          container.querySelectorAll("[data-remark-type]").forEach((input) => {
            currentValues[input.dataset.remarkType] = input.value;
          });

          container.innerHTML = "";

          const orderedPresets = this.REMARK_LABELS.map((item) => item.key).filter((key) => key !== "custom");

          orderedPresets.forEach((preset) => {
            if (this.selectedRemarkPresets.has(preset)) {
              const remarkConfig = this.REMARK_LABELS.find((item) => item.key === preset);
              if (remarkConfig) {
                const inputDiv = document.createElement("div");
                inputDiv.className = "flex items-center";
                inputDiv.innerHTML = `
                        <label class="text-sm font-medium text-gray-700 w-12">${remarkConfig.label}:</label>
                        <input type="text" class="flex-1 p-2 border rounded themed-ring"
                              data-remark-type="${preset}"
                              placeholder="璇疯緭鍏?{remarkConfig.label}"
                              value="${currentValues[preset] || ""}">
                      `;
                container.appendChild(inputDiv);
              }
            }
          });
        }

        /**
         * 鏀堕泦澶囨敞鏁版嵁
         * @param {boolean} isEdit - 鏄惁鍦ㄧ紪杈戞ā寮?
         * @returns {Object} 澶囨敞瀵硅薄
         */
        collectRemarkData(isEdit) {
          // 纭畾鏌ユ壘鐨勮寖鍥?(涓婁笅鏂?
          // scope涓虹湡锛岃鏄庢槸寮圭獥锛岃寖鍥存槸 #modal-content
          // 鍚﹀垯璇存槑鏄富鐣岄潰锛岃寖鍥存槸 #add-gift-form (杩欐槸鎮ㄧ殑鎬濊矾)

          const scope = isEdit ? document.getElementById("modal-content") : this.ui.elements.addGiftForm;
          // 濡傛灉鎵句笉鍒拌寖鍥达紝鐩存帴杩斿洖绌猴紝澧炲姞浠ｇ爜鍋ュ．鎬?
          if (!scope) return {};

          const remarkData = {};
          // 2. 鍦ㄧ‘瀹氱殑鑼冨洿鍐咃紝鏌ユ壘鎵€鏈夊甫 data-remark-type 灞炴€х殑杈撳叆鍏冪礌
          scope.querySelectorAll("[data-remark-type]").forEach((input) => {
            const type = input.dataset.remarkType;
            const value = input.value.trim();
            if (value) {
              remarkData[type] = value;
            }
          });

          return remarkData;
        }

        /**
         * 鐢熸垚澶囨敞杈撳叆琛ㄥ崟 HTML
         * @param {Object|string} remarkData - 澶囨敞鏁版嵁
         * @returns {string} HTML 瀛楃涓?
         */
        generateRemarkInputsHTML(remarkData = {}) {
          const normalized = this.normalizeRemarkData(remarkData);
          return this.REMARK_LABELS.map(({ key, label }) => {
            const value = normalized[key] || "";
            const placeholder = `璇疯緭鍏?{label}(閫夊～)`;

            if (key === "custom") {
              return `
                        <div class="mt-2">
                          <label class="font-medium text-gray-700 block mb-1">${label}锛?/label>
                          <textarea data-remark-type="${key}" class="w-full p-2 border rounded themed-ring" rows="2" placeholder="${placeholder}">${value}</textarea>
                        </div>
                      `;
            } else {
              return `
                        <div class="flex items-center">
                          <label class="font-medium text-gray-700 w-12">${label}锛?/label>
                          <input type="text" data-remark-type="${key}" class="flex-1 p-2 border rounded themed-ring" placeholder="${placeholder}" value="${value}">
                        </div>
                      `;
            }
          }).join("\n");
        }

        /**
         * 瑙勮寖鍖栧娉ㄦ暟鎹?
         * 鍏煎鏃х増瀛楃涓插娉?
         * @param {Object|string|null} remarkData
         * @returns {Object}
         */
        normalizeRemarkData(remarkData) {
          if (!remarkData) return {};
          if (typeof remarkData === "string") {
            const trimmed = remarkData.trim();
            return trimmed ? { custom: trimmed } : {};
          }
          if (typeof remarkData === "object") {
            return { ...remarkData };
          }
          return {};
        }

        /**
         * 灏嗗娉ㄥ璞¤浆鎹负鏄剧ず鏂囨湰
         * @param {Object|string} remarkData - 澶囨敞鏁版嵁
         * @param {string} separator - 鍒嗛殧绗?
         * @returns {string}
         */
        formatRemarkDisplay(remarkData, separator = "; ") {
          const normalized = this.normalizeRemarkData(remarkData);
          if (Object.keys(normalized).length === 0) {
            return typeof remarkData === "string" ? remarkData.trim() : "";
          }
          const parts = [];
          this.REMARK_LABELS.forEach(({ key, label }) => {
            if (normalized[key]) {
              parts.push(`${key !== "custom" ? label + "锛? : ""}${normalized[key]}`);
            }
          });

          return parts.join(separator);
        }

        /**
         * 鏍煎紡鍖栧娉ㄤ俊鎭互鏄剧ず鍦ㄨ鎯呴〉闈?
         * @param {Object|string} remarkData - 澶囨敞鏁版嵁
         * @returns {string} HTML 瀛楃涓?
         */
        formatRemarkDetailsDisplay(remarkData) {
          const normalized = this.normalizeRemarkData(remarkData);
          if (Object.keys(normalized).length === 0) {
            return '<p class="text-gray-500">锛堟棤澶囨敞锛?/p>';
          }

          let html = "";
          const gridItems = [];

          this.REMARK_LABELS.forEach(({ key, label }) => {
            if (normalized[key]) {
              if (key === "custom") {
                html += `<div class="mb-2">${normalized[key]}</div>`;
              } else {
                gridItems.push(`<div><span class="text-sm font-bold">${label}锛?/span>${normalized[key]}</div>`);
              }
            }
          });

          if (gridItems.length > 0) {
            html += `<div class="grid grid-cols-2 gap-2">${gridItems.join("")}</div>`;
          }

          return html || '<p class="text-gray-500">锛堟棤澶囨敞锛?/p>';
        }

        /**
         * 妫€鏌ユ槸鍚﹀瓨鍦ㄥ娉?
         * @param {Object} giftData - 绀奸噾鏁版嵁瀵硅薄
         * @returns {boolean}
         */
        hasRemarkData(giftData) {
          const normalized = this.normalizeRemarkData(giftData?.remarkData);
          return Object.keys(normalized).length > 0;
        }

        /**
         * 閲嶇疆澶囨敞棰勮閫夐」鍒伴粯璁ょ姸鎬?
         */
        resetRemarkPresets() {
          this.selectedRemarkPresets.clear();

          // 2. 绉婚櫎鎵€鏈夋寜閽殑楂樹寒鐘舵€?
          document.querySelectorAll(".remark-preset-btn").forEach((btn) => {
            btn.classList.remove("themed-button-primary");
            btn.classList.add("themed-button-secondary");
          });

          // 3. 娓呯┖鍥哄畾鐨勮嚜瀹氫箟澶囨敞杈撳叆妗?
          const customInput = document.getElementById("guest-remark-custom");
          if (customInput) {
            customInput.value = "";
          }

          // 4. 鏇存柊锛堟竻绌猴級鍔ㄦ€佽緭鍏ユ鍖哄煙
          this.updateRemarkInputs();
        }

        /**
         * 棰勮璇煶闊宠壊
         * @param {HTMLSelectElement} selectElement - 璇煶閫夋嫨鍣?
         */
        previewSelectedVoice(selectElement) {
          if (!("speechSynthesis" in window)) {
            this.ui.showNotification("褰撳墠娴忚鍣ㄤ笉鏀寔璇煶鎾姤鍔熻兘銆?, "error");
            return;
          }

          speechSynthesis.cancel();
          const selectedVoiceName = selectElement.value;
          const utterance = new SpeechSynthesisUtterance("寮犱笁璐虹ぜ浜旂櫨鍏冩暣");
          utterance.lang = "zh-CN";

          if (selectedVoiceName) {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find((voice) => voice.name === selectedVoiceName);
            if (selectedVoice) utterance.voice = selectedVoice;
          }

          speechSynthesis.speak(utterance);
        }

        /**
         * 璇煶鎾姤绀奸噾淇℃伅
         * 浣跨敤娴忚鍣?Web Speech API 鎾姤绀奸噾璁板綍
         * @param {string} name - 瀹汉濮撳悕
         * @param {number} amount - 绀奸噾閲戦
         *
         * 鎾姤瑙勫垯锛?
         * - 灏忎簬璧锋姤閲戦涓嶆挱鎶?
         * - 鍠滀簨锛氣€滃鍚?璐虹ぜ 閲戦鈥?
         * - 鐧戒簨锛氣€滃鍚嶏紝閲戦鈥?
         */
        speakGift(name, amount) {
          if (!this.isSpeechEnabled || !("speechSynthesis" in window)) return;

          // 璧锋姤閲戦锛氬皬浜庨槇鍊煎垯涓嶆挱鎶?
          const minAmount = parseFloat(this.currentEvent?.minSpeechAmount || 0) || 0;
          if (typeof amount === "number" && amount < minAmount) return;

          const ttsText = Utils.amountToChinese(amount).replace(/闄?g, "鍏?);
          const textToSpeak = this.currentEvent.theme === "theme-solemn" ? `${name}锛?{ttsText}` : `${name} 璐虹ぜ ${ttsText}`;

          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = "zh-CN";

          if (this.currentEvent.voiceName) {
            const voices = speechSynthesis.getVoices();
            const selectedVoice = voices.find((voice) => voice.name === this.currentEvent.voiceName);
            if (selectedVoice) utterance.voice = selectedVoice;
          }

          speechSynthesis.speak(utterance);
        }

        /**
         * 鏄剧ず浜嬮」璁剧疆瀵硅瘽妗?
         */
        async showEditEventInfoModal() {
          this.ui.elements.modal.classList.add("modal-large");

          const [startDate, startTime] = (this.currentEvent.startDateTime || "").split("T");
          const [endDate, endTime] = (this.currentEvent.endDateTime || "").split("T");

          const content = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-left">
        <div class="space-y-4">
          <div>
            <label for="edit-event-name-input" class="block text-sm font-medium text-gray-700">浜嬮」鍚嶇О</label>
            <input type="text" id="edit-event-name-input" class="w-full mt-1 p-2 border rounded themed-ring" value="${this.currentEvent.name || ""}">
          </div>

          <div>
            <label for="edit-event-voice" class="block text-sm font-medium text-gray-700">璇煶鎾姤闊宠壊</label>
            <div class="flex items-center gap-2 mt-1">
              <select id="edit-event-voice" class="text-sm flex-grow w-full p-2 border rounded themed-ring">
                <option value="">榛樿闊宠壊</option>
              </select>
              <button type="button" id="preview-edit-voice-btn" class="themed-button-secondary border p-2 rounded whitespace-nowrap text-xs"><i class="ri-volume-up-line"></i> 棰勮</button>
            </div>
          </div>

          <div>
            <label for="edit-min-speech-amount" class="block text-sm font-medium text-gray-700">璇煶鎾姤璧锋姤閲戦 (鍏?</label>
            <input type="number" id="edit-min-speech-amount" min="0" step="1" class="w-full mt-1 p-2 border rounded themed-ring" value="${this.currentEvent.minSpeechAmount || 0}">
            <p class="text-xs text-gray-500 mt-1">鍙湁澶т簬鎴栫瓑浜庢閲戦鐨勭ぜ閲戞墠浼氳鎾姤銆傝缃负0鍒欏叏閮ㄦ挱鎶ャ€?/p>
          </div>
          <div>
            <label for="edit-event-recorder" class="block text-sm font-medium text-gray-700">璁拌处浜?/label>
            <input type="text" id="edit-event-recorder" class="w-full mt-1 p-2 border rounded themed-ring" value="${this.currentEvent.recorder || ""}">
          </div>
          <div>
          <label class="flex items-center cursor-pointer">
            <input type="checkbox" id="edit-hide-privacy" class="w-4 h-4 themed-ring rounded mr-2" ${this.currentEvent.hidePrivacy ? "checked" : ""}>
            <span class="text-sm font-medium text-gray-700">鍓睆淇℃伅鑴辨晱鏄剧ず</span>
          </label>
          <p class="text-xs text-gray-500 mt-1">寮€鍚悗锛屽壇灞忎粎鏄剧ず鏈€鏂板綍鍏ヨ褰曠殑瀹屾暣濮撳悕锛屽叾浠栬褰曡劚鏁忔樉绀恒€?/p>
        </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">浜嬮」寮€濮嬫椂闂?/label>
            <div class="flex gap-2 mt-1">
              <input type="date" id="edit-start-date" required class="w-full p-2 border rounded themed-ring" value="${startDate || ""}">
              <input type="time" id="edit-start-time" required class="w-full p-2 border rounded themed-ring" value="${startTime || ""}">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">浜嬮」缁撴潫鏃堕棿</label>
            <div class="flex gap-2 mt-1">
              <input type="date" id="edit-end-date" required class="w-full p-2 border rounded themed-ring" value="${endDate || ""}">
              <input type="time" id="edit-end-time" required class="w-full p-2 border rounded themed-ring" value="${endTime || ""}">
            </div>
          </div>

          <!-- 浠呬繚鐣?PDF 寮曟搸閫夋嫨锛屽洜涓鸿繖灞炰簬鎶€鏈厤缃€岄潪鏍峰紡 -->
          <div class="mt-4 pt-4">
              <span class="block text-sm font-medium text-gray-700">PDF娓叉煋鏂瑰紡</span>
              <div class="space-y-2 text-sm text-gray-700 mt-2">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="edit-pdf-engine" value="browser" class="themed-text-radio themed-ring">
                  <span>娴忚鍣ㄥ彟瀛樹负PDF锛堟枃浠跺皬,涓嶅吋瀹圭Щ鍔ㄧ锛?/span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="edit-pdf-engine" value="pdf-lib" class="themed-text-radio themed-ring">
                  <span>PDF-LIB.JS寮曟搸锛堟枃浠剁◢澶?鍏煎PC/绉诲姩绔級</span>
                </label>
                <p class="text-xs text-gray-500">娴忚鍣ㄥ彟瀛樹负PDF鏂囦欢杈冨皬锛屼笉鍏煎绉诲姩绔紝PDF-LIB.JS鐢熸垚鐨刾df鏂囦欢绋嶅ぇ,鏀寔澶氬钩鍙?/p>
              </div>
          </div>
        </div>
      </div>`;

          this.ui.showModal("璁剧疆浜嬮」", content, [
            {
              text: "绀肩翱鏍峰紡璁剧疆",
              class: "border px-4 py-2 rounded themed-button-secondary  mr-auto",
              keepOpen: true,
              handler: () => this.showGiftBookStyleModal(),
            },
            { text: "鍙栨秷", class: "themed-button-secondary border px-4 py-2 rounded" },
            {
              text: "淇濆瓨",
              class: "themed-button-primary px-4 py-2 rounded",
              keepOpen: true,
              handler: async () => {
                const newName = document.getElementById("edit-event-name-input").value.trim();
                const newVoiceName = document.getElementById("edit-event-voice").value;
                const newMinSpeechAmount = parseFloat(document.getElementById("edit-min-speech-amount").value) || 0;
                const newStartDateTime = `${document.getElementById("edit-start-date").value}T${document.getElementById("edit-start-time").value}`;
                const newEndDateTime = `${document.getElementById("edit-end-date").value}T${document.getElementById("edit-end-time").value}`;
                const newRecorder = document.getElementById("edit-event-recorder").value.trim();
                const hidePrivacy = document.getElementById("edit-hide-privacy").checked;
                const pdfEngineSelection = document.querySelector('input[name="edit-pdf-engine"]:checked')?.value || "browser";

                // 鍩虹楠岃瘉
                if (!newName) {
                  this.ui.showNotification("浜嬮」鍚嶇О涓嶈兘涓虹┖銆?, "error");
                  return;
                }
                if (new Date(newStartDateTime) >= new Date(newEndDateTime)) {
                  this.ui.showNotification("寮€濮嬫椂闂村繀椤绘棭浜庣粨鏉熸椂闂淬€?, "error");
                  return;
                }

                // 鏃ユ湡鍙樺姩楠岃瘉瀵嗙爜
                const originalStartDateTime = this.currentEvent.startDateTime;
                const originalEndDateTime = this.currentEvent.endDateTime;
                const datesChanged = newStartDateTime !== originalStartDateTime || newEndDateTime !== originalEndDateTime;

                if (datesChanged) {
                  const password = await this.requestAdminPassword("瀵嗙爜楠岃瘉", "淇敼浜嬮」鐨勮捣姝㈡棩鏈燂紝璇疯緭鍏ョ鐞嗗瘑鐮佷互纭銆?, null, true);
                  if (!password) {
                    this.ui.showNotification("宸插彇娑堥獙璇侊紝淇敼鏈繚瀛樸€?, "info");
                    return;
                  }
                }

                const currentPrintOptions = this.currentEvent.printOptions || {};
                const updatedPrintOptions = {
                  ...currentPrintOptions,
                  pdfEngine: pdfEngineSelection,
                };

                const updatedEvent = {
                  ...this.currentEvent,
                  name: newName,
                  startDateTime: newStartDateTime,
                  endDateTime: newEndDateTime,
                  voiceName: newVoiceName,
                  recorder: newRecorder,
                  minSpeechAmount: newMinSpeechAmount,
                  hidePrivacy: hidePrivacy,
                  printOptions: updatedPrintOptions,
                };

                try {
                  await this.giftRepository.updateEvent(updatedEvent);
                  this.currentEvent = updatedEvent;
                  this.ui.elements.currentEventTitleEl.textContent = newName;

                  // 閲嶆柊搴旂敤鏍峰紡浠ラ槻涓囦竴
                  await this.applyCustomGiftBookStyle();

                  this.session.save(this.currentEvent, this.currentPassword);

                  this.ui.closeModal();
                  this.ui.showNotification("浜嬮」璁剧疆鏇存柊鎴愬姛銆?, "success");
                  this.guestScreenService.syncToGuestScreen();
                } catch (error) {
                  console.error(error);
                  this.ui.showNotification("浜嬮」璁剧疆淇濆瓨澶辫触锛岃閲嶈瘯銆?, "error");
                }
              },
            },
          ]);

          setTimeout(() => {
            const voiceSelectElement = document.getElementById("edit-event-voice");
            this.populateVoiceList(voiceSelectElement, this.currentEvent.voiceName || "");

            document.getElementById("preview-edit-voice-btn").addEventListener("click", () => {
              this.previewSelectedVoice(voiceSelectElement);
            });

            // 璁剧疆 PDF 寮曟搸鍗曢€夋鐘舵€?
            const pdfEngineRadio = document.querySelector(`input[name="edit-pdf-engine"][value="${this.currentEvent.printOptions?.pdfEngine || "browser"}"]`);
            if (pdfEngineRadio) {
              pdfEngineRadio.checked = true;
            }
          }, 100);
        }

        /**
         * 鍒犻櫎褰撳墠浜嬮」
         * 寮哄埗瑕佹眰瀵煎嚭澶囦唤骞堕獙璇佺鐞嗗憳瀵嗙爜
         */
        async deleteCurrentEvent() {
          if (!this.currentEvent) return;

          if (this.gifts.length === 0) {
            const password = await this.requestAdminPassword(
              "鍒犻櫎纭",
              `<p>姝ゆ搷浣滃皢姘镐箙鍒犻櫎浜嬮」 \"<strong>${this.currentEvent.name}</strong>\"锛屾棤娉曟仮澶嶃€?/p>
                      <p class=\"mt-4\">璇疯緭鍏ョ鐞嗗瘑鐮佷互纭锛?/p>`,
              null
            );

            if (password === null) return;

            try {
              await this.giftRepository.deleteEvent(this.currentEvent.id);
              this.session.clear();
              this.passwordCache.clear(this.currentEvent.id);
              this.ui.showNotification(`浜嬮」 "${this.currentEvent.name}" 宸茶鎴愬姛鍒犻櫎銆俙, "success");

              setTimeout(() => {
                this.currentEvent = null;
                this.currentPassword = null;
                this.gifts = [];
                this.ui.showScreen("setup");
                this.loadEvents();
              }, 500);
            } catch (error) {
              console.error("鍒犻櫎浜嬮」鏃跺彂鐢熼敊璇?", error);
              this.ui.showNotification("鍒犻櫎澶辫触锛岃閲嶈瘯銆?, "error");
            }
            return;
          }

          const content = `
                         <div class="text-left space-y-3">
                           <p class="font-semibold text-gray-800">涓轰簡纭繚鎮ㄧ殑鏁版嵁瀹夊叏锛屽垹闄や簨椤瑰墠蹇呴』鍏堝鍑篍xcel澶囦唤銆?/p>
                           <ol class="list-decimal pl-5 text-sm text-gray-700 space-y-1">
                             <li>鐐瑰嚮涓嬫柟鈥滃鍑篍xcel澶囦唤鈥濇寜閽紝涓嬭浇骞朵繚瀛樺埌鎮ㄧ殑鐢佃剳銆?/li>
                             <li>纭宸叉垚鍔熷鍑哄悗锛屽嬀閫夆€滄垜宸叉垚鍔熷鍑篍xcel澶囦唤鈥濄€?/li>
                             <li>绯荤粺浼氳姹傝緭鍏ョ鐞嗗瘑鐮佸悗鎵嶄細鎵ц鍒犻櫎銆?/li>
                           </ol>
                           <label class="flex items-center mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100">
                             <input id="confirm-exported" type="checkbox" class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded">
                             <span class="ml-3 text-sm font-medium text-gray-900">鎴戝凡鎴愬姛瀵煎嚭Excel澶囦唤</span>
                           </label>
                         </div>
                       `;

          let hasExported = false;
          const updateDeleteButtonState = () => {
            const checkbox = document.getElementById("confirm-exported");
            const continueBtn = document.getElementById("btn-continue-delete");
            if (continueBtn && checkbox) {
              const shouldEnable = hasExported && checkbox.checked;
              continueBtn.disabled = !shouldEnable;
              // 娣诲姞绂佺敤鏍峰紡
              if (!shouldEnable) {
                continueBtn.classList.add("opacity-50", "cursor-not-allowed");
              } else {
                continueBtn.classList.remove("opacity-50", "cursor-not-allowed");
              }
            }
          };

          this.ui.showModal("鍒犻櫎浜嬮」", content, [
            {
              text: "鍏抽棴",
              class: "themed-button-secondary border px-4 py-2 rounded",
              role: "secondary",
            },
            {
              text: "瀵煎嚭Excel澶囦唤",
              class: "themed-button-secondary border px-4 py-2 rounded",
              id: "btn-export-excel",
              handler: () => {
                this.exportService.exportToExcel();
                hasExported = true;
                setTimeout(updateDeleteButtonState, 10);
              },
              keepOpen: true,
            },
            {
              text: "宸插鍑猴紝缁х画鍒犻櫎",
              class: "themed-button-primary px-4 py-2 rounded",
              id: "btn-continue-delete",
              role: "primary",
              handler: async () => {
                const checkbox = document.getElementById("confirm-exported");
                if (!hasExported || !checkbox || !checkbox.checked) {
                  this.ui.showNotification("璇峰厛瀵煎嚭 Excel锛屽苟鍕鹃€夌‘璁ゅ悗鍐嶇户缁€?, "error");
                  return;
                }
                const password = await this.requestAdminPassword("鍒犻櫎纭", `姝ゆ搷浣滃皢姘镐箙鍒犻櫎浜嬮」 \"<strong>${this.currentEvent.name}</strong>\" 鍙婂叾鎵€鏈夌ぜ閲戣褰曪紝涓旀棤娉曟仮澶嶃€傝杈撳叆绠＄悊瀵嗙爜浠ョ‘璁ゃ€俙, null, true);
                if (password === null) return;

                try {
                  const eventId = this.currentEvent.id;
                  const allGifts = await this.giftRepository.fetchGiftsByEvent(eventId);
                  for (const gift of allGifts) {
                    await this.giftRepository.deleteGift(gift.id);
                  }
                  await this.giftRepository.deleteEvent(eventId);

                  this.session.clear();
                  this.passwordCache.clear(eventId);
                  this.ui.showNotification(`浜嬮」 "${this.currentEvent.name}" 宸茶鎴愬姛鍒犻櫎銆俙, "success");

                  setTimeout(() => {
                    this.currentEvent = null;
                    this.currentPassword = null;
                    this.gifts = [];
                    this.ui.showScreen("setup");
                    this.loadEvents();
                  }, 500);
                } catch (error) {
                  console.error("鍒犻櫎浜嬮」鏃跺彂鐢熼敊璇?", error);
                  this.ui.showNotification("鍒犻櫎澶辫触锛岃閲嶈瘯銆?, "error");
                }
              },
              keepOpen: true,
            },
          ]);

          setTimeout(() => {
            const continueBtn = document.getElementById("btn-continue-delete");
            const checkbox = document.getElementById("confirm-exported");
            if (continueBtn) {
              continueBtn.disabled = true;
              continueBtn.classList.add("opacity-50", "cursor-not-allowed");
            }
            if (checkbox) {
              checkbox.addEventListener("change", updateDeleteButtonState);
            }
          }, 10);
        }
        /**
         */
        getItemsPerPage() {
          const val = parseInt(this.currentEvent?.itemsPerPage);
          return val && val > 0 ? val : CONFIG.ITEMS_PER_PAGE;
        }
      }

      class ImageCache {
        static CACHE_NAME = "giftbook-assets-v1";

        /**
         * 鑾峰彇浜嬮」灏侀潰鐨?Cache Key
         */
        static getCoverKey(eventId) {
          return `/event-cover-${eventId}`;
        }

        /**
         * 鑾峰彇浜嬮」鑳屾櫙鍥剧殑 Cache Key
         */
        static getBackgroundKey(eventId) {
          return `/event-background-${eventId}`;
        }

        /**
         * 閫氱敤淇濆瓨鏂规硶 (甯﹀ぇ灏忛檺鍒?
         * @param {string} key - 缂撳瓨閿?
         * @param {File|Blob} file - 鏂囦欢瀵硅薄
         * @returns {Promise<boolean>} 鏄惁淇濆瓨鎴愬姛
         */
        static async save(key, file) {
          if (!("caches" in window)) return false;

          // 纭繚 CONFIG.MAX_COVER_SIZE 宸插畾涔?(榛樿涓?2MB)
          const maxSize = typeof CONFIG !== "undefined" && CONFIG.MAX_COVER_SIZE ? CONFIG.MAX_COVER_SIZE : 2 * 1024 * 1024;

          if (file.size > maxSize) {
            console.warn(`鍥剧墖杩囧ぇ: ${(file.size / 1024 / 1024).toFixed(2)}MB, 闄愬埗: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
            return false;
          }

          try {
            const cache = await caches.open(this.CACHE_NAME);

            // 鏋勯€犲搷搴斿璞″瓨鍏?Cache
            await cache.put(
              key,
              new Response(file, {
                headers: {
                  "Content-Type": file.type,
                  "Content-Length": file.size,
                },
              })
            );
            return true;
          } catch (e) {
            console.warn("Cache API 淇濆瓨澶辫触", e);
            return false;
          }
        }

        /**
         * 閫氱敤璇诲彇鏂规硶 (杩斿洖 Blob URL)
         * @param {string} key - 缂撳瓨閿?
         */
        static async getUrl(key) {
          if (!("caches" in window)) return null;
          try {
            const cache = await caches.open(this.CACHE_NAME);
            const response = await cache.match(key);
            if (!response) return null;
            const blob = await response.blob();
            return URL.createObjectURL(blob);
          } catch (e) {
            console.error("璇诲彇缂撳瓨鍥剧墖澶辫触", e);
            return null;
          }
        }

        /**
         * 閫氱敤鍒犻櫎鏂规硶
         */
        static async delete(key) {
          if ("caches" in window) {
            const cache = await caches.open(this.CACHE_NAME);
            await cache.delete(key);
          }
        }

        // --- 蹇嵎涓氬姟鏂规硶 ---

        static async saveBackground(eventId, file) {
          this.deleteBackground(eventId);
          return this.save(this.getBackgroundKey(eventId), file);
        }

        static async getBackgroundUrl(eventId) {
          return this.getUrl(this.getBackgroundKey(eventId));
        }

        static async deleteBackground(eventId) {
          return this.delete(this.getBackgroundKey(eventId));
        }

        static async saveEventCover(eventId, file) {
          this.deleteEventCover(eventId);
          return this.save(this.getCoverKey(eventId), file);
        }

        static async getEventCoverUrl(eventId) {
          return this.getUrl(this.getCoverKey(eventId));
        }

        static async deleteEventCover(eventId) {
          return this.delete(this.getCoverKey(eventId));
        }
      }

      const app = new GiftBookApp();
      app
        .init()
        .then(() => {
          console.log("绀肩翱绯荤粺涓撲笟鐗堝姞杞芥垚鍔燂紒");
          console.log("绯荤粺鏋舵瀯: 绫诲寲銆佹ā鍧楀寲銆佺幇浠ｅ寲");
          console.log("鏁版嵁鍔犲瘑: AES-256");
          console.log("鏁版嵁瀛樺偍: IndexedDB");
        })
        .catch((error) => {
          console.error("? 绯荤粺鍚姩澶辫触:", error);
        });

      // 璇煶鍒楄〃鏇存柊
      if ("speechSynthesis" in window && window.speechSynthesis && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          app.populateVoiceList();
          const editVoiceSelect = document.getElementById("edit-event-voice");
          if (editVoiceSelect) {
            app.populateVoiceList(editVoiceSelect, editVoiceSelect.value);
          }
        };
      }
    
  return app;
}

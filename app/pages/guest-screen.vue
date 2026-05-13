<template>
  <div id="layout-root" class="flex flex-row w-screen h-screen">
    <div id="qr-code-area">
      <div class="flex flex-1 flex-col min-h-0">
        <div
          id="alipay-qr-container"
          class="qr-container"
          style="display: none"
        >
          <p class="vertical-text">支付宝</p>
          <img id="qr-alipay-img" src="" alt="Alipay" />
        </div>
        <div
          id="wechat-qr-container"
          class="qr-container"
          style="display: none"
        >
          <p class="vertical-text">微信</p>
          <img id="qr-wechat-img" src="" alt="WeChat Pay" />
        </div>
      </div>
      <div id="custom-text-display" class="custom-text-area"></div>
    </div>

    <div id="app-container" class="hidden flex-1 h-full">
      <div class="gift-book-frame">
        <div class="text-center mb-6">
          <h1
            id="event-title"
            class="text-4xl font-bold"
            style="color: var(--primary-color); letter-spacing: 8px"
          >
            礼簿
          </h1>
        </div>
        <div id="gift-book-content" class="gift-book-content"></div>
      </div>

      <div id="top-right-controls">
        <button id="settings-btn" title="设置">
          <i id="settings-icon" class="ri-settings-3-line text-2xl"></i>
        </button>
        <button id="fullscreen-btn" title="全屏/退出全屏">
          <i id="fullscreen-icon" class="ri-fullscreen-line text-2xl"></i>
        </button>
      </div>
    </div>
  </div>

  <div id="fullscreen-hint">按 F11 进入全屏以获得最佳效果</div>

  <div
    id="modal-container"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50"
  >
    <div id="modal" class="bg-white p-6 rounded-lg shadow-xl">
      <h3 id="modal-title" class="text-xl font-bold mb-4 text-center"></h3>
      <div id="modal-content"></div>
      <div id="modal-actions" class="mt-6 flex justify-end space-x-3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
onMounted(async () => {
  await nextTick();
  // 设置副屏 body class
  document.body.className = "theme-festive";
  document.body.style.cssText =
    'font-family: "KaiTi","楷体",serif; margin:0; padding:0; overflow:hidden; width:100vw; height:100vh;';
  const { bootGuestScreen } = await import("~/utils/guestScreenApp.js");
  bootGuestScreen();
});
</script>

<style scoped>
/* ==================== 主题变量 ==================== */
:root,
:deep(.theme-festive) {
  --primary-color: #c00;
  --primary-border-color: #ffaaaa;
  --primary-bg-light: #fff2f2;
  --button-bg-color: #dc2626;
  --button-bg-hover: #b91c1c;
  --button-border-color: #dc2626;
  --button-text-color: #dc2626;
  --link-hover-bg: #fee2e2;
  --primary-ring-color: #ef4444;
}

/* ==================== 动态布局 ==================== */
#layout-root {
  display: flex;
  width: 100vw;
  height: 100vh;
}

#qr-code-area {
  width: 28%;
  flex-shrink: 0;
  background-color: #ffffff;
  border-right: 2px solid var(--primary-border-color);
  box-sizing: border-box;
  display: none;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1.5rem;
}

#layout-root.layout-right #qr-code-area {
  border-right: none;
  border-left: 2px solid var(--primary-border-color);
}

#app-container {
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
}

/* ==================== 收款码区域样式 ==================== */
.qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  width: 100%;
  min-height: 0;
  margin-bottom: 1.5rem;
  flex: 1;
}

.vertical-text {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  font-size: clamp(1.5rem, 2vw, 2rem);
  font-weight: bold;
  color: var(--primary-color);
  letter-spacing: 6px;
  flex-shrink: 0;
}

.qr-container img {
  max-width: 80%;
  max-height: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
  border: 4px solid var(--primary-border-color);
}

.custom-text-area {
  width: 100%;
  overflow: hidden;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
  border-top: 2px dashed var(--primary-border-color);
  font-family: "Microsoft YaHei", sans-serif;
  writing-mode: horizontal-tb;
  line-height: 1.6;
  font-size: 1rem;
}

/* ==================== 礼簿框架 ==================== */
.gift-book-frame {
  border: 6px solid var(--primary-color);
  padding: clamp(15px, 2vw, 30px);
  border-radius: 10px;
  background-color: var(--primary-bg-light);
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  box-sizing: border-box;
}
.gift-book-header {
  flex-shrink: 0;
  margin-bottom: clamp(10px, 1.5vh, 30px);
}
.gift-book-content {
  display: grid;
  grid-template-rows: 3fr 1fr 3fr;
  border-top: 3px solid var(--primary-border-color);
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.gift-book-row {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  width: 100%;
}
.book-cell {
  border-right: 3px solid var(--primary-border-color);
  border-bottom: 3px solid var(--primary-border-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-lr;
  text-orientation: mixed;
  font-weight: bold;
  font-size: clamp(14px, 1.8vw, 32px);
  letter-spacing: clamp(4px, 0.8vw, 10px);
  padding: clamp(5px, 1vh, 15px) 0;
  overflow: hidden;
  text-align: center;
  position: relative;
  min-height: 0;
}
.book-cell:first-child {
  border-left: 3px solid var(--primary-border-color);
}
.name-cell .name {
  color: #333;
  padding: clamp(8px, 1.5vh, 20px) 0;
  text-align: center;
  white-space: nowrap;
  min-height: auto;
  overflow: hidden;
  text-overflow: ellipsis;
}
.latest-entry {
  animation: highlight-pulse 2s ease-in-out;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(255, 215, 0, 0.2),
    transparent
  );
}
@keyframes highlight-pulse {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(255, 215, 0, 0.3);
  }
}
.type-cell {
  color: var(--primary-color);
  font-size: clamp(16px, 2vw, 28px);
  padding: clamp(8px, 1.5vh, 15px) 5px;
  font-family: "Source Han Serif CN Heavy", serif;
  font-weight: bold;
}
.amount-cell {
  color: #333;
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: clamp(5px, 1vw, 10px);
  justify-content: center;
  gap: clamp(5px, 1vh, 10px);
  padding: clamp(5px, 1vh, 10px) 0;
}
.amount-chinese {
  letter-spacing: clamp(1px, 0.3vw, 2px);
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.amount-numeric {
  color: #555;
  letter-spacing: 1px;
  writing-mode: lr;
  font-size: clamp(10px, 1.3vw, 18px);
  white-space: nowrap;
}
.amount-chinese.scale,
.name.scale {
  font-size: clamp(12px, 1.5vw, 18px);
  letter-spacing: -1px;
  padding: clamp(3px, 0.5vh, 8px) 0;
}
.amount-numeric.scale {
  letter-spacing: 0.5px;
  font-size: clamp(9px, 1.2vw, 14px);
}

/* ==================== 顶部控件 ==================== */
#top-right-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 15px;
}
#fullscreen-btn,
#settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
#fullscreen-icon,
#settings-icon {
  color: var(--primary-color);
}
#fullscreen-btn:hover,
#settings-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* ==================== 全屏提示 ==================== */
#fullscreen-hint {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 30px;
  border-radius: 30px;
  font-size: 16px;
  z-index: 1000;
  animation: fade-in-out 5s forwards;
}
@keyframes fade-in-out {
  0%,
  100% {
    opacity: 0;
  }
  10%,
  90% {
    opacity: 1;
  }
}

/* ==================== 弹窗样式 ==================== */
#modal-container {
  font-family: "Inter", "Microsoft YaHei", sans-serif;
}
#modal {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  max-width: 700px;
  width: 90vw;
}
#modal-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
}
.themed-button-primary {
  background-color: var(--button-bg-color);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
}
.themed-button-primary:hover {
  background-color: var(--button-bg-hover);
}
.themed-button-secondary {
  border: 1px solid var(--button-border-color);
  color: var(--button-text-color);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: bold;
}
.themed-button-secondary:hover {
  background-color: var(--link-hover-bg);
}
.themed-ring:focus {
  --tw-ring-color: var(--primary-ring-color) !important;
  box-shadow: 0 0 0 2px var(--tw-ring-color);
  outline: none;
}
.themed-text-radio {
  color: var(--button-text-color);
}

/* ==================== Pell.js 样式适配 ==================== */
.pell-content {
  height: 120px;
  outline: 0;
  overflow-y: auto;
  padding: 10px;
  font-family: "Microsoft YaHei", sans-serif;
  font-size: 14px;
  line-height: 1.5;
  background: #fff;
}
.pell-content:focus {
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-ring-color);
}
.pell-actionbar {
  background-color: #f9f9f9;
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.pell-button {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  height: 30px;
  min-width: 30px;
  margin: 0 2px;
  padding: 4px 6px;
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pell-button-selected {
  background-color: #ddd;
  border-color: #bbb;
}
.pell-button:hover {
  background-color: #eee;
}
.pell-button [class*="ri-"] {
  font-size: 18px;
  line-height: 1;
  vertical-align: middle;
}
.custom-pell-select {
  font-size: 14px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 3px;
  height: 30px;
  margin: 0 2px;
  padding: 4px 6px;
  cursor: pointer;
}
.custom-pell-color {
  padding: 0 2px;
  width: 40px;
  height: 30px;
  margin: 0 2px;
  border: 1px solid #ccc;
  border-radius: 3px;
  cursor: pointer;
  background: #fff;
}
</style>

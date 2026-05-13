<template>
  <div
    class="bg-gray-100 flex items-center justify-center min-h-screen theme-festive"
    id="page-root"
  >
    <div id="app-container" class="w-full max-w-7xl mx-auto p-4">
      <!-- 设置界面 -->
      <div
        id="setup-screen"
        class="bg-white p-8 rounded-lg shadow-xl max-w-2xl mx-auto hidden"
      >
        <h1 class="text-3xl font-bold text-center themed-header mb-6">
          电子礼簿系统
        </h1>
        <div id="select-event-section" class="mb-8 hidden">
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">选择事项</h2>
          <div class="flex items-center space-x-4">
            <select
              id="event-selector"
              class="flex-1 p-3 border rounded-lg focus:ring-2 themed-ring"
            >
              <option value="">请选择一个事项</option>
            </select>
            <button
              id="unlock-event-btn"
              class="themed-button-primary px-6 py-3 rounded-lg transition duration-300"
            >
              进入
            </button>
          </div>
        </div>
        <div>
          <h2 class="text-xl font-semibold mb-4 border-b pb-2">
            <span id="or-text">或 </span>创建新事项
          </h2>
          <form id="create-event-form" class="space-y-4">
            <input
              type="text"
              id="event-name"
              placeholder="事项名称 (例如: 张三李四新婚之喜)"
              required
              class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
            />
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >开始时间</label
                >
                <div class="flex gap-2">
                  <input
                    type="date"
                    id="start-date"
                    required
                    class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                  />
                  <input
                    type="time"
                    id="start-time"
                    required
                    class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700"
                  >结束时间</label
                >
                <div class="flex gap-2">
                  <input
                    type="date"
                    id="end-date"
                    required
                    class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                  />
                  <input
                    type="time"
                    id="end-time"
                    required
                    class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                  />
                </div>
              </div>
            </div>
            <input
              type="text"
              id="admin-password"
              placeholder="设置管理密码 (请牢记)"
              required
              class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
            />
            <details class="group">
              <summary
                class="cursor-pointer text-sm font-medium text-gray-600 group-hover:text-gray-900 list-none"
              >
                <div class="flex items-center">
                  <span>更多设置</span>
                  <i
                    class="ri-arrow-down-s-line text-lg ml-1 transition-transform transform group-open:rotate-180"
                  ></i>
                </div>
              </summary>
              <div class="mt-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label
                    for="event-theme"
                    class="block text-sm font-medium text-gray-700"
                    >界面风格</label
                  >
                  <select
                    id="event-theme"
                    class="mt-1 w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                  >
                    <option value="theme-festive" selected>
                      喜庆红 (喜事)
                    </option>
                    <option value="theme-solemn">肃穆灰 (白事)</option>
                  </select>
                  <p class="text-xs text-gray-500 mt-2">
                    为不同性质的事项选择合适的界面配色风格。
                  </p>
                </div>
                <div class="mt-4">
                  <label
                    for="event-voice"
                    class="block text-sm font-medium text-gray-700"
                    >语音播报音色</label
                  >
                  <div class="flex items-center gap-2 mt-1">
                    <select
                      id="event-voice"
                      class="text-sm flex-grow w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                    >
                      <option value="">默认音色</option>
                    </select>
                    <button
                      type="button"
                      id="preview-create-voice-btn"
                      class="themed-button-secondary border p-3 rounded-lg whitespace-nowrap text-xl"
                    >
                      <i class="ri-volume-up-line"></i> 预览
                    </button>
                  </div>
                  <p class="text-xs text-gray-500 mt-2">
                    选择一个喜欢的播报声音。
                  </p>
                </div>
                <div class="mt-4">
                  <label class="block text-sm font-medium text-gray-700"
                    >记账人</label
                  >
                  <input
                    type="text"
                    id="event-recorder"
                    placeholder="记账人 (例如: 王五，选填)"
                    class="w-full mt-1 p-3 border rounded-lg focus:ring-2 themed-ring"
                  />
                </div>
              </div>
            </details>
            <button
              type="submit"
              class="w-full themed-button-primary p-3 rounded-lg transition duration-300 font-bold"
            >
              创建并进入
            </button>
          </form>
        </div>
      </div>

      <!-- 主界面 -->
      <div id="main-screen" class="hidden">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <div class="relative">
              <div
                id="event-switcher-trigger"
                class="flex items-center gap-2 cursor-pointer group"
              >
                <h1
                  id="current-event-title"
                  class="text-2xl font-bold themed-dropdown-text max-sm:text-2xl"
                ></h1>
                <i
                  class="ri-arrow-down-s-line text-2xl themed-dropdown-text"
                ></i>
              </div>
              <div
                id="event-dropdown"
                class="absolute top-full left-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 hidden"
              ></div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- 左侧录入区 -->
          <div class="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-bold mb-4 text-center border-b pb-2">
              礼金录入
            </h2>
            <form id="add-gift-form" class="space-y-4">
              <input
                type="text"
                id="guest-name"
                placeholder="姓名"
                required
                class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
              />
              <input
                type="number"
                id="gift-amount"
                placeholder="金额 (元)"
                required
                min="0"
                max="999999999999"
                step="0.01"
                class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
              />
              <div class="flex flex-wrap items-center gap-x-2 gap-y-2">
                <label
                  class="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >收款类型：</label
                >
                <div class="flex flex-wrap gap-x-3 gap-y-2">
                  <label class="flex items-center space-x-2 cursor-pointer"
                    ><input
                      type="radio"
                      name="payment-type"
                      value="现金"
                      class="themed-text-radio themed-ring"
                      checked
                    /><span>现金</span></label
                  >
                  <label class="flex items-center space-x-2 cursor-pointer"
                    ><input
                      type="radio"
                      name="payment-type"
                      value="微信"
                      class="themed-text-radio themed-ring"
                    /><span>微信</span></label
                  >
                  <label class="flex items-center space-x-2 cursor-pointer"
                    ><input
                      type="radio"
                      name="payment-type"
                      value="支付宝"
                      class="themed-text-radio themed-ring"
                    /><span>支付宝</span></label
                  >
                  <label class="flex items-center space-x-2 cursor-pointer"
                    ><input
                      type="radio"
                      name="payment-type"
                      value="其他"
                      class="themed-text-radio themed-ring"
                    /><span>其他</span></label
                  >
                </div>
              </div>
              <textarea
                id="guest-remark-custom"
                class="w-full p-3 border rounded-lg focus:ring-2 themed-ring"
                rows="2"
                placeholder="备注内容（选填）"
                data-remark-type="custom"
              ></textarea>
              <div class="flex flex-wrap items-center gap-x-1 gap-y-2">
                <label
                  class="text-sm font-medium text-gray-700 whitespace-nowrap"
                  >更多备注：</label
                >
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="remark-preset-btn px-3 py-1.5 text-xs border rounded-lg themed-ring"
                    data-preset="gift"
                  >
                    礼品
                  </button>
                  <button
                    type="button"
                    class="remark-preset-btn px-3 py-1.5 text-xs border rounded-lg themed-ring"
                    data-preset="relation"
                  >
                    关系
                  </button>
                  <button
                    type="button"
                    class="remark-preset-btn px-3 py-1.5 text-xs border rounded-lg themed-ring"
                    data-preset="phone"
                  >
                    电话
                  </button>
                  <button
                    type="button"
                    class="remark-preset-btn px-3 py-1.5 text-xs border rounded-lg themed-ring"
                    data-preset="address"
                  >
                    住址
                  </button>
                </div>
              </div>
              <div id="remark-inputs-container" class="space-y-2"></div>
              <button
                type="submit"
                class="w-full themed-button-primary font-bold p-4 rounded-lg transition duration-300 text-lg"
              >
                确认录入
              </button>
            </form>
            <div class="mt-6 pt-6 border-t">
              <h3 class="text-xl font-semibold mb-3">功能区</h3>
              <div class="space-y-3">
                <div class="relative">
                  <input
                    type="text"
                    id="search-name"
                    placeholder="按姓名查找..."
                    class="w-full p-3 border rounded-lg focus:ring-2 themed-ring pr-10"
                  />
                  <i
                    id="search-icon"
                    class="ri-search-line text-xl absolute right-3 top-3 text-gray-400 cursor-pointer"
                  ></i>
                </div>
                <button
                  id="print-btn"
                  class="w-full themed-button-primary p-3 rounded-lg"
                >
                  打印/另存为PDF
                </button>
                <button
                  id="export-excel-btn"
                  class="w-full border themed-button-secondary p-3 rounded-lg"
                >
                  导出为 Excel
                </button>
                <button
                  id="stats-btn"
                  class="w-full themed-button-primary p-3 rounded-lg"
                >
                  查看统计
                </button>
                <div
                  class="flex items-center justify-between bg-gray-100 p-3 rounded-lg"
                >
                  <span class="font-medium text-gray-700">语音播报</span>
                  <label
                    for="speech-toggle"
                    class="relative inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="speech-toggle"
                      class="sr-only peer"
                      checked
                    />
                    <div
                      class="toggle-bg w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"
                    ></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧展示区 -->
          <div class="lg:col-span-2">
            <div id="book-container-wrapper" class="gift-book-frame">
              <div
                id="book-footer"
                class="flex justify-between items-center mb-4 flex-wrap gap-y-2"
              >
                <div class="flex items-center flex-wrap gap-x-4">
                  <div>
                    <span class="font-bold text-md">本页小计:</span>
                    <span
                      id="page-subtotal"
                      class="text-xl font-bold themed-text"
                      >￥0.00</span
                    >
                  </div>
                  <div>
                    <span class="font-bold text-md">总金额:</span>
                    <span
                      id="total-amount"
                      class="text-xl font-bold themed-text"
                      >￥0.00</span
                    >
                  </div>
                  <div>
                    <span class="font-bold text-md">总人数:</span>
                    <span
                      id="total-givers"
                      class="text-xl font-bold themed-text"
                      >0</span
                    >
                  </div>
                </div>
                <div class="flex items-center space-x-2 text-lg">
                  <button
                    id="prev-page-btn"
                    class="themed-button-primary p-2 disabled:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <i class="ri-arrow-left-s-line"></i>
                  </button>
                  <div id="page-info" class="font-bold flex items-center">
                    第 1 / 1 页
                  </div>
                  <button
                    id="next-page-btn"
                    class="themed-button-primary p-2 disabled:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center"
                  >
                    <i class="ri-arrow-right-s-line"></i>
                  </button>
                </div>
              </div>
              <div id="gift-book-content"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右上角按钮 -->
    <div class="absolute lg:fixed top-5 right-5 flex gap-3 z-40">
      <button
        id="support-btn"
        class="bg-white/80 backdrop-blur rounded-full p-2 shadow-sm hover:shadow-md transition-all group"
        title="联系/支持作者"
      >
        <i
          class="ri-heart-3-line text-2xl text-red-500 group-hover:scale-110 transition-transform block"
        ></i>
      </button>
      <button
        id="fullscreen-btn"
        class="bg-white/80 backdrop-blur rounded-full p-2 shadow-sm hover:shadow-md transition-all"
        title="全屏/退出全屏"
      >
        <i
          id="fullscreen-icon"
          class="ri-fullscreen-line text-2xl themed-text themed-dropdown-text"
        ></i>
      </button>
    </div>

    <!-- 模态框 -->
    <div
      id="modal-container"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50"
    >
      <div id="modal" class="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <button
          id="modal-close-btn"
          type="button"
          aria-label="关闭弹窗"
          class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition focus:outline-none"
        >
          <i class="ri-close-line text-2xl"></i>
        </button>
        <h3 id="modal-title" class="text-xl font-bold mb-4 text-center"></h3>
        <div id="modal-content"></div>
        <div id="modal-actions" class="mt-6 flex justify-end space-x-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
const nuxtApp = useNuxtApp();

onMounted(async () => {
  // 等待 vendors plugin 完成（PDFLib / CryptoJS / XLSX / pell / gridjs 均已挂载到 window）
  await nextTick();

  // 动态导入业务代码（.js 文件，无 TS 类型检查）
  const { bootGiftBookApp } = await import("~/utils/giftbook.js");
  bootGiftBookApp();
});
</script>

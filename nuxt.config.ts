import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },

  experimental: {
    // 启用 Vite Environments API，修复 SPA 模式下 resolveServerEntry 找不到入口的问题
    viteEnvironmentApi: true,
  },

  // SPA 模式：项目依赖 IndexedDB / localStorage / Cache API / postMessage 等纯客户端特性
  ssr: false,

  // Nuxt 4 默认 srcDir 已是 app/
  modules: ['@nuxtjs/tailwindcss'],

  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/main.css',
    'remixicon/fonts/remixicon.css',
    'pell/dist/pell.min.css',
    'gridjs/dist/theme/mermaid.min.css',
  ],

  app: {
    head: {
      title: '电子礼簿系统 - 专业版',
      htmlAttrs: { lang: 'zh-CN' },
      meta: [
        { charset: 'UTF-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
      ],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.js',
  },


})

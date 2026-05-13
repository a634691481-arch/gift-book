/**
 * vendors.client.ts
 * 动态加载第三方库并挂载到 window，保持原 OOP 代码对全局变量的引用方式：
 *   - window.PDFLib / window.fontkit
 *   - window.CryptoJS
 *   - window.XLSX
 *   - window.pell
 *   - window.gridjs
 *   - window.GiftRegistryPDF (稍后由 utils/pdfGenerator 挂载)
 */
export default defineNuxtPlugin(async () => {
  if (typeof window === 'undefined') return

  const w = window as any

  // 并行动态 import（tree-shaking 友好）
  const [cryptoJSMod, pdfLibMod, fontkitMod, xlsxMod, pellMod, gridjsMod] = await Promise.all([
    import('crypto-js'),
    import('pdf-lib'),
    import('@pdf-lib/fontkit'),
    import('xlsx'),
    import('pell'),
    import('gridjs'),
  ])

  w.CryptoJS = (cryptoJSMod as any).default || cryptoJSMod
  w.PDFLib = pdfLibMod
  w.fontkit = (fontkitMod as any).default || fontkitMod
  w.XLSX = xlsxMod
  // pell 暴露 `init` 方法
  w.pell = (pellMod as any).default || pellMod
  // gridjs 主类 Grid
  w.gridjs = gridjsMod

  // 挂载 GiftRegistryPDF（从 utils 导入，保持类引用）
  const { GiftRegistryPDF } = await import('~/utils/pdfGenerator')
  w.GiftRegistryPDF = GiftRegistryPDF
})

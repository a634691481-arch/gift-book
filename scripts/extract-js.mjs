// 从 index.html / guest-screen.html 重新提取业务 JS
// 以 UTF-8 读写，避免 PowerShell 默认 GBK 读取导致的中文乱码
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function extractScript(html, openTag) {
  const start = html.indexOf(openTag);
  if (start < 0) throw new Error(`opening ${openTag} not found`);
  const contentStart = html.indexOf(">", start) + 1;
  const end = html.indexOf("</script>", contentStart);
  if (end < 0) throw new Error("closing </script> not found");
  return html.slice(contentStart, end);
}

// --- index.html: <script type="module"> ---
{
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  let js = extractScript(html, '<script type="module">');
  // 静态资源路径 ./static/ -> /
  js = js.replace(/\.\/static\//g, "/");
  const out = `/* eslint-disable */\n// @ts-nocheck\n// 从 index.html 自动提取，勿手工编辑源码\nexport function bootGiftBookApp() {\n${js}\n  return app\n}\n`;
  mkdirSync(resolve(root, "app/utils"), { recursive: true });
  writeFileSync(resolve(root, "app/utils/giftbook.js"), out, "utf8");
  console.log(
    `[OK] app/utils/giftbook.js (${(out.length / 1024).toFixed(1)} KB)`,
  );
}

// --- guest-screen.html: <script>（非 module） ---
{
  const html = readFileSync(resolve(root, "guest-screen.html"), "utf8");
  // 找最后一个 <script> 块（不带 src 和 type）
  const re = /<script>([\s\S]*?)<\/script>/g;
  let last = null;
  let m;
  while ((m = re.exec(html))) last = m;
  if (!last) throw new Error("no inline <script> in guest-screen.html");
  let js = last[1];
  js = js.replace(/\.\/static\//g, "/");
  const out = `/* eslint-disable */\n// @ts-nocheck\n// 从 guest-screen.html 自动提取，勿手工编辑源码\nexport function bootGuestScreen() {\n${js}\n  return typeof guestScreen !== 'undefined' ? guestScreen : null\n}\n`;
  writeFileSync(resolve(root, "app/utils/guestScreenApp.js"), out, "utf8");
  console.log(
    `[OK] app/utils/guestScreenApp.js (${(out.length / 1024).toFixed(1)} KB)`,
  );
}

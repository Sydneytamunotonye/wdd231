// Temporary headless check: renders the page and reports on the DOM + console errors.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const chrome =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDir = path.join(os.tmpdir(), "wdd231-chrome-" + Date.now());

const child = spawn(chrome, [
  "--headless=new",
  "--remote-debugging-port=9333",
  "--user-data-dir=" + userDir,
  "--no-first-run",
  "--disable-gpu",
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(2500);

const targets = await (await fetch("http://127.0.0.1:9333/json/list")).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const logs = [];

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    logs.push(msg.params.type + ": " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + JSON.stringify(msg.params.exceptionDetails.text) + " " + (msg.params.exceptionDetails.exception?.description ?? ""));
  }
});

await new Promise((r) => ws.addEventListener("open", r));

function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((res) => pending.set(msgId, res));
}

async function evaluate(expression) {
  const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) return "ERR " + JSON.stringify(res.result.exceptionDetails.text);
  return res.result?.result?.value;
}

await send("Runtime.enable");
await send("Page.enable");
await send("Network.enable");

for (const width of [320, 375, 768, 1200]) {
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height: 900,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await send("Page.navigate", { url: "http://localhost:8321/index.html" });
  await sleep(1500);

  const report = await evaluate(`(() => {
    const cards = document.querySelectorAll('.course-card').length;
    const badges = [...document.querySelectorAll('.badge')].map(b => b.textContent);
    const creditText = document.querySelector('#creditsTotal')?.textContent;
    const heroC = document.querySelector('#heroCredits')?.textContent;
    const heroD = document.querySelector('#heroCompleted')?.textContent;
    const year = document.querySelector('#currentyear')?.textContent;
    const mod = document.querySelector('#lastModified')?.textContent;
    const navVisible = getComputedStyle(document.querySelector('.site-nav')).display;
    const toggleVisible = getComputedStyle(document.querySelector('.nav-toggle')).display;
    const docW = document.documentElement.scrollWidth;
    const imgs = [...document.images].map(i => ({ src: i.currentSrc.split('/').pop(), w: i.naturalWidth, h: i.naturalHeight, rw: Math.round(i.getBoundingClientRect().width), rh: Math.round(i.getBoundingClientRect().height) }));
    // find elements wider than viewport
    const offenders = [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).map(el => el.tagName + '.' + el.className).slice(0, 5);
    return JSON.stringify({ cards, badges, creditText, heroC, heroD, year, mod, navVisible, toggleVisible, docW, vw: window.innerWidth, imgs, offenders }, null, 1);
  })()`);
  console.log(`\n=== ${width}px ===\n${report}`);

  if (width === 320) {
    const filters = await evaluate(`(async () => {
      const out = [];
      for (const key of ['wdd','cse','all']) {
        document.querySelector('[data-filter="' + key + '"]').click();
        await new Promise(r => setTimeout(r, 50));
        out.push(key + ' -> cards=' + document.querySelectorAll('.course-card').length + ' | ' + document.querySelector('#creditsTotal').textContent + ' | pressed=' + [...document.querySelectorAll('.filters__btn')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.filter).join(','));
      }
      // nav toggle
      const t = document.querySelector('#navToggle');
      t.click(); await new Promise(r=>setTimeout(r,50));
      out.push('toggle open: expanded=' + t.getAttribute('aria-expanded') + ' navDisplay=' + getComputedStyle(document.querySelector('.site-nav')).display);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(r=>setTimeout(r,50));
      out.push('after Esc: expanded=' + t.getAttribute('aria-expanded'));
      return out.join('\\n');
    })()`);
    console.log("INTERACTIONS:\n" + filters);
  }
}

console.log("\nCONSOLE LOGS:", logs.length ? logs.join("\n") : "(none)");

ws.close();
child.kill();

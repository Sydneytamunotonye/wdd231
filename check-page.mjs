import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9333;
const profile = join(tmpdir(), "wdd231-chrome-" + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = spawn(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  "about:blank",
]);

let targets;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
    targets = await r.json();
    if (targets.length) break;
  } catch { }
  await sleep(500);
}

const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
const logs = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    logs.push(msg.params.type + ": " + msg.params.args.map((a) => a.value ?? a.description).join(" "));
  }
  if (msg.method === "Runtime.exceptionThrown") {
    logs.push("EXCEPTION: " + msg.params.exceptionDetails.text + " " + (msg.params.exceptionDetails.exception?.description ?? ""));
  }
  if (msg.method === "Log.entryAdded") {
    logs.push("LOG[" + msg.params.entry.level + "]: " + msg.params.entry.text);
  }
  if (msg.method === "Network.loadingFailed") {
    logs.push("NET FAIL: " + msg.params.errorText + " " + (msg.params.blockedReason ?? ""));
  }
};

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

const evaluate = async (expression) => {
  const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (res.result?.exceptionDetails) return { error: res.result.exceptionDetails.text };
  return res.result?.result?.value;
};

await send("Runtime.enable");
await send("Log.enable");
await send("Network.enable");
await send("Page.enable");

const url = "http://localhost:8321/index.html";
await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 900, deviceScaleFactor: 1, mobile: true });
await send("Page.navigate", { url });

// Wait for the module to actually finish booting before touching the DOM.
let booted = false;
for (let i = 0; i < 40; i++) {
  const state = await evaluate(`JSON.stringify({
    readyState: document.readyState,
    cards: document.querySelectorAll('.course-card').length,
    year: document.querySelector('#currentyear')?.textContent
  })`);
  if (state) {
    const s = JSON.parse(state);
    if (s.readyState === "complete" && s.cards === 10 && s.year) {
      console.log("booted after " + i * 250 + "ms:", state);
      booted = true;
      break;
    }
  }
  await sleep(250);
}
if (!booted) console.log("WARNING: page did not report a booted state");

console.log("=== SCRIPT STATE ===");
console.log(await evaluate(`JSON.stringify({
  scriptTags: [...document.querySelectorAll('script')].map(s => s.src),
  readyState: document.readyState,
  hasCards: document.querySelectorAll('.course-card').length,
  yearText: document.querySelector('#currentyear').textContent
})`));

console.log("=== IMAGES ===");
console.log(await evaluate(`
  (async () => {
    const srcs = [...document.images].map(img => img.getAttribute("src"));
    const results = await Promise.all(srcs.map(src => new Promise(res => {
      const i = new Image();
      i.onload = () => res(src + " -> OK " + i.naturalWidth + "x" + i.naturalHeight);
      i.onerror = () => res(src + " -> FAILED");
      i.src = src;
    })));
    return results.join("\\n");
  })()
`));

console.log("\n=== ALTERNATE IMAGE CANDIDATES ===");
console.log(await evaluate(`
  (async () => {
    const list = ["images/logo.svg","images/hero-code.svg","images/hero-roadmap.svg","images/github.svg","images/linkedin.svg","images/instagram-social-icon.svg"];
    const results = await Promise.all(list.map(src => new Promise(res => {
      const i = new Image();
      i.onload = () => res(src + " -> OK");
      i.onerror = () => res(src + " -> 404/FAILED");
      i.src = src;
    })));
    return results.join("\\n");
  })()
`));

console.log("\n=== CONTENT ===");
console.log(await evaluate(`
  JSON.stringify({
    title: document.title,
    descLen: document.querySelector('meta[name="description"]').content.length,
    h1: [...document.querySelectorAll('h1')].map(e => e.textContent),
    h2: [...document.querySelectorAll('h2')].map(e => e.textContent),
    cards: document.querySelectorAll('.course-card').length,
    credits: document.querySelector('#creditsTotal').textContent,
    heroCredits: document.querySelector('#heroCredits').textContent,
    heroCompleted: document.querySelector('#heroCompleted').textContent,
    year: document.querySelector('#currentyear').textContent,
    modified: document.querySelector('#lastModified').textContent,
    incompleteImgs: [...document.images].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.src)
  }, null, 2)
`));

console.log("\n=== FOOTER CONTRAST COLORS ===");
console.log(await evaluate(`
  (() => {
    const g = (sel, prop) => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : "n/a"; };
    return JSON.stringify({
      heroStatLabelColor: g('.hero__stat-label','color'),
      heroStatLabelBg: g('.hero__stats li','backgroundColor'),
      statValueColor: g('.hero__stat-value','color'),
      heroText: g('.panel--hero p','color'),
      heroBg: g('.panel--hero','backgroundColor'),
      footerText: g('.site-footer','color'),
      footerBg: g('.site-footer','backgroundColor'),
      modifiedColor: g('.site-footer__modified p','color'),
      socialIconBg: g('.social-icon','backgroundColor'),
      navLink: g('.site-nav a','color'),
      navHoverBgExample: g('.site-header','backgroundColor')
    }, null, 2);
  })()
`));

console.log("\n=== FILTERS @375 ===");
console.log(await evaluate(`
  (async () => {
    const before = document.querySelectorAll('.course-card').length;
    document.querySelector('[data-filter="all"]').click();
    const sync = document.querySelectorAll('.course-card').length;
    await new Promise(r => setTimeout(r, 250));
    const later = document.querySelectorAll('.course-card').length;
    return "before=" + before + " immediateAfterClick=" + sync + " after250ms=" + later +
      " credits=" + document.querySelector('#creditsTotal').textContent;
  })()
`));
for (const f of ["wdd", "cse", "all"]) {
  const out = await evaluate(`
    (async () => {
      document.querySelector('[data-filter="${f}"]').click();
      await new Promise(r => setTimeout(r, 250));
      return document.querySelectorAll('.course-card').length + " cards | " +
             document.querySelector('#creditsTotal').textContent + " | pressed=" +
             [...document.querySelectorAll('.filters__btn')].filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.filter).join(',');
    })()
  `);
  console.log(f + " -> " + out);
}

console.log("\n=== NAV TOGGLE @375 ===");
console.log(await evaluate(`
  (async () => {
    const t = document.querySelector('#navToggle');
    const n = document.querySelector('#primaryNav');
    const out = [];
    const vis = () => getComputedStyle(t).display + "/" + getComputedStyle(n).display + "/" + t.getAttribute('aria-expanded');
    out.push("initial " + vis());
    t.click(); await new Promise(r => setTimeout(r, 120));
    out.push("opened  " + vis());
    document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', bubbles:true}));
    await new Promise(r => setTimeout(r, 120));
    out.push("escape  " + vis());
    return out.join("\\n");
  })()
`));

console.log("\n=== OVERFLOW CHECK ===");
for (const w of [320, 375, 480, 640, 768, 900, 1200]) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
  await sleep(350);
  const out = await evaluate(`(() => ({
    w: ${w},
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
    bodyScroll: document.body.scrollWidth,
    cols: getComputedStyle(document.querySelector('.course-grid')).gridTemplateColumns.split(' ').length,
    navToggle: getComputedStyle(document.querySelector('#navToggle')).display,
    navList: getComputedStyle(document.querySelector('.site-nav ul')).flexDirection
  }))()`);
  console.log(JSON.stringify(out));
}

console.log("\n=== CONSOLE ===");
console.log(logs.length ? logs.join("\n") : "(clean)");

ws.close();
browser.kill();
await sleep(400);
await rm(profile, { recursive: true, force: true }).catch(() => { });

// Isolate which SVG image fails to load in the headless browser.
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";

const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const userDir = path.join(os.tmpdir(), "wdd231-chrome2-" + Date.now());
const child = spawn(chrome, ["--headless=new", "--remote-debugging-port=9334", "--user-data-dir=" + userDir, "--no-first-run", "--disable-gpu", "about:blank"]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    targets = await (await fetch("http://127.0.0.1:9334/json/list")).json();
    if (targets.length) break;
  } catch {
    /* not ready yet */
  }
  await sleep(500);
}
if (!targets) throw new Error("Chrome did not start");
const ws = new WebSocket(targets.find((t) => t.type === "page").webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((res) => pending.set(msgId, res));
};
const evaluate = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value ?? r.result?.exceptionDetails;
};

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:8321/index.html" });
await sleep(2500);

const out = await evaluate(`(async () => {
  const files = ['logo.svg','hero-code.svg','hero-roadmap.svg','github.svg','linkedin.svg','x.svg','instagram.svg'];
  const results = [];
  for (const f of files) {
    const img = new Image();
    const p = new Promise((res) => { img.onload = () => res('ok ' + img.naturalWidth + 'x' + img.naturalHeight); img.onerror = () => res('ERROR'); });
    img.src = '/images/' + f + '?t=' + Date.now();
    results.push(f + ': ' + await p);
  }
  const inline = await fetch('/images/hero-code.svg').then(r => r.text());
  const blobUrl = URL.createObjectURL(new Blob([inline], { type: 'image/svg+xml' }));
  const img2 = new Image();
  const p2 = new Promise((res) => { img2.onload = () => res('blob ok ' + img2.naturalWidth); img2.onerror = () => res('blob ERROR'); });
  img2.src = blobUrl;
  results.push('blob: ' + await p2);
  return results.join('\\n');
})()`);
console.log(out);

ws.close();
child.kill();

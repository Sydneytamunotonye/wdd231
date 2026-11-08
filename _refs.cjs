const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const local = [...new Set(refs.filter((u) => !/^https?:/.test(u)))];
for (const u of local) {
  console.log((fs.existsSync(u) ? "OK      " : "MISSING ") + u);
}

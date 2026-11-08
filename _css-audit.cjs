const fs = require("fs");

for (const file of ["styles/small.css", "styles/larger.css"]) {
  const css = fs.readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@media[^{]*\{/g, "");

  // Top-level rules only (naive but sufficient here: no nested at-rules left).
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const seen = new Map();
  for (const [, sel, body] of rules) {
    const s = sel.trim().replace(/\s+/g, " ");
    const count = seen.get(s) ?? 0;
    seen.set(s, count + 1);
    if (count > 0) console.log(`${file}: DUPLICATE SELECTOR -> ${s}`);
  }

  const decls = [...css.matchAll(/-?[a-z-]+\s*:\s*[^;]+;/g)].map((m) => m[0].trim());
  const declSeen = new Map();
  for (const d of decls) declSeen.set(d, (declSeen.get(d) ?? 0) + 1);
  const repeats = [...declSeen.entries()].filter(([, n]) => n > 1);
  if (repeats.length) console.log(`${file}: repeated declarations ->`, repeats.length);

  console.log(`${file}: ${rules.length} rules, ${decls.length} declarations`);
}

const allCss = ["styles/small.css", "styles/larger.css"]
  .map((f) => fs.readFileSync(f, "utf8"))
  .join("\n");
const colorFns = [...allCss.matchAll(/\b(rgb|rgba|hsl|hsla)\(/g)].map((m) => m[1]);
console.log("color functions used:", colorFns.length ? [...new Set(colorFns)] : "none (hex only)");
console.log("named colors:", [...allCss.matchAll(/^\s*(color|background-color|border-color)\s*:\s*([a-z]+)\s*;/gm)].map((m) => m[2]));

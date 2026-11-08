/* Verify WCAG contrast for every text/background pair the audit flagged. */
const lum = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const pairs = [
  ["hero stat label", "#e7efec", "#14504a"],
  ["hero stat value", "#f2c879", "#14504a"],
  ["hero body text", "#e7efec", "#0f3b36"],
  ["hero body text on mid gradient", "#e7efec", "#14504a"],
  ["hero h2 white", "#ffffff", "#0f3b36"],
  ["footer text", "#e7efec", "#0b2a26"],
  ["footer modified", "#cfe0dc", "#0b2a26"],
  ["nav link default", "#e7efec", "#0f3b36"],
  ["nav link hover gold", "#f2c879", "#14504a"],
  ["nav current gold", "#f2c879", "#0f3b36"],
  ["badge completed", "#0b2a26", "#f2c879"],
  ["badge default", "#0f3b36", "#e3efec"],
  ["filter active", "#ffffff", "#0f3b36"],
  ["filter default", "#0f3b36", "#f3ebdc"],
  ["body ink on sand", "#16211f", "#fbf7ef"],
  ["card title on sand", "#16211f", "#fbf7ef"],
  ["card meta soft", "#3d4b47", "#fbf7ef"],
  ["card meta soft on completed", "#3d4b47", "#f3ebdc"],
  ["skip link", "#0b2a26", "#f2c879"],
  ["link pine on white", "#14504a", "#ffffff"],
];

let fails = 0;
for (const [name, fg, bg] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= 4.5;
  if (!ok) fails++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  ${name}  (${fg} on ${bg})`);
}
console.log(fails === 0 ? "\nAll pairs meet WCAG AA 4.5:1" : `\n${fails} pair(s) below 4.5:1`);

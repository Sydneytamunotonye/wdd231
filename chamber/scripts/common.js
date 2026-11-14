const yearSpan = document.querySelector("#currentyear");
const modifiedP = document.querySelector("#lastModified");

yearSpan.textContent = new Date().getFullYear();
modifiedP.textContent = `Last Modification: ${document.lastModified}`;

// ---------- Hamburger menu ----------
const menuBtn = document.querySelector("#menuBtn");
const siteNav = document.querySelector("#siteNav");

menuBtn.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", isOpen);
});

// ---------- Light / dark theme ----------
const themeBtn = document.querySelector("#themeBtn");
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

function currentTheme() {
  return document.documentElement.dataset.theme || (systemDark.matches ? "dark" : "light");
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  themeBtn.setAttribute("aria-pressed", theme === "dark");
}

const savedTheme = localStorage.getItem("chamber-theme");
if (savedTheme) {
  applyTheme(savedTheme);
} else {
  themeBtn.setAttribute("aria-pressed", currentTheme() === "dark");
}

themeBtn.addEventListener("click", () => {
  const next = currentTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem("chamber-theme", next);
});

import { courses } from "./courses.mjs";

/* ------------------------------------------------------------------ *
 * 1. Footer dates
 * ------------------------------------------------------------------ */

const yearEl = document.querySelector("#currentyear");
const modifiedEl = document.querySelector("#lastModified");

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (modifiedEl) {
  const modified = new Date(document.lastModified);
  const date = modified.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const time = modified.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  modifiedEl.textContent = `Last Modification: ${date} ${time}`;
}

/* ------------------------------------------------------------------ *
 * 2. Responsive navigation
 * ------------------------------------------------------------------ */

const navToggle = document.querySelector("#navToggle");
const primaryNav = document.querySelector("#primaryNav");
const wideScreen = window.matchMedia("(min-width: 40em)");

function setNavOpen(open) {
  if (!navToggle || !primaryNav) return;
  navToggle.setAttribute("aria-expanded", String(open));
  primaryNav.classList.toggle("is-open", open);
}

if (navToggle && primaryNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setNavOpen(!isOpen);
  });

  primaryNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNavOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    ) {
      setNavOpen(false);
      navToggle.focus();
    }
  });

  // The hamburger disappears at the wide breakpoint, so close the panel
  // as soon as the layout switches back to the horizontal nav.
  wideScreen.addEventListener("change", (event) => {
    if (event.matches) setNavOpen(false);
  });
}

/* ------------------------------------------------------------------ *
 * 3. Course list
 * ------------------------------------------------------------------ */

const courseGrid = document.querySelector("#courseGrid");
const creditsEl = document.querySelector("#creditsTotal");
const filterButtons = Array.from(document.querySelectorAll(".filters__btn"));

/**
 * Build one course card element for a course object.
 * @param {object} course
 * @returns {HTMLElement}
 */
function buildCourseCard(course) {
  const card = document.createElement("article");
  card.className = `course-card${course.completed ? " course-card--completed" : ""}`;

  const head = document.createElement("div");
  head.className = "course-card__head";

  const code = document.createElement("h3");
  code.className = "course-card__code";
  code.textContent = `${course.subject} ${course.number}`;

  const badge = document.createElement("span");
  badge.className = course.completed ? "badge badge--completed" : "badge";
  badge.textContent = course.completed ? "Completed" : "In progress";

  head.append(code, badge);

  const title = document.createElement("p");
  title.className = "course-card__title";
  title.textContent = course.title;

  const meta = document.createElement("p");
  meta.className = "course-card__meta";
  meta.textContent = `${course.credits} credit${course.credits === 1 ? "" : "s"}`;

  const desc = document.createElement("p");
  desc.className = "course-card__desc";
  desc.textContent = course.description;

  card.append(head, title, meta, desc);
  return card;
}

/**
 * Keep the courses that match the chosen filter.
 *   "all" -> every course
 *   "wdd" -> subject WDD
 *   "cse" -> subject CSE
 * @param {string} filterKey
 * @returns {object[]}
 */
function filterCourses(filterKey) {
  if (filterKey === "all") {
    return courses;
  }
  return courses.filter((course) => course.subject.toLowerCase() === filterKey);
}

/**
 * Add up the credits of a list of courses.
 * @param {object[]} list
 * @returns {number}
 */
function totalCredits(list) {
  return list.reduce((sum, course) => sum + course.credits, 0);
}

/**
 * Redraw the grid for the given filter and update the credit total.
 * @param {string} filterKey
 */
function renderCourses(filterKey) {
  if (!courseGrid) return;

  const list = filterCourses(filterKey);

  const fragment = document.createDocumentFragment();
  list.forEach((course) => fragment.append(buildCourseCard(course)));
  courseGrid.replaceChildren(fragment);

  if (creditsEl) {
    creditsEl.textContent = `Total credits: ${totalCredits(list)}`;
  }
}

if (courseGrid) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.filter ?? "all";

      filterButtons.forEach((otherButton) => {
        const isCurrent = otherButton === button;
        otherButton.classList.toggle("is-active", isCurrent);
        otherButton.setAttribute("aria-pressed", String(isCurrent));
      });

      renderCourses(key);
    });
  });

  // Every course is shown on first load.
  renderCourses("all");

  const heroCredits = document.querySelector("#heroCredits");
  const heroCompleted = document.querySelector("#heroCompleted");

  if (heroCredits) {
    heroCredits.textContent = totalCredits(courses);
  }
  if (heroCompleted) {
    heroCompleted.textContent = courses.filter((course) => course.completed).length;
  }
}

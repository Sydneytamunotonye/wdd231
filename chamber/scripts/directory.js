const membersURL = "data/members.json";
const membersSection = document.querySelector("#members");
const gridBtn = document.querySelector("#gridBtn");
const listBtn = document.querySelector("#listBtn");

const levelNames = {
  1: "Member",
  2: "Silver Member",
  3: "Gold Member",
};

// Fetch the member data with async/await.
async function getMembers() {
  try {
    const response = await fetch(membersURL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const members = await response.json();
    displayMembers(members);
  } catch (error) {
    membersSection.innerHTML = `<p class="status">Sorry, the member directory could not be loaded right now.</p>`;
    console.error("Could not load members:", error);
  }
}

// Make a <p> with a bold label, e.g. "Phone: ..."
function infoLine(label, content, className = "") {
  const p = document.createElement("p");
  if (className) p.className = className;

  const span = document.createElement("span");
  span.className = "label";
  span.textContent = `${label}: `;

  p.append(span, content);
  return p;
}

function makeLink(href, text) {
  const a = document.createElement("a");
  a.href = href;
  a.textContent = text;
  return a;
}

// Build one member card and add it to the page.
function displayMembers(members) {
  membersSection.innerHTML = "";

  members.forEach((member) => {
    const article = document.createElement("article");
    article.className = "member";

    // Name and tag line
    const head = document.createElement("div");
    head.className = "member-head";

    const name = document.createElement("h2");
    name.textContent = member.name;

    const tagline = document.createElement("p");
    tagline.className = "tagline";
    tagline.textContent = member.tagline;

    head.append(name, tagline);

    // Logo and contact details
    const body = document.createElement("div");
    body.className = "member-body";

    const logo = document.createElement("img");
    logo.src = `images/${member.image}`;
    logo.alt = `${member.name} logo`;
    logo.width = 200;
    logo.height = 200;
    logo.loading = "lazy";

    const info = document.createElement("div");
    info.className = "member-info";

    const phoneHref = `tel:${member.phone.replace(/\s/g, "")}`;
    const websiteText = member.website.replace(/^https?:\/\/(www\.)?/, "");

    const level = document.createElement("p");
    level.className = `level level-${member.membershipLevel}`;
    level.textContent = levelNames[member.membershipLevel] ?? "Member";

    info.append(
      infoLine("Address", member.address, "address"),
      infoLine("Email", makeLink(`mailto:${member.email}`, member.email), "email"),
      infoLine("Phone", makeLink(phoneHref, member.phone), "phone"),
      infoLine("URL", makeLink(member.website, websiteText), "website"),
      level
    );

    body.append(logo, info);
    article.append(head, body);
    membersSection.append(article);
  });
}

// ---------- Grid / List toggle ----------
function setView(view) {
  const isGrid = view === "grid";
  membersSection.classList.toggle("gallery", isGrid);
  membersSection.classList.toggle("listing", !isGrid);
  gridBtn.setAttribute("aria-pressed", isGrid);
  listBtn.setAttribute("aria-pressed", !isGrid);
  localStorage.setItem("chamber-directory-view", view);
}

gridBtn.addEventListener("click", () => setView("grid"));
listBtn.addEventListener("click", () => setView("list"));

setView(localStorage.getItem("chamber-directory-view") === "list" ? "list" : "grid");
getMembers();

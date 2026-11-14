import { getMembers, buildMemberCard } from "./members.mjs";

const membersSection = document.querySelector("#members");
const gridBtn = document.querySelector("#gridBtn");
const listBtn = document.querySelector("#listBtn");

async function showMembers() {
  try {
    const members = await getMembers();
    membersSection.replaceChildren(...members.map((member) => buildMemberCard(member)));
  } catch (error) {
    membersSection.innerHTML = `<p class="status">Sorry, the member directory could not be loaded right now.</p>`;
    console.error("Could not load members:", error);
  }
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
showMembers();

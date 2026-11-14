import { getMembers, buildMemberCard } from "./members.mjs";
import { showWeather } from "./weather.mjs";

const spotlightBox = document.querySelector("#spotlights");
const spotlightCount = 3;

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function showSpotlights() {
  try {
    const members = await getMembers();
    const featured = shuffle(members.filter((member) => member.membershipLevel >= 2)).slice(0, spotlightCount);
    spotlightBox.replaceChildren(
      ...featured.map((member) => buildMemberCard(member, { headingLevel: "h3", includeEmail: false }))
    );
  } catch (error) {
    spotlightBox.innerHTML = `<p class="status">Sorry, member spotlights could not be loaded right now.</p>`;
    console.error("Could not load spotlights:", error);
  }
}

showSpotlights();
showWeather(document.querySelector("#currentWeather"), document.querySelector("#forecast"));

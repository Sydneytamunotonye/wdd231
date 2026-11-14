const membersURL = "data/members.json";

export const levelNames = {
  1: "Member",
  2: "Silver Member",
  3: "Gold Member",
};

export async function getMembers() {
  const response = await fetch(membersURL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function infoLine(label, content, className) {
  const p = document.createElement("p");
  p.className = className;

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

export function buildMemberCard(member, { headingLevel = "h2", includeEmail = true } = {}) {
  const article = document.createElement("article");
  article.className = "member";

  // Name and tag line
  const head = document.createElement("div");
  head.className = "member-head";

  const name = document.createElement(headingLevel);
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

  info.append(infoLine("Address", member.address, "address"));
  if (includeEmail) {
    info.append(infoLine("Email", makeLink(`mailto:${member.email}`, member.email), "email"));
  }
  info.append(
    infoLine("Phone", makeLink(phoneHref, member.phone), "phone"),
    infoLine("URL", makeLink(member.website, websiteText), "website"),
    level
  );

  body.append(logo, info);
  article.append(head, body);
  return article;
}

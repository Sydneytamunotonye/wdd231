const params = new URLSearchParams(window.location.search);
const results = document.querySelector("#results");

const levels = {
  np: "NP Membership",
  bronze: "Bronze Membership",
  silver: "Silver Membership",
  gold: "Gold Membership",
};

function formatTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-NG", { dateStyle: "full", timeStyle: "short" });
}

const fields = [
  ["First Name", params.get("first")],
  ["Last Name", params.get("last")],
  ["Email", params.get("email")],
  ["Mobile Phone", params.get("phone")],
  ["Business Name", params.get("business")],
  ["Membership Level", levels[params.get("membership")] ?? params.get("membership")],
  ["Application Date", params.get("timestamp") && formatTimestamp(params.get("timestamp"))],
];

if (params.get("first")) {
  const list = document.createElement("dl");
  list.className = "summary-list";

  fields.forEach(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const detail = document.createElement("dd");
    detail.textContent = value || "Not provided";
    list.append(term, detail);
  });

  results.replaceChildren(list);
}

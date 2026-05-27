export function formatLastUpdated(d: Date = new Date()): string {
  const day = d.getDate();
  const month = d.toLocaleString("en-GB", { month: "long" });
  const year = d.getFullYear();
  return `Last updated on ${day} ${month} ${year}`;
}

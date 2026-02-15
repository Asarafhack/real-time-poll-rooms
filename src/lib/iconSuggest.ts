export function detectIcon(text: string) {
  const t = text.toLowerCase();

  if (t.includes("yes")) return "✅";
  if (t.includes("no")) return "❌";
  if (t.includes("tvk")) return "🟡";
  if (t.includes("dmk")) return "🔴";
  if (t.includes("bjp")) return "🟠";
  if (t.includes("ai")) return "🤖";
  if (t.includes("coffee")) return "☕";
  if (t.includes("tea")) return "🍵";
  if (t.includes("pizza")) return "🍕";
  if (t.includes("burger")) return "🍔";
  if (t.includes("apple")) return "🍎";

  return "🔘";
}

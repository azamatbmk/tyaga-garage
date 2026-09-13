export function formatTime(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function shortName(fullName: string) {
  const [first, last] = fullName.split(" ");
  return `${first} ${last?.[0] ?? ""}.`;
}

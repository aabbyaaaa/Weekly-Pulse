export function getMonday(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  // Format as YYYY-MM-DD
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, "0");
  const dateNum = String(monday.getDate()).padStart(2, "0");
  return `${year}-${month}-${dateNum}`;
}

export function getDaysLeftInWeek(date: Date = new Date()): number {
  const d = new Date(date);
  const day = d.getDay();
  // If Sunday (0), 0 days left. If Monday (1), 6 days left.
  return day === 0 ? 0 : 7 - day;
}

export function getWeekRangeLabel(mondayStr: string): string {
  const monday = new Date(mondayStr);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatOpts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${monday.toLocaleDateString(undefined, formatOpts)} - ${sunday.toLocaleDateString(undefined, formatOpts)}`;
}

export function getDaysOfWeek(mondayStr: string): string[] {
  const [year, month, day] = mondayStr.split("-").map(Number);
  const monday = new Date(year, month - 1, day);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });
}

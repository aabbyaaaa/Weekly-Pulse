export const COLOR_OPTIONS = [
  { id: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', hex: '#10b981' },
  { id: 'cyan', bg: 'bg-cyan-100', text: 'text-cyan-700', hex: '#06b6d4' },
  { id: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', hex: '#f97316' },
  { id: 'blue', bg: 'bg-blue-100', text: 'text-blue-700', hex: '#3b82f6' },
  { id: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', hex: '#a855f7' },
  { id: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', hex: '#f43f5e' },
  { id: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', hex: '#f59e0b' },
  { id: 'stone', bg: 'bg-stone-200', text: 'text-stone-700', hex: '#78716c' },
];

export const getCategoryColorClasses = (colorId: string) => {
  const color = COLOR_OPTIONS.find(c => c.id === colorId);
  return color ? `${color.bg} ${color.text}` : 'bg-stone-200 text-stone-700';
};

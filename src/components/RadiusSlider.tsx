import { MapPin } from 'lucide-react';

export function RadiusSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <MapPin className="text-brand-primary shrink-0" size={18} />
      <input
        type="range"
        min={3}
        max={30}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-brand-primary h-2 cursor-pointer"
      />
      <span className="text-sm font-semibold text-brand-primary whitespace-nowrap min-w-[3rem] text-right">
        {value} km
      </span>
    </div>
  );
}

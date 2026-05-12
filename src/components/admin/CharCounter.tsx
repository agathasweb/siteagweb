"use client";

interface Props {
  value: string;
  min?: number;
  max: number;
  ideal?: [number, number];
}

export default function CharCounter({ value, min, max, ideal }: Props) {
  const len = value.length;
  const idealRange = ideal ?? [Math.floor(max * 0.7), max];
  const inIdeal = len >= idealRange[0] && len <= idealRange[1];
  const tooShort = min !== undefined && len < min;
  const tooLong = len > max;

  let color = "text-gray-400";
  let label = `${len} / ${max}`;
  if (tooLong) {
    color = "text-red-400";
    label = `${len} / ${max} (excedeu o limite)`;
  } else if (tooShort) {
    color = "text-yellow-400";
    label = `${len} / ${max} (muito curto, recomendado ≥ ${min})`;
  } else if (inIdeal) {
    color = "text-green-400";
    label = `${len} / ${max} (ideal)`;
  } else if (len > 0 && len < idealRange[0]) {
    color = "text-yellow-400";
    label = `${len} / ${max} (pode crescer até ~${idealRange[1]})`;
  }

  return <span className={`text-xs ${color}`}>{label}</span>;
}

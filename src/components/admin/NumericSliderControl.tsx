import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface NumericSliderControlProps {
  id: string;
  label: string;
  helperText?: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  saving?: boolean;
  minLabel?: string;
  maxLabel?: string;
  onLiveChange: (value: number) => void;
  onCommit: (value: number) => void;
}

export const NumericSliderControl: React.FC<NumericSliderControlProps> = ({
  id,
  label,
  helperText,
  unit = '',
  value,
  min,
  max,
  step = 1,
  disabled = false,
  saving = false,
  minLabel,
  maxLabel,
  onLiveChange,
  onCommit
}) => {
  const [textValue, setTextValue] = useState<string>(String(value));
  const isFocusedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const lastCommittedRef = useRef<number>(value);

  useEffect(() => {
    lastCommittedRef.current = value;
    if (!isFocusedRef.current && !isDraggingRef.current) {
      setTextValue(String(value));
    }
  }, [value]);

  const clampValue = (num: number): number => {
    const rounded = step >= 1 ? Math.round(num) : Math.round(num * 10) / 10;
    return Math.max(min, Math.min(max, rounded));
  };

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);

    if (raw.trim() === '' || raw === '-') return;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;

    // Update slider immediately if within allowed range; out-of-range intermediate typing clamps on blur/Enter
    if (parsed >= min && parsed <= max) {
      const clamped = clampValue(parsed);
      onLiveChange(clamped);
    }
  };

  const finalizeTypedValue = () => {
    isFocusedRef.current = false;
    const trimmed = textValue.trim();
    if (trimmed === '') {
      const fallback = clampValue(lastCommittedRef.current);
      setTextValue(String(fallback));
      onLiveChange(fallback);
      onCommit(fallback);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) {
      const fallback = clampValue(lastCommittedRef.current);
      setTextValue(String(fallback));
      onLiveChange(fallback);
      onCommit(fallback);
      return;
    }

    const clamped = clampValue(parsed);
    setTextValue(String(clamped));
    lastCommittedRef.current = clamped;
    onLiveChange(clamped);
    onCommit(clamped);
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isDraggingRef.current = true;
    const next = clampValue(Number(e.target.value));
    setTextValue(String(next));
    onLiveChange(next);
  };

  const handleRangeCommit = () => {
    isDraggingRef.current = false;
    const currentVal = clampValue(Number(textValue) || value);
    lastCommittedRef.current = currentVal;
    onCommit(currentVal);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`space-y-2.5 transition-opacity ${disabled ? 'opacity-45 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <label
            htmlFor={`${id}-number`}
            className="text-xs font-semibold font-sans text-stone-800 flex items-center gap-1.5"
          >
            <span>{label}</span>
            {saving && <Loader2 className="w-3 h-3 animate-spin text-stone-400" />}
          </label>
          {helperText && (
            <p className="text-[11px] font-sans text-stone-500 mt-0.5 leading-snug">
              {helperText}
            </p>
          )}
        </div>

        {/* Editable / Clearable Synchronized Number Input */}
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            id={`${id}-number`}
            type="number"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            value={textValue}
            onFocus={(e) => {
              isFocusedRef.current = true;
              e.currentTarget.select();
            }}
            onChange={handleNumberInputChange}
            onBlur={finalizeTypedValue}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            aria-label={label}
            className="w-20 px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-xs font-mono font-semibold text-stone-900 text-right tabular-nums focus:outline-none focus:border-[#ff4d4f] focus:ring-1 focus:ring-[#ff4d4f]/30 disabled:bg-stone-100"
          />
          {unit && (
            <span className="text-[11px] font-mono text-stone-500 min-w-[20px]">
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Synchronized Horizontal Range Slider Directly Underneath */}
      <input
        id={`${id}-slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        value={clampValue(Number.isFinite(Number(textValue)) && textValue.trim() !== '' ? Number(textValue) : value)}
        onChange={handleRangeChange}
        onMouseUp={handleRangeCommit}
        onTouchEnd={handleRangeCommit}
        onBlur={handleRangeCommit}
        onKeyUp={handleRangeCommit}
        aria-label={`${label} slider`}
        className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-[#ff4d4f] disabled:cursor-not-allowed"
      />

      <div className="flex items-center justify-between text-[10px] font-sans text-stone-400">
        <span>{minLabel || `${min}${unit}`}</span>
        <span>{maxLabel || `${max}${unit}`}</span>
      </div>
    </div>
  );
};

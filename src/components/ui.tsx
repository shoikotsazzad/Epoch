"use client";

// Small design-system primitives: panel, icon button, pill slider row, toggle, segmented control.

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { reduceMotion as rm, uiStore, useStore } from "@/state/store";

export const EASE = [0.45, 0, 0.55, 1] as const;

export function useCalmMotion() {
  const os = useReducedMotion();
  const toggle = useStore(uiStore, rm);
  return !!os || toggle;
}

const PHONE_QUERY = "(max-width: 639px)";
/** True on phone-width screens (matches Tailwind's `sm` breakpoint). */
export function useIsPhone() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(PHONE_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}

export function FadePanel({
  show,
  children,
  className = "",
  from = "right",
  mobileFrom,
  label,
  role = "dialog",
  id,
}: {
  show: boolean;
  children: ReactNode;
  className?: string;
  from?: "right" | "bottom" | "center" | "top";
  /** Slide direction on phones (sheets attached to the top or bottom edge). */
  mobileFrom?: "bottom" | "top";
  label: string;
  role?: string;
  id?: string;
}) {
  const reduced = useCalmMotion();
  const phone = useIsPhone();
  const dir = phone && mobileFrom ? mobileFrom : from;
  const offset = reduced ? {} : dir === "right" ? { x: 24 } : dir === "bottom" ? { y: 32 } : dir === "top" ? { y: -12 } : { scale: 0.98 };
  return (
    <AnimatePresence>
      {show && (
        <motion.section
          id={id}
          role={role}
          aria-label={label}
          initial={{ opacity: 0, ...offset }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, ...offset }}
          transition={{ duration: 0.6, ease: EASE }}
          className={`panel ${className}`}
        >
          {children}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

export function IconButton({
  label,
  onClick,
  children,
  pressed,
  className = "",
  shortcut,
  disabled,
  expanded,
  controls,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  pressed?: boolean;
  className?: string;
  shortcut?: string;
  disabled?: boolean;
  expanded?: boolean;
  controls?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-keyshortcuts={shortcut}
      disabled={disabled}
      onClick={onClick}
      className={`icon-btn ${className}`}
    >
      {children}
    </button>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  hint?: string;
}) {
  const id = useId();
  const pct = ((value - min) / (max - min || 1)) * 100;
  const shown = format ? format(value) : String(value);
  return (
    <div className="slider-row" title={hint}>
      <label htmlFor={id} className="slider-label">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={`${shown}${hint ? `. ${hint}` : ""}`}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ["--pct" as string]: `${pct}%` }}
        className="slider-input"
      />
      <output htmlFor={id} className="slider-value">
        {shown}
      </output>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="toggle-row" title={hint}>
      <span>{label}</span>
      <span className="toggle-track" data-on={checked}>
        <span className="toggle-thumb" />
      </span>
      <span className="sr-only">{checked ? "on" : "off"}</span>
    </button>
  );
}

export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="segmented">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className="segmented-item"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function PanelHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose?: () => void }) {
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl leading-tight text-paper-100">{title}</h2>
        {subtitle && <p className="mt-1 text-caption text-paper-500">{subtitle}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close" className="icon-btn -mr-2 -mt-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </header>
  );
}

/**
 * A slider that updates instantly on screen but commits to the store at most every
 * `throttleMs` (structural changes regrow a plant, so we don't do it 60x a second).
 */
export function LiveSlider(props: Omit<Parameters<typeof Slider>[0], "onChange"> & { onCommit: (v: number) => void; throttleMs?: number }) {
  const { onCommit, throttleMs = 150, value, ...rest } = props;
  const [local, setLocal] = useState(value);
  const [prev, setPrev] = useState(value);
  const [pending, setPending] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(value);
  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  });
  // follow outside changes (preset, share link) unless the user is mid-drag
  if (value !== prev) {
    setPrev(value);
    if (!pending) setLocal(value);
  }
  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      commitRef.current(latest.current);
    }
  }, []);
  return (
    <Slider
      {...rest}
      value={local}
      onChange={(v) => {
        setLocal(v);
        setPending(true);
        latest.current = v;
        if (timer.current) return;
        timer.current = setTimeout(() => {
          timer.current = null;
          setPending(false);
          commitRef.current(latest.current);
        }, throttleMs);
      }}
    />
  );
}

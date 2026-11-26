// The Stack Garden mark, drawn inline by the same recursive branch() that
// generates the logo files (src/brand/logo.ts). No image request, crisp at any DPR.

import { DARK_THEME, SMALL_MARK_OPTIONS, TINY_MARK_OPTIONS, markInner } from "@/brand/logo";

const tiny = markInner({ ...TINY_MARK_OPTIONS, theme: DARK_THEME }).svgInner;
const small = markInner({ ...SMALL_MARK_OPTIONS, theme: DARK_THEME }).svgInner;

export default function BrandMark({ size, className = "" }: { size: number; className?: string }) {
  const useTiny = size <= 40;
  const box = useTiny ? TINY_MARK_OPTIONS.size : SMALL_MARK_OPTIONS.size;
  return (
    <svg
      viewBox={`0 0 ${box} ${box}`}
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      // our own generated, static markup (no user input)
      dangerouslySetInnerHTML={{ __html: useTiny ? tiny : small }}
    />
  );
}

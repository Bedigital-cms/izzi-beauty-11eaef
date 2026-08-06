/** Minimal inline-SVG icon set (no external icon lib — keeps the template self-contained
 *  and React-19 safe). Add a path here and reference it by `name` from content JSON. */
import type { CSSProperties } from 'react'

const paths: Record<string, string> = {
  // treatment / beauty
  sparkle: 'M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z',
  brow: 'M3 13c3-4 15-4 18 0M6 12c2-1.5 10-1.5 12 0',
  lips: 'M12 14c-3 0-6-2-9-4 2 0 3-1 4-2 1.5 1 3.5 1 5 0 1.5 1 3.5 1 5 0 1 1 2 2 4 2-3 2-6 4-9 4z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z',
  drop: 'M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z',
  laser: 'M12 2v6m0 8v6m10-10h-6M8 12H2m14.5-6.5l-4 4m-1 1l-4 4m9 0l-4-4m-1-1l-4-4',
  // trust / value
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  award: 'M12 3a5 5 0 100 10 5 5 0 000-10zm-3 9l-2 8 5-3 5 3-2-8',
  hands: 'M6 12V7a2 2 0 014 0v4m0-3a2 2 0 014 0v3m0-2a2 2 0 014 0v5a6 6 0 01-6 6H9a5 5 0 01-5-5v-2',
  star: 'M12 2l2.9 6.3L22 9.3l-5 4.7 1.2 6.9L12 17.6 5.8 20.9 7 14 2 9.3l7.1-1z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4v5l4 2',
  users: 'M9 11a4 4 0 100-8 4 4 0 000 8zm7 0a3 3 0 100-6M2 21a7 7 0 0114 0m2 0a5 5 0 00-4-5',
  // ui / contact
  pin: 'M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11zm0-8a3 3 0 100-6 3 3 0 000 6z',
  phone: 'M4 4h4l2 5-3 2a12 12 0 006 6l2-3 5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 011-2z',
  mail: 'M3 6h18v12H3zM3 6l9 7 9-7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M4 12l5 5L20 6',
  // socials
  instagram: 'M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 5a5 5 0 100 10 5 5 0 000-10zm5.5-.5a1 1 0 100 2 1 1 0 000-2z',
  facebook: 'M14 9h3V5h-3c-2.2 0-4 1.8-4 4v2H7v4h3v6h4v-6h3l1-4h-4V9a1 1 0 011-1z',
  youtube: 'M22 12s0-3.5-.5-5c-.3-1-1-1.7-2-2C17.8 4.5 12 4.5 12 4.5s-5.8 0-7.5.5c-1 .3-1.7 1-2 2C2 8.5 2 12 2 12s0 3.5.5 5c.3 1 1 1.7 2 2 1.7.5 7.5.5 7.5.5s5.8 0 7.5-.5c1-.3 1.7-1 2-2 .5-1.5.5-5 .5-5zM10 15V9l5 3z',
}

export function Icon({ name, size = 24, style }: { name: string; size?: number; style?: CSSProperties }) {
  const d = paths[name] || paths.sparkle
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

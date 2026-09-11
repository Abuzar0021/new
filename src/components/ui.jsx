import { forwardRef } from 'react';

/** Heavy glassmorphism panel: translucent, deep blur, 1px fine white border. */
export const Glass = forwardRef(function Glass({ as: Tag = 'div', className = '', children, ...rest }, ref) {
  return (
    <Tag
      ref={ref}
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-150 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12)] ${className}`}
      {...rest}
    >
      {/* subtle top sheen */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      {children}
    </Tag>
  );
});

export function GlassButton({ href = '#', children, className = '', primary = false, ...rest }) {
  return (
    <a
      href={href}
      data-magnetic
      className={`group relative inline-flex items-center gap-3 overflow-hidden rounded-full border px-7 py-3.5 text-sm font-medium tracking-tight backdrop-blur-xl transition-colors duration-500 ${
        primary ? 'border-white/30 bg-white/15 text-white hover:bg-white hover:text-black' : 'border-white/20 bg-white/[0.06] text-white hover:bg-white/15'
      } ${className}`}
      {...rest}
    >
      <span className="relative block overflow-hidden">
        <span className="block transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-[110%]">{children}</span>
        <span aria-hidden className="absolute inset-0 block translate-y-[110%] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-y-0">{children}</span>
      </span>
      <span aria-hidden className="inline-block h-1.5 w-1.5 rounded-full bg-berry shadow-[0_0_12px_2px_rgba(224,38,61,0.7)]" />
    </a>
  );
}

export function Eyebrow({ children, className = '' }) {
  return <span className={`font-mono text-[10px] uppercase tracking-[0.28em] text-white/60 ${className}`}>{children}</span>;
}

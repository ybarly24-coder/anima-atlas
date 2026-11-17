'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { seedCategories } from '@seed/categories';
import { CATEGORY_ACCENT, EVIDENCE_LABEL, LENS_LABEL, VERIFICATION_LABEL } from '@/lib/labels';
import type { CategoryId, EvidenceType, Lens, Tag, VerificationStatus } from '@/lib/types';
import { cx } from '@/lib/util';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantCls: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink-2 border border-ink',
  secondary: 'bg-card text-ink border border-line-2 hover:bg-paper-2',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-paper-2',
  danger: 'bg-card text-danger border border-[#e3c2bc] hover:bg-[#f8ebe8]',
};

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variantCls[variant],
        className,
      )}
    />
  );
}

export function LinkButton({ href, variant = 'secondary', size = 'md', className, children }: { href: string; variant?: Variant; size?: 'sm' | 'md'; className?: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
        variantCls[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Field({ label, hint, error, children, htmlFor, required }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode; htmlFor?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs leading-relaxed text-muted">{hint}</p>}
      {error && (
        <p className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const inputCls = 'w-full rounded-md border border-line-2 bg-card px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, 'h-9', props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cx(inputCls, 'min-h-[4.5rem] leading-relaxed', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'h-9 py-0', props.className)} />;
}

export function categoryOf(id: CategoryId) {
  return seedCategories.find((c) => c.id === id)!;
}

export function CategoryChip({ id, size = 'sm' }: { id: CategoryId; size?: 'xs' | 'sm' }) {
  const c = categoryOf(id);
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide', CATEGORY_ACCENT[id].chip, size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-[11px]')}>
      <span className={cx('h-1.5 w-1.5 rounded-full', CATEGORY_ACCENT[id].dot)} aria-hidden />
      {c.label}
    </span>
  );
}

export function LensChip({ lens }: { lens: Lens }) {
  return (
    <span className="inline-flex items-center rounded border border-line-2 bg-paper px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink-2" title={LENS_LABEL[lens].ko}>
      {LENS_LABEL[lens].en.toUpperCase()}
    </span>
  );
}

export function TagChip({ tag, onRemove, active, onClick }: { tag: Tag; onRemove?: () => void; active?: boolean; onClick?: () => void }) {
  const body = (
    <>
      <span>{tag.nameKo}</span>
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={`${tag.nameKo} 태그 제거`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onRemove();
            }
          }}
          className="ml-0.5 cursor-pointer text-muted hover:text-ink"
        >
          ×
        </span>
      )}
    </>
  );
  const cls = cx(
    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs',
    active ? 'border-ink bg-ink text-paper' : 'border-line-2 bg-card text-ink-2',
    tag.isCustom && !active && 'border-dashed',
  );
  if (onClick)
    return (
      <button type="button" onClick={onClick} className={cx(cls, 'hover:border-ink')} aria-pressed={active} title={tag.definition}>
        {body}
      </button>
    );
  return (
    <span className={cls} title={tag.definition}>
      {body}
    </span>
  );
}

const verificationCls: Record<VerificationStatus, string> = {
  verified: 'border-[#bcd5cb] bg-fact-bg text-fact',
  partial: 'border-[#cfd6e6] bg-obs-bg text-obs',
  needs_review: 'border-[#ecd6ab] bg-hypo-bg text-hypo',
  unverified: 'border-line-2 bg-paper-2 text-muted',
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  return <span className={cx('inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border', verificationCls[status])}>{VERIFICATION_LABEL[status]}</span>;
}

const evidenceCls: Record<EvidenceType, string> = {
  official_primary: 'border-[#bcd5cb] bg-fact-bg text-fact',
  secondary: 'border-[#cfd6e6] bg-obs-bg text-obs',
  direct_observation: 'border-[#cfd6e6] bg-obs-bg text-obs',
  hypothesis: 'border-[#ecd6ab] bg-hypo-bg text-hypo',
};

export function SourceBadge({ evidence }: { evidence: EvidenceType }) {
  const icon = evidence === 'official_primary' ? '■' : evidence === 'hypothesis' ? '◇' : '□';
  return (
    <span className={cx('inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border', evidenceCls[evidence])}>
      <span aria-hidden>{icon}</span>
      {EVIDENCE_LABEL[evidence]}
    </span>
  );
}

/** Visual separation of confirmed facts vs analysis framing (spec 0-6, D6). */
export function KindLabel({ kind }: { kind: 'fact' | 'analysis' | 'candidate' | 'observation' | 'hypothesis' | 'interpretation' | 'application' }) {
  const map = {
    fact: ['확인된 사실', 'border-[#bcd5cb] bg-fact-bg text-fact'],
    observation: ['직접 관찰', 'border-[#cfd6e6] bg-obs-bg text-obs'],
    analysis: ['분석 관점', 'border-[#ecd6ab] bg-hypo-bg text-hypo'],
    candidate: ['장면 후보', 'border-[#ecd6ab] bg-hypo-bg text-hypo'],
    hypothesis: ['가설', 'border-[#ecd6ab] bg-hypo-bg text-hypo'],
    interpretation: ['해석', 'border-[#ecd6ab] bg-hypo-bg text-hypo'],
    application: ['창작 적용', 'border-line-2 bg-paper-2 text-ink-2'],
  } as const;
  const [label, cls] = map[kind];
  return <span className={cx('inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide', cls)}>{label}</span>;
}

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-line-2 bg-card/60 px-6 py-10 text-center">
      <div className="h-8 w-8 rounded-full border border-line-2 bg-paper-2" aria-hidden />
      <p className="font-medium text-ink">{title}</p>
      {body && <div className="max-w-md text-sm text-muted">{body}</div>}
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="font-serif text-lg font-semibold text-ink">{title}</h2>
        {sub && <p className="text-xs text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function PageHeader({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>}
        <h1 className="font-serif text-2xl font-semibold leading-tight text-ink md:text-3xl">{title}</h1>
        {sub && <div className="mt-1.5 text-sm text-ink-2">{sub}</div>}
      </div>
      {right && <div className="flex flex-wrap gap-2">{right}</div>}
    </header>
  );
}

export function Dialog({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input, textarea, select, button:not([data-close])');
      el?.focus();
    }, 0);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(t);
      prev?.focus?.();
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx('flex max-h-[92vh] w-full flex-col rounded-t-xl border border-line bg-card shadow-xl sm:rounded-xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 id={titleId} className="font-serif text-lg font-semibold">
            {title}
          </h2>
          <button type="button" data-close onClick={onClose} className="rounded p-1 text-xl leading-none text-muted hover:text-ink" aria-label="닫기">
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmationDialog({ open, title, body, confirmLabel = '삭제', onConfirm, onCancel, danger = true }: { open: boolean; title: string; body: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button onClick={onCancel}>취소</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm leading-relaxed text-ink-2">{body}</div>
    </Dialog>
  );
}

export function ToggleChip({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
        active ? 'border-ink bg-ink text-paper' : 'border-line-2 bg-card text-ink-2 hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}

export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cx('relative underline decoration-line-2 underline-offset-2 hover:decoration-ink', className)}>
      {children}
      <span className="sr-only"> (새 탭에서 열림)</span>
      <span aria-hidden className="ml-0.5 text-[0.8em]">↗</span>
    </a>
  );
}

export function ComingLater({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-dashed border-line-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
      추후 구현 · {children}
    </span>
  );
}

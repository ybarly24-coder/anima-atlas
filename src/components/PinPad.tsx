'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cx } from '@/lib/util';

export const PIN_LENGTH = 4;

export interface PinResult {
  ok: boolean;
  locked?: boolean;
  retryAfterSec?: number;
  remaining?: number;
  message?: string;
}

/** Keyboard-typed 4-digit PIN screen (shared by the server unlock page and the static-site lock screen). */
export function PinPad({ verify, onSuccess, note }: { verify: (pin: string) => Promise<PinResult>; onSuccess: () => void; note?: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'locked' | 'ok'>('idle');
  const [message, setMessage] = useState('');
  const [retryIn, setRetryIn] = useState(0);
  const [shake, setShake] = useState(false);

  // Keep the keyboard focus on the PIN field.
  useEffect(() => {
    inputRef.current?.focus();
    const refocus = () => inputRef.current?.focus();
    window.addEventListener('click', refocus);
    return () => window.removeEventListener('click', refocus);
  }, []);

  useEffect(() => {
    if (retryIn <= 0) return;
    const t = setTimeout(() => setRetryIn((s) => s - 1), 1000);
    if (retryIn === 1) setTimeout(() => { setStatus('idle'); setMessage(''); inputRef.current?.focus(); }, 1000);
    return () => clearTimeout(t);
  }, [retryIn]);

  const submit = async (value: string) => {
    if (status === 'checking' || status === 'locked' || value.length !== PIN_LENGTH) return;
    setStatus('checking');
    let r: PinResult;
    try {
      r = await verify(value);
    } catch {
      r = { ok: false, message: '확인하지 못했습니다. 다시 시도하세요.' };
    }
    if (r.ok) {
      setStatus('ok');
      onSuccess();
      return;
    }
    setPin('');
    setShake(true);
    setTimeout(() => setShake(false), 450);
    if (r.locked) {
      setStatus('locked');
      setRetryIn(r.retryAfterSec ?? 30);
      setMessage(r.message ?? '잠시 후 다시 입력하세요.');
    } else {
      setStatus('error');
      setMessage(`${r.message ?? 'PIN이 올바르지 않습니다.'}${typeof r.remaining === 'number' && r.remaining <= 3 ? ` (잠금까지 ${r.remaining}번 남음)` : ''}`);
      inputRef.current?.focus();
    }
  };

  const onChange = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, PIN_LENGTH);
    setPin(digits);
    if (status === 'error') setStatus('idle');
    if (digits.length === PIN_LENGTH) submit(digits);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit(pin);
  };

  const locked = status === 'locked';

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-paper px-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
        <div>
          <p className="font-serif text-2xl font-bold tracking-[0.14em] text-ink">ANIMA ATLAS</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted">Animation Research &amp; Visual Intelligence Platform</p>
        </div>
        <div className="flex flex-col items-center gap-3">
          <label htmlFor="pin" className="text-sm font-medium text-ink-2">키보드로 PIN 4자리를 입력하세요</label>
          <div className={cx('relative', shake && 'animate-[pinshake_0.4s_ease-in-out]')}>
            <div className="flex gap-3" aria-hidden>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <span
                  key={i}
                  className={cx(
                    'flex h-14 w-12 items-center justify-center rounded-lg border-2 text-2xl transition-colors',
                    i < pin.length ? 'border-ink bg-ink text-paper' : i === pin.length && !locked ? 'border-ink bg-card' : 'border-line-2 bg-card',
                    status === 'error' && 'border-danger',
                  )}
                >
                  {i < pin.length ? '●' : ''}
                </span>
              ))}
            </div>
            {/* The real field: typed with the keyboard (on iPhone the number keypad opens), shown as the boxes above. */}
            <input
              ref={inputRef}
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              maxLength={PIN_LENGTH}
              value={pin}
              disabled={locked || status === 'checking' || status === 'ok'}
              onChange={(e) => onChange(e.target.value)}
              aria-describedby="pin-status"
              aria-invalid={status === 'error'}
              className="absolute inset-0 h-full w-full cursor-default opacity-0"
            />
          </div>
          <p id="pin-status" role="status" aria-live="polite" className={cx('min-h-5 text-sm', status === 'error' || locked ? 'text-danger' : 'text-muted')}>
            {status === 'checking' ? '확인 중…' : status === 'ok' ? '잠금 해제됨' : locked ? `${message} (${retryIn}초)` : message || '4자리를 입력하면 자동으로 확인합니다.'}
          </p>
        </div>
        <p className="text-[11px] leading-relaxed text-muted">{note ?? '개인 연구 도구입니다. 연구 데이터는 이 브라우저에만 저장되며, 잠금을 해제한 세션은 브라우저를 닫거나 12시간이 지나면 끝납니다.'}</p>
      </form>
    </div>
  );
}

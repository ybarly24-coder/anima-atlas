'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PinPad, type PinResult } from '@/components/PinPad';
import { safeNextPath } from '@/lib/auth';
import { verifyClientPin } from '@/lib/clientPin';
import { IS_STATIC, withBase } from '@/lib/runtime';

async function verifyOnServer(pin: string): Promise<PinResult> {
  try {
    const res = await fetch('/api/unlock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    const j = await res.json().catch(() => ({}));
    return res.ok && j.ok ? { ok: true } : { ok: false, locked: j.locked, retryAfterSec: j.retryAfterSec, remaining: j.remaining, message: j.message };
  } catch {
    return { ok: false, message: '서버에 연결할 수 없습니다.' };
  }
}

function UnlockInner() {
  const params = useSearchParams();
  const router = useRouter();
  const next = safeNextPath(params.get('next'));
  return (
    <PinPad
      verify={IS_STATIC ? verifyClientPin : verifyOnServer}
      onSuccess={() => {
        // Server mode: full navigation so the new HttpOnly cookie is sent with every following request.
        if (IS_STATIC) router.replace(next);
        else window.location.replace(withBase(next));
      }}
    />
  );
}

export default function UnlockPage() {
  return (
    <Suspense>
      <UnlockInner />
    </Suspense>
  );
}

'use client';

import { useId, useState } from 'react';
import { useAtlas } from '@/lib/store';
import { Button, Field, TextInput } from './ui';

const MAX_BYTES = 8 * 1024 * 1024;

/** Upload a still the user has rights to use. Stored locally in IndexedDB only. */
export function MediaUploader({ currentAssetId, onChange, label = '장면 이미지(스틸컷)' }: { currentAssetId?: string | null; onChange: (assetId: string | null) => void; label?: string }) {
  const { saveAssetFromFile, notify } = useAtlas();
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [rightsOk, setRightsOk] = useState(false);
  const [alt, setAlt] = useState('');
  const [attribution, setAttribution] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = async () => {
    if (!file) return setError('파일을 선택하세요.');
    if (!file.type.startsWith('image/')) return setError('이미지 파일만 업로드할 수 있습니다.');
    if (file.size > MAX_BYTES) return setError('8MB 이하의 이미지를 사용하세요.');
    if (!rightsOk) return setError('이미지 사용 권리를 확인해 주세요.');
    if (!alt.trim()) return setError('이미지 대체 텍스트(alt)를 입력하세요.');
    setBusy(true);
    try {
      const assetId = await saveAssetFromFile(file, { alt: alt.trim(), attribution: attribution.trim() || undefined, rightsNote: '사용자가 업로드 시 사용 권리를 확인함' });
      onChange(assetId);
      setFile(null);
      setRightsOk(false);
      setAlt('');
      setAttribution('');
      setError(null);
      notify('이미지를 이 브라우저에 업로드했습니다. 저장하면 적용됩니다.', 'info');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-md border border-line bg-paper p-3">
      <Field label={label} htmlFor={`${id}-file`} error={error} hint="영상 다운로드·무단 스크래핑·스틸컷 재호스팅은 하지 않습니다. 직접 촬영/제작했거나 사용 허가를 받은 이미지만 올리세요. 파일은 이 브라우저의 IndexedDB에만 저장됩니다.">
        <input
          id={`${id}-file`}
          type="file"
          accept="image/*"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
          className="text-sm file:mr-3 file:rounded-md file:border file:border-line-2 file:bg-card file:px-3 file:py-1.5 file:text-sm"
        />
      </Field>
      {file && (
        <>
          <Field label="대체 텍스트 (alt)" htmlFor={`${id}-alt`} required>
            <TextInput id={`${id}-alt`} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="예: 물 위를 달리는 기차의 측면 와이드숏" />
          </Field>
          <Field label="출처 표기 (선택)" htmlFor={`${id}-attr`}>
            <TextInput id={`${id}-attr`} value={attribution} onChange={(e) => setAttribution(e.target.value)} placeholder="예: 직접 촬영한 연구용 스크린 기록" />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-ink" checked={rightsOk} onChange={(e) => setRightsOk(e.target.checked)} />
            <span>이 이미지를 연구 목적으로 사용할 권리가 있음을 확인했습니다.</span>
          </label>
          <div className="flex gap-2">
            <Button variant="primary" onClick={upload} disabled={busy}>
              {busy ? '저장 중...' : '업로드'}
            </Button>
            <Button onClick={() => setFile(null)}>취소</Button>
          </div>
        </>
      )}
      {currentAssetId && !file && (
        <Button
          variant="danger"
          size="sm"
          className="self-start"
          onClick={() => onChange(null)}
        >
          현재 이미지 제거
        </Button>
      )}
    </div>
  );
}

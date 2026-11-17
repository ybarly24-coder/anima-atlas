'use client';

import { useMemo, useState } from 'react';
import { applyAnalysis, buildFixPrompt, buildManualPrompt, MANUAL_MODEL_LABEL, parseManualAnalysis } from '@/lib/manualAnalysis';
import { useAtlas } from '@/lib/store';
import type { Scene } from '@/lib/types';
import { cx } from '@/lib/util';
import { Button, TextArea } from './ui';

/** Re-encode as PNG (the only image type browsers reliably put on the clipboard), long side <= 1568px. */
async function toPng(blob: Blob, maxSide = 1568): Promise<Blob> {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(bmp.width * scale));
  c.height = Math.max(1, Math.round(bmp.height * scale));
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('PNG 변환 실패'))), 'image/png'));
}

function Step({ n, title, done, children }: { n: number; title: string; done?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className={cx('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-fact text-paper' : 'bg-ink text-paper')}>{done ? '✓' : n}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-sm font-semibold">{title}</p>
        {children}
      </div>
    </li>
  );
}

export function ClaudeAppAnalysis({ scene, onApplied }: { scene: Scene; onApplied: (next: Scene) => void }) {
  const { data, loadAsset, saveScene, notify } = useAtlas();
  const [imageDone, setImageDone] = useState(false);
  const [promptDone, setPromptDone] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [reply, setReply] = useState('');
  const [result, setResult] = useState<{ message: string; issues: string[] } | null>(null);
  const [saving, setSaving] = useState(false);

  const work = data.works.find((w) => w.id === scene.workId);
  const prompt = useMemo(
    () => buildManualPrompt({ workTitle: work ? `${work.titleKo} (${work.titleEn}, ${work.releaseYear})` : undefined, sceneTitle: scene.title || undefined, note: scene.description || undefined, tags: data.tags }),
    [work, scene.title, scene.description, data.tags],
  );

  const copyText = async (text: string, okMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(okMsg, 'info');
      return true;
    } catch {
      notify('클립보드에 접근할 수 없습니다. 아래 상자에서 직접 복사하세요.', 'error');
      setShowPrompt(true);
      return false;
    }
  };

  const imageBlob = async () => {
    if (!scene.sceneImageAssetId) return null;
    const a = await loadAsset(scene.sceneImageAssetId);
    return a?.blob ?? null;
  };

  const copyImage = async () => {
    const b = await imageBlob();
    if (!b) return notify('장면 이미지를 불러올 수 없습니다.', 'error');
    try {
      const png = await toPng(b);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
      setImageDone(true);
      notify('이미지를 복사했습니다. claude.ai 입력창에 ⌘V로 붙여넣으세요.', 'info');
    } catch {
      notify('이 브라우저는 이미지 복사를 지원하지 않습니다. "이미지 파일로 저장"을 사용하세요.', 'error');
    }
  };

  const saveImage = async () => {
    const b = await imageBlob();
    if (!b) return notify('장면 이미지를 불러올 수 없습니다.', 'error');
    const png = await toPng(b);
    const url = URL.createObjectURL(png);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(scene.title || 'scene').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 60)}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setImageDone(true);
  };

  const apply = async () => {
    const r = parseManualAnalysis(reply);
    if (!r.ok) {
      setResult({ message: r.message, issues: r.issues });
      return;
    }
    setResult(null);
    setSaving(true);
    try {
      const stored = data.scenes.find((s) => s.id === scene.id) ?? scene;
      const next = applyAnalysis(stored, r.analysis, MANUAL_MODEL_LABEL, data.tags, { useAiTitle: stored.title === '분석 중인 장면' || stored.title === '제목 없는 장면' });
      await saveScene(next);
      notify('Claude 분석을 적용해 카드뉴스를 만들었습니다.');
      setReply('');
      onApplied(next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-paper p-4">
      <div>
        <p className="font-semibold">Claude 앱으로 분석 <span className="text-xs font-normal text-muted">· 구독(claude.ai) 사용 · API 키·추가 비용 없음</span></p>
        <p className="text-xs text-muted">이미지와 프롬프트를 claude.ai 채팅에 붙여넣고, Claude의 답변을 여기에 다시 붙여넣으면 카드뉴스가 만들어집니다.</p>
      </div>
      <ol className="flex flex-col gap-4">
        <Step n={1} title="장면 이미지 복사" done={imageDone}>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={copyImage} disabled={!scene.sceneImageAssetId}>이미지 복사</Button>
            <Button size="sm" onClick={saveImage} disabled={!scene.sceneImageAssetId}>이미지 파일로 저장</Button>
          </div>
        </Step>
        <Step n={2} title="분석 프롬프트 복사" done={promptDone}>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={async () => setPromptDone(await copyText(prompt, '프롬프트를 복사했습니다. claude.ai에 이미지와 함께 붙여넣으세요.'))}>프롬프트 복사</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowPrompt(!showPrompt)} aria-expanded={showPrompt}>{showPrompt ? '프롬프트 숨기기' : '프롬프트 보기'}</Button>
          </div>
          {showPrompt && <TextArea readOnly rows={8} value={prompt} className="font-mono text-[11px]" onFocus={(e) => e.currentTarget.select()} aria-label="분석 프롬프트" />}
        </Step>
        <Step n={3} title="claude.ai 새 채팅에 이미지 → 프롬프트 순서로 붙여넣고 보내기">
          <div>
            <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center rounded-md border border-line-2 bg-card px-2.5 text-xs font-medium hover:bg-paper-2">claude.ai 새 채팅 열기 ↗</a>
          </div>
          <p className="text-[11px] text-muted">이미지가 claude.ai로 전송됩니다(구독 계정의 대화로 남음). 개인 연구용으로만 사용하세요.</p>
        </Step>
        <Step n={4} title="Claude 답변 전체를 복사해 여기에 붙여넣기">
          <TextArea rows={6} value={reply} onChange={(e) => { setReply(e.target.value); setResult(null); }} placeholder={'```json\n{ "title": "...", ... }\n```  ← Claude 답변을 통째로 붙여넣어도 됩니다'} className="font-mono text-xs" aria-label="Claude 답변 붙여넣기" />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={apply} disabled={saving || !reply.trim()}>{saving ? '적용 중…' : '결과 적용 → 카드뉴스 만들기'}</Button>
          </div>
          {result && (
            <div className="flex flex-col gap-2 rounded-md border border-[#e3c2bc] bg-[#fbefec] p-3 text-sm text-danger" role="alert">
              <p>{result.message}</p>
              {result.issues.length > 0 && (
                <>
                  <ul className="list-disc pl-5 text-xs text-ink-2">{result.issues.map((i) => <li key={i}>{i}</li>)}</ul>
                  <Button size="sm" className="self-start" onClick={() => copyText(buildFixPrompt(result.issues), '수정 요청 문구를 복사했습니다. 같은 claude.ai 채팅에 보내세요.')}>수정 요청 문구 복사</Button>
                </>
              )}
            </div>
          )}
        </Step>
      </ol>
      <p className="text-[11px] text-muted">결과는 &quot;AI 분석 · 자동 생성 해석&quot;으로 표시되며 Evidence(확인된 사실) 칸에 들어가지 않습니다. 필요하면 프롬프트 내용을 바꿔 보내도 형식만 맞으면 적용됩니다.</p>
    </div>
  );
}

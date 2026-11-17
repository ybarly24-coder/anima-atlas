'use client';

import { useEffect, useState } from 'react';
import { seedCategories } from '@seed/categories';
import { LENSES, LENS_LABEL } from '@/lib/labels';
import { useAtlas } from '@/lib/store';
import type { CategoryId, Lens, Work } from '@/lib/types';
import { newId, nowIso, uniqueSlug } from '@/lib/util';
import { Button, Dialog, Field, Select, TextArea, TextInput, ToggleChip } from './ui';

const splitList = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export function WorkEditor({ open, onClose, work, defaultCategory, onSaved }: { open: boolean; onClose: () => void; work?: Work | null; defaultCategory?: CategoryId; onSaved?: (w: Work) => void }) {
  const { data, saveWork, notify } = useAtlas();
  const [f, setF] = useState({
    categoryId: (defaultCategory ?? 'ghibli') as CategoryId,
    titleKo: '', titleEn: '', releaseYear: '', studio: '', director: '', medium: '',
    synopsisKo: '', overviewKo: '', researchQuestion: '', researchKeywords: '', lensIds: [] as Lens[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setF({
      categoryId: work?.categoryId ?? defaultCategory ?? 'ghibli',
      titleKo: work?.titleKo ?? '',
      titleEn: work?.titleEn ?? '',
      releaseYear: work ? String(work.releaseYear) : '',
      studio: work?.studio ?? '',
      director: (work?.director ?? []).join(', '),
      medium: (work?.medium ?? []).join(', '),
      synopsisKo: work?.synopsisKo ?? '',
      overviewKo: work?.overviewKo ?? '',
      researchQuestion: work?.researchQuestion ?? '',
      researchKeywords: (work?.researchKeywords ?? []).join(', '),
      lensIds: work?.lensIds ?? [],
    });
  }, [open, work, defaultCategory]);

  const save = async () => {
    const e: Record<string, string> = {};
    if (!f.titleKo.trim()) e.titleKo = '한국어 제목을 입력하세요.';
    if (!f.titleEn.trim()) e.titleEn = '영어 제목을 입력하세요. (영문 검색에 사용)';
    const year = Number(f.releaseYear);
    if (!/^\d{4}$/.test(f.releaseYear.trim()) || year < 1880 || year > 2100) e.releaseYear = '4자리 개봉 연도를 입력하세요.';
    if (!f.studio.trim()) e.studio = '스튜디오를 입력하세요.';
    setErrors(e);
    if (Object.keys(e).length) return;
    const now = nowIso();
    const slugs = data.works.filter((w) => w.id !== work?.id).map((w) => w.slug);
    const next: Work = {
      id: work?.id ?? newId('work'),
      slug: work?.slug ?? uniqueSlug(f.titleEn || f.titleKo, slugs),
      categoryId: f.categoryId,
      titleKo: f.titleKo.trim(),
      titleEn: f.titleEn.trim(),
      releaseYear: year,
      studio: f.studio.trim(),
      director: splitList(f.director),
      medium: splitList(f.medium),
      synopsisKo: f.synopsisKo.trim() || undefined,
      overviewKo: f.overviewKo.trim() || undefined,
      researchQuestion: f.researchQuestion.trim() || undefined,
      researchKeywords: splitList(f.researchKeywords),
      lensIds: f.lensIds,
      officialSourceIds: work?.officialSourceIds ?? [],
      coverAssetId: work?.coverAssetId ?? null,
      createdAt: work?.createdAt ?? now,
      updatedAt: now,
    };
    await saveWork(next);
    notify(work ? '작품 정보를 저장했습니다.' : `작품 "${next.titleKo}"을(를) 추가했습니다.`);
    onSaved?.(next);
    onClose();
  };

  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={work ? '작품 편집' : '새 작품 추가'}
      wide
      footer={
        <>
          <Button onClick={onClose}>취소</Button>
          <Button variant="primary" onClick={save}>저장</Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="카테고리" htmlFor="w-cat" required>
          <Select id="w-cat" value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value as CategoryId })}>
            {seedCategories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="개봉 연도" htmlFor="w-year" error={errors.releaseYear} required>
          <TextInput id="w-year" inputMode="numeric" value={f.releaseYear} onChange={(e) => set({ releaseYear: e.target.value })} placeholder="2001" />
        </Field>
        <Field label="한국어 제목" htmlFor="w-ko" error={errors.titleKo} required>
          <TextInput id="w-ko" value={f.titleKo} onChange={(e) => set({ titleKo: e.target.value })} />
        </Field>
        <Field label="영어 제목" htmlFor="w-en" error={errors.titleEn} required>
          <TextInput id="w-en" value={f.titleEn} onChange={(e) => set({ titleEn: e.target.value })} />
        </Field>
        <Field label="스튜디오" htmlFor="w-studio" error={errors.studio} required>
          <TextInput id="w-studio" value={f.studio} onChange={(e) => set({ studio: e.target.value })} />
        </Field>
        <Field label="감독 (쉼표로 구분)" htmlFor="w-dir">
          <TextInput id="w-dir" value={f.director} onChange={(e) => set({ director: e.target.value })} />
        </Field>
        <Field label="제작 방식/매체 (쉼표로 구분)" htmlFor="w-medium">
          <TextInput id="w-medium" value={f.medium} onChange={(e) => set({ medium: e.target.value })} placeholder="2D 애니메이션, 하이브리드" />
        </Field>
        <Field label="연구 키워드 (쉼표로 구분)" htmlFor="w-kw">
          <TextInput id="w-kw" value={f.researchKeywords} onChange={(e) => set({ researchKeywords: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <Field label="핵심 연구 질문" htmlFor="w-q">
            <TextArea id="w-q" rows={2} value={f.researchQuestion} onChange={(e) => set({ researchQuestion: e.target.value })} />
          </Field>
        </div>
        <Field label="공식 개요 (출처 기반 요약)" htmlFor="w-syn" hint="공식 자료에 근거한 내용만 적고 출처를 연결하세요.">
          <TextArea id="w-syn" value={f.synopsisKo} onChange={(e) => set({ synopsisKo: e.target.value })} />
        </Field>
        <Field label="분석 관점 메모" htmlFor="w-ov" hint="연구자의 해석 프레임 (공식 제작 의도 아님).">
          <TextArea id="w-ov" value={f.overviewKo} onChange={(e) => set({ overviewKo: e.target.value })} />
        </Field>
        <div className="md:col-span-2">
          <p className="mb-1.5 text-sm font-medium">연구 관점</p>
          <div className="flex flex-wrap gap-1.5">
            {LENSES.map((l) => (
              <ToggleChip key={l} active={f.lensIds.includes(l)} onClick={() => set({ lensIds: f.lensIds.includes(l) ? f.lensIds.filter((x) => x !== l) : [...f.lensIds, l] })}>
                {LENS_LABEL[l].en} · {LENS_LABEL[l].ko}
              </ToggleChip>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}

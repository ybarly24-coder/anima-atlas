'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { BoardCard } from '@/components/Cards';
import { CategoryTabs } from '@/components/CategoryTabs';
import { Button, Dialog, EmptyState, Field, PageHeader, TextArea, TextInput } from '@/components/ui';
import { useAtlas } from '@/lib/store';
import type { CategoryId, ResearchBoard } from '@/lib/types';
import { newId, nowIso } from '@/lib/util';
import { boardHref } from '@/lib/routes';

function BoardsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { data, saveBoard, notify } = useAtlas();
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('new') === '1') setOpen(true);
  }, [params]);

  const close = () => {
    setOpen(false);
    setError(null);
    if (params.get('new')) router.replace('/boards', { scroll: false });
  };

  const create = async () => {
    if (!title.trim()) {
      setError('보드 제목을 입력하세요.');
      return;
    }
    const now = nowIso();
    const b: ResearchBoard = {
      id: newId('board'), title: title.trim(), researchQuestion: question.trim(), status: 'in_progress',
      categoryIds: cat === 'all' ? [] : [cat], lensIds: [], sceneIds: [], sceneNotes: {}, workIds: [],
      commonalities: '', differences: '', counterexamples: '', findings: '', applications: '', sourceIds: [], createdAt: now, updatedAt: now,
    };
    await saveBoard(b);
    notify('연구 보드를 만들었습니다.');
    setTitle('');
    setQuestion('');
    setOpen(false);
    router.push(boardHref(b.id));
  };

  const boards = data.boards.filter((b) => cat === 'all' || b.categoryIds.includes(cat)).sort((a, b) => (a.seedCode && b.seedCode ? a.seedCode.localeCompare(b.seedCode) : b.updatedAt.localeCompare(a.updatedAt)));

  return (
    <div>
      <PageHeader
        eyebrow="Research Boards"
        title="연구 보드"
        sub="하나의 검증 가능한 질문 아래 장면을 모으고, 공통점·차이·반례·결론을 기록합니다. 예시 보드는 결론이 비어 있는 템플릿입니다."
        right={<Button variant="primary" onClick={() => setOpen(true)}>+ 연구 보드</Button>}
      />
      <div className="mb-4">
        <CategoryTabs value={cat} onChange={setCat} />
      </div>
      {boards.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{boards.map((b) => <BoardCard key={b.id} board={b} />)}</div>
      ) : (
        <EmptyState title="보드가 없습니다." action={<Button variant="primary" onClick={() => setOpen(true)}>+ 연구 보드</Button>} />
      )}
      <Dialog open={open} onClose={close} title="새 연구 보드" footer={<><Button onClick={close}>취소</Button><Button variant="primary" onClick={create}>만들기</Button></>}>
        <div className="flex flex-col gap-4">
          <Field label="보드 제목" htmlFor="nb-title" error={error} required>
            <TextInput id="nb-title" value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} placeholder="예: 문턱을 넘는 순간" />
          </Field>
          <Field label="핵심 연구 질문" htmlFor="nb-q" hint="하나의 검증 가능한 질문으로 적으세요.">
            <TextArea id="nb-q" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </Field>
        </div>
      </Dialog>
    </div>
  );
}

export default function BoardsPage() {
  return (
    <Suspense>
      <BoardsInner />
    </Suspense>
  );
}

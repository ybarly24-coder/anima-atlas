'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAtlas } from '@/lib/store';
import { newId, nowIso } from '@/lib/util';
import type { ResearchBoard } from '@/lib/types';
import { Button, Dialog, Field, TextInput } from './ui';
import { boardHref } from '@/lib/routes';

export function AddToBoardDialog({ sceneIds, open, onClose }: { sceneIds: string[]; open: boolean; onClose: () => void }) {
  const { data, addScenesToBoard, saveBoard, notify } = useAtlas();
  const router = useRouter();
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const boards = [...data.boards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const add = async (boardId: string, title: string) => {
    const n = await addScenesToBoard(boardId, sceneIds);
    notify(n ? `"${title}" 보드에 ${n}개 장면을 추가했습니다.` : '이미 보드에 포함된 장면입니다.', n ? 'success' : 'info');
    onClose();
  };

  const createAndAdd = async () => {
    const title = newTitle.trim();
    if (!title) {
      setError('보드 제목을 입력하세요.');
      return;
    }
    const now = nowIso();
    const b: ResearchBoard = {
      id: newId('board'), title, researchQuestion: '', status: 'in_progress', categoryIds: [], lensIds: [], sceneIds: [], sceneNotes: {}, workIds: [],
      commonalities: '', differences: '', counterexamples: '', findings: '', applications: '', sourceIds: [], createdAt: now, updatedAt: now,
    };
    await saveBoard(b);
    await addScenesToBoard(b.id, sceneIds);
    notify(`새 보드 "${title}"를 만들고 장면을 추가했습니다.`);
    setNewTitle('');
    onClose();
    router.push(boardHref(b.id));
  };

  return (
    <Dialog open={open} onClose={onClose} title="연구 보드에 추가">
      <div className="flex flex-col gap-4">
        <div className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {boards.length === 0 && <p className="text-sm text-muted">아직 보드가 없습니다. 아래에서 새로 만드세요.</p>}
          {boards.map((b) => {
            const included = sceneIds.every((id) => b.sceneIds.includes(id));
            return (
              <button
                key={b.id}
                type="button"
                disabled={included}
                onClick={() => add(b.id, b.title)}
                className="flex items-center justify-between gap-2 rounded-md border border-line px-3 py-2 text-left text-sm hover:border-ink disabled:cursor-default disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{b.title}</span>
                  <span className="block truncate text-xs text-muted">{b.researchQuestion || '연구 질문 미입력'}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{included ? '포함됨' : `${b.sceneIds.length}개 장면`}</span>
              </button>
            );
          })}
        </div>
        <div className="border-t border-line pt-4">
          <Field label="새 보드 만들어 추가" htmlFor="new-board-title" error={error}>
            <div className="flex gap-2">
              <TextInput id="new-board-title" value={newTitle} onChange={(e) => { setNewTitle(e.target.value); setError(null); }} placeholder="예: 문턱을 넘는 장면들" />
              <Button variant="primary" onClick={createAndAdd}>만들기</Button>
            </div>
          </Field>
        </div>
      </div>
    </Dialog>
  );
}

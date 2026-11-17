import type { SceneAnalysis } from '@/lib/aiSchema';

const sec = (h: string) => ({ headline: h, points: [`${h} 관찰 1`, `${h} 관찰 2`] });

export const sample: SceneAnalysis = {
  title: '물 위의 기차',
  summary: '수평선 아래로 고요히 지나가는 기차가 고독을 만든다.',
  sceneDescription: '넓은 수면 위를 기차가 가로지른다.',
  miseEnScene: sec('비어 있는 수면'),
  color: { ...sec('푸른 저채도'), temperature: '쿨톤', saturation: '저채도', contrast: '약한 대비', mood: '쓸쓸한 고요' },
  composition: { ...sec('수평 분할'), framing: '삼분할', focalPoint: '화면 오른쪽 1/3의 기차' },
  camera: { ...sec('멀리서 바라봄'), shotSize: '익스트림 롱숏', angle: '아이레벨', lensFeel: '망원 느낌', movementGuess: '판단 불가' },
  lighting: sec('확산광'),
  blocking: sec('작게 배치된 기차'),
  narrative: sec('이동과 고독'),
  technique: sec('평면적 색면'),
  takeaways: ['수평선을 낮게 두어 하늘을 넓게', '피사체를 작게', '대사를 비우기'],
  suggestedTags: ['고독', '네거티브 스페이스', '없는태그'],
  caveats: '정지 이미지 한 장이라 카메라 움직임은 판단할 수 없음.',
};


// ---- PIN gate helpers for route tests ----
import { createSessionToken, SESSION_COOKIE } from '@/lib/auth';

export const TEST_SECRET = 'test-secret-0123456789abcdef0123456789abcdef';
process.env.APP_PIN = '5931';
process.env.APP_SESSION_SECRET = TEST_SECRET;

/** A Request that carries a valid PIN session cookie. */
export async function authed(url: string, init?: RequestInit): Promise<Request> {
  const token = await createSessionToken(TEST_SECRET);
  const headers = new Headers(init?.headers);
  headers.set('cookie', `${SESSION_COOKIE}=${token}`);
  return new Request(url, { ...init, headers });
}

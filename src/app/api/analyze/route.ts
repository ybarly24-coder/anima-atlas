import { hasValidSession, UNAUTHORIZED_JSON } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { NextResponse } from 'next/server';
import { SceneAnalysisSchema } from '@/lib/aiSchema';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL = 'claude-opus-5-5';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];
const MAX_BASE64_BYTES = 7 * 1024 * 1024; // ~5MB image

const SYSTEM = `당신은 애니메이션 연출·촬영·미술을 가르치는 분석가입니다.
사용자가 연구용으로 수집한 애니메이션 장면 이미지 한 장을 분석해, 제작자와 연구자가 공부할 수 있는 카드뉴스용 분석을 한국어로 작성합니다.

원칙:
- 화면에 실제로 보이는 것(관찰)과 그로부터의 해석을 구분해서 쓰세요. 해석에는 "~로 보인다", "~를 암시한다" 같은 표현을 쓰세요.
- 위치는 구체적으로: "화면 왼쪽 1/3", "하단 수평선 아래", "전경/중경/배경" 등.
- 제작사의 실제 제작 공정, 감독 의도, 타임코드, 인터뷰 내용을 사실처럼 지어내지 마세요. 기법(technique)은 "화면에서 관찰되는 표현"으로만 쓰세요.
- 작품명이 주어지지 않았거나 확실하지 않으면 작품을 단정하지 말고 caveats에 적으세요.
- 정지 이미지 한 장으로 판단할 수 없는 것(카메라 움직임, 앞뒤 맥락)은 "판단 불가" 또는 추정임을 밝히세요.
- 각 points 항목은 한두 문장, 구체적이고 공부가 되게.`;

export async function POST(req: Request) {
  if (!(await hasValidSession(req))) return NextResponse.json(UNAUTHORIZED_JSON, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return NextResponse.json(
      { error: 'API_KEY_MISSING', message: 'Anthropic API 키가 설정되지 않았습니다. anima-atlas/.env.local 에 ANTHROPIC_API_KEY 를 넣고 서버를 다시 시작하세요.' },
      { status: 503 },
    );
  }

  let body: { imageBase64?: string; mediaType?: string; context?: { workTitle?: string; sceneTitle?: string; note?: string }; tagNames?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_REQUEST', message: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  const { imageBase64, mediaType, context, tagNames } = body;
  if (!imageBase64 || !mediaType || !ALLOWED_TYPES.includes(mediaType as AllowedType)) {
    return NextResponse.json({ error: 'BAD_IMAGE', message: 'PNG/JPEG/WebP/GIF 이미지만 분석할 수 있습니다.' }, { status: 400 });
  }
  if (imageBase64.length > MAX_BASE64_BYTES) {
    return NextResponse.json({ error: 'IMAGE_TOO_LARGE', message: '이미지가 너무 큽니다. 5MB 이하로 줄여 주세요.' }, { status: 413 });
  }

  const contextLines = [
    context?.workTitle ? `작품(사용자 지정): ${context.workTitle}` : '작품: 지정되지 않음',
    context?.sceneTitle ? `장면 메모 제목: ${context.sceneTitle}` : null,
    context?.note ? `사용자 메모: ${context.note}` : null,
    tagNames?.length ? `선택 가능한 태그 목록(suggestedTags는 이 중에서만): ${tagNames.slice(0, 200).join(', ')}` : null,
  ].filter(Boolean);

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: betaZodOutputFormat(SceneAnalysisSchema) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType as AllowedType, data: imageBase64 } },
            { type: 'text', text: `${contextLines.join('\n')}\n\n이 장면을 미장센, 색감, 구도, 카메라, 조명, 인물·사물 위치, 서사, 표현 기법 관점에서 분석해 주세요.` },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'REFUSED', message: '모델이 이 이미지 분석을 거절했습니다. 다른 이미지로 시도해 보세요.' }, { status: 422 });
    }
    if (response.stop_reason === 'max_tokens' || !response.parsed_output) {
      return NextResponse.json({ error: 'INCOMPLETE', message: '분석 결과가 완전하지 않습니다. 다시 시도해 주세요.' }, { status: 502 });
    }
    return NextResponse.json({ analysis: response.parsed_output, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: 'AUTH', message: 'API 키가 유효하지 않습니다. .env.local 의 ANTHROPIC_API_KEY 를 확인하세요.' }, { status: 401 });
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: 'RATE_LIMIT', message: '요청 한도에 걸렸습니다. 잠시 후 다시 시도하세요.' }, { status: 429 });
    }
    if (error instanceof Anthropic.BadRequestError) {
      return NextResponse.json({ error: 'BAD_REQUEST', message: `요청 오류: ${error.message}` }, { status: 400 });
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'API', message: `API 오류 (${error.status ?? '?'}): ${error.message}` }, { status: 502 });
    }
    return NextResponse.json({ error: 'UNKNOWN', message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

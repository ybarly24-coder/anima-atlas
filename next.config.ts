import type { NextConfig } from 'next';
import { createHash, randomBytes } from 'node:crypto';

// Two build modes:
// - default (`npm run build` / `npm start`): full server app (API routes, server PIN, server-held keys).
// - GitHub Pages (`npm run build:pages`, sets PAGES_BUILD=1): static export to ./out
//   * pageExtensions ['tsx'] keeps only page/layout .tsx files, so every server-only .ts file
//     (app/api/**/route.ts, src/proxy.ts, legacy redirect page.ts) is left out of the static build.
//   * The PIN is never shipped: only SHA-256(salt:APP_PIN) from the build-time APP_PIN secret.
const isPages = process.env.PAGES_BUILD === '1';

function pagesEnv(): Record<string, string> {
  const pin = process.env.APP_PIN?.trim();
  if (!pin || !/^\d{4}$/.test(pin)) {
    throw new Error('GitHub Pages 빌드에는 4자리 숫자 APP_PIN 이 필요합니다 (GitHub 저장소 Settings → Secrets → Actions → APP_PIN).');
  }
  const salt = randomBytes(16).toString('hex');
  return {
    NEXT_PUBLIC_STATIC_EXPORT: '1',
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
    NEXT_PUBLIC_PIN_SALT: salt,
    NEXT_PUBLIC_PIN_HASH: createHash('sha256').update(`${salt}:${pin}`).digest('hex'),
  };
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const nextConfig: NextConfig = isPages
  ? {
      reactStrictMode: true,
      output: 'export',
      basePath: basePath || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      pageExtensions: ['tsx'],
      env: pagesEnv(),
    }
  : {
      reactStrictMode: true,
    };

export default nextConfig;

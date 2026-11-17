import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AtlasProvider } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import { withBase } from '@/lib/runtime';

export const metadata: Metadata = {
  title: 'ANIMA ATLAS',
  description: 'Animation Research & Visual Intelligence Platform - 애니메이션 리서치 워크스페이스',
  // iPhone: "홈 화면에 추가" opens it full-screen like an app.
  manifest: withBase('/manifest.webmanifest'),
  appleWebApp: { capable: true, title: 'ANIMA ATLAS', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f4ee',
  // Lay out under the notch / home indicator; padding uses env(safe-area-inset-*).
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AtlasProvider>
          <AppShell>{children}</AppShell>
        </AtlasProvider>
      </body>
    </html>
  );
}

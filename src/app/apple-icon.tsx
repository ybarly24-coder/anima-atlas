import { ImageResponse } from 'next/og';

// iPhone home-screen icon (generated at build time, also for the static GitHub Pages export).
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';
export const dynamic = 'force-static';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#24221f',
          color: '#f7f4ee',
          fontSize: 112,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        A
      </div>
    ),
    size,
  );
}

import { redirect } from 'next/navigation';

// Legacy address kept for old links/bookmarks (server mode only). Detail pages now live at /work?slug=…
// so the same screens also work on GitHub Pages (static export). This .ts file is excluded from the Pages build.
export default async function LegacyRedirect({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  redirect(`/work?slug=${encodeURIComponent(decodeURIComponent(slug))}`);
}

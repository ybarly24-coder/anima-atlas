import { redirect } from 'next/navigation';

// Legacy address kept for old links/bookmarks (server mode only). Detail pages now live at /board?id=…
// so the same screens also work on GitHub Pages (static export). This .ts file is excluded from the Pages build.
export default async function LegacyRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/board?id=${encodeURIComponent(decodeURIComponent(id))}`);
}

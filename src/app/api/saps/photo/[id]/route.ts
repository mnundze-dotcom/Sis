import { sapsGet, sapsThumbnailUrl } from "@/lib/saps";

export const dynamic = "force-dynamic";

function sniff(body: Buffer): string | null {
  if (body[0] === 0xff && body[1] === 0xd8) return "image/jpeg";
  if (body[0] === 0x89 && body[1] === 0x50) return "image/png";
  if (body[0] === 0x47 && body[1] === 0x49) return "image/gif";
  return null;
}

/** Proxies SAPS wanted-person thumbnails (their TLS chain is incomplete for some browsers). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,8}$/.test(id)) return new Response("Bad request", { status: 400 });
  try {
    const res = await sapsGet(sapsThumbnailUrl(id), 12_000);
    const type = res.contentType.startsWith("image/") ? res.contentType : sniff(res.body);
    if (res.status !== 200 || !type || res.body.length === 0) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(res.body), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return new Response("Upstream unavailable", { status: 502 });
  }
}

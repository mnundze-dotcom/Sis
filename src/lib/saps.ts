import https from "node:https";
import tls from "node:tls";

/**
 * Live client for the public SAPS "Wanted Persons" list (saps.gov.za/crimestop/wanted).
 *
 * saps.gov.za does not send its intermediate certificate, so Node rejects the TLS
 * handshake by default. Instead of disabling verification we supply the missing
 * Sectigo intermediate (valid until 2036) alongside Node's bundled root store.
 */
const SECTIGO_OV_R36 = `-----BEGIN CERTIFICATE-----
MIIGTDCCBDSgAwIBAgIQLBo8dulD3d3/GRsxiQrtcTANBgkqhkiG9w0BAQwFADBf
MQswCQYDVQQGEwJHQjEYMBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTYwNAYDVQQD
Ey1TZWN0aWdvIFB1YmxpYyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gUm9vdCBSNDYw
HhcNMjEwMzIyMDAwMDAwWhcNMzYwMzIxMjM1OTU5WjBgMQswCQYDVQQGEwJHQjEY
MBYGA1UEChMPU2VjdGlnbyBMaW1pdGVkMTcwNQYDVQQDEy5TZWN0aWdvIFB1Ymxp
YyBTZXJ2ZXIgQXV0aGVudGljYXRpb24gQ0EgT1YgUjM2MIIBojANBgkqhkiG9w0B
AQEFAAOCAY8AMIIBigKCAYEApkMtJ3R06jo0fceI0M52B7K+TyMeGcv2BQ5AVc3j
lYt76TvHIu/nNe22W/RJXX9rWUD/2GE6GF5x0V4bsY7K3IeJ8E7+KzG/TGboySfD
u+F52jqQBbY62ofhYjMeiAbLI02+FqwHeM8uIrUtcX8b2RCxF358TB0NHVccAXZc
FYgZndZCeXxjuca7pJJ20LLUnXtgXcjAE1vY4WvbReW0W6mkeZyNGdmpTcFs5Y+s
yy6LtE5Zocji9J9NlNnReox2RWVyEXpA1ChZ4gqN+ZpVSIQ0HBorVFbBKyhdZyEX
gZgNSNtBRwxqwIzJePJhYd4ZUhO1vk+/uP3nwDk0p95q/j7naXNCSvESnrHPypaB
WRK066nKfPRPi9m9kIOhMdYfS8giFRTcdgL24Ycilj7ecAK9Trh0VbjwouJ4WH+x
bt47u68ZFCD/ac55I0DNHkCpaPruj6e9Rmr7K46wZDAYXuEAqB7tGG/jd6JAA+H2
O44CV98NRsU213f1kScIZntNAgMBAAGjggGBMIIBfTAfBgNVHSMEGDAWgBRWc1hk
lfmSGrASKgRieaFAFYghSTAdBgNVHQ4EFgQU42Z0u3BojSxdTg6mSo+bNyKcgpIw
DgYDVR0PAQH/BAQDAgGGMBIGA1UdEwEB/wQIMAYBAf8CAQAwHQYDVR0lBBYwFAYI
KwYBBQUHAwEGCCsGAQUFBwMCMBsGA1UdIAQUMBIwBgYEVR0gADAIBgZngQwBAgIw
VAYDVR0fBE0wSzBJoEegRYZDaHR0cDovL2NybC5zZWN0aWdvLmNvbS9TZWN0aWdv
UHVibGljU2VydmVyQXV0aGVudGljYXRpb25Sb290UjQ2LmNybDCBhAYIKwYBBQUH
AQEEeDB2ME8GCCsGAQUFBzAChkNodHRwOi8vY3J0LnNlY3RpZ28uY29tL1NlY3Rp
Z29QdWJsaWNTZXJ2ZXJBdXRoZW50aWNhdGlvblJvb3RSNDYucDdjMCMGCCsGAQUF
BzABhhdodHRwOi8vb2NzcC5zZWN0aWdvLmNvbTANBgkqhkiG9w0BAQwFAAOCAgEA
BZXWDHWC3cubb/e1I1kzi8lPFiK/ZUoH09ufmVOrc5ObYH/XKkWUexSPqRkwKFKr
7r8OuG+p7VNB8rifX6uopqKAgsvZtZsq7iAFw04To6vNcxeBt1Eush3cQ4b8nbQR
MQLChgEAqwhuXp9P48T4QEBSksYav7+aFjNySsLYlPzNqVM3RNwvBdvp6vgDtGwc
xlKQZVuuNVIaoYyls8swhxDeSHKpRdxRauTLZ+pl+wGvy0pnrLEJGSz9mOEmfbod
e/XopR2NGqaHJ6bIjyxPu6UtyQGI26En7UAEozACrHz06Nx2jTAY9E6NeB6XuobE
wLK025ZRmvglcURG1BrV24tGHHTgxCe8M3oGlpUSMTKQ2dkgljZVYt+gKdFtWELZ
MuRdi+X3XsrR8LFz+aLUiDRfQqhmw3RxjIyVKvvu9UPYY1nsvxYmFnUSeM+2q1z/
iPUry+xDY9MC6+IhleKT094VKdFVp7LXH42+wvU+17lRolQ2mK2N/nBLVBwaIhib
QXw4VYKwB86Bc6eS6iqsc94KEgD/U4VsjmgfhK+Xp4NM+VYzTTa3QeV3p8xOM0cw
q1p8oZFA+OBcz3FYWpDIe5j0NWKlw9hXsTyPY/HeZUV59akskSOSRSmDfe8wJDPX
58uB9/7lud0G3x0pxQAcffP0ayKavNwDTw4UfJ34cEw=
-----END CERTIFICATE-----`;

const CA = [...tls.rootCertificates, SECTIGO_OV_R36];
const BASE = "https://www.saps.gov.za/crimestop/wanted/";

export const SAPS_LIST_URL = `${BASE}list.php`;
export const sapsDetailUrl = (bid: string) => `${BASE}detail.php?bid=${bid}`;
export const sapsThumbnailUrl = (id: string) => `${BASE}thumbnail.php?id=${id}`;

type Fetched = { status: number; body: Buffer; contentType: string };

export function sapsGet(url: string, timeoutMs = 15_000, redirects = 3): Promise<Fetched> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { ca: CA, headers: { "User-Agent": "Mozilla/5.0 (compatible; SisSafety/1.0)", Accept: "text/html,image/*,*/*" } },
      (res) => {
        const location = res.headers.location;
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && location && redirects > 0) {
          res.resume();
          sapsGet(new URL(location, url).toString(), timeoutMs, redirects - 1).then(resolve, reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks),
            contentType: String(res.headers["content-type"] ?? ""),
          }),
        );
        res.on("error", reject);
      },
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error("SAPS request timed out")));
    req.on("error", reject);
  });
}

export type WantedPerson = {
  bid: string;
  photoId: string | null;
  surname: string;
  firstNames: string;
  fullName: string;
  crime: string;
};

export type WantedDetail = {
  bid: string;
  fullName: string;
  status: string;
  photoId: string | null;
  fields: { label: string; value: string }[];
};

function decode(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

const titleCase = (value: string) =>
  value.toLowerCase().replace(/(^|[\s'-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());

export function parseWantedList(html: string): WantedPerson[] {
  const people: WantedPerson[] = [];
  const seen = new Set<string>();
  for (const chunk of html.split(/<tr id="title">/i).slice(1)) {
    const bid = chunk.match(/detail\.php\?bid=(\d+)/)?.[1];
    if (!bid || seen.has(bid)) continue;
    seen.add(bid);
    const photoId = chunk.match(/thumbnail\.php\?id=(\d+)/)?.[1] ?? null;
    const cells = [...chunk.matchAll(/detail\.php\?bid=\d+">([^<]*)</g)].map((m) => decode(m[1] ?? ""));
    const [surnameRaw = "", firstRaw = "", crime = ""] = cells;
    const surname = titleCase(surnameRaw);
    const firstNames = titleCase(firstRaw);
    people.push({ bid, photoId, surname, firstNames, fullName: `${firstNames} ${surname}`.trim(), crime });
  }
  return people;
}

export function parseWantedDetail(bid: string, html: string): WantedDetail | null {
  const name = html.match(/<h2[^>]*>([^<]+)<\/h2>/i)?.[1];
  if (!name) return null;
  const status = html.match(/<font color='blue'>([^<]+)<\/font>/i)?.[1] ?? "Wanted";
  const photoId = html.match(/thumbnail\.php\?id=(\d+)/)?.[1] ?? null;
  const fields: { label: string; value: string }[] = [];
  for (const m of html.matchAll(/<B>([^<]+?):\s*<\/B>\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)) {
    const label = decode(m[1] ?? "");
    const value = decode((m[2] ?? "").replace(/<[^>]+>/g, " "));
    if (!label || !value || /^(0 m|0 kg|unknown)$/i.test(value)) continue;
    fields.push({ label, value });
  }
  return { bid, fullName: titleCase(decode(name)), status: decode(status), photoId, fields };
}

type Store = {
  list?: { at: number; people: WantedPerson[] };
  inflight?: Promise<{ at: number; people: WantedPerson[] }>;
  details: Map<string, { at: number; data: WantedDetail }>;
};
const g = globalThis as typeof globalThis & { __sisSaps?: Store };
const store: Store = g.__sisSaps ?? (g.__sisSaps = { details: new Map() });
const LIST_TTL = 6 * 3_600_000;
const DETAIL_TTL = 12 * 3_600_000;

export async function getWantedList(): Promise<{ people: WantedPerson[]; fetchedAt: Date | null; error: string | null }> {
  if (store.list && Date.now() - store.list.at < LIST_TTL) {
    return { people: store.list.people, fetchedAt: new Date(store.list.at), error: null };
  }
  try {
    if (!store.inflight) {
      store.inflight = (async () => {
        const res = await sapsGet(SAPS_LIST_URL);
        if (res.status !== 200) throw new Error(`saps.gov.za responded with ${res.status}`);
        const people = parseWantedList(res.body.toString("utf8"));
        if (people.length === 0) throw new Error("The SAPS page format has changed");
        return { at: Date.now(), people };
      })().finally(() => {
        store.inflight = undefined;
      });
    }
    store.list = await store.inflight;
    return { people: store.list.people, fetchedAt: new Date(store.list.at), error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (store.list) return { people: store.list.people, fetchedAt: new Date(store.list.at), error: message };
    return { people: [], fetchedAt: null, error: message };
  }
}

export async function getWantedDetail(bid: string): Promise<WantedDetail | null> {
  if (!/^\d{1,8}$/.test(bid)) return null;
  const cached = store.details.get(bid);
  if (cached && Date.now() - cached.at < DETAIL_TTL) return cached.data;
  const res = await sapsGet(sapsDetailUrl(bid));
  if (res.status !== 200) return null;
  const data = parseWantedDetail(bid, res.body.toString("utf8"));
  if (data) {
    if (store.details.size > 400) store.details.clear();
    store.details.set(bid, { at: Date.now(), data });
  }
  return data;
}

export function nameTokens(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s'-]/g, " ")
    .split(/[\s'-]+/)
    .filter((t) => t.length >= 2);
}

/** Conservative match: every surname token and at least one first name must appear. */
export function findNameMatches(name: string, people: WantedPerson[]): WantedPerson[] {
  const query = nameTokens(name);
  if (query.length < 2) return [];
  return people
    .filter((p) => {
      const surname = nameTokens(p.surname);
      const first = nameTokens(p.firstNames);
      return surname.length > 0 && surname.every((t) => query.includes(t)) && first.some((t) => query.includes(t));
    })
    .slice(0, 3);
}

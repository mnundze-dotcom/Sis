/**
 * In-browser number-plate reader built on Tesseract.js (loaded on demand from jsDelivr,
 * so nothing is uploaded to our servers). Accuracy depends on light and angle, so the UI
 * always asks the user to confirm the characters before a check is run.
 */

type TesseractWorker = {
  setParameters(params: Record<string, string>): Promise<unknown>;
  recognize(image: HTMLCanvasElement): Promise<{ data: { text: string; confidence: number } }>;
  terminate(): Promise<unknown>;
};
type TesseractLib = {
  createWorker(langs?: string, oem?: number, options?: Record<string, unknown>): Promise<TesseractWorker>;
};

declare global {
  interface Window {
    Tesseract?: TesseractLib;
  }
}

const TESSERACT_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js";
let libPromise: Promise<TesseractLib> | null = null;
let workerPromise: Promise<TesseractWorker> | null = null;

function loadTesseract(): Promise<TesseractLib> {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (!libPromise) {
    libPromise = new Promise<TesseractLib>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TESSERACT_SRC;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Reader failed to start")));
      script.onerror = () => {
        libPromise = null;
        reject(new Error("Reader failed to load"));
      };
      document.head.appendChild(script);
    });
  }
  return libPromise;
}

function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = loadTesseract()
      .then((T) => T.createWorker("eng", 1))
      .catch((err: unknown) => {
        workerPromise = null;
        throw err;
      });
  }
  return workerPromise;
}

const PROVINCE_WORDS = /(GAUTENG|WESTERNCAPE|KWAZULUNATAL|EASTERNCAPE|FREESTATE|LIMPOPO|MPUMALANGA|NORTHWEST|NORTHERNCAPE|SOUTHAFRICA|RSA)/g;
const PLATE_PATTERNS = [
  /^[A-Z]{2}\d{2}[A-Z]{2}(GP|ZN|EC|FS|MP|NW|NC|WP|L)$/,
  /^[A-Z]{3}\d{3}(GP|ZN|EC|FS|MP|NW|NC|L)$/,
  /^C[A-Z]{1,2}\d{3,6}$/,
  /^N[A-Z]{1,2}\d{3,6}$/,
  /^[A-Z0-9]{2,7}(GP|ZN|EC|FS|MP|NW|NC|WP|L)$/,
];

function score(candidate: string): number {
  let s = 0;
  if (candidate.length >= 5 && candidate.length <= 10) s += 2;
  if (/[A-Z]/.test(candidate) && /\d/.test(candidate)) s += 3;
  if (PLATE_PATTERNS.some((p) => p.test(candidate))) s += 5;
  return s - Math.abs(8 - candidate.length) * 0.2;
}

export function rankCandidates(raw: string): string[] {
  const found = new Set<string>();
  for (const line of raw.toUpperCase().split(/\n+/)) {
    const joined = line.replace(/[^A-Z0-9]/g, "").replace(PROVINCE_WORDS, "");
    if (joined.length >= 4) found.add(joined.slice(0, 10));
    for (const token of line.split(/\s+/)) {
      const t = token.replace(/[^A-Z0-9]/g, "").replace(PROVINCE_WORDS, "");
      if (t.length >= 4) found.add(t.slice(0, 10));
    }
  }
  return [...found].sort((a, b) => score(b) - score(a));
}

function otsu(hist: number[], total: number): number {
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0;
  let weightB = 0;
  let best = 0;
  let threshold = 128;
  for (let t = 0; t < 256; t++) {
    weightB += hist[t];
    if (!weightB) continue;
    const weightF = total - weightB;
    if (!weightF) break;
    sumB += t * hist[t];
    const between = weightB * weightF * (sumB / weightB - (sum - sumB) / weightF) ** 2;
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Grayscale + contrast stretch (+ Otsu binarisation for tight plate crops), with a white margin. */
function enhance(source: HTMLCanvasElement, binarize: boolean): HTMLCanvasElement {
  let scale = 1;
  if (binarize && source.width < 1000) scale = 1000 / source.width;
  if (source.width * scale > 1800) scale = 1800 / source.width;
  const pad = 24;
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w + pad * 2;
  canvas.height = h + pad * 2;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, pad, pad, w, h);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  const gray = new Uint8ClampedArray(canvas.width * canvas.height);
  let min = 255;
  let max = 0;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = (d[i] * 299 + d[i + 1] * 587 + d[i + 2] * 114) / 1000;
    gray[j] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1, max - min);
  const hist = new Array<number>(256).fill(0);
  for (let j = 0; j < gray.length; j++) {
    gray[j] = ((gray[j] - min) * 255) / range;
    hist[gray[j]]++;
  }
  const threshold = binarize ? otsu(hist, gray.length) : 0;
  for (let i = 0, j = 0; i < d.length; i += 4, j++) {
    const v = binarize ? (gray[j] > threshold ? 255 : 0) : gray[j];
    d[i] = v;
    d[i + 1] = v;
    d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export async function recognizePlate(
  source: HTMLCanvasElement,
  mode: "line" | "sparse",
): Promise<{ text: string; candidates: string[]; confidence: number }> {
  const worker = await getWorker();
  await worker.setParameters({
    tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ",
    tessedit_pageseg_mode: mode === "line" ? "7" : "11",
  });
  const { data } = await worker.recognize(enhance(source, mode === "line"));
  const candidates = rankCandidates(data.text);
  return { text: candidates[0] ?? "", candidates, confidence: data.confidence };
}

/** Crops the part of an object-cover <video> that sits under `frame`. */
export function cropVideoToElement(video: HTMLVideoElement, frame: HTMLElement): HTMLCanvasElement {
  const vr = video.getBoundingClientRect();
  const fr = frame.getBoundingClientRect();
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const scale = Math.max(vr.width / vw, vr.height / vh);
  const offX = (vr.width - vw * scale) / 2;
  const offY = (vr.height - vh * scale) / 2;
  const sx = Math.max(0, (fr.left - vr.left - offX) / scale);
  const sy = Math.max(0, (fr.top - vr.top - offY) / scale);
  const sw = Math.min(vw - sx, fr.width / scale);
  const sh = Math.min(vh - sy, fr.height / scale);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw));
  canvas.height = Math.max(1, Math.round(sh));
  canvas.getContext("2d")?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export async function fileToCanvas(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fileToJpegDataUrl(file: File, maxSide = 720, quality = 0.78): Promise<string> {
  const canvas = await fileToCanvas(file, maxSide);
  return canvas.toDataURL("image/jpeg", quality);
}

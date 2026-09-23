"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImagePlus, LoaderCircle, X } from "lucide-react";
import { cropVideoToElement, fileToCanvas, recognizePlate } from "@/lib/ocr";
import { buttonClass } from "./ui";

export type PlateRead = { text: string; candidates: string[]; method: "camera" | "photo" };

/** "Scan with camera" + "Upload photo" buttons that read a plate on-device. */
export function PlateReaderButtons({ onRead, onStatus }: { onRead: (read: PlateRead) => void; onStatus?: (message: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    setBusy(true);
    onStatus?.("Reading the plate from your photo… the first scan downloads the reader (about 5 MB).");
    try {
      const canvas = await fileToCanvas(file, 1800);
      const result = await recognizePlate(canvas, "sparse");
      if (result.text) {
        onRead({ text: result.text, candidates: result.candidates, method: "photo" });
      } else {
        onStatus?.("We couldn't find a plate in that photo. Try a closer, straight-on shot — or type it in.");
      }
    } catch {
      onStatus?.("The plate reader couldn't load. Check your connection, or type the plate instead.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "md", "w-full")}>
          <Camera strokeWidth={1.75} />
          Scan plate
        </button>
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className={buttonClass("secondary", "md", "w-full")}>
          {busy ? <LoaderCircle className="animate-spin" /> : <ImagePlus strokeWidth={1.75} />}
          {busy ? "Reading…" : "From photo"}
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void readFile(file);
        }}
      />
      {open && (
        <CameraSheet
          onClose={() => setOpen(false)}
          onRead={(text, candidates) => {
            setOpen(false);
            onRead({ text, candidates, method: "camera" });
          }}
        />
      )}
    </>
  );
}

function CameraSheet({ onClose, onRead }: { onClose: () => void; onRead: (text: string, candidates: string[]) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"starting" | "live" | "reading" | "failed">("starting");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState("failed");
        setNote("This browser can't open the camera here. Use “From photo” instead.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setState("live");
      } catch {
        setState("failed");
        setNote("Camera access was blocked. Allow camera access in your browser settings, or use “From photo”.");
      }
    }
    void start();

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function capture() {
    const video = videoRef.current;
    const frame = frameRef.current;
    if (!video || !frame || !video.videoWidth) return;
    setState("reading");
    setNote("Reading plate… the first scan downloads the reader (about 5 MB).");
    try {
      const result = await recognizePlate(cropVideoToElement(video, frame), "line");
      if (result.text.length >= 4) {
        onRead(result.text, result.candidates);
        return;
      }
      setNote("Couldn't read that. Fill the frame with the plate, avoid glare and hold steady.");
    } catch {
      setNote("The plate reader couldn't load. Check your connection, or type the plate.");
    }
    setState("live");
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-plum-950" role="dialog" aria-modal="true" aria-label="Scan number plate">
      <div className="flex items-center justify-between px-5 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <div>
          <p className="font-display text-[28px] leading-none">Scan the plate</p>
          <p className="mt-1.5 text-[13px] text-white/60">Line the plate up inside the frame.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close camera" className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div ref={frameRef} className="relative aspect-[3.6/1] w-[86%] max-w-xl rounded-xl shadow-[0_0_0_9999px_rgba(20,8,30,0.6)]">
            <span className="absolute -left-0.5 -top-0.5 h-6 w-6 rounded-tl-xl border-l-[3px] border-t-[3px] border-blush-400" />
            <span className="absolute -right-0.5 -top-0.5 h-6 w-6 rounded-tr-xl border-r-[3px] border-t-[3px] border-blush-400" />
            <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-xl border-b-[3px] border-l-[3px] border-blush-400" />
            <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-xl border-b-[3px] border-r-[3px] border-blush-400" />
            {state === "reading" && <span className="absolute inset-x-4 top-1/2 h-px animate-pulse bg-blush-300" />}
          </div>
        </div>
        {state === "starting" && (
          <div className="absolute inset-0 grid place-items-center text-white/70">
            <LoaderCircle className="h-6 w-6 animate-spin" />
          </div>
        )}
      </div>

      <div className="space-y-3 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-4">
        {note && <p className="text-center text-[13px] leading-relaxed text-white/75">{note}</p>}
        <button type="button" onClick={capture} disabled={state !== "live"} className={buttonClass("accent", "lg", "w-full")}>
          {state === "reading" ? <LoaderCircle className="animate-spin" /> : <Camera />}
          {state === "reading" ? "Reading plate…" : "Capture plate"}
        </button>
      </div>
    </div>,
    document.body,
  );
}

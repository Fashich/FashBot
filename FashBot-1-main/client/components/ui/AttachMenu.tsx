import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Paperclip, X } from "lucide-react";
import { toast } from "sonner";

type Props = {
  onImage: () => void;
  onVideo: () => void;
  onDoc: () => void;
  onAudio: () => void;
};

export default function AttachMenu({
  onImage,
  onVideo,
  onDoc,
  onAudio,
}: Props) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    // compute position relative to button
    const el = btnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ left: Math.max(8, r.left), top: r.bottom + 8 });
    }

    // close on any mousedown outside (capture) to avoid race with opening click
    const onDown = (ev: MouseEvent) => {
      const t = ev.target as Node | null;
      if (t && (menuRef.current?.contains(t) || btnRef.current?.contains(t)))
        return;
      setOpen(false);
    };

    window.addEventListener("mousedown", onDown, true);
    return () => window.removeEventListener("mousedown", onDown, true);
  }, [open]);

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-full border-dashed px-3 py-1 text-xs"
        onMouseUp={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Paperclip className="h-4 w-4" /> Lampirkan
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                left: pos?.left ?? 0,
                top: pos?.top ?? 0,
                width: 224,
              }}
              className="z-50 rounded-md border bg-popover p-2 text-popover-foreground shadow-md relative"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Tutup menu lampiran"
                onClick={() => setOpen(false)}
                className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 hover:text-foreground focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="px-2 py-1 text-xs font-semibold">
                Pilih jenis lampiran
              </div>
              <div className="my-1 h-px bg-muted" />
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  onImage();
                  setOpen(false);
                }}
              >
                Gambar (maks 5MB per file)
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  onVideo();
                  setOpen(false);
                }}
              >
                Video (total maks 100MB)
              </button>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                onClick={(e) => {
                  e.preventDefault();
                  onDoc();
                  setOpen(false);
                }}
              >
                Dokumen (maks 20MB per file)
              </button>
              <div className="my-1 h-px bg-muted" />
              <button
                className="w-full text-left px-3 py-2 text-sm opacity-60"
                onClick={(e) => {
                  e.preventDefault();
                  toast("Voice attachment coming soon");
                  onAudio();
                  setOpen(false);
                }}
                aria-disabled
              >
                Suara (coming soon, maks 5MB per file)
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

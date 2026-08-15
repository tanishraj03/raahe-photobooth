"use client";

import { EVENT } from "@/lib/config/event";

/** e.g. raahe-open-mic-22082026.jpg */
export function stripFilename(): string {
  return `${EVENT.fileStem}-${EVENT.date.replace(/\D/g, "")}.jpg`;
}

/**
 * Whether this browser can hand an image file to the system share
 * sheet. Desktop Firefox and older Safari can't, so we check rather
 * than assume and end up with a button that does nothing.
 */
export function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const probe = new File([new Blob([])], "probe.jpg", { type: "image/jpeg" });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

export type SaveOutcome = "saved" | "opened" | "failed";

/** Saves the strip to the device. */
export function downloadImage(blob: Blob, filename: string): SaveOutcome {
  let url: string | null = null;
  try {
    url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser time to start the download before we let go.
    setTimeout(() => url && URL.revokeObjectURL(url), 10_000);
    return "saved";
  } catch {
    // Last resort: show the image on its own so it can be saved by hand.
    try {
      if (!url) url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener");
      return "opened";
    } catch {
      return "failed";
    }
  }
}

export type ShareOutcome = "shared" | "cancelled" | "unsupported" | "failed";

/** Opens the system share sheet with the strip attached. */
export async function shareImage(
  blob: Blob,
  filename: string,
): Promise<ShareOutcome> {
  if (!canShareFiles()) return "unsupported";
  try {
    const file = new File([blob], filename, {
      type: blob.type || "image/jpeg",
    });
    await navigator.share({
      files: [file],
      title: `${EVENT.name} photobooth`,
      text: `${EVENT.name} · ${EVENT.venue}`,
    });
    return "shared";
  } catch (error) {
    const name =
      typeof error === "object" && error !== null && "name" in error
        ? String((error as { name: unknown }).name)
        : "";
    // Closing the share sheet is a normal thing to do, not a failure.
    if (name === "AbortError" || name === "NotAllowedError") return "cancelled";
    return "failed";
  }
}
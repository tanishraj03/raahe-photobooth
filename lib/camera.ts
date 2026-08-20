"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* ================================================================
   PROBLEMS
   Everything that can go wrong, and what we say about it.
   Copy is written for someone at a gig, not for a developer.
   ================================================================ */

export type CameraProblem =
  | "denied"
  | "notfound"
  | "inuse"
  | "insecure"
  | "unsupported"
  | "unknown";

export const CAMERA_MESSAGES: Record<
  CameraProblem,
  { title: string; body: string; action: string }
> = {
  denied: {
    title: "camera is off",
    body: "Your browser is blocking the camera for this page. Open the site settings — usually the icon on the left of the address bar — allow the camera, then reload.",
    action: "Try again",
  },
  notfound: {
    title: "no camera here",
    body: "This device doesn't seem to have a camera we can use. Try opening the photobooth on your phone.",
    action: "Try again",
  },
  inuse: {
    title: "camera is busy",
    body: "Another app or tab already has the camera. Close it, then come back.",
    action: "Try again",
  },
  insecure: {
    title: "needs a secure link",
    body: "Cameras only work over https. Open the photobooth using its https address.",
    action: "Try again",
  },
  unsupported: {
    title: "browser can't do this",
    body: "This browser can't open the camera. Chrome or Safari will work.",
    action: "Try again",
  },
  unknown: {
    title: "camera didn't start",
    body: "Something stopped the camera from opening. One more try usually sorts it.",
    action: "Try again",
  },
};

function classify(err: unknown): CameraProblem {
  const name =
    typeof err === "object" && err !== null && "name" in err
      ? String((err as { name: unknown }).name)
      : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "notfound";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "inuse";
    default:
      return "unknown";
  }
}

/* ================================================================
   MIRRORING
   Selfie cameras are mirrored so you move the way you expect.
   Rear cameras are not.
   ================================================================ */

function isFrontFacing(track: MediaStreamTrack): boolean {
  const settings = track.getSettings() as { facingMode?: string };
  if (settings.facingMode === "environment") return false;
  if (settings.facingMode === "user") return true;

  const label = track.label.toLowerCase();
  if (/back|rear|environment|world/.test(label)) return false;

  // Laptop webcams and anything unlabelled: mirror it. Feels natural.
  return true;
}

/* ================================================================
   THE HOOK
   ================================================================ */

export type CameraStatus = "idle" | "starting" | "ready" | "error";

/**
 * Constraint sets tried in order. If a phone rejects the detailed
 * request we fall back to something plainer rather than failing.
 */
function constraintsFor(
  facing: "user" | "environment",
  deviceId?: string,
  strict = false,
): MediaStreamConstraints[] {
  if (deviceId) {
    // A named camera has no sane fallback. Dropping to `{}` here would
    // hand back whichever camera the browser felt like — usually the
    // one we were already on — and `open` would report success for a
    // switch that never happened.
    return [
      { deviceId: { exact: deviceId }, width: { ideal: 1920 } },
      { deviceId: { exact: deviceId } },
    ].map((video) => ({ video, audio: false }));
  }

  if (strict) {
    // `exact`, so a phone that can't give us that side *fails* instead
    // of quietly handing back the camera we're already on. Used by the
    // flip, where "the other one" is the whole request.
    return [
      {
        facingMode: { exact: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
      { facingMode: { exact: facing } },
    ].map((video) => ({ video, audio: false }));
  }

  const base: MediaTrackConstraints[] = [
    {
      facingMode: { ideal: facing },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    { facingMode: { ideal: facing } },
  ];

  return [...base, {}].map((video) => ({
    video: Object.keys(video).length ? video : true,
    audio: false,
  }));
}

/* ================================================================
   TORCH

   Some phones will let a web page turn the camera light on, most
   won't, and no desktop will. It is an optional constraint on the
   live track, so the only honest way to know is to ask the track
   what it can do — and to carry on regardless if the answer is no.
   ================================================================ */

function trackSupportsTorch(track: MediaStreamTrack | undefined): boolean {
  if (!track?.getCapabilities) return false;
  try {
    const capabilities = track.getCapabilities() as MediaTrackCapabilities & {
      torch?: boolean;
    };
    return capabilities.torch === true;
  } catch {
    return false;
  }
}

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const indexRef = useRef(0);
  /** Which side of the phone we believe we're on. */
  const facingRef = useRef<"user" | "environment">("user");

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [problem, setProblem] = useState<CameraProblem | null>(null);
  const [mirrored, setMirrored] = useState(true);
  const [cameraCount, setCameraCount] = useState(0);
  const [hasTorch, setHasTorch] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const open = useCallback(
    async (
      facing: "user" | "environment" = "user",
      deviceId?: string,
      strict = false,
    ) => {
      if (typeof navigator === "undefined") return false;

      if (!navigator.mediaDevices?.getUserMedia) {
        setProblem(window.isSecureContext ? "unsupported" : "insecure");
        setStatus("error");
        return false;
      }

      setStatus("starting");
      setProblem(null);
      stop();

      let lastError: unknown = null;

      for (const constraints of constraintsFor(facing, deviceId, strict)) {
        try {
          const stream =
            await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;

          const track = stream.getVideoTracks()[0];
          if (track) {
            const front = isFrontFacing(track);
            setMirrored(front);
            // Believe the track, not what we asked for.
            facingRef.current = front ? "user" : "environment";
          }
          // Asked fresh every time, because the front camera on a
          // phone usually has no light even when the back one does.
          setHasTorch(trackSupportsTorch(track));

          const video = videoRef.current;
          if (video) {
            video.srcObject = stream;
            try {
              await video.play();
            } catch {
              // Some browsers start playback on their own. Not fatal.
            }
          }

          // Device labels only become readable once permission is given,
          // so this is the first moment we can count the cameras.
          try {
            const all = await navigator.mediaDevices.enumerateDevices();
            const cams = all.filter((d) => d.kind === "videoinput");
            devicesRef.current = cams;
            setCameraCount(cams.length);

            const track0 = stream.getVideoTracks()[0];
            // Safari doesn't always put a deviceId on the track. Fall
            // back to the one we asked for, then to the label.
            const activeId = track0?.getSettings().deviceId || deviceId;
            let found = activeId
              ? cams.findIndex((c) => c.deviceId === activeId)
              : -1;
            if (found < 0 && track0?.label) {
              found = cams.findIndex((c) => c.label === track0.label);
            }
            // Only move the pointer when we actually know where we are.
            // Snapping to 0 on an unknown is what made the first tap of
            // "switch camera" reopen the camera it was already on, so it
            // took two taps to appear to work.
            if (found >= 0) indexRef.current = found;
          } catch {
            devicesRef.current = [];
            setCameraCount(0);
          }

          setStatus("ready");
          return true;
        } catch (err) {
          lastError = err;
          // Permission refusal will not improve with looser constraints.
          if (classify(err) === "denied") break;
        }
      }

      setProblem(classify(lastError));
      setStatus("error");
      return false;
    },
    [stop],
  );

  /**
   * Turn the camera round.
   *
   * Ask for the *other side* by name first. This matters on phones: a
   * modern handset lists four or five video inputs — front, then wide,
   * ultra-wide and telephoto on the back — so walking a device index
   * one step doesn't get you "the other camera", it gets you the next
   * lens in an order nobody can predict. That's what made the first tap
   * land back on the front camera and the second tap finally reach the
   * back one.
   *
   * Device cycling stays as the fallback, for desktops and webcams that
   * have no facingMode at all.
   */
  const flip = useCallback(async () => {
    const next = facingRef.current === "user" ? "environment" : "user";

    if (await open(next, undefined, true)) return;

    const cams = devicesRef.current;
    if (cams.length < 2) {
      // Nothing to fall back to. Reopen what we had so we don't leave
      // the screen black after a failed switch.
      await open(facingRef.current);
      return;
    }

    const previous = indexRef.current;
    const nextIndex = (previous + 1) % cams.length;
    indexRef.current = nextIndex;

    const ok = await open(facingRef.current, cams[nextIndex].deviceId);
    if (!ok) {
      indexRef.current = previous;
      await open(facingRef.current, cams[previous].deviceId);
    }
  }, [open]);

  /**
   * Turns the camera light on or off. Resolves to what actually
   * happened, so a caller can fall back to lighting the screen
   * instead of pretending the phone has a flash.
   */
  const setTorch = useCallback(async (on: boolean): Promise<boolean> => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!trackSupportsTorch(track) || !track) return false;
    try {
      await track.applyConstraints({
        advanced: [{ torch: on } as MediaTrackConstraintSet & { torch: boolean }],
      });
      return true;
    } catch {
      // The device said it could and then wouldn't. Nothing to do
      // but carry on with the screen flash.
      return false;
    }
  }, []);

  // Release the camera when the screen goes away, so the light turns off.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    status,
    problem,
    mirrored,
    canFlip: cameraCount > 1,
    /** Whether this camera has a light we're allowed to switch on. */
    hasTorch,
    open,
    stop,
    flip,
    setTorch,
  };
}
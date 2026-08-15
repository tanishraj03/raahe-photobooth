"use client";

import { useState } from "react";
import CameraScreen from "./screens/CameraScreen";
import HomeScreen from "./screens/HomeScreen";
import ResultScreen from "./screens/ResultScreen";

/**
 * The whole photobooth is one page that swaps between screens.
 * No routing, no navigation — you go forward or you start over.
 */
type Stage =
  | { name: "home" }
  | { name: "camera" }
  | { name: "result"; photos: string[] };

export default function Page() {
  const [stage, setStage] = useState<Stage>({ name: "home" });

  switch (stage.name) {
    case "camera":
      return (
        <CameraScreen
          onComplete={(photos) => setStage({ name: "result", photos })}
          onExit={() => setStage({ name: "home" })}
        />
      );

    case "result":
      return (
        <ResultScreen
          photos={stage.photos}
          onRetake={() => setStage({ name: "camera" })}
          onExit={() => setStage({ name: "home" })}
        />
      );

    default:
      return <HomeScreen onStart={() => setStage({ name: "camera" })} />;
  }
}
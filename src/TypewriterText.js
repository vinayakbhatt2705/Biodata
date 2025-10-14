import React, { useEffect, useState } from "react";

export default function TypewriterText({ text, speed = 60, withSound = true }) {
  const [displayed, setDisplayed] = useState("");
  const [audio] = useState(() => new Audio("/sounds/key.mp3")); // small click sound

  useEffect(() => {
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        const char = text[i];
        setDisplayed((prev) => prev + char);

        // play sound only for visible characters
        if (withSound && char.trim() !== "") {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, withSound, audio]);

  return <span>{displayed}</span>;
}

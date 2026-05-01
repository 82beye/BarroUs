"use client";

import { useEffect, useRef, useState } from "react";

// 모듈 전역 audio 객체 — 한 번에 1곡만 재생되도록 공유
let sharedAudio: HTMLAudioElement | null = null;
let activeNodeId: string | null = null;
const subscribers = new Set<(activeId: string | null) => void>();

function setActive(nodeId: string | null) {
  activeNodeId = nodeId;
  for (const s of subscribers) s(activeNodeId);
}

function getAudio(): HTMLAudioElement {
  if (sharedAudio) return sharedAudio;
  sharedAudio = new Audio();
  sharedAudio.preload = "none";
  // 30초 cap (Spotify preview는 보통 30초지만 안전망)
  sharedAudio.addEventListener("timeupdate", () => {
    if (sharedAudio && sharedAudio.currentTime >= 30) {
      sharedAudio.pause();
      sharedAudio.currentTime = 0;
      setActive(null);
    }
  });
  sharedAudio.addEventListener("ended", () => setActive(null));
  return sharedAudio;
}

type Props = {
  nodeId: string;
  previewUrl: string | null;
  spotifyUrl: string | null;
};

export default function PreviewButton({ nodeId, previewUrl, spotifyUrl }: Props) {
  const [active, setActiveState] = useState(activeNodeId === nodeId);
  const ownNodeId = useRef(nodeId);

  useEffect(() => {
    ownNodeId.current = nodeId;
  }, [nodeId]);

  useEffect(() => {
    const sub = (id: string | null) => setActiveState(id === ownNodeId.current);
    subscribers.add(sub);
    return () => {
      subscribers.delete(sub);
    };
  }, []);

  if (!previewUrl) {
    if (!spotifyUrl) {
      return (
        <span className="text-xs text-neutral-600" title="미리듣기 없음">
          —
        </span>
      );
    }
    return (
      <a
        href={spotifyUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300 transition hover:bg-neutral-900"
      >
        Spotify에서 듣기
      </a>
    );
  }

  const handleClick = () => {
    const audio = getAudio();
    if (active) {
      audio.pause();
      audio.currentTime = 0;
      setActive(null);
      return;
    }
    audio.src = previewUrl;
    audio.currentTime = 0;
    audio.play().catch((err) => {
      console.error("audio play failed", err);
      setActive(null);
    });
    setActive(nodeId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={active ? "정지" : "30초 미리듣기"}
      className="flex size-8 items-center justify-center rounded-full bg-neutral-800 text-sm transition hover:bg-neutral-700"
    >
      {active ? "■" : "▶"}
    </button>
  );
}

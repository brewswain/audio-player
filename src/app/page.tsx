"use client";

import React, { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";
import { convertFileSrc } from "@tauri-apps/api/core";
const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  // const handlePlay = async () => {
  //   try {
  //     const filePath = await join(
  //       "C:\\Users\\Blee\\Important\\Code\\tauri\\audio-player\\src-tauri\\assets",
  //       "test.mp3"
  //     );
  //     console.log("Invoking play_audio command with filePath:", filePath);
  //     // const audioDataUrl: string = await invoke("play_audio", { filePath });
  //     // console.log("Audio data URL received from Rust: ", audioDataUrl);
  //     // console.log({ assetUrl });
  //     if (audioRef.current) {
  //       const assetUrl = convertFileSrc(filePath);
  //       console.log({ assetUrl });
  //       audioRef.current.src = filePath;

  //       // audioRef.current.src = audioDataUrl;
  //       audioRef.current.play();
  //       setIsPlaying(true);
  //     }
  //   } catch (error) {
  //     console.error("Error playing audio:", error);
  //   }
  // };

  // const handlePlay = async () => {
  //   try {
  //     const filePath = "test.mp3";
  //     console.log("Invoking play_audio command with filePath:", filePath);
  //     const fileName = await invoke("play_audio", { filePath });
  //     console.log("File name returned from Rust:", fileName);

  //     if (audioRef.current) {
  //       const assetUrl = convertFileSrc(fileName as string);
  //       console.log("Converted Asset URL:", assetUrl);
  //       audioRef.current.src = assetUrl;
  //       audioRef.current.play();
  //       setIsPlaying(true);
  //     }
  //   } catch (error) {
  //     console.error("Error playing audio:", error);
  //   }
  // };

  // base64 implementation
  const handlePlay = async () => {
    try {
      const filePath = "test.mp3";
      console.log("Invoking play_audio command with filePath:", filePath);
      const audioDataUrl = await invoke("play_audio", { filePath });
      console.log("Audio data URL received from Rust");

      if (audioRef.current) {
        audioRef.current.src = audioDataUrl as string;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };
  const handleCheckStatus = async () => {
    try {
      const status: boolean = await invoke("check_playback_status");
      setPlaybackStatus(status ? "Playing" : "Not Playing");
    } catch (error) {
      console.error("Error checking playback status:", error);
      setPlaybackStatus("Error checking status");
    }
  };

  return (
    <div>
      <h2>Simple Audio Player</h2>
      <button onClick={handlePlay} disabled={isPlaying}>
        {isPlaying ? "Playing..." : "Play"}
      </button>
      <button onClick={handleCheckStatus}>Check Status</button>
      {playbackStatus && <p>Playback Status: {playbackStatus}</p>}
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
    </div>
  );
};

export default AudioPlayer;

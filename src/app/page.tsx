"use client";

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState("");
  const [volume, setVolume] = useState(50);

  const handlePlay = async () => {
    try {
      const filePath = "test.mp3";

      setIsPlaying(true);
      await invoke("play_audio", { filePath });
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
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
  const pauseSong = async () => {
    await invoke("pause_audio");
    setIsPlaying(false);
  };

  const changeVolume = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const targetVolume = parseInt(event.target.value);
      const volumeFloat = targetVolume / 100;

      console.log(volumeFloat);

      setVolume(targetVolume);
      await invoke("set_volume", { volume: volumeFloat });
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  };

  useEffect(() => {
    return () => {
      pauseSong();
    };
  }, []);

  return (
    <div>
      <h2>Simple Audio Player</h2>
      <button onClick={isPlaying ? pauseSong : handlePlay}>
        {isPlaying ? "Playing..." : "Play"}
      </button>
      <button onClick={handleCheckStatus}>Check Status</button>
      {playbackStatus && <p>Playback Status: {playbackStatus}</p>}

      <input
        type="range"
        name=""
        className=""
        min="0"
        max="100"
        value={volume}
        onChange={changeVolume}
      />
    </div>
  );
};

export default AudioPlayer;

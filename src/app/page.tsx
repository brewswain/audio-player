"use client";

import { LibraryViewComponent } from "@/components/library-view";
import { invoke } from "@tauri-apps/api/core";
import React, { useEffect, useState } from "react";
import { SongMetaData } from "./types/SongsData";

const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState("");
  const [volume, setVolume] = useState(50);
  const [songs, setSongs] = useState<SongMetaData[]>([]);

  const handlePlay = async (filePath: string) => {
    try {
      setIsPlaying(true);
      const volumeFloat = volume > 1.0 ? volume / 100 : volume;
      console.log({ volumeFloat });
      await invoke("play_audio", { filePath, volume: volumeFloat });
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

      setVolume(targetVolume);
      await invoke("set_volume", { volume: volumeFloat });
    } catch (error) {
      console.error("Error setting volume:", error);
    }
  };

  const getSongsList = async () => {
    try {
      const songsList = await invoke<SongMetaData[]>("get_song_list");
      setSongs(songsList);
    } catch (error) {
      console.error("Error getting songs list:", error);
    }
  };

  useEffect(() => {
    getSongsList();
    return () => {
      pauseSong();
    };
  }, []);

  return <LibraryViewComponent />;
};

export default AudioPlayer;

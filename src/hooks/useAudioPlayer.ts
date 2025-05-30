import { useAudioStore } from "@/zustand/useAudioStore";
import { invoke } from "@tauri-apps/api/core";
import { useCallback } from "react";

interface UseAudioPlayerArgs {
  currentSongDurationRef: React.MutableRefObject<number>;
  currentSongIndexRef: React.MutableRefObject<number>;
}

export const useAudioPlayer = ({
  currentSongDurationRef,
  currentSongIndexRef,
}: UseAudioPlayerArgs) => {
  const {
    songs,
    timer,
    volume,
    setVolume,
    currentPosition,
    setCurrentPosition,
    setIsPlaying,
    setCurrentSong,
    setTimer,
    incrementPosition,
  } = useAudioStore();

  const startTimer = useCallback(() => {
    if (timer) clearInterval(timer);
    const newTimer = setInterval(() => {
      const newPosition = incrementPosition();
      const songDuration = currentSongDurationRef.current;
      if (newPosition >= songDuration) {
        clearInterval(newTimer);
        playNextSong();
        setCurrentPosition(0);
      }
    }, 1000);
    setTimer(newTimer);
  }, [
    timer,
    setTimer,
    setCurrentPosition,
    incrementPosition,
    currentSongDurationRef,
  ]);

  const pauseSong = async () => {
    await invoke("pause_audio");
    setIsPlaying(false);
    if (timer) clearInterval(timer);
  };

  const resumeSong = async () => {
    await invoke("resume_audio");
    setIsPlaying(true);
    startTimer();
  };

  const playNextSong = useCallback(() => {
    const nextIndex = (currentSongIndexRef.current + 1) % songs.length;
    setCurrentPosition(0);
    if (timer) clearInterval(timer);
    handlePlay(songs[nextIndex].filename, nextIndex);
  }, [songs, timer, setCurrentPosition, currentSongIndexRef]);

  const handlePlay = useCallback(
    async (fileName: string, songIndex: number) => {
      try {
        setIsPlaying(true);
        const volumeFloat = volume > 1.0 ? volume / 100 : volume;
        await invoke("play_audio", { fileName, volume: volumeFloat });
        const newCurrentSong = songs[songIndex];
        setCurrentSong(newCurrentSong);
        currentSongDurationRef.current = newCurrentSong.duration;
        currentSongIndexRef.current = songIndex;
        setCurrentPosition(0);
        startTimer();
      } catch (error) {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      }
    },

    [
      volume,
      songs,
      setIsPlaying,
      setCurrentSong,
      setCurrentPosition,
      startTimer,
      currentSongDurationRef,
      currentSongIndexRef,
    ]
  );

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

  const handleSeek = async () => {
    try {
      await invoke("seek", { position: currentPosition });
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  const handleSeekChange = (value: number[]) => {
    const newPosition = value[0];
    setCurrentPosition(newPosition);
  };

  return {
    handlePlay,
    pauseSong,
    resumeSong,
    playNextSong,
    startTimer,
    changeVolume,
    handleSeek,
    handleSeekChange,
  };
};

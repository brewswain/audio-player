import { SongMetadata } from "@/app/types/SongsData";
import { create } from "zustand";

interface AudioState {
  // State
  isPlaying: boolean;
  currentPosition: number;
  currentSong: SongMetadata | null;
  volume: number;
  songs: SongMetadata[];
  timer: NodeJS.Timeout | null;
  processedImages: Record<string, string>;

  // Actions
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentPosition: (position: number) => void;
  incrementPosition: () => number;
  setCurrentSong: (song: SongMetadata | null) => void;
  setVolume: (volume: number) => void;
  setSongs: (songs: SongMetadata[]) => void;
  setTimer: (timer: NodeJS.Timeout | null) => void;
  setProcessedImages: (images: Record<string, string>) => void;
  updateProcessedImages: (newImages: Record<string, string>) => void;
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentPosition: 0,
  currentSong: null,
  volume: 50,
  songs: [],
  timer: null,
  processedImages: {},

  // Actions
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentPosition: (currentPosition) => set({ currentPosition }),
  incrementPosition: () => {
    const currentPosition = get().currentPosition;
    const newPosition = currentPosition + 1;
    set({ currentPosition: newPosition });
    return newPosition;
  },
  setCurrentSong: (currentSong) => set({ currentSong }),
  setVolume: (volume) => set({ volume }),
  setSongs: (songs) => set({ songs }),
  setTimer: (timer) => set({ timer }),
  setProcessedImages: (processedImages) => set({ processedImages }),
  updateProcessedImages: (newImages) =>
    set((state) => ({
      processedImages: { ...state.processedImages, ...newImages },
    })),
}));

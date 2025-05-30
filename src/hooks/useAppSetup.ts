import { logToServer } from "@/components/library-view.utils";
import { useAudioStore } from "@/zustand/useAudioStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { CloseRequestedEvent, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";

interface UseAppSetupProps {
  getSongsList: () => Promise<void>;
  setListHeight: (height: number) => void;
}

export const useAppSetup = ({
  getSongsList,
  setListHeight,
}: UseAppSetupProps) => {
  const { timer, currentSong, songs, processedImages, updateProcessedImages } =
    useAudioStore();

  // App initialization
  useEffect(() => {
    getSongsList();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [getSongsList]);

  // Window and event listeners setup
  useEffect(() => {
    const setupListeners = async () => {
      // Window resize handling
      const updateHeight = async () => {
        const size = await getCurrentWindow().innerSize();
        setListHeight(size.height - 200);
      };

      await updateHeight();
      const unlistenResize = getCurrentWindow().onResized(updateHeight);

      // Chunk processing listener
      const unlistenChunkProcessed = listen<Array<[string, string]>>(
        "chunk_processed",
        (event) => {
          const newImages: Record<string, string> = {};
          event.payload.forEach(([filePath, imageData]) => {
            newImages[filePath] = imageData;
          });
          updateProcessedImages(newImages);
          logToServer(
            `${Object.keys(processedImages).length} images processed`
          );
        }
      );

      // App close handling
      const handleBeforeUnload = async (event: CloseRequestedEvent) => {
        event.preventDefault();
        await logToServer("Application is shutting down");
        if (currentSong) {
          await invoke("pause_audio");
        }
        getCurrentWindow().close();
      };

      const unlistenCloseRequested =
        getCurrentWindow().onCloseRequested(handleBeforeUnload);

      return {
        unlistenResize,
        unlistenChunkProcessed,
        unlistenCloseRequested,
      };
    };

    const listenersPromise = setupListeners();

    return () => {
      listenersPromise.then(
        ({
          unlistenResize,
          unlistenChunkProcessed,
          unlistenCloseRequested,
        }) => {
          unlistenResize.then((unlisten) => unlisten());
          unlistenChunkProcessed.then((unlisten) => unlisten());
          unlistenCloseRequested.then((unlisten) => unlisten());
        }
      );
    };
  }, [
    currentSong,
    songs,
    processedImages,
    updateProcessedImages,
    setListHeight,
  ]);

  // Timer cleanup
  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  // Processed images logging
  useEffect(() => {
    if (Object.keys(processedImages).length > 0) {
      logToServer(`${Object.keys(processedImages).length} images processed`);
    }
  }, [processedImages]);
};

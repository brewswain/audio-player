"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { CloseRequestedEvent, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";

import { SongMetadata } from "@/app/types/SongsData";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Heart, Home, Library, Music, PlusCircle, Search } from "lucide-react";
import { formatDuration, logToServer } from "./library-view.utils";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/zustand/useAudioStore";
import AlbumTab from "./library-view/Albums/AlbumTab";
import ArtistTab from "./library-view/Artists/ArtistTab";
import PlaylistTab from "./library-view/Playlists/PlaylistTab";
import SongsTab from "./library-view/Songs/SongsTab";
import TabsSelector from "./library-view/TabsSelector/TabsSelector";
import MediaBar from "./MediaBar/MediaBar";

export function LibraryViewComponent() {
  const [listHeight, setListHeight] = useState(0);

  const {
    isPlaying,
    currentPosition,
    currentSong,
    songs,
    timer,
    processedImages,
    setSongs,
    updateProcessedImages,
  } = useAudioStore();

  const currentSongDurationRef = useRef<number>(0);
  const currentSongIndexRef = useRef<number>(0);

  const {
    handlePlay,
    playNextSong,
    pauseSong,
    resumeSong,
    changeVolume,
    handleSeekChange,
  } = useAudioPlayer({
    currentSongDurationRef,
    currentSongIndexRef,
  });

  // use logToServer in case our app has untoward crashes
  const getSongsList = async () => {
    try {
      const songsList = await invoke<SongMetadata[]>("get_song_list");
      setSongs(songsList);
    } catch (error) {
      console.error("Error getting songs list:", error);
    }
  };

  const handleSeek = async () => {
    try {
      await invoke("seek", { position: currentPosition });
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  useEffect(() => {
    getSongsList();
    return () => {
      pauseSong();
    };
  }, []);

  useEffect(() => {
    const updateHeight = async () => {
      const size = await getCurrentWindow().innerSize();

      setListHeight(size.height - 200);
    };

    updateHeight();

    const unlistenResize = getCurrentWindow().onResized(updateHeight);

    return () => {
      unlistenResize.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

  useEffect(() => {
    const unlistenChunkProcessed = listen<Array<[string, string]>>(
      "chunk_processed",
      (event) => {
        const newImages: Record<string, string> = {};
        event.payload.forEach(([filePath, imageData]) => {
          newImages[filePath] = imageData;
        });
        updateProcessedImages(newImages);
        logToServer(`${Object.keys(processedImages).length} images processed`);
      }
    );

    return () => {
      unlistenChunkProcessed.then((unlisten) => unlisten());
    };
  }, []);
  const logError = async (error: any) => {
    console.error("Error:", error);
    await logToServer(`Error occurred: ${error.message}`);
  };
  useEffect(() => {
    logToServer(`${Object.keys(processedImages).length} images processed`);
  }, [processedImages]);

  useEffect(() => {
    const handleBeforeUnload = async (event: CloseRequestedEvent) => {
      event.preventDefault(); // Prevent the window from closing immediately
      await logToServer("Application is shutting down");
      // Perform any cleanup here, e.g.:
      if (currentSong) {
        await invoke("pause_audio");
      }
      getCurrentWindow().close(); // Close the window after cleanup
    };

    const unlistenCloseRequested =
      getCurrentWindow().onCloseRequested(handleBeforeUnload);

    return () => {
      unlistenCloseRequested.then((unlisten) => unlisten());
    };
  }, [currentSong, songs, processedImages]); // Add any dependencies that are used in the cleanup

  const SongRow = ({ index, style }: { index: number; style: any }) => {
    const song = songs[index];
    const imageData = processedImages[song.filepath];
    return (
      <div
        style={style}
        className={`flex items-center gap-4 p-2 rounded-md ${
          song === currentSong ? "bg-slate-200" : "hover:bg-accent"
        }`}
        onDoubleClick={() => handlePlay(song.filename, index)}
      >
        <img
          src={
            imageData
              ? `data:image/jpeg;base64,${imageData}`
              : "/placeholder.svg?height=40&width=40"
          }
          alt="Song cover"
          className="w-10 h-10 rounded"
        />
        <div>
          <h4 className="font-medium">{song.title}</h4>
          <p className="text-sm text-muted-foreground">{song.artist}</p>
        </div>
        <span className="ml-auto text-muted-foreground">
          {formatDuration(song.duration)}
        </span>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1">
        <aside className="w-60 bg-card p-4 flex flex-col gap-y-4">
          <div className="flex items-center gap-x-2 mb-4">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Sonet</h1>
          </div>
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Library className="mr-2 h-4 w-4" />
              Your Library
            </Button>
          </nav>
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Playlist
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Heart className="mr-2 h-4 w-4" />
              Liked Songs
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Your Library</h2>
            <Input className="w-64" placeholder="Search your library..." />
          </div>
          <Tabs defaultValue="songs" className="w-full">
            <TabsSelector />

            <PlaylistTab />
            <ArtistTab />
            <AlbumTab />
            <SongsTab>
              <List
                height={listHeight} // Adjust based on your layout
                itemCount={songs.length}
                itemSize={60} // Adjust based on your row height
                width="100%"
              >
                {SongRow}
              </List>
            </SongsTab>
          </Tabs>
        </main>
      </div>
      <MediaBar
        currentSongDurationRef={currentSongDurationRef}
        currentSongIndexRef={currentSongIndexRef}
      />
    </div>
  );
}

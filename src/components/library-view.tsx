"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";

import { SongMetadata } from "@/app/types/SongsData";
import { invoke } from "@tauri-apps/api/core";
import { Heart, Home, Library, Music, PlusCircle, Search } from "lucide-react";
import { formatDuration, logToServer } from "./library-view.utils";

import { useAppSetup } from "@/hooks/useAppSetup";
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

  const { handlePlay, pauseSong } = useAudioPlayer({
    currentSongDurationRef,
    currentSongIndexRef,
  });

  // use logToServer in case our app has untoward crashes
  const getSongsList = async () => {
    try {
      const songsList = await invoke<SongMetadata[]>("get_song_list");

      setSongs(songsList);
      const filePaths = songsList.map((song) => song.filepath);
      await logToServer("Starting get_track_images");
      await invoke("get_track_images", { filePaths });
      await logToServer("Finished invoking get_track_images");
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

  // Hook that gets our songs list, images etc
  useAppSetup({ getSongsList, setListHeight });

  const logError = async (error: any) => {
    console.error("Error:", error);
    await logToServer(`Error occurred: ${error.message}`);
  };
  const SongRow = ({ index, style }: { index: number; style: any }) => {
    const song = songs[index];
    const imageData = processedImages[song.filepath];
    console.log({ imageData });
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

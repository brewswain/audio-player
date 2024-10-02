"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  Library,
  PlusCircle,
  Heart,
  Music,
  PlayCircle,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  PauseCircle,
} from "lucide-react";
import { SongMetaData } from "@/app/types/SongsData";
import { invoke } from "@tauri-apps/api/core";

export function LibraryViewComponent() {
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
    console.log(event.target.value);
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
      console.log({ songsList });
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
          <Tabs defaultValue="playlists" className="w-full">
            <TabsList>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="songs">Songs</TabsTrigger>
            </TabsList>
            <TabsContent value="playlists">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card rounded-lg p-4 flex flex-col items-center"
                    >
                      <img
                        src={`/placeholder.svg?height=150&width=150`}
                        alt="Playlist cover"
                        className="w-full aspect-square object-cover rounded-md mb-2"
                      />
                      <h3 className="font-semibold">Playlist {i + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(Math.random() * 100)} songs
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="artists">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="grid grid-cols-6 gap-4">
                  {[...Array(18)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <Avatar className="w-24 h-24 mb-2">
                        <AvatarImage
                          src={`/placeholder.svg?height=96&width=96`}
                          alt={`Artist ${i + 1}`}
                        />
                        <AvatarFallback>A{i + 1}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-center">
                        Artist {i + 1}
                      </h3>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="albums">
              <ScrollArea className="h-[calc(100vh-250px)]">
                <div className="grid grid-cols-5 gap-4">
                  {[...Array(15)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-card rounded-lg p-4 flex flex-col items-center"
                    >
                      <img
                        src={`/placeholder.svg?height=150&width=150`}
                        alt="Album cover"
                        className="w-full aspect-square object-cover rounded-md mb-2"
                      />
                      <h3 className="font-semibold">Album {i + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        Artist Name
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="songs">
              <ScrollArea className="h-[calc(100vh-250px)]">
                {songs
                  ? songs.map((song, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 p-2 hover:bg-accent rounded-md"
                        onDoubleClick={() => handlePlay(song.filename)}
                      >
                        <img
                          src={
                            song.image
                              ? `data:image/jpeg;base64,${song.image}`
                              : "/placeholder.svg?height=40&width=40"
                          }
                          alt="Song cover"
                          className="w-10 h-10 rounded"
                        />
                        <div>
                          <h4 className="font-medium">{song.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {song.artist}
                          </p>
                        </div>
                        <span className="ml-auto text-muted-foreground">
                          3:45
                        </span>
                      </div>
                    ))
                  : null}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <footer className="h-20 border-t bg-card flex items-center px-4">
        <div className="flex items-center gap-4 flex-1">
          <img
            src={`/placeholder.svg?height=50&width=50`}
            alt="Now playing"
            className="w-12 h-12 rounded"
          />
          <div>
            <h4 className="font-medium">Now Playing</h4>
            <p className="text-sm text-muted-foreground">Artist Name</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="default" size="icon" className="rounded-full">
              {/* <PlayCircle className="h-6 w-6" /> */}
              {isPlaying ? (
                <PauseCircle className="h-6 w-6" onClick={() => pauseSong()} />
              ) : (
                <PlayCircle className="h-6 w-6" />
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          <Slider
            defaultValue={[33]}
            max={100}
            step={1}
            className="w-[300px]"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Volume2 className="h-4 w-4" />
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            className="w-[100px]"
            onValueChange={(value) =>
              changeVolume({
                target: { value: value[0].toString() },
              } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>
      </footer>
    </div>
  );
}

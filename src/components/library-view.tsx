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
  const [currentPosition, setCurrentPosition] = useState(0);
  const [currentSong, setCurrentSong] = useState<SongMetaData | null>(null);
  const [volume, setVolume] = useState(50);
  const [songs, setSongs] = useState<SongMetaData[]>([]);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const formatDuration = (durationInSeconds: number): string => {
    const minutes = Math.floor(durationInSeconds / 60);
    const seconds = Math.floor(durationInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };
  const handlePlay = async (filePath: string, songIndex: number) => {
    try {
      setIsPlaying(true);
      const volumeFloat = volume > 1.0 ? volume / 100 : volume;
      await invoke("play_audio", { filePath, volume: volumeFloat });
      setCurrentSong(songs[songIndex]);
      setCurrentPosition(0);
      startTimer();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const startTimer = () => {
    if (timer) clearInterval(timer);
    const newTimer = setInterval(() => {
      setCurrentPosition((prevPosition) => {
        if (prevPosition >= (currentSong?.duration || 0)) {
          clearInterval(newTimer);
          return 0;
        }
        return prevPosition + 1;
      });
    }, 1000);
    setTimer(newTimer);
  };

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
      console.log({ songsList });
      setSongs(songsList);
    } catch (error) {
      console.error("Error getting songs list:", error);
    }
  };

  const handleSeek = async (value: number[]) => {
    const newPosition = value[0];
    try {
      await invoke("seek", { position: newPosition });
      setCurrentPosition(newPosition);
    } catch (error) {
      console.error("Error seeking:", error);
    }
  };

  useEffect(() => {
    getSongsList();
    return () => {
      // pauseSong();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timer]);

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
                  ? songs.map((song, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-2  rounded-md ${
                          song === currentSong
                            ? "bg-slate-200"
                            : "hover:bg-accent"
                        }`}
                        onDoubleClick={() => handlePlay(song.filename, index)}
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
                          {formatDuration(song.duration)}
                        </span>
                      </div>
                    ))
                  : null}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <footer className="h-24 border-t bg-card flex items-center px-4">
        <div
          className={`${
            currentSong ? "" : "opacity-0"
          } flex items-center gap-4 flex-1`}
        >
          <img
            src={
              currentSong?.image
                ? `data:image/jpeg;base64,${currentSong.image}`
                : "/placeholder.svg?height=40&width=40"
            }
            alt="Now playing"
            className="w-12 h-12 rounded"
          />
          <div>
            <h4 className="font-medium">{currentSong?.title}</h4>
            <p className="text-sm text-muted-foreground">
              {currentSong?.artist}
            </p>
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
                <PlayCircle className="h-6 w-6" onClick={() => resumeSong()} />
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 items-center">
            <p className={`text-xs ${currentSong ? "" : "opacity-0"}`}>
              {currentSong ? formatDuration(currentPosition) : null}
            </p>
            <Slider
              defaultValue={[currentPosition]}
              value={[currentPosition]}
              max={currentSong ? currentSong.duration : 100}
              step={1}
              className="w-[300px]"
              onValueChange={handleSeek}
            />
            <p className={`text-xs ${currentSong ? "" : "opacity-0"}`}>
              {currentSong ? formatDuration(currentSong.duration) : "1:00"}
            </p>
          </div>
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

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Search,
  Library,
  PlusCircle,
  Heart,
  Rss,
  PlayCircle,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
} from "lucide-react";

export function MusicPlayerComponent() {
  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      <div className="flex flex-1">
        <aside className="w-60 bg-card p-4 flex flex-col gap-y-4">
          <div className="flex items-center gap-x-2 mb-4">
            <PlayCircle className="h-8 w-8 text-primary" />
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
            <Button variant="ghost" className="w-full justify-start">
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
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">Trending New Hits</h2>
            <Input className="w-64" placeholder="Search..." />
          </div>
          <div className="grid grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-lg p-4 flex flex-col items-center"
              >
                <img
                  src={`/placeholder.svg?height=150&width=150`}
                  alt="Album cover"
                  className="w-full aspect-square object-cover rounded-md mb-2"
                />
                <h3 className="font-semibold">Artist Name</h3>
                <p className="text-sm text-muted-foreground">Song Title</p>
              </div>
            ))}
          </div>
          <h2 className="text-2xl font-bold mt-8 mb-4">Top Charts</h2>
          <ScrollArea className="h-[300px] rounded-md border">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 hover:bg-accent"
              >
                <span className="text-muted-foreground">{i + 1}</span>
                <img
                  src={`/placeholder.svg?height=40&width=40`}
                  alt="Album cover"
                  className="w-10 h-10 rounded"
                />
                <div>
                  <h4 className="font-medium">Song Name</h4>
                  <p className="text-sm text-muted-foreground">Artist Name</p>
                </div>
                <span className="ml-auto text-muted-foreground">3:45</span>
              </div>
            ))}
          </ScrollArea>
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
              <PlayCircle className="h-6 w-6" />
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
            defaultValue={[66]}
            max={100}
            step={1}
            className="w-[100px]"
          />
        </div>
      </footer>
    </div>
  );
}

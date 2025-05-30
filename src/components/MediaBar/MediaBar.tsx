import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/zustand/useAudioStore";
import {
  PauseCircle,
  PlayCircle,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
} from "lucide-react";
import React, { MutableRefObject } from "react";
import { formatDuration } from "../library-view.utils";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";

interface MediaBarProps {
  currentSongDurationRef: MutableRefObject<number>;
  currentSongIndexRef: MutableRefObject<number>;
}
const MediaBar = ({
  currentSongDurationRef,
  currentSongIndexRef,
}: MediaBarProps) => {
  const { isPlaying, currentPosition, currentSong, processedImages } =
    useAudioStore();
  const {
    playNextSong,
    pauseSong,
    handleSeek,
    resumeSong,
    changeVolume,
    handleSeekChange,
  } = useAudioPlayer({
    currentSongDurationRef,
    currentSongIndexRef,
  });
  return (
    <footer className="h-24 border-t bg-card flex items-center px-4">
      <div
        className={`${
          currentSong ? "" : "opacity-0"
        } flex items-center gap-4 flex-1`}
      >
        <img
          src={
            currentSong && processedImages[currentSong.filepath]
              ? `data:image/jpeg;base64,${
                  processedImages[currentSong.filepath]
                }`
              : "/placeholder.svg?height=40&width=40"
          }
          alt="Now playing"
          className="w-12 h-12 rounded"
        />
        <div>
          <h4 className="font-medium">{currentSong?.title}</h4>
          <p className="text-sm text-muted-foreground">{currentSong?.artist}</p>
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
            onValueChange={handleSeekChange}
            onValueCommit={handleSeek}
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
  );
};

export default MediaBar;

import { SongMetadata } from "@/app/types/SongsData";

export const logToServer = async (message: string) => {
  try {
    await fetch("http://localhost:1420/api/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
  } catch (error) {
    console.error("Failed to send log to server:", error);
  }
};

export const formatDuration = (durationInSeconds: number): string => {
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

interface GetSongsListProps {
  setState: React.Dispatch<React.SetStateAction<SongMetadata[]>>;
}

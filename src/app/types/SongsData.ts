export interface SongMetaData {
  filename: string;
  filepath: string;
  title?: string;
  artist?: string;
  album?: string;
  duration: number;
  image?: string | null;
}

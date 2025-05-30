-- This file should undo anything in `up.sql`
-- Drop indexes
DROP INDEX IF EXISTS idx_albums_title;
DROP INDEX IF EXISTS idx_albums_artist;

DROP INDEX IF EXISTS idx_songs_filename;
DROP INDEX IF EXISTS idx_songs_filepath;
DROP INDEX IF EXISTS idx_songs_album_id;

-- Drop tables
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS albums;

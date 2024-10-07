CREATE TABLE albums (
  id TEXT PRIMARY KEY,
  title TEXT,
  artist TEXT,
  image TEXT
);

CREATE INDEX idx_albums_title ON albums (title);
CREATE INDEX idx_albums_artist ON albums (artist);

CREATE TABLE songs (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  title TEXT,
  artist TEXT,
  image TEXT,
  album TEXT,
  duration INTEGER NOT NULL
);

CREATE INDEX idx_songs_filename ON songs (filename);
CREATE INDEX idx_songs_filepath ON songs (filepath);
CREATE INDEX idx_songs_album ON songs (album);

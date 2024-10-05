use diesel::prelude::*;
use diesel::pg;
use serde::{ Serialize, Deserialize };
use uuid::Uuid;

use crate::audio::SongMetadata;

pub struct DatabaseConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database_name: String,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            host: "localhost".to_string(),
            port: 49160,
            username: "blee".to_string(),
            password: "exposedpassword".to_string(),
            database_name: "songs.db".to_string(),
        }
    }
}

pub struct Database {
    conn: PgConnection,
}

#[derive(Serialize)]
struct Song {
    id: Option<String>,
    filename: String,
    filepath: String,
    title: Option<String>,
    artist: Option<String>,
    image: Option<String>,
    album: Option<String>,
    duration: f64,
}

impl Database {
    pub fn new(config: &DatabaseConfig) -> Result<Self, diesel::result::ConnectionError> {
        let conn_url = format!("{}:{}/{}", config.host, config.port as i32, config.database_name);
        match PgConnection::establish(&conn_url) {
            Ok(conn) => Ok(Database { conn }),
            Err(err) => Err(err.into()),
        }
    }

    pub fn insert_song(&mut self, song: &SongMetadata) -> Result<(), String> {
        let id = Uuid::new_v4().to_string();
        let params =
            serde_json::json!({
                "id": id,
                "filename": song.filename,
                "filepath": song.filepath,
                "title": song.title.as_ref().unwrap(),
                "artist": song.artist.as_ref().unwrap(),
                "album": song.album.as_ref().unwrap(),
                "duration": song.duration
            });

        let query =
            format!("INSERT INTO songs (id, filename, filepath, title, artist, album, duration) VALUES ({})", params);

        match self.conn.execute(&query) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("{}", err)),
        }
    }

    pub fn update_song_image(&mut self, song: &SongMetadata) -> Result<(), String> {
        let query = format!(
            "UPDATE songs SET image = '{}' WHERE title = '{}'",
            song.title.as_ref().unwrap(),
            song.image.as_ref().unwrap()
        );

        match self.conn.execute(&query) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("{}", err)),
        }
    }
}

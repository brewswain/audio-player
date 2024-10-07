use diesel::expression::AsExpression;
use diesel::prelude::*;
use id3::frame::UniqueFileIdentifier;
use serde::{ Serialize, Deserialize };
use uuid::Uuid;
use diesel::pg::Pg;
use diesel::prelude::*;
use diesel::pg::PgConnection;
use diesel::insert_into;
use crate::audio::SongMetadata;
use diesel::{ Queryable, Table };
use diesel::Insertable;
use diesel::expression;

use self::models::SongMetadata as SongModel;
use self::schema::songs;
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
            username: "postgres".to_string(),
            password: "ghost2543".to_string(),
            database_name: "songs.db".to_string(),
        }
    }
}

pub mod models;
pub mod schema;

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

    pub fn insert_song(&mut self, song: &SongMetadata) -> Result<(), diesel::result::Error> {
        use schema::songs::dsl::*;

        fn convert(x: f64) -> i32 {
            x.round().rem_euclid((2f64).powi(32)) as u32 as i32
        }

        let duration_expr = match song.duration {
            Some(other_duration) => convert(other_duration),
            None => 0, // or some other default value if None is expected
        };

        if
            let Err(err) = self.is_song_existing_by_metadata(
                song.filename.clone(),
                song.filepath.clone()
            )
        {
            return Err(
                diesel::result::Error::DatabaseError(
                    diesel::result::DatabaseErrorKind::UniqueViolation,
                    Box::new(String::from("Song with same metadata already exists"))
                )
            );
        }

        diesel
            ::insert_into(songs)
            .values((
                filename.eq(song.filename.clone()),
                filepath.eq(song.filepath.clone()),
                title.eq(song.title.clone()),
                artist.eq(song.artist.clone()),
                album.eq(song.album.clone()),
                duration.eq(duration_expr.clone()),
                image.eq(song.image.clone()),
            ))
            .execute(&mut self.conn)?;
        Ok(())
    }

    pub fn update_song_image(&mut self, song: &SongMetadata) -> Result<(), String> {
        let query = diesel::update(songs::table).set(song.image.into());

        match self.conn.execute(query) {
            Ok(_) => Ok(()),
            Err(err) => Err(format!("{}", err)),
        }
    }

    pub fn is_song_existing_by_metadata(
        &self,
        filename: String,
        filepath: String
    ) -> Result<bool, String> {
        let query = diesel
            ::select(songs::table)
            .filter(song.filename.eq(&filename))
            .filter(song.filepath.eq(&filepath));

        match self.conn.execute(query.as_query()) {
            Ok(result) => {
                if result.count() > 0 {
                    return Ok(true);
                } else {
                    return Ok(false);
                }
            }
            Err(err) => Err(format!("{}", err)),
        }
    }
}

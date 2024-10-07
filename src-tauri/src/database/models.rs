use diesel::prelude::*;
use diesel::sql_types::Integer;
use diesel::{ Queryable, Insertable };
use serde::Serialize;
use crate::database::schema::songs;

#[derive(Insertable, Queryable, Selectable)]
#[table_name = "songs"]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SongMetadata {
    pub filename: String,
    pub filepath: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: i32, // use diesel::sql_types::Integer instead
    pub image: Option<String>,
}

use diesel::prelude::*;
use diesel::pg;

#[derive(Debug)]
pub struct DbConfig {
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: String,
    pub database_name: String,
}

impl Default for DbConfig {
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

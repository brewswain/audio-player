use tauri::{ State, Window, Emitter };
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::{ Arc, Mutex };
use std::thread;
use std::fs;
use std::mem;
use std::fs::File;
use std::io::BufReader;
use log::{ info, error, warn };
use rodio::{ Decoder, OutputStream, Sink };
use serde::{ Serialize, Deserialize };
use walkdir::WalkDir;
use rayon::prelude::*;
use lofty::probe::Probe;
use lofty::file::TaggedFileExt;
use std::error::Error;
use diesel::prelude::*;
use diesel::Queryable;

use crate::SongState;
use crate::database::{ Database, DatabaseConfig };
mod playback;
mod format_handler;

pub use playback::*;
pub use format_handler::*;

// Leave these structs in place for now as a blueprint
#[allow(dead_code)]
#[derive(Queryable, Serialize)]
#[diesel(table_name = crate::schema::posts)]
#[diesel(check_for_backend(diesel::pg::Pg))]
pub struct SongMetadata {
    pub filename: String,
    pub filepath: String,
    pub title: Option<String>,
    pub artist: Option<String>,
    pub album: Option<String>,
    pub duration: Option<f64>,
    pub image: Option<String>,
}
#[allow(dead_code)]
pub struct AudioPlayer {
    pub playback: Mutex<PlaybackManager>,
    pub format_handler: FormatHandler,
    pub thread_pool: rayon::ThreadPool,
    pub song_state: Arc<SongState>,
}
impl AudioPlayer {
    pub fn new(
        stream_handle: rodio::OutputStreamHandle
    ) -> Result<Arc<Self>, Box<dyn Error + Send + Sync>> {
        Ok(
            Arc::new(AudioPlayer {
                playback: Mutex::new(PlaybackManager::new(stream_handle)),
                format_handler: FormatHandler::new(),
                thread_pool: rayon::ThreadPoolBuilder::new().build().unwrap(),
                song_state: Arc::new(SongState::new()),
            })
        )
    }

    pub fn play_audio(
        &mut self,
        file_name: &str,
        volume: f32,
        state: &State<Arc<SongState>>
    ) -> Result<String, String> {
        let song_state = state.inner().clone();
        let root_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        );
        // let root_path = PathBuf::from(r"F:\Music");
        // let root_path = PathBuf::from(r"F:\MusicBrainz");

        let file_path = WalkDir::new(&root_path)
            .into_iter()
            .filter_map(|entry| entry.ok())
            .find(|entry| entry.file_name().to_string_lossy() == file_name)
            .map(|entry| entry.path().to_path_buf())
            .ok_or_else(|| format!("File not found: {}", file_name))?;

        info!("Attempting to play audio from: {}", file_path.to_string_lossy());

        let file_path_clone = file_path.clone();

        thread::spawn(move || {
            let file = match File::open(&file_path_clone) {
                Ok(file) => file,
                Err(e) => {
                    error!("Failed to open file: {}", e);
                    return;
                }
            };

            let (_stream, stream_handle) = match OutputStream::try_default() {
                Ok(output) => output,
                Err(e) => {
                    error!("Failed to open output stream: {}", e);
                    return;
                }
            };

            let sink = match Sink::try_new(&stream_handle) {
                Ok(sink) => Arc::new(sink),
                Err(e) => {
                    error!("Failed to create sink: {}", e);
                    return;
                }
            };

            match Decoder::new(BufReader::new(file)) {
                Ok(source) => sink.append(source),
                Err(e) => {
                    error!("Failed to decode audio: {}", e);
                    return;
                }
            }

            {
                let mut current_song = song_state.current_song.lock().unwrap();
                if let Some(ref current) = *current_song {
                    current.pause();
                }

                *current_song = Some(sink.clone());
            }

            sink.set_volume(volume);
            sink.sleep_until_end();
        });
        Ok(file_name.to_string())
    }

    pub fn get_song_list(&self) -> Result<Vec<SongMetadata>, String> {
        let db_config = DatabaseConfig::default();
        let mut database = Database::new(&db_config).unwrap();
        let assets_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        );
        // let assets_path = PathBuf::from(r"F:\Music");
        // let assets_path = PathBuf::from(r"F:\MusicBrainz");

        let mut songs: Vec<SongMetadata> = self.thread_pool.install(|| {
            WalkDir::new::<&Path>(assets_path.as_ref())
                .into_iter()
                .par_bridge()
                .filter_map(|entry| entry.ok())
                .filter(|entry| {
                    entry
                        .path()
                        .extension()
                        .and_then(|ext| ext.to_str())
                        .map(|ext|
                            [
                                "mp3",
                                "flac",
                                "wav",
                                "ogg",
                                "m4a",
                                "aac",
                                "wma",
                                "aiff",
                                "alac",
                            ].contains(&ext.to_lowercase().as_str())
                        )
                        .unwrap_or(false)
                })
                .map(|entry| {
                    let path = Arc::new(entry.path().to_path_buf());
                    self.format_handler.get_metadata(path)
                    // self.format_handler.get_metadata(path, include_images)
                })
                .filter_map(Result::ok)
                .collect()
        });
        songs.sort_by(|a, b| {
            let artist_a = a.artist.as_deref().unwrap_or("");
            let artist_b = b.artist.as_deref().unwrap_or("");
            artist_a.cmp(artist_b)
        });
        for song in &songs {
            database.insert_song(song)?;
        }

        Ok(songs)
    }
    pub fn get_track_images(
        &self,
        file_paths: Vec<String>,
        window: tauri::Window
    ) -> Result<Vec<(String, String)>, String> {
        info!("Starting to process {} images", file_paths.len());
        let mut all_images = Vec::new();
        let chunk_size = 100;

        for (chunk_index, chunk) in file_paths.chunks(chunk_size).enumerate() {
            info!(
                "Processing chunk {} of {}",
                chunk_index + 1,
                (file_paths.len() + chunk_size - 1) / chunk_size
            );

            let chunk_results: Vec<(String, String)> = chunk
                .par_iter()
                .filter_map(|file_path| {
                    let path = PathBuf::from(file_path);
                    match Probe::open(&path).and_then(|tf| tf.read()) {
                        Ok(tagged_file) => {
                            tagged_file
                                .primary_tag()
                                .or_else(|| tagged_file.first_tag())
                                .and_then(|tag| self.format_handler.extract_image(tag))
                                .map(|image| {
                                    info!("Successfully extracted image for: {}", file_path);
                                    (file_path.clone(), image)
                                })
                        }
                        Err(e) => {
                            error!("Failed to process file: {}. Error: {}", file_path, e);
                            None
                        }
                    }
                })
                .collect();

            all_images.extend(chunk_results.clone());

            if let Err(e) = window.emit("chunk_processed", &chunk_results) {
                error!("Failed to send chunk to frontend: {}", e);
            }

            window.emit("main_events_cleared", ()).unwrap();
            window.emit("redraw_events_cleared", ()).unwrap();

            let memory_usage = mem::size_of_val(&all_images);
            info!(
                "Sent chunk {} to frontend. Total images processed: {}. Current memory usage: {} bytes",
                chunk_index + 1,
                all_images.len(),
                memory_usage
            );
        }

        info!(
            "Finished processing all images. Total successful extractions: {}. Final memory usage: {} bytes",
            all_images.len(),
            mem::size_of_val(&all_images)
        );
        Ok(all_images)
    }
}

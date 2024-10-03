use tauri::State;
use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::fs;
use std::fs::File;
use std::io::BufReader;
use log::{ info, error, warn };
use rodio::{ Decoder, OutputStream, Sink };
use serde::Serialize;
use crate::SongState;
use walkdir::WalkDir;
use rayon::prelude::*;
use lofty::probe::Probe;
use lofty::file::TaggedFileExt;

mod playback;
mod format_handler;

pub use playback::*;
pub use format_handler::*;

// Leave these structs in place for now as a blueprint
#[allow(dead_code)]
#[derive(Serialize)]
pub struct SongMetadata {
    filename: String,
    filepath: String,
    title: Option<String>,
    artist: Option<String>,
    album: Option<String>,
    duration: Option<f64>,
    image: Option<String>,
}

#[allow(dead_code)]
pub struct AudioPlayer {
    pub playback: PlaybackManager,
    format_handler: FormatHandler,
    thread_pool: rayon::ThreadPool,
}
impl AudioPlayer {
    pub fn new(stream_handle: rodio::OutputStreamHandle) -> Self {
        AudioPlayer {
            playback: PlaybackManager::new(stream_handle),
            format_handler: FormatHandler::new(),
            thread_pool: rayon::ThreadPoolBuilder::new().build().unwrap(),
        }
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
        Ok(songs)
    }

    pub fn get_track_images(
        &self,
        file_paths: Vec<String>
    ) -> Result<HashMap<String, String>, String> {
        info!("Starting to process {} images", file_paths.len());
        let mut images = HashMap::new();
        for file_path in file_paths {
            info!("Processing image for file: {}", file_path);
            let path = PathBuf::from(&file_path);
            if let Ok(tagged_file) = Probe::open(&path).and_then(|tf| tf.read()) {
                if let Some(tag) = tagged_file.primary_tag().or_else(|| tagged_file.first_tag()) {
                    if let Some(image) = self.format_handler.extract_image(tag) {
                        info!("Successfully extracted image for: {}", file_path);
                        images.insert(file_path.clone(), image);
                    } else {
                        warn!("No image found for: {}", file_path);
                    }
                } else {
                    warn!("No tags found for: {}", file_path);
                }
            } else {
                warn!("Failed to open or read file: {}", file_path);
            }
        }
        info!("Finished processing images. Total successful extractions: {}", images.len());
        Ok(images)
    }
}

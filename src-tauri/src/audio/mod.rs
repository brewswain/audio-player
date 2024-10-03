use tauri::State;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::fs;
use std::fs::File;
use std::io::BufReader;
use log::{ info, error };
use rodio::{ Decoder, OutputStream, Sink };
use serde::Serialize;
use crate::SongState;
use walkdir::WalkDir;

mod playback;
mod format_handler;

pub use playback::*;
pub use format_handler::*;

// Leave these structs in place for now as a blueprint
#[allow(dead_code)]
#[derive(Serialize)]
pub struct SongMetadata {
    filename: String,
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
}
impl AudioPlayer {
    pub fn new(stream_handle: rodio::OutputStreamHandle) -> Self {
        AudioPlayer {
            playback: PlaybackManager::new(stream_handle),
            format_handler: FormatHandler::new(),
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

    pub fn get_song_list(&self, include_images: bool) -> Result<Vec<SongMetadata>, String> {
        let assets_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        );
        // let assets_path = PathBuf::from(r"F:\Music");
        let mut songs = Vec::new();

        let supported_formats = ["mp3", "flac", "wav", "ogg", "m4a", "aac", "wma", "aiff", "alac"];

        for entry in WalkDir::new(assets_path)
            .into_iter()
            .filter_map(|e| e.ok()) {
            let path = entry.path();
            if let Some(extension) = path.extension().and_then(|s| s.to_str()) {
                if supported_formats.contains(&extension.to_lowercase().as_str()) {
                    match self.format_handler.get_metadata(&path.to_path_buf(), include_images) {
                        Ok(metadata) => songs.push(metadata),
                        Err(e) => {
                            error!("Failed to read metadata for file {:?}: {}", path, e);

                            continue;
                        }
                    }
                }
            }
        }

        if songs.is_empty() {
            Err("No valid audio files found".to_string())
        } else {
            songs.sort_by(|a, b| {
                let artist_a = a.artist.as_deref().unwrap_or("");
                let artist_b = b.artist.as_deref().unwrap_or("");
                artist_a.cmp(artist_b)
            });

            Ok(songs)
        }
    }
}

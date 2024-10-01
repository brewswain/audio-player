use log::{ info, error };
use tauri::State;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use rodio::{ Decoder, OutputStream, Sink };
use std::fs::File;
use std::io::BufReader;
use crate::SongState;
use id3::{ Tag, TagLike };
use std::fs;
use serde::Serialize;

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
}
#[allow(dead_code)]
pub struct AudioPlayer {
    pub playback: PlaybackManager,
    format_handler: FormatHandler,
}
impl AudioPlayer {
    pub fn new() -> Self {
        AudioPlayer {
            playback: PlaybackManager::new(),
            format_handler: FormatHandler::new(),
        }
    }

    pub fn play_audio(
        &mut self,
        file_path: &str,
        state: &State<Arc<SongState>>
    ) -> Result<String, String> {
        let song_state = state.inner().clone();
        let explicit_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        ).join(file_path);
        info!("Attempting to play audio from: {:?}", explicit_path);

        thread::spawn(move || {
            let file = match File::open(&explicit_path) {
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

            sink.set_volume(0.5);
            sink.sleep_until_end();
        });
        Ok(file_path.to_string())
    }

    pub fn get_song_list(&self) -> Result<Vec<SongMetadata>, String> {
        let assets_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        );
        // let assets_path = PathBuf::from(
        //     r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        // );
        let mut songs = Vec::new();

        for entry in fs::read_dir(assets_path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("mp3") {
                let filename = path.file_name().unwrap().to_string_lossy().into_owned();
                let tag = Tag::read_from_path(&path).ok();

                let metadata = SongMetadata {
                    filename,
                    title: tag.as_ref().and_then(|t| t.title().map(String::from)),
                    artist: tag.as_ref().and_then(|t| t.artist().map(String::from)),
                    album: tag.as_ref().and_then(|t| t.album().map(String::from)),
                    duration: None, // You might need to use a different library to get duration
                };
                songs.push(metadata);
            }
        }

        Ok(songs)
    }
}

use log::{ info, error };
use tauri::{ Manager, State };
use std::sync::{ Arc, Mutex };
use rodio::{ Decoder, OutputStream, Sink };
use std::fs::File;
use std::thread;
use std::io::BufReader;
pub mod audio;
use std::path::PathBuf;

use audio::AudioPlayer;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
struct SongState {
    current_song: Mutex<Option<Arc<Sink>>>,
}
impl SongState {
    pub fn new() -> Self {
        SongState {
            current_song: Mutex::new(None),
        }
    }
}
#[tauri::command]
fn play_audio(file_path: &str, state: State<'_, Arc<SongState>>) {
    let state = state.inner().clone();
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
            let mut current_song = state.current_song.lock().unwrap();
            if let Some(ref current) = *current_song {
                current.pause();
            }

            *current_song = Some(sink.clone());
        }

        sink.set_volume(1.0);
        sink.sleep_until_end();
    });
}

#[tauri::command]
fn pause_audio(state: State<'_, Arc<SongState>>) {
    let current_song = state.current_song.lock().unwrap();
    if let Some(ref current) = *current_song {
        current.pause();
    }
}
#[tauri::command]
fn set_volume(volume: f32, state: State<'_, Arc<SongState>>) {
    let current_song = state.current_song.lock().unwrap();

    if let Some(ref current) = *current_song {
        current.set_volume(volume);
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let song_state = Arc::new(SongState::new());

    env_logger::init();
    tauri::Builder
        ::default()
        .manage(song_state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![play_audio, pause_audio, set_volume])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

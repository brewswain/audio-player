use log::{ info, error };
use tauri::State;
use std::sync::{ Arc, Mutex };
use rodio::{ Decoder, OutputStream, Sink };
use std::fs::File;
use std::thread;
use std::io::BufReader;
use std::path::PathBuf;

mod audio;
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
async fn play_audio(file_path: &str, state: State<'_, Arc<SongState>>) -> Result<String, String> {
    info!("play_audio command invoked with file_path: {}", file_path);
    let mut audio_player = AudioPlayer::new();
    audio_player.play_audio(file_path, &state)
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

use log::info;
use tauri::{ State, Window };
use std::sync::{ Arc, Mutex };
use rodio::Sink;
use std::time::Duration;
use rodio::OutputStream;

mod audio;
mod database;

use audio::AudioPlayer;
use audio::SongMetadata;

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
async fn play_audio(
    file_name: &str,
    volume: f32,
    state: State<'_, Arc<AudioPlayer>>
) -> Result<String, String> {
    info!("play_audio command invoked with file_name: {}", file_name);

    state.playback.lock().unwrap().play_audio(file_name, volume, &state.song_state)
}
#[tauri::command]
fn pause_audio(state: State<'_, Arc<SongState>>) {
    let current_song = state.current_song.lock().unwrap();
    if let Some(ref current) = *current_song {
        current.pause();
    }
}

#[tauri::command]
fn resume_audio(state: State<'_, Arc<SongState>>) {
    let current_song = state.current_song.lock().unwrap();
    if let Some(ref current) = *current_song {
        current.play();
    }
}
#[tauri::command]
fn set_volume(volume: f32, state: State<'_, Arc<SongState>>) {
    let current_song = state.current_song.lock().unwrap();

    if let Some(ref current) = *current_song {
        current.set_volume(volume);
    }
}

#[tauri::command]
fn seek(position: f64, state: State<'_, Arc<SongState>>) -> Result<(), String> {
    let mut current_song = state.current_song.lock().unwrap();
    if let Some(ref mut current) = *current_song {
        current.try_seek(Duration::from_secs_f64(position)).map_err(|e| e.to_string())?;
    }
    Ok(())
}
#[tauri::command]
async fn get_song_list(state: State<'_, Arc<AudioPlayer>>) -> Result<Vec<SongMetadata>, String> {
    // async fn get_song_list(include_images: bool) -> Result<Vec<SongMetadata>, String> {

    let audio_player = AudioPlayer::new(
        rodio::OutputStream::try_default().map_err(|e| e.to_string())?.1
    ).map_err(|e| e.to_string())?;
    audio_player.get_song_list()
    // audio_player.get_song_list(include_images)
}

#[tauri::command]
async fn get_track_images(
    file_paths: Vec<String>,
    window: tauri::Window,
    state: State<'_, Arc<AudioPlayer>>
) -> Result<Vec<(String, String)>, String> {
    state.get_track_images(file_paths, window)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let song_state = Arc::new(SongState::new());
    let (_stream, stream_handle) = OutputStream::try_default().expect(
        "Failed to get default output device"
    );
    let audioplayer_state = Arc::new(AudioPlayer::new(stream_handle));

    env_logger::init();
    tauri::Builder
        ::default()
        .manage(song_state)
        .manage(audioplayer_state)
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(
            tauri::generate_handler![
                play_audio,
                pause_audio,
                set_volume,
                get_song_list,
                resume_audio,
                seek,
                get_track_images
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

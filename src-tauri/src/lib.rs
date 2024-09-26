use log::{ info, error };

pub mod audio;

use audio::AudioPlayer;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    info!("greet command invoked with name: {}", name);
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn play_audio(app_handle: tauri::AppHandle, file_path: &str) -> Result<String, String> {
    info!("play_audio command invoked with file_path: {}", file_path);
    let mut audio_player = AudioPlayer::new();
    let result = audio_player.play_audio(&app_handle, file_path);
    match &result {
        Ok(_) => info!("play_audio completed successfully"),
        Err(e) => error!("play_audio failed: {}", e),
    }
    result
}

// #[tauri::command]
// fn play_beep() -> Result<(), String> {
//     info!("Attempting to play beep");
//     let mut audio_player = AudioPlayer::new();
//     let result = audio_player.playback.play_beep();
//     info!("Play beep result: {:?}", result);
//     result
// }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    tauri::Builder
        ::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet, play_audio])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

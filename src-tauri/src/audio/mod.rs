use log::{ info, error };
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

use rodio::{ Decoder, OutputStream, Sink };
use std::fs::File;
use std::io::BufReader;
// use std::path::PathBuf;
use base64::{ engine::general_purpose, Engine as _ };

mod playback;
mod format_handler;

pub use playback::*;
pub use format_handler::*;

// Below is demo code
pub struct AudioPlayer {
    sink: Sink,
    _stream: OutputStream,
}
impl AudioPlayer {
    pub fn new() -> Self {
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        AudioPlayer { sink, _stream }
    }

    // pub fn play_audio(&mut self, file_path: &str) -> Result<String, String> {
    //     let explicit_path = PathBuf::from(
    //         r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
    //     ).join(file_path);
    //     info!("Attempting to play audio from: {:?}", explicit_path);

    //     let file = File::open(&explicit_path).map_err(|e| {
    //         error!("Failed to open file: {}", e);
    //         e.to_string()
    //     })?;

    //     let source = Decoder::new(BufReader::new(file)).map_err(|e| {
    //         error!("Failed to decode audio: {}", e);
    //         e.to_string()
    //     })?;

    //     info!("Audio decoded successfully");

    //     self.sink.append(source);
    //     self.sink.play();

    //     info!("Audio playback started");

    //     Ok(format!("asset://{}", file_path.replace("\\", "/")))
    // }

    pub fn play_audio(
        &mut self,
        _app_handle: &tauri::AppHandle,
        file_path: &str
    ) -> Result<String, String> {
        let explicit_path = PathBuf::from(
            r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
        ).join(file_path);
        info!("Attempting to play audio from: {:?}", explicit_path);

        let audio_data = std::fs
            ::read(&explicit_path)
            .map_err(|e| format!("Failed to read audio file: {}", e))?;

        let base64_audio = general_purpose::STANDARD.encode(&audio_data);
        let mime_type = if file_path.ends_with(".mp3") { "audio/mpeg" } else { "audio/wav" };

        Ok(format!("data:{};base64,{}", mime_type, base64_audio))
    }

    pub fn is_playing(&self) -> bool {
        !self.sink.empty() && !self.sink.is_paused()
    }
}

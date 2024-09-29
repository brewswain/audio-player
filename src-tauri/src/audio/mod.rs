use log::{ info, error };
use tauri::State;
use std::path::PathBuf;
use std::sync::{ Arc, Mutex };
use std::thread;
use rodio::{ Decoder, OutputStream, Sink };
use std::fs::File;
use std::io::BufReader;

mod playback;
mod format_handler;

pub use playback::*;
pub use format_handler::*;

pub struct AudioPlayer {
    sink: Sink,
    _stream: OutputStream,
    current_song: Option<String>,
}

impl AudioPlayer {
    pub fn new() -> Self {
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        AudioPlayer { sink, _stream, current_song: None }
    }
    // pub fn new() -> Self {
    //     AudioPlayer {
    //         playback: PlaybackManager::new(),
    //         format_handler: FormatHandler::new(),
    //     }
    // }

    // pub fn play_audio(&mut self, file_path: &str) -> Result<String, String> {
    //     // Stop current playback if it's a different song
    //     // self.sink.stop();
    //     // let (_stream, stream_handle) = OutputStream::try_default().unwrap();
    //     // self.sink = Sink::try_new(&stream_handle).unwrap();
    //     // if self.current_song.as_deref() != Some(file_path) {
    //     // }

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
    //     self.sink.set_volume(1.0);
    //     self.sink.play();
    //     std::thread::sleep(std::time::Duration::from_secs(5));

    //     self.sink.sleep_until_end();
    //     info!("Audio playback started");

    //     self.current_song = Some(file_path.to_string());
    //     Ok(file_path.to_string())
    //     // let explicit_path = PathBuf::from(
    //     //     r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
    //     // ).join(file_path);
    //     // // let audio_data = self.format_handler.load_audio(
    //     // //     explicit_path.to_str().expect("Invalid path")
    //     // // )?;
    //     // let audio_data = self.format_handler.load_audio(file_path)?;
    //     // self.playback.play(audio_data)?;
    //     // Ok(file_path.to_string())
    // }

    // pub fn play_audio(&mut self, file_path: &str, state: State<'_, Arc<SongState>>) {
    //     let explicit_path = PathBuf::from(
    //         r"C:\Users\Blee\Important\Code\tauri\audio-player\src-tauri\assets"
    //     ).join(file_path);
    //     info!("Attempting to play audio from: {:?}", explicit_path);

    //     let state = state.inner().clone();

    //     thread::spawn(move || {
    //         let file = match File::open(&explicit_path) {
    //             Ok(file) => file,
    //             Err(e) => {
    //                 error!("Failed to open file: {}", e);
    //                 return;
    //             }
    //         };

    //         let (_stream, stream_handle) = match OutputStream::try_default() {
    //             Ok(output) => output,
    //             Err(e) => {
    //                 error!("Failed to open output stream: {}", e);
    //                 return;
    //             }
    //         };

    //         let sink = match Sink::try_new(&stream_handle) {
    //             Ok(sink) => Arc::new(sink),
    //             Err(e) => {
    //                 error!("Failed to create sink: {}", e);
    //                 return;
    //             }
    //         };

    //         match Decoder::new(BufReader::new(file)) {
    //             Ok(source) => sink.append(source),
    //             Err(e) => {
    //                 error!("Failed to decode audio: {}", e);
    //                 return;
    //             }
    //         }

    //         {
    //             let mut current_song = state.current_song.lock().unwrap();
    //             if let Some(ref current) = *current_song {
    //                 current.pause();
    //             }

    //             *current_song = Some(sink.clone());
    //         }

    //         sink.set_volume(1.0);
    //         sink.sleep_until_end();
    //     });
    // }
    pub fn stop_audio(&mut self) {
        self.sink.pause();
        self.current_song = None;
    }

    pub fn is_playing(&self) -> bool {
        !self.sink.empty() && !self.sink.is_paused()
    }
}

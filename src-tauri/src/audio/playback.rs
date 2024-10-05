use rodio::{ Decoder, OutputStream, Sink, Source, OutputStreamHandle };
use std::io::Cursor;
use std::path::PathBuf;
use log::{ info, error };
use std::time::Duration;
use std::io::BufReader;
use std::fs::File;
use std::sync::Arc;
use tauri::State;
use walkdir::WalkDir;
use crate::SongState;
// Demo code, will adjust
pub struct PlaybackManager {
    sink: Arc<Sink>,
    stream_handle: OutputStreamHandle,
    current_file: Option<PathBuf>,
    duration: Duration,
}

impl PlaybackManager {
    pub fn new(stream_handle: OutputStreamHandle) -> Self {
        let sink = Arc::new(Sink::try_new(&stream_handle).unwrap());

        PlaybackManager {
            sink,
            stream_handle,
            current_file: None,
            duration: Duration::from_secs(0),
        }
    }

    pub fn play_audio(
        &mut self,
        file_name: &str,
        volume: f32,
        state: &Arc<SongState>
    ) -> Result<String, String> {
        let song_state = state.clone();
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

        let file = File::open(&file_path).map_err(|e| e.to_string())?;
        let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;

        self.sink = Arc::new(Sink::try_new(&self.stream_handle).map_err(|e| e.to_string())?);
        self.sink.append(source);
        self.sink.set_volume(volume);

        self.current_file = Some(file_path);

        {
            let mut current_song = song_state.current_song.lock().unwrap();
            *current_song = Some(self.sink.clone());
        }

        Ok(file_name.to_string())
    }

    pub fn play(&mut self, file_path: PathBuf, duration: Duration) -> Result<(), String> {
        let file = File::open(&file_path).map_err(|e| e.to_string())?;
        let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;

        self.sink.clear();
        self.sink.append(source);
        self.current_file = Some(file_path);
        self.duration = duration;
        self.sink.play();

        Ok(())
    }

    pub fn pause(&mut self) {
        self.sink.pause();
    }

    pub fn resume(&mut self) {
        self.sink.play();
    }

    pub fn stop(&mut self) {
        self.sink.stop();
    }

    pub fn set_volume(&mut self, volume: f32) {
        self.sink.set_volume(volume);
    }

    pub fn seek(&mut self, position: Duration) -> Result<(), String> {
        if let Some(ref file_path) = self.current_file {
            let file = File::open(file_path).map_err(|e| e.to_string())?;
            let source = Decoder::new(BufReader::new(file)).map_err(|e| e.to_string())?;
            let skipped = source.skip_duration(position);

            self.sink.clear();
            self.sink.append(skipped);
        }
        Ok(())
    }
}

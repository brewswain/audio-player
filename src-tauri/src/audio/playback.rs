use rodio::{ Decoder, OutputStream, Sink, Source, OutputStreamHandle };
use std::io::Cursor;
use std::path::PathBuf;
use log::{ info, error };
use std::time::Duration;
use std::io::BufReader;
use std::fs::File;

// Demo code, will adjust
pub struct PlaybackManager {
    sink: Sink,
    stream_handle: OutputStreamHandle,
    current_file: Option<PathBuf>,
    duration: Duration,
}

impl PlaybackManager {
    pub fn new(stream_handle: OutputStreamHandle) -> Self {
        PlaybackManager {
            sink: Sink::try_new(&stream_handle).unwrap(),
            stream_handle,
            current_file: None,
            duration: Duration::default(),
        }
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

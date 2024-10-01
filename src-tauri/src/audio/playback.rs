use rodio::{ Decoder, OutputStream, Sink, Source };
use std::io::Cursor;
use log::{ info, error };
use std::time::Duration;
use rodio::source::SineWave;

// Demo code, will adjust
pub struct PlaybackManager {
    sink: Sink,
    _stream: OutputStream,
}

impl PlaybackManager {
    pub fn new() -> Self {
        let (_stream, stream_handle) = OutputStream::try_default().unwrap();
        let sink = Sink::try_new(&stream_handle).unwrap();
        PlaybackManager { sink, _stream }
    }

    pub fn play(&mut self, audio_data: Vec<u8>) -> Result<(), String> {
        info!("PlaybackManager::play called with {} bytes of audio data", audio_data.len());
        let cursor = Cursor::new(audio_data);
        let source = Decoder::new(cursor).map_err(|e| {
            error!("Error decoding audio: {}", e);
            e.to_string()
        })?;
        self.sink.append(source);
        self.sink.set_volume(1.0);
        self.sink.play();
        info!("Audio playback started");
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

    pub fn seek(&mut self, position: std::time::Duration) {
        // Implement seeking logic here
    }
}

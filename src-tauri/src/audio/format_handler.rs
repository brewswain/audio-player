use std::fs::File;
use std::io::{ BufReader, Read };

pub struct FormatHandler;

impl FormatHandler {
    pub fn new() -> Self {
        FormatHandler
    }

    pub fn load_audio(&self, file_path: &str) -> Result<Vec<u8>, String> {
        let file = File::open(file_path).map_err(|e| e.to_string())?;
        let mut reader = BufReader::new(file);
        let mut buffer = Vec::new();
        reader.read_to_end(&mut buffer).map_err(|e| e.to_string())?;
        Ok(buffer)
    }
}

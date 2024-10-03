use std::path::PathBuf;
use lofty::probe::Probe;
use lofty::prelude::TaggedFileExt;
use lofty::tag::Tag;
use lofty::picture::PictureType;
use lofty::file::AudioFile;
use lofty::tag::Accessor;
use base64::{ engine::general_purpose, Engine as _ };
use crate::SongMetadata;
pub struct FormatHandler;

impl FormatHandler {
    pub fn new() -> Self {
        FormatHandler
    }

    pub fn get_metadata(&self, path: &PathBuf) -> Result<SongMetadata, String> {
        let tagged_file = Probe::open(path)
            .map_err(|e| format!("Failed to open file: {}", e))?
            .read()
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let tag = tagged_file
            .primary_tag()
            .or_else(|| tagged_file.first_tag())
            .ok_or_else(|| "No tags found".to_string())?;

        let properties = tagged_file.properties();

        Ok(SongMetadata {
            filename: path.file_name().unwrap().to_string_lossy().into_owned(),
            title: tag.title().map(String::from),
            artist: tag.artist().map(String::from),
            album: tag.album().map(String::from),
            duration: Some(properties.duration().as_secs_f64()),
            image: None,
            // image: self.extract_image(tag),
        })
    }
    fn extract_image(&self, tag: &Tag) -> Option<String> {
        tag.pictures()
            .iter()
            .find(|pic| pic.pic_type() == PictureType::CoverFront)
            .map(|pic| general_purpose::STANDARD.encode(&pic.data()))
    }
}

use std::path::PathBuf;
use id3::{ Tag, TagLike };
use log::info;
use metaflac;
use crate::SongMetadata;
use base64::{ engine::general_purpose, Engine as _ };

pub struct FormatHandler;

impl FormatHandler {
    pub fn new() -> Self {
        FormatHandler
    }

    fn extract_image(&self, path: &PathBuf) -> Option<String> {
        if path.extension()?.to_str()? == "mp3" {
            self.extract_mp3_image(path)
        } else if path.extension()?.to_str()? == "flac" {
            self.extract_flac_image(path)
        } else {
            None
        }
    }

    fn extract_mp3_image(&self, path: &PathBuf) -> Option<String> {
        let tag = id3::Tag::read_from_path(path).ok()?;
        let picture = tag.pictures().next()?;
        Some(general_purpose::STANDARD.encode(&picture.data))
    }

    fn extract_flac_image(&self, path: &PathBuf) -> Option<String> {
        let tag = metaflac::Tag::read_from_path(path).ok()?;
        let picture = tag.pictures().next()?;
        Some(general_purpose::STANDARD.encode(&picture.data))
    }

    pub fn get_mp3_metadata(&self, path: &PathBuf) -> SongMetadata {
        let tag = Tag::read_from_path(path).ok();
        SongMetadata {
            filename: path.file_name().unwrap().to_string_lossy().into_owned(),
            title: tag.as_ref().and_then(|t| t.title().map(String::from)),
            artist: tag.as_ref().and_then(|t| t.artist().map(String::from)),
            album: tag.as_ref().and_then(|t| t.album().map(String::from)),
            image: self.extract_image(path),
            // image: None,
            duration: None,
        }
    }

    pub fn get_flac_metadata(&self, path: &PathBuf) -> SongMetadata {
        let tag = metaflac::Tag::read_from_path(path).ok();
        SongMetadata {
            filename: path.file_name().unwrap().to_string_lossy().into_owned(),
            title: tag.as_ref().and_then(|t|
                t
                    .get_vorbis("TITLE")
                    .and_then(|mut v| v.next())
                    .map(|s| s.to_string())
            ),
            artist: tag.as_ref().and_then(|t|
                t
                    .get_vorbis("ARTIST")
                    .and_then(|mut v| v.next())
                    .map(|s| s.to_string())
            ),
            album: tag.as_ref().and_then(|t|
                t
                    .get_vorbis("ALBUM")
                    .and_then(|mut v| v.next())
                    .map(|s| s.to_string())
            ),
            // image: self.extract_image(path),
            image: None,
            duration: None,
        }
    }
}

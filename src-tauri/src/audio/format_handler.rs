use std::path::PathBuf;
use id3::{ Tag, TagLike };
use metaflac;
use crate::SongMetadata;
use serde::Serialize;

pub struct FormatHandler;

impl FormatHandler {
    pub fn new() -> Self {
        FormatHandler
    }

    pub fn get_mp3_metadata(&self, path: &PathBuf) -> SongMetadata {
        use id3::TagLike;
        let tag = Tag::read_from_path(path).ok();
        SongMetadata {
            filename: path.file_name().unwrap().to_string_lossy().into_owned(),
            title: tag.as_ref().and_then(|t| t.title().map(String::from)),
            artist: tag.as_ref().and_then(|t| t.artist().map(String::from)),
            album: tag.as_ref().and_then(|t| t.album().map(String::from)),
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
            duration: None,
        }
    }
}

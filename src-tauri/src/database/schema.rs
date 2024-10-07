// @generated automatically by Diesel CLI.

diesel::table! {
    albums (id) {
        id -> Text,
        title -> Nullable<Text>,
        artist -> Nullable<Text>,
        image -> Nullable<Text>,
    }
}

diesel::table! {
    songs (id) {
        id -> Text,
        filename -> Text,
        filepath -> Text,
        title -> Nullable<Text>,
        artist -> Nullable<Text>,
        image -> Nullable<Text>,
        album -> Nullable<Text>,
        duration -> Int4,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    albums,
    songs,
);

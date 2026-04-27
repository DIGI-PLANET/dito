//! Database layer — Supabase PostgREST only.
//!
//! The old `MockDb` is gone. Handlers that used to return mock fixtures
//! (arena/talents) were removed; handlers that back real features (diary,
//! memories, timecapsule, ember, soul) all go through `SupabaseClient`.

mod supabase;

pub use supabase::{urlencoding, SupabaseClient};

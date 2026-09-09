use std::{
    env, fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

fn main() {
    println!("cargo:rerun-if-env-changed=TG_API_ID");
    println!("cargo:rerun-if-env-changed=TG_API_HASH");
    generate_telegram_credentials();
    tdlib::build::build(None);
    tauri_build::build()
}

fn generate_telegram_credentials() {
    let api_id = env::var("TG_API_ID")
        .ok()
        .filter(|value| !value.trim().is_empty());
    let api_hash = env::var("TG_API_HASH")
        .ok()
        .filter(|value| !value.trim().is_empty());
    if api_id.is_some() != api_hash.is_some() {
        panic!("TG_API_ID and TG_API_HASH must be provided together");
    }

    let generated = match (api_id, api_hash) {
        (Some(api_id), Some(api_hash)) => {
            let api_id: i32 = api_id.parse().expect("TG_API_ID must be a positive integer");
            let api_hash = api_hash.trim();
            assert!(api_id > 0, "TG_API_ID must be a positive integer");
            assert!(api_hash.len() >= 16, "TG_API_HASH is too short");

            let seed = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos() as u64
                ^ u64::from(std::process::id()).rotate_left(17);
            let mut state = seed.max(1);
            let encoded = api_hash.bytes().map(|byte| byte ^ next_mask(&mut state)).collect::<Vec<_>>();
            format!(
                "const BUNDLED_TG_API_ID: Option<i32> = Some({api_id});\nconst BUNDLED_TG_HASH_SEED: u64 = {seed};\nconst BUNDLED_TG_HASH: &[u8] = &{encoded:?};\n"
            )
        }
        _ => "const BUNDLED_TG_API_ID: Option<i32> = None;\nconst BUNDLED_TG_HASH_SEED: u64 = 0;\nconst BUNDLED_TG_HASH: &[u8] = &[];\n".into(),
    };
    let out = PathBuf::from(env::var_os("OUT_DIR").expect("OUT_DIR is set"));
    fs::write(out.join("telegram_credentials.rs"), generated)
        .expect("write generated Telegram credentials");
}

fn next_mask(state: &mut u64) -> u8 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    (*state >> 24) as u8
}

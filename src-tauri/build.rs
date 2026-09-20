use std::{
    env, fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

fn main() {
    // Re-embed the latest Vite bundle in local desktop builds without requiring cargo clean.
    println!("cargo:rerun-if-changed=../dist");
    println!("cargo:rerun-if-env-changed=TG_API_ID");
    println!("cargo:rerun-if-env-changed=TG_API_HASH");
    generate_telegram_credentials();
    build_tdlib();
    tauri_build::build()
}

const TDLIB_VERSION: &str = "1.8.61";
const TDLIB_STATIC_LIBRARIES: &[&str] = &[
    "tdactor",
    "tdapi",
    "tdclient",
    "tdcore",
    "tddb",
    "tde2e",
    "tdjson_private",
    "tdjson_static",
    "tdmtproto",
    "tdnet",
    "tdsqlite",
    "tdutils",
];

/// `tdlib-rs` downloads the same ~130 MB archive every time Cargo gives this
/// crate a new OUT_DIR (tests, dev and release use different directories).
/// Keep one versioned target-local copy and only fall back to the upstream
/// downloader on the first build for an OS/architecture pair.
fn build_tdlib() {
    let out_dir = PathBuf::from(env::var_os("OUT_DIR").expect("OUT_DIR is set"));
    let target_dir = out_dir
        .ancestors()
        .nth(4)
        .expect("OUT_DIR is inside Cargo target directory");
    let target_os = env::var("CARGO_CFG_TARGET_OS").expect("target OS is set");
    let target_arch = env::var("CARGO_CFG_TARGET_ARCH").expect("target architecture is set");
    let cache_dir = target_dir
        .join("tdlib-cache")
        .join(format!("{TDLIB_VERSION}-{target_os}-{target_arch}"));

    if !tdlib_cache_is_complete(&cache_dir, &target_os) {
        fs::create_dir_all(&cache_dir).expect("create TDLib build cache");
        tdlib::build::build(Some(cache_dir.to_string_lossy().into_owned()));
        assert!(
            tdlib_cache_is_complete(&cache_dir, &target_os),
            "downloaded TDLib cache is incomplete"
        );
        return;
    }

    emit_tdlib_link_directives(&cache_dir, &target_os);
}

fn tdlib_cache_is_complete(cache_dir: &std::path::Path, target_os: &str) -> bool {
    let extension = if target_os == "windows" { "lib" } else { "a" };
    let prefix = if target_os == "windows" { "" } else { "lib" };
    let external = if target_os == "windows" {
        ["libssl", "libcrypto", "zlib"]
    } else {
        ["ssl", "crypto", "z"]
    };
    cache_dir.join("include").is_dir()
        && TDLIB_STATIC_LIBRARIES
            .iter()
            .chain(external.iter())
            .all(|name| {
                cache_dir
                    .join("lib")
                    .join(format!("{prefix}{name}.{extension}"))
                    .is_file()
            })
}

fn emit_tdlib_link_directives(cache_dir: &std::path::Path, target_os: &str) {
    let lib_dir = cache_dir.join("lib");
    println!("cargo:rustc-link-search=native={}", lib_dir.display());
    println!("cargo:include={}", cache_dir.join("include").display());
    for library in TDLIB_STATIC_LIBRARIES {
        println!("cargo:rustc-link-lib=static={library}");
    }
    for library in if target_os == "windows" {
        ["libssl", "libcrypto", "zlib"]
    } else {
        ["ssl", "crypto", "z"]
    } {
        println!("cargo:rustc-link-lib=static={library}");
    }
    match target_os {
        "windows" => {
            println!("cargo:rustc-link-lib=psapi");
            println!("cargo:rustc-link-lib=Normaliz");
            println!("cargo:rustc-link-lib=Crypt32");
            println!("cargo:rustc-link-lib=advapi32");
            println!("cargo:rustc-link-lib=user32");
        }
        "linux" | "macos" => {
            println!("cargo:rustc-link-lib=c++");
            println!("cargo:rustc-link-lib=c++abi");
        }
        "android" => println!("cargo:rustc-link-lib=static=c++_static"),
        _ => panic!("unsupported TDLib target OS: {target_os}"),
    }
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
            assert!(
                api_hash.len() == 32 && api_hash.bytes().all(|byte| byte.is_ascii_hexdigit()),
                "TG_API_HASH must contain exactly 32 hexadecimal characters"
            );

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

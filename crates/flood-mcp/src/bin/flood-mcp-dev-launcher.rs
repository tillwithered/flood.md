#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

use std::{
    env, fs, io,
    path::PathBuf,
    process::{Command, Stdio},
    time::{SystemTime, UNIX_EPOCH},
};

fn main() {
    if let Err(error) = run() {
        eprintln!("flood-mcp launcher: {error}");
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    let source = env::current_exe()?.with_file_name("flood-mcp.exe");
    let run_root = env::temp_dir().join("flood-md-mcp-dev");
    fs::create_dir_all(&run_root)?;
    clean_abandoned_copies(&run_root);

    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_nanos())
        .unwrap_or_default();
    let copy = run_root.join(format!("flood-mcp-{}-{nonce}.exe", std::process::id()));
    fs::copy(&source, &copy)?;

    let mut command = Command::new(&copy);
    command
        .args(env::args_os().skip(1))
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit());
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x0800_0000);
    }
    let result = command.status();
    let _ = fs::remove_file(&copy);
    let status = result?;
    std::process::exit(status.code().unwrap_or(1));
}

fn clean_abandoned_copies(run_root: &PathBuf) {
    let Ok(entries) = fs::read_dir(run_root) else { return; };
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name = name.to_string_lossy();
        if name.starts_with("flood-mcp-") && name.ends_with(".exe") {
            let _ = fs::remove_file(entry.path());
        }
    }
}

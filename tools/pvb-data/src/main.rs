//! pvb-data: validates and signs the exam data before it is sent to the database.

mod canonical;
mod data_dir;
mod dates;
mod domains;
mod ids;
mod model;
mod signing;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::ExitCode;

use anyhow::{Context, Result, bail};
use clap::{Parser, Subcommand};
use serde_json::Value;

use data_dir::{LoadedDocument, load_documents};
use signing::{PrivateKey, PublicKey, sign_document, verify_document};

const PRIVATE_KEY_VARIABLE: &str = "PVB_SIGNING_KEY";
const DEFAULT_PUBLIC_KEY_FILE: &str = "config/data-public-key.txt";

#[derive(Parser)]
#[command(name = "pvb-data", about = "Validates and signs the exam data in the data folder.")]
struct Cli {
    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand)]
enum Command {
    /// Check every document in the data folder.
    Validate {
        #[arg(long, default_value = "data")]
        data_dir: PathBuf,
    },
    /// Validate, then write every document signed with PVB_SIGNING_KEY.
    Sign {
        #[arg(long, default_value = "data")]
        data_dir: PathBuf,
        #[arg(long, default_value = "data-build/signed-documents.json")]
        out: PathBuf,
    },
    /// Check every signature in a signed file with the public key.
    Verify {
        #[arg(long, default_value = "data-build/signed-documents.json")]
        input: PathBuf,
        #[arg(long, default_value = DEFAULT_PUBLIC_KEY_FILE)]
        public_key_file: PathBuf,
    },
    /// Print the public key that matches PVB_SIGNING_KEY.
    PublicKey,
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(()) => ExitCode::SUCCESS,
        Err(error) => {
            eprintln!("error: {error:#}");
            ExitCode::FAILURE
        }
    }
}

fn run(cli: Cli) -> Result<()> {
    match cli.command {
        Command::Validate { data_dir } => validate_all(&data_dir).map(|_| ()),
        Command::Sign { data_dir, out } => sign_all(&data_dir, &out),
        Command::Verify { input, public_key_file } => verify_all(&input, &public_key_file),
        Command::PublicKey => {
            println!("{}", read_private_key()?.public_key().to_hex());
            Ok(())
        }
    }
}

fn read_private_key() -> Result<PrivateKey> {
    let value = std::env::var(PRIVATE_KEY_VARIABLE)
        .with_context(|| format!("{PRIVATE_KEY_VARIABLE} is not set; run through `npm run data` so .env.local is loaded"))?;
    Ok(PrivateKey::from_hex(value.trim())?)
}

fn read_public_key(path: &Path) -> Result<PublicKey> {
    let text = fs::read_to_string(path).with_context(|| format!("could not read {}", path.display()))?;
    Ok(PublicKey::from_hex(text.trim())?)
}

fn validate_all(data_dir: &Path) -> Result<Vec<LoadedDocument>> {
    let documents = load_documents(data_dir)?;
    let mut problems = 0usize;
    let mut first_origin_of: HashMap<String, String> = HashMap::new();

    for document in &documents {
        for issue in model::validate_document(&document.value) {
            problems += 1;
            let path = if issue.path.is_empty() { "(document)".to_string() } else { issue.path };
            eprintln!("{}: {}: {}", document.origin, path, issue.message);
        }
        if let Some(id) = document.value.get("id").and_then(Value::as_str) {
            if let Some(first) = first_origin_of.insert(id.to_string(), document.origin.clone()) {
                problems += 1;
                eprintln!("{}: id: \"{id}\" is also used in {first}", document.origin);
            }
        }
    }

    if problems > 0 {
        bail!("{problems} problem(s) found in {} document(s)", documents.len());
    }
    println!("{} document(s) valid.", documents.len());
    Ok(documents)
}

fn sign_all(data_dir: &Path, out: &Path) -> Result<()> {
    let documents = validate_all(data_dir)?;
    let key = read_private_key()?;

    let mut signed: Vec<Value> = Vec::with_capacity(documents.len());
    for document in documents {
        let mut value = document.value;
        sign_document(&mut value, &key).with_context(|| format!("could not sign {}", document.origin))?;
        signed.push(value);
    }
    signed.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

    if let Some(parent) = out.parent() {
        fs::create_dir_all(parent).with_context(|| format!("could not create {}", parent.display()))?;
    }
    fs::write(out, serde_json::to_string_pretty(&signed)? + "\n")
        .with_context(|| format!("could not write {}", out.display()))?;
    println!("{} document(s) signed into {}.", signed.len(), out.display());
    Ok(())
}

fn verify_all(input: &Path, public_key_file: &Path) -> Result<()> {
    let text = fs::read_to_string(input).with_context(|| format!("could not read {}", input.display()))?;
    let documents: Vec<Value> =
        serde_json::from_str(&text).with_context(|| format!("{} must be a JSON list", input.display()))?;
    let key = read_public_key(public_key_file)?;

    let mut invalid = 0usize;
    for (index, document) in documents.iter().enumerate() {
        if !verify_document(document, &key) {
            invalid += 1;
            let id = document.get("id").and_then(Value::as_str).unwrap_or("(no id)");
            eprintln!("{}#{index}: signature does not match for {id}", input.display());
        }
    }

    if invalid > 0 {
        bail!("{invalid} of {} document(s) failed verification", documents.len());
    }
    println!("{} signature(s) valid.", documents.len());
    Ok(())
}

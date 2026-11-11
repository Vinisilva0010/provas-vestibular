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
use signing::{SigningKey, sign_document, verify_document};

const KEY_VARIABLE: &str = "PVB_SIGNING_KEY";

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
    /// Check every signature in a signed file with PVB_SIGNING_KEY.
    Verify {
        #[arg(long, default_value = "data-build/signed-documents.json")]
        input: PathBuf,
    },
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
        Command::Verify { input } => verify_all(&input),
    }
}

fn read_key() -> Result<SigningKey> {
    let value = std::env::var(KEY_VARIABLE)
        .with_context(|| format!("{KEY_VARIABLE} is not set; load it from .env.local before running"))?;
    Ok(SigningKey::from_hex(value.trim())?)
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
    let key = read_key()?;

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

fn verify_all(input: &Path) -> Result<()> {
    let text = fs::read_to_string(input).with_context(|| format!("could not read {}", input.display()))?;
    let documents: Vec<Value> =
        serde_json::from_str(&text).with_context(|| format!("{} must be a JSON list", input.display()))?;
    let key = read_key()?;

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

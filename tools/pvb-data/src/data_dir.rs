//! Loads documents from the data folder: every .json file holds one object or a list of objects.

use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context, Result, bail};
use serde_json::Value;

pub struct LoadedDocument {
    /// File path, plus #index for documents inside a list.
    pub origin: String,
    pub value: Value,
}

pub fn load_documents(dir: &Path) -> Result<Vec<LoadedDocument>> {
    let mut files = Vec::new();
    collect_json_files(dir, &mut files).with_context(|| format!("could not read {}", dir.display()))?;
    files.sort();

    let mut documents = Vec::new();
    for file in files {
        let origin = file.display().to_string();
        let text = fs::read_to_string(&file).with_context(|| format!("could not read {origin}"))?;
        let value: Value = serde_json::from_str(&text).with_context(|| format!("{origin} is not valid JSON"))?;
        match value {
            Value::Array(items) => {
                for (index, item) in items.into_iter().enumerate() {
                    documents.push(LoadedDocument { origin: format!("{origin}#{index}"), value: item });
                }
            }
            Value::Object(_) => documents.push(LoadedDocument { origin, value }),
            _ => bail!("{origin} must contain a JSON object or a list of objects"),
        }
    }
    Ok(documents)
}

fn collect_json_files(dir: &Path, out: &mut Vec<PathBuf>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let path = entry?.path();
        if path.is_dir() {
            collect_json_files(&path, out)?;
        } else if path.extension().is_some_and(|extension| extension == "json") {
            out.push(path);
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("pvb-data-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("nested")).unwrap();
        dir
    }

    #[test]
    fn loads_objects_and_lists_and_skips_other_files() {
        let dir = temp_dir("load");
        fs::write(dir.join("a.json"), r#"{"id":"one"}"#).unwrap();
        fs::write(dir.join("nested/b.json"), r#"[{"id":"two"},{"id":"three"}]"#).unwrap();
        fs::write(dir.join(".gitkeep"), "").unwrap();

        let documents = load_documents(&dir).unwrap();
        let ids: Vec<&str> = documents.iter().map(|d| d.value["id"].as_str().unwrap()).collect();
        assert_eq!(ids, ["one", "two", "three"]);
        assert!(documents[1].origin.ends_with("b.json#0"));
        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn rejects_invalid_json_and_scalars() {
        let dir = temp_dir("bad");
        fs::write(dir.join("broken.json"), "{").unwrap();
        assert!(load_documents(&dir).is_err());
        fs::write(dir.join("broken.json"), "42").unwrap();
        assert!(load_documents(&dir).is_err());
        fs::remove_dir_all(&dir).unwrap();
    }
}

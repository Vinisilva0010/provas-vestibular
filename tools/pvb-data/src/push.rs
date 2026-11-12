//! Bundles, index and the upload procedure.
//!
//! One bundle per exam holds every signed document of that exam and is never
//! modified after upload. The index lists each bundle's key, database
//! reference and signature, and is the only item updated in place.

use std::collections::{BTreeMap, HashMap, HashSet};

use anyhow::{Context, Result, bail};
use serde_json::{Value, json};

use crate::canonical::canonical_json;
use crate::signing::{PrivateKey, PublicKey, sign_document, verify_document};
use crate::store::{Store, strip_server_fields};

pub const FORMAT_VERSION: i64 = 1;
pub const INDEX_KEY: &str = "index";
/// Firestore allows 1 MiB per document; keep a safety margin.
const MAX_ITEM_BYTES: usize = 900_000;

pub struct Bundle {
    pub key: String,
    pub item: Value,
    pub signature: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct IndexEntry {
    pub key: String,
    pub reference: String,
    pub signature: String,
}

#[derive(Debug)]
pub struct PushReport {
    pub index_ref: String,
    pub index_created: bool,
    pub created: usize,
    pub reused: usize,
    pub deleted: usize,
    pub warnings: Vec<String>,
}

fn bundle_key_of(document: &Value) -> Option<&str> {
    match document.get("type")?.as_str()? {
        "exam" => document.get("slug")?.as_str(),
        _ => document.get("examSlug")?.as_str(),
    }
}

fn signature_of(item: &Value) -> Result<String> {
    item.get("signature")
        .and_then(Value::as_str)
        .map(str::to_string)
        .context("signed item has no signature")
}

/// Signs every document, groups them by exam and signs each group.
pub fn build_bundles(documents: Vec<Value>, key: &PrivateKey) -> Result<Vec<Bundle>> {
    let mut groups: BTreeMap<String, Vec<Value>> = BTreeMap::new();
    for mut document in documents {
        let bundle_key = bundle_key_of(&document)
            .with_context(|| format!("cannot tell which exam this document belongs to: {document}"))?
            .to_string();
        sign_document(&mut document, key)?;
        groups.entry(bundle_key).or_default().push(document);
    }

    let mut bundles = Vec::with_capacity(groups.len());
    for (bundle_key, mut documents) in groups {
        if !documents.iter().any(|document| document["type"] == "exam") {
            bail!("bundle \"{bundle_key}\" has no exam document");
        }
        documents.sort_by(|a, b| a["id"].as_str().cmp(&b["id"].as_str()));

        let mut item = json!({
            "pvbKey": format!("bundle-{bundle_key}"),
            "formatVersion": FORMAT_VERSION,
            "bundle": bundle_key.clone(),
            "documents": documents,
        });
        sign_document(&mut item, key)?;

        let size = canonical_json(&item)?.len();
        if size > MAX_ITEM_BYTES {
            bail!("bundle \"{bundle_key}\" has {size} bytes, above the {MAX_ITEM_BYTES}-byte limit");
        }

        let signature = signature_of(&item)?;
        bundles.push(Bundle { key: bundle_key, item, signature });
    }
    Ok(bundles)
}

pub fn build_index(entries: &[IndexEntry], generated_at: i64, key: &PrivateKey) -> Result<Value> {
    let bundles: Vec<Value> = entries
        .iter()
        .map(|entry| json!({ "key": entry.key, "ref": entry.reference, "signature": entry.signature }))
        .collect();
    let mut index = json!({
        "pvbKey": INDEX_KEY,
        "formatVersion": FORMAT_VERSION,
        "generatedAt": generated_at,
        "bundles": bundles,
    });
    sign_document(&mut index, key)?;
    Ok(index)
}

fn read_index_entries(index: &Value) -> Option<Vec<IndexEntry>> {
    index
        .get("bundles")?
        .as_array()?
        .iter()
        .map(|entry| {
            Some(IndexEntry {
                key: entry.get("key")?.as_str()?.to_string(),
                reference: entry.get("ref")?.as_str()?.to_string(),
                signature: entry.get("signature")?.as_str()?.to_string(),
            })
        })
        .collect()
}

/// Reads the current index. Returns no entries (plus a warning) when it cannot be trusted.
fn trusted_old_entries(
    store: &impl Store,
    public_key: &PublicKey,
    index_ref: &str,
    warnings: &mut Vec<String>,
) -> Result<Vec<IndexEntry>> {
    let item = store.get(index_ref)?.with_context(|| {
        format!("index {index_ref} was not found; remove PVB_INDEX_REF to create a new index")
    })?;
    let index = strip_server_fields(&item);
    let trusted = index.get("pvbKey").and_then(Value::as_str) == Some(INDEX_KEY) && verify_document(&index, public_key);
    match (trusted, read_index_entries(&index)) {
        (true, Some(entries)) => Ok(entries),
        _ => {
            warnings.push(
                "the current index failed verification; old bundles were neither reused nor deleted".into(),
            );
            Ok(Vec::new())
        }
    }
}

/// True when the stored bundle exists, verifies and is exactly the expected one.
fn stored_bundle_matches(store: &impl Store, public_key: &PublicKey, entry: &IndexEntry, expected: &str) -> Result<bool> {
    let Some(item) = store.get(&entry.reference)? else {
        return Ok(false);
    };
    let bundle = strip_server_fields(&item);
    Ok(verify_document(&bundle, public_key) && bundle.get("signature").and_then(Value::as_str) == Some(expected))
}

pub fn push(
    store: &impl Store,
    private_key: &PrivateKey,
    public_key: &PublicKey,
    bundles: &[Bundle],
    index_ref: Option<&str>,
    generated_at: i64,
) -> Result<PushReport> {
    if bundles.is_empty() {
        bail!("refusing to publish an empty dataset");
    }

    let mut warnings = Vec::new();
    let old_entries = match index_ref {
        Some(reference) => trusted_old_entries(store, public_key, reference, &mut warnings)?,
        None => Vec::new(),
    };
    let old_by_key: HashMap<&str, &IndexEntry> = old_entries.iter().map(|entry| (entry.key.as_str(), entry)).collect();

    let mut entries = Vec::with_capacity(bundles.len());
    let (mut created, mut reused) = (0, 0);
    for bundle in bundles {
        let reusable = match old_by_key.get(bundle.key.as_str()) {
            Some(old) if old.signature == bundle.signature
                && stored_bundle_matches(store, public_key, old, &bundle.signature)? =>
            {
                Some(old.reference.clone())
            }
            _ => None,
        };
        let reference = match reusable {
            Some(reference) => {
                reused += 1;
                reference
            }
            None => {
                created += 1;
                store
                    .create(&bundle.item)
                    .with_context(|| format!("could not upload bundle \"{}\"", bundle.key))?
            }
        };
        entries.push(IndexEntry { key: bundle.key.clone(), reference, signature: bundle.signature.clone() });
    }

    let index = build_index(&entries, generated_at, private_key)?;
    let (index_ref, index_created) = match index_ref {
        Some(reference) => {
            store.patch(reference, &index).context("could not update the index")?;
            (reference.to_string(), false)
        }
        None => (store.create(&index).context("could not create the index")?, true),
    };

    let stored = store.get(&index_ref)?.context("the index disappeared right after it was written")?;
    if canonical_json(&strip_server_fields(&stored))? != canonical_json(&index)? {
        bail!("the index read back from the database does not match what was written");
    }

    let kept: HashSet<&str> = entries.iter().map(|entry| entry.reference.as_str()).collect();
    let mut deleted = 0;
    for old in &old_entries {
        if !kept.contains(old.reference.as_str()) {
            store
                .delete(&old.reference)
                .with_context(|| format!("could not delete old bundle \"{}\"", old.key))?;
            deleted += 1;
        }
    }

    Ok(PushReport { index_ref, index_created, created, reused, deleted, warnings })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::memory::MemoryStore;

    fn keys() -> (PrivateKey, PublicKey) {
        let private_key = PrivateKey::from_hex(&"1".repeat(64)).unwrap();
        let public_key = private_key.public_key();
        (private_key, public_key)
    }

    fn exam(slug: &str) -> Value {
        json!({"id": format!("pvb-exam-{slug}"), "type": "exam", "slug": slug})
    }

    fn event(slug: &str, label: &str) -> Value {
        json!({"id": format!("pvb-event-{slug}-2027-phase-1"), "type": "event", "examSlug": slug, "label": label})
    }

    fn dataset(fuvest_label: &str, with_unicamp: bool) -> Vec<Value> {
        let mut documents = vec![exam("fuvest"), event("fuvest", fuvest_label)];
        if with_unicamp {
            documents.push(exam("unicamp"));
        }
        documents
    }

    fn index_entries(store: &MemoryStore, public_key: &PublicKey, reference: &str) -> Vec<IndexEntry> {
        let index = strip_server_fields(&store.get(reference).unwrap().unwrap());
        assert!(verify_document(&index, public_key), "index must verify");
        read_index_entries(&index).unwrap()
    }

    #[test]
    fn bundles_group_by_exam_and_verify() {
        let (private_key, public_key) = keys();
        let bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        assert_eq!(bundles.iter().map(|b| b.key.as_str()).collect::<Vec<_>>(), ["fuvest", "unicamp"]);

        let fuvest = &bundles[0].item;
        assert!(verify_document(fuvest, &public_key));
        let documents = fuvest["documents"].as_array().unwrap();
        assert_eq!(documents.len(), 2);
        assert!(documents.iter().all(|document| verify_document(document, &public_key)));
        assert_eq!(documents[0]["id"], "pvb-event-fuvest-2027-phase-1", "documents are sorted by id");
    }

    #[test]
    fn bundles_need_an_exam_document() {
        let (private_key, _) = keys();
        assert!(build_bundles(vec![event("fuvest", "1ª fase")], &private_key).is_err());
        assert!(build_bundles(vec![json!({"type": "event"})], &private_key).is_err());
    }

    #[test]
    fn first_push_creates_bundles_and_index() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();

        let report = push(&store, &private_key, &public_key, &bundles, None, 100).unwrap();
        assert!(report.index_created);
        assert_eq!((report.created, report.reused, report.deleted), (2, 0, 0));
        assert_eq!(index_entries(&store, &public_key, &report.index_ref).len(), 2);
        assert_eq!(store.len(), 3);
    }

    #[test]
    fn unchanged_bundles_are_reused() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &bundles, None, 100).unwrap();

        let second = push(&store, &private_key, &public_key, &bundles, Some(&first.index_ref), 200).unwrap();
        assert!(!second.index_created);
        assert_eq!(second.index_ref, first.index_ref);
        assert_eq!((second.created, second.reused, second.deleted), (0, 2, 0));
        assert_eq!(store.len(), 3);
    }

    #[test]
    fn changed_bundle_is_replaced_and_the_old_one_deleted() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let first_bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &first_bundles, None, 100).unwrap();
        let old_fuvest = index_entries(&store, &public_key, &first.index_ref)[0].reference.clone();

        let changed = build_bundles(dataset("Primeira fase", true), &private_key).unwrap();
        let report = push(&store, &private_key, &public_key, &changed, Some(&first.index_ref), 200).unwrap();
        assert_eq!((report.created, report.reused, report.deleted), (1, 1, 1));
        assert!(!store.contains(&old_fuvest));
        assert_eq!(store.len(), 3);
    }

    #[test]
    fn removed_bundle_is_deleted() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let all = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &all, None, 100).unwrap();

        let fewer = build_bundles(dataset("1ª fase", false), &private_key).unwrap();
        let report = push(&store, &private_key, &public_key, &fewer, Some(&first.index_ref), 200).unwrap();
        assert_eq!((report.created, report.reused, report.deleted), (0, 1, 1));
        assert_eq!(index_entries(&store, &public_key, &first.index_ref).len(), 1);
    }

    #[test]
    fn items_from_other_exercises_are_never_touched() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let foreign = store.create(&json!({"disciplina": "Matematica", "nota": 9})).unwrap();

        let all = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &all, None, 100).unwrap();
        let fewer = build_bundles(dataset("Outra", false), &private_key).unwrap();
        push(&store, &private_key, &public_key, &fewer, Some(&first.index_ref), 200).unwrap();

        assert!(store.contains(&foreign));
    }

    #[test]
    fn tampered_index_is_not_trusted() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &bundles, None, 100).unwrap();
        let old_refs: Vec<String> = index_entries(&store, &public_key, &first.index_ref)
            .into_iter()
            .map(|entry| entry.reference)
            .collect();

        store.overwrite_field(&first.index_ref, "generatedAt", json!(999));

        let report = push(&store, &private_key, &public_key, &bundles, Some(&first.index_ref), 200).unwrap();
        assert_eq!(report.warnings.len(), 1);
        assert_eq!((report.created, report.reused, report.deleted), (2, 0, 0));
        assert!(old_refs.iter().all(|reference| store.contains(reference)), "nothing deleted from an untrusted index");
        assert_eq!(index_entries(&store, &public_key, &first.index_ref).len(), 2);
    }

    #[test]
    fn missing_index_is_an_error() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        assert!(push(&store, &private_key, &public_key, &bundles, Some("doesnotexist"), 100).is_err());
    }

    #[test]
    fn empty_dataset_is_refused() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        assert!(push(&store, &private_key, &public_key, &[], None, 100).is_err());
        assert_eq!(store.len(), 0);
    }

    #[test]
    fn failure_mid_upload_keeps_the_previous_version() {
        let (private_key, public_key) = keys();
        let store = MemoryStore::default();
        let first_bundles = build_bundles(dataset("1ª fase", true), &private_key).unwrap();
        let first = push(&store, &private_key, &public_key, &first_bundles, None, 100).unwrap();
        let before = index_entries(&store, &public_key, &first.index_ref);

        store.fail_creates.set(true);
        let changed = build_bundles(dataset("Primeira fase", true), &private_key).unwrap();
        assert!(push(&store, &private_key, &public_key, &changed, Some(&first.index_ref), 200).is_err());

        let after = index_entries(&store, &public_key, &first.index_ref);
        assert_eq!(before, after, "index unchanged");
        assert!(after.iter().all(|entry| store.contains(&entry.reference)), "old bundles still exist");
    }

    #[test]
    fn shared_dataset_fixture_is_up_to_date() {
        let root = concat!(env!("CARGO_MANIFEST_DIR"), "/../../test-vectors");
        let read = |name: &str| -> Value {
            serde_json::from_str(&std::fs::read_to_string(format!("{root}/{name}")).unwrap()).unwrap()
        };
        let vectors = read("signing.json");
        let cases = read("documents.json");
        let private_key = PrivateKey::from_hex(vectors["privateKeySeedHex"].as_str().unwrap()).unwrap();
        let public_key = private_key.public_key();

        let documents = vec![cases["bases"]["exam"].clone(), cases["bases"]["event"].clone()];
        let bundles = build_bundles(documents, &private_key).unwrap();
        let store = MemoryStore::default();
        let report = push(&store, &private_key, &public_key, &bundles, None, 1_700_000_000).unwrap();
        let items: serde_json::Map<String, Value> = store.snapshot().into_iter().collect();
        let expected = json!({
            "description": "Generated by the Rust test shared_dataset_fixture_is_up_to_date with the public test key. Items are shown exactly as the database returns them. Regenerate with: PVB_UPDATE_FIXTURES=1 cargo test",
            "publicKeyHex": vectors["publicKeyHex"],
            "indexRef": report.index_ref,
            "items": items,
        });

        let path = format!("{root}/dataset.json");
        if std::env::var("PVB_UPDATE_FIXTURES").as_deref() == Ok("1") {
            std::fs::write(&path, serde_json::to_string_pretty(&expected).unwrap() + "\n").unwrap();
        }
        let actual: Value = serde_json::from_str(
            &std::fs::read_to_string(&path).expect("missing fixture; run with PVB_UPDATE_FIXTURES=1"),
        )
        .unwrap();
        assert_eq!(actual, expected, "test-vectors/dataset.json is stale; run with PVB_UPDATE_FIXTURES=1");
    }
}

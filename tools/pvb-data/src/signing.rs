//! HMAC-SHA256 document signing. Must match src/lib/data/signing.ts.

use hmac::digest::KeyInit;
use hmac::{Hmac, Mac};
use serde_json::Value;
use sha2::Sha256;
use thiserror::Error;

use crate::canonical::{CanonicalError, canonical_json};

type HmacSha256 = Hmac<Sha256>;

pub const SIGNATURE_FIELD: &str = "signature";

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SigningError {
    #[error("signing key must be 64 lowercase hex characters (32 bytes)")]
    InvalidKey,
    #[error("only JSON objects can be signed")]
    NotAnObject,
    #[error(transparent)]
    Canonical(#[from] CanonicalError),
}

/// 32-byte secret. Debug output never shows the bytes.
pub struct SigningKey([u8; 32]);

impl SigningKey {
    pub fn from_hex(value: &str) -> Result<Self, SigningError> {
        if !is_lower_hex(value, 64) {
            return Err(SigningError::InvalidKey);
        }
        let mut bytes = [0u8; 32];
        hex::decode_to_slice(value, &mut bytes).map_err(|_| SigningError::InvalidKey)?;
        Ok(Self(bytes))
    }
}

impl std::fmt::Debug for SigningKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("SigningKey(<redacted>)")
    }
}

fn is_lower_hex(value: &str, length: usize) -> bool {
    value.len() == length && value.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn mac_for(document: &Value, key: &SigningKey) -> Result<HmacSha256, SigningError> {
    let mut unsigned = document.clone();
    if let Value::Object(map) = &mut unsigned {
        map.remove(SIGNATURE_FIELD);
    }
    let canonical = canonical_json(&unsigned)?;
    let mut mac = <HmacSha256 as KeyInit>::new_from_slice(&key.0).expect("HMAC accepts keys of any length");
    mac.update(canonical.as_bytes());
    Ok(mac)
}

/// Lowercase hex HMAC of the canonical form, ignoring any existing signature.
pub fn compute_signature(document: &Value, key: &SigningKey) -> Result<String, SigningError> {
    let bytes = mac_for(document, key)?.finalize().into_bytes();
    Ok(hex::encode(bytes.as_slice()))
}

pub fn sign_document(document: &mut Value, key: &SigningKey) -> Result<(), SigningError> {
    if !document.is_object() {
        return Err(SigningError::NotAnObject);
    }
    let signature = compute_signature(document, key)?;
    if let Value::Object(map) = document {
        map.insert(SIGNATURE_FIELD.to_string(), Value::String(signature));
    }
    Ok(())
}

/// True only when the document has a well-formed signature that matches its content.
/// The comparison runs in constant time.
pub fn verify_document(document: &Value, key: &SigningKey) -> bool {
    let Some(provided) = document.get(SIGNATURE_FIELD).and_then(Value::as_str) else {
        return false;
    };
    if !is_lower_hex(provided, 64) {
        return false;
    }
    let Ok(expected) = hex::decode(provided) else {
        return false;
    };
    let Ok(mac) = mac_for(document, key) else {
        return false;
    };
    mac.verify_slice(&expected).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn shared_fixture() -> Value {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../test-vectors/signing.json");
        serde_json::from_str(&std::fs::read_to_string(path).expect("read signing vectors")).expect("parse signing vectors")
    }

    #[test]
    fn matches_the_shared_vectors() {
        let fixture = shared_fixture();
        let key = SigningKey::from_hex(fixture["keyHex"].as_str().unwrap()).unwrap();
        for vector in fixture["vectors"].as_array().unwrap() {
            let name = vector["name"].as_str().unwrap();
            assert_eq!(
                canonical_json(&vector["document"]).unwrap(),
                vector["canonical"].as_str().unwrap(),
                "canonical text for {name}"
            );
            assert_eq!(
                compute_signature(&vector["document"], &key).unwrap(),
                vector["signature"].as_str().unwrap(),
                "signature for {name}"
            );
        }
    }

    #[test]
    fn rejects_bad_keys() {
        for value in ["a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), String::new()] {
            assert_eq!(SigningKey::from_hex(&value).unwrap_err(), SigningError::InvalidKey);
        }
    }

    #[test]
    fn never_prints_the_key() {
        let key = SigningKey::from_hex(&"a".repeat(64)).unwrap();
        assert_eq!(format!("{key:?}"), "SigningKey(<redacted>)");
    }

    #[test]
    fn signs_and_detects_tampering() {
        let key = SigningKey::from_hex(&"1".repeat(64)).unwrap();
        let other = SigningKey::from_hex(&"2".repeat(64)).unwrap();
        let mut document = json!({"id": "pvb-exam-fuvest", "hasStudyPlan": true});
        sign_document(&mut document, &key).unwrap();

        assert!(verify_document(&document, &key));
        assert!(!verify_document(&document, &other));

        let mut changed = document.clone();
        changed["hasStudyPlan"] = json!(false);
        assert!(!verify_document(&changed, &key));

        let mut added = document.clone();
        added["extra"] = json!("x");
        assert!(!verify_document(&added, &key));
    }

    #[test]
    fn treats_malformed_signatures_as_invalid() {
        let key = SigningKey::from_hex(&"1".repeat(64)).unwrap();
        for signature in [json!("not-hex"), json!("ab"), json!(123), json!("A".repeat(64))] {
            assert!(!verify_document(&json!({"id": "x", "signature": signature}), &key));
        }
        assert!(!verify_document(&json!({"id": "x"}), &key));
        assert!(!verify_document(&json!({"weight": 1.5, "signature": "0".repeat(64)}), &key));
    }

    #[test]
    fn refuses_to_sign_non_objects() {
        let key = SigningKey::from_hex(&"1".repeat(64)).unwrap();
        assert_eq!(sign_document(&mut json!([1]), &key).unwrap_err(), SigningError::NotAnObject);
    }
}

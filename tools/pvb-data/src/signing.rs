//! Ed25519 document signing. Must match src/lib/data/signing.ts.

use ed25519_dalek::{Signature, Signer, SigningKey, VerifyingKey};
use serde_json::Value;
use thiserror::Error;

use crate::canonical::{CanonicalError, canonical_json};

pub const SIGNATURE_FIELD: &str = "signature";

#[derive(Debug, Error, PartialEq, Eq)]
pub enum SigningError {
    #[error("key must be 64 lowercase hex characters (32 bytes)")]
    InvalidKey,
    #[error("only JSON objects can be signed")]
    NotAnObject,
    #[error(transparent)]
    Canonical(#[from] CanonicalError),
}

/// Signs documents. Stays on the author's machine. Debug output never shows it.
pub struct PrivateKey(SigningKey);

/// Verifies documents. Safe to publish.
#[derive(Debug)]
pub struct PublicKey(VerifyingKey);

fn is_lower_hex(value: &str, length: usize) -> bool {
    value.len() == length && value.bytes().all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}

fn decode_32(value: &str) -> Result<[u8; 32], SigningError> {
    if !is_lower_hex(value, 64) {
        return Err(SigningError::InvalidKey);
    }
    let mut bytes = [0u8; 32];
    hex::decode_to_slice(value, &mut bytes).map_err(|_| SigningError::InvalidKey)?;
    Ok(bytes)
}

impl PrivateKey {
    pub fn from_hex(seed_hex: &str) -> Result<Self, SigningError> {
        Ok(Self(SigningKey::from_bytes(&decode_32(seed_hex)?)))
    }

    pub fn public_key(&self) -> PublicKey {
        PublicKey(self.0.verifying_key())
    }
}

impl std::fmt::Debug for PrivateKey {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("PrivateKey(<redacted>)")
    }
}

impl PublicKey {
    pub fn from_hex(value: &str) -> Result<Self, SigningError> {
        VerifyingKey::from_bytes(&decode_32(value)?)
            .map(Self)
            .map_err(|_| SigningError::InvalidKey)
    }

    pub fn to_hex(&self) -> String {
        hex::encode(self.0.to_bytes())
    }
}

/// Canonical form of the document without its signature field.
fn signed_message(document: &Value) -> Result<String, SigningError> {
    let mut unsigned = document.clone();
    if let Value::Object(map) = &mut unsigned {
        map.remove(SIGNATURE_FIELD);
    }
    Ok(canonical_json(&unsigned)?)
}

/// Lowercase hex Ed25519 signature of the canonical form, ignoring any existing signature.
pub fn compute_signature(document: &Value, key: &PrivateKey) -> Result<String, SigningError> {
    let message = signed_message(document)?;
    let signature: Signature = key.0.sign(message.as_bytes());
    Ok(hex::encode(signature.to_bytes()))
}

pub fn sign_document(document: &mut Value, key: &PrivateKey) -> Result<(), SigningError> {
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
/// Uses strict verification, which rejects malleable signatures and weak keys.
pub fn verify_document(document: &Value, key: &PublicKey) -> bool {
    let Some(provided) = document.get(SIGNATURE_FIELD).and_then(Value::as_str) else {
        return false;
    };
    if !is_lower_hex(provided, 128) {
        return false;
    }
    let Ok(bytes) = hex::decode(provided) else {
        return false;
    };
    let Ok(signature) = Signature::from_slice(&bytes) else {
        return false;
    };
    let Ok(message) = signed_message(document) else {
        return false;
    };
    key.0.verify_strict(message.as_bytes(), &signature).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn shared_fixture() -> Value {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../test-vectors/signing.json");
        serde_json::from_str(&std::fs::read_to_string(path).expect("read signing vectors"))
            .expect("parse signing vectors")
    }

    #[test]
    fn matches_the_shared_vectors() {
        let fixture = shared_fixture();
        let private_key = PrivateKey::from_hex(fixture["privateKeySeedHex"].as_str().unwrap()).unwrap();
        let public_key = PublicKey::from_hex(fixture["publicKeyHex"].as_str().unwrap()).unwrap();
        assert_eq!(private_key.public_key().to_hex(), fixture["publicKeyHex"].as_str().unwrap());

        for vector in fixture["vectors"].as_array().unwrap() {
            let name = vector["name"].as_str().unwrap();
            assert_eq!(
                canonical_json(&vector["document"]).unwrap(),
                vector["canonical"].as_str().unwrap(),
                "canonical text for {name}"
            );
            assert_eq!(
                compute_signature(&vector["document"], &private_key).unwrap(),
                vector["signature"].as_str().unwrap(),
                "signature for {name}"
            );
            let mut signed = vector["document"].clone();
            signed[SIGNATURE_FIELD] = vector["signature"].clone();
            assert!(verify_document(&signed, &public_key), "verification for {name}");
        }
    }

    #[test]
    fn rejects_bad_keys() {
        for value in ["a".repeat(63), "a".repeat(65), "A".repeat(64), "g".repeat(64), String::new()] {
            assert_eq!(PrivateKey::from_hex(&value).unwrap_err(), SigningError::InvalidKey);
            assert_eq!(PublicKey::from_hex(&value).unwrap_err(), SigningError::InvalidKey);
        }
    }

    #[test]
    fn never_prints_the_private_key() {
        let key = PrivateKey::from_hex(&"a".repeat(64)).unwrap();
        assert_eq!(format!("{key:?}"), "PrivateKey(<redacted>)");
    }

    #[test]
    fn signs_and_detects_tampering() {
        let key = PrivateKey::from_hex(&"1".repeat(64)).unwrap();
        let public = key.public_key();
        let other = PrivateKey::from_hex(&"2".repeat(64)).unwrap().public_key();
        let mut document = json!({"id": "pvb-exam-fuvest", "hasStudyPlan": true});
        sign_document(&mut document, &key).unwrap();

        assert!(verify_document(&document, &public));
        assert!(!verify_document(&document, &other));

        let mut changed = document.clone();
        changed["hasStudyPlan"] = json!(false);
        assert!(!verify_document(&changed, &public));

        let mut added = document.clone();
        added["extra"] = json!("x");
        assert!(!verify_document(&added, &public));
    }

    #[test]
    fn treats_malformed_signatures_as_invalid() {
        let public = PrivateKey::from_hex(&"1".repeat(64)).unwrap().public_key();
        for signature in [json!("not-hex"), json!("ab"), json!(123), json!("A".repeat(128))] {
            assert!(!verify_document(&json!({"id": "x", "signature": signature}), &public));
        }
        assert!(!verify_document(&json!({"id": "x"}), &public));
        assert!(!verify_document(&json!({"weight": 1.5, "signature": "0".repeat(128)}), &public));
    }

    #[test]
    fn refuses_to_sign_non_objects() {
        let key = PrivateKey::from_hex(&"1".repeat(64)).unwrap();
        assert_eq!(sign_document(&mut json!([1]), &key).unwrap_err(), SigningError::NotAnObject);
    }
}

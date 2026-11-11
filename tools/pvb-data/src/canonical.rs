//! Canonical JSON. Must produce exactly what src/lib/data/signing.ts produces:
//! object keys sorted, no whitespace, JSON escapes, only safe integers as numbers.

use serde_json::Value;
use thiserror::Error;

/// Largest integer JavaScript represents exactly (2^53 - 1).
pub const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;

#[derive(Debug, Error, PartialEq, Eq)]
pub enum CanonicalError {
    #[error("only safe integers can be signed, got {0}")]
    UnsafeNumber(String),
}

pub fn canonical_json(value: &Value) -> Result<String, CanonicalError> {
    let mut out = String::new();
    write_value(value, &mut out)?;
    Ok(out)
}

fn write_value(value: &Value, out: &mut String) -> Result<(), CanonicalError> {
    match value {
        Value::Null | Value::Bool(_) | Value::String(_) => out.push_str(&value.to_string()),
        Value::Number(number) => {
            let is_safe = number
                .as_i64()
                .is_some_and(|n| (-MAX_SAFE_INTEGER..=MAX_SAFE_INTEGER).contains(&n));
            if !is_safe {
                return Err(CanonicalError::UnsafeNumber(number.to_string()));
            }
            out.push_str(&number.to_string());
        }
        Value::Array(items) => {
            out.push('[');
            for (index, item) in items.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                write_value(item, out)?;
            }
            out.push(']');
        }
        Value::Object(map) => {
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            out.push('{');
            for (index, key) in keys.iter().enumerate() {
                if index > 0 {
                    out.push(',');
                }
                out.push_str(&Value::String((*key).clone()).to_string());
                out.push(':');
                write_value(&map[key.as_str()], out)?;
            }
            out.push('}');
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn sorts_keys_and_keeps_array_order() {
        assert_eq!(canonical_json(&json!({"b": [2, 1], "a": null})).unwrap(), r#"{"a":null,"b":[2,1]}"#);
    }

    #[test]
    fn rejects_floats_and_unsafe_integers() {
        assert!(canonical_json(&json!({"weight": 1.5})).is_err());
        assert!(canonical_json(&json!(MAX_SAFE_INTEGER + 1)).is_err());
        assert!(canonical_json(&json!(u64::MAX)).is_err());
    }
}

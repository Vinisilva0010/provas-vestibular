//! Document ids. Rules mirror src/lib/data/ids.ts.

pub const ID_PREFIX: &str = "pvb";

/// Lowercase ASCII letters and digits, words joined by single hyphens.
pub fn is_slug(value: &str) -> bool {
    !value.is_empty()
        && value
            .split('-')
            .all(|part| !part.is_empty() && part.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit()))
}

/// Builds pvb-<type>-<part>-<part>..., or None when a part is not a slug.
pub fn build_id(doc_type: &str, parts: &[&str]) -> Option<String> {
    if parts.is_empty() || !parts.iter().all(|part| is_slug(part)) {
        return None;
    }
    let mut id = format!("{ID_PREFIX}-{doc_type}");
    for part in parts {
        id.push('-');
        id.push_str(part);
    }
    Some(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_slugs() {
        for value in ["fuvest", "ita-ime", "2027"] {
            assert!(is_slug(value), "{value}");
        }
    }

    #[test]
    fn rejects_non_slugs() {
        for value in ["Fuvest", "unicâmp", "ita ime", "-ita", "ita-", "ita--ime", ""] {
            assert!(!is_slug(value), "{value}");
        }
    }

    #[test]
    fn builds_ids() {
        assert_eq!(build_id("exam", &["fuvest"]).as_deref(), Some("pvb-exam-fuvest"));
        assert_eq!(
            build_id("event", &["fuvest", "2027", "phase-1"]).as_deref(),
            Some("pvb-event-fuvest-2027-phase-1")
        );
        assert_eq!(build_id("exam", &[]), None);
        assert_eq!(build_id("exam", &["Fuvest"]), None);
    }
}

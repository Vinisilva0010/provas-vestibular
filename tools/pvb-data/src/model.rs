//! Document validation. Rules mirror src/lib/data/schemas.ts; the shared cases in
//! test-vectors/documents.json keep both sides in agreement.

use std::collections::HashSet;

use serde_json::{Map, Value};

use crate::{dates, domains, ids};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Issue {
    /// Dot-separated field path; empty for the document itself.
    pub path: String,
    pub message: String,
}

const PROVENANCE_KEYS: [&str; 4] = ["sourceName", "sourceUrl", "checkedAt", "nature"];

const EXAM_KEYS: [&str; 12] = [
    "id", "type", "slug", "officialName", "shortName", "institution", "examFormat",
    "hasStudyPlan", "states", "audience", "summary", "officialSiteUrl",
];

const EVENT_KEYS: [&str; 13] = [
    "id", "type", "examSlug", "editionYear", "key", "category", "label", "status",
    "startDate", "endDate", "gatesOpen", "gatesClose", "durationMinutes",
];

const EDITION_KEYS: [&str; 10] = [
    "id", "type", "examSlug", "editionYear", "howItWorks", "vacanciesApprox",
    "vacanciesNote", "feeCents", "feeNote", "documents",
];

const OFFICIAL_DOCUMENT_KEYS: [&str; 4] = ["label", "url", "kind", "publishedOn"];

const STRUCTURE_KEYS: [&str; 10] = [
    "id", "type", "examSlug", "editionYear", "phases", "scoring", "eliminationRules",
    "quotas", "tieBreak", "accessibility",
];

const PHASE_KEYS: [&str; 9] = [
    "key", "label", "format", "days", "durationMinutesPerDay", "questionCount",
    "maxScore", "subjects", "notes",
];

const QUOTA_KEYS: [&str; 3] = ["key", "label", "description"];

const REGION_CODES: [&str; 28] = [
    "BR", "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const EVENT_CATEGORIES: [&str; 11] = [
    "registration", "fee-exemption-request", "fee-exemption-result", "fee-payment",
    "exam-location", "exam-day", "specific-skills-test", "answer-key", "result",
    "enrollment", "waitlist",
];

const OFFICIAL_DOCUMENT_KINDS: [&str; 9] = [
    "notice", "notice-amendment", "guide", "syllabus", "exemption-rules", "careers",
    "accessibility", "answer-key", "other",
];

const PHASE_FORMATS: [&str; 4] = ["objective", "essay", "mixed", "skills"];

struct Checker<'a> {
    doc: &'a Map<String, Value>,
    /// Path of this object inside the document; empty at the top level.
    prefix: String,
    issues: Vec<Issue>,
}

impl<'a> Checker<'a> {
    fn new(doc: &'a Map<String, Value>) -> Self {
        Self::nested(doc, String::new())
    }

    fn nested(doc: &'a Map<String, Value>, prefix: String) -> Self {
        Self { doc, prefix, issues: Vec::new() }
    }

    fn full_path(&self, path: &str) -> String {
        match (self.prefix.is_empty(), path.is_empty()) {
            (true, _) => path.to_string(),
            (false, true) => self.prefix.clone(),
            (false, false) => format!("{}.{path}", self.prefix),
        }
    }

    fn issue(&mut self, path: impl AsRef<str>, message: impl Into<String>) {
        let path = self.full_path(path.as_ref());
        self.issues.push(Issue { path, message: message.into() });
    }

    fn only_keys(&mut self, groups: &[&[&str]]) {
        let doc = self.doc;
        for key in doc.keys() {
            if !groups.iter().any(|group| group.contains(&key.as_str())) {
                self.issue("", format!("Unknown field \"{key}\"."));
            }
        }
    }

    fn string(&mut self, key: &str) -> Option<&'a str> {
        let doc = self.doc;
        let value = doc.get(key).and_then(Value::as_str);
        if value.is_none() {
            self.issue(key, "Expected text.");
        }
        value
    }

    fn text(&mut self, key: &str) -> Option<&'a str> {
        let value = self.string(key)?;
        if value.trim().is_empty() {
            self.issue(key, "Must not be empty.");
            return None;
        }
        Some(value)
    }

    fn optional_text(&mut self, key: &str) {
        if self.doc.contains_key(key) {
            self.text(key);
        }
    }

    fn slug(&mut self, key: &str) -> Option<&'a str> {
        let value = self.string(key)?;
        if !ids::is_slug(value) {
            self.issue(key, "Use lowercase letters, digits and single hyphens.");
            return None;
        }
        Some(value)
    }

    fn official_url(&mut self, key: &str) {
        if let Some(value) = self.string(key) {
            if !domains::is_official_url(value) {
                self.issue(key, "URL must be https and on an allowlisted official domain.");
            }
        }
    }

    fn one_of(&mut self, key: &str, options: &[&str]) -> Option<&'a str> {
        let doc = self.doc;
        match doc.get(key).and_then(Value::as_str) {
            Some(value) if options.contains(&value) => Some(value),
            _ => {
                self.issue(key, format!("Expected one of: {}.", options.join(", ")));
                None
            }
        }
    }

    fn boolean(&mut self, key: &str) {
        if !self.doc.get(key).is_some_and(Value::is_boolean) {
            self.issue(key, "Expected true or false.");
        }
    }

    fn integer(&mut self, key: &str, min: i64, max: i64, required: bool) {
        match self.doc.get(key) {
            None if !required => {}
            Some(value) if value.as_i64().is_some_and(|n| (min..=max).contains(&n)) => {}
            _ => self.issue(key, format!("Expected a whole number from {min} to {max}.")),
        }
    }

    fn date(&mut self, key: &str, required: bool) -> Option<i64> {
        let doc = self.doc;
        match doc.get(key) {
            None if !required => None,
            value => {
                let day = value.and_then(Value::as_str).and_then(dates::epoch_day);
                if day.is_none() {
                    self.issue(key, "Expected a real date in YYYY-MM-DD format.");
                }
                day
            }
        }
    }

    fn optional_time(&mut self, key: &str) -> Option<&'a str> {
        let doc = self.doc;
        let value = doc.get(key)?;
        match value.as_str().filter(|text| dates::is_time_hhmm(text)) {
            Some(text) => Some(text),
            None => {
                self.issue(key, "Expected a time as HH:MM (24h).");
                None
            }
        }
    }

    fn states(&mut self, key: &str) {
        let doc = self.doc;
        match doc.get(key) {
            Some(Value::Array(items)) if !items.is_empty() => {
                for (index, item) in items.iter().enumerate() {
                    if !item.as_str().is_some_and(|code| REGION_CODES.contains(&code)) {
                        self.issue(format!("{key}.{index}"), "Unknown state code.");
                    }
                }
            }
            _ => self.issue(key, "Expected a non-empty list of state codes."),
        }
    }

    /// A list of non-empty texts with at least `min` items.
    fn text_list(&mut self, key: &str, required: bool, min: usize) {
        let doc = self.doc;
        match doc.get(key) {
            None if !required => {}
            Some(Value::Array(items)) if items.len() >= min => {
                for (index, item) in items.iter().enumerate() {
                    if !item.as_str().is_some_and(|text| !text.trim().is_empty()) {
                        self.issue(format!("{key}.{index}"), "Must be non-empty text.");
                    }
                }
            }
            _ => self.issue(key, format!("Expected a list of at least {min} text(s).")),
        }
    }

    /// A list of objects with at least `min` items, each checked by `check`.
    fn object_list(
        &mut self,
        key: &str,
        required: bool,
        min: usize,
        check: impl Fn(&mut Checker<'a>),
    ) -> Vec<&'a Map<String, Value>> {
        let doc = self.doc;
        let mut found = Vec::new();
        match doc.get(key) {
            None if !required => {}
            Some(Value::Array(items)) if items.len() >= min => {
                for (index, item) in items.iter().enumerate() {
                    match item.as_object() {
                        Some(map) => {
                            let mut sub = Checker::nested(map, self.full_path(&format!("{key}.{index}")));
                            check(&mut sub);
                            self.issues.extend(sub.issues);
                            found.push(map);
                        }
                        None => self.issue(format!("{key}.{index}"), "Expected an object."),
                    }
                }
            }
            _ => self.issue(key, format!("Expected a list of at least {min} object(s).")),
        }
        found
    }

    fn provenance(&mut self) {
        self.text("sourceName");
        self.official_url("sourceUrl");
        self.date("checkedAt", true);
        self.one_of("nature", &["official", "analysis"]);
    }

    fn id_matches(&mut self, expected: Option<String>, message: &str) {
        let actual = self.doc.get("id").and_then(Value::as_str);
        if expected.is_none() || actual != expected.as_deref() {
            self.issue("id", message);
        }
    }

    fn finish(self) -> Vec<Issue> {
        self.issues
    }
}

/// Returns every problem found in one unsigned document. Empty means valid.
pub fn validate_document(value: &Value) -> Vec<Issue> {
    let Value::Object(doc) = value else {
        return vec![Issue { path: String::new(), message: "Expected a JSON object.".into() }];
    };
    match doc.get("type").and_then(Value::as_str) {
        Some("exam") => validate_exam(doc),
        Some("event") => validate_event(doc),
        Some("edition") => validate_edition(doc),
        Some("structure") => validate_structure(doc),
        _ => vec![Issue { path: "type".into(), message: "Unknown or missing document type.".into() }],
    }
}

fn raw_str<'a>(doc: &'a Map<String, Value>, key: &str) -> Option<&'a str> {
    doc.get(key).and_then(Value::as_str)
}

/// pvb-<type>-<examSlug>-<editionYear>, built from the raw values like tryBuildId does.
fn year_scoped_id(doc: &Map<String, Value>, doc_type: &str) -> Option<String> {
    let year = doc.get("editionYear").and_then(Value::as_i64)?.to_string();
    ids::build_id(doc_type, &[raw_str(doc, "examSlug")?, &year])
}

fn validate_exam(doc: &Map<String, Value>) -> Vec<Issue> {
    let mut c = Checker::new(doc);
    c.only_keys(&[&EXAM_KEYS, &PROVENANCE_KEYS]);
    c.string("id");
    let slug = c.slug("slug");
    for key in ["officialName", "shortName", "institution", "audience", "summary"] {
        c.text(key);
    }
    c.one_of("examFormat", &["objective", "essay", "mixed"]);
    c.boolean("hasStudyPlan");
    c.states("states");
    c.official_url("officialSiteUrl");
    c.provenance();
    c.id_matches(slug.and_then(|s| ids::build_id("exam", &[s])), "id must be pvb-exam-<slug>.");
    c.finish()
}

fn validate_event(doc: &Map<String, Value>) -> Vec<Issue> {
    let mut c = Checker::new(doc);
    c.only_keys(&[&EVENT_KEYS, &PROVENANCE_KEYS]);
    c.string("id");
    c.slug("examSlug");
    c.integer("editionYear", 2000, 2100, true);
    c.slug("key");
    c.one_of("category", &EVENT_CATEGORIES);
    c.text("label");
    let status = c.one_of("status", &["official", "announced", "not-announced"]);
    let start = c.date("startDate", false);
    let end = c.date("endDate", false);
    let gates_open = c.optional_time("gatesOpen");
    let gates_close = c.optional_time("gatesClose");
    c.integer("durationMinutes", 1, 24 * 60, false);
    c.provenance();

    let year = doc.get("editionYear").and_then(Value::as_i64).map(|y| y.to_string());
    let expected_id = match (raw_str(doc, "examSlug"), year.as_deref(), raw_str(doc, "key")) {
        (Some(exam), Some(year), Some(key)) => ids::build_id("event", &[exam, year, key]),
        _ => None,
    };
    c.id_matches(expected_id, "id must be pvb-event-<examSlug>-<editionYear>-<key>.");

    let has_dates = doc.contains_key("startDate") || doc.contains_key("endDate");
    let not_announced = status == Some("not-announced");
    if not_announced && has_dates {
        c.issue("startDate", "An event that was not announced cannot have dates.");
    }
    if !not_announced && !doc.contains_key("startDate") {
        c.issue("startDate", "An official or announced event needs a start date.");
    }
    if let (Some(start), Some(end)) = (start, end) {
        if end < start {
            c.issue("endDate", "End date is before start date.");
        }
    }
    if let (Some(open), Some(close)) = (gates_open, gates_close) {
        if close <= open {
            c.issue("gatesClose", "Gates must close after they open.");
        }
    }
    c.finish()
}

fn validate_edition(doc: &Map<String, Value>) -> Vec<Issue> {
    let mut c = Checker::new(doc);
    c.only_keys(&[&EDITION_KEYS, &PROVENANCE_KEYS]);
    c.string("id");
    c.slug("examSlug");
    c.integer("editionYear", 2000, 2100, true);
    c.text("howItWorks");
    c.integer("vacanciesApprox", 1, 1_000_000, false);
    c.optional_text("vacanciesNote");
    c.integer("feeCents", 0, 1_000_000, false);
    c.optional_text("feeNote");
    c.object_list("documents", false, 0, |d| {
        d.only_keys(&[&OFFICIAL_DOCUMENT_KEYS]);
        d.text("label");
        d.official_url("url");
        d.one_of("kind", &OFFICIAL_DOCUMENT_KINDS);
        d.date("publishedOn", false);
    });
    c.provenance();
    c.id_matches(year_scoped_id(doc, "edition"), "id must be pvb-edition-<examSlug>-<editionYear>.");
    c.finish()
}

fn validate_structure(doc: &Map<String, Value>) -> Vec<Issue> {
    let mut c = Checker::new(doc);
    c.only_keys(&[&STRUCTURE_KEYS, &PROVENANCE_KEYS]);
    c.string("id");
    c.slug("examSlug");
    c.integer("editionYear", 2000, 2100, true);

    let phases = c.object_list("phases", true, 1, |p| {
        p.only_keys(&[&PHASE_KEYS]);
        p.slug("key");
        p.text("label");
        p.one_of("format", &PHASE_FORMATS);
        p.integer("days", 1, 10, false);
        p.integer("durationMinutesPerDay", 1, 24 * 60, false);
        p.integer("questionCount", 1, 1000, false);
        p.integer("maxScore", 1, 10_000, false);
        p.text_list("subjects", true, 1);
        p.text_list("notes", false, 0);
    });
    let keys: Vec<&str> = phases.iter().filter_map(|phase| raw_str(phase, "key")).collect();
    if keys.iter().collect::<HashSet<_>>().len() != keys.len() {
        c.issue("phases", "Phase keys must be unique.");
    }

    c.text_list("scoring", true, 1);
    c.text_list("eliminationRules", false, 0);
    c.object_list("quotas", false, 0, |q| {
        q.only_keys(&[&QUOTA_KEYS]);
        q.slug("key");
        q.text("label");
        q.text("description");
    });
    c.optional_text("tieBreak");
    c.text_list("accessibility", false, 0);
    c.provenance();
    c.id_matches(year_scoped_id(doc, "structure"), "id must be pvb-structure-<examSlug>-<editionYear>.");
    c.finish()
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn matches_the_shared_cases() {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../test-vectors/documents.json");
        let fixture: Value =
            serde_json::from_str(&std::fs::read_to_string(path).expect("read cases")).expect("parse cases");

        for case in fixture["cases"].as_array().expect("cases") {
            let name = case["name"].as_str().unwrap();
            let mut document = fixture["bases"][case["base"].as_str().unwrap()].clone();
            let map = document.as_object_mut().unwrap();
            if let Some(patch) = case.get("patch").and_then(Value::as_object) {
                for (key, value) in patch {
                    map.insert(key.clone(), value.clone());
                }
            }
            if let Some(remove) = case.get("remove").and_then(Value::as_array) {
                for key in remove {
                    map.remove(key.as_str().unwrap());
                }
            }

            let issues = validate_document(&document);
            let valid = case["valid"].as_bool().unwrap();
            assert_eq!(issues.is_empty(), valid, "{name}: {issues:?}");
            if !valid {
                let path = case["path"].as_str().unwrap();
                assert!(
                    issues.iter().any(|issue| issue.path == path),
                    "{name}: expected an issue at {path:?}, got {issues:?}"
                );
            }
        }
    }

    #[test]
    fn rejects_non_objects() {
        assert_eq!(validate_document(&json!([1]))[0].message, "Expected a JSON object.");
    }

    #[test]
    fn rejects_a_signature_in_source_files() {
        let mut exam = json!({"type": "exam"});
        exam["signature"] = json!("0".repeat(128));
        assert!(validate_document(&exam).iter().any(|issue| issue.message.contains("signature")));
    }

    #[test]
    fn reports_non_object_list_items() {
        let mut structure = json!({"type": "structure"});
        structure["phases"] = json!(["not an object"]);
        assert!(validate_document(&structure).iter().any(|issue| issue.path == "phases.0"));
    }
}

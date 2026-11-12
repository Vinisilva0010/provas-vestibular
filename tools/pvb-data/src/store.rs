//! Access to the Technoworks REST database (Firestore behind Cloud Functions).
//! Facts checked against the live API: POST returns the new id in `dados.id`;
//! a top-level "id" field in the body hides that id, so it is never sent;
//! PATCH replaces whole top-level fields; GET adds `id`, `_criadoEm`, `_atualizadoEm`;
//! the server sometimes answers 502 and a retry succeeds; listing returns at most 100 items.

use std::time::Duration;

use anyhow::{Context, Result, bail};
use serde_json::Value;
use ureq::Agent;

pub const TECHNOWORKS_BASE_URL: &str = "https://technoworks.com.br";
pub const LIST_LIMIT: usize = 100;
const MAX_ATTEMPTS: u32 = 3;

pub trait Store {
    fn get(&self, reference: &str) -> Result<Option<Value>>;
    fn create(&self, item: &Value) -> Result<String>;
    fn patch(&self, reference: &str, item: &Value) -> Result<()>;
    fn delete(&self, reference: &str) -> Result<()>;
    /// Every item as the API returns it, up to LIST_LIMIT.
    fn list(&self) -> Result<Vec<Value>>;
}

/// Firestore auto ids are short alphanumeric strings. Anything else is refused
/// before it is used in a URL, so a tampered index cannot point elsewhere.
pub fn is_valid_reference(reference: &str) -> bool {
    (1..=128).contains(&reference.len()) && reference.bytes().all(|b| b.is_ascii_alphanumeric())
}

pub fn is_valid_ra(ra: &str) -> bool {
    (1..=32).contains(&ra.len()) && ra.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'-')
}

/// Removes the fields the database adds on its own: `id` and anything starting with `_`.
pub fn strip_server_fields(item: &Value) -> Value {
    match item {
        Value::Object(map) => Value::Object(
            map.iter()
                .filter(|(key, _)| key.as_str() != "id" && !key.starts_with('_'))
                .map(|(key, value)| (key.clone(), value.clone()))
                .collect(),
        ),
        other => other.clone(),
    }
}

pub fn ensure_writable(item: &Value) -> Result<()> {
    let Value::Object(map) = item else {
        bail!("only JSON objects can be stored");
    };
    if let Some(key) = map.keys().find(|key| key.as_str() == "id" || key.starts_with('_')) {
        bail!("field \"{key}\" is reserved by the database and cannot be written");
    }
    Ok(())
}

/// Gateway errors from the Cloud Function are temporary; everything else is final.
pub fn is_transient(error: &ureq::Error) -> bool {
    matches!(error, ureq::Error::StatusCode(502 | 503 | 504))
}

/// Runs an operation that is safe to repeat, retrying temporary failures.
/// Never use it for POST: repeating a POST can create the same item twice.
pub fn with_retry<T>(
    mut operation: impl FnMut() -> Result<T, ureq::Error>,
    pause: impl Fn(u32),
) -> Result<T, ureq::Error> {
    let mut attempt = 1;
    loop {
        match operation() {
            Err(error) if attempt < MAX_ATTEMPTS && is_transient(&error) => {
                pause(attempt);
                attempt += 1;
            }
            result => return result,
        }
    }
}

fn backoff(attempt: u32) {
    std::thread::sleep(Duration::from_secs(u64::from(attempt) * 2));
}

pub struct TechnoworksStore {
    agent: Agent,
    base: String,
}

impl TechnoworksStore {
    pub fn new(ra: &str) -> Result<Self> {
        if !is_valid_ra(ra) {
            bail!("PVB_TECHNOWORKS_RA must contain only letters, digits and hyphens");
        }
        let agent: Agent = Agent::config_builder()
            .timeout_global(Some(Duration::from_secs(30)))
            .build()
            .into();
        Ok(Self { agent, base: format!("{TECHNOWORKS_BASE_URL}/rest/{ra}") })
    }

    fn item_url(&self, reference: &str) -> Result<String> {
        if !is_valid_reference(reference) {
            bail!("refusing to use an invalid item reference");
        }
        Ok(format!("{}/{}", self.base, reference))
    }
}

fn data_field(body: Value) -> Result<Value> {
    body.get("dados").cloned().context("the response has no 'dados' field")
}

impl Store for TechnoworksStore {
    fn get(&self, reference: &str) -> Result<Option<Value>> {
        let url = self.item_url(reference)?;
        match with_retry(|| self.agent.get(&url).call(), backoff) {
            Ok(mut response) => {
                let body: Value = response.body_mut().read_json().context("could not read the item")?;
                Ok(Some(data_field(body)?))
            }
            Err(ureq::Error::StatusCode(404)) => Ok(None),
            Err(error) => Err(error).with_context(|| format!("GET of item {reference} failed")),
        }
    }

    fn create(&self, item: &Value) -> Result<String> {
        ensure_writable(item)?;
        let mut response = self.agent.post(&self.base).send_json(item).context("POST failed")?;
        let body: Value = response.body_mut().read_json().context("could not read the POST response")?;
        let reference = data_field(body)?
            .get("id")
            .and_then(Value::as_str)
            .map(str::to_string)
            .context("the POST response has no id")?;
        if !is_valid_reference(&reference) {
            bail!("the database returned an unexpected id");
        }
        Ok(reference)
    }

    fn patch(&self, reference: &str, item: &Value) -> Result<()> {
        ensure_writable(item)?;
        let url = self.item_url(reference)?;
        with_retry(|| self.agent.patch(&url).send_json(item), backoff)
            .with_context(|| format!("PATCH of item {reference} failed"))?;
        Ok(())
    }

    fn delete(&self, reference: &str) -> Result<()> {
        let url = self.item_url(reference)?;
        match with_retry(|| self.agent.delete(&url).call(), backoff) {
            Ok(_) | Err(ureq::Error::StatusCode(404)) => Ok(()),
            Err(error) => Err(error).with_context(|| format!("DELETE of item {reference} failed")),
        }
    }

    fn list(&self) -> Result<Vec<Value>> {
        let url = format!("{}?limite={LIST_LIMIT}", self.base);
        let mut response = with_retry(|| self.agent.get(&url).call(), backoff).context("listing the database failed")?;
        let body: Value = response.body_mut().read_json().context("could not read the listing")?;
        match body.get("dados") {
            Some(Value::Array(items)) => Ok(items.clone()),
            _ => bail!("the listing has no 'dados' list"),
        }
    }
}

#[cfg(test)]
pub mod memory {
    //! In-memory store that behaves like the Technoworks API, for tests.

    use std::cell::{Cell, RefCell};
    use std::collections::BTreeMap;

    use anyhow::{Result, bail};
    use serde_json::Value;

    use super::{Store, ensure_writable};

    #[derive(Default)]
    pub struct MemoryStore {
        items: RefCell<BTreeMap<String, Value>>,
        next: Cell<u32>,
        pub fail_creates: Cell<bool>,
        pub fail_patches: Cell<bool>,
    }

    impl MemoryStore {
        pub fn len(&self) -> usize {
            self.items.borrow().len()
        }

        /// Every item as the API would return it, keyed by reference.
        pub fn snapshot(&self) -> BTreeMap<String, Value> {
            let references: Vec<String> = self.items.borrow().keys().cloned().collect();
            references
                .into_iter()
                .map(|reference| {
                    let item = self.get(&reference).unwrap().unwrap();
                    (reference, item)
                })
                .collect()
        }

        pub fn contains(&self, reference: &str) -> bool {
            self.items.borrow().contains_key(reference)
        }

        /// Writes directly, skipping the API rules, to simulate tampering.
        pub fn overwrite_field(&self, reference: &str, field: &str, value: Value) {
            self.items.borrow_mut().get_mut(reference).unwrap()[field] = value;
        }
    }

    impl Store for MemoryStore {
        fn get(&self, reference: &str) -> Result<Option<Value>> {
            Ok(self.items.borrow().get(reference).map(|data| {
                let mut view = data.clone();
                view["id"] = Value::String(reference.to_string());
                view["_criadoEm"] = Value::String("2026-11-11T00:00:00.000Z".into());
                view
            }))
        }

        fn create(&self, item: &Value) -> Result<String> {
            ensure_writable(item)?;
            if self.fail_creates.get() {
                bail!("simulated network failure");
            }
            let number = self.next.get() + 1;
            self.next.set(number);
            let reference = format!("mem{number}");
            self.items.borrow_mut().insert(reference.clone(), item.clone());
            Ok(reference)
        }

        fn patch(&self, reference: &str, item: &Value) -> Result<()> {
            ensure_writable(item)?;
            if self.fail_patches.get() {
                bail!("simulated 502");
            }
            let mut items = self.items.borrow_mut();
            let Some(existing) = items.get_mut(reference) else {
                bail!("404");
            };
            for (key, value) in item.as_object().unwrap() {
                existing[key] = value.clone();
            }
            Ok(())
        }

        fn delete(&self, reference: &str) -> Result<()> {
            self.items.borrow_mut().remove(reference);
            Ok(())
        }

        fn list(&self) -> Result<Vec<Value>> {
            Ok(self.snapshot().into_values().collect())
        }
    }
}

#[cfg(test)]
mod tests {
    use std::cell::Cell;

    use super::*;
    use serde_json::json;

    #[test]
    fn validates_references_and_ra() {
        assert!(is_valid_reference("129phTsCB93UkxbVZ43E"));
        for value in ["", "../x", "a/b", "a b", "a?b", &"a".repeat(129)] {
            assert!(!is_valid_reference(value), "{value}");
        }
        assert!(is_valid_ra("123456"));
        assert!(is_valid_ra("RA-12"));
        for value in ["", "12/34", "12 34", "../1"] {
            assert!(!is_valid_ra(value), "{value}");
        }
    }

    #[test]
    fn strips_fields_the_database_adds() {
        let item = json!({"id": "x", "_criadoEm": "t", "pvbKey": "index", "nested": {"id": "kept"}});
        assert_eq!(strip_server_fields(&item), json!({"pvbKey": "index", "nested": {"id": "kept"}}));
    }

    #[test]
    fn refuses_reserved_top_level_fields() {
        assert!(ensure_writable(&json!({"pvbKey": "a"})).is_ok());
        assert!(ensure_writable(&json!({"id": "a"})).is_err());
        assert!(ensure_writable(&json!({"_x": 1})).is_err());
        assert!(ensure_writable(&json!([1])).is_err());
    }

    #[test]
    fn retries_a_temporary_failure_then_succeeds() {
        let calls = Cell::new(0);
        let pauses = Cell::new(0);
        let result = with_retry(
            || {
                calls.set(calls.get() + 1);
                if calls.get() == 1 { Err(ureq::Error::StatusCode(502)) } else { Ok("ok") }
            },
            |_| pauses.set(pauses.get() + 1),
        );
        assert_eq!(result.unwrap(), "ok");
        assert_eq!((calls.get(), pauses.get()), (2, 1));
    }

    #[test]
    fn does_not_retry_final_errors() {
        let calls = Cell::new(0);
        let result: Result<(), _> = with_retry(
            || {
                calls.set(calls.get() + 1);
                Err(ureq::Error::StatusCode(404))
            },
            |_| {},
        );
        assert!(matches!(result, Err(ureq::Error::StatusCode(404))));
        assert_eq!(calls.get(), 1);
    }

    #[test]
    fn gives_up_after_three_attempts() {
        let calls = Cell::new(0);
        let result: Result<(), _> = with_retry(
            || {
                calls.set(calls.get() + 1);
                Err(ureq::Error::StatusCode(503))
            },
            |_| {},
        );
        assert!(matches!(result, Err(ureq::Error::StatusCode(503))));
        assert_eq!(calls.get(), 3);
    }
}

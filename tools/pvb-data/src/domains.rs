//! Official source domains, read from the same file the website uses.

use std::sync::LazyLock;

use serde::Deserialize;
use url::Url;

#[derive(Deserialize)]
struct DomainsFile {
    domains: Vec<String>,
}

static OFFICIAL_DOMAINS: LazyLock<Vec<String>> = LazyLock::new(|| {
    let file: DomainsFile = serde_json::from_str(include_str!("../../../config/official-domains.json"))
        .expect("config/official-domains.json must be valid");
    file.domains
});

/// True for https URLs on an official domain, with no credentials and no custom port.
pub fn is_official_url(value: &str) -> bool {
    let Ok(url) = Url::parse(value) else {
        return false;
    };

    if url.scheme() != "https" || !url.username().is_empty() || url.password().is_some() || url.port().is_some() {
        return false;
    }

    let Some(host) = url.host_str() else {
        return false;
    };
    let host = host.to_ascii_lowercase();

    OFFICIAL_DOMAINS
        .iter()
        .any(|domain| host == *domain || host.ends_with(&format!(".{domain}")))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_the_shared_list() {
        assert!(OFFICIAL_DOMAINS.iter().any(|domain| domain == "gov.br"));
    }

    #[test]
    fn accepts_official_https_links() {
        assert!(is_official_url("https://www.gov.br/inep/pt-br"));
        assert!(is_official_url("https://fuvest.br/edital.pdf"));
        assert!(is_official_url("https://www.comvest.unicamp.br/"));
    }

    #[test]
    fn rejects_everything_else() {
        for value in [
            "http://www.fuvest.br/",
            "https://fuvest.br.site-falso.com/",
            "https://falsofuvest.br/",
            "https://user:pass@www.fuvest.br/",
            "https://www.fuvest.br:8443/",
            "fuvest.br",
            "",
        ] {
            assert!(!is_official_url(value), "{value}");
        }
    }
}

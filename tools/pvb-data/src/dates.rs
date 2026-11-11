//! Calendar helpers. Rules mirror src/lib/dates/iso-date.ts.

/// Day number since 1970-01-01 for a real calendar date written as YYYY-MM-DD.
/// Years below 100 are rejected to match JavaScript's Date.UTC behavior.
pub fn epoch_day(value: &str) -> Option<i64> {
    let bytes = value.as_bytes();
    if !value.is_ascii() || bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-' {
        return None;
    }

    let number = |range: std::ops::Range<usize>| -> Option<i64> {
        let part = &value[range];
        if part.bytes().all(|b| b.is_ascii_digit()) {
            part.parse().ok()
        } else {
            None
        }
    };

    let year = number(0..4)?;
    let month = number(5..7)?;
    let day = number(8..10)?;

    if year < 100 || !(1..=12).contains(&month) || day < 1 || day > days_in_month(year, month) {
        return None;
    }

    Some(days_from_civil(year, month, day))
}

/// True for a 24-hour time written as HH:MM.
pub fn is_time_hhmm(value: &str) -> bool {
    let b = value.as_bytes();
    if b.len() != 5 || b[2] != b':' {
        return false;
    }
    let digits = [b[0], b[1], b[3], b[4]];
    if !digits.iter().all(u8::is_ascii_digit) {
        return false;
    }
    let hour = (b[0] - b'0') * 10 + (b[1] - b'0');
    let minute = (b[3] - b'0') * 10 + (b[4] - b'0');
    hour < 24 && minute < 60
}

fn is_leap_year(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || year % 400 == 0
}

fn days_in_month(year: i64, month: i64) -> i64 {
    match month {
        2 if is_leap_year(year) => 29,
        2 => 28,
        4 | 6 | 9 | 11 => 30,
        _ => 31,
    }
}

/// Howard Hinnant's days_from_civil algorithm.
fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let y = if month <= 2 { year - 1 } else { year };
    let era = y.div_euclid(400);
    let year_of_era = y - era * 400;
    let shifted_month = (month + 9) % 12;
    let day_of_year = (153 * shifted_month + 2) / 5 + day - 1;
    let day_of_era = year_of_era * 365 + year_of_era / 4 - year_of_era / 100 + day_of_year;
    era * 146_097 + day_of_era - 719_468
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn epoch_starts_at_zero() {
        assert_eq!(epoch_day("1970-01-01"), Some(0));
    }

    #[test]
    fn counts_whole_days_across_years() {
        let a = epoch_day("2026-12-31").unwrap();
        let b = epoch_day("2027-01-01").unwrap();
        assert_eq!(b - a, 1);
    }

    #[test]
    fn handles_leap_years() {
        assert!(epoch_day("2028-02-29").is_some());
        assert!(epoch_day("2027-02-29").is_none());
        assert!(epoch_day("2000-02-29").is_some());
        assert!(epoch_day("1900-02-29").is_none());
    }

    #[test]
    fn rejects_bad_formats() {
        for value in ["2027-1-01", "07/11/2027", "", "2027-13-01", "2027-02-30", "0001-01-01", "2027-0a-01", "2027-é1-01"] {
            assert!(epoch_day(value).is_none(), "{value}");
        }
    }

    #[test]
    fn checks_times() {
        assert!(is_time_hhmm("00:00"));
        assert!(is_time_hhmm("23:59"));
        for value in ["24:00", "12:60", "1:00", "12-00", "ab:cd", ""] {
            assert!(!is_time_hhmm(value), "{value}");
        }
    }
}

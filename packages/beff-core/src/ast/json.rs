#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub(crate) struct N {
    integral: i64,
    fractional: Option<i64>,
}

impl N {
    pub(crate) fn to_f64(&self) -> f64 {
        self.integral as f64 + self.fractional.unwrap_or(0) as f64 / 1_000_000_000.0
    }

    pub(crate) fn to_serde(&self) -> serde_json::Value {
        let v = if let Some(fractional) = self.fractional {
            serde_json::Number::from_f64(self.integral as f64 + fractional as f64 / 1_000_000_000.0)
                .expect("should be possible to convert f64 to json number")
        } else {
            serde_json::Number::from(self.integral)
        };
        serde_json::Value::Number(v)
    }

    /// The number as JavaScript's `String(n)` prints it, e.g. `1` or `1.5`.
    pub(crate) fn to_js_string(&self) -> String {
        match self.fractional {
            None => self.integral.to_string(),
            Some(_) => self.to_f64().to_string(),
        }
    }

    pub(crate) fn parse_f64(it: f64) -> Self {
        if it.fract() == 0.0 {
            return Self::parse_int(it.trunc() as i64);
        }
        N {
            integral: it.trunc() as i64,
            fractional: Some((it.fract() * 1_000_000_000.0) as i64),
        }
    }
    pub(crate) fn parse_int(it: i64) -> Self {
        N {
            integral: it,
            fractional: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) enum Json {
    Bool(bool),
    Number(N),
}

impl Json {
    pub(crate) fn to_serde(&self) -> serde_json::Value {
        match self {
            Json::Bool(b) => serde_json::Value::Bool(*b),
            Json::Number(n) => n.to_serde(),
        }
    }

    pub(crate) fn debug_print(&self) -> String {
        serde_json::to_string_pretty(&self.to_serde())
            .expect("should be possible to serialize json")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_number_conversion() {
        let num1 = N::parse_f64(42.0);
        assert_eq!(num1.integral, 42);
        assert_eq!(num1.fractional, None);

        let num2 = N::parse_f64(7.12345);
        assert_eq!(num2.integral, 7);
        assert_eq!(num2.fractional, Some(123450000));

        let f64_value = num2.to_f64();
        assert!((f64_value - 7.12345).abs() < 1e-6);

        let num3 = N::parse_int(100);
        assert_eq!(num3.integral, 100);
        assert_eq!(num3.fractional, None);
    }
}

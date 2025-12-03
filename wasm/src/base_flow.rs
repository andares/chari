use wasm_bindgen::prelude::*;

const DIGITS: &str = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

#[wasm_bindgen]
pub struct BaseFlow {
    hex: String,
}

#[wasm_bindgen]
impl BaseFlow {
    #[wasm_bindgen(constructor)]
    pub fn new(value: &str, base: u32) -> Result<BaseFlow, JsValue> {
        if base == 16 {
            let hex = value.trim_start_matches("0x").to_lowercase();
            if !hex.chars().all(|c| c.is_ascii_hexdigit()) {
                return Err(JsValue::from_str("Invalid hex string"));
            }
            Ok(BaseFlow { hex })
        } else if (2..=62).contains(&base) {
            let big_val = base_to_bigint(value, base)?;
            let hex = format!("{:x}", big_val);
            Ok(BaseFlow { hex })
        } else {
            Err(JsValue::from_str(&format!("Base must be between 2 and 62, got {}", base)))
        }
    }

    pub fn to(&self, base: u32) -> Result<String, JsValue> {
        if base == 16 {
            return Ok(self.hex.clone());
        }
        if !(2..=62).contains(&base) {
            return Err(JsValue::from_str(&format!("Base must be between 2 and 62, got {}", base)));
        }
        let num = u128::from_str_radix(&self.hex, 16)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(bigint_to_base(num, base))
    }

    #[wasm_bindgen(js_name = fromAlpha)]
    pub fn from_alpha(alpha: &str) -> Result<BaseFlow, JsValue> {
        let mut mapped = String::new();
        for ch in alpha.chars() {
            let code = ch as u32;
            if (97..=122).contains(&code) {
                if code <= 106 {
                    mapped.push(char::from_u32(code - 49).unwrap());
                } else {
                    mapped.push(char::from_u32(code - 10).unwrap());
                }
            } else {
                return Err(JsValue::from_str(&format!("Invalid alpha character: {}. Expected a-z.", ch)));
            }
        }
        let num = base_to_bigint(&mapped, 26)?;
        Ok(BaseFlow { hex: format!("{:x}", num) })
    }

    #[wasm_bindgen(js_name = toAlpha)]
    pub fn to_alpha(&self) -> Result<String, JsValue> {
        let num = u128::from_str_radix(&self.hex, 16)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        let base26_str = bigint_to_base(num, 26);
        let mut result = String::new();
        for ch in base26_str.chars() {
            let code = ch as u32;
            if (48..=57).contains(&code) {
                result.push(char::from_u32(code + 49).unwrap());
            } else if (97..=112).contains(&code) {
                result.push(char::from_u32(code + 10).unwrap());
            } else {
                return Err(JsValue::from_str(&format!("Unexpected base26 digit: {}", ch)));
            }
        }
        Ok(result)
    }
}

fn bigint_to_base(mut value: u128, base: u32) -> String {
    if value == 0 {
        return "0".to_string();
    }
    let mut result = String::new();
    let base = base as u128;
    while value > 0 {
        let idx = (value % base) as usize;
        result.insert(0, DIGITS.chars().nth(idx).unwrap());
        value /= base;
    }
    result
}

fn base_to_bigint(s: &str, base: u32) -> Result<u128, JsValue> {
    if s.is_empty() {
        return Err(JsValue::from_str("Empty string cannot be converted"));
    }
    let mut result: u128 = 0;
    let base = base as u128;
    for ch in s.chars() {
        let idx = DIGITS.find(ch)
            .ok_or_else(|| JsValue::from_str(&format!("Invalid character: {}", ch)))?;
        if idx >= base as usize {
            return Err(JsValue::from_str(&format!("Invalid character \"{}\" for base {}", ch, base)));
        }
        result = result.checked_mul(base)
            .and_then(|r| r.checked_add(idx as u128))
            .ok_or_else(|| JsValue::from_str("Overflow during conversion"))?;
    }
    Ok(result)
}

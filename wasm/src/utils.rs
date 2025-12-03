use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = randomAlpha)]
pub fn random_alpha(length: usize, mode: Option<String>) -> String {
    let chars = match mode.as_deref() {
        Some("alpha36") => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        _ => "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    };
    let base = chars.len();
    let byte_limit = if base == 36 { 252 } else { 248 };
    
    let mut result = String::with_capacity(length);
    let mut bytes = vec![0u8; length * 2];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut bytes);
    let mut used = 0;
    
    for _ in 0..length {
        let mut byte = bytes[used];
        used += 1;
        while byte >= byte_limit {
            if used >= bytes.len() {
                rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut bytes);
                used = 0;
            }
            byte = bytes[used];
            used += 1;
        }
        let idx = (byte as usize) % base;
        result.push(chars.chars().nth(idx).unwrap());
    }
    result
}

#[wasm_bindgen(js_name = bin2hex)]
pub fn bin2hex(buffer: &[u8]) -> String {
    hex::encode(buffer)
}

#[wasm_bindgen(js_name = hex2bin)]
pub fn hex2bin(hex_str: &str) -> Result<Vec<u8>, JsValue> {
    hex::decode(hex_str).map_err(|e| JsValue::from_str(&e.to_string()))
}

use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = generateCode)]
pub fn generate_code(plaintext: &str) -> String {
    if plaintext.is_empty() {
        return r#""""#.to_string();
    }

    let key = (rand::random::<u8>() % 255) + 1;
    let obfuscated: Vec<String> = plaintext
        .chars()
        .map(|ch| ((ch as u8) ^ key).to_string())
        .collect();
    let data = obfuscated.join(", ");

    format!("((k => String.fromCharCode(...[{}].map(x => x ^ k)))({})", data, key)
}

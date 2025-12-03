use wasm_bindgen::prelude::*;
use serde_json::Value;

#[wasm_bindgen]
pub struct ParamSimplifier;

#[wasm_bindgen]
impl ParamSimplifier {
    /// Encode data to simplified msgpack format (returns Uint8Array)
    #[wasm_bindgen]
    pub fn encode(input: JsValue) -> Result<Vec<u8>, JsValue> {
        let value: Value = serde_wasm_bindgen::from_value(input)?;
        let simplified = simplify_value(&value);

        // For now, just serialize to JSON and return as bytes
        // In production, should use rmp-serde for msgpack
        let json_str = serde_json::to_string(&simplified)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        Ok(json_str.into_bytes())
    }
}

fn simplify_value(value: &Value) -> Value {
    match value {
        Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_) => value.clone(),
        Value::Array(arr) => {
            if arr.is_empty() {
                return Value::String("[*EM*]".to_string());
            }

            if is_pure_list(arr) {
                if let Some(first) = arr.iter().find(|v| !v.is_null()) {
                    if is_simple_type(first) {
                        return Value::String(format!("[*LI:{}*]", arr.len()));
                    } else if first.is_object() {
                        let keys = extract_keys(first);
                        return Value::String(format!("[*CO:{}:{}*]", arr.len(), keys.join(",")));
                    } else if first.is_array() {
                        return Value::String(format!("[*CO:{}*]", arr.len()));
                    }
                } else {
                    return Value::String(format!("[*LI:{}*]", arr.len()));
                }
            } else {
                let keys = extract_array_keys(arr);
                return Value::String(format!("[*RE:{}*]", keys.join(",")));
            }
            value.clone()
        }
        Value::Object(obj) => {
            if obj.is_empty() {
                return Value::String("[*EM*]".to_string());
            }
            let mut keys: Vec<_> = obj.keys().cloned().collect();
            keys.sort();
            Value::String(format!("[*RE:{}*]", keys.join(",")))
        }
    }
}

fn is_simple_type(value: &Value) -> bool {
    matches!(value, Value::Null | Value::Bool(_) | Value::Number(_) | Value::String(_))
}

fn is_pure_list(arr: &[Value]) -> bool {
    arr.len() == arr.len()
}

fn extract_keys(value: &Value) -> Vec<String> {
    if let Value::Object(obj) = value {
        let mut keys: Vec<_> = obj.keys().cloned().collect();
        keys.sort();
        keys
    } else {
        vec![]
    }
}

fn extract_array_keys(arr: &[Value]) -> Vec<String> {
    let mut keys = Vec::new();
    for (i, _) in arr.iter().enumerate() {
        keys.push(i.to_string());
    }
    keys.retain(|k| k.parse::<usize>().is_err());
    keys.sort();
    keys
}

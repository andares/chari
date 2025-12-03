use wasm_bindgen::prelude::*;
use hmac::{Hmac, Mac};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

#[wasm_bindgen]
pub struct CryptoManager;

#[wasm_bindgen]
impl CryptoManager {
    #[wasm_bindgen(js_name = packKey)]
    pub fn pack_key(key: &[u8]) -> Result<String, JsValue> {
        let hex = hex::encode(key);
        // Use BaseFlow to convert to base62
        let bf = crate::BaseFlow::new(&hex, 16)?;
        bf.to(62)
    }

    #[wasm_bindgen(js_name = unpackKey)]
    pub fn unpack_key(packed: &str) -> Result<Vec<u8>, JsValue> {
        let bf = crate::BaseFlow::new(packed, 62)?;
        let hex = bf.to(16)?;
        hex::decode(&hex).map_err(|e| JsValue::from_str(&e.to_string()))
    }

    #[wasm_bindgen(js_name = generateMasterKey)]
    pub fn generate_master_key() -> Result<String, JsValue> {
        let mut key = [0u8; 32];
        loop {
            rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut key);
            if key[0] >= 0x10 {
                break;
            }
        }
        Self::pack_key(&key)
    }

    #[wasm_bindgen(js_name = deriveKey)]
    pub fn derive_key(master_key_packed: &str, info: Option<String>) -> Result<String, JsValue> {
        let master_raw = Self::unpack_key(master_key_packed)?;
        let info_string = info.unwrap_or_default();
        let info_bytes = info_string.as_bytes();

        // Simple HKDF implementation (sha256, zero salt, 32 bytes output)
        let salt = [0u8; 32];
        let mut mac = HmacSha256::new_from_slice(&salt)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        mac.update(&master_raw);
        let prk = mac.finalize().into_bytes();

        let mut mac2 = HmacSha256::new_from_slice(&prk)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        mac2.update(info_bytes);
        mac2.update(&[1u8]);
        let okm = mac2.finalize().into_bytes();

        Self::pack_key(&okm[..32])
    }

    #[wasm_bindgen]
    pub fn sign(
        derived_key_packed: &str,
        challenge: &str,
        params: JsValue,
        timestamp_window: Option<u32>,
    ) -> Result<String, JsValue> {
        let derived_key_raw = Self::unpack_key(derived_key_packed)?;
        let ts_win = timestamp_window.unwrap_or_else(|| {
            (js_sys::Date::now() / 1000.0 / 10.0).floor() as u32
        });

        // Convert params to JSON string
        let params_str = if params.is_string() {
            params.as_string().unwrap()
        } else {
            js_sys::JSON::stringify(&params)
                .map_err(|e| JsValue::from_str(&format!("JSON stringify error: {:?}", e)))?
                .as_string().unwrap()
        };

        let message = format!("{}|{}|{}", params_str, challenge, ts_win);

        let mut mac = HmacSha256::new_from_slice(&derived_key_raw)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;
        mac.update(message.as_bytes());
        let result = mac.finalize().into_bytes();

        Ok(hex::encode(result))
    }

    #[wasm_bindgen]
    pub fn verify(
        derived_key_packed: &str,
        challenge: &str,
        params: JsValue,
        signature: &str,
        allowed_window_drift: Option<bool>,
    ) -> Result<bool, JsValue> {
        let derived_key_raw = Self::unpack_key(derived_key_packed)?;
        let now_win = (js_sys::Date::now() / 1000.0 / 10.0).floor() as u32;

        // Convert params to JSON string
        let params_str = if params.is_string() {
            params.as_string().unwrap()
        } else {
            js_sys::JSON::stringify(&params)
                .map_err(|e| JsValue::from_str(&format!("JSON stringify error: {:?}", e)))?
                .as_string().unwrap()
        };
        let drift = allowed_window_drift.unwrap_or(true);

        let try_verify = |win: u32| -> Result<bool, JsValue> {
            let message = format!("{}|{}|{}", params_str, challenge, win);
            let mut mac = HmacSha256::new_from_slice(&derived_key_raw)
                .map_err(|e| JsValue::from_str(&e.to_string()))?;
            mac.update(message.as_bytes());
            let expected = hex::encode(mac.finalize().into_bytes());
            Ok(expected == signature)
        };

        if try_verify(now_win)? {
            return Ok(true);
        }
        if drift && now_win > 0 && try_verify(now_win - 1)? {
            return Ok(true);
        }
        Ok(false)
    }
}

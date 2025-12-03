use wasm_bindgen::prelude::*;

mod base_flow;
mod crypto_manager;
mod obfus;
mod param_simplifier;
mod utils;

pub use base_flow::*;
pub use crypto_manager::*;
pub use obfus::*;
pub use param_simplifier::*;
pub use utils::*;

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

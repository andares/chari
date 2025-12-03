# @andares/chari

![CI](https://github.com/andares/chari/actions/workflows/ci.yml/badge.svg?branch=master)
![version](https://img.shields.io/npm/v/%40andares%2Fchari?label=version)
![pnpm](https://img.shields.io/badge/pnpm-enabled-FFD700?logo=pnpm&logoColor=white)
![license](https://img.shields.io/npm/l/%40andares%2Fchari)
![node](https://img.shields.io/node/v/%40andares%2Fchari)

高性能 TypeScript/WASM 工具库，包含：

- **`BaseFlow`**：WASM 驱动的 2-62 进制转换、a-z Alpha 映射
- **`CryptoManager`**：WASM 加速的 HKDF 密钥派生、HMAC 签名验证
- **`Gauldoth`**：3DES 加解密与自定义 IV 打包/拆包
- **`Obfus`**：WASM 实现的 XOR 混淆代码生成
- **`ParamSimplifier`**：WASM 结构化数据压缩
- **`Utils`**：WASM 随机字符串生成、二进制/十六进制互转

## 特性

- 🚀 **WASM 加速**: 核心模块使用 Rust/WASM 实现,性能卓越
- 📦 **双格式导出**: 同时支持 ESM 和 CommonJS
- 🔒 **类型安全**: 完整的 TypeScript 类型定义
- ✅ **测试覆盖**: 40+ 单元测试确保稳定性

## 安装

```sh
pnpm add @andares/chari
```

## 开发要求

构建此项目需要:

- **Node.js** >= 18
- **pnpm** 10+
- **Rust** & **wasm-pack** (用于构建 WASM 模块)

安装 Rust 和 wasm-pack:

```sh
# 安装 Rust (如果尚未安装)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack
cargo install wasm-pack
```

开发/构建与测试：

```sh
pnpm install
pnpm run build        # 构建 WASM + TypeScript
pnpm run build:wasm   # 仅构建 WASM 模块
pnpm run test         # 运行测试
pnpm run test:watch   # 监听模式
pnpm run test:coverage # 生成覆盖率报告
```

## 使用

ESM：

```ts
import { BaseFlow, CryptoManager, Gauldoth, Obfus, ParamSimplifier, Utils } from '@andares/chari'

// BaseFlow - WASM 加速的进制转换
const bf = new BaseFlow('ff', 16)
bf.to(2) // '11111111'
bf.to(62) // 'XX'
BaseFlow.fromAlpha('abcxyz').toAlpha() // 'bcxyz' (前导 a 被去除,与 PHP GMP 一致)

// CryptoManager - WASM 密钥管理与签名
const masterKey = CryptoManager.generateMasterKey()
const derivedKey = CryptoManager.deriveKey(masterKey, 'auth')
const signature = CryptoManager.sign(derivedKey, 'challenge123', { uid: 1 })
const valid = CryptoManager.verify(derivedKey, 'challenge123', { uid: 1 }, signature)

// Gauldoth - 3DES 加密
const g = Gauldoth.create({ key: 'k1', ivKey: 'k2' })
const token = g.encrypt({ uid: 1 })
const data = g.decrypt(token)

// Obfus - WASM XOR 混淆
const code = Obfus.generateCode('alert("Hello")')
// eval(code) === 'alert("Hello")'

// ParamSimplifier - WASM 结构压缩
const compressed = ParamSimplifier.encode({ users: [{ id: 1 }, { id: 2 }] })

// Utils - WASM 工具函数
Utils.randomAlpha(16) // 随机 base62 字符串
Utils.bin2hex(Buffer.from('hi')) // '6869'
Utils.hex2bin('6869') // Buffer<68 69>
```

CommonJS：

```js
const { Gauldoth, BaseFlow, Obfus, Utils } = require('@andares/chari')
```

## 架构

```
src/
├── wasm/              # TypeScript WASM 封装层
│   ├── BaseFlow.ts
│   ├── CryptoManager.ts
│   ├── Obfus.ts
│   ├── ParamSimplifier.ts
│   └── utils.ts
├── encryption/        # 纯 TypeScript 实现 (Gauldoth)
├── generators/        # 纯 TypeScript 实现 (向后兼容)
└── utils/            # 纯 TypeScript 实现 (向后兼容)

wasm/                  # Rust WASM 源码
├── src/
│   ├── base_flow.rs
│   ├── crypto_manager.rs
│   ├── obfus.rs
│   ├── param_simplifier.rs
│   └── utils.rs
└── pkg/              # 编译输出 (随包发布)
```

## 开发

- 构建 WASM：`pnpm run build:wasm`
- 完整构建：`pnpm run build`（WASM + TypeScript，输出 `dist/` + `wasm/pkg/`）
- 开发监视：`pnpm run dev`
- 单测：`pnpm run test`（Vitest，40 项测试）
- 覆盖率：`pnpm run test:coverage`

## Import Alias

为了便于在源码中引用模块（如 `Gauldoth`），已配置 import alias：

- `@` → `src/`
- `@chari` → `src/`

示例：

```ts
import { Gauldoth } from '@/encryption/Gauldoth'
// 或
import { Gauldoth } from '@chari/encryption/Gauldoth'
```

编辑器类型提示通过 `tsconfig.json` 的 `paths` 支持，构建与测试分别通过 `tsup.config.ts` 与 `vitest.config.ts` 的 `alias` 解析。

## 发布

该包已配置双格式导出（`exports` 字段），默认：

- `import`: `dist/index.js`（ESM）
- `require`: `dist/index.cjs`（CJS）
- `types`: `dist/index.d.ts`

如需发布到 npm：

```sh
pnpm publish --access public
```

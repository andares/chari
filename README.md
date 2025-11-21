# @andares/chari

![CI](https://github.com/andares/chari/actions/workflows/ci.yml/badge.svg?branch=master)
![version](https://img.shields.io/npm/v/%40andares%2Fchari?label=version)
![pnpm](https://img.shields.io/badge/pnpm-enabled-FFD700?logo=pnpm&logoColor=white)
![license](https://img.shields.io/npm/l/%40andares%2Fchari)
![node](https://img.shields.io/node/v/%40andares%2Fchari)

TypeScript 工具库，包含：
- `Gauldoth`：3DES 加解密与自定义打包/拆包
- `BaseFlow`：2-62 进制转换、a-z Alpha 映射
- `Obfus`：字符串简单混淆代码生成
- `Utils`：随机字符串、二进制/十六进制互转

## 安装

```sh
pnpm add @andares/chari
```

开发/构建与测试：

```sh
pnpm install
pnpm run build
pnpm run test # 一次性运行
pnpm run test:watch # 监听模式
pnpm run test:coverage # 生成覆盖率报告（text/html/lcov 在 coverage/）
```

## 使用

ESM：

```ts
import { Gauldoth, BaseFlow, Obfus, Utils } from '@andares/chari'

// Gauldoth
const g = Gauldoth.create({ key: 'k1', ivKey: 'k2' })
const token = g.encrypt({ uid: 1 })
const text = g.decrypt(token)

// BaseFlow
const bf = new BaseFlow('ff', 16)
bf.to(2) // '11111111'
// Alpha 映射（注意：与 PHP GMP 行为一致，会丢弃前导 a）
BaseFlow.fromAlpha('abcxyz').toAlpha() // 'bcxyz'

// Obfus
const code = Obfus.generateCode('Hello')
// eval(code) === 'Hello'

// Utils
Utils.randomAlpha(8) // base62 字符串
Utils.bin2hex(Buffer.from('hi')) // '6869'
```

CommonJS：

```js
const { Gauldoth, BaseFlow, Obfus, Utils } = require('@andares/chari')
```

## 开发

- 构建：`pnpm run build`（输出 `dist/`，同时生成类型声明）
- 开发监视：`pnpm run dev`
- 单测：`pnpm run test`（Vitest，默认 Node 环境）
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

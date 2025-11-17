# chari

一个使用 TypeScript 编写的轻量库，提供函数/类方法供其他项目复用。内置 `tsup` 构建与主流轻量测试框架 `Vitest`。

## 安装

```sh
pnpm add chari
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
import { sum, greet, Chari } from 'chari'

console.log(sum(2, 3)) // 5
console.log(greet('Chari')) // Hello, Chari!
console.log(new Chari('Tester').hello()) // Hello, Tester!
```

CommonJS：

```js
const { sum, greet, Chari } = require('chari')
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

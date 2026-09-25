# 驰拓 AI 助手 macOS 构建快照

本仓库是驰拓 AI 助手 macOS 构建使用的**最小公开构建快照**，用于在 GitHub 标准 macOS runner 上生成未签名、未公证的测试包。正式服务地址为 [fab.gdibao.com](https://fab.gdibao.com)，品牌方为无锡市驰拓信息科技有限公司。

## 范围

仓库只包含 Mac 构建直接需要的桌面入口、共享客户端包、Vite/Electron Builder 配置、驰拓 Mac 图标、必要运行资源、依赖清单与许可证文件。Windows/Linux 构建、独立 CLI 源码、小程序、官网、服务端业务、运维配置、用户数据、知识库、助手数据、报告和密钥不在本仓库。

`apps/desktop/resources/bin/lobe-cli.js` 是随桌面端运行所需的已审查嵌入运行时，并非 CLI 源码；公开构建不会从被排除的 `apps/cli` 源码重新生成它。上游兼容包名、协议字段和许可证归属保留在必要位置，不代表本仓库公开了上游私有服务或生产凭据。

## 构建

构建入口是 `.github/workflows/build-macos.yml`，仅支持手动触发。工作流使用标准 `macos-15` Apple Silicon runner 与 `macos-15-intel` Intel runner，分别产出对应架构的 DMG 和 ZIP，并上传带 SHA-256 清单的 Actions 工件。

本地构建需要 Node.js 24.x、pnpm 10.33.0、可用的 macOS Electron 原生依赖环境；仓库不提供签名证书、公证凭据或生产环境变量。可运行：

```sh
pnpm install
pnpm run desktop:package:mac
```

产物位于 `apps/desktop/release/`。未签名包可能触发 macOS Gatekeeper 提示，不能当作已签名或已公证发布包；测试时应按组织安全策略处理，不以关闭系统防护替代验证。

## 许可

请同时阅读根目录 `LICENSE` 与 `apps/desktop/THIRD_PARTY_NOTICES.md`。本快照保留必要的上游开源归属，不将上游项目标记为驰拓原创。

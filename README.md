# 估值罗盘 (ValuCompass)

一个基于 Next.js 开发的纯前端“实时基金估值 + 持仓管理 + 重仓股追踪”工具。采用玻璃拟态设计（Glassmorphism），支持移动端适配，且无需后端服务器即可运行。
预览地址：[https://liuyihua2015.github.io/real-time-fund/](https://liuyihua2015.github.io/real-time-fund/)

## ✨ 特性

- **实时估值**：通过输入基金编号，实时获取并展示基金的单位净值、估值净值及实时涨跌幅。
- **重仓追踪**：自动获取基金前 10 大重仓股票，并实时追踪重仓股的盘中涨跌情况。支持收起/展开展示。
- **纯前端运行**：采用 JSONP 方案直连东方财富、腾讯财经等公开接口，彻底解决跨域问题，支持在 GitHub Pages 等静态环境直接部署。
- **本地持久化**：使用 `localStorage` 存储已添加的基金列表及配置信息，刷新不丢失。
- **响应式设计**：完美适配 PC 与移动端。针对移动端优化了文字展示、间距及交互体验。
- **自选功能**：支持将基金添加至“自选”列表，通过 Tab 切换展示全部基金或仅自选基金。自选状态支持持久化及同步清理。
- **可自定义频率**：支持设置自动刷新间隔（5秒 - 300秒），并提供手动刷新按钮。

## 🛠 技术栈

- **框架**：[Next.js](https://nextjs.org/) (App Router)
- **样式**：原生 CSS (Global CSS) + 玻璃拟态设计
- **数据源**：
  - 基金估值：天天基金 (JSONP)
  - 重仓数据：东方财富 (HTML Parsing)
  - 股票行情：腾讯财经 (Script Tag Injection)
- **部署**：GitHub Actions + GitHub Pages

## 🚀 快速开始

### 本地开发

1. 克隆仓库：

   ```bash
   git clone https://github.com/liuyihua2015/real-time-fund.git
   cd real-time-fund
   ```

2. 安装依赖：

   ```bash
   npm install
   ```

3. 配置环境变量（用于“意见反馈”功能）：
   - 复制示例文件并填入你的 Web3Forms Access Key：
     ```bash
     cp .env.local.example .env.local
     ```
   - 编辑 `.env.local`：
     - `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY=...`
   - 收件邮箱（例如 `529732278@qq.com`）需要在 Web3Forms 后台配置，不在代码里配置。

4. 运行开发服务器：
   ```bash
   npm run dev
   ```
   访问 [http://localhost:3000](http://localhost:3000) 查看效果。

### 构建与部署

本项目已配置 GitHub Actions。每次推送到 `main` 分支时，会自动执行构建并部署到 GitHub Pages。

若要手动构建：

```bash
npm run build
```

静态文件将生成在 `out` 目录下。

## 💬 意见反馈（Web3Forms）

本项目的“意见反馈”使用 Web3Forms（前端直连 `https://api.web3forms.com/submit`）提交表单数据。

- Access Key：在环境变量 `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` 中配置（见 `.env.local.example`）。
- 收件邮箱：在 Web3Forms 控制台配置（例如改为 `529732278@qq.com`），需要你登录对应的 Web3Forms 账号后修改。
- 线上部署：如果部署到 Vercel / 其他平台，需要在平台的环境变量配置中同步设置 `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY`。

## 📖 使用说明

1. **添加基金**：在顶部输入框输入 6 位基金代码（如 `110022`），点击“添加”。
2. **查看详情**：卡片将展示实时估值及前 10 重仓股的占比与今日涨跌。
3. **调整频率**：点击右上角“设置”图标，可调整自动刷新的间隔时间。
4. **删除基金**：点击卡片右上角的红色删除图标即可移除。

## 📝 免责声明

本项目所有数据均来自公开接口，仅供个人学习及参考使用。数据可能存在延迟，不作为任何投资建议。

## 📄 开源协议 (License)

本项目采用 **[GNU Affero General Public License v3.0](https://www.gnu.org/licenses/agpl-3.0.html)**（AGPL-3.0）开源协议。

- **允许**：自由使用、修改、分发本软件；若你通过网络服务向用户提供基于本项目的修改版本，须向该服务的用户提供对应源代码。
- **要求**：基于本项目衍生或修改的作品需以相同协议开源，并保留版权声明与协议全文。
- **无担保**：软件按「原样」提供，不提供任何明示或暗示的担保。

完整协议文本见仓库根目录 [LICENSE](./LICENSE) 文件，或 [GNU AGPL v3 官方说明](https://www.gnu.org/licenses/agpl-3.0.html)。

---

Made by [hzm](https://github.com/liuyihua2015)

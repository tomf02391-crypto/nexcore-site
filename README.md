---
AIGC:
    Label: "1"
    ContentProducer: 001191440300708461136T1XGW3
    ProduceID: 99a729afe2763da7bf1a71430112a3ab_d0cc1586bf3611f1887c525400de85a5
    ReservedCode1: gRYaiX5VCS47a70BkUxrC7/eqc6kDO1SIfOQFkmkydZhGsuHD/tMMHwFwjW7sdCjeBQj+uenB1LU9QZsEtqc/CgRWOggLY7/w91603Jxftkr9wAWZJIBdu4sQ6KdOd5GFmb6MArlo5mNtFQ53uOnfk1CzTI0kYu0y9Oirk9ZyRJEpyNlCmE7EkVzKps=
    ContentPropagator: 001191440300708461136T1XGW3
    PropagateID: 99a729afe2763da7bf1a71430112a3ab_d0cc1586bf3611f1887c525400de85a5
    ReservedCode2: gRYaiX5VCS47a70BkUxrC7/eqc6kDO1SIfOQFkmkydZhGsuHD/tMMHwFwjW7sdCjeBQj+uenB1LU9QZsEtqc/CgRWOggLY7/w91603Jxftkr9wAWZJIBdu4sQ6KdOd5GFmb6MArlo5mNtFQ53uOnfk1CzTI0kYu0y9Oirk9ZyRJEpyNlCmE7EkVzKps=
---

# 星枢科技 · 静态官网

星枢科技企业展示静态官网，纯 HTML / CSS / JavaScript 实现，无框架依赖，可直接浏览器打开或部署到任意静态托管平台。

## 站点结构

```
output/
├── index.html        # 首页（Hero / 核心产品 / 服务入口 / Telegram 入口）
├── about.html        # 关于我们（公司简介 / 使命愿景 / 能力与承诺）
├── products.html     # 产品服务（星枢云平台 / 星枢AI智能平台 / 星枢数据中台 / 数字化咨询）
├── cases.html        # 客户案例（通用能力示意，无虚构企业数据）
├── pricing.html      # 价格方案（三档套餐对比）
├── team.html         # 团队（工作方式与原则，无虚构人员）
├── blog.html         # 新闻动态（示例文章，明确标注示例）
├── faq.html          # 常见问题（折叠交互）
├── contact.html      # 联系我们（联系方式 / 咨询表单）
├── dns.html          # 域名管理后台（DNSHE API 直连，noindex，robots 屏蔽）
├── 404.html          # 404 错误页
├── style.css         # 全站共享样式（CSS 变量 + 响应式）
├── script.js         # 全站共享脚本（导航高亮 / FAQ 折叠 / 表单校验等）
├── js/
│   ├── dns-config.js # DNSHE 配置层（密钥不预填 + localStorage 保存）
│   └── dns-page.js   # DNSHE 页面逻辑（搜索 / 分页 / 批量删除 / TTL 编辑 / keys / quota / whois）
├── favicon.ico       # 站点图标
├── robots.txt        # 搜索引擎爬虫规则（已屏蔽 /dns.html）
├── sitemap.xml       # 站点地图（不含 dns.html）
└── README.md         # 本说明文件
```

## 本地预览

双击 `index.html` 即可在浏览器中查看；推荐使用本地静态服务器以获得完整路由体验：

```bash
# Python 3
python -m http.server 8080
# 然后访问 http://localhost:8080
```

## 部署

任意静态托管平台均可直接部署（将本目录整体上传）：

- **Nginx / Apache**：将 `output/` 下所有文件放入站点根目录即可。
- **GitHub Pages / Vercel / Netlify / Cloudflare Pages**：把 `output/` 作为发布目录（或作为仓库根目录直接发布）。
- 部署后请按实际域名更新 `sitemap.xml` 中的 URL。

## 域名管理后台（dns.html）

后台直连 [DNSHE](https://www.dnshe.com) v2.0 API（base `https://api005.dnshe.com/index.php?m=domain_hub`）：

- 配置：密钥**不预填**，由用户在使用页面时输入，仅保存在浏览器 localStorage；`js/dns-config.js` 中不包含任何真实密钥。
- 能力：域名列表（subdomains）、解析记录查询与增删改（dns_records / add_dns_record / update_dns_record / delete_dns_record）、记录搜索筛选、记录分页、批量删除、TTL 行内编辑、密钥管理（keys）、配额查询（quota）、WHOIS 查询（whois）。
- 鉴权：请求头 `X-API-Key` / `X-API-Secret`，POST JSON，请求全部走 HTTPS；密钥不出现在 URL 或日志中。
- 安全：`dns.html` 已加 `<meta name="robots" content="noindex,nofollow">`，`robots.txt` 已屏蔽 `/dns.html`，页面明确提示为管理功能页、不会被公开索引。
- 注意：TTL 编辑会依次尝试 `update_dns_record` / `edit_dns_record` / `modify_dns_record` / `update_record` 动作；若您的 DNSHE 接口不支持在线修改，将提示删除后重新添加。

## 定制提示

- 全站导航与页脚在各页面 HTML 内维护，改动后请同步所有页面（header `nav-links` 与 footer「快速导航」）。
- 视觉风格集中在 `style.css`（CSS 变量 + 992/768/480 三档断点）。
- 站点不展示虚构公司实体、地址、电话、团队成员等信息；功能性示例（表单 placeholder、DNS 记录示例等）保留并明确标注"示例"。
- 维护 `dns-config.js` 时请保持"密钥不预填"安全形态，严禁写入任何真实密钥。
*（内容由AI生成，仅供参考）*

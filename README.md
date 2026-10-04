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

# NexCore 科技 · 静态官网

NexCore 科技企业展示静态官网，纯 HTML / CSS / JavaScript 实现，无框架依赖，可直接浏览器打开或部署到任意静态托管平台。

## 站点结构

```
output/
├── index.html        # 首页（Hero / 核心产品 / 数据指标 / 客户评价）
├── about.html        # 关于我们（公司简介 / 使命愿景 / 发展历程）
├── products.html     # 产品服务（NexCloud / NexAI / NexData / 数字化咨询）
├── cases.html        # 客户案例（行业案例卡片）
├── pricing.html      # 价格方案（三档套餐对比）
├── team.html         # 团队介绍（管理层 / 核心技术团队）
├── blog.html         # 新闻动态（文章列表 + 详情弹层）
├── faq.html          # 常见问题（折叠交互）
├── contact.html      # 联系我们（联系方式 / 咨询表单）
├── dns.html          # 域名管理后台（DNSHE API 直连）
├── 404.html          # 404 错误页
├── style.css         # 全站共享样式（CSS 变量 + 响应式）
├── script.js         # 全站共享脚本（导航高亮 / FAQ 折叠 / 表单校验等）
├── js/
│   ├── dns-config.js # DNSHE 配置层（预填密钥 + localStorage 覆盖）
│   └── dns-page.js   # DNSHE 页面逻辑（搜索 / 分页 / 批量删除 / TTL 编辑）
├── favicon.ico       # 站点图标
├── robots.txt        # 搜索引擎爬虫规则
├── sitemap.xml       # 站点地图
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

后台直连 [DNSHE](https://www.dnshe.com) v2.0 API：

- 配置：`js/dns-config.js` 预填 API Key / Secret 与接口地址，页面内修改后保存到浏览器 localStorage。
- 能力：域名列表、解析记录查询、记录搜索筛选、记录分页、新增记录、单条/批量删除、TTL 行内编辑、刷新列表。
- 鉴权：请求头 `X-API-Key` / `X-API-Secret`，POST JSON。
- 注意：TTL 编辑会依次尝试 `update_dns_record` / `edit_dns_record` / `modify_dns_record` / `update_record` 动作；若您的 DNSHE 接口不支持在线修改，将提示删除后重新添加。

## 定制提示

- 全站导航与页脚在各页面 HTML 内维护，改动后请同步所有页面（header `nav-links` 与 footer「快速导航」）。
- 视觉风格集中在 `style.css`（CSS 变量 + 992/768/480 三档断点）。
- 示例内容（企业名、联系方式、案例、价格）为演示数据，上线前请替换为真实信息。
*（内容由AI生成，仅供参考）*

/* =========================================================
   DNSHE 域名管理 - 密钥配置模块
   预填密钥 + 页面内可改 + localStorage 覆盖 + 安全提示
   ========================================================= */
(function (window) {
  "use strict";

  var STORAGE_KEY = "dnshe_config_v1";

  /* ---------- 默认预填配置（首次使用） ---------- */
  var DEFAULT_CONFIG = {
    apiKey: "63fcb7dfc9e849312b358f31b0431dc7012c9e31bd96d3cc400ae548907be5d2",
    apiSecret: "cfsd_b84226862a7e96a1063b9def7acb5c33",
    baseUrl: "https://api005.dnshe.com/index.php?m=domain_hub",
    // 端点 action 名称（如与实际 API 不符可在此调整）
    endpoints: {
      subdomains: "subdomains",          // 域名列表
      dns_records: "dns_records",        // 解析记录列表（需传 domain）
      add_record: "add_dns_record",      // 新增解析记录
      delete_record: "delete_dns_record" // 删除解析记录（需传 record id）
    }
  };

  /* ---------- 读取配置：localStorage 优先，无则用预填值 ---------- */
  function loadConfig() {
    var saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    } catch (e) {
      saved = null;
    }
    if (saved && saved.apiKey && saved.apiSecret) {
      // 合并，保证新增字段可用
      return mergeConfig(saved);
    }
    return mergeConfig(DEFAULT_CONFIG);
  }

  function mergeConfig(partial) {
    var base = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    for (var key in partial) {
      if (Object.prototype.hasOwnProperty.call(partial, key)) {
        base[key] = partial[key];
      }
    }
    if (partial.endpoints) {
      for (var ep in DEFAULT_CONFIG.endpoints) {
        if (partial.endpoints[ep]) {
          base.endpoints[ep] = partial.endpoints[ep];
        }
      }
    }
    return base;
  }

  /* ---------- 保存配置到 localStorage ---------- */
  function saveConfig(cfg) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- 重置为默认预填配置 ---------- */
  function resetConfig() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return mergeConfig(DEFAULT_CONFIG);
  }

  /* ---------- 是否使用了预填密钥 ---------- */
  function isUsingDefault() {
    var cfg = loadConfig();
    return (
      cfg.apiKey === DEFAULT_CONFIG.apiKey &&
      cfg.apiSecret === DEFAULT_CONFIG.apiSecret
    );
  }

  window.DNSHE_CONFIG = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    load: loadConfig,
    save: saveConfig,
    reset: resetConfig,
    isUsingDefault: isUsingDefault
  };
})(window); --name Editing dns-config.js file

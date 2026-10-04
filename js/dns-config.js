/* =========================================================
   DNSHE 域名管理 - 密钥配置模块
   密钥由用户在页面自行输入，仅保存在浏览器 localStorage
   ========================================================= */
(function (window) {
  "use strict";

  var STORAGE_KEY = "dnshe_config_v1";

  /* ---------- 默认预填配置（首次使用） ---------- */
  var DEFAULT_CONFIG = {
    // 密钥不预填，由用户在使用页面时自行输入（仅存 localStorage）
    apiKey: "",
    apiSecret: "",
    baseUrl: "https://api005.dnshe.com/index.php?m=domain_hub",
    // 端点 action 名称（如与实际 API 不符可在此调整）
    endpoints: {
      subdomains: "subdomains",          // 子域/域名列表
      dns_records: "dns_records",        // 解析记录列表（需传 subdomain_id / domain）
      add_record: "add_dns_record",      // 新增解析记录
      update_record: "update_dns_record",// 更新解析记录（需传 record id）
      delete_record: "delete_dns_record",// 删除解析记录（需传 record id）
      keys: "keys",                      // 密钥列表
      quota: "quota",                    // 配额查询
      whois: "whois"                     // WHOIS 查询
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

  /* ---------- 重置：清除本地保存的密钥配置 ---------- */
  function resetConfig() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    return mergeConfig(DEFAULT_CONFIG);
  }

  /* ---------- 是否已配置密钥 ---------- */
  function hasCredentials() {
    var cfg = loadConfig();
    return !!(cfg.apiKey && cfg.apiSecret);
  }

  window.DNSHE_CONFIG = {
    STORAGE_KEY: STORAGE_KEY,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    load: loadConfig,
    save: saveConfig,
    reset: resetConfig,
    hasCredentials: hasCredentials
  };
})(window);

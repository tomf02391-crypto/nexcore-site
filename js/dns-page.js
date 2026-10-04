/* =========================================================
   DNSHE 域名管理 - 页面逻辑（强化版）
   前端直调 DNSHE v2.0 API（X-API-Key / X-API-Secret 鉴权）
   新增：域名/记录搜索筛选、记录分页、批量删除、TTL 行内编辑、
         记录独立刷新、错误态 / 空态展示
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 状态 ---------- */
  var cfg = DNSHE_CONFIG.load();
  var currentDomain = null;   // 当前选中的域名
  var _allDomains = null;     // 全部域名（缓存，供本地筛选）
  var _allRecords = [];       // 当前域名全部解析记录（原始列表）
  var _filteredRecords = [];  // 过滤后的记录
  var _currentPage = 1;       // 当前页码
  var PAGE_SIZE = 8;          // 每页条数
  var pendingDeleteMode = null; // 'single' | 'batch'
  var pendingDeleteId = null;   // 单条删除 id
  var pendingBatchIds = [];     // 批量删除 id 数组

  /* ---------- DOM 引用 ---------- */
  var msgBox = document.getElementById("msgBox");
  var apiKeyInput = document.getElementById("apiKey");
  var apiSecretInput = document.getElementById("apiSecret");
  var baseUrlInput = document.getElementById("baseUrl");
  var configState = document.getElementById("configState");
  var domainsBody = document.getElementById("domainsBody");
  var recordsBody = document.getElementById("recordsBody");
  var addRecordPanel = document.getElementById("addRecordPanel");
  var addRecordTarget = document.getElementById("addRecordTarget");
  var addRecordBtn = document.getElementById("addRecordBtn");
  var batchDeleteBtn = document.getElementById("batchDeleteBtn");
  var refreshRecordsBtn = document.getElementById("refreshRecordsBtn");
  var selectAllCheck = document.getElementById("selectAllRecords");
  var recordSearch = document.getElementById("recordSearch");
  var domainSearch = document.getElementById("domainSearch");
  var paginationBox = document.getElementById("recordPagination");
  var pageInfo = document.getElementById("pageInfo");
  var pageNums = document.getElementById("pageNums");
  var pagePrevBtn = document.getElementById("pagePrevBtn");
  var pageNextBtn = document.getElementById("pageNextBtn");
  var deleteModal = document.getElementById("deleteModal");
  var deleteModalText = document.getElementById("deleteModalText");

  // 错误态容器（可选：页面存在则使用，否则回退 msgBox）
  var errState = document.getElementById("dnsErrorState");

  /* ---------- 消息提示 ---------- */
  function showMsg(text, type) {
    msgBox.textContent = text;
    msgBox.className = "msg show msg-" + (type || "success");
    if (type === "loading") {
      msgBox.className = "msg show msg-loading";
    }
    if (type === "error") {
      msgBox.className = "msg show msg-error";
    }
  }

  function hideMsg() {
    msgBox.className = "msg";
  }

  /* ---------- 配置填充 / 保存 ---------- */
  function fillConfigForm() {
    apiKeyInput.value = cfg.apiKey;
    apiSecretInput.value = cfg.apiSecret;
    baseUrlInput.value = cfg.baseUrl;
    updateConfigState();
  }

  function updateConfigState() {
    if (DNSHE_CONFIG.isUsingDefault()) {
      configState.textContent = "已使用预填密钥";
      configState.className = "badge badge-ok";
    } else {
      configState.textContent = "已使用自定义密钥";
      configState.className = "badge badge-warn";
    }
  }

  function saveConfigForm() {
    var key = apiKeyInput.value.trim();
    var secret = apiSecretInput.value.trim();
    var baseUrl = baseUrlInput.value.trim() || DNSHE_CONFIG.DEFAULT_CONFIG.baseUrl;

    if (!key || !secret) {
      showMsg("API Key 与 API Secret 均不能为空", "error");
      return;
    }

    cfg = {
      apiKey: key,
      apiSecret: secret,
      baseUrl: baseUrl,
      endpoints: DNSHE_CONFIG.load().endpoints
    };

    if (DNSHE_CONFIG.save(cfg)) {
      showMsg("配置已保存到浏览器 localStorage，下次打开自动生效。");
      updateConfigState();
    } else {
      showMsg("配置保存失败，请检查浏览器存储权限。", "error");
    }
  }

  function resetConfigForm() {
    if (!window.confirm("确定恢复默认预填密钥吗？自定义配置将被清除。")) {
      return;
    }
    cfg = DNSHE_CONFIG.reset();
    fillConfigForm();
    showMsg("已恢复默认预填密钥。");
  }

  function toggleSecretVisibility() {
    var isPwd = apiKeyInput.type === "password";
    apiKeyInput.type = isPwd ? "text" : "password";
    apiSecretInput.type = isPwd ? "text" : "password";
    document.getElementById("toggleSecretBtn").textContent = isPwd ? "隐藏密钥" : "显示密钥";
  }

  /* ---------- DNSHE API 调用封装 ---------- */
  function apiCall(action, params) {
    var body = { action: action };
    for (var key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        body[key] = params[key];
      }
    }

    return fetch(cfg.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": cfg.apiKey,
        "X-API-Secret": cfg.apiSecret
      },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (!res.ok) {
          return Promise.reject(new Error("HTTP " + res.status));
        }
        return res.json();
      })
      .then(function (data) {
        if (data && data.success === true) {
          return data;
        }
        var errMsg = (data && (data.message || data.error_msg || data.msg)) || "请求失败";
        var err = new Error(errMsg);
        err.data = data;
        return Promise.reject(err);
      });
  }

  /* ---------- 通用列表提取 / 字段解析 ---------- */
  function extractList(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.list)) return data.list;
    if (Array.isArray(data.subdomains)) return data.subdomains;
    if (Array.isArray(data.result)) return data.result;
    return [];
  }

  function domainNameOf(item) {
    if (typeof item === "string") return item;
    return (
      item.domain ||
      item.name ||
      item.subdomain ||
      item.host ||
      item.domain_name ||
      item.hostname ||
      "未命名域名"
    );
  }

  function domainStatusOf(item) {
    if (typeof item === "object" && item !== null) {
      return item.status || item.state || item.active || item.is_active || null;
    }
    return null;
  }

  function domainExpireOf(item) {
    if (typeof item === "object" && item !== null) {
      return (
        item.expire_at ||
        item.expire_time ||
        item.expires_at ||
        item.expiry_date ||
        item.valid_to ||
        null
      );
    }
    return null;
  }

  function statusBadge(status) {
    var text = String(status == null ? "" : status).toLowerCase();
    if (text === "" || text === "active" || text === "正常" || text === "ok" || text === "1") {
      return '<span class="badge badge-ok">正常</span>';
    }
    if (text === "expired" || text === "过期" || text === "0") {
      return '<span class="badge badge-danger">已过期</span>';
    }
    return '<span class="badge badge-warn">' + (status == null ? "—" : status) + "</span>";
  }

  function recordOf(item) {
    if (typeof item === "string") {
      return { type: "TXT", name: "@", value: item, ttl: null, id: null };
    }
    return item || {};
  }

  function recTypeClass(type) {
    var t = String(type || "").toUpperCase();
    var map = { A: "rec-type-a", AAAA: "rec-type-aaaa", CNAME: "rec-type-cname", MX: "rec-type-mx", TXT: "rec-type-txt", NS: "rec-type-ns" };
    return map[t] || "";
  }

  function recIdOf(r) {
    return r.id || r.record_id || r.rec_id || r.dns_id || null;
  }

  function recTtlOf(r) {
    return r.ttl || r.ttl_seconds || r.record_ttl || null;
  }

  /* ---------- 域名列表（搜索筛选） ---------- */
  function loadDomains() {
    showMsg("正在加载域名列表...", "loading");
    return apiCall(cfg.endpoints.subdomains)
      .then(function (data) {
        hideMsg();
        var list = extractList(data);
        renderDomains(list);
      })
      .catch(function (err) {
        showMsg("加载域名失败：" + err.message, "error");
        renderDomains([]);
      });
  }

  function renderDomains(list) {
    var kw = (domainSearch.value || "").trim().toLowerCase();
    var filtered = list;
    if (kw) {
      filtered = list.filter(function (item) {
        return String(domainNameOf(item)).toLowerCase().indexOf(kw) !== -1;
      });
    }

    if (!filtered || filtered.length === 0) {
      domainsBody.innerHTML =
        '<tr class="empty-row"><td colspan="4">' +
        (kw ? '未找到与「' + escHtml(kw) + '」匹配的域名' : "未获取到域名数据") +
        "</td></tr>";
      return;
    }

    var html = "";
    filtered.forEach(function (item, index) {
      var name = domainNameOf(item);
      var status = domainStatusOf(item);
      var expire = domainExpireOf(item);
      var selected = currentDomain === name ? " style='background:#dbeafe;'" : "";
      html +=
        "<tr data-domain='" + escAttr(name) + "'" + selected + ">" +
        "<td><strong>" + escHtml(name) + "</strong></td>" +
        "<td>" + statusBadge(status) + "</td>" +
        "<td>" + (expire ? escHtml(expire) : "—") + "</td>" +
        "<td><button class='btn btn-primary btn-sm' data-action='select' data-index='" + index + "'>选择并查看记录</button></td>" +
        "</tr>";
    });
    domainsBody.innerHTML = html;
  }

  /* ---------- 解析记录（加载 / 搜索 / 分页） ---------- */
  function loadRecords() {
    if (!currentDomain) {
      showMsg("请先在域名列表中选择一个域名。", "error");
      return;
    }
    showMsg("正在加载 " + currentDomain + " 的解析记录...", "loading");
    return apiCall(cfg.endpoints.dns_records, { domain: currentDomain })
      .then(function (data) {
        hideMsg();
        _allRecords = extractList(data);
        resetFilterAndPage();
        renderRecords();
      })
      .catch(function (err) {
        showMsg("加载解析记录失败：" + err.message, "error");
        _allRecords = [];
        resetFilterAndPage();
        renderRecords();
      });
  }

  function resetFilterAndPage() {
    _currentPage = 1;
    applyRecordFilter();
    if (selectAllCheck) selectAllCheck.checked = false;
    updateBatchDeleteState();
  }

  function applyRecordFilter() {
    var kw = (recordSearch.value || "").trim().toLowerCase();
    if (!kw) {
      _filteredRecords = _allRecords.slice();
      return;
    }
    _filteredRecords = _allRecords.filter(function (raw) {
      var r = recordOf(raw);
      var type = String(r.type || "A").toLowerCase();
      var name = String(r.name || r.host || r.host_record || r.subdomain || "@").toLowerCase();
      var value = String(r.value || r.content || r.target || r.address || r.data || "").toLowerCase();
      return type.indexOf(kw) !== -1 || name.indexOf(kw) !== -1 || value.indexOf(kw) !== -1;
    });
  }

  function renderRecords() {
    if (!currentDomain) {
      recordsBody.innerHTML = '<tr class="empty-row"><td colspan="6">请先选择域名并刷新列表</td></tr>';
      hidePagination();
      return;
    }

    if (_allRecords.length === 0) {
      recordsBody.innerHTML = '<tr class="empty-row"><td colspan="6">该域名暂无解析记录，可点击「新增记录」添加</td></tr>';
      hidePagination();
      updateBatchDeleteState();
      return;
    }

    applyRecordFilter();

    if (_filteredRecords.length === 0) {
      recordsBody.innerHTML = '<tr class="empty-row"><td colspan="6">未找到与当前搜索条件匹配的记录</td></tr>';
      hidePagination();
      updateBatchDeleteState();
      return;
    }

    var total = _filteredRecords.length;
    var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (_currentPage > totalPages) _currentPage = totalPages;

    var start = (_currentPage - 1) * PAGE_SIZE;
    var pageItems = _filteredRecords.slice(start, start + PAGE_SIZE);

    var html = "";
    pageItems.forEach(function (raw, index) {
      var globalIndex = start + index;
      var r = recordOf(raw);
      var type = r.type || "A";
      var name = r.name || r.host || r.host_record || r.subdomain || "@";
      var value = r.value || r.content || r.target || r.address || r.data || "—";
      var ttl = recTtlOf(r);
      var id = recIdOf(r);

      html +=
        "<tr data-id='" + escAttr(id == null ? "" : id) + "'>" +
        "<td><input type='checkbox' class='row-check' data-index='" + globalIndex + "'" + (id == null ? " disabled" : "") + " /></td>" +
        "<td><span class='rec-type " + recTypeClass(type) + "'>" + escHtml(String(type).toUpperCase()) + "</span></td>" +
        "<td>" + escHtml(name) + "</td>" +
        "<td>" + escHtml(value) + "</td>" +
        "<td class='ttl-cell'>" +
        "<input type='number' class='ttl-input' min='60' step='60' value='" + escAttr(ttl == null ? "600" : ttl) + "' data-index='" + globalIndex + "'" + (id == null ? " disabled" : "") + " />" +
        (id ? "<button class='btn btn-outline btn-sm btn-ttl-save' data-action='save-ttl' data-index='" + globalIndex + "'>保存</button>" : "") +
        "</td>" +
        "<td>" +
        (id
          ? "<button class='btn btn-danger btn-sm' data-action='delete' data-index='" + globalIndex + "'>删除</button>"
          : "<span style='color:var(--gray-400);font-size:0.8rem;'>无ID</span>") +
        "</td>" +
        "</tr>";
    });
    recordsBody.innerHTML = html;
    renderPagination(total, totalPages);

    // 全选框状态
    if (selectAllCheck) {
      var checkboxes = recordsBody.querySelectorAll(".row-check:not(:disabled)");
      var checkedCount = recordsBody.querySelectorAll(".row-check:checked").length;
      selectAllCheck.checked = checkboxes.length > 0 && checkedCount === checkboxes.length;
    }
    updateBatchDeleteState();
  }

  function hidePagination() {
    if (paginationBox) paginationBox.style.display = "none";
  }

  function renderPagination(total, totalPages) {
    if (!paginationBox) return;
    paginationBox.style.display = "flex";
    pageInfo.textContent = "共 " + total + " 条记录 · 第 " + _currentPage + "/" + totalPages + " 页（每页 " + PAGE_SIZE + " 条）";
    pagePrevBtn.disabled = _currentPage <= 1;
    pageNextBtn.disabled = _currentPage >= totalPages;

    var nums = "";
    var startPage = Math.max(1, _currentPage - 2);
    var endPage = Math.min(totalPages, _currentPage + 2);

    if (startPage > 1) {
      nums += '<button class="page-num" data-page="1">1</button>';
      if (startPage > 2) nums += '<span class="page-ellipsis">…</span>';
    }
    for (var p = startPage; p <= endPage; p++) {
      nums += '<button class="page-num' + (p === _currentPage ? " active" : "") + '" data-page="' + p + '">' + p + "</button>";
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) nums += '<span class="page-ellipsis">…</span>';
      nums += '<button class="page-num" data-page="' + totalPages + '">' + totalPages + "</button>";
    }
    pageNums.innerHTML = nums;
  }

  /* ---------- 批量删除 ---------- */
  function collectSelectedIds() {
    var ids = [];
    var checks = recordsBody.querySelectorAll(".row-check:checked");
    checks.forEach(function (cb) {
      var idx = parseInt(cb.getAttribute("data-index"), 10);
      var r = recordOf(_filteredRecords[idx]);
      var id = recIdOf(r);
      if (id != null) ids.push({ id: id, r: r });
    });
    return ids;
  }

  function updateBatchDeleteState() {
    if (!batchDeleteBtn) return;
    var selected = collectSelectedIds();
    batchDeleteBtn.disabled = selected.length === 0;
  }

  function askBatchDelete() {
    var selected = collectSelectedIds();
    if (selected.length === 0) {
      showMsg("请先勾选需要删除的解析记录。", "error");
      return;
    }
    pendingDeleteMode = "batch";
    pendingBatchIds = selected.map(function (s) { return s.id; });
    deleteModalText.innerHTML =
      "确认删除以下 <strong>" + selected.length + "</strong> 条解析记录？该操作不可撤销。<br/>" +
      selected.map(function (s, i) {
        return (i + 1) + ". " + escHtml((s.r.type || "A") + " " + (s.r.name || s.r.host || "@") + " → " + (s.r.value || s.r.content || "—"));
      }).join("<br/>");
    deleteModal.classList.add("show");
  }

  /* ---------- 单条删除 ---------- */
  function askDelete(index) {
    var r = recordOf(_filteredRecords[index]);
    var id = recIdOf(r);
    if (!id) {
      showMsg("该记录缺少记录 ID，无法删除（请检查 API 返回字段）。", "error");
      return;
    }
    pendingDeleteMode = "single";
    pendingDeleteId = id;
    deleteModalText.textContent =
      "类型 " + (r.type || "A") + " · 主机记录 " + (r.name || r.host || "@") + " · 记录值 " + (r.value || r.content || "—");
    deleteModal.classList.add("show");
  }

  function doDelete(domain, recordId) {
    return apiCall(cfg.endpoints.delete_record, {
      domain: domain,
      record_id: recordId
    });
  }

  function confirmDelete() {
    deleteModal.classList.remove("show");
    if (pendingDeleteMode === "batch") {
      var ids = pendingBatchIds.slice();
      pendingDeleteMode = null;
      pendingBatchIds = [];
      if (ids.length === 0) return;

      showMsg("正在批量删除 " + ids.length + " 条解析记录...", "loading");
      var chain = Promise.resolve();
      var successCount = 0;
      var failed = [];
      ids.forEach(function (id) {
        chain = chain
          .then(function () { return doDelete(currentDomain, id); })
          .then(function () { successCount++; })
          .catch(function (err) { failed.push(String(err.message)); });
      });
      chain.then(function () {
        if (failed.length > 0) {
          showMsg("批量删除完成：成功 " + successCount + " 条，失败 " + failed.length + " 条（" + failed[0] + "）", "error");
        } else {
          showMsg("已成功删除 " + successCount + " 条解析记录。");
        }
        return loadRecords();
      });
      return;
    }

    if (pendingDeleteMode === "single") {
      var idSingle = pendingDeleteId;
      pendingDeleteMode = null;
      pendingDeleteId = null;
      if (!idSingle) return;

      showMsg("正在删除解析记录...", "loading");
      doDelete(currentDomain, idSingle)
        .then(function () {
          hideMsg();
          showMsg("解析记录删除成功。");
          return loadRecords();
        })
        .catch(function (err) {
          showMsg("删除记录失败：" + err.message, "error");
        });
    }
  }

  function cancelDelete() {
    pendingDeleteMode = null;
    pendingDeleteId = null;
    pendingBatchIds = [];
    deleteModal.classList.remove("show");
  }

  /* ---------- TTL 编辑 ---------- */
  function saveTtl(index) {
    var r = recordOf(_filteredRecords[index]);
    var id = recIdOf(r);
    if (!id) {
      showMsg("该记录缺少记录 ID，无法编辑 TTL。", "error");
      return;
    }

    var input = recordsBody.querySelector(".ttl-input[data-index='" + index + "']");
    if (!input) return;
    var newTtl = parseInt(input.value, 10);
    if (!newTtl || newTtl < 60) {
      showMsg("TTL 需为不小于 60 的整数（秒）。", "error");
      return;
    }

    showMsg("正在更新 TTL...", "loading");
    // 优先尝试常见 update 类接口；不同版本 API 动作名略有差异
    var updateActions = ["update_dns_record", "edit_dns_record", "modify_dns_record", "update_record"];
    var attempt = 0;
    var lastErr = null;

    function tryNext() {
      if (attempt >= updateActions.length) {
        showMsg("TTL 更新失败：" + (lastErr ? lastErr.message : "接口不支持在线修改 TTL，可删除后重新添加。"), "error");
        return;
      }
      var action = updateActions[attempt++];
      apiCall(action, {
        domain: currentDomain,
        record_id: id,
        ttl: newTtl,
        type: r.type || "A",
        name: r.name || r.host || r.host_record || "@",
        value: r.value || r.content || r.target || r.address || r.data || ""
      })
        .then(function () {
          hideMsg();
          showMsg("TTL 已更新为 " + newTtl + " 秒。");
          return loadRecords();
        })
        .catch(function (err) {
          lastErr = err;
          tryNext();
        });
    }
    tryNext();
  }

  /* ---------- 新增记录 ---------- */
  function openAddRecord() {
    if (!currentDomain) {
      showMsg("请先选择域名。", "error");
      return;
    }
    addRecordTarget.textContent = "目标域名：" + currentDomain;
    addRecordPanel.style.display = "block";
    addRecordPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeAddRecord() {
    addRecordPanel.style.display = "none";
  }

  function submitRecord() {
    var type = document.getElementById("recType").value;
    var name = document.getElementById("recName").value.trim();
    var value = document.getElementById("recValue").value.trim();
    var ttl = parseInt(document.getElementById("recTtl").value, 10) || 600;

    if (!name) {
      showMsg("主机记录不能为空。", "error");
      return;
    }
    if (!value) {
      showMsg("记录值不能为空。", "error");
      return;
    }

    showMsg("正在新增解析记录...", "loading");
    apiCall(cfg.endpoints.add_record, {
      domain: currentDomain,
      type: type,
      name: name,
      value: value,
      ttl: ttl
    })
      .then(function () {
        hideMsg();
        closeAddRecord();
        showMsg("解析记录新增成功。");
        return loadRecords();
      })
      .catch(function (err) {
        showMsg("新增记录失败：" + err.message, "error");
      });
  }

  /* ---------- 事件绑定 ---------- */
  document.getElementById("saveConfigBtn").addEventListener("click", saveConfigForm);
  document.getElementById("resetConfigBtn").addEventListener("click", resetConfigForm);
  document.getElementById("toggleSecretBtn").addEventListener("click", toggleSecretVisibility);
  document.getElementById("refreshDomainsBtn").addEventListener("click", function () {
    loadDomains();
  });
  refreshRecordsBtn.addEventListener("click", function () {
    if (!currentDomain) {
      showMsg("请先选择域名。", "error");
      return;
    }
    loadRecords();
  });
  addRecordBtn.addEventListener("click", openAddRecord);
  document.getElementById("submitRecordBtn").addEventListener("click", submitRecord);
  document.getElementById("cancelRecordBtn").addEventListener("click", closeAddRecord);
  document.getElementById("deleteCancelBtn").addEventListener("click", cancelDelete);
  document.getElementById("deleteConfirmBtn").addEventListener("click", confirmDelete);
  batchDeleteBtn.addEventListener("click", askBatchDelete);

  // 域名搜索（输入即本地筛选；未加载时先触发加载）
  domainSearch.addEventListener("input", function () {
    if (_allDomains) {
      renderDomains(_allDomains);
    } else {
      loadDomains();
    }
  });

  // 记录搜索（输入即筛选 + 分页重置）
  recordSearch.addEventListener("input", function () {
    _currentPage = 1;
    renderRecords();
  });

  // 全选 / 取消全选（仅当前页）
  selectAllCheck.addEventListener("change", function () {
    var checked = selectAllCheck.checked;
    recordsBody.querySelectorAll(".row-check:not(:disabled)").forEach(function (cb) {
      cb.checked = checked;
    });
    updateBatchDeleteState();
  });

  // 单行勾选联动全选
  recordsBody.addEventListener("change", function (e) {
    if (e.target.classList && e.target.classList.contains("row-check")) {
      var boxes = recordsBody.querySelectorAll(".row-check:not(:disabled)");
      var checked = recordsBody.querySelectorAll(".row-check:checked");
      if (selectAllCheck) selectAllCheck.checked = boxes.length > 0 && checked.length === boxes.length;
      updateBatchDeleteState();
    }
  });

  // 分页按钮
  pagePrevBtn.addEventListener("click", function () {
    if (_currentPage > 1) {
      _currentPage--;
      renderRecords();
    }
  });
  pageNextBtn.addEventListener("click", function () {
    var totalPages = Math.max(1, Math.ceil(_filteredRecords.length / PAGE_SIZE));
    if (_currentPage < totalPages) {
      _currentPage++;
      renderRecords();
    }
  });
  pageNums.addEventListener("click", function (e) {
    var btn = e.target.closest(".page-num");
    if (!btn) return;
    _currentPage = parseInt(btn.getAttribute("data-page"), 10);
    renderRecords();
  });

  // 事件委托：域名选择 / 记录删除 / TTL 保存
  domainsBody.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.getAttribute("data-action") === "select") {
      var tr = btn.closest("tr");
      var domain = tr.getAttribute("data-domain");
      currentDomain = domain;
      addRecordBtn.disabled = false;
      // 高亮当前行
      domainsBody.querySelectorAll("tr").forEach(function (row) {
        row.style.background = row === tr ? "#dbeafe" : "";
      });
      loadRecords();
    }
  });

  recordsBody.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var index = parseInt(btn.getAttribute("data-index"), 10);
    if (action === "delete") {
      askDelete(index);
    } else if (action === "save-ttl") {
      saveTtl(index);
    }
  });

  /* ---------- 工具函数 ---------- */
  function escHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escAttr(str) {
    return escHtml(str);
  }

  /* ---------- 初始化 ---------- */
  fillConfigForm();
})();

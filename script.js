/* =========================================================
   星枢科技 - 全局交互脚本
   导航切换 / 表单校验 / 返回顶部 / 页脚年份
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 移动端导航切换 ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      navLinks.classList.toggle("open");
      navToggle.classList.toggle("active");
    });

    // 点击导航链接后自动收起菜单
    navLinks.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navLinks.classList.remove("open");
        navToggle.classList.remove("active");
      });
    });
  }

  /* ---------- 当前页高亮（根据文件名自动匹配） ---------- */
  var currentPage = location.pathname.split("/").pop() || "index.html";
  var currentLink = document.querySelector(
    '.nav-links a[href="' + currentPage + '"]'
  );
  if (currentLink) {
    currentLink.classList.add("active");
  }

  /* ---------- 返回顶部 ---------- */
  var backTop = document.querySelector(".back-top");

  if (backTop) {
    window.addEventListener("scroll", function () {
      if (window.scrollY > 300) {
        backTop.classList.add("visible");
      } else {
        backTop.classList.remove("visible");
      }
    });

    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 数字滚动动画（统计区） ---------- */
  var statItems = document.querySelectorAll(".stat-item .num");
  var statsSection = document.querySelector(".stats");
  var animated = false;

  if (statItems.length && statsSection) {
    function animateStats() {
      if (animated) return;
      var rect = statsSection.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        animated = true;
        statItems.forEach(function (el) {
          var target = parseInt(el.getAttribute("data-target") || el.textContent.replace(/[^0-9]/g, ""), 10) || 0;
          var suffix = el.getAttribute("data-suffix") || "";
          var duration = 1400;
          var start = null;

          function step(timestamp) {
            if (!start) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(target * eased).toLocaleString() + suffix;
            if (progress < 1) {
              requestAnimationFrame(step);
            }
          }
          requestAnimationFrame(step);
        });
      }
    }

    window.addEventListener("scroll", animateStats);
    animateStats();
  }

  /* ---------- 联系表单校验 ---------- */
  var contactForm = document.querySelector("#contactForm");

  if (contactForm) {
    var nameInput = contactForm.querySelector("#name");
    var emailInput = contactForm.querySelector("#email");
    var phoneInput = contactForm.querySelector("#phone");
    var subjectInput = contactForm.querySelector("#subject");
    var messageInput = contactForm.querySelector("#message");
    var successBox = contactForm.querySelector(".form-success");

    function setInvalid(input, invalid) {
      var group = input.closest(".form-group");
      if (group) {
        group.classList.toggle("invalid", invalid);
      }
    }

    function validateName() {
      var valid = nameInput.value.trim().length >= 2;
      setInvalid(nameInput, !valid);
      return valid;
    }

    function validateEmail() {
      var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
      setInvalid(emailInput, !valid);
      return valid;
    }

    function validatePhone() {
      var value = phoneInput.value.trim();
      // 手机号码可空，填写时需为 7~15 位数字（可含 + - 空格）
      if (value === "") return true;
      var valid = /^[+]?[\d\s-]{7,15}$/.test(value);
      setInvalid(phoneInput, !valid);
      return valid;
    }

    function validateSubject() {
      var valid = subjectInput.value.trim() !== "";
      setInvalid(subjectInput, !valid);
      return valid;
    }

    function validateMessage() {
      var valid = messageInput.value.trim().length >= 5;
      setInvalid(messageInput, !valid);
      return valid;
    }

    // 失焦即时校验
    if (nameInput) nameInput.addEventListener("blur", validateName);
    if (emailInput) emailInput.addEventListener("blur", validateEmail);
    if (phoneInput) phoneInput.addEventListener("blur", validatePhone);
    if (subjectInput) subjectInput.addEventListener("blur", validateSubject);
    if (messageInput) messageInput.addEventListener("blur", validateMessage);

    // 输入时清除错误状态
    [nameInput, emailInput, phoneInput, subjectInput, messageInput].forEach(
      function (input) {
        if (input) {
          input.addEventListener("input", function () {
            setInvalid(input, false);
          });
        }
      }
    );

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      var checks = [
        validateName(),
        validateEmail(),
        validatePhone(),
        validateSubject(),
        validateMessage()
      ];

      if (checks.every(Boolean)) {
        if (successBox) {
          successBox.style.display = "block";
          contactForm.reset();
          // 4 秒后隐藏成功提示
          setTimeout(function () {
            successBox.style.display = "none";
          }, 4000);
        }
      } else {
        var firstInvalid = contactForm.querySelector(".form-group.invalid");
        if (firstInvalid) {
          firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  /* ---------- FAQ 折叠交互 ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");

    if (q && a) {
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        // 手风琴：关闭其他项
        document.querySelectorAll(".faq-item.open").forEach(function (other) {
          if (other !== item) {
            other.classList.remove("open");
            other.querySelector(".faq-a").style.maxHeight = null;
            other.querySelector(".faq-q .faq-toggle").textContent = "+";
          }
        });
        if (isOpen) {
          item.classList.remove("open");
          a.style.maxHeight = null;
          q.querySelector(".faq-toggle").textContent = "+";
        } else {
          item.classList.add("open");
          a.style.maxHeight = a.scrollHeight + "px";
          q.querySelector(".faq-toggle").textContent = "−";
        }
      });
    }
  });

  /* ---------- 页脚版权年份 ---------- */
  var yearEl = document.querySelector("#currentYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
})();

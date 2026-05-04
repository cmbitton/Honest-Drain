(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var body = document.body;

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      var isOpen = body.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  var currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".primary-nav > ul > li > a").forEach(function (link) {
    var linkPage = link.getAttribute("href").split("#")[0];
    if (linkPage === currentPage) {
      link.classList.add("is-active");
    }
  });

  document.querySelectorAll(".primary-nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      body.classList.remove("nav-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  if (currentPage !== "contact.html") {
    var mobileAction = document.createElement("div");
    mobileAction.className = "mobile-action-bar";
    mobileAction.setAttribute("aria-label", "Quick service actions");
    mobileAction.setAttribute("aria-hidden", "true");
    mobileAction.innerHTML = '<a class="mobile-action-bar__book" href="contact.html">Book</a><a class="mobile-action-bar__call" href="tel:15552197473">Call</a>';
    body.appendChild(mobileAction);
    var mobileActionLinks = mobileAction.querySelectorAll("a");

    var updateMobileAction = function () {
      var shouldShow = window.innerWidth <= 580 && window.scrollY > Math.max(520, window.innerHeight * 0.85);
      mobileAction.classList.toggle("is-visible", shouldShow);
      body.classList.toggle("has-mobile-action", shouldShow);
      mobileAction.setAttribute("aria-hidden", String(!shouldShow));
      mobileActionLinks.forEach(function (link) {
        link.setAttribute("tabindex", shouldShow ? "0" : "-1");
      });
    };

    window.addEventListener("scroll", updateMobileAction, { passive: true });
    window.addEventListener("resize", updateMobileAction);
    updateMobileAction();
  }

  document.querySelectorAll(".faq-item button").forEach(function (button, index) {
    var item = button.closest(".faq-item");
    var panel = item ? item.querySelector("div") : null;
    if (panel) {
      var panelId = panel.id || "faq-panel-" + index;
      panel.id = panelId;
      panel.setAttribute("aria-hidden", "true");
      button.setAttribute("aria-controls", panelId);
    }

    button.addEventListener("click", function () {
      var item = button.closest(".faq-item");
      var isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      var panel = item.querySelector("div");
      if (panel) {
        panel.setAttribute("aria-hidden", String(!isOpen));
      }
    });
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && body.classList.contains("nav-open")) {
      body.classList.remove("nav-open");
      if (navToggle) {
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    }
  });

  var form = document.querySelector(".contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var note = form.querySelector(".form-note");
      if (note) {
        note.textContent = "Thanks. Please call for urgent service while the online booking connection is being finalized.";
      }
    });
  }
})();

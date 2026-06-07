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

  // Chevron SVG used by all collapse toggles in the mobile nav.
  var CHEVRON_SVG = '<svg class="chevron" viewBox="0 0 12 12" aria-hidden="true" focusable="false"><path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function makeToggleButton(label) {
    var btn = document.createElement("button");
    btn.className = "nav-toggle-chevron";
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", label);
    btn.innerHTML = CHEVRON_SVG;
    return btn;
  }

  // Add a top-level toggle for has-menu items so each mega-menu collapses
  // independently on mobile.
  document.querySelectorAll(".has-menu").forEach(function (li) {
    var link = li.querySelector(".has-menu__link") || li.querySelector(":scope > a");
    var menu = li.querySelector(":scope > .mega-menu");
    if (!link || !menu) return;

    var row = document.createElement("div");
    row.className = "has-menu__row";

    var toggle = makeToggleButton("Toggle " + (link.textContent || "").trim() + " menu");
    toggle.classList.add("has-menu__toggle");

    li.insertBefore(row, link);
    row.appendChild(link);
    row.appendChild(toggle);

    li.dataset.expanded = "false";

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var expanded = li.dataset.expanded === "true";
      li.dataset.expanded = String(!expanded);
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
  });

  // Restructure each .mega-col so each parent service header gets its own
  // collapsible group (head + items). Toggle is hidden on desktop and
  // shown on mobile.
  document.querySelectorAll(".mega-col").forEach(function (col) {
    var groups = [];
    var current = null;
    Array.prototype.forEach.call(col.children, function (child) {
      if (child.classList && child.classList.contains("mega-col__head")) {
        current = { head: child, items: [] };
        groups.push(current);
      } else if (current) {
        current.items.push(child);
      }
    });

    groups.forEach(function (g) {
      if (g.items.length === 0) return;

      var groupEl = document.createElement("div");
      groupEl.className = "mega-col__group";
      groupEl.dataset.expanded = "false";

      var headRow = document.createElement("div");
      headRow.className = "mega-col__group-head";

      var toggle = makeToggleButton("Toggle " + (g.head.textContent || "").trim() + " sub-services");
      toggle.classList.add("mega-col__toggle");

      var itemsWrap = document.createElement("div");
      itemsWrap.className = "mega-col__group-items";
      var itemsInner = document.createElement("div");
      itemsInner.className = "mega-col__group-items-inner";

      g.head.parentNode.insertBefore(groupEl, g.head);
      headRow.appendChild(g.head);
      headRow.appendChild(toggle);
      groupEl.appendChild(headRow);
      g.items.forEach(function (item) { itemsInner.appendChild(item); });
      itemsWrap.appendChild(itemsInner);
      groupEl.appendChild(itemsWrap);

      toggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var expanded = groupEl.dataset.expanded === "true";
        groupEl.dataset.expanded = String(!expanded);
        toggle.setAttribute("aria-expanded", String(!expanded));
      });
    });
  });

  // Auto-expand the active has-menu so the user keeps context when they
  // open the mobile nav from a sub-page.
  document.querySelectorAll(".has-menu").forEach(function (li) {
    var link = li.querySelector(".has-menu__link, .has-menu__row > a");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    var stripped = href.replace(/^\.\.\//g, "").replace(/^\//, "");
    if (!stripped) return;
    if (window.location.pathname.indexOf("/" + stripped) >= 0) {
      li.dataset.expanded = "true";
      var toggle = li.querySelector(".has-menu__toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "true");
      link.classList.add("is-active");
    }
  });

  if (currentPage !== "contact.html") {
    var mobileAction = document.createElement("div");
    mobileAction.className = "mobile-action-bar";
    mobileAction.setAttribute("aria-label", "Quick service actions");
    mobileAction.setAttribute("aria-hidden", "true");
    mobileAction.innerHTML = '<a class="mobile-action-bar__call" href="tel:14015935553">Call Now</a><a class="mobile-action-bar__book" href="contact.html">Book Online</a>';
    body.appendChild(mobileAction);
    var mobileActionLinks = mobileAction.querySelectorAll("a");

    var updateMobileAction = function () {
      var shouldShow = window.innerWidth <= 768 && window.scrollY > Math.max(420, window.innerHeight * 0.7);
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

})();

(function () {
  "use strict";

  var stickyCall = document.querySelector(".msl-mobile-call");

  function track(eventName, details) {
    var eventData = Object.assign({
      event: eventName,
      landing_page: "main-sewer-line-cleaning"
    }, details || {});

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(eventData);
    window.dispatchEvent(new CustomEvent("honestDrainLandingEvent", { detail: eventData }));
  }

  track("page_view");

  document.querySelectorAll("a[href^='tel:']").forEach(function (link) {
    link.addEventListener("click", function () {
      track("click_to_call", {
        placement: link.getAttribute("data-call-placement") || "unknown"
      });
    });
  });

  function updateStickyCall() {
    if (!stickyCall) return;
    var show = window.innerWidth <= 760 && window.scrollY > 120;
    stickyCall.classList.toggle("is-visible", show);
    stickyCall.setAttribute("aria-hidden", String(!show));
    stickyCall.setAttribute("tabindex", show ? "0" : "-1");
    document.body.classList.toggle("msl-sticky-visible", show);
  }

  window.addEventListener("scroll", updateStickyCall, { passive: true });
  window.addEventListener("resize", updateStickyCall);
  updateStickyCall();

  var audienceButtons = document.querySelectorAll("[data-audience]");
  var audienceNote = document.querySelector("#audience-note");

  function setAudience(audience) {
    audienceButtons.forEach(function (button) {
      var selected = button.getAttribute("data-audience") === audience;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    if (audienceNote) {
      audienceNote.innerHTML = audience === "home"
        ? "<strong>Home:</strong> Tell us which household fixtures are affected and whether water or sewage is rising."
        : "<strong>Business or managed property:</strong> Tell us which restrooms, floor drains, or building drains are affected and who can authorize the work.";
    }
  }

  audienceButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setAudience(button.getAttribute("data-audience"));
    });
  });
})();

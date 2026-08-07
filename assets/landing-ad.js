(function () {
  "use strict";

  var form = document.querySelector("#main-sewer-lead-form");
  var stickyCall = document.querySelector(".ad-mobile-call");
  var startedAt = Date.now();
  var formStarted = false;

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
    document.body.classList.toggle("ad-sticky-visible", show);
  }

  window.addEventListener("scroll", updateStickyCall, { passive: true });
  window.addEventListener("resize", updateStickyCall);
  updateStickyCall();

  var audienceButtons = document.querySelectorAll("[data-audience]");
  var audienceNote = document.querySelector("#audience-note");
  var businessField = document.querySelector(".ad-business-field");

  function setAudience(audience, updateForm) {
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

    if (updateForm && form) {
      var value = audience === "home" ? "Home" : "Business";
      var propertyInput = form.querySelector("input[name='property_type'][value='" + value + "']");
      if (propertyInput) {
        propertyInput.checked = true;
        propertyInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  audienceButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setAudience(button.getAttribute("data-audience"), true);
    });
  });

  function updateBusinessField() {
    if (!form || !businessField) return;
    var selected = form.querySelector("input[name='property_type']:checked");
    var isBusiness = selected && selected.value !== "Home";
    businessField.hidden = !isBusiness;
    if (selected) setAudience(isBusiness ? "business" : "home", false);
  }

  if (form) {
    form.querySelectorAll("input[name='property_type']").forEach(function (input) {
      input.addEventListener("change", updateBusinessField);
    });
  }

  var attributionKeys = [
    "gclid", "gbraid", "wbraid", "campaign", "ad_group", "keyword",
    "match_type", "device", "utm_source", "utm_medium", "utm_campaign",
    "utm_term", "utm_content"
  ];

  function readFirstTouch() {
    var params = new URLSearchParams(window.location.search);
    var captured = {
      landing_page_url: window.location.href,
      referrer: document.referrer,
      first_landing_timestamp: new Date().toISOString()
    };

    attributionKeys.forEach(function (key) {
      captured[key] = params.get(key) || "";
    });

    if (!captured.campaign) captured.campaign = captured.utm_campaign;
    if (!captured.device) captured.device = window.innerWidth <= 760 ? "mobile" : "desktop";

    try {
      var stored = window.localStorage.getItem("honest_drain_main_sewer_first_touch");
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed.expiresAt > Date.now() && parsed.data) return parsed.data;
        window.localStorage.removeItem("honest_drain_main_sewer_first_touch");
      }
      window.localStorage.setItem("honest_drain_main_sewer_first_touch", JSON.stringify({
        expiresAt: Date.now() + (90 * 24 * 60 * 60 * 1000),
        data: captured
      }));
    } catch (error) {
      // The form still submits current-page attribution when storage is unavailable.
    }
    return captured;
  }

  function populateAttribution() {
    if (!form) return;
    var firstTouch = readFirstTouch();
    Object.keys(firstTouch).forEach(function (key) {
      var input = form.elements.namedItem(key);
      if (input && typeof firstTouch[key] === "string") {
        input.value = firstTouch[key].slice(0, 500);
      }
    });
    form.elements.namedItem("form_started_at").value = String(startedAt);
    var token = form.elements.namedItem("submission_token");
    if (token && !token.value) {
      token.value = window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (character) {
          var random = Math.floor(Math.random() * 16);
          var value = character === "x" ? random : ((random & 3) | 8);
          return value.toString(16);
        });
    }
  }

  populateAttribution();

  if (!form) return;

  function markFormStarted(event) {
    if (formStarted || !event.target.matches("input, select, textarea")) return;
    formStarted = true;
    track("form_start");
  }

  form.addEventListener("input", markFormStarted);
  form.addEventListener("change", markFormStarted);

  var phoneInput = form.elements.namedItem("phone");
  if (phoneInput) {
    phoneInput.addEventListener("input", function () {
      var digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
      if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
      if (digits.length > 6) {
        phoneInput.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6, 10);
      } else if (digits.length > 3) {
        phoneInput.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3);
      } else if (digits.length) {
        phoneInput.value = "(" + digits;
      }
    });
  }

  var errorIds = {
    property_type: "property-type-error",
    symptoms: "symptoms-error",
    town: "town-error",
    sewer_connection: "sewer-connection-error",
    timing: "timing-error",
    authority: "authority-error",
    name: "name-error",
    phone: "phone-error",
    email: "email-error",
    company: "company-error"
  };

  function setFieldError(name, message) {
    var error = document.getElementById(errorIds[name]);
    var field = form.querySelector("[name='" + name + "']");
    var wrapper = field && field.closest(".ad-field, .ad-fieldset");
    if (error) error.textContent = message || "";
    if (wrapper) wrapper.classList.toggle("is-invalid", Boolean(message));
    if (field) field.setAttribute("aria-invalid", String(Boolean(message)));
  }

  function clearErrors() {
    Object.keys(errorIds).forEach(function (name) {
      setFieldError(name, "");
    });
  }

  function checkedValue(name) {
    var checked = form.querySelector("input[name='" + name + "']:checked");
    return checked ? checked.value : "";
  }

  function validateForm() {
    clearErrors();
    var errors = {};
    var phoneDigits = String(phoneInput ? phoneInput.value : "").replace(/\D/g, "");
    var emailInput = form.elements.namedItem("email");

    if (!checkedValue("property_type")) errors.property_type = "Choose a property type.";
    if (!form.elements.namedItem("symptoms").value.trim()) errors.symptoms = "Tell us what is backing up.";
    if (!form.elements.namedItem("town").value) errors.town = "Choose the property town.";
    if (!checkedValue("sewer_connection")) errors.sewer_connection = "Choose the sewer connection, or select Not sure.";
    if (!checkedValue("timing")) errors.timing = "Choose the timing that best fits.";
    if (!checkedValue("authority")) errors.authority = "Tell us who can authorize the work.";
    if (!form.elements.namedItem("name").value.trim()) errors.name = "Enter your full name.";
    if (phoneDigits.length !== 10 && !(phoneDigits.length === 11 && phoneDigits.charAt(0) === "1")) {
      errors.phone = "Enter a valid 10-digit US phone number.";
    }
    if (emailInput.value && !emailInput.validity.valid) errors.email = "Enter a valid email address or leave this blank.";

    Object.keys(errors).forEach(function (name) {
      setFieldError(name, errors[name]);
    });

    var firstErrorName = Object.keys(errors)[0];
    if (firstErrorName) {
      var firstField = form.querySelector("[name='" + firstErrorName + "']");
      if (firstField) firstField.focus();
    }
    return Object.keys(errors).length === 0;
  }

  function setStatus(type, html) {
    var status = document.getElementById("form-status");
    status.className = "ad-form-status ad-form-status--" + type;
    status.innerHTML = html;
    status.focus();
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!validateForm()) return;

    var submitButton = form.querySelector("button[type='submit']");
    var originalLabel = submitButton.textContent;
    form.classList.add("is-submitting");
    submitButton.disabled = true;
    submitButton.textContent = "Sending Request...";
    var controller = new AbortController();
    var timeout = window.setTimeout(function () { controller.abort(); }, 12000);

    try {
      var response = await fetch(form.action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
        credentials: "same-origin",
        signal: controller.signal
      });
      var result = await response.json().catch(function () { return {}; });
      if (!response.ok || !result.ok) {
        if (result.errors) {
          Object.keys(result.errors).forEach(function (name) {
            if (errorIds[name]) setFieldError(name, result.errors[name]);
          });
          var firstServerError = Object.keys(result.errors)[0];
          var firstServerField = firstServerError && form.querySelector("[name='" + firstServerError + "']");
          if (firstServerField) firstServerField.focus();
        }
        throw new Error(result.message || "The request could not be accepted.");
      }

      track("form_submit_success", { lead_id: result.leadId });
      setStatus("success", "We received your request. This does not confirm dispatch. Honest Drain will call or text to confirm fit and current availability.");
      submitButton.textContent = "Request Received";
    } catch (error) {
      track("form_submit_error", { reason: "request_failed" });
      setStatus("error", "We could not confirm receipt of your request. Your entries are still here. Please try again or call <a href=\"tel:14015935553\" data-call-placement=\"form-error\">(401) 593-5553</a>.");
      var fallbackLink = document.querySelector("#form-status a[href^='tel:']");
      if (fallbackLink) {
        fallbackLink.addEventListener("click", function () {
          track("click_to_call", { placement: "form-error" });
        });
      }
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    } finally {
      window.clearTimeout(timeout);
      form.classList.remove("is-submitting");
    }
  });
})();

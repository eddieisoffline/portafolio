(() => {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const status = form.querySelector("[data-contact-status]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const submitButton = form.querySelector("button[type='submit']");
  const initialLabel = submitLabel?.textContent ?? "";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) {
        status.textContent = status.dataset.validationError ?? "";
        status.className = "min-h-6 text-sm text-danger";
      }
      return;
    }

    const formData = new FormData(form);

    submitButton?.setAttribute("disabled", "true");
    if (submitLabel && status) {
      submitLabel.textContent = status.dataset.submitting ?? initialLabel;
      status.textContent = "";
      status.className = "min-h-6 text-sm text-muted";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: formData
      });
      const body = await response.json().catch(() => ({}));

      if (!response.ok || !body.ok) {
        throw new Error("Contact request failed.");
      }

      form.reset();
      if (status) {
        status.textContent = status.dataset.success ?? "";
        status.className = "min-h-6 text-sm text-primary-strong";
      }
    } catch {
      if (status) {
        status.textContent = status.dataset.error ?? "";
        status.className = "min-h-6 text-sm text-danger";
      }
    } finally {
      submitButton?.removeAttribute("disabled");
      if (submitLabel) {
        submitLabel.textContent = initialLabel;
      }
    }
  });
})();

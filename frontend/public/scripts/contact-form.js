(() => {
  const form = document.querySelector("[data-contact-form]");

  if (!form) {
    return;
  }

  const status = form.querySelector("[data-contact-status]");
  const submitLabel = form.querySelector("[data-submit-label]");
  const submitButton = form.querySelector("button[type='submit']");
  const initialLabel = submitLabel?.textContent ?? "";
  const loadedAt = Date.now();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      if (status) {
        status.textContent = status.dataset.validationError ?? "";
        status.dataset.state = "error";
      }
      return;
    }

    const formData = new FormData(form);
    formData.set("elapsed", String(Date.now() - loadedAt));

    submitButton?.setAttribute("disabled", "true");
    if (submitLabel && status) {
      submitLabel.textContent = status.dataset.submitting ?? initialLabel;
      status.textContent = "";
      status.dataset.state = "pending";
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
        status.dataset.state = "success";
      }
    } catch {
      if (status) {
        status.textContent = status.dataset.error ?? "";
        status.dataset.state = "error";
      }
    } finally {
      submitButton?.removeAttribute("disabled");
      if (submitLabel) {
        submitLabel.textContent = initialLabel;
      }
    }
  });
})();

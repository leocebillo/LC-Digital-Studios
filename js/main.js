// LC Digital Studios

const CONTACT_EMAIL = "leocebillo@leocedillo.dev";
const CONTACT_PHONE = "(956) 974-4500";


// Pricing page: switch between new and established business prices

const pricingIntro = {
  new: "Just getting started? Launch pricing to help you get online.",
  established: "Already up and running? Full builds for growing businesses."
};

const toggleButtons = document.querySelectorAll(".pricing-toggle button");

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tier = button.dataset.tier;

    toggleButtons.forEach((b) => b.setAttribute("aria-selected", b === button));

    document.querySelectorAll("[data-new]").forEach((el) => {
      el.textContent = el.dataset[tier];
    });

    document.getElementById("negotiable").hidden = tier !== "established";
    document.getElementById("pricing-intro").textContent = pricingIntro[tier];
  });
});


// Copy buttons (email, phone)

function copyText(text, button, fallbackEl) {
  const done = () => (button.textContent = "Copied");
  const selectInstead = () => {
    const range = document.createRange();
    range.selectNodeContents(fallbackEl);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    button.textContent = "Selected";
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(done, selectInstead);
  } else {
    selectInstead();
  }

  setTimeout(() => (button.textContent = button.dataset.label), 1800);
}

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.dataset.label = button.textContent;
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.copy);
    copyText(target.textContent, button, target);
  });
});


// Quote form
// Sends through FormSubmit (formsubmit.co). The first submission sends an
// activation email to CONTACT_EMAIL, click the link in it once to turn it on.

const form = document.getElementById("quote-form");

if (form) {
  const status = document.getElementById("form-status");
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = form.elements.name;
    const contact = form.elements.contact;
    name.classList.remove("invalid");
    contact.classList.remove("invalid");

    if (!name.value.trim()) {
      name.classList.add("invalid");
      name.focus();
      return;
    }
    if (!contact.value.trim()) {
      contact.classList.add("invalid");
      contact.focus();
      return;
    }

    const services = [...form.querySelectorAll('input[name="services"]:checked')]
      .map((box) => box.value)
      .join(", ");

    const request = {
      name: name.value.trim(),
      business: form.elements.business.value.trim() || "-",
      contact: contact.value.trim(),
      services: services || "Not specified",
      message: form.elements.message.value.trim() || "-"
    };

    const subject = "New quote request: " + (request.business !== "-" ? request.business : request.name);

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";
    status.hidden = true;

    try {
      const response = await fetch("https://formsubmit.co/ajax/" + CONTACT_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...request, _subject: subject, _template: "table", _captcha: "false" })
      });
      const result = await response.json();
      if (!response.ok || String(result.success) !== "true") throw new Error("Not sent");

      status.textContent = `Thanks, ${request.name.split(" ")[0]}! Your request was sent. We'll get back to you within a day.`;
      status.hidden = false;
      form.reset();
    } catch (error) {
      showFallback(request, subject);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Send request";
    }
  });

  // If the form service can't be reached, let the visitor send it themselves
  function showFallback(request, subject) {
    const details =
      `Name: ${request.name}\n` +
      `Business: ${request.business}\n` +
      `Contact: ${request.contact}\n` +
      `Services: ${request.services}\n\n` +
      request.message;

    status.innerHTML = "";

    const message = document.createElement("p");
    message.textContent = `We couldn't send your request. Please email it to ${CONTACT_EMAIL} or text ${CONTACT_PHONE}. Your details are below.`;

    const detailsBox = document.createElement("pre");
    detailsBox.textContent = details;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn btn--small";
    copyButton.textContent = "Copy details";
    copyButton.dataset.label = "Copy details";
    copyButton.addEventListener("click", () => copyText(details, copyButton, detailsBox));

    const emailLink = document.createElement("a");
    emailLink.className = "btn btn--small";
    emailLink.textContent = "Open email";
    emailLink.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(details)}`;

    const actions = document.createElement("div");
    actions.className = "form-status-actions";
    actions.append(copyButton, emailLink);

    status.append(message, detailsBox, actions);
    status.hidden = false;
  }
}

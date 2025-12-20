frappe.ready(() => {
  function ensureParticlesHost() {
    if (document.getElementById("particles-js")) {
      return;
    }
    if (window.location.pathname !== "/login") {
      return;
    }
    const host = document.createElement("div");
    host.id = "particles-js";
    document.body.prepend(host);
  }
	function isSignupLink(target) {
		if (!target) {
			return false;
		}
		const href = target.getAttribute("href") || "";
		return href === "#signup" || href.endsWith("/login#signup") || href.endsWith("#signup");
	}

	function onClick(event) {
		const link = event.target.closest("a");
		if (!isSignupLink(link)) {
			return;
		}
		event.preventDefault();
		window.location.href = "/registration";
	}

  ensureParticlesHost();
  document.addEventListener("click", onClick);
});

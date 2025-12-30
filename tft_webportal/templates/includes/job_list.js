window.jobs = {};
window.jobs.limit = 20;

frappe.ready(() => {
	const statusSelect = document.getElementById("filter_status");
	const pickupInput = document.getElementById("filter_pickup");
	const deliveryInput = document.getElementById("filter_delivery");
	const rows = Array.from(document.querySelectorAll(".job-table .job-row")).filter(
		(row) => !row.classList.contains("job-head")
	);

	function matchesText(value, query) {
		if (!query) {
			return true;
		}
		return value.toLowerCase().includes(query.toLowerCase());
	}

	function applyFilters() {
		const statusValue = statusSelect ? statusSelect.value : "";
		const pickupValue = pickupInput ? pickupInput.value.trim() : "";
		const deliveryValue = deliveryInput ? deliveryInput.value.trim() : "";

		rows.forEach((row) => {
			const status = row.dataset.status || "";
			const pickup = row.dataset.pickup || "";
			const delivery = row.dataset.delivery || "";

			const statusOk = !statusValue || status === statusValue;
			const pickupOk = matchesText(pickup, pickupValue);
			const deliveryOk = matchesText(delivery, deliveryValue);

			row.style.display = statusOk && pickupOk && deliveryOk ? "" : "none";
		});
	}

	[statusSelect, pickupInput, deliveryInput].forEach((el) => {
		if (!el) {
			return;
		}
		el.addEventListener("input", applyFilters);
		el.addEventListener("change", applyFilters);
	});
});

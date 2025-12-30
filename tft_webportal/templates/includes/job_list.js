window.jobs = {};
window.jobs.limit = 20;

/* API call for job data */
jobs.call = function (args, callback, url="/") {
	return frappe.call({type: "POST", url: url, args: args, callback: callback, freeze: true,});
}

frappe.ready(() => {
	const statusSelect = document.getElementById("filter_status");
	const pickupInput = document.getElementById("filter_pickup");
	const deliveryInput = document.getElementById("filter_delivery");
	const rowsContainer = document.querySelector(".job-body");

	function matchesText(value, query) {
		if (!query) {
			return true;
		}
		return String(value || "").toLowerCase().includes(query.toLowerCase());
	}

	function applyFilters() {
		const statusValue = statusSelect ? statusSelect.value : "";
		const pickupValue = pickupInput ? pickupInput.value.trim() : "";
		const deliveryValue = deliveryInput ? deliveryInput.value.trim() : "";

		const rows = Array.from(document.querySelectorAll(".job-body .job-row"));
		rows.forEach((row) => {
			if (!row.dataset || !("status" in row.dataset)) {
				return;
			}
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

	/* ---------------- load more jobs ---------------- */
	$(".load-more").click(function () {
		let current_limit = window.jobs.limit + 20;
		window.jobs.limit = current_limit;
		fetchJobs(current_limit);
	});

	window.jobs.applyFilters = applyFilters;

	if (rowsContainer) {
		const observer = new MutationObserver(applyFilters);
		observer.observe(rowsContainer, { childList: true });
	}
});

function fetchJobs(limit) {
	// Fetch jobs from your backend API (replace with your API endpoint)
    let args = {};
	args.limit = limit;
	args.cmd = "tft_webportal.www.job_list.load_my_jobs"
	jobs.call(args, function (r) {
		let jobs = r.message || [];
		let table = $(".job-body");
		table.empty();
		if (jobs.length === 0) {
			table.append('<div class="job-row"><div></div><div></div><div>{{ _("No transportation requests found.") }}</div><div></div><div></div><div></div></div>')
            return;
        }
		jobs.forEach((job, c) => {
			const status = String(job.status || "");
			const statusKey = status.toLowerCase();
			const fromAddress = job.from_address || "";
			const toAddress = job.to_address || "";
			let row = $(`<div class="job-row" data-status="${statusKey}" data-pickup="${fromAddress}" data-delivery="${toAddress}">`);
			row.append(`<div>${c+1}</div>`);
			row.append(`<div>${job.date || ""}</div>`);
			row.append(`<div>${fromAddress}</div>`);
			row.append(`<div>${toAddress}</div>`);
			row.append(`<div>${job.vehicles || 0}</div>`);
			row.append(`<div><span class="status-pill status-${statusKey}">${status}</span></div>`);
			row.append(`<div><a class="row-link btn" href="/transportation_request?request=${job.name}&view=1">${ __("View") }</a></div>`);
			table.append(row);
        });

		if (window.jobs.applyFilters) {
			window.jobs.applyFilters();
		}
	});
}

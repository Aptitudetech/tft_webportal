frappe.ready(() => {
	const rows = document.getElementById("vehicle-rows");
	const addBtn = document.querySelector("[data-add-vehicle-row]");
	const addressRows = document.getElementById("address-rows");
	const addAddressBtn = document.querySelector("[data-add-address-row]");
	const multiToggle = document.getElementById("multi_address");
	const singleAddress = document.querySelector("[data-single-address]");
	const multiAddress = document.querySelector("[data-multi-address]");
	if (!rows || !addBtn) {
		return;
	}

	let rowIndex = rows.children.length;
	let addressIndex = addressRows ? addressRows.children.length : 0;

	function buildCell(name, type = "text", placeholder = "") {
		const td = document.createElement("td");
		const input = document.createElement("input");
		input.name = name;
		input.type = type;
		if (placeholder) {
			input.placeholder = placeholder;
		}
		if (type === "number") {
			input.min = "1";
			input.placeholder = placeholder || "1";
		}
		td.appendChild(input);
		return td;
	}

	function buildRemoveCell() {
		const td = document.createElement("td");
		td.className = "row-actions";
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "row-remove";
		btn.setAttribute("aria-label", "Remove row");
		btn.textContent = "✕";
		td.appendChild(btn);
		return td;
	}

	addBtn.addEventListener("click", () => {
		rowIndex += 1;
		const tr = document.createElement("tr");
		tr.appendChild(buildCell(`vehicle_qty_${rowIndex}`, "number", "1"));
		tr.appendChild(buildCell(`vehicle_number_${rowIndex}`));
		tr.appendChild(buildCell(`vin_${rowIndex}`));
		tr.appendChild(buildCell(`make_model_${rowIndex}`));
		tr.appendChild(buildCell(`description_${rowIndex}`));
		tr.appendChild(buildCell(`plate_${rowIndex}`));
		tr.appendChild(buildCell(`hitch_${rowIndex}`));
		tr.appendChild(buildRemoveCell());
		rows.appendChild(tr);
	});

	rows.addEventListener("click", (event) => {
		const btn = event.target.closest(".row-remove");
		if (!btn) {
			return;
		}
		const row = btn.closest("tr");
		if (!row) {
			return;
		}
		if (rows.children.length <= 1) {
			row.querySelectorAll("input").forEach((input) => {
				input.value = "";
			});
			return;
		}
		row.remove();
	});

	function buildAddressRow(index) {
		const tr = document.createElement("tr");
		const typeTd = document.createElement("td");
		const select = document.createElement("select");
		select.name = `addr_type_${index}`;
		select.innerHTML = `
			<option value="from">From</option>
			<option value="to">To</option>
		`;
		typeTd.appendChild(select);
		tr.appendChild(typeTd);
		tr.appendChild(buildCell(`addr_company_${index}`, "text", "Company"));
		tr.appendChild(buildCell(`addr_address_${index}`, "text", "Address"));
		tr.appendChild(buildCell(`addr_contact_${index}`, "text", "Contact"));
		tr.appendChild(buildCell(`addr_gate_${index}`, "text", "Code"));
		tr.appendChild(buildRemoveCell());
		return tr;
	}

	if (addAddressBtn && addressRows) {
		addAddressBtn.addEventListener("click", () => {
			addressIndex += 1;
			addressRows.appendChild(buildAddressRow(addressIndex));
		});
	}

	if (addressRows) {
		addressRows.addEventListener("click", (event) => {
			const btn = event.target.closest("[data-remove-address-row], .row-remove");
			if (!btn) {
				return;
			}
			const row = btn.closest("tr");
			if (!row) {
				return;
			}
			if (addressRows.children.length <= 1) {
				row.querySelectorAll("input, select").forEach((input) => {
					input.value = "";
				});
				return;
			}
			row.remove();
		});
	}

	if (multiToggle) {
		multiToggle.addEventListener("change", () => {
			const enabled = multiToggle.checked;
			if (singleAddress) {
				console.log(singleAddress);
				singleAddress.classList.toggle("is-hidden", enabled);
			}
			if (multiAddress) {
				multiAddress.classList.toggle("is-hidden", !enabled);
			}
		});
	}
});

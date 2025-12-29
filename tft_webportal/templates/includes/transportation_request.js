const placeState = {
	"from": {"address": {}, "phone": "", "company": "", "from_time": "", "to_time": ""},
	"to": {"address": {}, "phone": "", "company": "", "from_time": "", "to_time": ""}
}


frappe.ready(() => {
	const today = frappe.datetime.get_today();
	$("#request_date").val(today);
	$("#pickup_date").val(today);
	$("#delivery_date").val(today);

	/* view request */
	view_request();
	const form = document.querySelector(".tft-transport form");
	if (!form) {return;}

	/* Vehicle rows dynamic add/remove */
	const rows = document.getElementById("vehicle-rows");
	const addBtn = document.querySelector("[data-add-vehicle-row]");
	if (!rows || !addBtn) {
		return;
	}

	let rowIndex = rows.children.length;

	function buildCell(name, type = "text", placeholder = "", datalist = null) {
		const td = document.createElement("td");
		const input = document.createElement("input");
		input.name = name;
		input.type = type;
		if (placeholder) {
			input.placeholder = placeholder;
		}
		if (datalist) {
			input.setAttribute("list", datalist);
			if(datalist === "vin_list"){
				input.setAttribute("onchange", "update_vehicle_info(this)");
			}
		}
		if (type === "number") {
			input.min = "1";
			input.placeholder = placeholder || "1";
		}
		td.appendChild(input);
		return td;
	}

	function buildSelectCell(name, options, defaultValue = null) {
		const td = document.createElement("td");
		const select = document.createElement("select");

		select.name = name;

		options.forEach(opt => {
			const option = document.createElement("option");
			option.value = opt.value;
			option.textContent = opt.label;

			if (defaultValue !== null && opt.value === defaultValue) {
				option.selected = true;
			}

			select.appendChild(option);
		});

		td.appendChild(select);
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
		tr.appendChild(buildCell(`vin_${rowIndex}`, "text", "1C3CCBAB5EN125414", "vin_list"));
		tr.appendChild(buildCell(`vehicle_number_${rowIndex}`, "text", "4521909"));
		tr.appendChild(buildCell(`make_model_${rowIndex}`, "text", "2014 Chrysler 200"));
		tr.appendChild(buildCell(`description_${rowIndex}`, "text", "Car", "description_list"));
		tr.appendChild(buildCell(`plate_${rowIndex}`, "text", "CTET844"));
		tr.appendChild(buildSelectCell(`hitch_${rowIndex}`, [{ label: "No", value: "No" }, { label: "Yes", value: "Yes" }], "No"));
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

	const addressInputs = document.querySelectorAll(".address-input[list]");
	addressInputs.forEach((input) => {
		const listId = input.getAttribute("list");
		if (!listId) {
			return;
		}
		input.dataset.listId = listId;
		input.addEventListener("input", () => {
			if (input.value.trim()) {
				input.removeAttribute("list");
			} else {
				input.setAttribute("list", listId);
			}
		});
		input.addEventListener("blur", () => {
			input.setAttribute("list", listId);
		});
	});
	/* End vehicle rows dynamic add/remove */
});

/* view request */
function view_request() {
	// Load existing request data if in view mode
	const urlParams = new URLSearchParams(window.location.search);
	const requestName = urlParams.get("request");
	const viewMode = urlParams.get("view") === "1";
	if (!requestName) return;
	
	// Load request data
	frappe.call({
		method: "tft_webportal.www.transportation_request.get_request",
		args: { request: requestName },
		callback: function(r) {
			const request = r.message;
			if (!request) return;

			// Fill fields
			$("#supplier_email").val(request.supplier);
			$("#contact_email").val(request.supplier);
			$("#request_date").val(request.date);
			$("#po_number").val(request.po_number);
			$("#business_unit").val(request.business_unit_name);
			$("#contact_name").val(request.contact_name);
			$("#contact_phone").val(request.contact_phone);
			$("#pickup_date").val(request.available_pickup_date);
			$("#delivery_date").val(request.delivery_required_by);
			$("#notes").val(request.notes);

			// Fill addresses
			$("#from_company").val(request.addresses[0].from_company);
			$("#from_address").val(request.addresses[0].from_address);
			$("#from_contact").val(request.addresses[0].from_contact);
			$("#from_start_hour").val(request.addresses[0].from_start_time);
			$("#from_end_hour").val(request.addresses[0].from_end_time);
			$("#from_gate").val(request.addresses[0].from_code);

			$("#to_company").val(request.addresses[0].to_company);
			$("#to_address").val(request.addresses[0].to_address);
			$("#to_contact").val(request.addresses[0].to_contact);
			$("#to_start_hour").val(request.addresses[0].to_start_time);
			$("#to_end_hour").val(request.addresses[0].to_end_time);
			$("#to_gate").val(request.addresses[0].to_code);

			// Fill vehicles dynamically
			const $vehicleRows = $("#vehicle-rows");
			$vehicleRows.empty();
			request.vehicle.forEach((v, index) => {
				const rowIndex = index + 1;
				const hitchValue = v.cables ? "Yes" : "No";
				const row = `<tr>
					<td><input type="text" name="vin_${rowIndex}" value="${v.vin}"></td>
					<td><input type="text" name="vehicle_number_${rowIndex}" value="${v.vehicle_number}"></td>
					<td><input type="text" name="make_model_${rowIndex}" value="${v.make}"></td>
					<td><input type="text" name="description_${rowIndex}" value="${v.type}"></td>
					<td><input type="text" name="plate_${rowIndex}" value="${v.plate}"></td>
					<td>
						<select name="hitch_${rowIndex}">
							<option value="No" ${hitchValue === "No" ? "selected" : ""}>No</option>
							<option value="Yes" ${hitchValue === "Yes" ? "selected" : ""}>Yes</option>
						</select>
					</td>
					<td class="row-actions"><button type="button" class="row-remove" aria-label="Remove row">✕</button></td>
				</tr>`;
				$vehicleRows.append(row);
			});

			// Hide submit button in view mode
			if (viewMode) {
				const addBtn = document.querySelector("[data-add-vehicle-row]");
				$("#submit_request").hide();
				$(addBtn).hide();
				$(".row-remove").hide();
			}
		}
	});
}

/* End view request */

/* address autocomplete */
const address_list = {{ addresses | safe }};
function update_contact_info(input_element) {
	const value = input_element.value;
	for (let i in address_list) {
		if (address_list[i].name === value) {
			document.getElementById(input_element.name === "from_address" ? "from_contact" : "to_contact").value = address_list[i].phone || '';
			document.getElementById(input_element.name === "from_address" ? "from_company" : "to_company").value = address_list[i].company || '';
			document.getElementById(input_element.name === "from_address" ? "from_start_hour" : "to_start_hour").value = address_list[i].from_time || '08:00';
			document.getElementById(input_element.name === "from_address" ? "from_end_hour" : "to_end_hour").value = address_list[i].to_time || '17:00';
		}
	}
}

function initAutocomplete() {
	/* from address autocomplete */
	const from_address_input = document.getElementById("from_address");
	const from_address_autocomplete = new google.maps.places.Autocomplete(from_address_input, {componentRestrictions: {country: ["us", "ca"]}, types: ['address']});

	from_address_autocomplete.addListener("place_changed", () => {
		const place = from_address_autocomplete.getPlace();
		document.getElementById("from_address").value = place.formatted_address;
		placeState.from.address = mapGooglePlace(place);
	});

	/* to address autocomplete */
	const to_address_input = document.getElementById("to_address");
	const to_address_autocomplete = new google.maps.places.Autocomplete(to_address_input, {componentRestrictions: {country: ["us", "ca"]}, types: ['address']});
	to_address_autocomplete.addListener("place_changed", () => {
		const place = to_address_autocomplete.getPlace();
		document.getElementById("to_address").value = place.formatted_address;
		placeState.to.address = mapGooglePlace(place);
	});
}

function mapGooglePlace(place) {
	const get = (type, short = false) =>
		place.address_components.find(c => c.types.includes(type))?.[short ? "short_name" : "long_name"] || "";

	return {
		address_line1: [get("street_number"), get("route")].filter(Boolean).join(" "),
		city: get("locality") || get("sublocality"),
		state: get("administrative_area_level_1", true),
		pincode: get("postal_code"),
		country: get("country")
	};
}

/* end address autocomplete */

/* vehicle data resource */
const vehicle_list = {{ vehicles | safe }};
function update_vehicle_info(input_element) {
	const value = input_element.value;
	for (let i in vehicle_list) {
		if (vehicle_list[i].vin === value) {
			const rowIndex = input_element.name.split('_')[1];
			document.getElementsByName(`vehicle_number_${rowIndex}`)[0].value = vehicle_list[i].vehicle_number || '';
			document.getElementsByName(`make_model_${rowIndex}`)[0].value = vehicle_list[i].make_model || '';
			document.getElementsByName(`description_${rowIndex}`)[0].value = vehicle_list[i].description || '';
			document.getElementsByName(`plate_${rowIndex}`)[0].value = vehicle_list[i].plate || '';
			document.getElementsByName(`hitch_${rowIndex}`)[0].value = vehicle_list[i].hitch ? "Yes" : "No";
		}
	}
}

/* end vehicle data resource */

/* submit request */
$("#request-form").on("submit", function (e) {
	e.preventDefault();

	/* validations */
	if(!$("#from_address").val() || !$("#to_address").val()){
		frappe.msgprint(__("Please select both From and To addresses."));
		return;
	}

	if($("#from_address").val() === $("#to_address").val()){
		frappe.msgprint(__("From and To addresses cannot be the same."));
		return;
	}

	const vins = new Set();
	const plates = new Set();

	for (const row of document.querySelectorAll("#vehicle-rows tr")) {
		const vin = row.querySelector("input[name^='vin_']").value.trim().toUpperCase();
		const plate = row.querySelector("input[name^='plate_']").value.trim().toUpperCase();
		
		if (vin) {
			if (vins.has(vin)) {
				frappe.msgprint(__("Duplicate VIN found: {0}".format(vin)));
				return;
			}
			vins.add(vin);
		}
		
		if (plate) {
			if (plates.has(plate)) {
				frappe.msgprint(__("Duplicate Plate found: {0}".format(plate)));
				return;
			}
			plates.add(plate);
		}
	}

	/* place data */
	placeState.from.phone = $("[name='from_contact']").val();
	placeState.from.company = $("[name='from_company']").val();
	placeState.from.from_time = $("[name='from_start_hour']").val();
	placeState.from.to_time = $("[name='from_end_hour']").val();

	placeState.to.phone = $("[name='to_contact']").val();
	placeState.to.company = $("[name='to_company']").val();
	placeState.to.from_time = $("[name='to_start_hour']").val();
	placeState.to.to_time = $("[name='to_end_hour']").val();

	/* vehicle data */
	const vehicles = [];
	$("#vehicle-rows tr").each(function (index) {
		const row_index = index + 1;
		const hitch_val = $(this).find(`select[name="hitch_${row_index}"]`).val();
		const hitch_boolean = hitch_val === "Yes" ? 1 : 0;

		vehicles.push({
			vehicle_number: $(this).find(`input[name="vehicle_number_${row_index}"]`).val(),
			vin: $(this).find(`input[name="vin_${row_index}"]`).val().toUpperCase(),
			make_model: $(this).find(`input[name="make_model_${row_index}"]`).val(),
			description: $(this).find(`input[name="description_${row_index}"]`).val(),
			plate: $(this).find(`input[name="plate_${row_index}"]`).val().toUpperCase(),
			hitch: hitch_boolean
		});
	});

	const data = {
		request_date: $("[name='request_date']").val(), po_number: $("[name='po_number']").val(),
		business_unit: $("[name='business_unit']").val(), contact_name: $("[name='contact_name']").val(),
		contact_phone: $("[name='contact_phone']").val(), pickup_date: $("[name='pickup_date']").val(),
		delivery_date: $("[name='delivery_date']").val(), notes: $("[name='notes']").val(),
		from_company: $("[name='from_company']").val(), from_address: $("[name='from_address']").val(),
		from_contact: $("[name='from_contact']").val(), from_start_hour: $("[name='from_start_hour']").val(),
		from_end_hour: $("[name='from_end_hour']").val(), from_gate: $("[name='from_gate']").val(),
		to_company: $("[name='to_company']").val(), to_address: $("[name='to_address']").val(),
		to_contact: $("[name='to_contact']").val(), to_start_hour: $("[name='to_start_hour']").val(),
		to_end_hour: $("[name='to_end_hour']").val(), to_gate: $("[name='to_gate']").val(),
		vehicles: vehicles,	addresses: placeState
	};

	warning = ""
	if (!data.po_number && !data.notes){
		warning = __("Fields <b>PO Number</b> and <b>Notes</b> for instruction are left empty");
	} else if (!data.po_number){
		warning = __("Field <b>PO Number</b> is left Empty");
	}else if (!data.notes){
		warning = __("Field <b>Notes</b> for instruction is left Empty");
	}

	if(warning != ""){
		frappe.warn(__('Are you sure you want to proceed?'), warning,
			() => {
				create_request(data)
			},
			'Continue',
			true
		)
	} else {
		create_request(data);
	}
});

function create_request(data){
	frappe.call({
		method: "tft_webportal.www.transportation_request.create_request",
		args: {data: data},
		freeze: true,
		freeze_message: __("Creating Transportation Request..."),
		callback: function (r) {
			if (r.message) {
				frappe.show_alert(__(r.message.message), 300);
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			}
		}
	});
}

/* end submit request */
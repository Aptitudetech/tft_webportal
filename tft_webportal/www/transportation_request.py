import frappe
from frappe import _
from frappe.utils import getdate

from datetime import datetime

def get_context(context):
	context.addresses = []
	context.vehicles = []
	if frappe.session.user == "Guest":
		frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

	user = frappe.get_doc("User", frappe.session.user, ignore_permissions=1)
	context.user_email = user.email
	context.user_phone = user.phone
	context.business_unit = user.company
	context.contact_name = user.full_name
	context.contact_phone = user.phone
	context.contact_email = user.email

	# Load addresses
	if user.approved_company:
		users = frappe.db.get_all("User", filters={"approved_company": user.approved_company}, pluck="name")
	else:
		users = [frappe.session.user]

	addresses = frappe.db.sql("""
		SELECT
			a.name, a.address_title, a.address_line1, a.address_line2, a.city, a.state, a.pincode, a.country, a.phone,
			a.custom_company, a.custom_from_time, a.custom_to_time
		FROM `tabAddress` a
		INNER JOIN `tabDynamic Link` dl ON dl.parent = a.name
		WHERE dl.link_name = %s
	""",(frappe.session.user), as_dict=1)

	for addr in addresses:
		if addr.custom_company == None: addr.custom_company = ""
		addr.from_time = datetime.strptime(str(addr.custom_from_time), "%H:%M:%S").strftime("%H:%M") if addr.custom_from_time else ""
		addr.to_time = datetime.strptime(str(addr.custom_to_time), "%H:%M:%S").strftime("%H:%M") if addr.custom_to_time else ""
		addr.display = ", ".join(filter(None, [addr.custom_company, addr.address_line1, addr.city, addr.state, addr.pincode, addr.country]))
		context.addresses.append({"name": addr.address_line1, "display": addr.display, "phone": addr.phone, "company": addr.custom_company, "from_time": addr.from_time, "to_time": addr.to_time})

	# Load vehicles
	vehicles = frappe.db.get_all("Vehicles", filters={"user": ["in", users]}, fields=["vehicle_number", "make", "type", "plate", "vin", "cables"])
	for vehicle in vehicles:
		vehicle.display = ", ".join(filter(None, [vehicle.vehicle_number, vehicle.make, vehicle.type, vehicle.plate]))
		context.vehicles.append({"vin": vehicle.vin, "display": vehicle.display, "vehicle_number": vehicle.vehicle_number, "make_model": vehicle.make, "description": vehicle.type, "plate": vehicle.plate, "hitch": vehicle.cables})
	context.vehicle_description = frappe.get_all("Vehicle Type", pluck="name") or []

# ------------------------------------------------------------- #

# -------------- create transaction -------------- #
@frappe.whitelist()
def create_request(data):
	try:
		# Enforce login
		if frappe.session.user == "Guest": frappe.throw(_("Please login to continue"), frappe.PermissionError)

		supplier = frappe.session.user

		# Validate required fields
		payload = frappe.parse_json(data) if data else {}
		required_fields = ["pickup_date", "delivery_date", "from_address", "to_address"]
		missing = [field for field in required_fields if not payload.get(field)]

		# Address Resolution
		if missing: frappe.throw(_("Missing required fields: {0}.").format(", ".join(missing)))

		# Date validation
		pickup_dt = getdate(payload.get("pickup_date"))
		delivery_dt = getdate(payload.get("delivery_date"))
		
		# Date validation
		if delivery_dt < pickup_dt: frappe.throw(_("Delivery Required By Date cannot be earlier than Pickup Date."))

		# Vehicle Resolution
		if payload.get("from_address") == payload.get("to_address"):
			frappe.throw(_("From and To addresses cannot be the same."))

		# Address resolution
		addresses = payload.get("addresses")
		resolve_address(addresses.get("from"), supplier, payload.get("business_unit"))
		resolve_address(addresses.get("to"), supplier, payload.get("business_unit"))

		# Vehicle Resolution
		resolve_vehicle(payload, supplier)
	
		# Address append
		addresses = []
		ad = {
			"doctype": "Transportation Request Address", "from_company": payload.get("from_company"),
			"from_address": payload.get("from_address"), "from_contact": payload.get("from_contact"),
			"from_start_time": payload.get("from_start_hour"), "from_end_time": payload.get("from_end_hour"),
			"from_code": payload.get("from_gate"), "to_company": payload.get("to_company"),
			"to_address": payload.get("to_address"), "to_contact": payload.get("to_contact"),
			"to_start_time": payload.get("to_start_hour"), "to_end_time": payload.get("to_end_hour"), "to_code": payload.get("to_gate")
		}
		
		addresses.append(ad)

		vehicles = []
		for vehicle in payload.get("vehicles"):
			v = {
				"doctype": "Transportation Request Vehicle",
				"vin": vehicle.get("vin"), "vehicle_number": vehicle.get("vehicle_number"),
				"make": vehicle.get("make_model"), "type": vehicle.get("description"),
				"plate": vehicle.get("plate"), "cables": vehicle.get("hitch")
			}

			vehicles.append(v)

		# Create Transportation Request document
		job = frappe.get_doc({
			"doctype": "Transportation Request", "supplier": supplier,
			"p_o_number": payload.get("po_number"),	"date": payload.get("request_date"),
			"business_unit_name": payload.get("business_unit"),	"contact_name": payload.get("contact_name"),
			"contact_phone": payload.get("contact_phone"), "available_pickup_date": pickup_dt,
			"delivery_required_by": delivery_dt, "notes": payload.get("notes"),
			"addresses": addresses, "vehicle": vehicles
		})

		job.insert(ignore_permissions=True)
		return frappe._dict({"job": job.name, "message": _("Job created successfully")})
	except Exception as e:
		frappe.error_log("Error", f'{e}')

#---------------- address resolution ----------------- #
def resolve_address(payload, username, business_unit=None):
	addr = payload.get("address")
	if not addr: return None
	
	# Check if address already exists
	existing = frappe.db.get_value("Address", {"address_line1": addr.get("address_line1"), "city": addr.get("city"), "pincode": addr.get("pincode")}, "name")
	if existing: return existing
	
	link = frappe._dict({"link_doctype": "User", "link_name": username})
	address = frappe.get_doc({
		"doctype": "Address", "address_type": "Shipping",
		"address_title": addr.get("address_line1"), "custom_company": payload.get("company") or business_unit,
		"phone": payload.get("phone"), "custom_from_time": payload.get("from_time"), "custom_to_time": payload.get("to_time"), **addr
	})
	address.append("links", link)
	address.insert(ignore_permissions=True)
	return address.name

#---------------- vehicle resolution ----------------- #
def resolve_vehicle(payload, username):
	# Validate duplicate VINs and Plates in the payload
	vin_set = set()
	plate_set = set()
	
	for row in payload.get("vehicles"):
		vin = row.get("vin")
		plate = row.get("plate")

		if vin in vin_set: frappe.throw(_("Duplicate VIN found: {0}").format(vin))
		vin_set.add(vin)
		
		if plate in plate_set: frappe.throw(_("Duplicate Plate found: {0}").format(plate))
		plate_set.add(plate)
		
	vehicles = payload.get("vehicles")
	users = frappe.db.get_all("User", filters={"approved_company": frappe.get_value("User", username, "approved_company")}, pluck="name")
	# Insert vehicles if they do not already exist
	for vehicle in vehicles:
		existing = frappe.db.get_value("Vehicles", {"vin": vehicle.get("vin"), "user": ["in", users]}, ["name", "plate"])
		if existing and existing[1] == vehicle.get("plate"):
			continue
		elif existing and existing[1] != vehicle.get("plate"):
			frappe.throw(_("VIN {0} is already associated with a different plate.").format(vehicle.get('vin')))
			return
		
		veh = frappe.get_doc({
			"make": vehicle.get("make_model"), "type": vehicle.get("description"),
			"doctype": "Vehicles", "user": username, "vehicle_number": vehicle.get("vehicle_number"),
			"plate": vehicle.get("plate"), "vin": vehicle.get("vin"), "cables": vehicle.get("hitch")
		})
		veh.insert(ignore_permissions=True)

# ---------------- end ----------------- #

# ------------------ get request ------------------ #
@frappe.whitelist()
def get_request(request):
	# Enforce login
	if frappe.session.user == "Guest": frappe.throw(_("Please login to continue"), frappe.PermissionError)
	job = frappe.get_doc("Transportation Request", request, ignore_permissions=True)
	return job.as_dict()
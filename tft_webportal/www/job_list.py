import frappe
from frappe import _

def get_context(context):
	if frappe.session.user == "Guest":
		frappe.throw(_("You need to be logged in to access this page"), frappe.PermissionError)

	context.jobs = load_my_jobs(20)

# Load the jobs for the current user
@frappe.whitelist()
def load_my_jobs(limit):
	try:
		users = [frappe.session.user]
		# Fetch users from the current company if available
		company = frappe.db.get_value("User", frappe.session.user, "approved_company") or None
		if company:
			users = frappe.get_all("User", {"approved_company": company}, pluck="name")
			
		# Fetch jobs for the current users
		filters = {"supplier": ["IN", users]}
		fields=["name", "p_o_number", "date", "status", "p_o_number", "from_address", "to_address"]
		jobs = frappe.db.get_list("Transportation Request", filters, fields, ignore_permissions=True, limit=limit)
		# for job in jobs:
		# 	doc = frappe.get_doc("Transportation Request", job.name, ignore_permissions=True)
		# 	job['from_address'] = doc.get("addresses")[0].from_address if doc.get("addresses", []) else ""
		# 	job['to_address'] = doc.get("addresses")[0].to_address if doc.get("addresses", []) else ""
		# 	job['vehicles'] = len(doc.get("vehicle")) or 0
		return jobs
	except Exception as e:
		frappe.error_log("Error loading jobs", str(e))
		return []
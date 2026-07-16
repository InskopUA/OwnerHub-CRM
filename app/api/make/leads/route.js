import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { hasSupabaseAdminEnv, supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const pick = (source, keys, fallback = "") => {
  for (const key of keys) {
    const value = key.includes(".")
      ? key.split(".").reduce((acc, part) => acc?.[part], source)
      : source?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return fallback;
};

const hasAnyValue = (source, keys) => keys.some((key) => pick(source, [key]) !== "");

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const splitName = (body) => {
  const firstName = pick(body, ["firstName", "first_name", "first"]);
  const lastName = pick(body, ["lastName", "last_name", "last"]);
  if (firstName || lastName) return { firstName, lastName };

  const fullName = pick(body, ["name", "fullName", "full_name", "driverName", "driver_name"]);
  if (!fullName) return { firstName: "", lastName: "" };

  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() || "",
    lastName: parts.join(" ")
  };
};

const getToken = (request, body) =>
  request.headers.get("x-ownerhub-token") ||
  request.headers.get("x-ownerhub-secret") ||
  request.headers.get("x-make-secret") ||
  new URL(request.url).searchParams.get("token") ||
  new URL(request.url).searchParams.get("secret") ||
  body?.token ||
  body?.secret ||
  "";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const validStatuses = new Set([
  "new",
  "contact_attempted",
  "initial_contact",
  "qualified",
  "docs_requested",
  "docs_received",
  "quote_pending",
  "insurance_approved",
  "insurance_rejected",
  "offer_presented",
  "agreement_sent",
  "agreement_signed",
  "equipment_shipped",
  "inspection_pending",
  "safety_onboarding",
  "dispatch_onboarding",
  "ready_first_load",
  "first_load",
  "active",
  "lost"
]);

async function resolveWorkspace(body, request, token) {
  const expectedSecret = process.env.OWNERHUB_MAKE_WEBHOOK_SECRET;
  if (token && expectedSecret && token === expectedSecret) return resolveLegacyWorkspace(body, request);

  if (!token) throw new Error("Missing webhook token");

  const tokenHash = hashToken(token);
  const { data, error } = await supabaseAdmin
    .from("workspace_webhook_tokens")
    .select("id, workspace_id, active")
    .eq("token_hash", tokenHash)
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace_id) throw new Error("Invalid webhook token");

  await supabaseAdmin
    .from("workspace_webhook_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data.workspace_id;
}

async function resolveLegacyWorkspace(body, request) {
  const url = new URL(request.url);
  const explicitWorkspaceId =
    pick(body, ["workspaceId", "workspace_id"]) ||
    url.searchParams.get("workspace_id") ||
    process.env.OWNERHUB_MAKE_WORKSPACE_ID ||
    "";

  if (explicitWorkspaceId) {
    const { data, error } = await supabaseAdmin
      .from("workspaces")
      .select("id")
      .eq("id", explicitWorkspaceId)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id;
    throw new Error("Workspace not found");
  }

  const { data, error } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(2);

  if (error) throw error;
  if (!data?.length) throw new Error("No workspace found. Log in once to create a workspace.");
  if (data.length > 1) throw new Error("Multiple workspaces found. Send workspace_id or set OWNERHUB_MAKE_WORKSPACE_ID.");
  return data[0].id;
}

function mapLead(body, workspaceId) {
  const { firstName, lastName } = splitName(body);
  const notes = pick(body, ["notes", "note", "message", "comment", "comments"]);
  const source = pick(body, ["source", "leadSource", "lead_source", "utm_source"], "Make");
  const status = pick(body, ["status"], "new");

  return {
    workspace_id: workspaceId,
    first_name: firstName,
    last_name: lastName,
    phone: pick(body, ["phone", "phoneNumber", "phone_number", "mobile", "tel"]),
    email: pick(body, ["email", "emailAddress", "email_address"]),
    language: pick(body, ["language", "lang"], "Russian"),
    source,
    city: pick(body, ["city"]),
    state: pick(body, ["state", "stateCode", "state_code"]),
    zip: pick(body, ["zip", "zipcode", "zipCode", "postal_code"]),
    work_preference: pick(body, ["workPreference", "work_preference", "workType", "work_type"]),
    home_time: pick(body, ["homeTime", "home_time"]),
    start_date: pick(body, ["startDate", "start_date"]) || null,
    days_per_week: toNumberOrNull(pick(body, ["daysPerWeek", "days_per_week"])),
    restrictions: pick(body, ["restrictions"]),
    expected_gross: pick(body, ["expectedGross", "expected_gross"]),
    cdl: pick(body, ["cdl", "CDL"]),
    license_type: pick(body, ["licenseType", "license_type"]),
    experience_years: toNumberOrNull(pick(body, ["experienceYears", "experience_years"])),
    car_hauling_years: toNumberOrNull(pick(body, ["carHaulingYears", "car_hauling_years"])),
    two_car_experience: pick(body, ["twoCarExperience", "two_car_experience"]),
    accidents: pick(body, ["accidents"]),
    violations: pick(body, ["violations"]),
    medical_card: pick(body, ["medicalCard", "medical_card"]),
    previous_insurance_rejection: pick(body, ["previousInsuranceRejection", "previous_insurance_rejection"]),
    status: validStatuses.has(status) ? status : "new",
    score: 50,
    owner_name: pick(body, ["owner", "ownerName", "owner_name"], "HR Manager"),
    notes,
    tags: Array.isArray(body?.tags) ? body.tags.map(String) : []
  };
}

function mapEquipment(body, workspaceId, candidateId) {
  const truckKeys = [
    "truckMake", "truck_make", "truck.make",
    "truckModel", "truck_model", "truck.model",
    "truckYear", "truck_year", "truck.year",
    "truckVin", "truck_vin", "truck.vin",
    "truckGvwr", "truck_gvwr", "truck.gvwr",
    "truckFuel", "truck_fuel", "truck.fuel",
    "truckCondition", "truck_condition", "truck.condition",
    "truckInspection", "truck_inspection", "truck.inspection"
  ];
  const trailerKeys = [
    "trailerMake", "trailer_make", "trailer.make",
    "trailerModel", "trailer_model", "trailer.model",
    "trailerYear", "trailer_year", "trailer.year",
    "trailerVin", "trailer_vin", "trailer.vin",
    "trailerGvwr", "trailer_gvwr", "trailer.gvwr",
    "trailerCondition", "trailer_condition", "trailer.condition",
    "trailerInspection", "trailer_inspection", "trailer.inspection",
    "trailerLength", "trailer_length", "trailer.length",
    "trailerCapacity", "trailer_capacity", "trailer.capacity",
    "trailerType", "trailer_type", "trailer.type"
  ];

  const rows = [];

  if (hasAnyValue(body, truckKeys)) {
    rows.push({
      workspace_id: workspaceId,
      candidate_id: candidateId,
      equipment_type: "truck",
      make: pick(body, ["truckMake", "truck_make", "truck.make"]),
      model: pick(body, ["truckModel", "truck_model", "truck.model"]),
      year: toNumberOrNull(pick(body, ["truckYear", "truck_year", "truck.year"])),
      vin: pick(body, ["truckVin", "truck_vin", "truck.vin"]),
      gvwr: pick(body, ["truckGvwr", "truck_gvwr", "truck.gvwr"]),
      fuel: pick(body, ["truckFuel", "truck_fuel", "truck.fuel"]),
      condition: pick(body, ["truckCondition", "truck_condition", "truck.condition"]),
      inspection: pick(body, ["truckInspection", "truck_inspection", "truck.inspection"]),
      length: "",
      capacity: "",
      body_type: ""
    });
  }

  if (hasAnyValue(body, trailerKeys)) {
    rows.push({
      workspace_id: workspaceId,
      candidate_id: candidateId,
      equipment_type: "trailer",
      make: pick(body, ["trailerMake", "trailer_make", "trailer.make"]),
      model: pick(body, ["trailerModel", "trailer_model", "trailer.model"]),
      year: toNumberOrNull(pick(body, ["trailerYear", "trailer_year", "trailer.year"])),
      vin: pick(body, ["trailerVin", "trailer_vin", "trailer.vin"]),
      gvwr: pick(body, ["trailerGvwr", "trailer_gvwr", "trailer.gvwr"]),
      fuel: "",
      condition: pick(body, ["trailerCondition", "trailer_condition", "trailer.condition"]),
      inspection: pick(body, ["trailerInspection", "trailer_inspection", "trailer.inspection"]),
      length: pick(body, ["trailerLength", "trailer_length", "trailer.length"]),
      capacity: pick(body, ["trailerCapacity", "trailer_capacity", "trailer.capacity"], "2"),
      body_type: pick(body, ["trailerType", "trailer_type", "trailer.type"], "Open")
    });
  }

  return rows;
}

async function findExistingCandidate(workspaceId, lead) {
  if (lead.phone) {
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("phone", lead.phone)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id;
  }

  if (lead.email) {
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("email", lead.email)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (data?.id) return data.id;
  }

  return null;
}

export async function POST(request) {
  try {
    if (!hasSupabaseAdminEnv) {
      return NextResponse.json(
        { ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const token = getToken(request, body);
    const workspaceId = await resolveWorkspace(body, request, token);
    const lead = mapLead(body, workspaceId);
    const existingCandidateId = await findExistingCandidate(workspaceId, lead);

    let candidateId = existingCandidateId;
    let action = "updated";

    if (existingCandidateId) {
      const updatePayload = Object.fromEntries(
        Object.entries(lead).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      );
      updatePayload.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("candidates")
        .update(updatePayload)
        .eq("id", existingCandidateId)
        .eq("workspace_id", workspaceId);
      if (error) throw error;
    } else {
      action = "created";
      const { data, error } = await supabaseAdmin
        .from("candidates")
        .insert(lead)
        .select("id")
        .single();
      if (error) throw error;
      candidateId = data.id;
    }

    const equipmentRows = mapEquipment(body, workspaceId, candidateId);
    if (equipmentRows.length) {
      const { error } = await supabaseAdmin
        .from("candidate_equipment")
        .upsert(equipmentRows, { onConflict: "candidate_id,equipment_type" });
      if (error) throw error;
    }

    const activityId = `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const { error: activityError } = await supabaseAdmin.from("activities").insert({
      id: activityId,
      workspace_id: workspaceId,
      candidate_id: candidateId,
      type: "lead",
      text: `Lead ${action} from Make`
    });
    if (activityError) throw activityError;

    return NextResponse.json({ ok: true, action, candidate_id: candidateId, workspace_id: workspaceId });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message || "Unknown error" }, { status: 400 });
  }
}

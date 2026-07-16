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

const normalizeFieldName = (name) =>
  String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");

const fieldAliasEntries = [
  [["full_name", "full name", "name", "driver name", "contact name", "фио", "имя", "повне ім'я", "ім'я"], "name"],
  [["first_name", "first name", "firstname", "имя водителя", "имя кандидата"], "firstName"],
  [["last_name", "last name", "lastname", "фамилия"], "lastName"],
  [["phone_number", "phone", "mobile", "cell", "telephone", "tel", "номер телефона", "телефон", "мобильный", "мобільний"], "phone"],
  [["email", "email address", "e-mail", "почта", "емейл", "пошта"], "email"],
  [["city", "город", "місто"], "city"],
  [["state", "state code", "province", "штат", "область"], "state"],
  [["zip", "zip code", "zipcode", "postal code", "индекс", "почтовый индекс"], "zip"],
  [["work_preference", "work preference", "work type", "preferred work", "local or otr", "otr local", "формат работы", "тип работы"], "workPreference"],
  [["home_time", "home time", "hometime", "home time preference", "домой", "home weekly"], "homeTime"],
  [["start_date", "start date", "ready to start", "available date", "когда готов", "дата старта"], "startDate"],
  [["days_per_week", "days per week", "working days", "дней в неделю"], "daysPerWeek"],
  [["expected_gross", "expected gross", "weekly gross", "gross", "ожидаемый gross", "доход"], "expectedGross"],
  [["cdl", "cdl license", "commercial license"], "cdl"],
  [["license_type", "license type", "license class", "тип лицензии"], "licenseType"],
  [["experience_years", "experience years", "driving experience", "years experience", "опыт", "стаж"], "experienceYears"],
  [["car_hauling_years", "car hauling years", "car hauling experience", "опыт автовоз", "опыт car hauling"], "carHaulingYears"],
  [["two_car_experience", "two car experience", "2 car experience", "2car", "two car", "опыт 2 car"], "twoCarExperience"],
  [["accidents", "accident", "аварии", "дтп"], "accidents"],
  [["violations", "tickets", "moving violations", "нарушения", "тикеты"], "violations"],
  [["medical_card", "medical card", "dot medical card", "мед карта"], "medicalCard"],
  [["previous_insurance_rejection", "insurance rejection", "insurance denied", "отказ insurance"], "previousInsuranceRejection"],
  [["truck_make", "truck make", "truck", "truck brand", "марка трака", "марка грузовика"], "truckMake"],
  [["truck_model", "truck model", "модель трака", "модель грузовика"], "truckModel"],
  [["truck_year", "truck year", "год трака", "год грузовика"], "truckYear"],
  [["truck_vin", "truck vin", "vin truck"], "truckVin"],
  [["truck_gvwr", "truck gvwr", "gvwr truck"], "truckGvwr"],
  [["truck_fuel", "truck fuel", "fuel"], "truckFuel"],
  [["truck_condition", "truck condition"], "truckCondition"],
  [["truck_inspection", "truck inspection"], "truckInspection"],
  [["trailer_make", "trailer make", "trailer", "марка трейлера"], "trailerMake"],
  [["trailer_model", "trailer model", "модель трейлера"], "trailerModel"],
  [["trailer_year", "trailer year", "год трейлера"], "trailerYear"],
  [["trailer_vin", "trailer vin", "vin trailer"], "trailerVin"],
  [["trailer_gvwr", "trailer gvwr", "gvwr trailer"], "trailerGvwr"],
  [["trailer_length", "trailer length", "length"], "trailerLength"],
  [["trailer_capacity", "trailer capacity", "capacity", "cars capacity", "сколько машин"], "trailerCapacity"],
  [["trailer_type", "trailer type", "open enclosed"], "trailerType"],
  [["notes", "note", "message", "comment", "comments", "additional info", "extra info", "комментарий", "заметка"], "notes"]
];

const canonicalFieldNames = Object.fromEntries(
  fieldAliasEntries.flatMap(([aliases, canonicalName]) =>
    aliases.map((alias) => [normalizeFieldName(alias), canonicalName])
  )
);

const ignoredRawFieldNames = new Set(
  ["token", "secret", "xownerhubtoken", "xownerhubsecret", "xmakesecret", "workspaceid", "workspace_id"].map(normalizeFieldName)
);

const valueToString = (value) => {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.map(valueToString).filter(Boolean).join(", ");
  if (typeof value === "object") {
    if ("value" in value) return valueToString(value.value);
    if ("values" in value) return valueToString(value.values);
    return "";
  }
  return String(value).trim();
};

const assignLeadField = (target, rawName, value) => {
  const normalizedName = normalizeFieldName(rawName);
  if (!normalizedName || ignoredRawFieldNames.has(normalizedName)) return null;

  const key = canonicalFieldNames[normalizeFieldName(rawName)];
  const cleanValue = valueToString(value);
  if (!cleanValue) return null;

  if (key && !target[key]) target[key] = cleanValue;
  return { name: String(rawName).trim(), value: cleanValue, key, mapped: Boolean(key) };
};

const mergeNamedFieldArray = (target, fields, collectedFields) => {
  if (!Array.isArray(fields)) return;

  fields.forEach((field) => {
    const rawName = field?.name || field?.key || field?.label || field?.field_name;
    const value = field?.values ?? field?.value ?? field?.answer ?? field?.answers;
    const collected = assignLeadField(target, rawName, value);
    if (collected) collectedFields.push(collected);
  });
};

const normalizeLeadPayload = (body) => {
  const normalized = {};
  const collectedFields = [];

  [
    body?.field_data,
    body?.fieldData,
    body?.custom_fields,
    body?.customFields,
    body?.fields,
    body?.answers,
    body?.data?.field_data,
    body?.data?.custom_fields,
    body?.data?.fields,
    body?.data?.answers,
    body?.lead?.field_data,
    body?.lead?.custom_fields,
    body?.lead?.fields,
    body?.lead?.answers,
    body?.response?.field_data,
    body?.response?.custom_fields,
    body?.response?.fields,
    body?.response?.answers
  ].forEach((fields) => mergeNamedFieldArray(normalized, fields, collectedFields));

  Object.entries(body || {}).forEach(([key, value]) => {
    if (value !== null && typeof value === "object") return;
    const collected = assignLeadField(normalized, key, value);
    if (collected) collectedFields.push(collected);
  });

  [body?.data, body?.lead, body?.response].forEach((container) => {
    if (!container || typeof container !== "object" || Array.isArray(container)) return;
    Object.entries(container).forEach(([key, value]) => {
      if (value !== null && typeof value === "object") return;
      const collected = assignLeadField(normalized, key, value);
      if (collected) collectedFields.push(collected);
    });
  });

  return {
    ...body,
    ...normalized,
    _rawLeadFields: collectedFields,
    _unmappedLeadFields: collectedFields.filter((field) => !field.mapped)
  };
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
  const baseNotes = pick(body, ["notes", "note", "message", "comment", "comments"]);
  const extraFields = Array.isArray(body?._unmappedLeadFields)
    ? body._unmappedLeadFields
        .filter((field) => field.name && field.value)
        .map((field) => `${field.name}: ${field.value}`)
    : [];
  const notes = [
    baseNotes,
    extraFields.length ? `Additional lead fields:\n${extraFields.join("\n")}` : ""
  ].filter(Boolean).join("\n\n");
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

    const rawBody = await request.json();
    const body = normalizeLeadPayload(rawBody);
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

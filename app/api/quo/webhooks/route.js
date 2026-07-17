import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { hasSupabaseAdminEnv, supabaseAdmin } from "../../../../lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits;
};

const cleanTextArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.text) return item.text;
        if (item?.content) return item.content;
        if (item?.body) return item.body;
        return "";
      })
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }
  if (typeof value === "string") return [value.trim()].filter(Boolean);
  if (typeof value === "object") {
    return Object.values(value).map((item) => String(item || "").trim()).filter(Boolean);
  }
  return [];
};

const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const toNumberOrNull = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
};

const compactPayload = (body) => JSON.stringify(body);

function timingSafeEqualBase64(a, b) {
  const left = Buffer.from(String(a || ""), "base64");
  const right = Buffer.from(String(b || ""), "base64");
  if (!left.length || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function computeSignature(signingSecret, signedData) {
  const key = Buffer.from(signingSecret.trim(), "base64");
  return createHmac("sha256", key).update(Buffer.from(signedData, "utf8")).digest("base64");
}

function verifyQuoSignature({ header, signingSecret, rawBody, body }) {
  if (!signingSecret) return { ok: false, error: "Missing Quo signing secret in OwnerHub settings" };
  if (!header) return { ok: false, error: "Missing openphone-signature header" };

  const signatures = header.split(",").map((entry) => entry.trim()).filter(Boolean);
  for (const signatureEntry of signatures) {
    const [scheme, version, timestamp, providedDigest] = signatureEntry.split(";");
    if (scheme !== "hmac" || version !== "1" || !timestamp || !providedDigest) continue;

    const timestampNumber = Number(timestamp);
    const timestampMs = timestamp.length === 10 ? timestampNumber * 1000 : timestampNumber;
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      return { ok: false, error: "Quo signature timestamp is outside the allowed window" };
    }

    const candidates = [
      `${timestamp}.${compactPayload(body)}`,
      `${timestamp}.${rawBody}`
    ];

    for (const signedData of candidates) {
      const computed = computeSignature(signingSecret, signedData);
      if (timingSafeEqualBase64(providedDigest, computed)) return { ok: true };
    }
  }

  return { ok: false, error: "Invalid Quo signature" };
}

async function resolveWebhook(token) {
  if (!token) throw new Error("Missing Quo webhook token");

  const { data, error } = await supabaseAdmin
    .from("workspace_quo_webhooks")
    .select("id, workspace_id, signing_secret, active")
    .eq("token_hash", hashToken(token))
    .eq("active", true)
    .maybeSingle();

  if (error) throw error;
  if (!data?.workspace_id) throw new Error("Invalid Quo webhook token");

  await supabaseAdmin
    .from("workspace_quo_webhooks")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return data;
}

async function findCandidateByPhone(workspaceId, numbers) {
  const normalizedNumbers = numbers.map(normalizePhone).filter(Boolean);
  if (!normalizedNumbers.length) return null;

  const { data, error } = await supabaseAdmin
    .from("candidates")
    .select("id, first_name, last_name, phone, notes, status")
    .eq("workspace_id", workspaceId);

  if (error) throw error;
  return (data || []).find((candidate) => normalizedNumbers.includes(normalizePhone(candidate.phone))) || null;
}

async function insertActivity(workspaceId, candidateId, text, type = "call") {
  const id = `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabaseAdmin.from("activities").insert({
    id,
    workspace_id: workspaceId,
    candidate_id: candidateId,
    type,
    text
  });
  if (error) throw error;
}

async function maybeCreateNextStepFollowup(workspaceId, candidateId, nextSteps) {
  if (!nextSteps.length) return false;

  const note = `Quo next step: ${nextSteps.join("; ")}`.slice(0, 500);
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("followups")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("candidate_id", candidateId)
    .eq("status", "open")
    .ilike("note", "Quo next step:%")
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.length) return false;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const followupDate = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

  const id = `fu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabaseAdmin.from("followups").insert({
    id,
    workspace_id: workspaceId,
    candidate_id: candidateId,
    followup_date: followupDate,
    followup_time: "10:00",
    type: "Quo",
    note,
    status: "open"
  });
  if (error) throw error;

  await supabaseAdmin
    .from("candidates")
    .update({ next_follow_up: followupDate })
    .eq("workspace_id", workspaceId)
    .eq("id", candidateId);

  return true;
}

async function applySummaryToCandidate(workspaceId, callId) {
  const { data: event, error: eventError } = await supabaseAdmin
    .from("quo_call_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event?.candidate_id || event.summary_imported_at) return { imported: false, candidateId: event?.candidate_id || null };

  const summary = cleanTextArray(event.summary);
  const nextSteps = cleanTextArray(event.next_steps);
  if (!summary.length && !nextSteps.length) return { imported: false, candidateId: event.candidate_id };

  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from("candidates")
    .select("id, status")
    .eq("workspace_id", workspaceId)
    .eq("id", event.candidate_id)
    .maybeSingle();
  if (candidateError) throw candidateError;
  if (!candidate) return { imported: false, candidateId: event.candidate_id };

  const importedAt = new Date().toISOString();
  const updates = {
    last_contact: importedAt
  };
  if (candidate.status === "new") updates.status = "contact_attempted";

  const { error: updateError } = await supabaseAdmin
    .from("candidates")
    .update(updates)
    .eq("workspace_id", workspaceId)
    .eq("id", candidate.id);
  if (updateError) throw updateError;

  await maybeCreateNextStepFollowup(workspaceId, candidate.id, nextSteps);
  await insertActivity(workspaceId, candidate.id, `Quo call summary imported for call ${callId}`);

  const { error: eventUpdateError } = await supabaseAdmin
    .from("quo_call_events")
    .update({ summary_imported_at: importedAt })
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId);
  if (eventUpdateError) throw eventUpdateError;

  return { imported: true, candidateId: candidate.id };
}

async function applyRecordingToCandidate(workspaceId, callId) {
  const { data: event, error: eventError } = await supabaseAdmin
    .from("quo_call_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId)
    .maybeSingle();
  if (eventError) throw eventError;
  if (!event?.candidate_id || !event.recording_url || event.recording_imported_at) {
    return { imported: false, candidateId: event?.candidate_id || null };
  }

  const importedAt = new Date().toISOString();
  await insertActivity(workspaceId, event.candidate_id, `Quo call recording linked for call ${callId}`);

  const { error: updateError } = await supabaseAdmin
    .from("quo_call_events")
    .update({ recording_imported_at: importedAt })
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId);
  if (updateError) throw updateError;

  await supabaseAdmin
    .from("candidates")
    .update({ last_contact: event.completed_at || event.answered_at || importedAt })
    .eq("workspace_id", workspaceId)
    .eq("id", event.candidate_id);

  return { imported: true, candidateId: event.candidate_id };
}

async function handleCallCompleted(workspaceId, eventId, body, object) {
  const callId = object?.id || object?.callId || "";
  if (!callId) return { ok: true, ignored: true, reason: "Missing call id" };

  const direction = object?.direction || "";
  const candidatePhone = direction === "outgoing" ? object?.to : direction === "incoming" ? object?.from : "";
  const candidate = await findCandidateByPhone(workspaceId, [candidatePhone, object?.from, object?.to]);

  const row = {
    workspace_id: workspaceId,
    candidate_id: candidate?.id || null,
    call_id: callId,
    event_id: eventId || "",
    event_type: body?.type || "call.completed",
    from_number: object?.from || "",
    to_number: object?.to || "",
    direction,
    conversation_id: object?.conversationId || "",
    phone_number_id: object?.phoneNumberId || "",
    user_id: object?.userId || "",
    answered_at: safeDate(object?.answeredAt),
    completed_at: safeDate(object?.completedAt || object?.createdAt),
    raw_payload: body
  };

  const { error } = await supabaseAdmin
    .from("quo_call_events")
    .upsert(row, { onConflict: "workspace_id,call_id" });
  if (error) throw error;

  if (candidate?.id && object?.answeredAt) {
    await supabaseAdmin
      .from("candidates")
      .update({
        last_contact: safeDate(object.answeredAt),
        status: candidate.status === "new" ? "contact_attempted" : candidate.status
      })
      .eq("workspace_id", workspaceId)
      .eq("id", candidate.id);
  }

  const summaryResult = await applySummaryToCandidate(workspaceId, callId);
  const recordingResult = await applyRecordingToCandidate(workspaceId, callId);
  return { ok: true, callId, matched: Boolean(candidate?.id), candidateId: candidate?.id || null, summaryImported: summaryResult.imported, recordingLinked: recordingResult.imported };
}

async function handleSummaryCompleted(workspaceId, eventId, body, object) {
  const callId = object?.callId || object?.call_id || object?.id || "";
  if (!callId) return { ok: true, ignored: true, reason: "Missing call id" };

  const summary = cleanTextArray(object?.summary);
  const nextSteps = cleanTextArray(object?.nextSteps || object?.next_steps);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("quo_call_events")
    .select("candidate_id")
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId)
    .maybeSingle();
  if (existingError) throw existingError;

  const row = {
    workspace_id: workspaceId,
    candidate_id: existing?.candidate_id || null,
    call_id: callId,
    event_id: eventId || "",
    event_type: body?.type || "call.summary.completed",
    summary,
    next_steps: nextSteps,
    raw_payload: body
  };

  const { error } = await supabaseAdmin
    .from("quo_call_events")
    .upsert(row, { onConflict: "workspace_id,call_id" });
  if (error) throw error;

  const summaryResult = await applySummaryToCandidate(workspaceId, callId);
  return { ok: true, callId, summaryImported: summaryResult.imported, candidateId: summaryResult.candidateId };
}

async function handleRecordingCompleted(workspaceId, eventId, body, object) {
  const callId = object?.callId || object?.call_id || object?.id || "";
  if (!callId) return { ok: true, ignored: true, reason: "Missing call id" };

  const media = Array.isArray(object?.media) ? object.media[0] : object?.media;
  const recordingUrl = media?.url || object?.recordingUrl || object?.recording_url || object?.url || "";
  if (!recordingUrl) return { ok: true, ignored: true, callId, reason: "Missing recording URL" };

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("quo_call_events")
    .select("candidate_id")
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId)
    .maybeSingle();
  if (existingError) throw existingError;

  const row = {
    workspace_id: workspaceId,
    candidate_id: existing?.candidate_id || null,
    call_id: callId,
    event_id: eventId || "",
    event_type: body?.type || "call.recording.completed",
    recording_url: recordingUrl,
    recording_type: media?.type || object?.type || "",
    recording_duration_seconds: toNumberOrNull(media?.duration || object?.duration),
    raw_payload: body
  };

  const { error } = await supabaseAdmin
    .from("quo_call_events")
    .upsert(row, { onConflict: "workspace_id,call_id" });
  if (error) throw error;

  const recordingResult = await applyRecordingToCandidate(workspaceId, callId);
  return { ok: true, callId, recordingLinked: recordingResult.imported, candidateId: recordingResult.candidateId };
}

export async function POST(request) {
  try {
    if (!hasSupabaseAdminEnv) {
      return NextResponse.json({ ok: false, error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 });
    }

    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const token = new URL(request.url).searchParams.get("token") || request.headers.get("x-ownerhub-token") || "";
    const webhook = await resolveWebhook(token);
    const signature = verifyQuoSignature({
      header: request.headers.get("openphone-signature") || "",
      signingSecret: webhook.signing_secret || "",
      rawBody,
      body
    });

    if (!signature.ok) {
      return NextResponse.json({ ok: false, error: signature.error }, { status: 401 });
    }

    const object = body?.data?.object || body?.object || {};
    let result;
    if (body?.type === "call.completed") {
      result = await handleCallCompleted(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "call.summary.completed") {
      result = await handleSummaryCompleted(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "call.recording.completed") {
      result = await handleRecordingCompleted(webhook.workspace_id, body?.id, body, object);
    } else {
      result = { ok: true, ignored: true, eventType: body?.type || "" };
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error?.message || "Quo webhook failed";
    const missingTable = error?.code === "42P01";
    return NextResponse.json({
      ok: false,
      error: missingTable ? "Quo tables are missing. Run the updated supabase_schema.sql in Supabase SQL Editor." : message
    }, { status: missingTable ? 500 : 500 });
  }
}

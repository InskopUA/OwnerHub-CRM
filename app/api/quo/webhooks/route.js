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

const arrayFrom = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const firstText = (...values) => values.find((value) => String(value || "").trim()) || "";

const compactPayload = (body) => JSON.stringify(body);

const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const normalizeQuoPhoneId = (value) => String(value || "").trim().toLowerCase();

const getObjectPhoneNumberId = (object) =>
  firstText(object?.phoneNumberId, object?.phone_number_id, object?.phoneNumber?.id, object?.phone_number?.id);

async function getWorkspaceQuoSettings(workspaceId) {
  const { data, error } = await supabaseAdmin
    .from("app_settings")
    .select("quo_sms_from")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw error;
  return { phoneNumberId: data?.quo_sms_from || "" };
}

function matchesConfiguredQuoPhone(settings, object) {
  const configured = normalizeQuoPhoneId(settings?.phoneNumberId);
  if (!configured) return true;
  const eventPhoneNumberId = normalizeQuoPhoneId(getObjectPhoneNumberId(object));
  return eventPhoneNumberId === configured;
}

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

async function findOrCreateIncomingCallCandidate(workspaceId, phone, source, receivedAt) {
  const candidate = await findCandidateByPhone(workspaceId, [phone]);
  if (candidate?.id) return { candidate, created: false };

  const { data, error } = await supabaseAdmin
    .from("candidates")
    .insert({
      workspace_id: workspaceId,
      phone: phone || "",
      source,
      language: "Russian",
      status: "new",
      score: 50,
      owner_name: "HR Manager",
      notes: "Created automatically from incoming Quo call.",
      last_contact: receivedAt || new Date().toISOString()
    })
    .select("id, first_name, last_name, phone, notes, status")
    .single();
  if (error) throw error;

  await insertActivity(workspaceId, data.id, `Candidate created automatically from incoming Quo call ${phone || ""}`.trim(), "lead");
  return { candidate: data, created: true };
}

async function ensureMissedCallFollowup(workspaceId, candidateId, phone) {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("followups")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("candidate_id", candidateId)
    .eq("status", "open")
    .ilike("note", "Call back missed incoming call%")
    .limit(1);
  if (existingError) throw existingError;
  if (existing?.length) return false;

  const followupDate = todayISO();
  const followupId = `fu_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const { error } = await supabaseAdmin.from("followups").insert({
    id: followupId,
    workspace_id: workspaceId,
    candidate_id: candidateId,
    followup_date: followupDate,
    followup_time: "10:00",
    type: "Call",
    note: `Call back missed incoming call${phone ? ` from ${phone}` : ""}`,
    status: "open"
  });
  if (error) throw error;

  const { error: candidateError } = await supabaseAdmin
    .from("candidates")
    .update({ next_follow_up: followupDate })
    .eq("workspace_id", workspaceId)
    .eq("id", candidateId);
  if (candidateError) throw candidateError;

  await insertActivity(workspaceId, candidateId, "Auto follow-up created for missed incoming Quo call", "followup");
  return true;
}

const ignoreMissingTable = (error) => {
  if (error?.code === "42P01") return true;
  if (error) throw error;
  return false;
};

function extractMessageMedia(object) {
  return [
    ...arrayFrom(object?.media),
    ...arrayFrom(object?.attachments),
    ...arrayFrom(object?.files)
  ]
    .map((item) => {
      if (typeof item === "string") return { url: item };
      return item || {};
    })
    .map((item) => ({
      url: firstText(item.url, item.downloadUrl, item.download_url, item.href, item.link),
      mimeType: firstText(item.mimeType, item.mime_type, item.type, item.contentType, item.content_type),
      fileName: firstText(item.fileName, item.file_name, item.name),
      sizeBytes: toNumberOrNull(item.sizeBytes || item.size_bytes || item.size)
    }))
    .filter((item) => item.url);
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

async function closeLiveCall(workspaceId, callId, status = "completed", completedAt = new Date().toISOString()) {
  if (!callId) return;
  const { error } = await supabaseAdmin
    .from("quo_live_calls")
    .update({ status, completed_at: completedAt })
    .eq("workspace_id", workspaceId)
    .eq("call_id", callId);
  ignoreMissingTable(error);
}

async function handleCallRinging(workspaceId, eventId, body, object) {
  const callId = object?.id || object?.callId || "";
  if (!callId) return { ok: true, ignored: true, reason: "Missing call id" };

  const settings = await getWorkspaceQuoSettings(workspaceId);
  if (!matchesConfiguredQuoPhone(settings, object)) {
    return { ok: true, ignored: true, callId, reason: "Different Quo phone number" };
  }

  const direction = object?.direction || "incoming";
  const fromNumber = firstText(object?.from, object?.fromNumber, object?.from_number);
  const toNumber = firstText(object?.to, object?.toNumber, object?.to_number);
  const candidatePhone = direction === "outgoing" ? toNumber : fromNumber;
  const startedAt = safeDate(object?.createdAt || object?.startedAt || object?.ringingAt) || new Date().toISOString();
  const candidateResult = direction === "incoming"
    ? await findOrCreateIncomingCallCandidate(workspaceId, candidatePhone, "Quo Incoming Call", startedAt)
    : { candidate: await findCandidateByPhone(workspaceId, [candidatePhone, fromNumber, toNumber]), created: false };
  const candidate = candidateResult.candidate;

  const row = {
    workspace_id: workspaceId,
    candidate_id: candidate?.id || null,
    call_id: callId,
    event_id: eventId || "",
    event_type: body?.type || "call.ringing",
    from_number: fromNumber,
    to_number: toNumber,
    direction,
    status: "ringing",
    conversation_id: object?.conversationId || "",
    phone_number_id: getObjectPhoneNumberId(object),
    started_at: startedAt,
    raw_payload: body
  };

  const { error } = await supabaseAdmin
    .from("quo_live_calls")
    .upsert(row, { onConflict: "workspace_id,call_id" });
  if (error) throw error;

  return { ok: true, callId, matched: Boolean(candidate?.id), candidateCreated: candidateResult.created, candidateId: candidate?.id || null };
}

async function handleCallCompleted(workspaceId, eventId, body, object) {
  const callId = object?.id || object?.callId || "";
  if (!callId) return { ok: true, ignored: true, reason: "Missing call id" };

  const settings = await getWorkspaceQuoSettings(workspaceId);
  if (!matchesConfiguredQuoPhone(settings, object)) {
    return { ok: true, ignored: true, callId, reason: "Different Quo phone number" };
  }

  const direction = object?.direction || "";
  const fromNumber = firstText(object?.from, object?.fromNumber, object?.from_number);
  const toNumber = firstText(object?.to, object?.toNumber, object?.to_number);
  const candidatePhone = direction === "outgoing" ? toNumber : direction === "incoming" ? fromNumber : "";
  const completedAt = safeDate(object?.completedAt || object?.createdAt) || new Date().toISOString();
  const answeredAt = safeDate(object?.answeredAt);
  const missedIncomingCall = direction === "incoming" && !answeredAt;
  const candidateResult = direction === "incoming"
    ? await findOrCreateIncomingCallCandidate(workspaceId, candidatePhone, missedIncomingCall ? "Quo Missed Call" : "Quo Incoming Call", completedAt)
    : { candidate: await findCandidateByPhone(workspaceId, [candidatePhone, fromNumber, toNumber]), created: false };
  const candidate = candidateResult.candidate;

  const row = {
    workspace_id: workspaceId,
    candidate_id: candidate?.id || null,
    call_id: callId,
    event_id: eventId || "",
    event_type: body?.type || "call.completed",
    from_number: fromNumber,
    to_number: toNumber,
    direction,
    conversation_id: object?.conversationId || "",
    phone_number_id: getObjectPhoneNumberId(object),
    user_id: object?.userId || "",
    answered_at: answeredAt,
    completed_at: completedAt,
    raw_payload: body
  };

  const { error } = await supabaseAdmin
    .from("quo_call_events")
    .upsert(row, { onConflict: "workspace_id,call_id" });
  if (error) throw error;

  if (candidate?.id && answeredAt) {
    await supabaseAdmin
      .from("candidates")
      .update({
        last_contact: answeredAt,
        status: candidate.status === "new" ? "contact_attempted" : candidate.status
      })
      .eq("workspace_id", workspaceId)
      .eq("id", candidate.id);
  }

  if (candidate?.id && missedIncomingCall) {
    const followupCreated = await ensureMissedCallFollowup(workspaceId, candidate.id, candidatePhone);
    if (followupCreated) {
      await insertActivity(workspaceId, candidate.id, `Missed incoming Quo call${candidatePhone ? ` from ${candidatePhone}` : ""}`, "call");
    }
  }

  const summaryResult = await applySummaryToCandidate(workspaceId, callId);
  const recordingResult = await applyRecordingToCandidate(workspaceId, callId);
  await closeLiveCall(workspaceId, callId, missedIncomingCall ? "missed" : "completed", completedAt);
  return {
    ok: true,
    callId,
    matched: Boolean(candidate?.id),
    candidateCreated: candidateResult.created,
    missed: missedIncomingCall,
    candidateId: candidate?.id || null,
    summaryImported: summaryResult.imported,
    recordingLinked: recordingResult.imported
  };
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
  if (!existing) return { ok: true, ignored: true, callId, reason: "Call was not imported for the configured Quo phone number" };

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
  if (!existing) return { ok: true, ignored: true, callId, reason: "Call was not imported for the configured Quo phone number" };

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

async function handleMessageReceived(workspaceId, eventId, body, object) {
  const messageId = object?.id || object?.messageId || object?.message_id || eventId || "";
  const settings = await getWorkspaceQuoSettings(workspaceId);
  if (!matchesConfiguredQuoPhone(settings, object)) {
    return { ok: true, ignored: true, messageId, reason: "Different Quo phone number" };
  }

  const fromNumber = firstText(object?.from, object?.fromNumber, object?.from_number, object?.sender?.phoneNumber, object?.sender?.phone_number);
  const toNumber = firstText(object?.to, object?.toNumber, object?.to_number, object?.phoneNumber, object?.phone_number);
  const media = extractMessageMedia(object);

  if (!media.length) return { ok: true, ignored: true, reason: "Message has no media", messageId };

  const candidate = await findCandidateByPhone(workspaceId, [fromNumber, object?.contact?.phoneNumber, object?.contact?.phone_number]);
  const rows = media.map((item, index) => ({
    id: `att_${Date.now().toString(36)}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    workspace_id: workspaceId,
    candidate_id: candidate?.id || null,
    source: "quo_message",
    message_id: messageId,
    from_number: fromNumber,
    to_number: toNumber,
    direction: "incoming",
    document_type: "",
    file_name: item.fileName || `Quo attachment ${index + 1}`,
    mime_type: item.mimeType,
    size_bytes: item.sizeBytes,
    external_url: item.url,
    raw_payload: body
  }));

  const { error } = await supabaseAdmin
    .from("candidate_attachments")
    .upsert(rows, { onConflict: "workspace_id,message_id,external_url" });
  if (error) throw error;

  if (candidate?.id) {
    await insertActivity(workspaceId, candidate.id, `Quo message attachment received (${media.length})`, "document");
    await supabaseAdmin
      .from("candidates")
      .update({ last_contact: safeDate(object?.createdAt || object?.created_at) || new Date().toISOString() })
      .eq("workspace_id", workspaceId)
      .eq("id", candidate.id);
  }

  return { ok: true, messageId, matched: Boolean(candidate?.id), candidateId: candidate?.id || null, attachments: media.length };
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
    if (body?.type === "call.ringing") {
      result = await handleCallRinging(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "call.completed") {
      result = await handleCallCompleted(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "call.summary.completed") {
      result = await handleSummaryCompleted(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "call.recording.completed") {
      result = await handleRecordingCompleted(webhook.workspace_id, body?.id, body, object);
    } else if (body?.type === "message.received") {
      result = await handleMessageReceived(webhook.workspace_id, body?.id, body, object);
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

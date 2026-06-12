const SUPABASE_URL = "https://frrosrbcmulvpsayjjxc.supabase.co";
const SUPABASE_KEY = "sb_publishable_rcTy7Eh2_Gidw-n_JVoHXQ_0DVTNnEV";
const TABLE = "nextup_schedules";

function getDeviceId() {
  let id = localStorage.getItem("nextup_device_id");
  if (!id) { id = "d_" + Math.random().toString(36).substr(2,10) + "_" + Date.now(); localStorage.setItem("nextup_device_id", id); }
  return id;
}

function getSyncStatus() { return true; }

const _h = { "Content-Type":"application/json", "apikey":SUPABASE_KEY, "Authorization":"Bearer "+SUPABASE_KEY, "Prefer":"return=representation" };

async function saveScheduleToCloud(schedule, focus) {
  const id = getDeviceId();
  const body = JSON.stringify({ device_id:id, schedule:JSON.stringify(schedule), focus_schedule:JSON.stringify(focus), updated_at:new Date().toISOString() });
  const check = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${encodeURIComponent(id)}`, { headers:_h });
  const existing = await check.json();
  const method = existing.length > 0 ? "PATCH" : "POST";
  const url = existing.length > 0 ? `${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${encodeURIComponent(id)}` : `${SUPABASE_URL}/rest/v1/${TABLE}`;
  const res = await fetch(url, { method, headers:_h, body });
  return { ok: res.ok };
}

async function loadScheduleFromCloud() {
  const id = getDeviceId();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${encodeURIComponent(id)}&select=*`, { headers:_h });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { schedule: data[0].schedule ? JSON.parse(data[0].schedule) : null, focusSchedule: data[0].focus_schedule ? JSON.parse(data[0].focus_schedule) : null };
}

async function loadScheduleByShareCode(code) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${encodeURIComponent(code)}&select=*`, { headers:_h });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { schedule: data[0].schedule ? JSON.parse(data[0].schedule) : null, focusSchedule: data[0].focus_schedule ? JSON.parse(data[0].focus_schedule) : null };
}

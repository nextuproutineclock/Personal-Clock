const SUPABASE_URL = "https://sdkihobprbgbkrqgurqh.supabase.co";
const SUPABASE_KEY = "sb_publishable_XHvk0yy9qfuVSfRhwPh-aA_zPNRULww";
const TABLE = "nextup_schedules";
const SHARED_DEVICE_ID = "nextup_family_schedule";
const _h = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": "Bearer " + SUPABASE_KEY,
  "Prefer": "return=representation"
};
async function saveScheduleToCloud(schedule, focus) {
  const body = JSON.stringify({ device_id: SHARED_DEVICE_ID, schedule: JSON.stringify(schedule), focus_schedule: JSON.stringify(focus), updated_at: new Date().toISOString() });
  const check = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${SHARED_DEVICE_ID}`, { headers: _h });
  const existing = await check.json();
  const method = existing.length > 0 ? "PATCH" : "POST";
  const url = existing.length > 0 ? `${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${SHARED_DEVICE_ID}` : `${SUPABASE_URL}/rest/v1/${TABLE}`;
  const res = await fetch(url, { method, headers: _h, body });
  return { ok: res.ok };
}
async function loadScheduleFromCloud() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${SHARED_DEVICE_ID}&select=*`, { headers: _h });
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return {
    schedule: data[0].schedule ? JSON.parse(data[0].schedule) : null,
    focusSchedule: data[0].focus_schedule ? JSON.parse(data[0].focus_schedule) : null
  };
}
function startRealtimeSync(onUpdate) {
  const wsUrl = SUPABASE_URL.replace("https://", "wss://") + "/realtime/v1/websocket?apikey=" + SUPABASE_KEY + "&vsn=1.0.0";
  let ws;
  let heartbeat;
  function connect() {
    ws = new WebSocket(wsUrl);
    ws.onopen = () => {
      console.log("[Sync] Realtime connected");
      ws.send(JSON.stringify({ topic: "realtime:public:nextup_schedules", event: "phx_join", payload: {}, ref: "1" }));
      heartbeat = setInterval(() => {
        ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" }));
      }, 25000);
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "INSERT" || msg.event === "UPDATE") {
          console.log("[Sync] Schedule updated, reloading...");
          if (typeof onUpdate === "function") onUpdate();
        }
      } catch (err) {}
    };
    ws.onclose = () => {
      console.log("[Sync] Disconnected, reconnecting in 5s...");
      clearInterval(heartbeat);
      setTimeout(connect, 5000);
    };
    ws.onerror = () => { ws.close(); };
  }
  connect();
}

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

// Saves both schedules. Returns { ok: true } only if Supabase confirmed the write.
// On failure returns { ok: false, error: "..." } so the caller can tell the parent.
async function saveScheduleToCloud(schedule, focus) {
  const row = {
    schedule: JSON.stringify(schedule),
    focus_schedule: JSON.stringify(focus),
    updated_at: new Date().toISOString()
  };
  const rowUrl = `${SUPABASE_URL}/rest/v1/${TABLE}?device_id=eq.${SHARED_DEVICE_ID}`;

  // 1) Try to update the existing row.
  let res = await fetch(rowUrl, { method: "PATCH", headers: _h, body: JSON.stringify(row) });
  if (!res.ok) {
    const text = await res.text();
    console.error("[Sync] PATCH failed:", res.status, text);
    return { ok: false, error: "PATCH " + res.status + " " + text };
  }
  const updated = await res.json();
  if (Array.isArray(updated) && updated.length > 0) {
    console.log("[Sync] Cloud save confirmed (updated)");
    return { ok: true };
  }

  // 2) PATCH matched no rows. Either the row doesn't exist yet, or a row-level
  //    security policy is blocking updates. Try inserting; a duplicate-key error
  //    here means RLS is hiding the existing row from updates.
  res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: _h,
    body: JSON.stringify({ device_id: SHARED_DEVICE_ID, ...row })
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("[Sync] POST failed:", res.status, text);
    return { ok: false, error: "POST " + res.status + " " + text };
  }
  console.log("[Sync] Cloud save confirmed (inserted)");
  return { ok: true };
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
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: "hb" }));
        }
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
  connect();
}

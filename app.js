// ============================================================
// NextUp Routine Clock v3 - app.js
// ============================================================

// ---------- DEFAULT SCHEDULES ----------

const DEFAULT_SCHEDULE = {
  mon_fri: {
    day: [
      { label: "Wake Up",     start: "07:00", end: "07:30", color: "#A8BED4", icon: "\u23F0" },
      { label: "Get Ready",   start: "07:30", end: "08:00", color: "#E0D5CB", icon: "\uD83D\uDC55" },
      { label: "Leave School",start: "08:00", end: "08:30", color: "#C5D4C9", icon: "\uD83D\uDE97" },
      { label: "School",      start: "08:30", end: "09:06", color: "#B5C9D4", icon: "\uD83C\uDFEB" },
      { label: "School",      start: "09:06", end: "15:15", color: "#B5C9D4", icon: "\uD83C\uDFEB" },
      { label: "Arrive Home", start: "15:15", end: "15:45", color: "#C5D4C5", icon: "\uD83C\uDFE0" },
      { label: "Snack",       start: "15:45", end: "16:15", color: "#E8E0D0", icon: "\uD83C\uDF4E" },
      { label: "Play Time",   start: "16:15", end: "17:00", color: "#D0D8C5", icon: "\uD83E\uDE80" },
      { label: "Mom Home",    start: "17:00", end: "17:30", color: "#C9BED4", icon: "\uD83D\uDC69\u200D\uD83D\uDC66" },
      { label: "Make Dinner", start: "17:30", end: "18:00", color: "#E0D0BF", icon: "\uD83D\uDC69\u200D\uD83C\uDF73" },
      { label: "Eat Dinner",  start: "18:00", end: "18:30", color: "#D8C9B8", icon: "\uD83C\uDF7D\uFE0F" },
      { label: "Bath Time",   start: "18:30", end: "19:00", color: "#B8D4D8", icon: "\uD83D\uDEC1" }
    ],
    night: [
      { label: "Screen Time", start: "19:00", end: "20:00", color: "#8B7E99", icon: "\uD83D\uDCFA" },
      { label: "Wind Down",   start: "20:00", end: "21:00", color: "#736680", icon: "\uD83D\uDCD6" },
      { label: "Lights Out",  start: "21:00", end: "21:15", color: "#5C5266", icon: "\uD83D\uDECC" },
      { label: "Sleeping",    start: "21:15", end: "07:00", color: "#4A3F52", icon: "\uD83C\uDF19" }
    ]
  },
  weekend: {
    day: [
      { label: "Wake Up",     start: "08:00", end: "08:30", color: "#A8BED4", icon: "\u23F0" },
      { label: "Breakfast",   start: "08:30", end: "09:30", color: "#E8CFC0", icon: "\uD83E\uDD5E" },
      { label: "Play Time",   start: "09:30", end: "12:30", color: "#D0D8C5", icon: "\uD83E\uDDF8" },
      { label: "Lunch",       start: "12:30", end: "13:30", color: "#D8C9B8", icon: "\uD83E\uDD6A" },
      { label: "Play Time",   start: "13:30", end: "17:00", color: "#D0D8C5", icon: "\uD83E\uDDF8" },
      { label: "Make Dinner", start: "17:00", end: "18:00", color: "#E8CFD8", icon: "\uD83D\uDC69\u200D\uD83C\uDF73" },
      { label: "Eat Dinner",  start: "18:00", end: "18:30", color: "#D8C9B8", icon: "\uD83C\uDF7D\uFE0F" },
      { label: "Bath Time",   start: "18:30", end: "19:00", color: "#B8D4D8", icon: "\uD83D\uDEC1" },
      { label: "Screen Time", start: "19:00", end: "20:00", color: "#8B7E99", icon: "\uD83D\uDCFA" }
    ],
    night: [
      { label: "Sleep", start: "20:00", end: "08:00", color: "#4A3F52", icon: "\uD83C\uDF19" }
    ]
  }
};

const DEFAULT_FOCUS_SCHEDULE = {
  startTime: "14:00",
  tasks: [
    { label: "Greeting",      start: 0,  end: 5,  color: "#A8BED4", icon: "\uD83D\uDC4B" },
    { label: "Table Work",    start: 5,  end: 20, color: "#E0D5CB", icon: "\uD83D\uDCDD" },
    { label: "Sensory Break", start: 20, end: 30, color: "#C5D4C9", icon: "\uD83E\uDDF8" },
    { label: "Table Work",    start: 30, end: 45, color: "#B5C9D4", icon: "\uD83D\uDCDD" },
    { label: "Free Choice",   start: 45, end: 55, color: "#D0D8C5", icon: "\uD83C\uDFA8" },
    { label: "Goodbye",       start: 55, end: 60, color: "#B8D4D8", icon: "\uD83D\uDC4B" }
  ]
};

// ---------- LOAD SAVED DATA ----------

let scheduleData;
try {
  const raw = localStorage.getItem("routineClockSchedule");
  scheduleData = raw ? JSON.parse(raw) : DEFAULT_SCHEDULE;
} catch (e) {
  console.error("Error reading schedule:", e);
  scheduleData = DEFAULT_SCHEDULE;
}

let focusScheduleData;
try {
  const rawFocus = localStorage.getItem("routineClockFocusSchedule");
  focusScheduleData = rawFocus ? JSON.parse(rawFocus) : DEFAULT_FOCUS_SCHEDULE;
} catch (e) {
  console.error("Error reading focus schedule:", e);
  focusScheduleData = DEFAULT_FOCUS_SCHEDULE;
}

// ---------- STATE ----------

let clockMode = "12hr";
let focusSessionActive = false;
let focusCurrentIdx = -1;
let focusTransitionWarningShown = false;
let currentMode = "";
let currentActivityIndex = -1;
let transitionWarningShown = false;
let audioContext = null;

const sectorsGroup = document.getElementById("sectors");
const activityLabel = document.getElementById("current-activity");

// ---------- VOICE ----------

let selectedVoice = null;
let voicesLoaded = false;

function loadVoices() {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    voicesLoaded = true;
    selectedVoice =
      voices.find(v => v.name.includes("Sonia")) ||
      voices.find(v => v.name.includes("Samantha")) ||
      voices.find(v => v.name.includes("Victoria")) ||
      voices.find(v => v.name.includes("Google") && v.name.includes("Female")) ||
      voices.find(v => v.name.includes("Wavenet")) ||
      voices.find(v => v.name.toLowerCase().includes("female")) ||
      voices.find(v => v.lang.startsWith("en") &&
        !v.name.includes("David") &&
        !v.name.includes("Mark") &&
        !v.name.includes("George")) ||
      voices[voices.length - 1];
    console.log("Voice:", selectedVoice?.name);
  }
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  if (!voicesLoaded) loadVoices();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  if (selectedVoice) utterance.voice = selectedVoice;
  window.speechSynthesis.speak(utterance);
}

// ---------- 12-HOUR HELPERS ----------

function getAngles(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return (h % 12) * 30 + m * 0.5;
}

function createSector(startAngle, endAngle, color, isCurrent) {
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const r = 98, cx = 100, cy = 100;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;

  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${diff > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", color);
  path.setAttribute("opacity", isCurrent ? "0.92" : "0.55");
  path.setAttribute("class", isCurrent ? "current-activity" : "");
  return path;
}

function createIcon(startAngle, endAngle, iconChar, isCurrent, label, photo) {
  if (!iconChar && !photo) return null;

  let diff = endAngle - startAngle;
  if (diff < 0) diff += 360;
  const midAngle = startAngle + diff / 2;
  const midRad = ((midAngle - 90) * Math.PI) / 180;

  const r = isCurrent ? 68 : 82;
  const cx = 100, cy = 100;
  const x = cx + r * Math.cos(midRad);
  const y = cy + r * Math.sin(midRad);

  // If there's a photo, render a circular image instead of emoji
  if (photo && photo.startsWith("data:")) {
    const imgSize = isCurrent ? 24 : 18;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-label", label || "");

    // Circular clip path with unique ID
    const clipId = "clip-" + Math.random().toString(36).substr(2, 6);
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipId);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", imgSize / 2);
    clipPath.appendChild(circle);
    defs.appendChild(clipPath);
    group.appendChild(defs);

    // White circle background (border effect)
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", x);
    bg.setAttribute("cy", y);
    bg.setAttribute("r", imgSize / 2 + 1);
    bg.setAttribute("fill", "#fff");
    group.appendChild(bg);

    // The image
    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("x", x - imgSize / 2);
    img.setAttribute("y", y - imgSize / 2);
    img.setAttribute("width", imgSize);
    img.setAttribute("height", imgSize);
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", photo);
    img.setAttribute("clip-path", "url(#" + clipId + ")");
    group.appendChild(img);

    if (isCurrent) group.setAttribute("class", "current-icon");
    return group;
  }

  // Default: emoji text
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("font-size", isCurrent ? "16" : "13");
  text.setAttribute("class", isCurrent ? "current-icon" : "");
  text.setAttribute("data-label", label || "");
  text.textContent = iconChar;
  return text;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function getCurrentActivity(tasks, currentMinutes) {
  for (let i = 0; i < tasks.length; i++) {
    const startMin = timeToMinutes(tasks[i].start);
    const endMin = timeToMinutes(tasks[i].end);
    if (endMin < startMin) {
      if (currentMinutes >= startMin || currentMinutes < endMin) return i;
    } else {
      if (currentMinutes >= startMin && currentMinutes < endMin) return i;
    }
  }
  return -1;
}

// ---------- FOCUS MODE HELPERS ----------

function getFocusAngle(minuteOffset) {
  return (minuteOffset / 60) * 360;
}

function createFocusSector(startMin, endMin, color, isCurrent) {
  const startAngle = getFocusAngle(startMin);
  const endAngle = getFocusAngle(endMin);
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;
  const r = 98, cx = 100, cy = 100;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  let diff = endAngle - startAngle;
  if (diff <= 0) diff += 360;

  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${diff > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", color);
  path.setAttribute("opacity", isCurrent ? "0.92" : "0.55");
  path.setAttribute("class", isCurrent ? "current-activity" : "");
  return path;
}

function createFocusIcon(startMin, endMin, iconChar, isCurrent, label, photo) {
  if (!iconChar && !photo) return null;

  let diff = endMin - startMin;
  if (diff <= 0) diff += 60;
  const midMin = startMin + diff / 2;
  const midAngle = getFocusAngle(midMin);
  const midRad = ((midAngle - 90) * Math.PI) / 180;

  const r = isCurrent ? 68 : 82;
  const cx = 100, cy = 100;
  const x = cx + r * Math.cos(midRad);
  const y = cy + r * Math.sin(midRad);

  // If there's a photo, render circular image
  if (photo && photo.startsWith("data:")) {
    const imgSize = isCurrent ? 24 : 18;
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("data-label", label || "");

    const clipId = "fclip-" + Math.random().toString(36).substr(2, 6);
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("id", clipId);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", x);
    circle.setAttribute("cy", y);
    circle.setAttribute("r", imgSize / 2);
    clipPath.appendChild(circle);
    defs.appendChild(clipPath);
    group.appendChild(defs);

    const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    bg.setAttribute("cx", x);
    bg.setAttribute("cy", y);
    bg.setAttribute("r", imgSize / 2 + 1);
    bg.setAttribute("fill", "#fff");
    group.appendChild(bg);

    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
    img.setAttribute("x", x - imgSize / 2);
    img.setAttribute("y", y - imgSize / 2);
    img.setAttribute("width", imgSize);
    img.setAttribute("height", imgSize);
    img.setAttributeNS("http://www.w3.org/1999/xlink", "href", photo);
    img.setAttribute("clip-path", "url(#" + clipId + ")");
    group.appendChild(img);

    if (isCurrent) group.setAttribute("class", "current-icon");
    return group;
  }

  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("x", x);
  text.setAttribute("y", y);
  text.setAttribute("text-anchor", "middle");
  text.setAttribute("dominant-baseline", "central");
  text.setAttribute("font-size", isCurrent ? "16" : "13");
  text.setAttribute("class", isCurrent ? "current-icon" : "");
  text.setAttribute("data-label", label || "");
  text.textContent = iconChar;
  return text;
}

function getCurrentFocusActivity(tasks, minutesIntoSession) {
  for (let i = 0; i < tasks.length; i++) {
    if (minutesIntoSession >= tasks[i].start && minutesIntoSession < tasks[i].end) return i;
  }
  return -1;
}

function drawFocusSectors(tasks, currentIdx) {
  sectorsGroup.innerHTML = "";
  tasks.forEach((task, idx) => {
    const isCurrent = idx === currentIdx;
    sectorsGroup.appendChild(createFocusSector(task.start, task.end, task.color, isCurrent));
    const icon = createFocusIcon(task.start, task.end, task.icon, isCurrent, task.label, task.photo);
    if (icon) sectorsGroup.appendChild(icon);
  });
}

// ---------- TAP-AND-HOLD TOOLTIP ----------

// ---------- FOCUS MODE UPDATE ----------

function updateFocusClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const [startH, startM] = focusScheduleData.startTime.split(":").map(Number);
  const sessionStartMinutes = startH * 60 + startM;
  const currentMinutes = h * 60 + m;
  const minutesIntoSession = currentMinutes - sessionStartMinutes;

  const tasks = focusScheduleData.tasks;

  if (!focusSessionActive) {
    drawFocusSectors(tasks, -1);
    document.getElementById("hour-hand").style.display = "none";
    document.getElementById("minute-hand").style.display = "none";
    document.getElementById("second-hand").style.display = "none";

    if (activityLabel) {
      activityLabel.innerHTML =
        '<div class="now-label">Session not started</div>' +
        '<div class="next-label">Tap Start when ready</div>';
    }
    return;
  }

  // Session over
  if (minutesIntoSession >= 60) {
    focusSessionActive = false;
    if (activityLabel) {
      activityLabel.innerHTML =
        '<div class="now-label">Session complete!</div>' +
        '<div class="next-label">Great job!</div>';
    }
    speak("Session complete! Great job!");

    const btn = document.getElementById("focus-start-stop");
    if (btn) {
      btn.textContent = "Start Session";
      btn.className = "btn btn-start";
    }
    const status = document.getElementById("focus-status");
    if (status) status.textContent = "Session finished. Tap Start for a new one.";
    return;
  }

  // Before start time
  if (minutesIntoSession < 0) {
    drawFocusSectors(tasks, -1);
    document.getElementById("hour-hand").style.display = "none";
    document.getElementById("minute-hand").style.display = "none";
    document.getElementById("second-hand").style.display = "none";

    if (activityLabel) {
      activityLabel.innerHTML =
        '<div class="now-label">Waiting to start...</div>' +
        '<div class="next-label">Session begins at ' + focusScheduleData.startTime + '</div>';
    }
    return;
  }

  // In session
  const exactMinutes = minutesIntoSession + (s / 60);
  const currentIdx = getCurrentFocusActivity(tasks, minutesIntoSession);

  if (currentIdx !== focusCurrentIdx) {
    if (currentIdx >= 0 && currentIdx < tasks.length) {
      speak("It's time for " + tasks[currentIdx].label + ".");
    }
    focusCurrentIdx = currentIdx;
    focusTransitionWarningShown = false;
    drawFocusSectors(tasks, currentIdx);
  }

  // Transition warning (2 min before end)
  if (currentIdx >= 0 && currentIdx < tasks.length) {
    const minutesLeft = tasks[currentIdx].end - minutesIntoSession;
    if (minutesLeft <= 2 && minutesLeft > 0 && !focusTransitionWarningShown) {
      focusTransitionWarningShown = true;
      document.body.classList.add("transition-warning");
      setTimeout(() => document.body.classList.remove("transition-warning"), 3000);
      speak(tasks[currentIdx].label + " is ending soon.");
    }
  }

  // Move focus hand (hour hand repurposed as minute hand for the hour)
  const handDeg = (exactMinutes / 60) * 360;
  document.getElementById("hour-hand").style.display = "";
  document.getElementById("hour-hand").setAttribute("transform", "rotate(" + handDeg + ", 100, 100)");
  document.getElementById("minute-hand").style.display = "none";
  document.getElementById("second-hand").style.display = "none";

  // Labels
  if (activityLabel && currentIdx >= 0 && currentIdx < tasks.length) {
    const nextIdx = (currentIdx + 1) % tasks.length;
    const remaining = Math.ceil(tasks[currentIdx].end - exactMinutes);
    activityLabel.innerHTML =
      '<div class="now-label">Now: ' + tasks[currentIdx].label + ' (' + remaining + ' min left)</div>' +
      '<div class="next-label">Next: ' + (tasks[nextIdx] ? tasks[nextIdx].label : "Done!") + '</div>';
  } else if (activityLabel) {
    activityLabel.innerHTML =
      '<div class="now-label">Focus Session</div>' +
      '<div class="next-label">' + Math.ceil(60 - exactMinutes) + ' minutes remaining</div>';
  }
}

// ---------- 12-HOUR UPDATE ----------

function update12HourClock() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const day = now.getDay();

  const currentMinutes = h * 60 + m;
  const newMode = h >= 7 && h < 19 ? "day" : "night";
  const isWeekend = day === 0 || day === 6;

  if (newMode !== currentMode) {
    const isFirstLoad = currentMode === "";
    currentMode = newMode;
    document.body.className = newMode + "-mode";

    if (!isFirstLoad) {
      speak(newMode === "day" ? "Good morning! Day mode starting." : "Good evening! Night mode starting.");
    }

    const schedType = isWeekend ? "weekend" : "mon_fri";
    const tasks = scheduleData[schedType][newMode];
    sectorsGroup.innerHTML = "";

    const currentIdx = getCurrentActivity(tasks, currentMinutes);
    currentActivityIndex = currentIdx;

    tasks.forEach((task, idx) => {
      let startDeg = getAngles(task.start);
      let endDeg = getAngles(task.end);
      if (endDeg <= startDeg) endDeg += 360;

      const isCurrent = idx === currentIdx;
      sectorsGroup.appendChild(createSector(startDeg, endDeg, task.color, isCurrent));
      const icon = createIcon(startDeg, endDeg, task.icon, isCurrent, task.label, task.photo);
      if (icon) sectorsGroup.appendChild(icon);
    });
  }

  const schedType = isWeekend ? "weekend" : "mon_fri";
  const tasks = scheduleData[schedType][currentMode];
  const currentIdx = getCurrentActivity(tasks, currentMinutes);

  if (currentIdx !== currentActivityIndex) {
    if (currentIdx >= 0 && currentIdx < tasks.length) {
      speak("It's time for " + tasks[currentIdx].label + ".");
    }

    currentActivityIndex = currentIdx;
    transitionWarningShown = false;
    sectorsGroup.innerHTML = "";

    tasks.forEach((task, idx) => {
      let startDeg = getAngles(task.start);
      let endDeg = getAngles(task.end);
      if (endDeg <= startDeg) endDeg += 360;

      const isCurrent = idx === currentIdx;
      sectorsGroup.appendChild(createSector(startDeg, endDeg, task.color, isCurrent));
      const icon = createIcon(startDeg, endDeg, task.icon, isCurrent, task.label, task.photo);
      if (icon) sectorsGroup.appendChild(icon);
    });
  }

  // Transition warning (5 min)
  if (currentIdx >= 0 && currentIdx < tasks.length) {
    const currentTask = tasks[currentIdx];
    let endMin = timeToMinutes(currentTask.end);
    if (endMin < timeToMinutes(currentTask.start)) endMin += 1440;
    let currentMin = currentMinutes;
    if (currentMin < timeToMinutes(currentTask.start)) currentMin += 1440;

    const minutesLeft = endMin - currentMin;
    if (minutesLeft <= 5 && minutesLeft > 0 && !transitionWarningShown) {
      transitionWarningShown = true;
      document.body.classList.add("transition-warning");
      setTimeout(() => document.body.classList.remove("transition-warning"), 3000);
      speak(currentTask.label + " is ending soon.");
    }
  }

  // Move hands
  const sDeg = s * 6;
  const mDeg = m * 6 + s * 0.1;
  const hDeg = (h % 12) * 30 + m * 0.5;

  document.getElementById("second-hand").setAttribute("transform", "rotate(" + sDeg + ", 100, 100)");
  document.getElementById("minute-hand").setAttribute("transform", "rotate(" + mDeg + ", 100, 100)");
  document.getElementById("hour-hand").setAttribute("transform", "rotate(" + hDeg + ", 100, 100)");

  // Labels
  if (activityLabel && currentIdx >= 0) {
    const nextIdx = (currentIdx + 1) % tasks.length;
    activityLabel.innerHTML =
      '<div class="now-label">Now: ' + tasks[currentIdx].label +
      '</div><div class="next-label">Next: ' + tasks[nextIdx].label + '</div>';
  } else if (activityLabel) {
    activityLabel.innerText = currentMode === "day" ? "Day Time" : "Night Time";
  }
}

// ---------- MAIN LOOP ----------

function updateClock() {
  if (clockMode === "1hr") {
    updateFocusClock();
  } else {
    update12HourClock();
  }
}

setInterval(updateClock, 1000);
updateClock();

// ---------- MODE TOGGLE + FOCUS CONTROLS ----------

document.addEventListener("DOMContentLoaded", () => {
  const btn12 = document.getElementById("mode-12hr");
  const btn1hr = document.getElementById("mode-1hr");
  const focusControls = document.getElementById("focus-controls");
  const focusBtn = document.getElementById("focus-start-stop");
  const focusStatus = document.getElementById("focus-status");

  function switchToMode(mode) {
    clockMode = mode;

    if (mode === "12hr") {
      currentMode = "";
      currentActivityIndex = -1;

      document.getElementById("hour-hand").style.display = "";
      document.getElementById("minute-hand").style.display = "";
      document.getElementById("second-hand").style.display = "";

      focusSessionActive = false;
      focusCurrentIdx = -1;

      btn12.classList.add("mode-btn-active");
      btn1hr.classList.remove("mode-btn-active");

      if (focusControls) focusControls.style.display = "none";

      if (focusBtn) {
        focusBtn.textContent = "Start Session";
        focusBtn.className = "btn btn-start";
      }
    } else {
      btn1hr.classList.add("mode-btn-active");
      btn12.classList.remove("mode-btn-active");

      if (focusControls) focusControls.style.display = "block";

      focusCurrentIdx = -1;
      focusSessionActive = false;
      document.body.className = "day-mode";

      // Reload focus schedule in case it changed
      try {
        const rawFocus = localStorage.getItem("routineClockFocusSchedule");
        if (rawFocus) focusScheduleData = JSON.parse(rawFocus);
      } catch (e) {
        console.error("Error reloading focus schedule:", e);
      }

      if (focusStatus) {
        focusStatus.textContent = "Session: " + focusScheduleData.startTime + " for 1 hour. Tap Start when ready.";
      }
    }

    updateClock();
  }

  if (btn12) btn12.addEventListener("click", () => switchToMode("12hr"));
  if (btn1hr) btn1hr.addEventListener("click", () => switchToMode("1hr"));

  if (focusBtn) {
    focusBtn.addEventListener("click", () => {
      if (!focusSessionActive) {
        focusSessionActive = true;
        focusCurrentIdx = -1;
        focusTransitionWarningShown = false;
        focusBtn.textContent = "Stop Session";
        focusBtn.className = "btn btn-stop";
        if (focusStatus) focusStatus.textContent = "Session in progress...";
      } else {
        focusSessionActive = false;
        focusCurrentIdx = -1;
        focusBtn.textContent = "Start Session";
        focusBtn.className = "btn btn-start";
        if (focusStatus) focusStatus.textContent = "Session stopped.";
      }
      updateClock();
    });
  }
});


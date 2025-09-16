const centerTitle = document.getElementById("center-title");
const mainContainer = document.getElementById("main-container");
const output = document.getElementById("output");
const input = document.getElementById("input");
const dock = document.getElementById("dock");
const terminal = document.getElementById("terminal");

const btnRed = document.getElementById("btn-red");
const btnYellow = document.getElementById("btn-yellow");
const btnGreen = document.getElementById("btn-green");

let isTyping = false;
let commandHistory = [];
let historyIndex = -1;
let commands = {};

const SHEET_URL_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRcSCmvsWDsBZaTqjzDRSqiN1WQlB9gxXMbGST1Bv3UkpkIPPBSo6Ukg5oGKuLjixPbS__KXYpOZeiw/pub?output=csv";

const introText = "Hello, I’m Aman!";
let i = 0;

function typeIntro() {
  if (i < introText.length) {
    centerTitle.innerHTML += introText.charAt(i);
    i++;
    setTimeout(typeIntro, 100);
  } else {
    centerTitle.style.borderRight = "none";
    setTimeout(() => {
      centerTitle.classList.add("slide-up");
      showMain();
    }, 500);
  }
}

function showMain() {
  mainContainer.style.opacity = 1;
  mainContainer.style.transform = "translateY(0)";
  showWelcome();
}

function showWelcome() {
  output.innerHTML = `Type <span style="color:#ff66cc;">help</span> to see available commands.<br><br>`; // single line break
  input.focus();
}

// Click focus on input
document.addEventListener("click", (e) => {
  if (e.target === input) {
    input.focus();
  }
});

function typeText(text, callback) {
  let idx = 0;
  isTyping = true;
  const interval = setInterval(() => {
    output.innerHTML += text[idx] === "\n" ? "<br>" : text[idx];
    idx++;
    if (idx >= text.length) {
      clearInterval(interval);
      isTyping = false;
      input.focus();
      if (callback) callback();
    }
    output.scrollTop = output.scrollHeight;
  }, 20);
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let char of line) {
    if (char === '"' && !inQuotes) inQuotes = true;
    else if (char === '"' && inQuotes) inQuotes = false;
    else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else current += char;
  }
  result.push(current.trim());
  return result;
}

async function loadCommands() {
  try {
    const url = `${SHEET_URL_BASE}&t=${new Date().getTime()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Cannot fetch sheet");
    const csvText = await res.text();
    const lines = csvText.trim().split("\n");
    commands = {};
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const cmd = values[0]?.toLowerCase();
      const resp = values.slice(1).join("\n");
      if (cmd) commands[cmd] = resp.replace(/\\n/g, "\n");
    }
    commands["help"] = `Available commands: ${Object.keys(commands).join(", ")}, clear, reload`;
    commands["reload"] = "Reloading terminal and fetching latest data...";
  } catch (err) {
    console.error("Error loading commands:", err);
    commands = { help: "Available commands: clear, reload", clear: "", reload: "Reloading..." };
  }
}

input.addEventListener("keydown", async function (e) {
  if (isTyping) return;
  if (e.key === "Enter") {
    const raw = input.value.trim();
    if (!raw) return;
    const cmd = raw.toLowerCase();
    output.innerHTML += `> ${raw}<br>`;

    // Add to history only if not already present
    if (!commandHistory.includes(raw)) {
      commandHistory.push(raw);
    }
    historyIndex = commandHistory.length;
    input.value = "";

    if (cmd === "clear") { showWelcome(); return; }
    if (cmd === "reload") { location.reload(); return; }

    if (commands.hasOwnProperty(cmd)) {
      let text = commands[cmd].trim(); // remove extra trailing newlines
      typeText(text + "\n\n"); // append a single line break after every command
    } else {
      typeText("Unknown command. Type 'help' for options.\n");
    }
  }

  if (e.key === "ArrowUp") {
    if (!commandHistory.length) return;
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = commandHistory[historyIndex];
    e.preventDefault();
  }

  if (e.key === "ArrowDown") {
    if (!commandHistory.length) return;
    historyIndex = Math.min(commandHistory.length, historyIndex + 1);
    input.value = historyIndex === commandHistory.length ? "" : commandHistory[historyIndex];
    e.preventDefault();
  }
});

input.addEventListener("focus", () => {
  input.scrollIntoView({ behavior: "smooth", block: "center" });
});

// Window buttons
btnRed.onclick = () => location.reload();

btnYellow.onclick = () => {
  terminal.classList.add("minimized");
  centerTitle.classList.remove("slide-up");
  centerTitle.classList.add("to-center");

  setTimeout(() => {
    terminal.style.display = "none";
    dock.style.display = "flex";
    dock.classList.add("bounce");
    setTimeout(() => dock.classList.remove("bounce"), 600);
  }, 600);
};

dock.onclick = () => {
  terminal.style.display = "flex";
  dock.style.display = "none";

  terminal.classList.add("restoring");
  void terminal.offsetWidth;
  terminal.classList.remove("restoring", "minimized");
  centerTitle.classList.add("slide-up");
  centerTitle.classList.remove("to-center");
};

btnGreen.onclick = () => {
  if (!terminal.classList.contains("fullscreen")) {
    terminal.classList.add("fullscreen");
    centerTitle.classList.add("fade-out");
  } else {
    terminal.classList.remove("fullscreen");
    centerTitle.classList.remove("fade-out");
  }
};

window.onload = async () => {
  await loadCommands();
  typeIntro();
};

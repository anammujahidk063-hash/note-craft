"use strict";

// Browser-only prototype. A production app must authorize every admin action
// on the Python server and store shared note records in MySQL.
const $ = (id) => document.getElementById(id);
let db;
let notes = [];
let page = "dashboard";
let statusFilter = "all";
let selectedNote = null;
const labels = { dashboard: "Dashboard", upload: "Upload notes", review: "Review notes", manage: "Manage notes" };

function message(text) {
  $("message").textContent = text;
  $("message").hidden = false;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("notecraft_admin_demo_v1", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("notes", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => message("Close other NoteCraft tabs and reload to open storage.");
  });
}

function readNotes() {
  return new Promise((resolve, reject) => {
    const request = db.transaction("notes").objectStore("notes").getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.created - a.created));
    request.onerror = () => reject(request.error);
  });
}

function writeNote(note, remove = false) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("notes", "readwrite");
    const store = transaction.objectStore("notes");
    if (remove) store.delete(note.id); else store.put(note);
    transaction.oncomplete = resolve;
    transaction.onabort = () => reject(transaction.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function fillSemesters() {
  const first = Number($("year").value) * 2 - 1;
  $("semester").replaceChildren(...[first, first + 1].map((n) => new Option(`Semester ${n}`, String(n))));
}

function navigate() {
  page = location.hash.slice(1);
  if (!Object.hasOwn(labels, page)) page = "dashboard";
  $("breadcrumb").textContent = labels[page];
  $("dashboard").hidden = page !== "dashboard";
  $("upload").hidden = page !== "upload";
  $("listing").hidden = !["review", "manage"].includes(page);
  document.querySelectorAll("nav a").forEach((link) => {
    const active = link.hash === `#${page}`;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page"); else link.removeAttribute("aria-current");
  });
  statusFilter = page === "review" ? "pending" : "all";
  $("listTitle").textContent = page === "review" ? "Review study notes" : "Manage shared notes";
  $("listSubtitle").textContent = page === "review" ? "Check pending material, then approve or reject it." : "Organize material and review its status.";
  render();
}

function empty(container, title = "No notes found", subtitle = "Try another filter or upload your first note.") {
  const box = element("div", undefined, "empty");
  box.append(element("span", "▤"), element("h2", title), element("p", subtitle));
  container.append(box);
}

function card(note) {
  const article = element("article", undefined, "card");
  article.append(element("span", note.status, `status ${note.status}`), element("h3", note.title));
  article.append(element("p", `${note.subject} · Year ${note.year} · Semester ${note.semester}${note.unit ? ` · ${note.unit}` : ""}`));
  article.append(element("p", note.content.slice(0, 140) + (note.content.length > 140 ? "…" : "")));
  const actions = element("div", undefined, "actions");
  function button(text, action) {
    const btn = element("button", text, "secondary");
    btn.type = "button";
    btn.addEventListener("click", action);
    actions.append(btn);
  }
  button("View", () => viewNote(note));
  if (note.status !== "approved") button("Approve", () => changeStatus(note, "approved"));
  if (note.status !== "rejected") button("Reject", () => changeStatus(note, "rejected"));
  button("Delete", async () => {
    if (!confirm(`Delete “${note.title}” and its attachment?`)) return;
    try {
      await writeNote(note, true);
      await refresh();
      message("Note deleted.");
    } catch { message("Could not delete the note. Please retry."); }
  });
  article.append(actions);
  return article;
}

async function changeStatus(note, status) {
  try {
    await writeNote({ ...note, status });
    await refresh();
    message(`Note ${status}. This change is saved in this browser only.`);
  } catch { message("Could not save the status. Please retry."); }
}

function viewNote(note) {
  selectedNote = note;
  $("detailTitle").textContent = note.title;
  $("detailMeta").textContent = `${note.subject} · Year ${note.year} · Semester ${note.semester} · ${note.status}`;
  $("detailContent").textContent = note.content;
  $("download").hidden = !note.attachment;
  $("download").textContent = note.attachment ? `Download ${note.attachment.name}` : "Download attachment";
  $("detail").showModal();
}

function render() {
  $("stats").replaceChildren();
  for (const [label, status] of [["Total notes", "all"], ["Pending review", "pending"], ["Approved", "approved"], ["Rejected", "rejected"]]) {
    const box = element("div", undefined, "stat");
    box.append(element("span", label), element("strong", String(notes.filter((n) => status === "all" || n.status === status).length)));
    $("stats").append(box);
  }
  $("recent").replaceChildren(...notes.slice(0, 3).map(card));
  if (!notes.length) empty($("recent"), "Your workspace is ready", "Upload your first study resource to get started.");
  $("tabs").replaceChildren();
  for (const status of ["all", "pending", "approved", "rejected"]) {
    const count = notes.filter((n) => status === "all" || n.status === status).length;
    const btn = element("button", `${status === "all" ? "All notes" : status[0].toUpperCase() + status.slice(1)} (${count})`, statusFilter === status ? "active" : "");
    btn.setAttribute("aria-pressed", String(statusFilter === status));
    btn.addEventListener("click", () => { statusFilter = status; render(); });
    $("tabs").append(btn);
  }
  const subject = $("filterSubject").value;
  $("filterSubject").replaceChildren(new Option("All subjects", ""), ...[...new Set(notes.map((n) => n.subject))].sort().map((s) => new Option(s, s)));
  if ([...$("filterSubject").options].some((o) => o.value === subject)) $("filterSubject").value = subject;
  const query = $("search").value.trim().toLowerCase();
  const result = notes.filter((n) => (statusFilter === "all" || n.status === statusFilter)
    && (!$("filterYear").value || n.year === $("filterYear").value)
    && (!$("filterSemester").value || n.semester === $("filterSemester").value)
    && (!$("filterSubject").value || n.subject === $("filterSubject").value)
    && `${n.title} ${n.subject} ${n.unit} ${n.content}`.toLowerCase().includes(query));
  $("resultCount").textContent = `${result.length} note${result.length === 1 ? "" : "s"}`;
  $("notes").replaceChildren(...result.map(card));
  if (!result.length) empty($("notes"));
}

async function refresh() { notes = await readNotes(); render(); }

$("noteForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!db) { message("Browser storage is unavailable. Notes cannot be saved."); return; }
  const form = event.currentTarget;
  const values = new FormData(form);
  const attachment = values.get("attachment");
  const allowed = /\.(pdf|txt|png|jpe?g|docx|pptx)$/i;
  if (attachment.size && (!allowed.test(attachment.name) || attachment.size > 10 * 1024 * 1024)) {
    message("Choose a supported attachment up to 10 MB."); return;
  }
  const note = { id: crypto.randomUUID(), created: Date.now(), status: "pending" };
  for (const key of ["title", "subject", "unit", "year", "semester", "content"]) note[key] = String(values.get(key)).trim();
  if (!note.title || !note.subject || !note.content) { message("Enter a title, subject and note content."); return; }
  note.attachment = attachment.size ? attachment : null;
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  try {
    await writeNote(note);
    form.reset();
    fillSemesters();
    await refresh();
    location.hash = "review";
    message("Note saved and ready for review.");
  } catch { message("Could not save the note. Browser storage may be full or unavailable."); }
  finally { submit.disabled = false; }
});

$("year").addEventListener("change", fillSemesters);
$("noteForm").addEventListener("reset", () => setTimeout(fillSemesters, 0));
$("closeDetail").addEventListener("click", () => $("detail").close());
$("download").addEventListener("click", () => {
  if (!selectedNote?.attachment) return;
  const url = URL.createObjectURL(selectedNote.attachment);
  const link = document.createElement("a");
  link.href = url;
  link.download = selectedNote.attachment.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (const id of ["search", "filterYear", "filterSemester", "filterSubject"]) $(id).addEventListener("input", render);
$("resetFilters").addEventListener("click", () => {
  for (const id of ["search", "filterYear", "filterSemester", "filterSubject"]) $(id).value = "";
  statusFilter = page === "review" ? "pending" : "all";
  render();
});
for (let n = 1; n <= 8; n++) {
  $("filterSemester").add(new Option(`Semester ${n}`, String(n)));
}
window.addEventListener("hashchange", navigate);
fillSemesters();
navigate();
openDatabase().then(async (database) => { db = database; await refresh(); }).catch(() => message("Browser storage could not open. Use a normal browser window with Live Server; saving is currently unavailable."));
// Check the existing browser-based Admin login.
function checkAdminSession() {
  if (
    sessionStorage.getItem("notecraftAdminLoggedIn") !== "true"
  ) {
    window.location.replace("admin-login.html");
  }
}

checkAdminSession();

// Recheck when returning with the browser Back button.
window.addEventListener("pageshow", checkAdminSession);

// Log out without deleting saved notes.

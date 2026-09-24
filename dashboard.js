"use strict";

// Same key as your original dashboard, preserving existing notes.
const STORAGE = "notecraft_notes_v1";

const $ = (id) => document.getElementById(id);

const pageNames = {
  dashboard: "Dashboard",
  subjects: "Class & subjects",
  approved: "Approved notes",
  personal: "My notes"
};

let notes = [];
let editingId = null;
let storageReady = true;

function showStatus(message) {
  $("status").textContent = message;
  $("status").hidden = false;
}

try {
  const stored = JSON.parse(localStorage.getItem(STORAGE) || "[]");

  if (
    !Array.isArray(stored) ||
    !stored.every((note) =>
      note &&
      typeof note === "object" &&
      typeof note.id === "string" &&
      typeof note.title === "string" &&
      typeof note.content === "string"
    )
  ) {
    throw new Error("Invalid saved notes");
  }

  notes = stored;
} catch (error) {
  storageReady = false;
  showStatus(
    "Saved notes could not be read. Saving is disabled to avoid overwriting them."
  );
}

function saveNotes(nextNotes) {
  if (!storageReady) {
    return false;
  }

  try {
    localStorage.setItem(STORAGE, JSON.stringify(nextNotes));
    notes = nextNotes;
    return true;
  } catch (error) {
    showStatus(
      "Your changes could not be saved. Browser storage may be full or unavailable."
    );
    return false;
  }
}

function navigate(page) {
  const nextPage = Object.hasOwn(pageNames, page) ? page : "dashboard";

  if (location.hash === `#${nextPage}`) {
    showPage(nextPage);
  } else {
    location.hash = nextPage;
  }
}

function showPage(page) {
  const selected = Object.hasOwn(pageNames, page) ? page : "dashboard";

  Object.keys(pageNames).forEach((name) => {
    $(`${name}Page`).hidden = name !== selected;
  });

  document.querySelectorAll("nav [data-page]").forEach((button) => {
    const active = button.dataset.page === selected;
    button.classList.toggle("active", active);

    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  $("breadcrumb").textContent = pageNames[selected];

  if (selected === "personal" || selected === "dashboard") {
    renderNotes();
  }
}

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    navigate(button.dataset.page);
  });
});

window.addEventListener("hashchange", () => {
  showPage(location.hash.slice(1));
});

const yearLabels = ["First year", "Second year", "Third year", "Fourth year"];

function createYearCards(containerId) {
  const container = $(containerId);

  yearLabels.forEach((label, index) => {
    const year = index + 1;
    const button = document.createElement("button");
    button.className = "year-card";
    button.type = "button";
    button.dataset.year = String(year);

    const number = document.createElement("span");
    number.textContent = `YEAR 0${year}`;

    const title = document.createElement("strong");
    title.textContent = label;

    const hint = document.createElement("small");
    hint.textContent = "Choose semester →";

    button.append(number, title, hint);

    button.addEventListener("click", () => {
      navigate("subjects");
      selectYear(year);
    });

    container.appendChild(button);
  });
}

function selectYear(year) {
  $("semesterPanel").hidden = false;
  $("subjectEmpty").hidden = true;
  $("semesterTitle").textContent = `${yearLabels[year - 1]} — choose semester`;

  document.querySelectorAll("#subjectYears .year-card").forEach((button) => {
    const selected = Number(button.dataset.year) === year;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  $("semesterGrid").replaceChildren();

  [year * 2 - 1, year * 2].forEach((semester) => {
    const button = document.createElement("button");
    button.className = "secondary-btn";
    button.type = "button";
    button.textContent = `Semester ${semester}`;

    button.addEventListener("click", () => {
      $("subjectEmpty").hidden = false;
      $("subjectHeading").textContent =
        `Semester ${semester}: no subjects available`;
    });

    $("semesterGrid").appendChild(button);
  });
}

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function updateWordCount() {
  $("wordCount").textContent =
    `${wordCount($("noteContent").value)} words`;
}

function openEditor(note = null) {
  editingId = note ? note.id : null;
  $("editorTitle").textContent = note ? "Edit note" : "Create note";
  $("noteTitle").value = note ? note.title : "";
  $("noteContent").value = note ? note.content : "";
  $("editorError").hidden = true;
  updateWordCount();
  $("editorDialog").showModal();
  $("noteTitle").focus();
}

document.querySelectorAll("[data-create]").forEach((button) => {
  button.addEventListener("click", () => openEditor());
});

$("closeEditor").addEventListener("click", () => {
  $("editorDialog").close();
});

$("cancelEditor").addEventListener("click", () => {
  $("editorDialog").close();
});

$("editorDialog").addEventListener("close", () => {
  editingId = null;
});

$("noteContent").addEventListener("input", updateWordCount);

$("noteForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const title = $("noteTitle").value.trim();
  const content = $("noteContent").value.trim();

  if (!title) {
    $("editorError").textContent = "Enter a title for your note.";
    $("editorError").hidden = false;
    $("noteTitle").focus();
    return;
  }

  const now = Date.now();
  let nextNotes;

  if (editingId !== null) {
    nextNotes = notes.map((note) =>
      note.id === editingId
        ? { ...note, title, content, updated: now }
        : note
    );
  } else {
    const id = typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${now}-${Math.random().toString(36).slice(2)}`;

    nextNotes = [
      ...notes,
      {
        id,
        title,
        content,
        created: now,
        updated: now,
        favorite: false,
        deleted: false
      }
    ];
  }

  if (!saveNotes(nextNotes)) {
    $("editorError").textContent =
      "The note was not saved. Check browser storage and try again.";
    $("editorError").hidden = false;
    return;
  }

  $("editorDialog").close();
  renderNotes();
  navigate("personal");
});

function noteTimestamp(note) {
  return Number(note.updated) || Number(note.created) || 0;
}

function renderNotes() {
  const activeNotes = notes.filter((note) => !note.deleted);
  $("personalCount").textContent = activeNotes.length;

  const query = $("searchInput").value.trim().toLowerCase();
  const newestFirst = $("sortSelect").value === "newest";

  const visibleNotes = activeNotes
    .filter((note) =>
      `${note.title} ${note.content}`.toLowerCase().includes(query)
    )
    .sort((a, b) =>
      newestFirst
        ? noteTimestamp(b) - noteTimestamp(a)
        : noteTimestamp(a) - noteTimestamp(b)
    );

  $("notesGrid").replaceChildren();
  $("notesEmpty").hidden = visibleNotes.length > 0;
  $("emptyTitle").textContent = query
    ? "No matching notes"
    : "No personal notes yet";

  visibleNotes.forEach((note) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.style.cursor = "pointer";
card.tabIndex = 0;
card.setAttribute("aria-label", `Open note: ${note.title}`);

card.addEventListener("click", (event) => {
  // Edit aur Delete apna existing kaam karenge.
  if (event.target.closest("button")) return;

  openNote(note);
});

card.addEventListener("keydown", (event) => {
  if (event.target !== card) return;

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openNote(note);
  }
});

    const title = document.createElement("h3");
    title.textContent = note.title || "Untitled";

    const content = document.createElement("p");
    content.textContent = note.content || "No content";

    const metadata = document.createElement("small");
    const timestamp = noteTimestamp(note);
    const date = timestamp
      ? new Date(timestamp).toLocaleDateString(undefined, {
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      : "Date unavailable";

    metadata.textContent = `${date} · ${wordCount(note.content)} words`;

    const actions = document.createElement("div");
    actions.className = "note-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openEditor(note));

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-btn";
    remove.textContent = "Delete";

    remove.addEventListener("click", () => {
      if (!confirm(`Delete "${note.title}"?`)) {
        return;
      }

      // Preserve the old dashboard's soft-delete format.
      const nextNotes = notes.map((item) =>
        item.id === note.id
          ? { ...item, deleted: true, updated: Date.now() }
          : item
      );

      if (saveNotes(nextNotes)) {
        renderNotes();
      }
    });

    actions.append(edit, remove);
    card.append(title, content, metadata, actions);
    $("notesGrid").appendChild(card);
  });
}

$("searchInput").addEventListener("input", renderNotes);
$("sortSelect").addEventListener("change", renderNotes);


// Full note dashboard mein directly dikhane ke liye.
pageNames.noteView = "View note";

const noteViewPage = document.createElement("section");
noteViewPage.id = "noteViewPage";
noteViewPage.hidden = true;
noteViewPage.style.padding = "24px";
noteViewPage.style.minWidth = "0";

const backToNotes = document.createElement("button");
backToNotes.type = "button";
backToNotes.className = "secondary-btn";
backToNotes.textContent = "← Back to My notes";
backToNotes.addEventListener("click", () => {
  navigate("personal");
});

const fullNoteTitle = document.createElement("h1");
fullNoteTitle.tabIndex = -1;
fullNoteTitle.style.margin = "24px 0";
fullNoteTitle.style.overflowWrap = "anywhere";

const fullNoteContent = document.createElement("div");
fullNoteContent.style.whiteSpace = "pre-wrap";
fullNoteContent.style.overflowWrap = "anywhere";
fullNoteContent.style.lineHeight = "1.8";
fullNoteContent.style.fontSize = "18px";

noteViewPage.append(
  backToNotes,
  fullNoteTitle,
  fullNoteContent
);

$("personalPage").insertAdjacentElement("afterend", noteViewPage);

function openNote(note) {
  fullNoteTitle.textContent = note.title || "Untitled";
  fullNoteContent.textContent = note.content || "No content";

  navigate("noteView");

  // Note khulne ke baad heading par focus.
  requestAnimationFrame(() => {
    if (!noteViewPage.hidden) {
      fullNoteTitle.focus();
    }
  });
}
createYearCards("dashboardYears");
createYearCards("subjectYears");
showPage(location.hash.slice(1));
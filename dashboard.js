const STORAGE="notecraft_notes_v1";
let notes=JSON.parse(localStorage.getItem(STORAGE)||"[]");
let currentView="all", editingId=null, newestFirst=true;

const $=id=>document.getElementById(id);
const grid=$("notesGrid"), empty=$("emptyState"), modal=$("editorModal");

function saveData(){localStorage.setItem(STORAGE,JSON.stringify(notes));}
function wordCount(text){return text.trim()?text.trim().split(/\s+/).length:0}
function formatDate(ts){return new Date(ts).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}

function render(){
  const query=$("searchInput").value.trim().toLowerCase();
  let list=notes.filter(n=>currentView==="trash"?n.deleted:!n.deleted);
  if(currentView==="favorites") list=list.filter(n=>n.favorite);
  if(query) list=list.filter(n=>(n.title+" "+n.content).toLowerCase().includes(query));
  list.sort((a,b)=>newestFirst?b.updated-a.updated:a.updated-b.updated);
  grid.innerHTML="";
  list.forEach(n=>{
    const card=document.createElement("article");
    card.className="note-card"+(n.deleted?" trash-note":"");
    card.innerHTML=`
      <div class="note-actions">
        ${!n.deleted?`<button class="icon-btn favorite ${n.favorite?"active":""}" title="Favorite">★</button>`:""}
        ${n.deleted?`<button class="icon-btn restore" title="Restore">↶</button>`:`<button class="icon-btn edit" title="Edit">✎</button>`}
        <button class="icon-btn delete" title="${n.deleted?"Delete permanently":"Move to trash"}">${n.deleted?"×":"⌫"}</button>
      </div>
      <h3>${escapeHTML(n.title||"Untitled")}</h3>
      <p>${escapeHTML(n.content||"No content")}</p>
      <div class="note-meta">${formatDate(n.updated)} · ${wordCount(n.content)} words</div>`;
    card.querySelector(".favorite")?.addEventListener("click",()=>{n.favorite=!n.favorite;n.updated=Date.now();saveData();render()});
    card.querySelector(".edit")?.addEventListener("click",()=>openEditor(n));
    card.querySelector(".restore")?.addEventListener("click",()=>{n.deleted=false;n.updated=Date.now();saveData();render()});
    card.querySelector(".delete").addEventListener("click",()=>{
      if(n.deleted){notes=notes.filter(x=>x.id!==n.id)}else{n.deleted=true;n.updated=Date.now()}
      saveData();render();
    });
    grid.appendChild(card);
  });
  empty.hidden=list.length!==0;
  $("allCount").textContent=notes.filter(n=>!n.deleted).length;
  $("favCount").textContent=notes.filter(n=>!n.deleted&&n.favorite).length;
  $("trashCount").textContent=notes.filter(n=>n.deleted).length;
  $("statTotal").textContent=notes.filter(n=>!n.deleted).length;
  $("statFav").textContent=notes.filter(n=>!n.deleted&&n.favorite).length;
  $("statWords").textContent=notes.filter(n=>!n.deleted).reduce((s,n)=>s+wordCount(n.content),0).toLocaleString();
}

function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function openEditor(note=null){
  editingId=note?.id||null;
  $("modalTitle").textContent=note?"Edit Note":"New Note";
  $("noteTitle").value=note?.title||"";
  $("noteContent").value=note?.content||"";
  updateWords(); modal.classList.add("show");$("noteTitle").focus();
}
function closeEditor(){modal.classList.remove("show");editingId=null}
function updateWords(){$("wordCount").textContent=wordCount($("noteContent").value)+" words"}

$("newNoteBtn").onclick=()=>openEditor();
$("emptyNewBtn").onclick=()=>openEditor();
$("closeModal").onclick=closeEditor;
$("cancelBtn").onclick=closeEditor;
$("noteContent").addEventListener("input",updateWords);
$("saveBtn").onclick=()=>{
  const title=$("noteTitle").value.trim(),content=$("noteContent").value.trim();
  if(!title){alert("Please enter a note title.");$("noteTitle").focus();return}
  if(editingId){
    const n=notes.find(x=>x.id===editingId); n.title=title;n.content=content;n.updated=Date.now();n.deleted=false;
  }else notes.push({id:Date.now().toString(),title,content,created:Date.now(),updated:Date.now(),favorite:false,deleted:false});
  saveData();closeEditor();render();
};
$("searchInput").addEventListener("input",render);
$("sortBtn").onclick=()=>{newestFirst=!newestFirst;$("sortBtn").textContent="Sort: "+(newestFirst?"Newest":"Oldest")+" ▾";render()};

document.querySelectorAll(".nav-item[data-view]").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".nav-item[data-view]").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  currentView=btn.dataset.view;
  $("viewTitle").textContent=currentView==="all"?"My Notes":currentView==="favorites"?"Favorites":"Trash";
  $("viewSubtitle").textContent=currentView==="all"?"Organize. Create. Inspire.":currentView==="favorites"?"Your important notes":"Deleted notes";
  $("sectionTitle").textContent=currentView==="all"?"Recent Notes":$("viewTitle").textContent;
  render();
}));
$("clearAllBtn").onclick=()=>{if(confirm("Delete ALL NoteCraft data? This cannot be undone.")){notes=[];saveData();render()}};
$("logoutBtn").onclick=()=>{if(confirm("Return to the login page?"))location.href="index.html"};
modal.addEventListener("click",e=>{if(e.target===modal)closeEditor()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("show"))closeEditor()});
render();

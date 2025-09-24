// ──────────────────────────────────────────────────────────────────────────────
// FigJam Tagger — MVP Plugin
// Features
//  - Create, assign, remove, rename tags
//  - Color-label tags (UI-only), optional emoji marker
//  - Filter/select nodes by tag and zoom into view
//  - Merge tags
//  - Export tag map to CSV
//  - Stores tags per-node via Plugin Data; keeps a document-level tag registry
//  - Works in FigJam (and Figma design files for basic text/frames)
//  - Non-destructive: won’t alter node text by default
//
// Files in this single document:
//  1) manifest.json
//  2) code.ts (main plugin code)
//  3) ui.html (plugin UI)
//  4) ui.ts (UI logic)
//
// Notes
//  - This is a minimal, production-leaning starting point. You can extend with
//    tag chips (stickies/shapes) or AI-suggested tags (see TODO at bottom).
//  - For large docs, you may want to keep an index under Document.sharedPluginData
//    for faster find operations. The MVP walks the page.
// ──────────────────────────────────────────────────────────────────────────────

/* ========================= 1) manifest.json ========================= */
// Save as: manifest.json
{
  "name": "FigJam Tagger (MVP)",
  "id": "figjam-tagger-mvp",
  "editorType": ["figma", "figjam"],
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "permissions": ["currentuser"],
  "relaunchButtons": [
    {
      "command": "manage-tags",
      "name": "Manage Tags"
    }
  ]
}

/* =========================== 2) code.ts ============================ */
// Save as: code.ts

type TagName = string
interface TagMeta { color?: string; emoji?: string }
interface TagRegistry { [tag: TagName]: TagMeta }

const NS = {
  node: { tags: "tags" },
  doc: { registry: "registry" },
  shared: { namespace: "figjam_tagger", index: "index" }, // reserved if you add an index later
}

function getDocument(): DocumentNode { return figma.root }

function getRegistry(): TagRegistry {
  const doc = getDocument()
  const raw = doc.getPluginData(NS.doc.registry)
  if (!raw) return {}
  try { return JSON.parse(raw) as TagRegistry } catch { return {} }
}

function setRegistry(reg: TagRegistry) {
  const doc = getDocument()
  doc.setPluginData(NS.doc.registry, JSON.stringify(reg))
}

function getNodeTags(n: BaseNode): TagName[] {
  const raw = (n as BaseNode).getPluginData(NS.node.tags)
  if (!raw) return []
  try { return JSON.parse(raw) as TagName[] } catch { return [] }
}

function setNodeTags(n: BaseNode, tags: TagName[]) {
  ;(n as BaseNode).setPluginData(NS.node.tags, JSON.stringify([...new Set(tags)].sort()))
}

function addTagsToSelection(tags: TagName[]) {
  const sel = figma.currentPage.selection
  if (sel.length === 0) return { updated: 0 }
  let updated = 0
  for (const n of sel) {
    const current = getNodeTags(n)
    const next = [...new Set([...current, ...tags])]
    setNodeTags(n, next)
    updated++
  }
  return { updated }
}

function removeTagsFromSelection(tags: TagName[]) {
  const sel = figma.currentPage.selection
  if (sel.length === 0) return { updated: 0 }
  let updated = 0
  for (const n of sel) {
    const current = getNodeTags(n)
    const next = current.filter(t => !tags.includes(t))
    setNodeTags(n, next)
    updated++
  }
  return { updated }
}

function renameTagEverywhere(from: TagName, to: TagName) {
  // update registry
  const reg = getRegistry()
  if (reg[from]) {
    reg[to] = { ...(reg[to] || {}), ...(reg[from] || {}) }
    delete reg[from]
    setRegistry(reg)
  }
  // update nodes on current page (MVP scope)
  const nodes = figma.currentPage.findAll(n => getNodeTags(n).includes(from))
  for (const n of nodes) {
    const tags = getNodeTags(n).map(t => (t === from ? to : t))
    setNodeTags(n, tags)
  }
  return { count: nodes.length }
}

function mergeTags(into: TagName, fromList: TagName[]) {
  const reg = getRegistry()
  // fold metadata (first non-empty wins)
  for (const f of fromList) {
    if (reg[f]) {
      reg[into] = { ...(reg[into] || {}), ...reg[f] }
      delete reg[f]
    }
  }
  setRegistry(reg)
  // update nodes
  const nodes = figma.currentPage.findAll(n => fromList.some(f => getNodeTags(n).includes(f)))
  for (const n of nodes) {
    const tags = new Set(getNodeTags(n))
    let changed = false
    for (const f of fromList) {
      if (tags.delete(f)) changed = true
    }
    tags.add(into)
    if (changed) setNodeTags(n, [...tags])
  }
  return { count: nodes.length }
}

function findByTag(tag: TagName): SceneNode[] {
  return figma.currentPage.findAll(n => getNodeTags(n).includes(tag)) as SceneNode[]
}

function exportCSV(): string {
  const rows: string[] = ["nodeId,nodeName,tags"]
  const nodes = figma.currentPage.findAll()
  for (const n of nodes) {
    const t = getNodeTags(n)
    if (t.length === 0) continue
    const name = (n as SceneNode).name?.replaceAll('"', '""') || ""
    rows.push(`${n.id},"${name}","${t.join("|")}"`)
  }
  return rows.join("\n")
}

function ensureTagInRegistry(tag: TagName, meta?: TagMeta) {
  const reg = getRegistry()
  if (!reg[tag]) reg[tag] = {}
  if (meta) reg[tag] = { ...reg[tag], ...meta }
  setRegistry(reg)
}

figma.on("selectionchange", () => {
  const tagsPerSel = figma.currentPage.selection.map(n => ({ id: n.id, tags: getNodeTags(n) }))
  figma.ui.postMessage({ type: "selection-tags", data: tagsPerSel })
})

figma.on("run", ({ command }) => {
  figma.showUI(__html__, { width: 380, height: 520 })
  figma.ui.postMessage({ type: "bootstrap", data: { registry: getRegistry(), editorType: figma.editorType } })
  if (command === "manage-tags") {
    // nothing extra for now
  }
})

figma.ui.onmessage = async (msg) => {
  switch (msg.type) {
    case "create-tag": {
      const { tag, meta } = msg
      ensureTagInRegistry(tag, meta)
      figma.ui.postMessage({ type: "registry", data: getRegistry() })
      break
    }
    case "delete-tag": {
      const reg = getRegistry()
      delete reg[msg.tag]
      setRegistry(reg)
      // strip from nodes
      const nodes = figma.currentPage.findAll(n => getNodeTags(n).includes(msg.tag))
      for (const n of nodes) setNodeTags(n, getNodeTags(n).filter(t => t !== msg.tag))
      figma.ui.postMessage({ type: "registry", data: getRegistry() })
      break
    }
    case "assign-tags-to-selection": {
      const { tags } = msg
      const res = addTagsToSelection(tags)
      figma.notify(`Tagged ${res.updated} item(s)`) 
      break
    }
    case "remove-tags-from-selection": {
      const { tags } = msg
      const res = removeTagsFromSelection(tags)
      figma.notify(`Removed from ${res.updated} item(s)`) 
      break
    }
    case "rename-tag": {
      const { from, to } = msg
      const res = renameTagEverywhere(from, to)
      figma.notify(`Renamed on ${res.count} node(s)`) 
      figma.ui.postMessage({ type: "registry", data: getRegistry() })
      break
    }
    case "merge-tags": {
      const { into, fromList } = msg
      const res = mergeTags(into, fromList)
      figma.notify(`Merged into “${into}” across ${res.count} node(s)`) 
      figma.ui.postMessage({ type: "registry", data: getRegistry() })
      break
    }
    case "filter-by-tag": {
      const nodes = findByTag(msg.tag)
      if (nodes.length) {
        figma.currentPage.selection = nodes
        figma.viewport.scrollAndZoomIntoView(nodes)
      } else {
        figma.notify(`No nodes with tag “${msg.tag}”`)
      }
      break
    }
    case "export-csv": {
      const csv = exportCSV()
      await figma.clipboard.writeText(csv)
      figma.notify("Tag map copied to clipboard as CSV")
      break
    }
    default:
      console.warn("Unknown message", msg)
  }
}

/* =========================== 3) ui.html ============================ */
// Save as: ui.html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 0; }
    header { padding: 12px; border-bottom: 1px solid #e5e7eb; display:flex; align-items:center; justify-content:space-between; }
    h1 { font-size: 14px; margin: 0; }
    .section { padding: 12px; border-bottom: 1px solid #f3f4f6; }
    .row { display:flex; gap:8px; align-items:center; }
    input[type=text] { flex:1; padding:8px; border:1px solid #d1d5db; border-radius:6px; }
    button { padding:8px 10px; border:1px solid #d1d5db; background:#fff; border-radius:6px; cursor:pointer; }
    button.primary{ background:#111827; color:#fff; border-color:#111827; }
    .taglist { display:flex; flex-wrap:wrap; gap:6px; }
    .tag { display:inline-flex; gap:6px; align-items:center; padding:6px 8px; border-radius:9999px; border:1px solid #e5e7eb; }
    .chip { width:10px; height:10px; border-radius:9999px; background:#9ca3af; }
    .small { font-size:11px; color:#6b7280; }
    .stack { display:flex; flex-direction:column; gap:6px; }
    .grid { display:grid; grid-template-columns: 1fr auto auto; gap:6px; align-items:center; }
    .muted { color:#6b7280; }
    .danger { color:#b91c1c; }
  </style>
</head>
<body>
  <header>
    <h1>FigJam Tagger</h1>
    <div class="small" id="env"></div>
  </header>

  <div class="section stack">
    <div class="row">
      <input id="newTag" type="text" placeholder="Create a tag (e.g., Persona: Admin)" />
      <button id="addTag" class="primary">Add</button>
    </div>
    <div class="row small">
      <span class="muted">Optional:</span>
      <input id="tagEmoji" type="text" placeholder="emoji" style="width:60px" />
      <input id="tagColor" type="color" value="#9ca3af" />
    </div>
  </div>

  <div class="section">
    <div class="stack">
      <div class="row" style="justify-content:space-between">
        <strong>Tags</strong>
        <div class="row">
          <button id="mergeBtn">Merge</button>
          <button id="exportCsv">Export CSV</button>
        </div>
      </div>
      <div id="tags" class="taglist"></div>
    </div>
  </div>

  <div class="section stack">
    <strong>Selection</strong>
    <div id="sel" class="small muted">No selection</div>
    <div class="row">
      <input id="assignInput" type="text" placeholder="Comma-separated tags to assign" />
      <button id="assignBtn">Assign</button>
      <button id="removeBtn">Remove</button>
    </div>
  </div>

  <script type="module" src="ui.ts"></script>
</body>
</html>

/* ============================ 4) ui.ts ============================= */
// Save as: ui.ts

type TagName = string
interface TagMeta { color?: string; emoji?: string }
interface TagRegistry { [tag: TagName]: TagMeta }

const $ = (q: string) => document.querySelector(q) as HTMLElement
const $$ = (q: string) => Array.from(document.querySelectorAll(q)) as HTMLElement[]

let registry: TagRegistry = {}
let editorType = "figjam"

function renderRegistry() {
  const el = $("#tags")
  el.innerHTML = ""
  const tags = Object.keys(registry).sort((a,b)=>a.localeCompare(b))
  for (const t of tags) {
    const meta = registry[t] || {}
    const chip = document.createElement("span")
    chip.className = "chip"
    if (meta.color) (chip as any).style.background = meta.color

    const tag = document.createElement("div")
    tag.className = "tag"

    const label = document.createElement("span")
    label.textContent = `${meta.emoji ? meta.emoji+" " : ""}${t}`

    const filterBtn = document.createElement("button")
    filterBtn.textContent = "Find"
    filterBtn.onclick = () => parent.postMessage({ pluginMessage: { type: "filter-by-tag", tag: t }}, "*")

    const renameBtn = document.createElement("button")
    renameBtn.textContent = "Rename"
    renameBtn.onclick = async () => {
      const to = prompt(`Rename tag “${t}” to:`)
      if (to && to !== t) parent.postMessage({ pluginMessage: { type: "rename-tag", from: t, to }}, "*")
    }

    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "Delete"
    deleteBtn.className = "danger"
    deleteBtn.onclick = () => {
      if (confirm(`Delete tag “${t}”? It will be removed from nodes.`)) {
        parent.postMessage({ pluginMessage: { type: "delete-tag", tag: t }}, "*")
      }
    }

    tag.append(chip, label, filterBtn, renameBtn, deleteBtn)
    el.appendChild(tag)
  }
}

function renderSelectionTags(payload: {id: string, tags: string[]}[]) {
  const el = $("#sel")
  if (!payload.length) { el.textContent = "No selection"; return }
  const unique = new Set<string>()
  payload.forEach(p => p.tags.forEach(t => unique.add(t)))
  el.textContent = `${payload.length} selected · tags: ${[...unique].sort().join(", ") || "(none)"}`
}

// Wire UI
$("#addTag").addEventListener("click", () => {
  const name = (document.getElementById("newTag") as HTMLInputElement).value.trim()
  const emoji = (document.getElementById("tagEmoji") as HTMLInputElement).value.trim()
  const color = (document.getElementById("tagColor") as HTMLInputElement).value.trim()
  if (!name) return
  parent.postMessage({ pluginMessage: { type: "create-tag", tag: name, meta: { color, emoji } }}, "*")
  ;(document.getElementById("newTag") as HTMLInputElement).value = ""
  ;(document.getElementById("tagEmoji") as HTMLInputElement).value = ""
})

$("#assignBtn").addEventListener("click", () => {
  const raw = (document.getElementById("assignInput") as HTMLInputElement).value.trim()
  if (!raw) return
  const tags = raw.split(",").map(s => s.trim()).filter(Boolean)
  parent.postMessage({ pluginMessage: { type: "assign-tags-to-selection", tags }}, "*")
})

$("#removeBtn").addEventListener("click", () => {
  const raw = (document.getElementById("assignInput") as HTMLInputElement).value.trim()
  if (!raw) return
  const tags = raw.split(",").map(s => s.trim()).filter(Boolean)
  parent.postMessage({ pluginMessage: { type: "remove-tags-from-selection", tags }}, "*")
})

$("#mergeBtn").addEventListener("click", () => {
  const into = prompt("Merge into tag:")
  if (!into) return
  const from = prompt("Comma-separated tags to merge:")
  if (!from) return
  const fromList = from.split(",").map(s => s.trim()).filter(Boolean)
  parent.postMessage({ pluginMessage: { type: "merge-tags", into, fromList }}, "*")
})

$("#exportCsv").addEventListener("click", () => {
  parent.postMessage({ pluginMessage: { type: "export-csv" }}, "*")
})

onmessage = (event: MessageEvent) => {
  const { type, data } = event.data.pluginMessage || {}
  if (!type) return
  switch (type) {
    case "bootstrap": {
      registry = data.registry || {}
      editorType = data.editorType
      $("#env").textContent = editorType
      renderRegistry()
      break
    }
    case "registry": {
      registry = data
      renderRegistry()
      break
    }
    case "selection-tags": {
      renderSelectionTags(data)
      break
    }
  }
}

/* ============================ TODO / AI ============================ */
// 1) Optional: AI-suggested tags
//    - Add a button that sends a list of selected node texts to your backend
//      where you call your preferred LLM to propose tags.
//    - Your backend returns a set of suggested tags; display in UI for approval.
//
// 2) Visual tag chips in FigJam
//    - For each tag on a node, create a small sticky near the node with the tag
//      label + color. Store the chip nodeId in the node’s plugin data to keep
//      them in sync. Provide a "refresh chips" action.
//
// 3) Performance
//    - For large boards, maintain an inverted index under Document.sharedPluginData
//      with namespace NS.shared.namespace to map tag -> nodeIds for fast lookup.
//
// 4) Access control
//    - Consider namespacing tags by team or doc so multiple plugins don’t collide.
//
// 5) Import/Export
//    - JSON import/export of registry + node mappings for portability.

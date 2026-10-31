/* Standalone, dependency-free UI. Paths are relative for project GitHub Pages. */
'use strict';
const D = window.BESTIARY;
const root = document.body.dataset.root;
const main = document.querySelector('main');
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hex = id => id.toString(16).padStart(2,'0').toUpperCase();
const mon = id => D.monsters.find(m => m.id === id);
const skill = id => D.skills.find(s => s.id === id);
const gate = id => D.gates.find(g => g.id === id);
const family = id => D.families[id] || 'special';
const monURL = id => `${root}monsters/${String(id).padStart(3,'0')}.html`;
const skillURL = id => `${root}skills/${String(id).padStart(3,'0')}.html`;
const gateURL = id => `${root}gates/${String(id).padStart(2,'0')}.html`;
const link = id => mon(id) ? `<a class="monster-link" href="${monURL(id)}">${e(mon(id).name)} <small>#${hex(id)}</small></a>` : `<span>${e(D.events.find(v=>v.species===id)?.name || `Special entry #${hex(id)}`)}</span>`;
const gateLink = id => `<a href="${gateURL(id)}">${e(gate(id).name)}</a>`;
const badge = id => `<span class="badge family-${id}">${e(family(id))}</span>`;
const sprite = (m, cls='') => `<img class="sprite ${cls}" src="${root}${m.sprite}" alt="${e(m.name)}" width="48" height="48">`;
const crumbs = text => `<div class="crumb"><a href="${root}index.html">Field guide</a><span>/</span>${text}</div>`;
const empty = text => `<div class="empty"><span aria-hidden="true">◇</span><h3>No entries here</h3><p>${text}</p></div>`;
function card(m) {
  return `<a class="monster-card" href="${monURL(m.id)}"><div class="card-top"><span class="number">#${hex(m.id)}</span>${badge(m.family)}</div><div class="sprite-stage">${sprite(m)}</div><h3>${e(m.name)}</h3><p>${m.skills.map(s=>e(skill(s).name)).join(' · ')}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`;
}
function cards(list) { return `<div class="monster-grid">${list.map(card).join('')}</div>`; }
function token(value) {
  if (value === 255) return '—';
  if (value === 250) return `<a class="family-token" href="${root}index.html">Any family</a>`;
  if (value >= 240 && value <= 249) return `<a class="family-token" href="${root}index.html?family=${value-240}">${e(family(value-240))} family</a>`;
  return link(value);
}
const matches = (value,m) => value === m.id || value === m.family+240 || value === 250;
function recipeTable(base,special) {
  if (!base.length && !special.length) return empty('No matching explicit rule is present in the recovered tables. The selector can also fall back to the first parent’s species when no rule matches.');
  return `<div class="table-wrap"><table><thead><tr><th>First parent</th><th></th><th>Second parent</th><th>Offspring</th><th>Rule / requirement</th></tr></thead><tbody>${base.map(r => `<tr><td>${token(r.a)}</td><td class="plus">+</td><td>${token(r.b)}</td><td>${link(r.child)}</td><td><span class="rule">Base</span></td></tr>`).join('')}${special.map(r => `<tr><td>${token(r.a)}</td><td class="plus">+</td><td>${token(r.b)}</td><td>${link(r.child)}</td><td><span class="rule">Special ${r.index+1}</span>${r.minimum ? `<br>Offspring +${r.minimum} minimum` : ''}${r.bonus ? `<br>+${r.bonus} adjustment` : ''}</td></tr>`).join('')}</tbody></table></div>`;
}
function index() {
  main.innerHTML = `<section class="hero"><div><p class="eyebrow">THE MONSTER MASTER’S COMPANION</p><h1>Small monsters.<br><em>Endless possibilities.</em></h1><p class="hero-copy">Find a familiar face. Discover a new breeding path.<br>Your field guide to Dragon Warrior Monsters.</p><div class="hero-stats"><span><b>215</b> monsters</span><span><b>112</b> innate skills</span><span><b>825</b> special rules</span></div></div><div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="spark spark-a">✦</span><span class="spark spark-b">✧</span>${sprite(mon(8),'hero-slime')}${sprite(mon(0),'hero-drak')}${sprite(mon(78),'hero-dracky')}<span class="art-caption">YOUR NEXT ADVENTURE STARTS HERE</span></div></section>
  <section class="collection"><div class="section-title"><div><p class="eyebrow">THE COLLECTION</p><h2>Meet the monsters</h2></div><span id="count" class="muted" aria-live="polite"></span></div><form class="filters" role="search"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search monsters, skills, or #ID…" aria-label="Search monsters, skills, or hexadecimal species ID"></label><label><span class="sr-only">Family</span><select id="family"><option value="">All families</option>${D.families.map((f,i)=>`<option value="${i}">${e(f)} family</option>`).join('')}</select></label><label><span class="sr-only">Encounter coverage</span><select id="availability"><option value="">All encounter coverage</option><option value="wild">Wild encounter in normal gate</option><option value="unknown">No normal-gate wild entry</option></select></label><label><span class="sr-only">Sort order</span><select id="sort"><option value="id">Bestiary order</option><option value="name">Name A–Z</option><option value="family">Family</option></select></label></form><div id="results"></div></section>`;
  const fields = ['search','family','availability','sort'];
  const params = new URLSearchParams(location.search);
  fields.forEach(id=>{ const el=document.getElementById(id); if(params.has(id)) el.value=params.get(id); });
  const wild = new Set(D.encounters.filter(r=>gate(r.dungeon_id).status==='normal').map(r=>r.species_id));
  function update() {
    const q=document.getElementById('search').value.trim().toLowerCase();
    const f=document.getElementById('family').value, a=document.getElementById('availability').value, sort=document.getElementById('sort').value;
    let list=D.monsters.filter(m=>(f===''||m.family===Number(f)) && (a==='' || (a==='wild'?wild.has(m.id):!wild.has(m.id))) && (!q || m.name.toLowerCase().includes(q) || m.skills.some(s=>skill(s).name.toLowerCase().includes(q)) || `#${hex(m.id).toLowerCase()}`===q || `0x${hex(m.id).toLowerCase()}`===q));
    if(sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name)||a.id-b.id);
    if(sort==='family') list.sort((a,b)=>a.family-b.family||a.id-b.id);
    document.getElementById('count').textContent=`${list.length} of 215 monsters`;
    document.getElementById('results').innerHTML=list.length?cards(list):`${empty('Try a different name, skill, or family.')}<button id="reset" class="button">Reset filters</button>`;
    document.getElementById('reset')?.addEventListener('click',()=>{fields.forEach(id=>document.getElementById(id).value=id==='sort'?'id':'');update();});
    const next=new URLSearchParams();fields.forEach(id=>{const v=document.getElementById(id).value;if(v && !(id==='sort'&&v==='id'))next.set(id,v);});
    try { history.replaceState(null,'',location.pathname+(next.size?'?'+next:'')); } catch (_) { /* Some browsers restrict local-file history. Filtering still works. */ }
  }
  main.querySelector('form').addEventListener('submit',ev=>ev.preventDefault());
  fields.forEach(id=>document.getElementById(id).addEventListener(id==='search'?'input':'change',update));update();
}
function groupedEncounters(rows) {
  const groups=new Map();
  for(const r of rows){const key=`${r.dungeon_id}:${r.preset_id}`; if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);}
  const result=[];
  for(const list of groups.values()){
    list.sort((a,b)=>a.floor_from-b.floor_from);
    let current=null;
    for(const r of list){if(current && r.floor_from<=current.floor_through+1) current.floor_through=Math.max(current.floor_through,r.floor_through);else {current={...r};result.push(current);}}
  }
  return result.sort((a,b)=>a.dungeon_id-b.dungeon_id||a.species_id-b.species_id||a.floor_from-b.floor_from);
}
function encounterTable(rows, showMonster=false) {
  if(!rows.length) return empty('No wild encounter is listed on these floors. This does not establish that the monster is unobtainable.');
  return `<div class="table-wrap"><table><thead><tr><th>${showMonster?'Monster':'Gate'}</th><th>Floors</th><th>Level</th><th>Recruitment class</th></tr></thead><tbody>${groupedEncounters(rows).map(r=>`<tr><td>${showMonster?link(r.species_id):gateLink(r.dungeon_id)}</td><td>${r.floor_from===r.floor_through?r.floor_from:`${r.floor_from}–${r.floor_through}`}</td><td>${r.level}</td><td>${r.recruitment_class}${r.recruitment_class===7?' · blocked':''}</td></tr>`).join('')}</tbody></table></div>`;
}
function partyHTML(party) {
  const members=new Map();
  for(const p of party){const key=p.species_id;if(!members.has(key))members.set(key,{p,count:0});members.get(key).count++;}
  return [...members.values()].map(({p,count})=>`${link(p.species_id)}${count>1?` ×${count}`:''}`).join(' + ');
}
function uniqueBattles(battles) {
  const seen=new Set();return battles.filter(b=>{const key=b.presets.join(',');if(seen.has(key))return false;seen.add(key);return true;});
}
function bossSummary(g) {
  return uniqueBattles(g.bossBattles).map(b=>partyHTML(b.party)).join('<br>') || '<span class="muted">No battle in destination scripts</span>';
}
function bossDetails(g, other=false) {
  const battles=uniqueBattles(other?g.otherBattles:g.bossBattles);
  if(!battles.length)return '<p class="section-copy">No boss battle is defined in the recovered destination events.</p>';
  return battles.map(b=>`<div class="boss-battle"><div class="boss-portraits">${b.party.map(p=>mon(p.species_id)?`<a href="${monURL(p.species_id)}">${sprite(mon(p.species_id))}</a>`:'<span class="special-portrait">✦</span>').join('')}</div><div><h3>${partyHTML(b.party)}</h3><p>${b.party.map(p=>`${e(p.name)}: level ${p.level}`).join(' · ')}</p><details><summary>Script evidence</summary><p>Map $${hex(b.map)} · command ${e(b.address)} · ${e(b.kind.replaceAll('_',' '))}</p></details></div></div>`).join('');
}
function monsterPage(id) {
  const m=mon(id), encounters=D.encounters.filter(r=>r.species_id===id), base=D.base.filter(r=>r.child===id), special=D.special.filter(r=>r.child===id);
  const outgoingBase=D.base.filter(r=>matches(r.a,m)||matches(r.b,m)), outgoingSpecial=D.special.filter(r=>matches(r.a,m)||matches(r.b,m));
  const events=D.events.filter((r,i,all)=>r.species===id && all.findIndex(v=>v.species===r.species&&v.preset===r.preset&&v.gates[0]===r.gates[0])===i);
  main.innerHTML=`${crumbs(`${e(m.name)} <span class="number">#${hex(id)}</span>`)}<section class="monster-hero"><div class="portrait">${sprite(m)}<span class="number">SPECIES #${hex(id)}</span></div><div><div class="eyebrow">MONSTER DOSSIER</div><h1>${e(m.name)}</h1>${badge(m.family)}<p class="description">${e(m.description)}</p><div class="facts"><span><small>Base level cap</small><b>${m.levelCap}</b></span><span><small>Innate skills</small><b>${m.skills.length}</b></span><span><small>Gate tables indexed</small><b>${new Set(encounters.map(r=>r.dungeon_id)).size}</b></span></div></div></section>
  <nav class="section-nav" aria-label="On this page"><a href="#skills">Skills</a><a href="#breeding">Breeding</a><a href="#locations">Recruitment</a><a href="#as-parent">As a parent</a></nav>
  <section id="skills"><div class="section-title"><div><p class="eyebrow">NATURAL TALENTS</p><h2>Innate skills</h2></div></div><div class="skill-grid">${m.skills.map(s=>{const v=skill(s);return `<a class="skill-card" href="${skillURL(s)}"><div><span class="skill-icon" aria-hidden="true">✧</span><span class="mp">INNATE SKILL</span></div><h3>${e(v.name)} ↗</h3><p>${e(v.description)}</p></a>`;}).join('')}</div><p class="fine">Innate skills enter the skill pool; they are not necessarily usable immediately.</p></section>
  <section id="breeding"><div class="section-title"><div><p class="eyebrow">A NEW GENERATION</p><h2>Recipes for ${e(m.name)}</h2></div><span class="muted">${base.length+special.length} table rules</span></div><p class="section-copy">Parent order matters. Special rules take priority in their original table order. “Minimum” refers to calculated offspring plus, which depends on parent levels and plus values.</p>${recipeTable(base,special)}<p class="fine">These are recovered table rules. Competing rules and breeding eligibility still apply; a family token is not a guarantee that every member produces this offspring. When no rule matches, the selector falls back to the first parent’s species.</p></section>
  <section id="locations"><div class="section-title"><div><p class="eyebrow">OUT IN THE WORLD</p><h2>Recruitment & encounters</h2></div></div><div class="notice"><b>Floors exclude the boss destination.</b> Encounter bands are restricted to each gate’s generated floors. Recruitment still depends on battle context, discovery state and recruitment score. Unmapped gate names retain their numeric ID.</div>${encounterTable(encounters)}${events.length?`<h3 class="subheading">Scripted battle references</h3>${events.map(v=>`<div class="event-row"><b>${v.gates.map(gateLink).join(', ')||'Unmapped location'}</b><span>Level ${v.level} · map $${hex(v.map)} · recruitment class ${v.recruitmentClass}</span><p>This battle reference alone does not establish a recruitment or reward condition. Class 7 blocks normal recruitment; a separate post-battle acquisition may use a remapped preset.</p></div>`).join('')}`:''}</section>
  <section id="as-parent"><div class="section-title"><div><p class="eyebrow">KEEP THE LINE GOING</p><h2>${e(m.name)} as a parent</h2></div></div><p class="section-copy">Explore rules that name this monster directly or match its family. Other rules can override a family match.</p><label class="inline-label">Show <select id="parent-mode"><option value="direct">Direct species rules</option><option value="family">Include family rules</option></select></label><div id="parent-recipes"></div></section>
  <div class="page-turn">${id>0?`<a href="${monURL(id-1)}">← ${e(mon(id-1).name)}</a>`:'<span></span>'}<a href="${root}index.html">All monsters</a>${id<214?`<a href="${monURL(id+1)}">${e(mon(id+1).name)} →</a>`:'<span></span>'}</div>`;
  function parentRecipes(){const all=document.getElementById('parent-mode').value==='family';document.getElementById('parent-recipes').innerHTML=recipeTable(outgoingBase.filter(r=>all||r.a===id||r.b===id),outgoingSpecial.filter(r=>all||r.a===id||r.b===id));}
  document.getElementById('parent-mode').addEventListener('change',parentRecipes);parentRecipes();
}
function skillsPage(id) {
  const s=skill(id), list=D.monsters.filter(m=>m.skills.includes(id));
  main.innerHTML=`${crumbs('Skills')}<section class="simple-hero"><p class="eyebrow">SKILL #${hex(id)}</p><h1>${e(s.name)}</h1><p class="description">${e(s.description)}</p><span class="badge">Innate skill</span><p class="fine">Learning requirements and effect-specific MP costs are not included in this guide.</p></section><section><div class="section-title"><h2>Monsters with this innate skill</h2><span class="muted">${list.length} monsters</span></div>${cards(list)}</section>`;
}
function gatesPage() {
  main.innerHTML=`${crumbs('Gates')}<section class="simple-hero"><p class="eyebrow">THE TRAVELER’S ATLAS</p><h1>Beyond the gates.</h1><p class="description">Identify a gate by its boss. Explore its monsters floor by floor.</p><p class="section-copy">${D.gates.filter(g=>g.named).length} gate names mapped. Wild floor ranges stop before each gate’s boss destination. Family tags identify gates whose ordinary wild encounters all belong to one family. Bosses may belong to a different family.</p></section><section><div class="section-title"><h2>Gate & boss index</h2><span class="muted">${D.gates.length} gates</span></div><div class="table-wrap"><table class="gate-index"><thead><tr><th>ID</th><th>Gate</th><th>Boss / alternatives</th><th>Wild floors</th><th>Wild species</th></tr></thead><tbody>${D.gates.map(g=>`<tr><td><span class="number">${String(g.id).padStart(2,'0')}</span></td><td>${gateLink(g.id)}${g.familyTheme!==null?`<br>${badge(g.familyTheme)}`:''}${!g.named&&g.status==='normal'?'<br><small class="muted">Name to confirm</small>':''}</td><td>${bossSummary(g)}</td><td>1–${g.floorCount-1}</td><td>${new Set(D.encounters.filter(r=>r.dungeon_id===g.id).map(r=>r.species_id)).size}</td></tr>`).join('')}</tbody></table></div><p class="fine">The index lists species and parties referenced by destination-room event scripts, including connected boss rooms. Alternatives and repeat branches are not necessarily a required sequence.</p></section>`;
}
function gatePage(id) {
  const g=gate(id), rows=D.encounters.filter(r=>r.dungeon_id===id);
  main.innerHTML=`${crumbs(`<a href="${root}gates.html">Gates</a><span>/</span>${e(g.name)}`)}<section class="simple-hero"><p class="eyebrow">DUNGEON SELECTOR ${String(id).padStart(2,'0')}</p><h1>${e(g.name)}</h1><span class="status ${g.named?'known':''}">${g.named?'Name mapped':'Name to confirm'}</span> ${g.familyTheme!==null?badge(g.familyTheme):''}<p class="section-copy">${e(g.nameSource)}</p><div class="facts"><span><small>Wild floors</small><b>1–${g.floorCount-1}</b></span><span><small>Boss destination</small><b>${g.floorCount}</b></span><span><small>Wild species</small><b>${new Set(rows.map(r=>r.species_id)).size}</b></span></div>${g.conditions?`<div class="notice"><b>Location notes</b><p>${e(g.conditions)}</p></div>`:''}</section><section><div class="section-title"><div><p class="eyebrow">WHO WAITS AT THE END</p><h2>Boss battles & alternatives</h2></div></div>${bossDetails(g)}<p class="fine">These are fixed battle references, including alternative and repeat-event branches. Recruitment and post-battle rewards have separate conditions.</p></section><section><div class="section-title"><div><p class="eyebrow">ON THE WAY DOWN</p><h2>Wild encounters by floor</h2></div><label class="inline-label">Floor <select id="encounter-floor" aria-label="Encounter floor"><option value="">All wild floors</option>${Array.from({length:g.floorCount-1},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label></div><p class="section-copy">Encounter bands are clipped to floors 1–${g.floorCount-1}; floor ${g.floorCount} is the fixed destination. Repeated species are combined across adjacent bands. Special rooms and event overrides can change a particular floor.</p><div id="floor-encounters"></div></section>${g.otherBattles.length?`<section><h2>Other scripted encounters</h2><p class="section-copy">These fights belong to the destination’s events and are separate from the wild encounter table and principal boss.</p>${bossDetails(g,true)}</section>`:''}`;
  function updateFloor(){const n=Number(document.getElementById('encounter-floor').value);document.getElementById('floor-encounters').innerHTML=encounterTable(n?rows.filter(r=>r.floor_from<=n&&r.floor_through>=n).map(r=>({...r,floor_from:n,floor_through:n})):rows,true);}
  document.getElementById('encounter-floor').addEventListener('change',updateFloor);updateFloor();
}
function about() {
  main.innerHTML=`${crumbs('About the data')}<article class="about"><p class="eyebrow">AN OPEN FIELD NOTEBOOK</p><h1>Recovered from the game.<br><em>Room to keep learning.</em></h1><p class="description">This guide connects the monster, text, graphics, breeding and encounter data recovered by the DWM disassembly project.</p><h2>What’s here</h2><p>All 215 in-game bestiary species have names, battle sprites, descriptions and innate skill lists. The 112 distinct innate skills have original descriptions. Breeding uses the recovered base table and 825 ordered special rules. Wild encounter tables link 153 species across ${D.gates.length} gates.</p><h2>What remains uncertain</h2><p>All 31 normal gate names are mapped. Entry requirements and some scripted acquisition paths still need tracing. Wild encounters are now restricted to the generated floors before each boss destination. Special-room substitutions and event overrides remain separate. No wild entry means no entry in our recovered index; it does not mean a monster is unobtainable. Six special or placeholder species records outside the in-game bestiary are omitted.</p><p>Duplicate names are intentional: some forms share a displayed name. Species IDs keep their pages distinct. Descriptions preserve the game’s original wording. Innate skill learning thresholds are not yet shown.</p><h2>Reading breeding rules</h2><p>Parents are ordered. The first matching special rule wins; base recipes are fallbacks. The minimum plus belongs to the calculated offspring, and can depend on parent levels and plus values. A listed rule does not promise that every member of a parent family yields that child. Some monsters have no explicit recipe. If no special or base rule matches, the selector returns the first parent’s species; other acquisition paths also exist.</p><h2>Contribute gate names</h2><p>Edit <code>bestiary/locations.json</code>, keyed by decimal dungeon selector ID. Add a name, conditions and source note, then run <code>python3 bestiary/scripts/build.py</code>. These annotations live entirely inside the bestiary directory.</p><h2>Source notes</h2><ul><li>Species / innate skills: bank $03 species table.</li><li>Names and skill names: bank $41 text resources.</li><li>Descriptions: bank $4D bestiary index and bank $56 skill index.</li><li>Sprites: editable battle graphics PNGs and manifest.</li><li>Recipes: bank $16 base and special tables.</li><li>Locations: encounter index joined to bank $16 destination-floor limits; destination event scripts and connected fixed-room warps; local annotations.</li></ul><p>The exporter reads the original local ROM for species, recipes and skill parameters, and checked-in reference exports for descriptions and encounters. Rebuild the appropriate reference exports when changing those sources. Unassembled source edits do not automatically appear here.</p><p class="fine">Reference ROM MD5: <code>${e(D.romMd5)}</code>. The published site includes extracted guide data and sprites, never the ROM. An unofficial fan project; game artwork and names belong to their respective owners.</p></article>`;
}
const type=document.body.dataset.page, id=Number(document.body.dataset.id);
({index,monster:()=>monsterPage(id),skill:()=>skillsPage(id),gates:gatesPage,gate:()=>gatePage(id),about}[type]||index)();

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
const link = id => mon(id) ? `<a class="monster-link" href="${monURL(id)}">${e(mon(id).name)}</a>` : `<span>${e(D.events.find(v=>v.species===id)?.name || 'Special encounter')}</span>`;
const gateLink = id => `<a href="${gateURL(id)}">${e(gate(id).name)}</a>`;
const badge = id => `<span class="badge family-${id}">${e(family(id))}</span>`;
const sprite = (m, cls='') => `<img class="sprite ${cls}" src="${root}${m.sprite}" alt="${e(m.name)}" width="48" height="48">`;
const crumbs = text => `<div class="crumb"><a href="${root}index.html">Field guide</a><span>/</span>${text}</div>`;
const empty = text => `<div class="empty"><span aria-hidden="true">◇</span><h3>No entries here</h3><p>${text}</p></div>`;
function card(m) {
  return `<a class="monster-card" href="${monURL(m.id)}"><div class="card-top">${badge(m.family)}</div><div class="sprite-stage">${sprite(m)}</div><h3>${e(m.name)}</h3><p>${m.skills.map(s=>e(skill(s).name)).join(' · ')}</p><span class="card-arrow" aria-hidden="true">↗</span></a>`;
}
function cards(list) { return `<div class="monster-grid">${list.map(card).join('')}</div>`; }
function token(value) {
  if (value === 255) return '—';
  if (value === 250) return `<a class="family-token" href="${root}index.html">Any family</a>`;
  if (value >= 240 && value <= 249) return `<a class="family-token" href="${root}index.html?family=${value-240}">${e(family(value-240))} family</a>`;
  return link(value);
}
const matches = (value,m) => value === m.id || value === m.family+240 || value === 250;
function visibleRecipes(base, special) {
  const rows=new Map();
  for(const r of [...base,...special]) {
    // Different offspring-plus adjustments remain distinct outcomes.
    const key=`${r.a}:${r.b}:${r.child}:${r.bonus||0}`;
    const previous=rows.get(key);
    if(!previous || (r.minimum||0)>=(previous.minimum||0)) rows.set(key,{...r,minimum:r.minimum||0,bonus:r.bonus||0});
  }
  return [...rows.values()];
}
function recipeTable(base,special) {
  const rows=visibleRecipes(base,special);
  if (!rows.length) return '<p class="section-copy">No recipes listed.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>First parent</th><th></th><th>Second parent</th><th>Offspring</th><th>Special</th></tr></thead><tbody>${rows.map(r => `<tr><td>${token(r.a)}</td><td class="plus">+</td><td>${token(r.b)}</td><td>${link(r.child)}</td><td>${[r.minimum?`Offspring +${r.minimum} minimum`:'',r.bonus?`+${r.bonus} offspring adjustment`:''].filter(Boolean).join('<br>')||'—'}</td></tr>`).join('')}</tbody></table></div>`;
}
const recruitmentLabel = value => value===0?'Guaranteed':value===7?'Not recruitable':'Possible';
const recruitmentHTML = value => `<span class="recruitment recruitment-${value===0?'guaranteed':value===7?'blocked':'possible'}">${recruitmentLabel(value)}</span> <small class="muted">Class ${value}</small>`;
function randomMonsters(count=3) {
  const pool=[...D.monsters];
  const size=Math.min(count,pool.length);
  for(let i=0;i<size;i++){
    const chosen=i+Math.floor(Math.random()*(pool.length-i));
    [pool[i],pool[chosen]]=[pool[chosen],pool[i]];
  }
  return pool.slice(0,size);
}
function index() {
  const featured=randomMonsters();
  main.innerHTML = `<section class="hero"><div><h1>Dragon Warrior<br><em>Monsters</em></h1><p class="hero-copy">Skills, breeding recipes and recruitment.</p><div class="hero-stats"><span><b>215</b> monsters</span><span><b>${D.skills.length}</b> skills</span><span><b>${visibleRecipes(D.base,D.special).length}</b> breeding recipes</span></div></div><div class="hero-art"><div aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><span class="spark spark-a">✦</span><span class="spark spark-b">✧</span></div>${featured.map((m,i)=>`<a class="hero-monster ${['hero-slime','hero-drak','hero-dracky'][i]}" href="${monURL(m.id)}" aria-label="View ${e(m.name)}" title="${e(m.name)}">${sprite(m)}</a>`).join('')}<span class="art-caption">EXPLORE A MONSTER</span></div></section>
  <section class="collection"><div class="section-title"><div><h2>Monsters</h2></div><span id="count" class="muted" aria-live="polite"></span></div><form class="filters" role="search"><label class="search"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Search monsters or skills…" aria-label="Search monsters or skills"></label><label><span class="sr-only">Family</span><select id="family"><option value="">All families</option>${D.families.map((f,i)=>`<option value="${i}">${e(f)} family</option>`).join('')}</select></label><label><span class="sr-only">Sort order</span><select id="sort"><option value="family">Family</option><option value="name">A–Z</option></select></label></form><div id="results"></div></section>`;
  const fields = ['search','family','sort'];
  const params = new URLSearchParams(location.search);
  fields.forEach(id=>{ const el=document.getElementById(id); if(params.has(id)) el.value=params.get(id); });
  if(!['family','name'].includes(document.getElementById('sort').value))document.getElementById('sort').value='family';
  function update() {
    const q=document.getElementById('search').value.trim().toLowerCase();
    const f=document.getElementById('family').value, sort=document.getElementById('sort').value;
    let list=D.monsters.filter(m=>(f===''||m.family===Number(f)) && (!q || m.name.toLowerCase().includes(q) || m.skills.some(s=>skill(s).name.toLowerCase().includes(q)) || `#${hex(m.id).toLowerCase()}`===q || `0x${hex(m.id).toLowerCase()}`===q));
    if(sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name)||a.id-b.id);
    if(sort==='family') list.sort((a,b)=>a.family-b.family||a.id-b.id);
    document.getElementById('count').textContent=`${list.length} of 215 monsters`;
    document.getElementById('results').innerHTML=list.length?cards(list):`${empty('Try a different name, skill, or family.')}<button id="reset" class="button">Reset filters</button>`;
    document.getElementById('reset')?.addEventListener('click',()=>{fields.forEach(id=>document.getElementById(id).value=id==='sort'?'family':'');update();});
    const next=new URLSearchParams();fields.forEach(id=>{const v=document.getElementById(id).value;if(v && !(id==='sort'&&v==='family'))next.set(id,v);});
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
  if(!rows.length) return '<p class="section-copy">No wild encounters listed.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>${showMonster?'Monster':'Gate'}</th><th>Floors</th><th>Level</th><th>Recruitment class</th></tr></thead><tbody>${groupedEncounters(rows).map(r=>`<tr><td>${showMonster?link(r.species_id):gateLink(r.dungeon_id)}</td><td>${r.floor_from===r.floor_through?r.floor_from:`${r.floor_from}–${r.floor_through}`}</td><td>${r.level}</td><td>${recruitmentHTML(r.recruitment_class)}</td></tr>`).join('')}</tbody></table></div>`;
}
function trainerEncounters(id) {
  const rows=D.trainers.filter(r=>r.species_id===id).sort((a,b)=>a.partyLevelFrom-b.partyLevelFrom||a.level-b.level);
  if(!rows.length)return '';
  const bracket=r=>r.partyLevelThrough===null?`${r.partyLevelFrom}+`:`${r.partyLevelFrom}–${r.partyLevelThrough}`;
  return `<h3 class="subheading">Trainer teams</h3><p class="section-copy">Party level total is the combined levels of your active monsters.</p><div class="table-wrap trainer-table-wrap"><table class="trainer-table"><thead><tr><th>Party level total</th><th>Monster level</th><th>Recruitment</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${bracket(r)}</td><td>${r.level}</td><td>${recruitmentHTML(r.recruitment_class)}</td></tr>`).join('')}</tbody></table></div>`;
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
  if(!battles.length)return '<p class="section-copy">No boss encounter listed.</p>';
  return battles.map(b=>`<div class="boss-battle"><div class="boss-portraits">${b.party.map(p=>mon(p.species_id)?`<a href="${monURL(p.species_id)}">${sprite(mon(p.species_id))}</a>`:'<span class="special-portrait">✦</span>').join('')}</div><div><h3>${partyHTML(b.party)}</h3>${b.party.map(p=>`<p>${b.party.length>1?`${e(p.name)} · `:''}Level ${p.level} · ${recruitmentHTML(p.recruitment_class)}</p>`).join('')}</div></div>`).join('');
}
function monsterPage(id) {
  const m=mon(id), encounters=D.encounters.filter(r=>r.species_id===id), base=D.base.filter(r=>r.child===id), special=D.special.filter(r=>r.child===id);
  const outgoingBase=D.base.filter(r=>matches(r.a,m)||matches(r.b,m)), outgoingSpecial=D.special.filter(r=>matches(r.a,m)||matches(r.b,m));
  const events=D.events.filter((r,i,all)=>r.species===id && all.findIndex(v=>v.species===r.species&&v.preset===r.preset&&v.gates[0]===r.gates[0])===i);
  main.innerHTML=`${crumbs(e(m.name))}<section class="monster-hero"><div class="portrait">${sprite(m)}</div><div><h1>${e(m.name)}</h1><p class="description">${e(m.description)}</p><div class="facts"><span><small>Base level cap</small><b>${m.levelCap}</b></span><span><small>Family</small><b class="family-value">${e(family(m.family))}</b></span></div></div></section>
  <nav class="section-nav" aria-label="On this page"><a href="#skills">Skills</a><a href="#breeding">Recipes</a><a href="#as-parent">As a parent</a><a href="#locations">Recruitment & encounters</a></nav>
  <section id="skills"><div class="section-title"><h2>Innate skills</h2></div><div class="skill-grid">${m.skills.map(s=>{const v=skill(s);return `<a class="skill-card" href="${skillURL(s)}"><span class="skill-icon" aria-hidden="true">✧</span><h3>${e(v.name)} ↗</h3><p>${e(v.description)}</p></a>`;}).join('')}</div></section>
  <section id="breeding"><div class="section-title"><h2>Recipes for ${e(m.name)}</h2><span class="muted">${visibleRecipes(base,special).length} ${visibleRecipes(base,special).length===1?'recipe':'recipes'}</span></div><p class="section-copy">Parent order matters. Minimum plus refers to the offspring.</p>${recipeTable(base,special)}</section>
  <section id="as-parent"><div class="section-title"><h2>${e(m.name)} as a parent</h2></div><label class="inline-label">Show <select id="parent-mode"><option value="direct">Direct pairings</option><option value="family">Include family pairings</option></select></label><div id="parent-recipes"></div></section>
  <section id="locations"><div class="section-title"><h2>Recruitment & encounters</h2></div>${encounters.length?'<h3 class="subheading">Wild encounters</h3>':''}${encounterTable(encounters)}${trainerEncounters(id)}${['boss','scripted'].map(kind=>{const list=events.filter(v=>v.kind===kind);return list.length?`<h3 class="subheading">${kind==='boss'?'Boss encounters':'Other encounters'}</h3>${list.map(v=>`<div class="event-row"><b>${v.gates.map(gateLink).join(', ')}</b><span>Level ${v.level} · ${recruitmentHTML(v.recruitmentClass)}</span></div>`).join('')}`:'';}).join('')}</section>
  <div class="page-turn">${id>0?`<a href="${monURL(id-1)}">← ${e(mon(id-1).name)}</a>`:'<span></span>'}<a href="${root}index.html">All monsters</a>${id<214?`<a href="${monURL(id+1)}">${e(mon(id+1).name)} →</a>`:'<span></span>'}</div>`;
  function parentRecipes(){const all=document.getElementById('parent-mode').value==='family';document.getElementById('parent-recipes').innerHTML=recipeTable(outgoingBase.filter(r=>all||r.a===id||r.b===id),outgoingSpecial.filter(r=>all||r.a===id||r.b===id));}
  document.getElementById('parent-mode').addEventListener('change',parentRecipes);parentRecipes();
}
const statNames={hp:'Max HP',mp:'Max MP',attack:'Attack',defense:'Defense',agility:'Agility',intelligence:'Intelligence'};
const skillLink=id=>`<a href="${skillURL(id)}">${e(skill(id).name)}</a>`;
const learningType=s=>({latent:'Innate / inherited',upgrade:'Replacement upgrade',combination:'Combination'})[s.learning.kind];
const statMinimums=s=>Object.entries(s.learning.stats).filter(([,v])=>v).map(([k,v])=>`${statNames[k]} ${v}`).join(' · ')||'No stat minimums';
function skillRequirementsTable(list, showComponents=false) {
  return `<div class="table-wrap"><table><thead><tr><th>Skill</th><th>Level</th><th>Minimum stats</th>${showComponents?'<th>Components</th>':''}</tr></thead><tbody>${list.map(s=>`<tr><td>${skillLink(s.id)}</td><td>${s.learning.level}</td><td>${statMinimums(s)}</td>${showComponents?`<td>${s.learning.prerequisites.map(skillLink).join(' + ')}</td>`:''}</tr>`).join('')}</tbody></table></div>`;
}
function skillFamily(id) {
  let first=skill(id);const seen=new Set([id]);
  while(first.learning.kind==='upgrade') {const prev=skill(first.learning.prerequisites[0]);if(!prev||seen.has(prev.id))break;seen.add(prev.id);first=prev;}
  const chain=[first];seen.clear();seen.add(first.id);
  while(true){const next=D.skills.find(v=>v.learning.kind==='upgrade'&&v.learning.prerequisites[0]===chain[chain.length-1].id);if(!next||seen.has(next.id))break;chain.push(next);seen.add(next.id);}
  return chain;
}
function skillFamilies() {
  const groups=new Map();for(const s of D.skills){const chain=skillFamily(s.id);groups.set(chain[0].id,chain);}return [...groups.values()];
}
function skillsIndex() {
  const groups=skillFamilies();
  main.innerHTML=`${crumbs('Skills')}<section class="simple-hero"><h1>Skills</h1><p class="description">Browse skills, their learning requirements and evolution chains.</p></section><section><div class="section-title"><h2>Skill index</h2><span id="skill-count" class="muted" aria-live="polite"></span></div><form class="filters" role="search"><label class="search"><span aria-hidden="true">⌕</span><input id="skill-search" type="search" placeholder="Search skills, descriptions or components…" aria-label="Search skills, descriptions or components"></label><label><span class="sr-only">Learning route</span><select id="skill-route"><option value="">All learning routes</option><option value="latent">Innate / inherited</option><option value="upgrade">Replacement upgrades</option><option value="combination">Combinations</option></select></label><label><span class="sr-only">Skill sort order</span><select id="skill-sort"><option value="name">Name A–Z</option><option value="level">Minimum level</option></select></label></form><div id="skill-results"></div></section>`;
  function update(){
    const q=document.getElementById('skill-search').value.trim().toLowerCase(), route=document.getElementById('skill-route').value;
    const list=groups.filter(chain=>chain.some(s=>(!route||s.learning.kind===route)&&(!q||[s.name,s.description,...s.learning.prerequisites.map(id=>skill(id).name)].some(v=>v.toLowerCase().includes(q)))));
    list.sort((a,b)=>(document.getElementById('skill-sort').value==='level'?a[0].learning.level-b[0].learning.level:0)||a[0].name.localeCompare(b[0].name));
    document.getElementById('skill-count').textContent=`${list.length} of ${groups.length} skill groups · ${D.skills.length} skills`;
    document.getElementById('skill-results').innerHTML=list.length?`<div class="skill-family-list">${list.map(chain=>`<a class="skill-family-card" href="${skillURL(chain[0].id)}"><h3>${chain.map(s=>e(s.name)).join(' / ')} <span aria-hidden="true">↗</span></h3><p>${chain.map(s=>`Level ${s.learning.level}`).join(' → ')}</p><span class="muted">${chain.length>1?'Evolution chain':learningType(chain[0])}</span></a>`).join('')}</div>`:empty('Try a different skill, component or learning route.');
  }
  main.querySelector('form').addEventListener('submit',ev=>ev.preventDefault());
  ['skill-search','skill-route','skill-sort'].forEach(id=>document.getElementById(id).addEventListener(id==='skill-search'?'input':'change',update));update();
}
function requirementStats(s) {
  return `<dl class="requirement-stats" aria-label="${e(s.name)} minimum requirements"><div class="requirement-level"><dt>Level</dt><dd>${s.learning.level}</dd></div>${Object.entries(statNames).map(([key,label])=>`<div><dt>${label}</dt><dd>${s.learning.stats[key]||'—'}</dd></div>`).join('')}</dl>`;
}
function skillsPage(id) {
  const s=skill(id), chain=skillFamily(id), familyIDs=new Set(chain.map(v=>v.id));
  const list=D.monsters.filter(m=>m.skills.some(v=>familyIDs.has(v)));
  const combinations=D.skills.filter(v=>v.learning.kind==='combination'&&v.learning.prerequisites.some(p=>familyIDs.has(p)));
  const title=chain.map(v=>v.name).join(' / ');
  main.innerHTML=`${crumbs(`<a href="${root}skills.html">Skills</a><span>/</span>${e(title)}`)}<section class="simple-hero"><h1 class="skill-family-title">${e(title)}</h1>${chain.length===1?`<p class="description">${e(s.description)}</p><span class="badge">${learningType(s)}</span>`:''}</section>
  <nav class="section-nav" aria-label="On this page">${chain.length>1?'<a href="#advancement">Advancement</a>':''}<a href="#requirements">Learning requirements</a><a href="#components">Used as a component</a><a href="#innate">Innate monsters</a></nav>
  ${chain.length>1?`<section id="advancement"><div class="section-title"><h2>Advancement</h2></div><ol class="skill-chain" aria-label="Upgrade chain">${chain.map(v=>`<li>${e(v.name)}<small>Level ${v.learning.level}</small></li>`).join('')}</ol><p class="section-copy">Each stage replaces the previous skill when learned through this chain.</p></section>`:''}
  <section id="requirements"><div class="section-title"><h2>Learning requirements</h2></div>${chain.map(v=>`<article class="skill-stage" id="stage-${v.id}">${chain.length>1?`<h3>${e(v.name)}</h3><p class="section-copy">${e(v.description)}</p>`:''}${requirementStats(v)}${v.learning.kind==='combination'?`<h3 class="subheading">Combination recipe</h3><p class="skill-recipe">${v.learning.prerequisites.map(skillLink).join(' <span aria-hidden="true">+</span> ')} <span aria-hidden="true">→</span> <b>${e(v.name)}</b></p><p class="section-copy">All components must be known by the same monster. Learning this skill through the combination does not consume its components.</p>`:''}</article>`).join('')}<p class="fine">All listed minimums must be met. A dash means no minimum. Stats are checked before that level’s growth is applied.</p>
  <details class="learning-details"><summary>How learning works</summary><p>Skills already in the innate or inherited pool can be learned without the listed components; the level and stat minimums still apply. Combination recipes and upgrades check the monster’s saved skills, so a newly learned skill cannot unlock another step during that same level-up. An older skill can still count as a component even if it is being upgraded that level. There is no separate learning-chance roll. If more than eight skills remain, choose which eight to keep.</p></details></section>
  <section id="components"><div class="section-title"><h2>Used as a component</h2></div>${combinations.length?skillRequirementsTable(combinations,true):'<p class="section-copy">No combination recipes use these skills.</p>'}</section>
  <section id="innate"><div class="section-title"><h2>Monsters with ${chain.length>1?'these skills':'this skill'} innately</h2><span class="muted">${list.length} monsters</span></div>${list.length?cards(list):'<p class="section-copy">No species lists these skills directly as innate skills.</p>'}</section>`;
}
function guidesPage() {
  main.innerHTML=`${crumbs('Guides')}<section class="simple-hero"><h1>Guides</h1><p class="description">Articles on breeding, encounters and building your team.</p></section><section><div class="guide-grid">${D.guides.map(g=>`<a class="guide-card" href="${root}guides/${g.slug}.html"><span class="status">${g.status==='stub'?'Coming soon':'Guide'}</span><h2>${e(g.title)} ↗</h2><p>${e(g.summary)}</p></a>`).join('')}</div></section>`;
}
function guidePage(slug) {
  const g=D.guides.find(v=>v.slug===slug);
  if(!g){main.innerHTML=empty('This guide is not available.');return;}
  main.innerHTML=`${crumbs(`<a href="${root}guides.html">Guides</a><span>/</span>${e(g.title)}`)}<article class="about"><h1>${e(g.title)}</h1><p class="description">${e(g.summary)}</p>${g.status==='stub'?'<span class="status">Coming soon</span><p>This guide is planned. The full article will be added here.</p>':(g.paragraphs||[]).map(p=>`<p>${e(p)}</p>`).join('')}<h2>Explore the field guide</h2><ul>${g.related.map(v=>`<li><a href="${root}${e(v.path)}">${e(v.label)}</a></li>`).join('')}</ul></article>`;
}
function gatesPage() {
  main.innerHTML=`${crumbs('Gates')}<section class="simple-hero"><p class="eyebrow">THE TRAVELER’S ATLAS</p><h1>Beyond the gates.</h1><p class="description">Identify a gate by its boss. Explore its monsters floor by floor.</p><p class="section-copy">${D.gates.filter(g=>g.named).length} gate names mapped. Wild floor ranges stop before each gate’s boss destination. Family tags identify gates whose ordinary wild encounters all belong to one family. Bosses may belong to a different family.</p></section><section><div class="section-title"><h2>Gate & boss index</h2><span class="muted">${D.gates.length} gates</span></div><div class="table-wrap"><table class="gate-index"><thead><tr><th>Gate</th><th>Boss / alternatives</th><th>Wild floors</th><th>Wild species</th></tr></thead><tbody>${D.gates.map(g=>`<tr><td>${gateLink(g.id)}${g.familyTheme!==null?`<br>${badge(g.familyTheme)}`:''}${!g.named&&g.status==='normal'?'<br><small class="muted">Name to confirm</small>':''}</td><td>${bossSummary(g)}</td><td>1–${g.floorCount-1}</td><td>${new Set(D.encounters.filter(r=>r.dungeon_id===g.id).map(r=>r.species_id)).size}</td></tr>`).join('')}</tbody></table></div><p class="fine">The index lists species and parties referenced by destination-room event scripts, including connected boss rooms. Alternatives and repeat branches are not necessarily a required sequence.</p></section>`;
}
function gatePage(id) {
  const g=gate(id), rows=D.encounters.filter(r=>r.dungeon_id===id);
  main.innerHTML=`${crumbs(`<a href="${root}gates.html">Gates</a><span>/</span>${e(g.name)}`)}<section class="simple-hero"><h1>${e(g.name)}</h1><span class="status ${g.named?'known':''}">${g.named?'Name mapped':'Name to confirm'}</span> ${g.familyTheme!==null?badge(g.familyTheme):''}<p class="section-copy">${e(g.nameSource)}</p><div class="facts"><span><small>Wild floors</small><b>1–${g.floorCount-1}</b></span><span><small>Boss destination</small><b>${g.floorCount}</b></span><span><small>Wild species</small><b>${new Set(rows.map(r=>r.species_id)).size}</b></span></div>${g.conditions?`<div class="notice"><b>Location notes</b><p>${e(g.conditions)}</p></div>`:''}</section><section><div class="section-title"><div><h2>Boss encounters</h2></div></div>${bossDetails(g)}</section><section><div class="section-title"><div><h2>Wild encounters by floor</h2></div><label class="inline-label">Floor <select id="encounter-floor" aria-label="Encounter floor"><option value="">All wild floors</option>${Array.from({length:g.floorCount-1},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></label></div><p class="section-copy">Encounter bands are clipped to floors 1–${g.floorCount-1}; floor ${g.floorCount} is the fixed destination. Repeated species are combined across adjacent bands. Special rooms and event overrides can change a particular floor.</p><div id="floor-encounters"></div></section>${g.otherBattles.length?`<section><h2>Other encounters</h2><p class="section-copy">These fights belong to the destination’s events and are separate from the wild encounter table and principal boss.</p>${bossDetails(g,true)}</section>`:''}`;
  function updateFloor(){const n=Number(document.getElementById('encounter-floor').value);document.getElementById('floor-encounters').innerHTML=encounterTable(n?rows.filter(r=>r.floor_from<=n&&r.floor_through>=n).map(r=>({...r,floor_from:n,floor_through:n})):rows,true);}
  document.getElementById('encounter-floor').addEventListener('change',updateFloor);updateFloor();
}
function about() {
  main.innerHTML=`${crumbs('About the data')}<article class="about"><p class="eyebrow">AN OPEN FIELD NOTEBOOK</p><h1>Recovered from the game.<br><em>Room to keep learning.</em></h1><p class="description">This guide connects the monster, text, graphics, breeding and encounter data recovered by the DWM disassembly project.</p><h2>What’s here</h2><p>All 215 in-game bestiary species have names, battle sprites, descriptions and innate skill lists. The 112 distinct innate skills have original descriptions. Breeding uses the recovered base table and 825 ordered special rules. Wild encounter tables link 153 species across ${D.gates.length} gates.</p><h2>What remains uncertain</h2><p>All 31 normal gate names are mapped. Entry requirements and some scripted acquisition paths still need tracing. Wild encounters are now restricted to the generated floors before each boss destination. Special-room substitutions and event overrides remain separate. No wild entry means no entry in our recovered index; it does not mean a monster is unobtainable. Six special or placeholder species records outside the in-game bestiary are omitted.</p><p>Numbered names distinguish monster forms that share a name in the game. Descriptions preserve the game’s original wording. Skill pages include learning thresholds, replacement chains and combination recipes. Minimum levels still require all listed stats and any required saved skills.</p><h2>Reading breeding rules</h2><p>Parents are ordered. The first matching special rule wins; base recipes are fallbacks. The minimum plus belongs to the calculated offspring, and can depend on parent levels and plus values. A listed rule does not promise that every member of a parent family yields that child. Some monsters have no explicit recipe. If no special or base rule matches, the selector returns the first parent’s species; other acquisition paths also exist.</p><h2>Contribute gate names</h2><p>Edit <code>bestiary/locations.json</code>, keyed by decimal dungeon selector ID. Add a name, conditions and source note, then run <code>python3 bestiary/scripts/build.py</code>. These annotations live entirely inside the bestiary directory.</p><h2>Source notes</h2><ul><li>Species / innate skills: bank $03 species table.</li><li>Names and skill names: bank $41 text resources.</li><li>Descriptions: bank $4D bestiary index and bank $56 skill index.</li><li>Sprites: editable battle graphics PNGs and manifest.</li><li>Skill learning: bank $06 learning requirements and the level-up caller in bank $51.</li><li>Recipes: bank $16 base and special tables.</li><li>Locations: encounter index joined to bank $16 destination-floor limits; destination event scripts and connected fixed-room warps; local annotations.</li></ul><p>The exporter reads the original local ROM for species, recipes and skill parameters, and checked-in reference exports for descriptions and encounters. Rebuild the appropriate reference exports when changing those sources. Unassembled source edits do not automatically appear here.</p><p class="fine">Site build: <code>${e(document.body.dataset.build)}</code>. Reference ROM MD5: <code>${e(D.romMd5)}</code>. The published site includes extracted guide data and sprites, never the ROM. An unofficial fan project; game artwork and names belong to their respective owners.</p></article>`;
}
const type=document.body.dataset.page, id=Number(document.body.dataset.id);
({index,monster:()=>monsterPage(id),skill:()=>skillsPage(id),skills:skillsIndex,guides:guidesPage,guide:()=>guidePage(document.body.dataset.id),gates:gatesPage,gate:()=>gatePage(id),about}[type]||index)();

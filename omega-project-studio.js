
/* ============================================================================ SYD OMEGA 91717 — OMEGA PROJECT STUDIO v1.0 AI-native creation engine. User describes intent, system generates: Concept → Specification → Visual Identity → Content Structure → Interactive Module → Database Model → Permissions → Monetization → Review Drop onto any page: <script src=omega-project-studio.js></script> Or open project-studio.html for the full studio. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaProjectStudio) return;
window.__omegaProjectStudio = true;
const GENERATORS = {
educational_game: {
name: 'Educational Game', fields: ['subject', 'target_age', 'learning_objectives', 'game_mechanic', 'platform'], steps: ['concept', 'mechanics', 'content', 'quiz', 'visuals', 'database', 'monetization']
}, course: {
name: 'Course', fields: ['subject', 'level', 'modules', 'outcome', 'assessment_type'], steps: ['syllabus', 'modules', 'quizzes', 'certification', 'visuals', 'database', 'pricing']
}, media_series: {
name: 'Media Series', fields: ['genre', 'episodes', 'duration', 'target_audience', 'distribution'], steps: ['concept', 'episodes', 'scripts', 'visuals', 'production', 'database', 'monetization']
}, interactive_experience: {
name: 'Interactive Experience', fields: ['type', 'audience', 'interaction_model', 'duration', 'platform'], steps: ['concept', 'flow', 'content', 'interactions', 'visuals', 'database', 'monetization']
}, marketplace_product: {
name: 'Marketplace Product', fields: ['product', 'category', 'price', 'stock', 'shipping'], steps: ['listing', 'photos', 'description', 'pricing', 'inventory', 'database', 'promotion']
}, platform_feature: {
name: 'Platform Feature', fields: ['feature', 'problem', 'solution', 'impact', 'effort'], steps: ['spec', 'wireframes', 'logic', 'ui', 'database', 'permissions', 'rollout']
}
};
const STEP_TEMPLATES = {
concept: function(data) {
return {
title: data.subject || data.feature || 'Untitled', summary: 'A ' + (data.type || 'project') + ' designed for ' + (data.audience || data.target_age || 'members') + '.', objectives: (data.learning_objectives || data.outcome || data.problem || '').split(',').map(function(s) {
return s.trim();
}).filter(Boolean)
};
}, mechanics: function(data) {
return {
core_loop: 'Player engages with content, earns points, unlocks next level.', progression: 'Linear with branching at decision gates.', rewards: 'Badges, authority points, unlockable content.'
};
}, content: function(data) {
return {
modules: (data.modules || '5').split(',').map(function(s) {
return s.trim();
}), quiz_count: 3 + (window.crypto && crypto.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] % 5 : Date.now() % 5), difficulty_curve: 'Progressive — easy to challenging'
};
}, quiz: function(data) {
return {
types: ['Multiple choice', 'True/False', 'Fill in blank', 'Matching'], time_limit: '5 minutes per quiz', passing_score: '70%'
};
}, visuals: function(data) {
return {
theme: 'Sovereign dark with gold accents', emblem: '◈', color: '#C9A84C', layout: 'Card-based with orbital navigation'
};
}, database: function(data) {
return {
tables: ['progress', 'scores', 'achievements', 'content', 'users'], relations: 'User → Progress → Scores → Achievements', rls: 'Authenticated users see own data only'
};
}, monetization: function(data) {
return {
model: data.price ? 'One-time purchase: $' + data.price : 'Freemium — free base, premium unlocks', revenue_share: 'Creator 70% · Platform 25% · Reserve 5%', pricing_tiers: ['Free', 'Standard', 'Sovereign']
};
}, permissions: function(data) {
return {
visibility: 'Members only', edit: 'Creator + Moderators', delete: 'Creator only', audit: 'Full change log retained'
};
}
};
function generateProject(type, data) {
var gen = GENERATORS[type];
if (!gen) return null;
var project = {
id: 'proj_' + Date.now() + '_' + (window.crypto && crypto.randomUUID ? crypto.randomUUID().replace(/-/g,'').slice(0,12) : Date.now().toString(36)), type: type, name: gen.name, input: data, created: Date.now(), status: 'draft', steps: {}
};
gen.steps.forEach(function(step) {
if (STEP_TEMPLATES[step]) {
project.steps[step] = STEP_TEMPLATES[step](data);
}
});
return project;
}
function saveProject(proj) {
var projects = [];
try {
projects = JSON.parse(localStorage.getItem('omega:projects') || '[]');
}
catch (e) {
}
var idx = projects.findIndex(function(p) {
return p.id === proj.id;
});
if (idx >= 0) projects[idx] = proj;
else projects.push(proj);
localStorage.setItem('omega:projects', JSON.stringify(projects));
return proj;
}
function loadProjects() {
try {
return JSON.parse(localStorage.getItem('omega:projects') || '[]');
}
catch (e) {
return [];
}
}
window.OmegaProjectStudio = {
generators: GENERATORS, generate: generateProject, save: saveProject, load: loadProjects, get: function(id) {
return loadProjects().find(function(p) {
return p.id === id;
});
}, delete: function(id) {
var projects = loadProjects().filter(function(p) {
return p.id !== id;
});
localStorage.setItem('omega:projects', JSON.stringify(projects));
return projects;
}, renderStudio: function(el) {
if (!el) return;
el.replaceChildren();
function node(tag, text, css, attrs) { var n=document.createElement(tag); if(text!=null)n.textContent=text; if(css)n.style.cssText=css; if(attrs)Object.keys(attrs).forEach(function(k){n.setAttribute(k,attrs[k]);}); return n; }
var title=node('div','OMEGA PROJECT STUDIO · AI-NATIVE CREATION',"font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:12px");
var grid=node('div',null,"display:grid;grid-template-columns:300px 1fr;gap:20px"), left=node('div'), previewEl=node('div',null,null,{id:'ops-preview'});
var typeWrap=node('div',null,"margin-bottom:12px"), label=node('label','PROJECT TYPE',"display:block;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:4px;text-transform:uppercase");
var typeSelect=node('select',null,"width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:12px;outline:none",{class:'ops-type'});
Object.keys(GENERATORS).forEach(function(t){typeSelect.appendChild(node('option',GENERATORS[t].name,null,{value:t}));});
typeWrap.appendChild(label);typeWrap.appendChild(typeSelect);
var fieldsEl=node('div',null,null,{id:'ops-fields'});
var generate=node('button','GENERATE PROJECT',"font-family:var(--M);font-size:12px;letter-spacing:2px;padding:8px 16px;background:none;border:1px solid rgba(201,168,76,.3);color:var(--gold);border-radius:2px;cursor:pointer;margin-top:12px",{class:'ops-generate',type:'button'});
left.appendChild(typeWrap);left.appendChild(fieldsEl);left.appendChild(generate);grid.appendChild(left);grid.appendChild(previewEl);el.appendChild(title);el.appendChild(grid);
function renderFields(type){var gen=GENERATORS[type];if(!gen)return;fieldsEl.replaceChildren();gen.fields.forEach(function(f){var wrap=node('div',null,"margin-bottom:10px"),lab=node('label',f,"display:block;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:4px;text-transform:uppercase"),inp=node('input',null,"width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:12px;outline:none",{type:'text',class:'ops-field','data-field':f});inp.id='omega-field-'+f;lab.htmlFor=inp.id;inp.placeholder='Enter '+f+'…';wrap.appendChild(lab);wrap.appendChild(inp);fieldsEl.appendChild(wrap);});}
renderFields(typeSelect.value);typeSelect.addEventListener('change',function(){renderFields(typeSelect.value);});
generate.addEventListener('click',function(){var data={};fieldsEl.querySelectorAll('.ops-field').forEach(function(inp){data[inp.dataset.field]=String(inp.value||'').trim().slice(0,2000);});var proj=generateProject(typeSelect.value,data);if(proj){saveProject(proj);renderPreview(previewEl,proj);document.dispatchEvent(new CustomEvent('omega:project-generated',{detail:proj}));}});
}, renderPreview: function(el, proj) {
if(!el||!proj)return;
el.replaceChildren();
function node(tag,text,css,attrs){var n=document.createElement(tag);if(text!=null)n.textContent=text;if(css)n.style.cssText=css;if(attrs)Object.keys(attrs).forEach(function(k){n.setAttribute(k,attrs[k]);});return n;}
var glass=node('div');glass.className='glass';glass.style.cssText='padding:16px';
glass.appendChild(node('div','GENERATED SPECIFICATION',"font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:10px"));
var subject=proj.input&&(proj.input.subject||proj.input.feature||proj.input.product)||'Untitled';
glass.appendChild(node('div',String(subject),"font-family:var(--D);font-size:clamp(16px,2vw,22px);color:var(--gold);margin-bottom:12px"));
glass.appendChild(node('div','TYPE: '+String(proj.name||'Unknown')+' · ID: '+String(proj.id||'unknown'),"font-family:var(--M);font-size:12px;color:var(--muted);margin-bottom:16px"));
Object.entries(proj.steps||{}).forEach(function(entry){var key=entry[0],val=entry[1],wrap=node('div',null,'margin-bottom:12px;padding:10px;background:rgba(201,168,76,.03);border:1px solid rgba(201,168,76,.08);border-radius:3px');wrap.appendChild(node('div',String(key),"font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;text-transform:uppercase"));wrap.appendChild(node(val&&typeof val==='object'?'pre':'div',val&&typeof val==='object'?JSON.stringify(val,null,2):String(val==null?'':val),"font-family:var(--M);font-size:12px;color:var(--muted);overflow-x:auto;white-space:pre-wrap;word-break:break-word"));glass.appendChild(wrap);});
var actions=node('div',null,'margin-top:12px;display:flex;gap:8px;flex-wrap:wrap'), save=node('button','SAVE TO PROJECTS',"font-family:var(--M);font-size:12px;letter-spacing:1px;padding:6px 12px;background:none;border:1px solid rgba(63,178,127,.3);color:var(--green);border-radius:2px;cursor:pointer",{class:'ops-save',type:'button'}), exp=node('button','EXPORT JSON',"font-family:var(--M);font-size:12px;letter-spacing:1px;padding:6px 12px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer",{class:'ops-export',type:'button'});actions.appendChild(save);actions.appendChild(exp);glass.appendChild(actions);el.appendChild(glass);
save.addEventListener('click',function(){saveProject(proj);alert('Project saved to local storage');});exp.addEventListener('click',function(){var blob=new Blob([JSON.stringify(proj,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=String(proj.id||'omega-project')+'.json';a.click();setTimeout(function(){URL.revokeObjectURL(url);},0);});
}, renderProjectList: function(el) {
if(!el)return;
el.replaceChildren();
function node(tag,text,css,attrs){var n=document.createElement(tag);if(text!=null)n.textContent=text;if(css)n.style.cssText=css;if(attrs)Object.keys(attrs).forEach(function(k){n.setAttribute(k,attrs[k]);});return n;}
var projects=loadProjects();
if(!projects.length){var empty=node('div');empty.className='glass';empty.style.cssText='padding:20px;text-align:center';empty.appendChild(node('div','No projects yet. Use the studio to generate one.',"font-family:var(--M);font-size:12px;color:var(--muted)"));el.appendChild(empty);return;}
var grid=node('div',null,'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px');
projects.forEach(function(p){var card=node('div');card.className='glass';card.style.cssText='padding:14px;cursor:pointer';card.dataset.projId=String(p.id||'');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label','Open project '+String(p.name||'Project'));card.appendChild(node('div',String(p.name||'PROJECT').toUpperCase(),"font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:6px"));var subject=p.input&&(p.input.subject||p.input.feature||p.input.product)||'Untitled';card.appendChild(node('div',String(subject),"font-family:var(--M);font-size:12px;color:var(--ink);margin-bottom:4px"));card.appendChild(node('div',String(new Date(Number(p.created)||Date.now()).toLocaleDateString())+' · '+Object.keys(p.steps||{}).length+' steps',"font-family:var(--M);font-size:12px;color:var(--muted)"));function open(){var proj=loadProjects().find(function(x){return x.id===card.dataset.projId;}),target=document.querySelector('[data-omega-project-preview]');if(proj&&target&&window.OmegaProjectStudio.renderPreview)window.OmegaProjectStudio.renderPreview(target,proj);}card.addEventListener('click',open);card.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});grid.appendChild(card);});
el.appendChild(grid);
};
document.addEventListener('DOMContentLoaded', function() {
var studio = document.querySelector('[data-omega-project-studio]');
if (studio) window.OmegaProjectStudio.renderStudio(studio);
var list = document.querySelector('[data-omega-project-list]');
if (list) window.OmegaProjectStudio.renderProjectList(list);
});
document.dispatchEvent(new CustomEvent('omega:project-studio-ready', {
detail: {
version: '1.0', generators: Object.keys(GENERATORS).length
}
}));
})();

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
}), quiz_count: Math.floor(Math.random() * 5) + 3, difficulty_curve: 'Progressive — easy to challenging'
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
id: 'proj_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), type: type, name: gen.name, input: data, created: Date.now(), status: 'draft', steps: {}
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
var typeOptions = Object.keys(GENERATORS).map(function(t) {
var g = GENERATORS[t];
return '<option value=' + t + '>' + g.name + '</option>';
}).join('');
el.innerHTML = '<div style=font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:12px>OMEGA PROJECT STUDIO · AI-NATIVE CREATION</div>' + '<div style="display:grid;grid-template-columns:300px 1fr;gap:20px">' + '<div>' + '<div style=margin-bottom:12px><label style=display:block;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:4px>PROJECT TYPE</label><select class=ops-type style="width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:12px;outline:none">' + typeOptions + '</select></div>' + '<div id=ops-fields></div>' + '<button class=ops-generate style="font-family:var(--M);font-size:12px;letter-spacing:2px;padding:8px 16px;background:none;border:1px solid rgba(201,168,76,.3);color:var(--gold);border-radius:2px;cursor:pointer;margin-top:12px">GENERATE PROJECT</button>' + '</div>' + '<div id=ops-preview></div>' + '</div>';
var typeSelect = el.querySelector('.ops-type');
var fieldsEl = el.querySelector('#ops-fields');
var previewEl = el.querySelector('#ops-preview');
function renderFields(type) {
var gen = GENERATORS[type];
if (!gen) return;
fieldsEl.innerHTML = gen.fields.map(function(f) {
return '<div style=margin-bottom:10px><label style=display:block;font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:4px;text-transform:uppercase>' + f + '</label><input type=text class=ops-field data-field=' + f + ' placeholder="Enter ' + f + '…" style="width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:12px;outline:none"></div>';
}).join('');
}
renderFields(typeSelect.value);
typeSelect.addEventListener('change', function() {
renderFields(typeSelect.value);
});
el.querySelector('.ops-generate').addEventListener('click', function() {
var inputs = fieldsEl.querySelectorAll('.ops-field');
var data = {};
inputs.forEach(function(inp) {
data[inp.dataset.field] = inp.value;
});
var proj = generateProject(typeSelect.value, data);
if (proj) {
saveProject(proj);
renderPreview(previewEl, proj);
document.dispatchEvent(new CustomEvent('omega:project-generated', {
detail: proj
}));
}
});
}, renderPreview: function(el, proj) {
if (!el || !proj) return;
var stepsHtml = Object.entries(proj.steps).map(function([key, val]) {
var content = typeof val === 'object' ? '<pre style=font-family:var(--M);font-size:12px;color:var(--muted);overflow-x:auto>' + JSON.stringify(val, null, 2) + '</pre>' : '<div style=font-family:var(--M);font-size:12px;color:var(--ink)>' + val + '</div>';
return '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,.03);border:1px solid rgba(201,168,76,.08);border-radius:3px"><div style=font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;text-transform:uppercase>' + key + '</div>' + content + '</div>';
}).join('');
el.innerHTML = '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>GENERATED SPECIFICATION</div><div style=font-family:var(--D);font-size:clamp(16px,2vw,22px);color:var(--gold);margin-bottom:12px>' + (proj.input.subject || proj.input.feature || proj.input.product || 'Untitled') + '</div><div style=font-family:var(--M);font-size:12px;color:var(--muted);margin-bottom:16px>TYPE: ' + proj.name + ' · ID: ' + proj.id + '</div>' + stepsHtml + '<div style=margin-top:12px;display:flex;gap:8px><button class=ops-save style="font-family:var(--M);font-size:12px;letter-spacing:1px;padding:6px 12px;background:none;border:1px solid rgba(63,178,127,.3);color:var(--green);border-radius:2px;cursor:pointer">SAVE TO PROJECTS</button><button class=ops-export style="font-family:var(--M);font-size:12px;letter-spacing:1px;padding:6px 12px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer">EXPORT JSON</button></div></div>';
el.querySelector('.ops-save').addEventListener('click', function() {
saveProject(proj);
alert('Project saved to local storage');
});
el.querySelector('.ops-export').addEventListener('click', function() {
var blob = new Blob([JSON.stringify(proj, null, 2)], {
type: 'application/json'
});
var url = URL.createObjectURL(blob);
var a = document.createElement('a');
a.href = url;
a.download = proj.id + '.json';
a.click();
URL.revokeObjectURL(url);
});
}, renderProjectList: function(el) {
if (!el) return;
var projects = loadProjects();
if (projects.length === 0) {
el.innerHTML = '<div class=glass style=padding:20px;text-align:center><div style=font-family:var(--M);font-size:12px;color:var(--muted)>No projects yet. Use the studio to generate one.</div></div>';
return;
}
el.innerHTML = '<div style=display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px>' + projects.map(function(p) {
return '<div class=glass style=padding:14px;cursor:pointer data-proj-id=' + p.id + '><div style=font-family:var(--M);font-size:12px;letter-spacing:2px;color:var(--muted);margin-bottom:6px>' + p.name.toUpperCase() + '</div><div style=font-family:var(--M);font-size:12px;color:var(--ink);margin-bottom:4px>' + (p.input.subject || p.input.feature || p.input.product || 'Untitled') + '</div><div style=font-family:var(--M);font-size:12px;color:var(--muted)>' + new Date(p.created).toLocaleDateString() + ' · ' + Object.keys(p.steps).length + ' steps</div></div>';
}).join('') + '</div>';
el.querySelectorAll('[data-proj-id]').forEach(function(card) {
card.addEventListener('click', function() {
var proj = loadProjects().find(function(p) {
return p.id === card.dataset.projId;
});
if (proj && window.OmegaProjectStudio.renderPreview) {
window.OmegaProjectStudio.renderPreview(document.querySelector('[data-omega-project-preview]'), proj);
}
});
});
}
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
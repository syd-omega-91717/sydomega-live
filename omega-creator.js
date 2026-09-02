
/* ============================================================================ SYD OMEGA 91717 — OMEGA CREATOR / IDEA FORGE v1.0 Users become creators. Proposal → Validation → Moderation → Build → Publish. Non-destructive. Drop onto any page: <script src=omega-creator.js></script> Or open creator.html for the full creation studio. ============================================================================ */
 (function () {
'use strict';
if (window.__omegaCreator) return;
window.__omegaCreator = true;
const IDEA_TYPES = [ 'concept', 'content', 'game', 'course', 'quiz', 'media', 'service', 'product', 'feature', 'investment' ];
const STAGES = [ {
key: 'idea', label: 'IDEA', color: 'var(--gold)', desc: 'Initial proposal'
}, {
key: 'validation', label: 'VALIDATION', color: 'var(--cyan)', desc: 'Community votes'
}, {
key: 'moderation', label: 'MODERATION', color: 'var(--purple)', desc: 'Content review'
}, {
key: 'legal', label: 'LEGAL', color: 'var(--solar)', desc: 'Legal review'
}, {
key: 'technical', label: 'TECHNICAL', color: 'var(--green)', desc: 'Feasibility check'
}, {
key: 'business', label: 'BUSINESS', color: 'var(--gold)', desc: 'Business case'
}, {
key: 'approval', label: 'APPROVAL', color: 'var(--green)', desc: 'Green light'
}, {
key: 'build', label: 'BUILD', color: 'var(--cyan)', desc: 'In development'
}, {
key: 'publish', label: 'PUBLISH', color: 'var(--gold)', desc: 'Live'
}, {
key: 'revenue', label: 'REVENUE', color: 'var(--green)', desc: 'Monetized'
}
];
const TEMPLATES = {
concept: {
title: 'New Concept', fields: ['problem', 'solution', 'audience', 'differentiator']
}, content: {
title: 'Content Piece', fields: ['title', 'format', 'topic', 'audience', 'medium']
}, game: {
title: 'Game Design', fields: ['genre', 'mechanics', 'story', 'platform', 'monetization']
}, course: {
title: 'Course', fields: ['subject', 'level', 'modules', 'outcome', 'assessment']
}, quiz: {
title: 'Quiz/Exam', fields: ['topic', 'difficulty', 'questions', 'scoring', 'time']
}, media: {
title: 'Media Production', fields: ['type', 'duration', 'topic', 'audience', 'distribution']
}, service: {
title: 'Service Offer', fields: ['service', 'deliverable', 'pricing', 'audience', 'timeline']
}, product: {
title: 'Marketplace Product', fields: ['product', 'category', 'price', 'stock', 'shipping']
}, feature: {
title: 'Platform Feature', fields: ['feature', 'problem', 'solution', 'impact', 'effort']
}, investment: {
title: 'Investment Proposal', fields: ['opportunity', 'amount', 'return', 'risk', 'timeline']
}
};

/* ─── State management ─── */
 function loadIdeas() {
try {
return JSON.parse(localStorage.getItem('omega:ideas') || '[]');
}
catch (e) {
return [];
}
}
function saveIdeas(ideas) {
localStorage.setItem('omega:ideas', JSON.stringify(ideas));
}

/* ─── Create idea ─── */
 function createIdea(type, data) {
const ideas = loadIdeas();
const idea = {
id: 'idea_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8), type, data, stage: 'idea', created: Date.now(), updated: Date.now(), votes: 0, votesBy: [], comments: [], status: 'draft'
};
ideas.push(idea);
saveIdeas(ideas);
document.dispatchEvent(new CustomEvent('omega:idea-created', {
detail: idea
}));
return idea;
}

/* ─── Stage progression ─── */
 function advanceStage(id) {
const ideas = loadIdeas();
const idx = ideas.findIndex(i => i.id === id);
if (idx === -1) return null;
const currentIdx = STAGES.findIndex(s => s.key === ideas[idx].stage);
if (currentIdx >= STAGES.length - 1) return ideas[idx];
ideas[idx].stage = STAGES[currentIdx + 1].key;
ideas[idx].updated = Date.now();
saveIdeas(ideas);
document.dispatchEvent(new CustomEvent('omega:idea-advanced', {
detail: ideas[idx]
}));
return ideas[idx];
}

/* ─── Vote ─── */
 function voteIdea(id, userId) {
const ideas = loadIdeas();
const idea = ideas.find(i => i.id === id);
if (!idea) return null;
if (idea.votesBy.includes(userId)) return idea;
idea.votes++;
idea.votesBy.push(userId);
idea.updated = Date.now();
saveIdeas(ideas);
document.dispatchEvent(new CustomEvent('omega:idea-voted', {
detail: idea
}));
return idea;
}

/* ─── Comment ─── */
 function commentIdea(id, userId, text) {
const ideas = loadIdeas();
const idea = ideas.find(i => i.id === id);
if (!idea) return null;
idea.comments.push({
userId, text, time: Date.now()
});
idea.updated = Date.now();
saveIdeas(ideas);
document.dispatchEvent(new CustomEvent('omega:idea-commented', {
detail: idea
}));
return idea;
}

/* ─── Export API ─── */
 window.OmegaCreator = {
types: IDEA_TYPES, stages: STAGES, templates: TEMPLATES, load: loadIdeas, create: createIdea, advance: advanceStage, vote: voteIdea, comment: commentIdea, get: (id) => loadIdeas().find(i => i.id === id), byStage: (stage) => loadIdeas().filter(i => i.stage === stage), byType: (type) => loadIdeas().filter(i => i.type === type), delete: (id) => {
const ideas = loadIdeas().filter(i => i.id !== id);
saveIdeas(ideas);
return ideas;
}, stats: () => {
const ideas = loadIdeas();
const byStage = {};
STAGES.forEach(s => byStage[s.key] = 0);
ideas.forEach(i => {
byStage[i.stage] = (byStage[i.stage] || 0) + 1;
});
return {
total: ideas.length, byStage, byType: IDEA_TYPES.reduce((a,t)=>{a[t]=ideas.filter(i=>i.type===t).length;return a;},{})
};
}, 
/* Render a creation form into a DOM element */
 renderForm: function(el, opts) {
if (!el) return;
opts = opts || {};
var type = opts.type || 'concept';
var tmpl = TEMPLATES[type];
var fieldsHtml = tmpl.fields.map(function(f) {
return '<div style=margin-bottom:12px><label style=display:block;font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:4px;text-transform:uppercase>'+f+'</label><input type=text class=oc-input data-field='+f+' placeholder=Enter '+f+'… style=width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:11px;outline:none></div>';
}).join('');
var typeOptions = IDEA_TYPES.map(function(t) {
return '<option value='+t+(t===type?' selected':'')+'>'+t.toUpperCase()+'</option>';
}).join('');
el.innerHTML = '<div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:12px>OMEGA CREATOR · IDEA FORGE</div>' + '<div style=margin-bottom:12px><label style=display:block;font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:4px>TYPE</label><select class=oc-type style=width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:8px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:11px;outline:none>'+typeOptions+'</select></div>' + fieldsHtml + '<button class=oc-submit style=font-family:var(--M);font-size:8px;letter-spacing:2px;padding:8px 16px;background:none;border:1px solid rgba(201,168,76,.3);color:var(--gold);border-radius:2px;cursor:pointer;transition:.12s>FORGE IDEA</button>';
var typeSelect = el.querySelector('.oc-type');
if (typeSelect) {
typeSelect.addEventListener('change', function() {
window.OmegaCreator.renderForm(el, {
type: typeSelect.value
});
});
}
var submitBtn = el.querySelector('.oc-submit');
if (submitBtn) {
submitBtn.addEventListener('click', function() {
var inputs = el.querySelectorAll('.oc-input');
var data = {};
inputs.forEach(function(inp) {
data[inp.dataset.field] = inp.value;
});
var idea = createIdea(typeSelect ? typeSelect.value : type, data);
if (opts.onCreate) opts.onCreate(idea);
});
}
}, 
/* Render a pipeline board into a DOM element */
 renderBoard: function(el) {
if (!el) return;
var ideas = loadIdeas();
var html = '<div style=display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;overflow-x:auto>';
STAGES.forEach(function(stage) {
var stageIdeas = ideas.filter(function(i) {
return i.stage === stage.key;
});
html += '<div style=min-width:160px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:'+stage.color+';margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(201,168,76,.1)>'+stage.label+' <span style=color:var(--muted)>'+stageIdeas.length+'</span></div>';
stageIdeas.forEach(function(idea) {
html += '<div class=oc-card data-id='+idea.id+' style=background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.1);border-radius:3px;padding:10px;margin-bottom:8px;cursor:pointer;transition:.12s>' + '<div style=font-family:var(--M);font-size:9px;color:var(--ink);margin-bottom:4px>'+(idea.data.title || idea.data.concept || idea.data.product || idea.data.feature || 'Untitled')+'</div>' + '<div style=font-family:var(--M);font-size:7px;color:var(--muted);text-transform:uppercase>'+idea.type+' · '+idea.votes+' votes</div>' + '</div>';
});
html += '</div>';
});
html += '</div>';
el.innerHTML = html;
el.querySelectorAll('.oc-card').forEach(function(card) {
card.addEventListener('click', function() {
var idea = loadIdeas().find(function(i) {
return i.id === card.dataset.id;
});
if (idea && window.OmegaCreator.renderDetail) window.OmegaCreator.renderDetail(document.querySelector('[data-omega-creator-detail]'), idea);
});
});
}, 
/* Render idea detail into a DOM element */
 renderDetail: function(el, idea) {
if (!el || !idea) return;
var stageInfo = STAGES.find(function(s) {
return s.key === idea.stage;
});
var nextStage = STAGES[STAGES.findIndex(function(s) {
return s.key === idea.stage;
}) + 1];
var fieldsHtml = Object.entries(idea.data).map(function([k,v]) {
return '<div style=margin-bottom:8px><span style=font-family:var(--M);font-size:7px;letter-spacing:1px;color:var(--muted);text-transform:uppercase>'+k+':</span> <span style=font-family:var(--M);font-size:10px;color:var(--ink)>'+v+'</span></div>';
}).join('');
var commentsHtml = idea.comments.map(function(c) {
return '<div style=padding:6px 0;border-bottom:1px solid rgba(201,168,76,.06)><div style=font-family:var(--M);font-size:8px;color:var(--muted)>'+new Date(c.time).toLocaleDateString()+'</div><div style=font-family:var(--M);font-size:10px;color:var(--ink)>'+c.text+'</div></div>';
}).join('');
el.innerHTML = '<div class=glass style=padding:16px>' + '<div style=display:flex;justify-content:space-between;align-items:center;margin-bottom:12px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:'+(stageInfo?stageInfo.color:'var(--gold)')+'>'+(stageInfo?stageInfo.label:idea.stage)+'</div><button class=oc-advance style=font-family:var(--M);font-size:7px;letter-spacing:1px;padding:4px 10px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer>'+(nextStage?'ADVANCE TO '+nextStage.label:'COMPLETE')+'</button></div>' + '<div style=font-family:var(--D);font-size:clamp(16px,2vw,22px);color:var(--gold);margin-bottom:12px>'+(idea.data.title || idea.data.concept || idea.data.product || idea.data.feature || 'Untitled Idea')+'</div>' + fieldsHtml + '<div style=margin-top:12px;padding-top:12px;border-top:1px solid rgba(201,168,76,.1)><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:8px>VOTES: '+idea.votes+'</div><button class=oc-vote style=font-family:var(--M);font-size:7px;letter-spacing:1px;padding:4px 10px;background:none;border:1px solid rgba(63,178,127,.3);color:var(--green);border-radius:2px;cursor:pointer>+1 VOTE</button></div>' + '<div style=margin-top:12px;padding-top:12px;border-top:1px solid rgba(201,168,76,.1)><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:8px>COMMENTS</div>'+(commentsHtml||'<div style=font-family:var(--M);font-size:9px;color:var(--muted)>No comments yet</div>')+'</div>' + '<div style=margin-top:12px><input type=text class=oc-comment-input placeholder=Add comment… style=width:100%;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.15);border-radius:2px;padding:6px 10px;color:rgba(220,210,180,.8);font-family:var(--M);font-size:10px;outline:none><button class=oc-comment-btn style=margin-top:6px;font-family:var(--M);font-size:7px;letter-spacing:1px;padding:4px 10px;background:none;border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:2px;cursor:pointer>COMMENT</button></div>' + '</div>';
var advBtn = el.querySelector('.oc-advance');
if (advBtn) {
advBtn.addEventListener('click', function() {
advanceStage(idea.id);
window.OmegaCreator.renderDetail(el, loadIdeas().find(function(i) {
return i.id === idea.id;
}));
window.OmegaCreator.renderBoard(document.querySelector('[data-omega-creator-board]'));
});
}
var voteBtn = el.querySelector('.oc-vote');
if (voteBtn) {
voteBtn.addEventListener('click', function() {
voteIdea(idea.id, 'user_' + Math.random().toString(36).slice(2, 8));
window.OmegaCreator.renderDetail(el, loadIdeas().find(function(i) {
return i.id === idea.id;
}));
});
}
var commentBtn = el.querySelector('.oc-comment-btn');
var commentInput = el.querySelector('.oc-comment-input');
if (commentBtn && commentInput) {
commentBtn.addEventListener('click', function() {
if (!commentInput.value.trim()) return;
commentIdea(idea.id, 'user_' + Math.random().toString(36).slice(2, 8), commentInput.value.trim());
window.OmegaCreator.renderDetail(el, loadIdeas().find(function(i) {
return i.id === idea.id;
}));
});
}
}, 
/* Render stats into a DOM element */
 renderStats: function(el) {
if (!el) return;
var s = this.stats();
var stageHtml = STAGES.map(function(st) {
var count = s.byStage[st.key] || 0;
return '<div style=display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(201,168,76,.06)><span style=font-family:var(--M);font-size:9px;color:'+st.color+'>'+st.label+'</span><span style=font-family:var(--M);font-size:9px;color:var(--ink)>'+count+'</span></div>';
}).join('');
var typeHtml = IDEA_TYPES.map(function(t) {
var count = s.byType[t] || 0;
return '<div style=display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(201,168,76,.06)><span style=font-family:var(--M);font-size:9px;color:var(--muted);text-transform:uppercase>'+t+'</span><span style=font-family:var(--M);font-size:9px;color:var(--ink)>'+count+'</span></div>';
}).join('');
el.innerHTML = '<div style=display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>TOTAL IDEAS</div><div style=font-family:var(--D);font-size:clamp(24px,4vw,36px);color:var(--gold)>'+s.total+'</div></div>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>PIPELINE STAGES</div>'+stageHtml+'</div>' + '<div class=glass style=padding:16px><div style=font-family:var(--M);font-size:7px;letter-spacing:2px;color:var(--muted);margin-bottom:10px>BY TYPE</div>'+typeHtml+'</div>' + '</div>';
}
};

/* Auto-render if data attributes exist */
 document.addEventListener('DOMContentLoaded', function() {
var form = document.querySelector('[data-omega-creator-form]');
if (form) window.OmegaCreator.renderForm(form);
var board = document.querySelector('[data-omega-creator-board]');
if (board) window.OmegaCreator.renderBoard(board);
var stats = document.querySelector('[data-omega-creator-stats]');
if (stats) window.OmegaCreator.renderStats(stats);
});
document.dispatchEvent(new CustomEvent('omega:creator-ready', {
detail: {
version: '1.0', types: IDEA_TYPES.length
}
}));
})();
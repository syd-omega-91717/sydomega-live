/* Ω NEXUS EXPORT — deterministic, non-sensitive runtime snapshot */
(function(){'use strict';
function exportSnapshot(){const nodes=window.OmegaNexus&&typeof OmegaNexus.snapshot==='function'?OmegaNexus.snapshot():null;const evidence=window.OmegaEvidence&&typeof OmegaEvidence.snapshot==='function'?OmegaEvidence.snapshot():null;const payload={schema:'omega.nexus.snapshot.v1',generated_at:new Date().toISOString(),nodes:nodes||[],evidence:evidence||null};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='omega-nexus-snapshot.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
window.OmegaNexusExport=Object.freeze({exportSnapshot});
})();

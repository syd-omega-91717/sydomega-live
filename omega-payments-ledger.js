/* ============================================================================
   SYD OMEGA 91717 -- PAYMENT LEDGER (unavailable state)

   Moved out of payments.html when that page was merged into subscriptions.html
   (PAYMENT HISTORY tab). The ledger deliberately stays UNAVAILABLE until
   authoritative provider events and ledger rows are connected and verified:
   task completions are not financial transactions, and UI-generated rows must
   never imply settlement. Rows are built as text nodes.
   A file rather than an inline block so the CSP inline ratchet stays put.
   ============================================================================ */
(function(){
var __txRows=[];
function filterTx(btn,filter){
  document.querySelectorAll('.tx-filter button').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  renderTx(__txRows,filter);
}
function renderTx(rows,filter){
  var tb=document.getElementById('tx-body');
  var filtered=filter==='all'?rows:rows.filter(function(r){
    if(filter==='subscriptions')return r.type==='SUBSCRIPTION'||r.type==='ACCESS';
    if(filter==='consultancy')return r.type==='CONSULTANCY';
    if(filter==='marketplace')return r.type==='MARKETPLACE';
    return true;
  });
  tb.replaceChildren();
  if(!filtered.length){
    var empty=document.createElement('div');
    empty.className='tbl-row';
    empty.style.cssText='display:block;text-align:center;padding:20px;color:var(--muted)';
    empty.textContent='TRANSACTION LEDGER UNAVAILABLE — AUTHORITATIVE PAYMENT RECORDS ARE NOT CONNECTED. NO PAYMENT HAS BEEN INFERRED FROM TASK ACTIVITY.';
    empty.setAttribute('role','status');
    tb.appendChild(empty);
    tb.dataset.truth='UNAVAILABLE';
    return;
  }
  tb.dataset.truth='LIVE';
  filtered.forEach(function(tx){
    var row=document.createElement('div');
    row.className='tbl-row';
    row.style.gridTemplateColumns='110px 1.5fr 150px 130px 130px';
    var date=document.createElement('span');date.textContent=String(tx.date||'—');
    var desc=document.createElement('span');desc.textContent=String(tx.desc||'UNSPECIFIED RECORD');
    var typeCell=document.createElement('span'),type=document.createElement('span');
    type.className='tx-type';type.textContent=String(tx.type||'UNCLASSIFIED');typeCell.appendChild(type);
    var statusCell=document.createElement('span'),status=document.createElement('span');
    var statusValue=String(tx.status||'unverified').toLowerCase();
    status.className='tx-status '+(statusValue==='completed'?'st-completed':statusValue==='pending'?'st-pending':'st-failed');
    status.textContent=statusValue.toUpperCase();statusCell.appendChild(status);
    var amountCell=document.createElement('span'),amount=document.createElement('span');
    var direction=tx.dir==='in'?'tx-in':tx.dir==='out'?'tx-out':'tx-pending';
    amount.className='tx-amount '+direction;amount.textContent=String(tx.amount||'—');amountCell.appendChild(amount);
    row.append(date,desc,typeCell,statusCell,amountCell);
    tb.appendChild(row);
  });
}

window.filterTx=filterTx;
window.renderTx=renderTx;
/* No inline handlers (CSP ratchet): the METHODS tab button and the ledger filter buttons carry data attributes. */
document.addEventListener('click',function(ev){
  var t=ev.target&&ev.target.closest?ev.target.closest('[data-tab-open],[data-tx]'):null;
  if(!t)return;
  if(t.hasAttribute('data-tab-open')&&typeof window.setTab==='function')window.setTab(t.getAttribute('data-tab-open'));
  else if(t.hasAttribute('data-tx'))filterTx(t,t.getAttribute('data-tx'));
});
function init(){window.__txRows=[];var inflow=document.getElementById('kpi-inflow');if(inflow)inflow.textContent='\u2014';renderTx([],'all');}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

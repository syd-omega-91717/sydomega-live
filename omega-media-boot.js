/* render() needs the loaded state; calling it bare threw "reading 'items'" on
   every visit (FIXES_LOG 2026-10-18). Load first, and on failure render the
   UNAVAILABLE state with the reason rather than throw. */
document.addEventListener("DOMContentLoaded",function(){var M=window.OmegaMediaNative;if(!M)return;M.load().then(M.render,function(e){M.render({truth_state:'UNAVAILABLE',items:[],errors:[String(e&&e.message||e)]});});});

/* omega-hover-handler.js — Global event delegation for hover effects.
   Centralizes onmouseover/onmouseout patterns into data-hover-* attributes.
   Attributes (all optional):
     data-hover-bg-on/off: background color on/off hover
     data-hover-color-on/off: text color on/off hover
     data-hover-border-on/off: border-color on/off hover
   Loaded deferred by bg.js; guard: data-omega-hoverhandler. */
(function(){
  if(document.querySelector('script[data-omega-hoverhandler]')) return;
  document.addEventListener('mouseover',function(e){
    var target=e.target.closest('[data-hover-bg-on], [data-hover-color-on], [data-hover-border-on]');
    if(!target) return;
    var bgOn=target.getAttribute('data-hover-bg-on');
    if(bgOn) target.style.background=bgOn;
    var colorOn=target.getAttribute('data-hover-color-on');
    if(colorOn) target.style.color=colorOn;
    var borderOn=target.getAttribute('data-hover-border-on');
    if(borderOn) target.style.borderColor=borderOn;
  });
  document.addEventListener('mouseout',function(e){
    var target=e.target.closest('[data-hover-bg-off], [data-hover-color-off], [data-hover-border-off]');
    if(!target) return;
    var bgOff=target.getAttribute('data-hover-bg-off');
    if(bgOff) target.style.background=bgOff;
    var colorOff=target.getAttribute('data-hover-color-off');
    if(colorOff) target.style.color=colorOff;
    var borderOff=target.getAttribute('data-hover-border-off');
    if(borderOff) target.style.borderColor=borderOff;
  });
})();

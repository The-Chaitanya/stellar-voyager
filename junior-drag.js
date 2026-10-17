// Pointer events support the same spatial activity with mouse, pen and touch.
// Ordinary button clicks remain available for keyboard and tap-only play.
export function enableJuniorDrag(button, {targets, onDrop, onMiss}) {
  let drag=null, suppressClick=false;
  function cleanup() {
    if(!drag)return;
    const {ghost,pointerId}=drag;drag=null;ghost?.remove();button.classList.remove('junior-dragging');
    document.querySelectorAll('.junior-drop-hover').forEach(target=>target.classList.remove('junior-drop-hover'));
    if(button.hasPointerCapture(pointerId))button.releasePointerCapture(pointerId);
  }
  function targetAt(x,y) {
    return targets().find(target=>{const r=target.getBoundingClientRect();return x>=r.left-10&&x<=r.right+10&&y>=r.top-10&&y<=r.bottom+10;});
  }
  button.addEventListener('pointerdown',event=>{
    if(button.disabled||event.button!==0||!event.isPrimary)return;
    suppressClick=false;drag={pointerId:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    if(!drag.ghost&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;
    if(!drag.ghost){
      const bounds=button.getBoundingClientRect();drag.ghost=button.cloneNode(true);drag.ghost.removeAttribute('id');drag.ghost.setAttribute('aria-hidden','true');drag.ghost.tabIndex=-1;drag.ghost.className='junior-drag-ghost';drag.ghost.style.width=bounds.width+'px';drag.ghost.style.height=bounds.height+'px';document.body.append(drag.ghost);button.classList.add('junior-dragging');suppressClick=true;
    }
    event.preventDefault();drag.ghost.style.left=event.clientX+'px';drag.ghost.style.top=event.clientY+'px';
    const hit=targetAt(event.clientX,event.clientY);for(const target of targets())target.classList.toggle('junior-drop-hover',target===hit);
  });
  button.addEventListener('pointerup',event=>{
    if(!drag||event.pointerId!==drag.pointerId)return;
    const moved=!!drag.ghost,hit=moved?targetAt(event.clientX,event.clientY):null;cleanup();
    if(moved){event.preventDefault();if(hit)onDrop(hit);else onMiss();}
  });
  button.addEventListener('pointercancel',()=>{suppressClick=false;cleanup();});
  button.addEventListener('lostpointercapture',cleanup);
  button.addEventListener('click',event=>{if(suppressClick){suppressClick=false;event.preventDefault();event.stopImmediatePropagation();}},true);
}

(() => {
'use strict';
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const palettes=[['#293045','#bdadff','#faafc7'],['#203844','#83ddd7','#a9c8ff'],['#36304c','#c7a0ff','#faadce'],['#263c47','#7bdecf','#d1dc8f'],['#39304a','#d7a8e8','#ffbd8b'],['#243149','#92baff','#eda4cf']];
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function circle(c,x,y,r){c.beginPath();c.arc(x,y,r,0,TAU);}
function star(c,x,y,r,fill){c.beginPath();for(let i=0;i<10;i++){const a=i*TAU/10-Math.PI/2,rad=i%2?r*.45:r;i?c.lineTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad):c.moveTo(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}c.closePath();c.fillStyle=fill;c.fill();}
function glow(c,color,blur){c.shadowColor=color;c.shadowBlur=blur;}
function key(c,x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);c.strokeStyle='#ffe9a1';c.lineWidth=4;c.lineCap='round';circle(c,-3,-4,5);c.stroke();c.beginPath();c.moveTo(0,0);c.lineTo(8,8);c.moveTo(5,5);c.lineTo(9,1);c.moveTo(8,8);c.lineTo(12,4);c.stroke();c.restore();}
function drawMascot(c,x,y,r=20,state={}){
  const t=state.elapsed||0,vx=state.vx||0,vy=state.vy||0,speed=Math.hypot(vx,vy),blink=Math.sin(t*1.8)>0.994;
  c.save();c.translate(x,y);c.scale(r/20,r/20);
  if(state.angle)c.rotate(-state.angle);
  c.scale(1+Math.min(speed/2600,.1),1-Math.min(speed/3200,.08));
  c.save();c.globalAlpha=.22;c.fillStyle='#000914';c.beginPath();c.ellipse(0,20,18,4,0,0,TAU);c.fill();c.restore();
  // A small space suit with knitted ears and a bright glass rim.
  const helmet=c.createRadialGradient(-6,-9,2,1,0,25);helmet.addColorStop(0,'rgba(226,249,255,.20)');helmet.addColorStop(.78,'rgba(170,217,245,.09)');helmet.addColorStop(1,'rgba(225,246,255,.25)');
  circle(c,0,-1,23);c.fillStyle=helmet;c.fill();c.strokeStyle='rgba(216,247,255,.66)';c.lineWidth=1.6;c.stroke();
  c.fillStyle='#dc7188';c.beginPath();c.ellipse(-12,-16,5,8,-.5,0,TAU);c.ellipse(12,-16,5,8,.5,0,TAU);c.fill();
  c.fillStyle='#ffafba';c.beginPath();c.ellipse(-12,-17,2.8,5,-.5,0,TAU);c.ellipse(12,-17,2.8,5,.5,0,TAU);c.fill();
  c.fillStyle='#a34f73';c.beginPath();c.ellipse(-8,17,6,4,-.2,0,TAU);c.ellipse(8,17,6,4,.2,0,TAU);c.fill();
  const body=c.createRadialGradient(-7,-10,2,3,9,31);body.addColorStop(0,'#ffe4c4');body.addColorStop(.4,'#ffb5a2');body.addColorStop(.8,'#f783a0');body.addColorStop(1,'#d05f95');
  c.fillStyle=body;c.beginPath();c.moveTo(0,-17);c.bezierCurveTo(18,-22,23,-6,18,8);c.bezierCurveTo(17,22,-17,22,-18,8);c.bezierCurveTo(-23,-6,-18,-22,0,-17);c.fill();
  c.strokeStyle='rgba(255,235,213,.70)';c.lineWidth=1.5;c.beginPath();c.moveTo(-16,-6);c.bezierCurveTo(-15,-15,-8,-19,-2,-16);c.stroke();
  c.fillStyle='#ffe4dc';c.beginPath();c.ellipse(0,9,11,7,0,0,TAU);c.fill();
  // Wide eyes, eye highlights and asymmetric hair curl give 桃桃 its expression.
  const lookX=clamp(vx/150,-2,2),lookY=clamp(vy/220,-1.2,1.2),surprise=state.hurt||speed>310;
  for(const side of [-1,1]){const ex=side*7;
    if(blink&&!surprise){c.strokeStyle='#4c354e';c.lineWidth=2.3;c.lineCap='round';c.beginPath();c.moveTo(ex-3,-1);c.quadraticCurveTo(ex,1,ex+3,-1);c.stroke();continue;}
    c.fillStyle='#fff9ee';c.beginPath();c.ellipse(ex,-2,5.9,surprise?7.7:7,side*.06,0,TAU);c.fill();
    c.fillStyle='#49314a';c.beginPath();c.ellipse(ex+lookX,-1+lookY,3.3,4.7,0,0,TAU);c.fill();
    c.fillStyle='#fff';circle(c,ex+lookX-1.1,-3+lookY,1.3);c.fill();circle(c,ex+lookX+1,1+lookY,.65);c.fill();
  }
  c.fillStyle='rgba(232,87,123,.55)';c.beginPath();c.ellipse(-13,5,4,2.3,-.12,0,TAU);c.ellipse(13,5,4,2.3,.12,0,TAU);c.fill();
  c.strokeStyle='#78475f';c.lineWidth=1.5;c.lineCap='round';c.beginPath();
  if(surprise){c.ellipse(0,8,2.6,3.4,0,0,TAU);c.fillStyle='#925169';c.fill();}else{c.moveTo(-3,7);c.quadraticCurveTo(0,11,3,7);c.stroke();}
  c.strokeStyle='#da7d93';c.lineWidth=2;c.beginPath();c.moveTo(-3,-15);c.bezierCurveTo(-4,-22,5,-21,3,-16);c.stroke();
  c.fillStyle='#93e6d0';c.beginPath();c.ellipse(3,-20,5,2.5,-.6,0,TAU);c.fill();
  c.strokeStyle='rgba(245,255,255,.8)';c.lineWidth=2;c.beginPath();c.arc(0,-1,21.3,Math.PI*1.1,Math.PI*1.36);c.stroke();
  c.fillStyle='#c1effa';circle(c,-23,-1,3);c.fill();circle(c,23,-1,3);c.fill();
  if(state.braking){c.strokeStyle='#9aeeff';c.lineWidth=2;c.setLineDash([5,3]);circle(c,0,-1,27+Math.sin(t*13));c.stroke();c.setLineDash([]);}
  c.restore();
}
function draw(game){
  const c=game.ctx;if(!c)return;
  const W=game.width,H=game.height,t=game.elapsed||0,l=game.level||1,palette=palettes[(l-1)%palettes.length];
  c.setTransform(game.dpr||1,0,0,game.dpr||1,0,0);c.clearRect(0,0,W,H);
  const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#171b30');bg.addColorStop(.5,'#101b29');bg.addColorStop(1,'#241c31');c.fillStyle=bg;c.fillRect(0,0,W,H);
  for(let i=0;i<44;i++){const sx=(i*137.53+31)%W,sy=(i*79.71+17)%Math.max(1,H-32);c.globalAlpha=.15+(Math.sin(i*3.1+t*.7)+1)*.16;c.fillStyle=i%3?'#e4e9ff':'#ffbbd3';circle(c,sx,sy,i%7===0?1.8:.8);c.fill();}c.globalAlpha=1;
  const cx=W/2,cy=(H-44)/2,scale=game.scale||Math.min(W/570,(H-50)/570);
  c.save();c.translate(cx,cy);
  c.strokeStyle='rgba(186,179,222,.15)';c.lineWidth=1;c.setLineDash([2,9]);circle(c,0,0,272*scale);c.stroke();c.setLineDash([]);
  c.save();c.rotate(-.45);c.scale(1,.28);c.strokeStyle='rgba(198,175,246,.14)';circle(c,0,0,280*scale);c.stroke();c.restore();
  c.rotate(game.angle||0);c.scale(scale,scale);c.translate(-200,-200);
  glow(c,'#000510',20);c.fillStyle='#111728';rr(c,-5,-1,410,414,21);c.fill();c.shadowBlur=0;
  const plate=c.createLinearGradient(0,0,400,400);plate.addColorStop(0,palette[0]);plate.addColorStop(1,'#182135');c.fillStyle=plate;rr(c,0,0,400,400,17);c.fill();
  const edge=c.createLinearGradient(0,0,400,400);edge.addColorStop(0,'#9d9cc5');edge.addColorStop(.4,'#5c6688');edge.addColorStop(1,'#4c506e');c.strokeStyle=edge;c.lineWidth=7;rr(c,0,0,400,400,17);c.stroke();
  c.strokeStyle='rgba(240,230,255,.2)';c.lineWidth=1;rr(c,5,5,390,390,12);c.stroke();
  for(let v=32;v<400;v+=32){for(let u=32;u<400;u+=32){c.fillStyle='rgba(178,200,222,.13)';circle(c,u,v,.9);c.fill();}}
  // Tiny inset screws reinforce the tilted physical board.
  for(const [x,y] of [[12,12],[388,12],[12,388],[388,388]]){c.fillStyle='#151e30';circle(c,x,y,3);c.fill();c.strokeStyle='#707591';c.lineWidth=1;c.beginPath();c.moveTo(x-1,y-1);c.lineTo(x+1,y+1);c.stroke();}
  for(const w of game.walls||[]){
    if(w.moving){c.strokeStyle='rgba(107,233,229,.3)';c.lineWidth=2;c.setLineDash([4,5]);c.beginPath();c.moveTo(Math.max(8,w.x-55),w.y+w.h/2);c.lineTo(Math.min(392,w.x+w.w+55),w.y+w.h/2);c.stroke();c.setLineDash([]);}
    c.fillStyle='#111b2b';rr(c,w.x,w.y+5,w.w,w.h,Math.min(5,w.h/2));c.fill();
    const wall=c.createLinearGradient(w.x,w.y,w.x,w.y+w.h);wall.addColorStop(0,w.moving?'#9eebe4':palette[1]);wall.addColorStop(1,w.moving?'#53a9bc':palette[2]);c.fillStyle=wall;rr(c,w.x,w.y,w.w,w.h,Math.min(5,w.h/2));c.fill();
    c.fillStyle='rgba(255,255,255,.42)';rr(c,w.x+3,w.y+1,Math.max(1,w.w-6),2,1);c.fill();
    c.strokeStyle='rgba(71,54,98,.22)';c.lineWidth=2;for(let x=w.x+14;x<w.x+w.w-8;x+=20){c.beginPath();c.moveTo(x,w.y+4);c.lineTo(x-4,w.y+w.h-3);c.stroke();}
    if(w.moving){c.fillStyle='#153f4e';c.font='bold 9px system-ui';c.textAlign='center';c.fillText('‹  ›',w.x+w.w/2,w.y+w.h*.8);}
  }
  for(const p of game.portals||[]){c.save();c.translate(p.x,p.y);const col=p.color||'#bc9bff';glow(c,col,13);c.strokeStyle=col;c.lineWidth=3;circle(c,0,0,20);c.stroke();c.shadowBlur=0;c.fillStyle='#13172e';circle(c,0,0,17);c.fill();c.rotate(t*2);for(let i=0;i<3;i++){c.rotate(TAU/3);c.strokeStyle=col;c.globalAlpha=.8-i*.16;c.lineWidth=2;c.beginPath();c.arc(0,0,6+i*4,.1,Math.PI*1.1);c.stroke();}c.globalAlpha=1;c.restore();}
  const goal=game.goal||{x:350,y:365};c.save();c.translate(goal.x,goal.y);c.fillStyle='#0b1524';circle(c,0,0,24);c.fill();glow(c,goal.locked?'#d7a46b':'#bcf6bf',goal.locked?4:13);c.strokeStyle=goal.locked?'#c69c78':'#b2f8cc';c.lineWidth=3;circle(c,0,0,24);c.stroke();c.shadowBlur=0;c.strokeStyle=goal.locked?'rgba(198,156,120,.3)':'rgba(178,248,204,.3)';c.lineWidth=1;circle(c,0,0,28+Math.sin(t*3));c.stroke();c.rotate(-(game.angle||0));
  if(goal.locked){c.fillStyle='#edbf88';rr(c,-7,-1,14,12,3);c.fill();c.strokeStyle='#edbf88';c.lineWidth=2.4;c.beginPath();c.arc(0,-2,4.5,Math.PI,0);c.stroke();c.fillStyle='#523f43';circle(c,0,4,1.5);c.fill();}else{c.fillStyle='#c8fada';c.font='900 11px system-ui';c.textAlign='center';c.fillText('回家',0,4);c.fillStyle='#c8fada';c.beginPath();c.moveTo(-4,11);c.lineTo(0,15);c.lineTo(4,11);c.strokeStyle='#c8fada';c.lineWidth=1.5;c.stroke();}c.restore();
  for(const hazard of game.hazards||[]){c.save();const active=hazard.active!==false;
    if(hazard.w!==undefined){c.globalAlpha=active?.92:.25;c.fillStyle=active?'#ff6e89':'#af7290';glow(c,'#ff557d',active?14:0);rr(c,hazard.x,hazard.y,hazard.w,hazard.h,3);c.fill();c.shadowBlur=0;c.fillStyle='#ffdce7';if(active){rr(c,hazard.x+2,hazard.y+hazard.h*.38,Math.max(1,hazard.w-4),Math.max(1,hazard.h*.22),1);c.fill();}}
    else{c.translate(hazard.x,hazard.y);const r=hazard.r||15;c.globalAlpha=active?1:.25;c.rotate(t*.8);c.fillStyle=active?'#ff6e8d':'#8c697f';c.beginPath();for(let i=0;i<24;i++){const a=i*TAU/24,rad=i%2?r*.72:r;i?c.lineTo(Math.cos(a)*rad,Math.sin(a)*rad):c.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);}c.closePath();c.fill();c.fillStyle='#672944';circle(c,0,0,r*.52);c.fill();c.rotate(-t*.8-(game.angle||0));c.fillStyle='#ffd9e4';c.font='900 15px system-ui';c.textAlign='center';c.fillText('!',0,5);}
    c.restore();}
  for(const p of game.pickups||[]){if(p.got)continue;c.save();c.translate(p.x,p.y);c.rotate(Math.sin(t*3+p.x)*.16);glow(c,'#ffc877',10);star(c,0,0,12,'#ffd48b');c.shadowBlur=0;star(c,-1,-2,6,'#fff1b6');c.fillStyle='#8f6b50';circle(c,-2.3,1,1);c.fill();circle(c,2.3,1,1);c.fill();c.restore();}
  const ki=game.keyItem;if(ki&&!ki.got){c.save();c.translate(ki.x,ki.y+Math.sin(t*3)*3);c.strokeStyle='rgba(255,218,135,.3)';c.lineWidth=1;circle(c,0,0,18);c.stroke();glow(c,'#ffd78a',10);c.rotate(-(game.angle||0));key(c,0,0,1.3);c.restore();}
  const b=game.ball;if(b){const speed=Math.hypot(b.vx||0,b.vy||0);if(speed>50){c.save();for(let i=4;i>0;i--){c.globalAlpha=(1-i/5)*.18;c.fillStyle=game.braking?'#8beaff':'#ffb9ba';circle(c,b.x-(b.vx||0)*i*.021,b.y-(b.vy||0)*i*.021,Math.max(2,(b.r||16)-i*2));c.fill();}c.restore();}
    const hurt=b.hitTime>0||game.invulnerable>0;
    c.save();if(hurt)c.globalAlpha=.65+.35*Math.cos(t*24);drawMascot(c,b.x,b.y,20,{elapsed:t,vx:b.vx,vy:b.vy,angle:game.angle,braking:game.braking,hurt});c.restore();}
  for(const p of game.particles||[]){c.globalAlpha=clamp(p.life*2,0,1);c.fillStyle=p.color||'#ffc4aa';circle(c,p.x,p.y,2.6);c.fill();}c.globalAlpha=1;c.restore();
  const active=game.pointer?.side??(Number(game.keys?.has('arrowright')||game.keys?.has('d'))-Number(game.keys?.has('arrowleft')||game.keys?.has('a')));
  c.font='600 11px system-ui,sans-serif';c.textAlign='center';c.fillStyle=active<0?'#ffc3af':'#9daac1';c.fillText('◀ 按住左半边',W*.25,H-16);c.fillStyle=active>0?'#ffc3af':'#9daac1';c.fillText('按住右半边 ▶',W*.75,H-16);
  if(game.running&&game.levelElapsed<2.7){const titles=['星港出发','钥匙在哪里','月台会移动','穿过虫洞','激光有节奏','最后一公里'];c.font='700 12px system-ui';c.fillStyle='#eadcfa';c.fillText(`${String(l).padStart(2,'0')} / ${game.totalLevels||6}  ·  ${titles[(l-1)%6]}`,W/2,21);}
}
window.TiltRenderer={draw,drawMascot};
})();

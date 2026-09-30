(() => {
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TAU=Math.PI*2;
class EchoGame {
  constructor(canvas,options={}) {
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.running=false;this.elapsed=0;this.duration=45;this.angle=0;this.stars=0;this.level=1;this.completed=0;this.score=0;this.keys=new Set();this.pointer=null;this.particles=[];
    canvas.style.touchAction='none';
    canvas.addEventListener('pointerdown',e=>{if(!this.running)return;e.preventDefault();canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect();this.pointer={id:e.pointerId,side:e.clientX<r.left+r.width/2?-1:1};try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
    canvas.addEventListener('pointermove',e=>{if(this.pointer?.id!==e.pointerId)return;e.preventDefault();const r=canvas.getBoundingClientRect();this.pointer.side=e.clientX<r.left+r.width/2?-1:1;});
    const release=e=>{if(this.pointer?.id===e.pointerId)this.pointer=null;};
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    window.addEventListener('keydown',e=>{if(!this.running)return;const k=e.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(k)){e.preventDefault();this.keys.add(k);}});
    window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{this.pointer=null;this.keys.clear();});
    this.seed='preview';this.buildLevel();this.resize();
  }
  resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width||360);this.height=Math.max(1,r.height||450);this.dpr=Math.min(window.devicePixelRatio||1,2.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.scale=Math.min(this.width/570,(this.height-65)/570);this.draw();}
  start(seed='today'){this.stop();this.seed=String(seed);this.elapsed=0;this.angle=0;this.stars=0;this.level=1;this.completed=0;this.score=450;this.particles=[];this.lastUpdate=-1;this.buildLevel();this.running=true;this.lastTime=performance.now();this.emit();this.raf=requestAnimationFrame(t=>this.frame(t));}
  stop(){this.running=false;cancelAnimationFrame(this.raf);this.pointer=null;this.keys.clear();}
  buildLevel(){
    let hash=0;for(const c of String(this.seed))hash=(hash*31+c.charCodeAt(0))>>>0;
    const shift=(hash%3-1)*10;
    this.ball={x:57,y:51,vx:0,vy:0};this.angle=0;this.levelElapsed=0;
    const layouts=[
      [{x:0,y:125,w:275+shift,h:13},{x:125-shift,y:250,w:275+shift,h:13}],
      [{x:0,y:110,w:280+shift,h:13},{x:130-shift,y:218,w:270+shift,h:13},{x:0,y:312,w:260+shift,h:13}],
      [{x:0,y:105,w:280+shift,h:13},{x:125-shift,y:205,w:275+shift,h:13},{x:0,y:300,w:280+shift,h:13}]
    ];
    this.walls=layouts[this.level-1];this.goal={x:350,y:365};
    this.pickups=this.level===1?[{x:322,y:82},{x:65,y:203},{x:322,y:326}]:[{x:330,y:62},{x:65,y:168},{x:337,y:260}];
  }
  emit(){this.options.onUpdate?.({score:this.score,stars:this.stars,timeLeft:Math.max(0,this.duration-this.elapsed),elapsed:this.elapsed,echoes:0,level:this.level,angle:this.angle,levels:this.completed});}
  frame(t){if(!this.running)return;const dt=Math.min((t-this.lastTime)/1000,.04);this.lastTime=t;this.step(dt);this.draw();if(this.running)this.raf=requestAnimationFrame(v=>this.frame(v));}
  step(dt){
    this.elapsed=Math.min(this.duration,this.elapsed+dt);this.levelElapsed+=dt;
    const direction=this.pointer?.side??(Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a')));
    // Clockwise world rotation makes gravity point right in world coordinates.
    this.angle=clamp(this.angle+direction*1.65*dt,-2.7,2.7);
    const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
    for(let i=0;i<steps;i++)this.physics(h);
    for(const star of this.pickups){if(!star.got&&Math.hypot(this.ball.x-star.x,this.ball.y-star.y)<23){star.got=true;this.stars++;this.burst(star.x,star.y,'#e1ff79');this.options.onEvent?.('吃到星星！');}}
    this.particles=this.particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;return p.life>0;});
    this.score=this.completed*500+this.stars*100+Math.floor(Math.max(0,this.duration-this.elapsed)*10);
    if(Math.hypot(this.ball.x-this.goal.x,this.ball.y-this.goal.y)<24){
      this.completed++;this.score=this.completed*500+this.stars*100+Math.floor(Math.max(0,this.duration-this.elapsed)*10);
      if(this.completed===3){this.finish('survived');return;}
      this.options.onEvent?.('过关！地球又歪了一点');this.level++;this.buildLevel();this.pointer=null;this.keys.clear();this.emit();
    }
    if(this.elapsed-this.lastUpdate>.08){this.lastUpdate=this.elapsed;this.emit();}
    if(this.elapsed>=this.duration)this.finish('timeout');
  }
  physics(dt){
    const b=this.ball,r=11;const gravity=640;
    b.vx+=Math.sin(this.angle)*gravity*dt;b.vy+=Math.cos(this.angle)*gravity*dt;
    const drag=Math.exp(-.65*dt);b.vx=clamp(b.vx*drag,-330,330);b.vy=clamp(b.vy*drag,-330,330);b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<r+5){b.x=r+5;b.vx=Math.abs(b.vx)*.22;}if(b.x>395-r){b.x=395-r;b.vx=-Math.abs(b.vx)*.22;}
    if(b.y<r+5){b.y=r+5;b.vy=Math.abs(b.vy)*.22;}if(b.y>395-r){b.y=395-r;b.vy=-Math.abs(b.vy)*.22;}
    for(const w of this.walls){
      const qx=clamp(b.x,w.x,w.x+w.w),qy=clamp(b.y,w.y,w.y+w.h);let dx=b.x-qx,dy=b.y-qy;let dist=Math.hypot(dx,dy);
      if(dist>=r)continue;
      if(dist<.0001){const choices=[{d:Math.abs(b.x-w.x),x:-1,y:0},{d:Math.abs(w.x+w.w-b.x),x:1,y:0},{d:Math.abs(b.y-w.y),x:0,y:-1},{d:Math.abs(w.y+w.h-b.y),x:0,y:1}].sort((a,c)=>a.d-c.d);dx=choices[0].x;dy=choices[0].y;dist=-choices[0].d;}else{dx/=dist;dy/=dist;}
      const penetration=r-dist;b.x+=dx*penetration;b.y+=dy*penetration;const vn=b.vx*dx+b.vy*dy;if(vn<0){b.vx-=1.16*vn*dx;b.vy-=1.16*vn*dy;}
    }
  }
  finish(reason){if(!this.running)return;this.running=false;this.pointer=null;this.keys.clear();this.emit();this.options.onEnd?.({score:this.score,stars:this.stars,elapsed:this.elapsed,reason,seed:this.seed,levels:this.completed});}
  burst(x,y,color){for(let i=0;i<12;i++){const a=i/12*TAU;this.particles.push({x,y,vx:Math.cos(a)*70,vy:Math.sin(a)*70,life:.5,color});}}
  round(x,y,w,h,r){const c=this.ctx;c.beginPath();c.roundRect(x,y,w,h,r);}
  draw(){
    const c=this.ctx;if(!c)return;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,this.width,this.height);c.fillStyle='#111721';c.fillRect(0,0,this.width,this.height);
    c.fillStyle='rgba(168,182,204,.12)';for(let x=15;x<this.width;x+=24)for(let y=15;y<this.height;y+=24){c.beginPath();c.arc(x,y,1,0,TAU);c.fill();}
    const cx=this.width/2,cy=(this.height-44)/2;
    c.save();c.translate(cx,cy);c.strokeStyle='rgba(196,218,237,.10)';c.lineWidth=1;c.setLineDash([3,8]);c.beginPath();c.arc(0,0,283*this.scale,0,TAU);c.stroke();c.setLineDash([]);
    c.rotate(this.angle);c.scale(this.scale,this.scale);c.translate(-200,-200);
    c.shadowColor='rgba(0,0,0,.6)';c.shadowBlur=30;c.fillStyle='#202a3b';this.round(-5,-5,410,410,18);c.fill();c.shadowBlur=0;
    c.strokeStyle='#647087';c.lineWidth=7;this.round(0,0,400,400,14);c.stroke();
    c.strokeStyle='rgba(161,183,212,.08)';c.lineWidth=1;for(let v=40;v<400;v+=40){c.beginPath();c.moveTo(v,5);c.lineTo(v,395);c.moveTo(5,v);c.lineTo(395,v);c.stroke();}
    for(let i=0;i<this.walls.length;i++){const w=this.walls[i];c.fillStyle=i%2?'#ec8bbc':'#a991ec';c.shadowColor=c.fillStyle;c.shadowBlur=10;this.round(w.x,w.y,w.w,w.h,6);c.fill();c.shadowBlur=0;c.fillStyle='rgba(255,255,255,.25)';this.round(w.x+3,w.y+2,w.w-6,3,1);c.fill();}
    c.fillStyle='#0d1520';c.beginPath();c.arc(this.goal.x,this.goal.y,24,0,TAU);c.fill();c.strokeStyle='#a9f7a0';c.lineWidth=3;c.setLineDash([5,4]);c.beginPath();c.arc(this.goal.x,this.goal.y,24,0,TAU);c.stroke();c.setLineDash([]);c.fillStyle='#b5fba7';c.font='bold 11px system-ui';c.textAlign='center';c.fillText('出口',this.goal.x,this.goal.y+4);
    for(const p of this.pickups){if(p.got)continue;c.save();c.translate(p.x,p.y);c.rotate(Math.sin(this.elapsed*3)*.1);c.fillStyle='#ffd974';c.shadowColor='#ffd974';c.shadowBlur=13;c.beginPath();for(let i=0;i<10;i++){const a=i/10*TAU-Math.PI/2,r=i%2?5:12;if(!i)c.moveTo(Math.cos(a)*r,Math.sin(a)*r);else c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.restore();}
    const b=this.ball;c.save();c.translate(b.x,b.y);c.shadowColor='#d8ff78';c.shadowBlur=17;c.fillStyle='#d8ff78';c.beginPath();c.arc(0,0,12,0,TAU);c.fill();c.shadowBlur=0;c.rotate(-this.angle);c.fillStyle='#18212a';const look=clamp(b.vx/160,-1.6,1.6);c.beginPath();c.ellipse(-4+look,-1,1.8,3,0,0,TAU);c.ellipse(4+look,-1,1.8,3,0,0,TAU);c.fill();c.strokeStyle='#18212a';c.lineWidth=1.5;c.beginPath();c.arc(0,3,3,.2,Math.PI-.2);c.stroke();c.restore();
    for(const p of this.particles){c.globalAlpha=Math.max(0,p.life*2);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,3,0,TAU);c.fill();}c.globalAlpha=1;c.restore();
    const active=this.pointer?.side??(Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a')));
    c.font='bold 12px system-ui,sans-serif';c.textAlign='center';c.fillStyle=active<0?'#d8ff78':'#a7b2c4';c.fillText('◀ 按住左半边',this.width*.25,this.height-17);c.fillStyle=active>0?'#d8ff78':'#a7b2c4';c.fillText('按住右半边 ▶',this.width*.75,this.height-17);
    if(this.running&&this.levelElapsed<2.5){c.fillStyle='#e0e8f0';c.font='bold 12px system-ui';c.fillText('第 '+this.level+' 关 · 把小球倒进出口',this.width/2,21);}
  }
}
window.EchoGame=EchoGame;
})();

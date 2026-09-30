(() => {
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TAU=Math.PI*2;
const LEVELS=[
 {name:'引力初学',hint:'按住左右转动星球，把团子送进出口',spawn:[55,52],goal:[345,354],walls:[[0,125,265,14],[140,260,260,14]],stars:[[195,101],[230,237],[285,361]]},
 {name:'钥匙回廊',hint:'先拿到金色钥匙，出口才会打开',spawn:[52,50],goal:[345,355],walls:[[0,115,275,14],[125,238,275,14],[190,305,70,14]],stars:[[180,91],[240,214],[305,360]],key:[170,213]},
 {name:'虫洞捷径',hint:'蓝紫虫洞成对相通，越过封闭隔层',spawn:[55,50],goal:[65,355],walls:[[0,115,280,14],[0,250,400,14]],stars:[[175,92],[170,225],[210,370]],key:[325,92],portals:[[68,226,300,340],[300,310,68,213]]},
 {name:'潮汐栈桥',hint:'桥会移动，红色水母闪亮时请绕开',spawn:[55,50],goal:[345,355],walls:[[0,110,265,14],[130,225,270,14]],moving:[[130,310,105,14,'x',55,1.25]],stars:[[185,87],[230,202],[295,364]],key:[170,200],hazards:[{x:212,y:345,r:14,period:3.6,on:1.25,phase:1.8}]},
 {name:'激光警戒',hint:'等激光熄灭再穿过，按住刹车稳住',spawn:[55,50],goal:[345,355],walls:[[0,120,275,14],[125,240,275,14]],stars:[[185,96],[240,217],[290,362]],key:[170,215],hazards:[{x:293,y:165,w:91,h:8,type:'laser',period:3.7,on:1.35,phase:1.5},{x:195,y:337,r:14,period:4.2,on:1.3,phase:0}]},
 {name:'地心核心',hint:'虫洞、浮桥、激光齐上阵，钥匙在左下角',spawn:[55,50],goal:[345,355],walls:[[0,112,280,14],[125,218,275,14]],moving:[[0,299,250,14,'y',12,1.5]],stars:[[325,63],[65,174],[200,359]],key:[60,360],portals:[[66,171,340,260],[340,260,66,186]],hazards:[{x:294,y:302,w:90,h:8,type:'laser',period:3.6,on:1.15,phase:1.8}]}
];
class EchoGame {
 constructor(canvas,options={}){
  this.canvas=canvas;this.ctx=canvas.getContext('2d');this.options=options;this.running=false;this.paused=false;this.duration=120;this.totalLevels=6;this.elapsed=0;this.angle=0;this.stars=0;this.level=1;this.completed=0;this.score=0;this.lives=3;this.energy=100;this.braking=false;this.brakeRequested=false;this.keys=new Set();this.pointer=null;this.particles=[];
  canvas.style.touchAction='none';
  canvas.addEventListener('pointerdown',e=>{if(!this.running||this.paused||this.pointer)return;e.preventDefault();canvas.focus({preventScroll:true});const r=canvas.getBoundingClientRect();this.pointer={id:e.pointerId,side:e.clientX<r.left+r.width/2?-1:1};try{canvas.setPointerCapture(e.pointerId);}catch(_){}});
  canvas.addEventListener('pointermove',e=>{if(this.pointer?.id!==e.pointerId)return;e.preventDefault();const r=canvas.getBoundingClientRect();this.pointer.side=e.clientX<r.left+r.width/2?-1:1;});
  const release=e=>{if(this.pointer?.id===e.pointerId)this.pointer=null;};canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  window.addEventListener('keydown',e=>{if(!this.running||this.paused)return;const k=e.key.toLowerCase();if(['arrowleft','arrowright','a','d',' '].includes(k)){e.preventDefault();this.keys.add(k);}});
  window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.clearInput());
  this.seed='preview';this.buildLevel();this.resize();
 }
 clearInput(){this.pointer=null;this.keys.clear();this.brakeRequested=false;this.braking=false;}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=Math.max(1,r.width||360);this.height=Math.max(1,r.height||450);this.dpr=Math.min(window.devicePixelRatio||1,2.5);this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);this.scale=Math.max(.1,Math.min(this.width/570,(this.height-65)/570));this.draw();}
 start(seed='today',startLevel=1){this.stop();this.seed=String(seed);this.elapsed=0;this.stars=0;this.level=clamp(Math.floor(startLevel)||1,1,6);this.completed=0;this.score=0;this.lives=3;this.energy=100;this.particles=[];this.lastUpdate=-1;this.buildLevel();this.running=true;this.lastTime=performance.now();this.emit();this.raf=requestAnimationFrame(t=>this.frame(t));}
 stop(){this.running=false;this.paused=false;cancelAnimationFrame(this.raf);this.clearInput();}
 pause(){if(!this.running||this.paused)return;this.paused=true;cancelAnimationFrame(this.raf);this.clearInput();this.emit();}
 resume(){if(!this.running||!this.paused)return;this.paused=false;this.lastTime=performance.now();this.raf=requestAnimationFrame(t=>this.frame(t));}
 setBrake(held){this.brakeRequested=Boolean(held);if(!held)this.braking=false;}
 buildLevel(){
  const map=LEVELS[this.level-1];let hash=0;for(const c of this.seed)hash=(Math.imul(hash,31)+c.charCodeAt(0))>>>0;this.seedPhase=(hash%997)/997*TAU;
  this.levelName=map.name;this.levelHint=map.hint;this.spawn={x:map.spawn[0],y:map.spawn[1]};this.ball={...this.spawn,vx:0,vy:0,r:16,hitTime:-100};this.angle=0;this.levelElapsed=0;this.invulnerableUntil=this.elapsed+1.8;this.portalCooldown=this.elapsed+.5;
  this.walls=map.walls.map(a=>({x:a[0],y:a[1],w:a[2],h:a[3]}));
  for(const a of map.moving||[])this.walls.push({x:a[0],y:a[1],baseX:a[0],baseY:a[1],w:a[2],h:a[3],axis:a[4],amplitude:a[5],speed:a[6],moving:true,vx:0,vy:0});
  this.pickups=map.stars.map(a=>({x:a[0],y:a[1],got:false}));this.keyItem=map.key?{x:map.key[0],y:map.key[1],got:false}:null;this.goal={x:map.goal[0],y:map.goal[1],locked:Boolean(this.keyItem)};
  this.portals=(map.portals||[]).map((a,i)=>({x:a[0],y:a[1],exitX:a[2],exitY:a[3],color:i?'#f58cff':'#65dcff'}));this.hazards=(map.hazards||[]).map(h=>({...h,active:false,phase:h.phase+this.seedPhase/TAU}));this.updateMechanisms(0);
 }
 emit(){this.options.onUpdate?.({score:this.score,stars:this.stars,timeLeft:Math.max(0,this.duration-this.elapsed),elapsed:this.elapsed,echoes:0,level:this.level,angle:this.angle,levels:this.completed,totalLevels:this.totalLevels,lives:this.lives,energy:this.energy,braking:this.braking,levelName:this.levelName,levelHint:this.levelHint,keyCollected:Boolean(this.keyItem?.got),hasKey:Boolean(this.keyItem),paused:this.paused});}
 frame(t){if(!this.running||this.paused)return;const dt=Math.min((t-this.lastTime)/1000,.04);this.lastTime=t;this.step(dt);this.draw();if(this.running&&!this.paused)this.raf=requestAnimationFrame(v=>this.frame(v));}
 step(dt){
  if(!this.running||this.paused)return;
  this.elapsed=Math.min(this.duration,this.elapsed+dt);
  const direction=this.pointer?.side??(Number(this.keys.has('arrowright')||this.keys.has('d'))-Number(this.keys.has('arrowleft')||this.keys.has('a')));
  this.angle=clamp(this.angle+direction*1.65*dt,-2.7,2.7);
  const requested=this.brakeRequested||this.keys.has(' ');this.braking=Boolean(requested&&this.energy>.05);this.energy=clamp(this.energy+(this.braking?-31:requested?0:20)*dt,0,100);
  const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
  for(let i=0;i<steps&&this.running;i++){this.levelElapsed+=h;this.updateMechanisms(h);this.physics(h);this.checkHazards();}
  if(!this.running)return;
  for(const star of this.pickups)if(!star.got&&Math.hypot(this.ball.x-star.x,this.ball.y-star.y)<28){star.got=true;this.stars++;this.burst(star.x,star.y,'#ffe083');this.options.onEvent?.('星星 +100');}
  if(this.keyItem&&!this.keyItem.got&&Math.hypot(this.ball.x-this.keyItem.x,this.ball.y-this.keyItem.y)<30){this.keyItem.got=true;this.goal.locked=false;this.burst(this.keyItem.x,this.keyItem.y,'#ffe083');this.options.onEvent?.('拿到钥匙，出口已解锁！');}
  if(this.elapsed>=this.portalCooldown)for(const portal of this.portals){if(Math.hypot(this.ball.x-portal.x,this.ball.y-portal.y)<27){this.burst(this.ball.x,this.ball.y,portal.color);this.ball.x=portal.exitX;this.ball.y=portal.exitY;this.ball.vx*=.45;this.ball.vy*=.45;this.portalCooldown=this.elapsed+1.2;this.invulnerableUntil=Math.max(this.invulnerableUntil,this.elapsed+.55);this.burst(this.ball.x,this.ball.y,portal.color);this.options.onEvent?.('咻！穿过虫洞');break;}}
  this.particles=this.particles.filter(p=>{p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;return p.life>0;});this.score=this.completed*500+this.stars*100;
  if(!this.goal.locked&&Math.hypot(this.ball.x-this.goal.x,this.ball.y-this.goal.y)<30){this.completed++;this.score=this.completed*500+this.stars*100;if(this.level===this.totalLevels){this.score+=Math.floor(Math.max(0,this.duration-this.elapsed)*10);this.finish('survived');return;}this.options.onEvent?.('过关 +500 · '+LEVELS[this.level].name);this.level++;this.energy=Math.min(100,this.energy+25);this.buildLevel();this.emit();}
  if(this.elapsed-this.lastUpdate>.08){this.lastUpdate=this.elapsed;this.emit();}if(this.elapsed>=this.duration)this.finish('timeout');
 }
 updateMechanisms(dt){for(const w of this.walls)if(w.moving){const oldX=w.x,oldY=w.y;const offset=Math.sin(this.levelElapsed*w.speed+this.seedPhase)*w.amplitude;w.x=w.baseX+(w.axis==='x'?offset:0);w.y=w.baseY+(w.axis==='y'?offset:0);w.vx=dt?(w.x-oldX)/dt:0;w.vy=dt?(w.y-oldY)/dt:0;}for(const h of this.hazards){h.active=this.levelElapsed>.9&&((this.levelElapsed+h.phase)%h.period)<h.on;h.warning=!h.active&&((this.levelElapsed+h.phase+.45)%h.period)<h.on;}}
 physics(dt){
  const b=this.ball,r=b.r;b.vx+=Math.sin(this.angle)*630*dt;b.vy+=Math.cos(this.angle)*630*dt;const drag=Math.exp(-(this.braking?14:.8)*dt);b.vx=clamp(b.vx*drag,-310,310);b.vy=clamp(b.vy*drag,-310,310);b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(let pass=0;pass<2;pass++)for(const w of this.walls){const qx=clamp(b.x,w.x,w.x+w.w),qy=clamp(b.y,w.y,w.y+w.h);let dx=b.x-qx,dy=b.y-qy,dist=Math.hypot(dx,dy);if(dist>=r)continue;if(dist<.0001){const choices=[{d:Math.abs(b.x-w.x),x:-1,y:0},{d:Math.abs(w.x+w.w-b.x),x:1,y:0},{d:Math.abs(b.y-w.y),x:0,y:-1},{d:Math.abs(w.y+w.h-b.y),x:0,y:1}].sort((a,c)=>a.d-c.d);dx=choices[0].x;dy=choices[0].y;dist=-choices[0].d;}else{dx/=dist;dy/=dist;}b.x+=dx*(r-dist);b.y+=dy*(r-dist);const vn=(b.vx-(w.vx||0))*dx+(b.vy-(w.vy||0))*dy;if(vn<0){b.vx-=1.12*vn*dx;b.vy-=1.12*vn*dy;}}
  if(b.x<r+5){b.x=r+5;b.vx=Math.abs(b.vx)*.18;}if(b.x>395-r){b.x=395-r;b.vx=-Math.abs(b.vx)*.18;}if(b.y<r+5){b.y=r+5;b.vy=Math.abs(b.vy)*.18;}if(b.y>395-r){b.y=395-r;b.vy=-Math.abs(b.vy)*.18;}
 }
 checkHazards(){if(this.elapsed<this.invulnerableUntil)return;const b=this.ball;for(const h of this.hazards){if(!h.active)continue;const hit=h.r?Math.hypot(b.x-h.x,b.y-h.y)<b.r+h.r-3:Math.hypot(b.x-clamp(b.x,h.x,h.x+h.w),b.y-clamp(b.y,h.y,h.y+h.h))<b.r-2;if(hit){this.damage();break;}}}
 damage(){this.lives--;this.burst(this.ball.x,this.ball.y,'#ff8398');this.ball.hitTime=this.elapsed;if(this.lives<=0){this.score=this.completed*500+this.stars*100;this.finish('lives');return;}this.ball.x=this.spawn.x;this.ball.y=this.spawn.y;this.ball.vx=0;this.ball.vy=0;this.angle=0;this.invulnerableUntil=this.elapsed+1.8;this.portalCooldown=this.elapsed+.7;this.options.onEvent?.('护盾破裂！剩余 '+this.lives+' 颗心');this.emit();}
 finish(reason){if(!this.running)return;this.running=false;this.clearInput();this.emit();this.options.onEnd?.({score:this.score,stars:this.stars,elapsed:this.elapsed,reason,seed:this.seed,levels:this.completed,lives:this.lives,totalLevels:this.totalLevels});}
 burst(x,y,color){for(let i=0;i<14;i++){const a=i/14*TAU;this.particles.push({x,y,vx:Math.cos(a)*70,vy:Math.sin(a)*70,life:.55,color});}}
 draw(){if(window.TiltRenderer){window.TiltRenderer.draw(this);return;}const c=this.ctx;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#101827';c.fillRect(0,0,this.width,this.height);c.save();c.translate(this.width/2,(this.height-44)/2);c.rotate(this.angle);c.scale(this.scale,this.scale);c.translate(-200,-200);c.fillStyle='#202a3b';c.fillRect(0,0,400,400);c.fillStyle='#c5a7ee';for(const w of this.walls)c.fillRect(w.x,w.y,w.w,w.h);c.fillStyle='#c9fa92';c.beginPath();c.arc(this.ball.x,this.ball.y,this.ball.r,0,TAU);c.fill();c.restore();}
}
window.EchoGame=EchoGame;
})();

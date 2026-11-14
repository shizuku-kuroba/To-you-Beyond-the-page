// R13 Atelier: self-contained Canvas 2D effects — plate astrolabe, glyph particles,
// answer comets, bursts and the final constellation card. No renderer, no network.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const mobile=matchMedia('(max-width: 600px)');
const fxRand=(a,b)=>a+Math.random()*(b-a);
const fxDpr=()=>Math.min(devicePixelRatio||1,2);
const FX_ARCS=[[1,5,'I'],[6,15,'II'],[16,26,'III'],[27,36,'IV']];
const FX_MONO="ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,'PingFang TC','Microsoft JhengHei',monospace";
function fxFit(canvas){const rect=canvas.getBoundingClientRect(),ratio=fxDpr();const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);return {ctx,w,h}}
// Deterministic hash → [0,1). Star positions are hashed so nobody can read answers back from the picture.
export function fxHash(str){let h=2166136261>>>0;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}h^=h>>>13;h=Math.imul(h,0x5bd1e995);h^=h>>>15;return (h>>>0)/4294967296}
const fxAngle=q=>-Math.PI/2+(q-.5)/36*Math.PI*2;
export function starGeometry(q,v){const a=fxAngle(q)+(fxHash(`a${q}:${v}`)-.5)*.16;const r=.24+.68*fxHash(`r${q}:${v}`);return {x:Math.cos(a)*r,y:Math.sin(a)*r}}
const FX_RAYS=Array.from({length:132},(_,i)=>({l:fxHash('ray'+i),b:i%6===0}));

function sparkle(ctx,x,y,s,alpha,glow){ctx.save();ctx.globalAlpha=alpha;if(glow){const g=ctx.createRadialGradient(x,y,0,x,y,s*5);g.addColorStop(0,'rgba(210,220,255,.55)');g.addColorStop(1,'rgba(210,220,255,0)');ctx.fillStyle=g;ctx.fillRect(x-s*5,y-s*5,s*10,s*10)}ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,y-s*2.2);ctx.quadraticCurveTo(x,y,x+s*2.2,y);ctx.quadraticCurveTo(x,y,x,y+s*2.2);ctx.quadraticCurveTo(x,y,x-s*2.2,y);ctx.quadraticCurveTo(x,y,x,y-s*2.2);ctx.fill();ctx.restore()}

// Engraved astrolabe: sunburst rays, rings, 36 ticks, section arcs and hashed stars.
function drawAstrolabe(ctx,cx,cy,R,stars,now,{rays=true,spin=0,lineAlpha=.5}={}){
 ctx.save();ctx.lineWidth=1;
 if(rays){for(let i=0;i<FX_RAYS.length;i++){const ray=FX_RAYS[i],a=i/FX_RAYS.length*Math.PI*2+spin;const r0=R*1.3,r1=R*(1.42+(ray.b?1.3:.75)*ray.l);ctx.strokeStyle=ray.b?'rgba(255,255,255,.16)':'rgba(255,255,255,.07)';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.stroke()}}
 ctx.strokeStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.moveTo(cx-R*1.24,cy);ctx.lineTo(cx+R*1.24,cy);ctx.moveTo(cx,cy-R*1.24);ctx.lineTo(cx,cy+R*1.24);ctx.stroke();
 ctx.setLineDash([2,5]);ctx.strokeStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.arc(cx,cy,R*.24,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(cx,cy,R*.62,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 ctx.strokeStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(cx,cy,R,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='rgba(255,255,255,.24)';ctx.beginPath();ctx.arc(cx,cy,R*1.045,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<144;i++){const a=i/144*Math.PI*2;ctx.strokeStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R*1.045,cy+Math.sin(a)*R*1.045);ctx.lineTo(cx+Math.cos(a)*R*(1.045+(i%4?0.012:0.03)),cy+Math.sin(a)*R*(1.045+(i%4?0.012:0.03)));ctx.stroke()}
 for(let q=1;q<=36;q++){const a=fxAngle(q),lit=stars.has(q)&&stars.get(q).born<=now;ctx.strokeStyle=lit?'rgba(255,255,255,.95)':'rgba(255,255,255,.38)';ctx.lineWidth=lit?1.6:1;const l=lit?R*.075:R*.035;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.lineTo(cx+Math.cos(a)*(R-l),cy+Math.sin(a)*(R-l));ctx.stroke()}
 ctx.lineWidth=1;const fs=Math.max(11,R*.085);ctx.font=`500 ${fs}px 'Cormorant Garamond',serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 for(const [a0,a1,label] of FX_ARCS){const s=fxAngle(a0)-Math.PI/36+.03,e=fxAngle(a1)+Math.PI/36-.03;ctx.strokeStyle='rgba(255,255,255,.42)';ctx.beginPath();ctx.arc(cx,cy,R*1.13,s,e);ctx.stroke();const m=(s+e)/2;ctx.fillStyle='rgba(255,255,255,.78)';ctx.fillText(label,cx+Math.cos(m)*R*1.22,cy+Math.sin(m)*R*1.22)}
 // constellation lines join consecutive answered entries inside one plate
 const lit=[...stars.entries()].filter(([,s])=>s.born<=now).sort((a,b)=>a[0]-b[0]);
 ctx.strokeStyle=`rgba(255,255,255,${lineAlpha})`;ctx.lineWidth=1;
 for(let i=1;i<lit.length;i++){const [qa,sa]=lit[i-1],[qb,sb]=lit[i];if(FX_ARCS.findIndex(x=>qa>=x[0]&&qa<=x[1])!==FX_ARCS.findIndex(x=>qb>=x[0]&&qb<=x[1]))continue;const A=starGeometry(qa,sa.v),B=starGeometry(qb,sb.v);ctx.beginPath();ctx.moveTo(cx+A.x*R,cy+A.y*R);ctx.lineTo(cx+B.x*R,cy+B.y*R);ctx.stroke()}
 for(const [q,s] of lit){const p=starGeometry(q,s.v),age=(now-s.born)/700,boost=age<1?(1-age)*2.4:0;sparkle(ctx,cx+p.x*R,cy+p.y*R,Math.max(1.6,R*.016)*(1+boost),1,true)}
 ctx.restore()
}

// The plate: glyph particles that morph between frontispiece "36", Roman numerals and a halo.
export function initPlate(canvas){
 const host=canvas.parentElement;let ctx,w=1,h=1,cx=0,cy=0,R=1,frame=0,visible=true,parts=[],glyph=null,mode='dust',spin=0,wind=0,flareUntil=0,lastStatic=0;
 const stars=new Map(),pointer={x:-1e4,y:-1e4};
 const total=()=>mobile.matches?460:980;
 function layout(){({ctx,w,h}=fxFit(canvas));const band=w<901&&h<520;cx=w/2;cy=h*(band?.47:.5);R=Math.max(40,Math.min(w*.34,h*(band?.26:.3)));if(parts.length!==total())parts=Array.from({length:total()},()=>({x:fxRand(0,w),y:fxRand(0,h),vx:0,vy:0,tx:null,ty:null,s:fxRand(.8,1.9),ph:fxRand(0,7)}));retarget(false)}
 function sample(text){const off=document.createElement('canvas');off.width=w;off.height=h;const o=off.getContext('2d',{willReadFrequently:true});let size=R*1.5;o.font=`500 ${size}px 'Cormorant Garamond',serif`;const m=o.measureText(text).width;if(m>R*1.25)size*=R*1.25/m;o.font=`500 ${size}px 'Cormorant Garamond',serif`;o.textAlign='center';o.textBaseline='middle';o.fillStyle='#fff';o.fillText(text,cx,cy+size*.03);const d=o.getImageData(0,0,w,h).data,gap=w<500?3:4,pts=[];for(let y=0;y<h;y+=gap)for(let x=0;x<w;x+=gap)if(d[(y*w+x)*4+3]>150)pts.push([x+fxRand(-.6,.6),y+fxRand(-.6,.6)]);for(let i=pts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pts[i],pts[j]]=[pts[j],pts[i]]}return pts}
 function retarget(kick=true){let pts=[];if(mode==='glyph'&&glyph)pts=sample(glyph);else if(mode==='halo')pts=Array.from({length:Math.round(parts.length*.75)},(_,i)=>{const a=i/(parts.length*.75)*Math.PI*2,r=R*fxRand(1.02,1.09);return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});
  const use=Math.min(pts.length,Math.round(parts.length*.82));parts.forEach((p,i)=>{if(i<use){p.tx=pts[i][0];p.ty=pts[i][1]}else{p.tx=null;p.ty=null}if(kick&&!reduced.matches){const a=fxRand(0,Math.PI*2),f=fxRand(2,7);p.vx+=Math.cos(a)*f;p.vy+=Math.sin(a)*f}if(reduced.matches&&p.tx!=null){p.x=p.tx;p.y=p.ty}});drawStatic()}
 function step(now){spin+=.00012;for(const p of parts){if(p.tx!=null){p.vx+=(p.tx-p.x)*.055;p.vy+=(p.ty-p.y)*.055;p.vx*=.8;p.vy*=.8}else{p.vx+=fxRand(-.03,.03);p.vy+=fxRand(-.03,.03)+wind*.04;p.vx*=.97;p.vy*=.97;if(p.x<-4)p.x=w+4;if(p.x>w+4)p.x=-4;if(p.y<-4)p.y=h+4;if(p.y>h+4)p.y=-4}
   const dx=p.x-pointer.x,dy=p.y-pointer.y,d2=dx*dx+dy*dy;if(d2<8100){const d=Math.sqrt(d2)||1,f=(1-d/90)*2.6;p.vx+=dx/d*f;p.vy+=dy/d*f}p.x+=p.vx;p.y+=p.vy}wind*=.94}
 function paint(now){ctx.clearRect(0,0,w,h);drawAstrolabe(ctx,cx,cy,R,stars,now,{spin});const flare=now<flareUntil?(flareUntil-now)/900:0;
  for(const p of parts){const tw=reduced.matches?.8:.55+.35*Math.sin(now*.002+p.ph);const a=p.tx!=null?Math.min(1,(mode==='halo'?.6:.92)*tw+flare*.4):.3*tw;ctx.fillStyle=`rgba(232,236,255,${a})`;const s=p.s*(p.tx!=null?1:.8)+flare;ctx.fillRect(p.x-s/2,p.y-s/2,s,s)}
  // re-draw lit stars above the glyph so the constellation reads first
  const lit=[...stars.entries()].filter(([,s])=>s.born<=now);for(const [q,s] of lit){const g=starGeometry(q,s.v),age=(now-s.born)/700;sparkle(ctx,cx+g.x*R,cy+g.y*R,Math.max(1.6,R*.016)*(1+(age<1?(1-age)*2.4:0)),1,false)}}
 function tick(now){if(!visible)return;step(now);paint(now);frame=requestAnimationFrame(tick)}
 function drawStatic(){if(!ctx)return;if(reduced.matches){paint(performance.now()+1e5);return}if(!frame&&visible)frame=requestAnimationFrame(tick)}
 const io=new IntersectionObserver(e=>{visible=e[0].isIntersecting;cancelAnimationFrame(frame);frame=0;if(visible&&!reduced.matches)frame=requestAnimationFrame(tick);else if(visible)drawStatic()});
 const ro=new ResizeObserver(()=>layout());ro.observe(canvas);io.observe(canvas);
 const move=e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top};const leave=()=>{pointer.x=pointer.y=-1e4};
 host.addEventListener('pointermove',move);host.addEventListener('pointerleave',leave);
 const motion=()=>{cancelAnimationFrame(frame);frame=0;retarget(false);if(!reduced.matches&&visible)frame=requestAnimationFrame(tick)};reduced.addEventListener('change',motion);
 layout();document.fonts?.load?.("500 100px 'Cormorant Garamond'").then(()=>retarget(false)).catch(()=>{});
 return {
  setGlyph(text,next='glyph'){const changed=text!==glyph||next!==mode;glyph=text;mode=text?'glyph':next;if(changed)retarget(true)},
  setStar(q,v,delay=0){stars.set(q,{v,born:reduced.matches?0:performance.now()+delay});drawStatic()},
  setStars(map){stars.clear();for(const [q,v] of Object.entries(map))stars.set(Number(q),{v,born:0});drawStatic()},
  starPoint(q,v){const r=canvas.getBoundingClientRect(),g=starGeometry(q,v),x=r.left+cx+g.x*R,y=r.top+cy+g.y*R;return {x,y,visible:y>8&&y<innerHeight-8&&x>0&&x<innerWidth}},
  flare(){flareUntil=performance.now()+900;if(!reduced.matches)for(const p of parts){const a=Math.atan2(p.y-cy,p.x-cx);p.vx+=Math.cos(a)*fxRand(1,4);p.vy+=Math.sin(a)*fxRand(1,4)}drawStatic()},
  wind(force){wind=Math.max(-3,Math.min(3,wind+force))},
  destroy(){cancelAnimationFrame(frame);io.disconnect();ro.disconnect();host.removeEventListener('pointermove',move);host.removeEventListener('pointerleave',leave);reduced.removeEventListener('change',motion)}
 }
}

// Quiet drifting dust for blue cards (ending constellation card).
export function initAmbient(canvas){
 if(!canvas)return()=>{};
 let frame=0,visible=true,points=[],ctx,w,h;
 function resize(){({ctx,w,h}=fxFit(canvas));const count=Math.min(mobile.matches?40:90,Math.max(24,Math.round(w*h/9000)));points=Array.from({length:count},()=>({x:fxRand(0,w),y:fxRand(0,h),s:fxRand(.8,2.2),vx:fxRand(-.12,.12),vy:fxRand(-.2,-.04),phase:fxRand(0,7)}));draw(0)}
 function draw(t){ctx.clearRect(0,0,w,h);for(const p of points){if(!reduced.matches){p.x=(p.x+p.vx+w)%w;p.y=(p.y+p.vy+h)%h}ctx.fillStyle=`rgba(232,236,255,${reduced.matches?.6:.35+.35*Math.sin(t*.0018+p.phase)})`;ctx.fillRect(p.x,p.y,p.s,p.s)}}
 function tick(t){if(!visible||reduced.matches)return;draw(t);frame=requestAnimationFrame(tick)}
 const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;cancelAnimationFrame(frame);if(visible&&!reduced.matches)frame=requestAnimationFrame(tick)});
 const resizer=new ResizeObserver(resize);resizer.observe(canvas);observer.observe(canvas);resize();frame=requestAnimationFrame(tick);
 const motion=()=>{cancelAnimationFrame(frame);draw(0);if(!reduced.matches&&visible)frame=requestAnimationFrame(tick)};reduced.addEventListener('change',motion);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();resizer.disconnect();reduced.removeEventListener('change',motion)}
}

// Scrolling long plates: the plate's dust feels the wind; on phones (plate off-screen) edge sparks appear.
export function initScrollFeedback(plate){
 const canvas=document.createElement('canvas');canvas.id='scroll-feedback';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
 let ctx,w,h,frame=0,dots=[],lastY=scrollY,lastTime=performance.now();
 function resize(){({ctx,w,h}=fxFit(canvas))}resize();
 function paint(){ctx.clearRect(0,0,w,h);dots=dots.filter(p=>p.life>0);for(const p of dots){ctx.fillStyle=`rgba(0,0,242,${p.life*.7})`;ctx.fillRect(p.x,p.y,p.r,p.r);p.life-=mobile.matches?.07:.045;p.y+=p.vy}if(dots.length)frame=requestAnimationFrame(paint);else frame=0}
 function onScroll(){if(reduced.matches)return;const now=performance.now(),delta=scrollY-lastY,speed=Math.abs(delta)/Math.max(16,now-lastTime);lastY=scrollY;lastTime=now;if(Math.abs(delta)<4)return;plate?.wind(Math.sign(delta)*-Math.min(1.2,speed));if(!mobile.matches)return;const count=Math.min(2,Math.max(1,Math.round(speed)));for(let i=0;i<count;i++)dots.push({x:Math.random()<.5?fxRand(3,14):fxRand(w-14,w-3),y:fxRand(h*.15,h*.85),r:fxRand(1.5,2.6),vy:fxRand(-.4,.4),life:.6});if(dots.length>40)dots.splice(0,dots.length-40);if(!frame)frame=requestAnimationFrame(paint)}
 function motion(){if(reduced.matches){cancelAnimationFrame(frame);frame=0;dots=[];ctx.clearRect(0,0,w,h)}}
 addEventListener('resize',resize);addEventListener('scroll',onScroll,{passive:true});reduced.addEventListener('change',motion);
 return()=>{removeEventListener('resize',resize);removeEventListener('scroll',onScroll);reduced.removeEventListener('change',motion);cancelAnimationFrame(frame);canvas.remove()}
}

// One shared overlay for bursts and comets.
let fxLayer=null,fxCtx=null,fxItems=[],fxFrame=0,fxW=0,fxH=0;
function fxOverlay(){if(!fxLayer){fxLayer=document.createElement('canvas');fxLayer.id='burst-layer';fxLayer.setAttribute('aria-hidden','true');document.body.append(fxLayer);addEventListener('resize',()=>{({ctx:fxCtx,w:fxW,h:fxH}=fxFit(fxLayer))});({ctx:fxCtx,w:fxW,h:fxH}=fxFit(fxLayer))}return fxCtx}
function fxRun(item){fxOverlay();fxItems.push(item);if(!fxFrame)fxFrame=requestAnimationFrame(fxLoop)}
function fxLoop(now){fxCtx.clearRect(0,0,fxW,fxH);fxItems=fxItems.filter(it=>it(fxCtx,now));fxFrame=fxItems.length?requestAnimationFrame(fxLoop):0;if(!fxFrame)fxCtx.clearRect(0,0,fxW,fxH)}
function fxInk(ctx,x,y,s,a){ctx.fillStyle=`rgba(0,0,242,${a})`;ctx.fillRect(x-s/2,y-s/2,s,s);ctx.fillStyle=`rgba(255,255,255,${a})`;ctx.fillRect(x-s/6,y-s/6,s/3,s/3)}
function burst(x,y,big){
 const start=performance.now(),duration=reduced.matches?180:big?1500:460,count=big?(mobile.matches?70:150):(mobile.matches?6:9),spread=big?Math.min(innerWidth,innerHeight)*.55:34;
 const list=Array.from({length:count},(_,i)=>({a:Math.PI*2*i/count+fxRand(-.15,.15),d:fxRand(spread*.4,spread),s:fxRand(big?2.5:1.6,big?6:3)}));const peak=big?1:.45;
 fxRun((ctx,now)=>{const p=Math.max(0,Math.min(1,(now-start)/duration)),e=1-Math.pow(1-p,3);
  if(big){for(let k=0;k<3;k++){const r=e*spread*(.5+k*.35);ctx.strokeStyle=`rgba(0,0,242,${(1-p)*.5})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}}
  for(const it of list){const r=reduced.matches?it.d*.7:it.d*e;fxInk(ctx,x+Math.cos(it.a)*r,y+Math.sin(it.a)*r,it.s*(1-p*.5),(reduced.matches?.9:1-p)*peak)}return p<1})
}
export function burstAt(element){const rect=element.getBoundingClientRect();burst(rect.left+rect.width/2,rect.top+rect.height/2,false)}
export function completionBurst(){burst(innerWidth/2,innerHeight/2,true)}
// A comet from the chosen answer to its star on the plate (or to the progress seal on phones).
export function launchStar(element,target,onArrive){
 const r=element.getBoundingClientRect(),x0=r.left+r.width/2,y0=r.top+r.height/2;
 if(reduced.matches||!target){onArrive?.();return}
 const {x:x1,y:y1}=target,dist=Math.hypot(x1-x0,y1-y0),start=performance.now(),duration=Math.min(1050,480+dist*.55);
 const nx=-(y1-y0)/(dist||1),ny=(x1-x0)/(dist||1),bend=dist*.16*(Math.random()<.5?-1:1),mx=(x0+x1)/2+nx*bend,my=(y0+y1)/2+ny*bend-dist*.06;
 const trail=[];let done=false;
 fxRun((ctx,now)=>{const p=Math.max(0,Math.min(1,(now-start)/duration)),t=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;const x=(1-t)*(1-t)*x0+2*(1-t)*t*mx+t*t*x1,y=(1-t)*(1-t)*y0+2*(1-t)*t*my+t*t*y1;trail.push([x,y]);if(trail.length>10)trail.shift();
  // Soft fade in/out so the comet never sits heavily over the text being read.
  const fade=Math.min(1,p*5,(1-p)*4+.35)*.6;
  if(trail.length>1){ctx.lineCap='round';for(let i=1;i<trail.length;i++){ctx.strokeStyle=`rgba(70,70,255,${fade*i/trail.length*.55})`;ctx.lineWidth=.6+i*.12;ctx.beginPath();ctx.moveTo(trail[i-1][0],trail[i-1][1]);ctx.lineTo(trail[i][0],trail[i][1]);ctx.stroke()}}
  const g=ctx.createRadialGradient(x,y,0,x,y,8);g.addColorStop(0,`rgba(90,90,255,${fade*.5})`);g.addColorStop(1,'rgba(90,90,255,0)');ctx.fillStyle=g;ctx.fillRect(x-8,y-8,16,16);ctx.fillStyle=`rgba(255,255,255,${fade+.2})`;ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();
  if(p>=1&&!done){done=true;onArrive?.()}return p<1})
}

// Final keepsake: a 4:5 plate rendered from the respondent's hashed stars.
export function renderConstellation(answers,{serial='0000',date='',name=''}={}){
 const W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
 const bg=ctx.createRadialGradient(W/2,H*.44,40,W/2,H*.44,H*.8);bg.addColorStop(0,'#1f1fff');bg.addColorStop(.5,'#0000f2');bg.addColorStop(1,'#00008f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 for(let i=0;i<520;i++){const x=fxHash('dx'+i+serial)*W,y=fxHash('dy'+i+serial)*H,s=.8+fxHash('ds'+i)*1.8;ctx.fillStyle=`rgba(232,236,255,${.12+fxHash('da'+i)*.4})`;ctx.fillRect(x,y,s,s)}
 const stars=new Map(Object.entries(answers).map(([q,v])=>[Number(q),{v,born:0}]));
 drawAstrolabe(ctx,W/2,H*.44,330,stars,1e9,{lineAlpha:.62});
 ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=1.5;ctx.strokeRect(36,36,W-72,H-72);ctx.strokeRect(48,48,W-96,H-96);
 ctx.fillStyle='rgba(255,255,255,.85)';ctx.font=`500 22px ${FX_MONO}`;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillText('K / RESEARCH INSTRUMENT',84,108);ctx.textAlign='right';ctx.fillText('FIG_036 · 36 / 36',W-84,108);
 ctx.textAlign='center';ctx.fillStyle='#fff';
 const label=String(name||'').trim().slice(0,24);
 if(label){
  // The respondent's own words: Latin in Cormorant, CJK/kana in the system Song/Mincho face.
  let size=104;const face=s=>`400 ${s}px 'Cormorant Garamond','Songti TC','STSong','Hiragino Mincho ProN','PMingLiU',serif`;ctx.font=face(size);while(ctx.measureText(label).width>W-240&&size>40){size-=4;ctx.font=face(size)}
  ctx.font=`500 22px ${FX_MONO}`;ctx.fillStyle='rgba(255,255,255,.72)';ctx.fillText('TO YOU, BEYOND THE PAGE',W/2,H-286);
  ctx.fillStyle='#fff';ctx.font=face(size);ctx.fillText(label,W/2,H-190);
  ctx.font=`500 22px ${FX_MONO}`;ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText(`PLATE NO. ${serial}  ·  ${date}`,W/2,H-128);
 }else{
  ctx.font="400 96px 'Cormorant Garamond',serif";ctx.fillText(`Plate No. ${serial}`,W/2,H-210);
  ctx.font=`500 22px ${FX_MONO}`;ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText('TO YOU, BEYOND THE PAGE  ·  致彼方的你  ·  '+date,W/2,H-150);
 }
 return c
}

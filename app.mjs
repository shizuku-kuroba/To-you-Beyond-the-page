import {initAmbient,initPlate,burstAt,launchStar,completionBurst,initScrollFeedback,renderConstellation,fxHash} from './particles.mjs';
const form=await (await fetch('./questionnaire.json')).json();
const root=document.querySelector('#content');
const progress=document.querySelector('.progress-dial');
const progressFill=document.querySelector('#progress-fill');
const wrap=document.querySelector('.progress-wrap'),toggle=document.querySelector('#progress-toggle');
function setProgressOpen(open){wrap.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open))}
toggle.addEventListener('click',()=>setProgressOpen(toggle.getAttribute('aria-expanded')!=='true'));
document.addEventListener('pointerdown',event=>{if(!wrap.contains(event.target))setProgressOpen(false)});
let step=0, answers={}, gate={}, sending=false, submissionId=crypto.randomUUID(), stopPanel=()=>{}, stopScroll=()=>{};
const plate=initPlate(document.querySelector('.plate-canvas'));
// GitHub Pages build: config.js sets the Google Apps Script /exec URL. text/plain avoids a CORS preflight,
// which Apps Script cannot answer; the redirected reply is readable cross-origin.
const ENDPOINT=(window.W05_ENDPOINT||'').trim();
function postToSheet(){return fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload()),redirect:'follow'})}
// duration_sec: seconds from first entering Part 1 to pressing submit (wall clock, so it survives a refresh).
let startedAt=0;
function payload(){const d=startedAt?Math.round((Date.now()-startedAt)/1000):null;return {id:submissionId,answers,duration:Number.isInteger(d)&&d>=0?d:null}}
const PLATES=[['I','The Portrait'],['II','Attachment'],['III','Support'],['IV','Confidence']];
const milestones=new Set(),completedPlates=new Set();
// Autosave: progress lives in this tab's sessionStorage only — it survives a refresh or app switch,
// is wiped when the tab closes, and is cleared after a successful submit. The same submission ID is
// reused after a refresh so a retried submit can never create a second row.
const SAVE_KEY='w05-progress';let restored=false;
function saveProgress(){try{if(step>5){sessionStorage.removeItem(SAVE_KEY);return}sessionStorage.setItem(SAVE_KEY,JSON.stringify({v:1,step,answers,gate,id:submissionId,startedAt}))}catch{}}
try{const s=JSON.parse(sessionStorage.getItem(SAVE_KEY)||'null');
 const okAnswers=s&&s.answers&&typeof s.answers==='object'&&Object.entries(s.answers).every(([k,v])=>/^([1-9]|[12]\d|3[0-6])$/.test(k)&&Number.isInteger(v)&&v>=1&&v<=6);
 if(s&&s.v===1&&Number.isInteger(s.step)&&s.step>=0&&s.step<=5&&okAnswers&&typeof s.id==='string'&&/^[a-zA-Z0-9-]{8,80}$/.test(s.id)){
  step=s.step;answers=s.answers;gate=s.gate&&typeof s.gate==='object'?s.gate:{};submissionId=s.id;if(Number.isFinite(s.startedAt)&&s.startedAt>0)startedAt=s.startedAt;restored=step>0||Object.keys(answers).length>0;
  const n=Object.keys(answers).length;for(const m of [1,9,18,27])if(n>=m)milestones.add(m);
  for(let st=2;st<=5;st++)if(form.sections[st-2].questions.every(q=>answers[q.id]))completedPlates.add(st);
 }}catch{}
const motionOK=()=>!matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad=(n,l=2)=>String(n).padStart(l,'0');

function stepMeta(s){
 if(s===0)return {glyph:'36',fig:'FIG_000',title:'Prologue',display:['To You,','Beyond the Page'],zh:'致彼方的你'};
 if(s===1)return {glyph:'§',fig:'FIG_000 §',title:'Before We Begin',display:['Before','We Begin']};
 if(s>=2&&s<=5){const [roman,fr]=PLATES[s-2],first=form.sections[s-2].questions[0].id;return {glyph:roman,fig:`FIG_${pad(first,3)}`,title:`Plate ${roman} / ${fr}`,display:[`Plate ${roman}`,fr]}}
 if(s===6)return {glyph:null,mode:'halo',fig:'FIG_036',title:'Your Constellation',display:['Your','Constellation']};
 return {glyph:null,mode:'dust',fig:'FIG_∅',title:'Thank You',display:['Thank You']};
}
function updateProgress(){const count=Object.keys(answers).length,percent=Math.round(count/36*100);progress.setAttribute('aria-valuenow',String(count));progress.setAttribute('aria-valuetext',`已完成 ${count} / 36 題，${percent}%`);progressFill.style.strokeDasharray=`${count/36*100} 100`;document.querySelector('#progress-count').textContent=`已完成 ${count} / 36 題`;document.querySelector('#progress-percent').textContent=`${percent}%`;toggle.setAttribute('aria-label',`查看答題進度：已完成 ${count} / 36 題，${percent}%`);document.querySelector('#progress-stage').textContent=step===0?'研究說明':step===1?'參與資格':step>=2&&step<=5?`第 ${step-1} / 4 部分`:step===6?'填答完成':'問卷結束';document.querySelector('#plate-stars').textContent=`STARS ${pad(count)} / 36`}

// Opening handshake: a terminal log types itself while the bar fills, then holds on READY.
function startBoot(){const boot=document.querySelector('#boot');if(!boot)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const duration=reduced?100:1250,start=performance.now(),target='READY / 問卷就緒',chars='01A8F#@%<>/✦';document.querySelector('.stage').inert=true;let timer=0;
 const log=["> opening the observatory ....... ok","> calibrating the astrolabe ..... ok","> 36 stars standing by .......... ok","> 致彼方的你 .................... ok"],logEl=document.querySelector('#boot-log');
 const paint=()=>{const fraction=Math.min(1,(performance.now()-start)/duration),pct=Math.min(100,Math.round((1-Math.pow(1-fraction,1.45))*100));document.querySelector('#boot-fill').style.width=`${pct}%`;document.querySelector('#boot-percent').textContent=`${pct}%`;logEl.textContent=log.filter((_,i)=>fraction>=i/log.length*.9).join('\n');document.querySelector('#boot-text').textContent=fraction>=1?target:[...target].map((char,i)=>char===' '?char:(i/target.length<fraction*.8?char:chars[Math.floor(Math.random()*chars.length)])).join('');if(fraction>=1){clearInterval(timer);setTimeout(()=>{boot.classList.add('done');setTimeout(()=>{boot.remove();document.querySelector('.stage').inert=false},reduced?0:240)},reduced?100:400)}};
 timer=setInterval(paint,32);paint();}
startBoot();

const theme=document.querySelector('#theme');
let savedTheme=null;try{savedTheme=localStorage.getItem('w05-theme')}catch{}
if(savedTheme==='light'||savedTheme==='dark')document.documentElement.dataset.theme=savedTheme;
theme.onclick=()=>{const current=document.documentElement.dataset.theme|| (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');const next=current==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('w05-theme',next)}catch{}};

function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function para(text,cls){root.append(el('p',cls,text))}
let toastTimer=0;const toastQueue=[];
function toast(text){toastQueue.push(text);if(toastQueue.length===1)showToast()}
function showToast(){const box=document.querySelector('#toast');if(!toastQueue.length){box.classList.remove('show');return}box.textContent=toastQueue[0];box.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastQueue.shift();box.classList.remove('show');setTimeout(showToast,260)},2300)}
function plateLog(text){const log=document.querySelector('#plate-log');log.textContent=text;log.classList.remove('blink');void log.offsetWidth;log.classList.add('blink')}

// The source intro is line-delimited Markdown: list markers and a mailto link.
// Render text nodes only; never interpret research copy as arbitrary HTML.
function renderIntro(markdown){const container=el('div','intro intro-copy');let list=null;
 for(const raw of markdown.split(/\r?\n/)){const line=raw.trim();if(!line){list=null;continue}
  if(/^-\s+/.test(line)){if(!list){list=el('ul');container.append(list)}list.append(el('li','',line.replace(/^-\s+/,'')));continue}
  list=null;const paragraph=el('p');const link=line.match(/^(.*)\[([^\]]+)\]\(mailto:([^\s)]+)\)(.*)$/);
  if(link && link[2]===link[3]){paragraph.append(document.createTextNode(link[1]));const anchor=el('a','',link[2]);anchor.href=`mailto:${link[3]}`;paragraph.append(anchor,document.createTextNode(link[4]))}
  else paragraph.textContent=line;
  container.append(paragraph);
 }root.append(container)}
function masthead(meta,kicker,title){const fig=el('p','fig');fig.append(el('span','',meta.fig),el('span','fig-title',meta.title.split(' / ')[0]));fig.setAttribute('aria-hidden','true');const display=el('div','display');display.setAttribute('aria-hidden','true');meta.display.forEach(line=>display.append(el('span','',line)));if(meta.zh)display.prepend(el('em','display-zh',meta.zh));root.append(fig,display);if(kicker)root.append(el('p','eyebrow',kicker));root.append(el('h1','',title))}
function engravingSlot(part){const slot=el('div','engraving-slot');slot.dataset.part=String(part).padStart(2,'0');slot.setAttribute('aria-hidden','true');root.append(slot)}
function nextOpen(after){return [...root.querySelectorAll('.question')].find(q=>q!==after&&!(q.compareDocumentPosition(after)&Node.DOCUMENT_POSITION_FOLLOWING)&&!q.classList.contains('is-answered'))}
function glideTo(question){if(!question)return;const r=question.getBoundingClientRect();if(r.top>innerHeight*.55||r.bottom<0)question.scrollIntoView({block:'center',behavior:motionOK()?'smooth':'auto'})}
function choices(key,title,options,value){
 const outer=el('div','question');outer.dataset.key=key;const numeric=/^\d+$/.test(key);
 const field=el('fieldset');const legend=el('legend');
 if(numeric){const no=el('span','q-no');no.append(el('span','q-fig','FIG.'),document.createTextNode(pad(key)));legend.append(no)}
 legend.append(el('span','q-text',title));field.append(legend);
 const likert=numeric&&Number(key)>=6;const list=el('div',likert?'options likert':'options');
 const readout=el('span','likert-readout',value?options[value-1]:'');readout.setAttribute('aria-hidden','true');
 if(value){outer.classList.add('is-answered');list.style.setProperty('--level',(value-1)/(options.length-1))}
 options.forEach((label,i)=>{const wrap=el('label',likert?'option likert-option':'option');const input=el('input');input.type='radio';input.name='q'+key;input.value=String(i+1);input.checked=value===i+1;input.setAttribute('aria-label',`${i+1} — ${label}`);
  input.addEventListener('change',()=>{const first=!outer.classList.contains('is-answered');if(key==='consent'||key==='screen')gate[key]=i+1;else answers[key]=i+1;saveProgress();updateProgress();burstAt(wrap);
   outer.classList.remove('invalid');outer.classList.add('is-answered');document.querySelector('.error').textContent='';readout.textContent=label;list.style.setProperty('--level',(i)/(Math.max(1,options.length-1)));
   if(numeric)answered(Number(key),i+1,wrap);
   if(first&&numeric&&!keyboardPick)setTimeout(()=>glideTo(nextOpen(outer)),320)});
  wrap.append(input,el('span','',likert?String(i+1):label));if(!likert)wrap.dataset.index=pad(i+1);list.append(wrap)});
 field.append(list);
 if(likert){const ends=el('div','likert-ends');ends.append(el('span','',options[0]),readout,el('span','',options.at(-1)));field.append(ends)}
 outer.append(field);root.append(outer);
}
// Every answer becomes a star: a comet flies to the astrolabe and lights it.
function answered(q,v,from){const point=plate.starPoint(q,v);let target=point;if(!point.visible){const r=toggle.getBoundingClientRect();target={x:r.left+r.width/2,y:r.top+r.height/2}}
 plate.setStar(q,v,motionOK()?99999:0);
 launchStar(from,target,()=>{plate.setStar(q,v,0);plateLog(`> FIG.${pad(q)} recorded ✦`);wrap.classList.remove('ping');void wrap.offsetWidth;wrap.classList.add('ping')});
 const count=Object.keys(answers).length,notes={1:'✦ 第一顆星亮了　每答一題，星盤就多一顆星',9:'✦ 09 / 36　星座開始成形',18:'✦ 18 / 36　星盤已亮一半',27:'✦ 27 / 36　只剩最後一幅圖版'};
 if(notes[count]&&!milestones.has(count)){milestones.add(count);toast(notes[count])}
 if(step>=2&&step<=5&&!completedPlates.has(step)&&form.sections[step-2].questions.every(x=>answers[x.id])){completedPlates.add(step);plate.flare();document.querySelector('.primary')?.classList.add('ready');toast(`Plate ${PLATES[step-2][0]} ✦ 完成　可以前往下一頁`)}}
function actions(nextLabel,back=true){const box=el('div','actions');if(back){const prev=el('button','secondary','← 上一頁');prev.type='button';prev.onclick=()=>{step--;render()};box.append(prev)}const next=el('button','primary',nextLabel);next.type='button';next.onclick=advance;if(step>=2&&step<=5&&completedPlates.has(step))next.classList.add('ready');box.append(next);root.append(el('p','error'));root.append(box)}
function keyHint(max){if(!matchMedia('(hover:hover) and (pointer:fine)').matches)return;const hint=el('p','kbd-hint');hint.setAttribute('aria-hidden','true');hint.append(el('kbd','',`1–${max}`),document.createTextNode(' 直接作答，自動跳到下一題　'),el('kbd','','Enter'),document.createTextNode(' 下一頁'));root.append(hint)}
function serialOf(a){return Math.floor(fxHash(JSON.stringify(a))*65536).toString(16).toUpperCase().padStart(4,'0')}
function ending(title,body,success=false){root.classList.add('ending');if(success)root.classList.add('ending-success');const meta=stepMeta(step);masthead(meta,'END / 問卷結束',title);root.append(el('div','ending-symbol',success?'✦':'○'));para(body,'instruction');
 if(success){const card=el('figure','atmospheric keepsake');const canvas=el('canvas','ambient-panel');canvas.setAttribute('aria-hidden','true');const d=new Date(),date=`${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())}`,serial=serialOf(answers);
  // Optional name for the keepsake only: never stored, never sent, not part of the answers.
  const field=el('div','name-field'),label=el('label','','最後，想把那位角色的名字寫在星圖上嗎？（選填）'),input=el('input');label.htmlFor='keepsake-name';input.id='keepsake-name';input.type='text';input.maxLength=24;input.autocomplete='off';input.placeholder='角色名字 / Character name';
  field.append(label,input,el('p','name-note','名字只會畫在這張圖卡上，不會送出、也不會被記錄。'));root.append(field);
  const img=el('img');img.width=1080;img.height=1350;const save=el('a','primary save','下載星圖 ↓');save.download=`plate-${serial}.png`;
  const paint=()=>{const name=input.value.trim();img.src=renderConstellation(answers,{serial,date,name}).toDataURL('image/png');img.alt=name?`致 ${name} 的星圖，Plate No. ${serial}`:`Plate No. ${serial}：由您 36 次作答生成的星座圖`;save.href=img.src};
  let typing=0;input.addEventListener('input',()=>{clearTimeout(typing);typing=setTimeout(paint,180)});input.addEventListener('keydown',e=>{if(e.key==='Enter')input.blur()});paint();
  const cap=el('figcaption');cap.append(el('span','',`PLATE NO. ${serial}`),el('span','',date));card.append(canvas,img,cap);root.append(card);stopPanel=initAmbient(canvas);
  para('星點位置由作答以雜湊方式生成，每一份都不同；不是評分或診斷，旁人也無法從圖反推答案。','note');
  const box=el('div','actions');box.append(save,el('span','save-hint','手機可長按圖片儲存'));root.append(box)}}
function render(){if(step===2&&!startedAt)startedAt=Date.now();saveProgress();stopPanel();stopPanel=()=>{};stopScroll();root.classList.remove('content');root.replaceChildren();root.classList.remove('ending','ending-success','atmospheric','question-card','sheet');document.body.dataset.step=String(step);if(step>=2&&step<=5)root.classList.add('question-card');else root.classList.add('sheet');updateProgress();
 const meta=stepMeta(step);plate.setGlyph(meta.glyph,meta.mode);document.querySelector('#plate-fig').textContent=meta.fig;document.querySelector('#plate-title').textContent=meta.title;
 if(step===0){masthead(meta,null,'虛構角色與 AI 社會支持問卷');renderIntro(form.intro);choices('consent',form.consent,form.consentOptions,gate.consent);actions('進入觀測室 →',false)}
 else if(step===1){masthead(meta,'ELIGIBILITY / 參與資格','填答前，請先確認');para(form.screening,'instruction');choices('screen',form.screeningOptions.length?'請選擇符合情況':'',form.screeningOptions,gate.screen);actions('繼續 →')}
 else if(step>=2&&step<=5){const sec=form.sections[step-2];engravingSlot(step-1);masthead(meta,`PART ${String(step-1).padStart(2,'0')} / 04`,sec.title);para(sec.instruction,'instruction');if(sec.scaleLine)para(sec.scaleLine,'scale');keyHint(Math.max(...sec.questions.map(q=>(q.options??sec.options).length)));sec.questions.forEach(q=>choices(String(q.id),q.text,q.options??sec.options,answers[q.id]));actions(step===5?'送出問卷 ✦':'下一幅圖版 →')}
 else if(step===6)ending('問卷到此結束',`${form.thanks}\n資料已送出，無法撤回。`,true);
 else if(step===7)ending('感謝您的閱讀','您選擇不參與，本次不會送出任何填答資料。');
 else if(step===8)ending('感謝您的時間','本研究僅邀請符合上述條件的參與者填答，您的資料沒有送出。');
 if(step>=3&&step<=5)stopScroll=initScrollFeedback(plate);
 void root.offsetWidth;root.classList.add('content');
 window.scrollTo({top:0,behavior:motionOK()?'smooth':'instant'});
}
async function advance(){if(sending)return;const key=step===0?'consent':step===1?'screen':null;const missing=key?[gate[key]?null:key].filter(Boolean):form.sections[step-2].questions.filter(q=>!answers[q.id]).map(q=>String(q.id));
 if(missing.length){document.querySelector('.error').textContent=`尚有 ${missing.length} 題未選，請選擇後繼續。`;for(const item of missing)document.querySelector(`[data-key="${item}"]`)?.classList.add('invalid');document.querySelector(`[data-key="${missing[0]}"] input`)?.focus();return}
 if(step===0&&gate.consent===2){step=7;render();return}if(step===1&&gate.screen===2){step=8;render();return}
 if(step===5){sending=true;const btn=document.querySelector('.primary');btn.disabled=true;btn.textContent='星圖傳送中…';try{const response=ENDPOINT?await postToSheet():await fetch('/api/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload())});const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'伺服器未確認儲存');step=6;render();completionBurst()}catch(err){document.querySelector('.error').textContent=`送出失敗：${err.message}。請保留此頁並重試。`;btn.disabled=false;btn.textContent='重新送出 ✦'}finally{sending=false}return}
 step++;render()}
// Keyboard: 1–6 answers the current entry, Enter turns the page, Escape closes the seal.
let keyboardPick=false;
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setProgressOpen(false);toggle.focus();return}
 if(event.metaKey||event.ctrlKey||event.altKey||document.querySelector('#boot')||step>5)return;
 if(event.key==='Enter'&&event.target.matches?.('input[type=radio]')){event.preventDefault();advance();return}
 if(!/^[1-9]$/.test(event.key)||step<2)return;
 const active=document.activeElement?.closest?.('.question');const list=[...root.querySelectorAll('.question')];
 const current=active||list.find(q=>{const r=q.getBoundingClientRect();return !q.classList.contains('is-answered')&&r.bottom>60&&r.top<innerHeight})||list.find(q=>!q.classList.contains('is-answered'));
 const input=current?.querySelectorAll('input')[Number(event.key)-1];if(!input)return;event.preventDefault();
 keyboardPick=true;input.checked=true;input.dispatchEvent(new Event('change',{bubbles:true}));keyboardPick=false;
 const next=nextOpen(current);if(next){next.querySelector('input').focus({preventScroll:true});glideTo(next)}else input.focus({preventScroll:true});
});
plate.setStars(answers);
render();
if(restored)setTimeout(()=>toast(`已接續上次的進度　${Object.keys(answers).length} / 36 題`),1900);

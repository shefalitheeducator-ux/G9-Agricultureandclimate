/* ===== Sky to Soil PAL · learner model, adaptation engine and views ===== */
(function(){
'use strict';
var app = document.getElementById('app');
var IT = {}; ITEMS.forEach(function(i){ IT[i.id]=i; i.tm = uniq((i.mis||[]).concat((i.chips||[]).map(function(c){return c.m;})).filter(Boolean)); });
var DIAG = ITEMS.filter(function(i){return i.use==='diag';});
var LET = 'ABCDEF';
var REP = [['diagram','Diagram'],['story','Story'],['steps','Steps'],['activity','Try it'],['video','Video']];
var K1 = [['farm','Farms and villages'],['city','Towns and cities'],['coast','The coast and the sea'],['hills','Hills and mountains']];
var K2 = [['diagram','Pictures and diagrams'],['story','A real-life story'],['steps','Clear steps, one at a time'],['activity','Trying a quick activity']];
var ROUTE = {
 foundation:{t:'Step-by-step path',code:'A · Foundation',lv:1},
 guided:{t:'Guided path',code:'B · Guided',lv:2},
 repair:{t:'Fix-an-idea path',code:'C · Misconception repair',lv:2},
 extend:{t:'Challenge path',code:'D · Extension',lv:3},
 confirm:{t:'Quick-check path',code:'E · Confirmation',lv:2}
};
var KEY = 'sky2soil-pal-v1';

function uniq(a){ return a.filter(function(x,i){ return a.indexOf(x)===i; }); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function r2(x){ return Math.round(x*100)/100; }
function freshCl(){ return {m:0,dm:null,route:null,reason:'',mis:[],resolved:[],level:1,seen:[],up:0,down:0,pc:0,hints:0,stage:'intro',ri:0,agree:{},cp:{tries:0,passed:false,set:[],idx:0,res:[]},pcAtFail:0,flag:false,override:false,status:'new',relearn:false,prereqDone:false,lastType:null,log:[],tab:null}; }
function fresh(){ return {v:1,id:newId(),name:'',cls:'',k1:null,k2:null,view:'welcome',diag:{i:0,ans:{}},cl:{ATM:freshCl(),WEA:freshCl(),MON:freshCl(),CLC:freshCl()},mission:null,ui:null,frq:{},rub:{},routines:{},fp:{},pledge:{},reflect:{},notes:{},events:[],scale:1,tTab:'report',tf:{cl:'all',use:'all'},review:null,showAns:false}; }
function newId(){ var c='abcdefghijklmnopqrstuvwxyz0123456789', a=new Uint8Array(20), id=''; try{ crypto.getRandomValues(a); }catch(e){ for(var i=0;i<a.length;i++) a[i]=Math.random()*256; } for(var j=0;j<a.length;j++) id+=c[a[j]%36]; return id; }
function load(){ try{ var t=localStorage.getItem(KEY); if(!t) return null; var o=JSON.parse(t); return (o && o.v===1)?o:null; }catch(e){ return null; } }
var S = load() || fresh();
if(!S.id) S.id=newId();
var lastKey = '';
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} queueSync(); }

/* ---------- send progress to the teacher (only when the app is on a website, not opened as a file) ---------- */
var SYNC_URL = 'api/save', canSync = /^https?:$/.test(location.protocol), syncT = null, lastSent = '';
function snapshot(){ var o={}; for(var k in S) if(k!=='events' && k!=='ui' && k!=='review') o[k]=S[k]; return JSON.stringify({id:S.id,state:o}); }
function sendNow(leaving){
 clearTimeout(syncT); if(!canSync || !S.name.trim()) return;
 var body=snapshot(); if(body===lastSent) return;
 if(leaving && navigator.sendBeacon){ if(navigator.sendBeacon(SYNC_URL, new Blob([body],{type:'text/plain;charset=UTF-8'}))) lastSent=body; return; }
 fetch(SYNC_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:body}).then(function(r){ if(r.ok) lastSent=body; }).catch(function(){});
}
function queueSync(){ clearTimeout(syncT); syncT=setTimeout(sendNow, 3000); }
document.addEventListener('visibilitychange', function(){ if(document.visibilityState==='hidden') sendNow(true); });
window.addEventListener('pagehide', function(){ sendNow(true); });
function logE(type, d){ var e={t:new Date().toISOString(),type:type}; for(var k in d) e[k]=d[k]; S.events.push(e); if(S.events.length>400) S.events.shift(); }
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.hidden=false; clearTimeout(toast.h); toast.h=setTimeout(function(){ t.hidden=true; },2600); }
function applyScale(){ document.documentElement.style.setProperty('--scale', S.scale); }

/* ---------- learner model ---------- */
function word(m){ return m>=0.9?'Ready for a challenge':m>=0.8?'Strong':m>=0.6?'Growing':m>=0.4?'Getting there':'Starting out'; }
function band(m){ return m>=0.9?'Provisional mastery':m>=0.8?'Proficient':m>=0.6?'Developing':m>=0.4?'Emerging':'Beginning'; }
function diagE(ok, conf){ if(ok) return conf==='sure'?1:conf==='some'?0.85:0.5; return conf==='guess'?0.15:conf==='some'?0.05:0; }
function pracE(ok, att, hints, partial){ if(ok){ if(att===0) return hints===0?1:hints===1?0.7:0.5; return hints>=2?0.3:0.4; } return partial ? r2(partial*0.5) : 0; }
function reasonText(k, route){
 var C=S.cl[k];
 if(route==='repair'){ var m=MIS[C.mis[0]]; return 'You chose an idea that many people believe: “'+m.think+'” We will look at it closely first, then practise.'; }
 return {foundation:'These ideas look new for you. We will start with the basics, one step at a time.',
  guided:'You already know part of this. We will start with a worked example, then practise.',
  confirm:'You got these right, but you said you guessed. A few quick questions will show what you really know.',
  extend:'You got both clues right and felt sure. You can start with challenge questions.'}[route];
}
function setRoute(k, route){ var C=S.cl[k]; C.route=route; C.level=ROUTE[route].lv; C.reason=reasonText(k,route); }
function computeRoutes(){
 ORDER.forEach(function(k){
  var C=S.cl[k], ds=DIAG.filter(function(d){return d.cl===k;}).sort(function(a,b){return a.dok-b.dok || a.id.localeCompare(b.id);});
  var a=S.diag.ans[ds[0].id], b=S.diag.ans[ds[1].id];
  C.m = r2(0.4*diagE(a.correct,a.conf) + 0.6*diagE(b.correct,b.conf)); C.dm = C.m;
  C.mis = uniq([a,b].filter(function(x){ return !x.correct && x.conf!=='guess' && x.mis; }).map(function(x){ return x.mis; }));
  var route;
  if(C.mis.length) route='repair';
  else if(a.correct && b.correct && (a.conf==='guess'||b.conf==='guess')) route='confirm';
  else if(C.m>=0.8) route='extend';
  else if(C.m>=0.4) route='guided';
  else route='foundation';
  setRoute(k, route);
 });
 logE('routes',{routes:ORDER.map(function(k){return k+':'+S.cl[k].route;}).join(' ')});
}

/* ---------- adaptation ---------- */
function poolLeft(k){ var C=S.cl[k]; return ITEMS.filter(function(i){ return i.cl===k && i.use==='prac' && C.seen.indexOf(i.id)<0; }); }
function pickPractice(k){
 var C=S.cl[k], pool=poolLeft(k); if(!pool.length) return null;
 function sc(i){ var s=Math.abs(i.lv-C.level)*10; if(C.mis.length && i.tm.some(function(m){return C.mis.indexOf(m)>=0;})) s-=8; if(i.type===C.lastType) s+=2; if(i.lv>C.level) s+=1; return s; }
 pool.sort(function(a,b){ return sc(a)-sc(b) || a.id.localeCompare(b.id); });
 return pool[0];
}
function readyForCp(k){
 var C=S.cl[k], left=poolLeft(k).length; if(!left) return true;
 if(C.cp.tries>0){ var since=C.pc-C.pcAtFail; return (since>=2 && C.m>=0.7) || since>=4; }
 var min = C.route==='extend'?2:3;
 return (C.pc>=min && C.m>=0.75) || C.pc>=6;
}
function newUI(id, mode, cl){ var it=IT[id]; return {id:id,mode:mode,cl:cl,sel:it.type==='multi'?[]:it.type==='dnd'?{}:null,att:0,hints:0,conf:null,done:false,res:null,wrongIdx:[],bad:[],pick:null,firstMis:[],tryMsg:false}; }
function loadNextPractice(k){ var it=pickPractice(k); if(!it){ S.cl[k].stage='ready'; S.ui=null; return; } S.ui=newUI(it.id,'prac',k); }
function firstStage(k){ var C=S.cl[k]; if(k==='MON' && S.cl.WEA.m<0.6 && S.cl.WEA.status!=='mastered' && !C.prereqDone) return 'prereq'; return afterPrereq(k); }
function afterPrereq(k){ var C=S.cl[k]; if(C.route==='repair' && C.mis.length) return 'repair'; if(C.route==='extend') return 'practice'; return 'learn'; }
function setStage(k, st){
 var C=S.cl[k]; C.stage=st; S.ui=null;
 if(st==='practice') loadNextPractice(k);
 if(st==='prereq'){ var w=['WEA-P4','WEA-P1','WEA-P2'].filter(function(id){ return S.cl.WEA.seen.indexOf(id)<0; })[0] || 'WEA-P4'; S.ui=newUI(w,'warm','WEA'); }
 if(st==='cp'){ buildCp(k); S.ui=newUI(C.cp.set[0],'cp',k); }
 logE('stage',{cl:k,stage:st});
}
function buildCp(k){
 var C=S.cl[k], chk=ITEMS.filter(function(i){return i.cl===k && i.use==='chk';}).map(function(i){return i.id;}), set;
 if(C.cp.tries===0) set=chk.slice();
 else { set=poolLeft(k).filter(function(i){return i.lv>=2;}).map(function(i){return i.id;}).slice(0,2); var j=0; while(set.length<2){ set.push(chk[j++]); } }
 C.cp.set=set; C.cp.idx=0; C.cp.res=[];
}
function evalItem(it, sel){
 if(it.type==='mcq'){ var ok=sel===it.key; return {score:ok?1:0,ok:ok,mis:ok?[]:[it.mis&&it.mis[sel]].filter(Boolean),bad:[]}; }
 if(it.type==='multi'){ var s=sel||[], c=s.filter(function(x){return it.keys.indexOf(x)>=0;}).length, w=s.filter(function(x){return it.keys.indexOf(x)<0;}); return {score:Math.max(0,(c-w.length)/it.keys.length),ok:c===it.keys.length&&!w.length,mis:w.map(function(x){return it.mis&&it.mis[x];}).filter(Boolean),bad:w}; }
 var pl=sel||{}, n=0, bad=[], mis=[]; it.chips.forEach(function(ch,ix){ if(pl[ix]===ch.b) n++; else { bad.push(ix); if(ch.m) mis.push(ch.m); } });
 return {score:n/it.chips.length, ok:n===it.chips.length, bad:bad, mis:uniq(mis)};
}
function complete(it, sel){ if(it.type==='mcq') return sel!=null; if(it.type==='multi') return sel.length>0; return Object.keys(sel).length===it.chips.length; }
function updM(C, E){ C.m = r2(0.7*C.m + 0.3*E); }

function finishItem(r){
 var u=S.ui, it=IT[u.id]; u.done=true; u.res={ok:r.ok,score:r.score,bad:r.bad};
 var misAll=uniq((u.firstMis||[]).concat(r.mis));
 if(u.mode==='prac' || u.mode==='warm'){
  var k=u.cl, C=S.cl[k], E=pracE(r.ok,u.att,u.hints,r.score); u.E=E;
  C.seen.push(it.id); C.hints+=u.hints; C.lastType=it.type; updM(C,E);
  if(u.mode==='prac'){
   C.pc++;
   if(E>=0.7){ C.up++; C.down=0; } else if(E<0.4){ C.down++; C.up=0; } else { C.up=0; C.down=0; }
   if(C.up>=2 && C.level<3){ C.level++; C.up=0; u.levelUp=true; }
   if(C.down>=2){ C.level=Math.max(1,C.level-1); C.down=0; C.relearn=true; }
   misAll.forEach(function(m){ if(C.mis.indexOf(m)<0 && MIS[m] && MIS[m].cl===k) C.mis.push(m); });
   if(r.ok && u.att===0){ it.tm.forEach(function(m){ var ix=C.mis.indexOf(m); if(ix>=0){ C.mis.splice(ix,1); if(C.resolved.indexOf(m)<0) C.resolved.push(m); u.fixed=m; } }); }
  }
  C.log.push({id:it.id,E:E,ok:r.ok,att:u.att,hints:u.hints,lv:it.lv,mode:u.mode,t:new Date().toISOString()});
  logE('attempt',{cl:k,item:it.id,ok:r.ok,E:E,hints:u.hints,att:u.att});
 } else if(u.mode==='cp'){
  var C2=S.cl[u.cl], E2=diagE(r.ok,'sure'); u.E=E2; C2.seen.push(it.id); updM(C2,E2);
  C2.cp.res.push({id:it.id,ok:r.ok,E:E2});
  C2.log.push({id:it.id,E:E2,ok:r.ok,att:0,hints:0,lv:it.lv,mode:'cp',t:new Date().toISOString()});
  logE('checkpoint',{cl:u.cl,item:it.id,ok:r.ok});
 } else if(u.mode==='rev'){
  S.review.res.push({id:it.id,ok:r.ok}); logE('review',{item:it.id,ok:r.ok});
 }
}
function evalCp(k){
 var C=S.cl[k], res=C.cp.res, all=res.every(function(x){return x.ok;}), avg=res.reduce(function(a,x){return a+x.E;},0)/res.length;
 C.cp.tries++;
 if(all && avg>=0.7){ C.cp.passed=true; C.status='mastered'; C.m=Math.max(C.m,0.85); C.mis=[]; logE('mastered',{cl:k}); }
 else { C.pcAtFail=C.pc; C.level=2; if(C.cp.tries>=2) C.flag=true; logE('cp-not-yet',{cl:k,tries:C.cp.tries}); }
 C.stage='cpres'; S.ui=null;
}

/* ---------- shared view pieces ---------- */
function rail(){
 var steps=['Start','About you','Clues','My map','Missions','Finish'];
 var idx={welcome:0,k1:1,k2:1,howto:2,diag:2,map:3,mission:4,finish:5,review:5}[S.view]||0;
 return '<nav class="rail" aria-label="Your journey"><ol>'+steps.map(function(s,i){ return '<li class="'+(i<idx?'done':i===idx?'now':'')+'"'+(i===idx?' aria-current="step"':'')+'><span class="dot" aria-hidden="true"></span>'+s+'</li>'; }).join('')+'</ol></nav>';
}
function figHTML(f){ return '<figure class="figbox">'+SVGS[f.svg](f)+(f.cap?'<figcaption>'+esc(f.cap)+'</figcaption>':'')+'</figure>'; }
function stimHTML(st){
 if(st.svg) return '<figure class="figbox stim">'+SVGS[st.svg](st)+'</figure>';
 if(st.table){ var t=st.table; return '<div class="tw"><table class="data"><caption>'+esc(t.cap)+'</caption><thead><tr>'+t.head.map(function(h){return '<th scope="col">'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+t.rows.map(function(r){return '<tr>'+r.map(function(c,i){return i?'<td class="num">'+esc(c)+'</td>':'<th scope="row">'+esc(c)+'</th>';}).join('')+'</tr>';}).join('')+'</tbody></table></div>'; }
 if(st.text) return '<div class="case"><p class="eyebrow">Read the case</p><p>'+esc(st.text)+'</p></div>';
 return '';
}
function speakBtn(target){ return '<button class="linkbtn" data-act="speak" data-target="'+target+'" aria-label="Read aloud">'+ICON.speak+' Read aloud</button>'; }
var ICON = {
 speak:'<svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M3 8h3l4-3v10l-4-3H3z" fill="currentColor"/><path d="M13 7c1.2 1.6 1.2 4.4 0 6M15.5 5c2.3 2.8 2.3 7.2 0 10" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>',
 sprout:'<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 21v-8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 13c0-4-3-6-7-6 0 4 3 6 7 6zM12 11c0-4 3-7 8-7 0 5-3 7-8 7z" fill="currentColor"/></svg>',
 badge:'<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="9" r="6" fill="currentColor"/><path d="M8 14l-2 7 6-3 6 3-2-7" fill="currentColor" opacity=".6"/></svg>'
};
function meter(m, lbl){ return '<div class="meter-row"><div class="meter" role="img" aria-label="'+esc(lbl||word(m))+'"><i style="width:'+Math.round(Math.max(0.04,m)*100)+'%"></i></div><span class="meter-l">'+esc(lbl||word(m))+'</span></div>'; }

/* ---------- item renderer ---------- */
function renderItem(it, mode){
 var u=S.ui, h='<div class="item">';
 if(it.stim) h+=stimHTML(it.stim);
 h+='<p class="stem" id="stem-'+esc(it.id)+'">'+esc(it.stem)+'</p>';
 if(it.type==='mcq'){
  h+='<div class="opts" role="group" aria-labelledby="stem-'+esc(it.id)+'">';
  it.opts.forEach(function(o,i){
   var cls='', dis=u.done || u.wrongIdx.indexOf(i)>=0;
   if(u.done){ if(i===it.key) cls='right'; else if(i===u.sel || u.wrongIdx.indexOf(i)>=0) cls='wrong'; }
   else if(u.wrongIdx.indexOf(i)>=0) cls='wrong';
   h+='<button class="opt '+cls+'" data-act="pick" data-i="'+i+'" aria-pressed="'+(u.sel===i)+'"'+(dis?' disabled':'')+'><span class="let">'+LET[i]+'</span><span>'+esc(o)+'</span></button>';
  });
  h+='</div>';
 } else if(it.type==='multi'){
  h+='<div class="opts" role="group" aria-labelledby="stem-'+esc(it.id)+'">';
  it.opts.forEach(function(o,i){
   var on=u.sel.indexOf(i)>=0, cls='';
   if(u.done){ var k=it.keys.indexOf(i)>=0; cls = k&&on?'right':k?'missed':on?'wrong':''; }
   h+='<button class="opt check '+cls+'" data-act="toggle" data-i="'+i+'" aria-pressed="'+on+'"'+(u.done?' disabled':'')+'><span class="box" aria-hidden="true">'+(on?'✓':'')+'</span><span>'+esc(o)+(cls==='missed'?' <em class="tagm">(also true)</em>':'')+'</span></button>';
  });
  h+='</div>';
 } else h+=dndHTML(it, u);
 if(u.tryMsg && !u.done) h+='<div class="fb try" role="status"><strong>Not quite yet.</strong> Have another go. '+(it.type==='dnd'?'The cards with a dashed edge are in the wrong place.':'')+'</div>';
 if(u.hints>0 && it.hint) h+='<div class="hints">'+it.hint.slice(0,u.hints).map(function(x,i){return '<p><strong>Hint '+(i+1)+':</strong> '+esc(x)+'</p>';}).join('')+'</div>';
 if(u.done && mode!=='diag') h+=feedbackHTML(it,u);
 if(u.done && mode==='diag') h+='<div class="fb '+(u.sel===it.key?'good':'learn')+'" role="status"><p><strong>'+(u.sel===it.key?'Yes, that’s right!':'The right answer is '+LET[it.key]+'.')+'</strong></p></div>';
 h+='<div class="row actions">';
 if(mode==='diag'){
  if(!u.done) h+='<button class="btn" data-act="diag-check"'+(complete(it,u.sel)?'':' disabled')+'>Check answer</button>';
  else h+='<button class="btn" data-act="diag-next">'+(S.diag.i<DIAG.length-1?'Next clue':'See my starting map')+'</button>';
 } else if(!u.done){
  h+='<button class="btn" data-act="check"'+(complete(it,u.sel)?'':' disabled')+'>Check answer</button>';
  if((mode==='prac'||mode==='warm') && it.hint && u.hints<it.hint.length) h+='<button class="btn ghost" data-act="hint">Show a hint</button>';
 } else {
  h+='<button class="btn" data-act="next" data-focus-after>Next</button>';
 }
 h+='</div></div>';
 return h;
}
function dndHTML(it, u){
 var order = shuffleIdx(it.chips.length, it.id), placed=u.sel, h='<div class="dnd">';
 h+='<p class="small">'+(u.pick!=null?'Now tap a box to place “'+esc(it.chips[u.pick].t)+'”.':'Tap a card, then tap a box. You can also drag the cards.')+'</p>';
 function chip(ix){ var cls=''; if(u.done){ cls = u.res.bad.indexOf(ix)>=0?'bad':'ok'; } else if(u.bad.indexOf(ix)>=0) cls='bad';
  return '<button class="dchip '+cls+'" draggable="'+(!u.done)+'" data-act="chip" data-i="'+ix+'" aria-pressed="'+(u.pick===ix)+'"'+(u.done?' disabled':'')+'>'+esc(it.chips[ix].t)+(u.done&&cls==='bad'?' <em>→ '+esc(it.buckets.filter(function(b){return b.id===it.chips[ix].b;})[0].label)+'</em>':'')+'</button>'; }
 var tray=order.filter(function(ix){ return placed[ix]==null; });
 h+='<div class="tray" data-drop="tray" aria-label="Cards to place">'+(tray.length?tray.map(chip).join(''):'<span class="small">All cards placed.</span>')+(u.pick!=null&&placed[u.pick]!=null?'<button class="linkbtn" data-act="tray">Move back here</button>':'')+'</div>';
 h+='<div class="buckets'+(it.order?' ordered':'')+'">';
 it.buckets.forEach(function(b){
  var inB=order.filter(function(ix){ return placed[ix]===b.id; });
  h+='<div class="bucket'+(u.pick!=null&&!u.done?' target':'')+'" data-drop="'+esc(b.id)+'"><button class="bhead" data-act="bucket" data-b="'+esc(b.id)+'"'+(u.done?' disabled':'')+'>'+esc(b.label)+'</button><div class="bin">'+inB.map(chip).join('')+'</div></div>';
 });
 return h+'</div></div>';
}
function seeded(str){ var h=2166136261; for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return function(){ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%10000)/10000; }; }
function shuffleIdx(n,id){ var r=seeded(id), a=[]; for(var i=0;i<n;i++) a.push(i); for(var j=n-1;j>0;j--){ var k=Math.floor(r()*(j+1)); var t=a[j]; a[j]=a[k]; a[k]=t; } return a; }
function feedbackHTML(it,u){
 var r=u.res, h='<div class="fb '+(r.ok?'good':'learn')+'" role="status">';
 h+= r.ok ? '<p><strong>'+(u.att===0&&u.hints===0?'Yes, well done!':'Yes, you got there!')+'</strong> '+esc(it.exp)+'</p>'
          : '<p><strong>Here is how to think about it.</strong> '+(it.type==='mcq'?'The answer is '+LET[it.key]+'. ':'')+esc(it.exp)+'</p>';
 var shown=uniq((u.firstMis||[]).concat(evalItem(it,u.sel).mis)).filter(function(m){return MIS[m];})[0];
 if(!r.ok && shown) h+='<div class="myth"><p class="eyebrow">A common idea</p><p>Many people think: “'+esc(MIS[shown].think)+'”</p><p><strong>What really happens:</strong> '+esc(MIS[shown].fact)+'</p></div>';
 if(u.fixed) h+='<p class="small">You have fixed the idea: “'+esc(MIS[u.fixed].think)+'”</p>';
 if(u.levelUp) h+='<p class="small"><strong>Next level unlocked.</strong> The next questions will stretch you a bit more.</p>';
 return h+'</div>';
}

/* ---------- learner screens ---------- */
function vWelcome(){
 var started = S.diag.i>0 || S.view!=='welcome';
 return '<section class="card hero">'+SVGS.hero()+'<div class="stack"><p class="eyebrow">Grade 9 · Geography · Chapter 3</p><h1 data-focus tabindex="-1">Atmosphere and Climate</h1>'
 +'<p class="lead">From the sky above us to the soil of our farms. First, find out what you already know. Then follow your own path through four missions.</p>'
 +'<p class="note">This is not a test for marks. Your answers help you and your teacher choose the best place to start.</p>'
 +'<div class="field"><label for="nm">What is your name?</label><input id="nm" data-save="name" value="'+esc(S.name)+'" autocomplete="given-name" maxlength="40"></div>'
 +'<p class="err" id="nmErr" hidden>Please type your name to begin.</p>'
 +'<div class="field"><label for="cls">Your class and section <span class="small">(for example 9A)</span></label><input id="cls" data-save="cls" value="'+esc(S.cls)+'" maxlength="20"></div>'
 +'<div class="row"><button class="btn" data-act="start">'+(S.diag.i>=DIAG.length?'Go to my map':S.diag.i>0?'Continue':'Let’s begin')+'</button></div>'
 +'<p class="small">We save your name, class and answers on this device and send them to your teacher. Use A− and A+ at the top to change the text size.</p></div></section>';
}
function vK(n){
 var Q = n===1 ? {q:'Hi '+esc(S.name)+'! Which kind of place would you like your examples to come from?',o:K1,v:S.k1,sub:'Your examples and stories will come from places like this.'}
               : {q:'When you learn something new, what helps you most?',o:K2,v:S.k2,sub:'Each lesson will open this way first. You can always try another way.'};
 return '<section class="card stack"><p class="eyebrow">About you · Question '+n+' of 2</p><h2 data-focus tabindex="-1">'+Q.q+'</h2><p class="small">'+Q.sub+'</p><div class="opts">'
  + Q.o.map(function(o,i){ return '<button class="opt" data-act="kpick" data-k="'+n+'" data-v="'+o[0]+'" aria-pressed="'+(Q.v===o[0])+'"><span class="let">'+LET[i]+'</span><span>'+o[1]+'</span></button>'; }).join('')+'</div>'
  + '<div class="row"><button class="btn ghost" data-act="back" data-to="'+(n===1?'welcome':'k1')+'">Back</button></div></section>';
}
function vHowto(){
 return '<section class="card stack"><p class="eyebrow">The clue round</p><h2 data-focus tabindex="-1">8 clues to find your starting point</h2><ul class="list">'
 +'<li>There are <strong>8 questions</strong>, two for each mission.</li><li>Choose one answer. Then tell us <strong>how sure you are</strong>.</li><li>There are no hints and no marks. You will see the answers on your map at the end.</li><li>It takes about 10 minutes.</li></ul>'
 +'<div class="row"><button class="btn" data-act="go-diag">Start the clues</button></div></section>';
}
function vDiag(){
 var it=DIAG[S.diag.i]; if(!S.ui || S.ui.id!==it.id) S.ui=newUI(it.id,'diag',it.cl);
 return '<section class="card stack"><div class="row between"><p class="eyebrow">Clue '+(S.diag.i+1)+' of '+DIAG.length+' · Mission '+CL[it.cl].no+'</p>'+speakBtn('stem-'+it.id)+'</div>'
  +'<div class="meter thin" aria-hidden="true"><i style="width:'+Math.round(S.diag.i/DIAG.length*100)+'%"></i></div>'
  +'<h2 class="vh" data-focus tabindex="-1">Clue '+(S.diag.i+1)+'</h2>'+renderItem(it,'diag')+'</section>';
}
function recommended(){ for(var i=0;i<ORDER.length;i++){ var s=S.cl[ORDER[i]].status; if(s!=='mastered' && s!=='practised') return ORDER[i]; } return null; }
function vMap(){
 var rec=recommended(), anyDone=ORDER.some(function(k){ return S.cl[k].status==='mastered'||S.cl[k].status==='practised'; });
 var h='<section class="stack"><div class="card stack"><p class="eyebrow">Your starting map</p><h1 data-focus tabindex="-1">'+esc(S.name||'Your')+'’s learning map</h1><p>This is your starting map, not your final result. Your path will change as you learn.</p></div><div class="mgrid">';
 ORDER.forEach(function(k){
  var C=S.cl[k], c=CL[k], st={new:'Not started',active:'In progress',mastered:'Badge earned',practised:'Practised'}[C.status];
  h+='<article class="card mcard'+(k===rec?' rec':'')+'"><div class="row between"><p class="eyebrow">Mission '+c.no+'</p><span class="pill '+C.status+'">'+st+'</span></div><h3>'+esc(c.name)+'</h3><p class="small">'+esc(c.topic)+'</p>'
   + meter(C.m) + '<p class="path"><strong>Your path:</strong> '+(C.route?ROUTE[C.route].t:'—')+'</p><p class="small">'+esc(C.reason)+'</p>'
   + (C.status==='mastered'?'<p class="badge">'+ICON.badge+esc(c.badge)+'</p>':'')
   + '<div class="row">'+(k===rec?'<span class="tag">Start here</span>':'')+'<button class="btn'+(k===rec?'':' ghost')+'" data-act="open" data-cl="'+k+'">'+(C.status==='new'?'Start':C.status==='active'?'Continue':'Visit again')+'</button></div></article>';
 });
 h+='</div><div class="card stack"><button class="linkbtn" data-act="toggle-ans" aria-expanded="'+S.showAns+'">'+(S.showAns?'Hide':'See')+' my clue answers</button>';
 if(S.showAns){ h+='<ol class="anslist">'+DIAG.map(function(d){ var a=S.diag.ans[d.id]; if(!a) return ''; return '<li><p>'+esc(d.stem)+'</p><p class="small">You chose <strong>'+LET[a.choice]+'</strong>. '+(a.correct?'That is right.':'The answer is <strong>'+LET[d.key]+'</strong>: '+esc(d.opts[d.key])+'.')+'</p><p class="small">'+esc(d.exp)+'</p></li>'; }).join('')+'</ol>'; }
 h+='</div><div class="row"><button class="btn'+(anyDone?'':' ghost')+'" data-act="finish">See my learning map and reflect</button></div></section>';
 return h;
}
function stageTrail(k){
 var C=S.cl[k], st=['learn','practice','cp','apply'], names={repair:'Fix an idea',prereq:'Warm-up',learn:'Learn',practice:'Practise',cp:'Checkpoint',apply:'Apply'};
 if(C.route==='repair'&&C.mis.length) st.unshift('repair'); if(k==='MON'&&!C.prereqDone&&S.cl.WEA.m<0.6&&S.cl.WEA.status!=='mastered') st.unshift('prereq');
 var cur={intro:-1,ready:st.indexOf('cp')-0.5,cpres:st.indexOf('cp'),done:99}[C.stage]; if(cur==null) cur=st.indexOf(C.stage);
 return '<ol class="trail">'+st.map(function(s,i){ return '<li class="'+(i<cur?'done':i===Math.ceil(cur)?'now':'')+'">'+names[s]+'</li>'; }).join('')+'</ol>';
}
function vMission(){
 var k=S.mission, C=S.cl[k], c=CL[k], h='<section class="stack"><div class="row between"><button class="linkbtn" data-act="tomap">← My map</button><span class="pill route">'+ROUTE[C.route].t+'</span></div>';
 h+='<div class="card mhead"><p class="eyebrow">Mission '+c.no+'</p><h1 data-focus tabindex="-1">'+esc(c.name)+'</h1>'+stageTrail(k)+meter(C.m)+'</div>';
 var fn={intro:sIntro,prereq:sPrereq,repair:sRepair,learn:sLearn,practice:sPractice,ready:sReady,cp:sCp,cpres:sCpres,apply:sApply,done:sDone}[C.stage];
 return h+fn(k)+'</section>';
}
function sIntro(k){
 var C=S.cl[k], c=CL[k];
 return '<div class="card stack"><h2>Big question: '+esc(c.big)+'</h2><p><strong>By the end, you will be able to:</strong></p><ul class="list">'+c.los.map(function(l){return '<li>'+esc(LOS[l])+'</li>';}).join('')+'</ul>'
 +'<div class="why"><p class="eyebrow">Why this path?</p><p>'+esc(C.reason)+'</p></div><div class="row"><button class="btn" data-act="mgo">Let’s go</button></div></div>';
}
function sPrereq(k){
 var u=S.ui, it=IT[u.id];
 return '<div class="card stack"><p class="eyebrow">Warm-up · pressure and wind</p><h2>The monsoon is all about pressure and wind</h2><p>Remember: warm air rises and makes low pressure. Cool air sinks and makes high pressure. Wind blows from high pressure to low pressure.</p>'+figHTML({svg:'pressure'})
 + (u.done?renderItem(it,'warm').replace('data-act="next"','data-act="prereq-done"'):renderItem(it,'warm'))+'</div>';
}
function sRepair(k){
 var C=S.cl[k], code=C.mis[Math.min(C.ri,C.mis.length-1)], m=MIS[code], ag=C.agree[code];
 var h='<div class="card stack"><p class="eyebrow">Fix an idea · '+(Math.min(C.ri,C.mis.length-1)+1)+' of '+C.mis.length+'</p><h2>Many people think:</h2><blockquote class="claim">“'+esc(m.think)+'”</blockquote>';
 h+='<p>Do you agree?</p><div class="row">'+[['yes','I agree'],['unsure','Not sure'],['no','I disagree']].map(function(o){return '<button class="chip" data-act="agree" data-v="'+o[0]+'" aria-pressed="'+(ag===o[0])+'">'+o[1]+'</button>';}).join('')+'</div>';
 if(ag){ h+='<div class="fb learn"><p><strong>What really happens:</strong> '+esc(m.fact)+'</p></div>'+(m.fig?figHTML({svg:m.fig}):'')+'<p class="small">Video '+m.video+': '+esc(VIDEOS.filter(function(v){return v.id===m.video;})[0].title)+'. You will test this idea again in practice.</p><div class="row"><button class="btn" data-act="repair-next">'+(C.ri<C.mis.length-1?'Next idea':'Go to the lesson')+'</button><button class="btn ghost" data-act="skip-practice">Skip to practice</button></div>'; }
 return h+'</div>';
}
function sLearn(k){
 var C=S.cl[k], L=LESSON[k], tab=C.tab || S.k2 || 'diagram', ctx=S.k1||'farm', h='<div class="card stack">';
 if((C.route==='guided'||C.route==='confirm'||C.relearnShown) && L.we){ h+='<div class="we"><p class="eyebrow">Worked example</p><p><strong>'+esc(L.we.q)+'</strong></p><ol>'+L.we.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol><p><strong>Answer:</strong> '+esc(L.we.a)+'</p></div>'; }
 h+='<div class="tabs" role="tablist" aria-label="Ways to learn">'+REP.map(function(r){ return '<button role="tab" class="tab" data-act="tab" data-v="'+r[0]+'" aria-selected="'+(tab===r[0])+'">'+r[1]+'</button>'; }).join('')+'</div>';
 h+='<div class="panel" role="tabpanel" id="panel-'+k+'">';
 if(tab==='diagram') h+=L.figs.map(figHTML).join('');
 if(tab==='story') h+='<p class="eyebrow">A story from '+esc((K1.filter(function(x){return x[0]===ctx;})[0]||K1[0])[1].toLowerCase())+'</p><p class="story">'+esc(L.stories[ctx])+'</p><p class="small">Want another place? Change it on the <button class="linkbtn" data-act="ctx">story settings</button>.</p>';
 if(tab==='steps') h+='<ol class="steps">'+L.steps.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol>';
 if(tab==='activity') h+=activityHTML(k);
 if(tab==='video') h+=L.videos.map(function(id){ var v=VIDEOS.filter(function(x){return x.id===id;})[0]; return '<div class="vid"><div class="vid-ph" aria-hidden="true">▶</div><div><p class="eyebrow">Video '+v.id+' · '+v.min+'</p><p><strong>'+esc(v.title)+'</strong></p><p class="small">This video is being made. Here is the short version:</p><p>'+esc(v.short)+'</p></div></div>'; }).join('');
 h+='</div><div class="row">'+speakBtn('panel-'+k)+'</div>';
 h+='<div class="farm"><p class="eyebrow">'+ICON.sprout+' Farm connection</p><p>'+esc(L.farm)+'</p></div>';
 h+='<details class="words"><summary>Words to know</summary><dl>'+L.words.map(function(w){return '<dt>'+esc(w[0])+'</dt><dd>'+esc(w[1])+'</dd>';}).join('')+'</dl></details>';
 h+=routineHTML('L-'+k, L.routine);
 h+='<div class="row"><button class="btn" data-act="to-practice">I’m ready to practise</button></div></div>';
 return h;
}
function routineHTML(key, R){
 var v=S.routines[key]||[];
 return '<div class="routine"><p class="eyebrow">Thinking routine · '+esc(R.name)+'</p><p class="small">'+esc(R.about)+' Your notes are only for you and your teacher.</p>'+R.prompts.map(function(p,i){ return '<label for="rt-'+key+'-'+i+'">'+esc(p)+'</label><textarea id="rt-'+key+'-'+i+'" rows="2" data-save="routines.'+key+'.'+i+'">'+esc(v[i]||'')+'</textarea>'; }).join('')+'</div>';
}
function activityHTML(k){
 if(k==='ATM'){ var pos=S.alt==null?10:S.alt, km=posToKm(pos), L=layerAt(km);
  return '<p class="eyebrow">Try it · Climb the sky</p><p>Move the slider to go up. Watch what changes.</p><label for="alt">Height</label><input type="range" id="alt" min="0" max="100" value="'+pos+'" data-range="alt" aria-valuetext="'+Math.round(km)+' kilometres"><div class="altgrid"><div id="altFig">'+SVGS.layers({km:km})+'</div><div id="altInfo" class="altinfo" aria-live="polite">'+altInfo(km,L)+'</div></div>'; }
 if(k==='WEA'){ var night=S.breeze==='night';
  return '<p class="eyebrow">Try it · Day and night by the sea</p><p>First predict: which way will the breeze blow? Then switch between day and night.</p><div class="row seg" role="group" aria-label="Time of day"><button class="chip" data-act="breeze" data-v="day" aria-pressed="'+!night+'">Day (2 p.m.)</button><button class="chip" data-act="breeze" data-v="night" aria-pressed="'+night+'">Night (10 p.m.)</button></div>'+figHTML({svg:'breeze',mode:night?'night':'day'})+'<p>'+(night?'At night, the land cools faster than the sea. The air over the sea is warmer and rises (low pressure). Cooler air from the land moves out to sea. The difference is small, so this land breeze is gentle.':'In the day, the land heats faster than the sea. Warm air over the land rises (low pressure). Cooler air from the sea moves in. This is a sea breeze. It keeps coastal afternoons milder.')+'</p>'; }
 if(k==='MON'){ var w=S.mseason==='winter';
  return '<p class="eyebrow">Try it · Turn the seasons</p><p>Switch between summer and winter. Watch the pressure and the winds turn around.</p><div class="row seg" role="group" aria-label="Season"><button class="chip" data-act="mseason" data-v="summer" aria-pressed="'+!w+'">Summer (June–September)</button><button class="chip" data-act="mseason" data-v="winter" aria-pressed="'+w+'">Winter (October–February)</button></div>'+figHTML({svg:'monsoon',mode:w?'winter':'summer'})
   +'<ul class="list">'+(w?'<li>The land cools faster than the sea, so <strong>high pressure</strong> forms over land.</li><li>Cold, dry winds blow from <strong>land to sea</strong>, from the north-east.</li><li>Over the Bay of Bengal they pick up moisture and bring rain to the Tamil Nadu coast.</li><li><strong>On the farm:</strong> most of India is dry, but farmers in the south-east get winter rain.</li>':'<li>The land heats faster than the ocean, so <strong>low pressure</strong> forms over land.</li><li>Moist winds blow from <strong>sea to land</strong>, from the south-west.</li><li>They bring most of India’s rain.</li><li><strong>On the farm:</strong> farmers sow and grow their crops with these rains.</li>')+'</ul>'; }
 if(k==='CLC'){ var tot=0, n=0, top=null;
  var h='<p class="eyebrow">Try it · My carbon footprint (from your textbook)</p><p>Choose the option that best describes you in each group.</p>';
  FOOTPRINT.forEach(function(g){ var v=S.fp[g.k]; if(v!=null){ tot+=g.opts[v][1]; n++; if(!top||g.opts[v][1]>top.p) top={name:g.name,p:g.opts[v][1]}; }
   h+='<fieldset class="fp"><legend>'+esc(g.name)+'</legend>'+g.opts.map(function(o,i){ return '<button class="opt slim" data-act="fp" data-g="'+g.k+'" data-v="'+i+'" aria-pressed="'+(v===i)+'"><span>'+esc(o[0])+'</span><span class="pts">'+o[1]+'</span></button>'; }).join('')+'</fieldset>'; });
  h+='<div class="fpres" aria-live="polite">'+(n===FOOTPRINT.length?'<p><strong>Your score: '+tot+' points</strong> (lowest possible is 4).</p><p>'+(top.p>1?'Your highest score is in <strong>'+esc(top.name)+'</strong>. One change there would help the most.':'All your choices are low impact. Great work!')+'</p>':'<p class="small">Answer all four groups to see your score.</p>')+'</div>';
  h+='<p><strong>My climate action pledge:</strong> two simple changes I will make.</p><label for="pl1">Change 1</label><input id="pl1" data-save="pledge.a" value="'+esc(S.pledge.a||'')+'"><label for="pl2">Change 2</label><input id="pl2" data-save="pledge.b" value="'+esc(S.pledge.b||'')+'">';
  return h; }
 return '';
}
function posToKm(p){ if(p<=30) return p/30*12; if(p<=55) return 12+(p-30)/25*38; if(p<=75) return 50+(p-55)/20*30; if(p<=92) return 80+(p-75)/17*620; return 700+(p-92)/8*300; }
function layerAt(km){ for(var i=0;i<ALT.length;i++) if(km<=ALT[i].to) return ALT[i]; return ALT[ALT.length-1]; }
function altInfo(km,L){ return '<p class="big">'+Math.round(km)+' km</p><p><strong>'+L.name+'</strong></p><p>'+esc(L.txt)+'</p>'; }
function sPractice(k){
 var C=S.cl[k];
 if(C.relearn && !S.ui){ return '<div class="card stack"><h2>Let’s look at this another way</h2><p>These ideas are tricky. A different kind of explanation often helps.</p><div class="row"><button class="btn" data-act="relearn">Open the lesson another way</button><button class="btn ghost" data-act="relearn-skip">Keep practising</button></div></div>'; }
 if(!S.ui || S.ui.cl!==k || S.ui.mode!=='prac') loadNextPractice(k);
 if(C.stage!=='practice') return sReady(k);
 var it=IT[S.ui.id];
 return '<div class="card stack"><div class="row between"><p class="eyebrow">Practice '+(C.pc+(S.ui.done?0:1))+' · Level '+C.level+' of 3</p>'+speakBtn('stem-'+it.id)+'</div>'+renderItem(it,'prac')+'</div>';
}
function sReady(k){
 var C=S.cl[k], more=poolLeft(k).length>0;
 return '<div class="card stack"><h2>'+(C.cp.tries?'Ready to try the checkpoint again?':'You’re ready for the checkpoint!')+'</h2><p>The checkpoint has 2 new questions. There are no hints, and you will say how sure you are.</p><div class="row"><button class="btn" data-act="start-cp">Start the checkpoint</button>'+(more?'<button class="btn ghost" data-act="more-practice">Practise a little more</button>':'')+'</div></div>';
}
function sCp(k){ var C=S.cl[k], it=IT[S.ui.id]; return '<div class="card stack"><div class="row between"><p class="eyebrow">Checkpoint '+(C.cp.idx+1)+' of '+C.cp.set.length+'</p>'+speakBtn('stem-'+it.id)+'</div>'+renderItem(it,'cp')+'</div>'; }
function sCpres(k){
 var C=S.cl[k];
 if(C.cp.passed) return '<div class="card stack center"><p class="badge big">'+ICON.badge+esc(CL[k].badge)+'</p><h2>Badge earned!</h2><p>You showed this in two new questions. Now try a challenge to use what you know.</p><div class="row"><button class="btn" data-act="to-apply">Go to the challenge</button></div></div>';
 return '<div class="card stack"><h2>Not quite yet, and that is fine</h2><p>'+(C.flag?'This mission is tricky. Your teacher will check in with you about it. You can still try the challenge.':'Let’s practise a little more, then try the checkpoint again.')+'</p><div class="row">'+(C.flag?'<button class="btn" data-act="to-apply">Go to the challenge</button>':'')+'<button class="btn'+(C.flag?' ghost':'')+'" data-act="more-practice">Practise more</button></div></div>';
}
function sApply(k){
 var h='<div class="card stack"><p class="eyebrow">Apply</p><h2>Use what you know</h2><p class="small">Write your answer first. Then open the scoring guide and tick the points you covered.</p>';
 TASKS[k].forEach(function(t){
  var open=S.rub[t.id]&&S.rub[t.id].open, ticks=(S.rub[t.id]&&S.rub[t.id].t)||[];
  h+='<div class="task"><p class="eyebrow">'+esc(t.kind)+'</p><p>'+esc(t.prompt)+'</p><label for="frq-'+t.id+'">My answer</label><textarea id="frq-'+t.id+'" rows="5" data-save="frq.'+t.id+'">'+esc(S.frq[t.id]||'')+'</textarea>'
   +'<button class="linkbtn" data-act="rubric" data-id="'+t.id+'" aria-expanded="'+!!open+'">'+(open?'Hide':'Open')+' the scoring guide</button>';
  if(open) h+='<div class="rubric"><p class="small">'+esc(t.scoring)+'</p>'+t.rubric.map(function(r,i){ var on=ticks.indexOf(i)>=0; return '<button class="opt check slim" data-act="tick" data-id="'+t.id+'" data-i="'+i+'" aria-pressed="'+on+'"><span class="box" aria-hidden="true">'+(on?'✓':'')+'</span><span>'+esc(r)+'</span></button>'; }).join('')+'<p class="small">Points I covered: <strong>'+ticks.length+'</strong></p></div>';
  h+='</div>';
 });
 return h+'<div class="row"><button class="btn" data-act="mfinish">Finish this mission</button></div></div>';
}
function sDone(k){
 var C=S.cl[k], next=recommended();
 return '<div class="card stack center">'+(C.status==='mastered'?'<p class="badge big">'+ICON.badge+esc(CL[k].badge)+'</p>':'')+'<h2>Mission '+CL[k].no+' complete</h2><p>You answered '+C.log.length+' questions'+(C.resolved.length?' and fixed '+C.resolved.length+' common idea'+(C.resolved.length>1?'s':''):'')+'.</p>'
 +(C.status!=='mastered'?'<p class="small">You can come back any time to earn the badge.</p>':'')+'<div class="row">'+(next?'<button class="btn" data-act="open" data-cl="'+next+'">Next: Mission '+CL[next].no+'</button>':'<button class="btn" data-act="finish">See my learning map</button>')+'<button class="btn ghost" data-act="tomap">Back to my map</button></div></div>';
}
function vFinish(){
 var h='<section class="stack"><div class="card stack"><p class="eyebrow">My learning map</p><h1 data-focus tabindex="-1">Well done, '+esc(S.name)+'</h1><p>Here is where you are now. Your map will keep changing as you learn.</p></div><div class="mgrid">';
 ORDER.forEach(function(k){ var C=S.cl[k];
  h+='<article class="card mcard"><p class="eyebrow">Mission '+CL[k].no+'</p><h3>'+esc(CL[k].name)+'</h3>'+meter(C.m)+(C.status==='mastered'?'<p class="badge">'+ICON.badge+esc(CL[k].badge)+'</p>':'<p class="small">Next step: '+(C.status==='new'?'start this mission.':'practise and take the checkpoint.')+'</p>')
   +(C.resolved.length?'<p class="small"><strong>Ideas you changed:</strong> '+C.resolved.map(function(m){return esc(MIS[m].think);}).join(' · ')+'</p>':'')+'</article>'; });
 h+='</div><div class="card stack"><p class="eyebrow">Thinking routine · I used to think… Now I think…</p><label for="rf1">I used to think…</label><textarea id="rf1" rows="2" data-save="reflect.used">'+esc(S.reflect.used||'')+'</textarea><label for="rf2">Now I think…</label><textarea id="rf2" rows="2" data-save="reflect.now">'+esc(S.reflect.now||'')+'</textarea>'
  +'<p class="eyebrow">Headlines</p><label for="rf3">Write a newspaper headline that sums up this chapter.</label><input id="rf3" data-save="reflect.headline" value="'+esc(S.reflect.headline||'')+'"></div>'
  +'<div class="card stack"><h2>Quick review</h2><p>Come back in a week and take a 4-question review. It helps you remember for longer.</p><div class="row"><button class="btn" data-act="review">Start a quick review</button><button class="btn ghost" data-act="tomap">Back to my map</button></div></div></section>';
 return h;
}
function vReview(){
 var R=S.review;
 if(R.idx>=R.set.length){ var ok=R.res.filter(function(x){return x.ok;}).length; return '<section class="card stack"><h1 data-focus tabindex="-1">Review done</h1><p>You remembered <strong>'+ok+' of '+R.set.length+'</strong>.</p><p class="small">Anything you missed is worth another look in its mission.</p><div class="row"><button class="btn" data-act="tomap">Back to my map</button></div></section>'; }
 var it=IT[R.set[R.idx]]; if(!S.ui||S.ui.id!==it.id) S.ui=newUI(it.id,'rev',it.cl);
 return '<section class="card stack"><p class="eyebrow">Quick review · '+(R.idx+1)+' of '+R.set.length+'</p><h1 class="vh" data-focus tabindex="-1">Review question</h1>'+renderItem(it,'rev')+'</section>';
}
function viewLearner(){
 var b = {welcome:vWelcome,k1:function(){return vK(1);},k2:function(){return vK(2);},howto:vHowto,diag:vDiag,map:vMap,mission:vMission,finish:vFinish,review:vReview}[S.view]();
 return rail()+b+'<footer class="foot">Content: NCERT, <em>Understanding Society: India and Beyond</em>, Grade 9 Part 1, Chapter 3. Data: Table 3.3. Diagrams drawn for this PAL.</footer>';
}

/* ---------- render ---------- */
function render(){
 app.innerHTML = viewLearner();
 var key = S.view+'|'+(S.mission||'')+'|'+(S.mission?S.cl[S.mission].stage:'')+'|'+(S.ui?S.ui.id:'')+'|'+(S.review?S.review.idx:'');
 if(key!==lastKey){ if(lastKey){ window.scrollTo(0,0); var f=app.querySelector('[data-focus]'); if(f) f.focus({preventScroll:true}); } lastKey=key; }
 save();
}

/* ---------- actions ---------- */
function setPath(path, val){ var p=path.split('.'), o=S; for(var i=0;i<p.length-1;i++){ var k=p[i]; if(o[k]==null||typeof o[k]!=='object') o[k]=(/^\d+$/.test(p[i+1])?[]:{}); o=o[k]; } o[p[p.length-1]]=val; }
function placeChip(ix, b){ var u=S.ui; if(u.done) return; var it=IT[u.id];
 if(b==='tray'){ delete u.sel[ix]; }
 else { if(it.order){ Object.keys(u.sel).forEach(function(k){ if(u.sel[k]===b && +k!==ix) delete u.sel[k]; }); } u.sel[ix]=b; }
 u.bad=u.bad.filter(function(x){return x!==ix;}); u.pick=null; u.tryMsg=false; }
var A = {
 start:function(){ if(!S.name.trim()){ document.getElementById('nmErr').hidden=false; document.getElementById('nm').focus(); return false; } logE('start',{}); if(S.diag.i>=DIAG.length){ S.view='map'; } else if(S.diag.i>0){ S.view='diag'; } else S.view= S.k1 ? (S.k2?'howto':'k2') : 'k1'; },
 kpick:function(t){ if(t.dataset.k==='1'){ S.k1=t.dataset.v; S.view='k2'; } else { S.k2=t.dataset.v; S.view='howto'; } },
 back:function(t){ S.view=t.dataset.to; },
 'go-diag':function(){ S.view='diag'; S.ui=null; },
 pick:function(t){ var u=S.ui; if(u.done) return false; u.sel=+t.dataset.i; u.tryMsg=false; },
 toggle:function(t){ var u=S.ui, i=+t.dataset.i, ix=u.sel.indexOf(i); if(u.done) return false; if(ix>=0) u.sel.splice(ix,1); else u.sel.push(i); u.tryMsg=false; },
 chip:function(t){ var u=S.ui, i=+t.dataset.i; u.pick = u.pick===i?null:i; },
 bucket:function(t){ var u=S.ui; if(u.pick==null){ toast('First tap a card to move.'); return false; } placeChip(u.pick, t.dataset.b); },
 tray:function(){ var u=S.ui; if(u.pick!=null) placeChip(u.pick,'tray'); },
 'diag-check':function(){ var u=S.ui, it=IT[u.id], ok=u.sel===it.key; if(u.done || u.sel==null) return false;
  S.diag.ans[it.id]={choice:u.sel,correct:ok,conf:'sure',mis:ok?null:it.mis[u.sel]}; logE('clue',{item:it.id,ok:ok}); u.done=true; },
 'diag-next':function(){ if(!S.ui || !S.ui.done) return false;
  S.diag.i++; S.ui=null; if(S.diag.i>=DIAG.length){ computeRoutes(); S.view='map'; } },
 hint:function(){ S.ui.hints++; logE('hint',{item:S.ui.id}); },
 check:function(){ var u=S.ui, it=IT[u.id], r=evalItem(it,u.sel);
  if((u.mode==='prac'||u.mode==='warm') && !r.ok && u.att===0){ u.att=1; u.firstMis=r.mis; u.tryMsg=true; if(it.type==='mcq'){ u.wrongIdx=[u.sel]; u.sel=null; } if(it.type==='dnd') u.bad=r.bad.slice(); if(it.hint && u.hints<it.hint.length) u.hints++; return; }
  finishItem(r); },
 next:function(){ var u=S.ui;
  if(u.mode==='prac'){ var k=u.cl, C=S.cl[k]; S.ui=null; if(C.relearn) return; if(readyForCp(k)){ C.stage='ready'; } else loadNextPractice(k); return; }
  if(u.mode==='cp'){ var C2=S.cl[u.cl]; C2.cp.idx++; if(C2.cp.idx<C2.cp.set.length){ S.ui=newUI(C2.cp.set[C2.cp.idx],'cp',u.cl); } else evalCp(u.cl); return; }
  if(u.mode==='rev'){ S.review.idx++; S.ui=null; return; } },
 'prereq-done':function(){ var k=S.mission; S.cl[k].prereqDone=true; setStage(k, afterPrereq(k)); },
 'toggle-ans':function(){ S.showAns=!S.showAns; },
 open:function(t){ var k=t.dataset.cl, C=S.cl[k]; if(!C.route) return false; S.mission=k; S.view='mission'; if(C.status==='new') C.status='active'; if((C.status==='mastered'||C.status==='practised') && C.stage==='done'){ C.stage='learn'; S.ui=null; } if(C.stage==='practice' && !S.ui) loadNextPractice(k); },
 tomap:function(){ S.view='map'; S.ui=null; },
 mgo:function(){ var k=S.mission; setStage(k, firstStage(k)); },
 agree:function(t){ var C=S.cl[S.mission], code=C.mis[Math.min(C.ri,C.mis.length-1)]; C.agree[code]=t.dataset.v; logE('elicit',{cl:S.mission,mis:code,v:t.dataset.v}); },
 'repair-next':function(){ var k=S.mission, C=S.cl[k]; if(C.ri<C.mis.length-1){ C.ri++; } else setStage(k,'learn'); },
 'skip-practice':function(){ setStage(S.mission,'practice'); },
 tab:function(t){ S.cl[S.mission].tab=t.dataset.v; logE('rep',{cl:S.mission,rep:t.dataset.v}); },
 ctx:function(){ var i=0; K1.forEach(function(x,j){ if(x[0]===S.k1) i=j; }); S.k1=K1[(i+1)%K1.length][0]; toast('Stories now come from: '+K1[(i+1)%K1.length][1].toLowerCase()); },
 'to-practice':function(){ var k=S.mission; S.cl[k].relearnShown=false; setStage(k,'practice'); },
 relearn:function(){ var k=S.mission, C=S.cl[k], cur=C.tab||S.k2||'diagram', order=['diagram','story','steps','activity']; C.tab=order[(order.indexOf(cur)+1)%order.length]; C.relearn=false; C.relearnShown=true; C.stage='learn'; S.ui=null; },
 'relearn-skip':function(){ var k=S.mission; S.cl[k].relearn=false; loadNextPractice(k); },
 'start-cp':function(){ setStage(S.mission,'cp'); },
 'more-practice':function(){ var k=S.mission, C=S.cl[k]; C.pcAtFail=C.pc; C.stage='practice'; S.ui=null; loadNextPractice(k); if(C.stage!=='practice'){ toast('You have tried every practice question. Try the checkpoint again.'); } },
 'to-apply':function(){ S.cl[S.mission].stage='apply'; },
 rubric:function(t){ var id=t.dataset.id; S.rub[id]=S.rub[id]||{t:[]}; S.rub[id].open=!S.rub[id].open; },
 tick:function(t){ var id=t.dataset.id, i=+t.dataset.i, r=S.rub[id], ix=r.t.indexOf(i); if(ix>=0) r.t.splice(ix,1); else r.t.push(i); },
 mfinish:function(){ var k=S.mission, C=S.cl[k]; if(C.status!=='mastered') C.status='practised'; C.stage='done'; logE('mission-done',{cl:k,status:C.status}); },
 finish:function(){ S.view='finish'; },
 review:function(){ var set=[]; ORDER.forEach(function(k){ var good=S.cl[k].log.filter(function(x){return x.E>=0.7 && IT[x.id].use==='prac';}); var pick=good.length?good[0].id:null; if(!pick){ var any=ITEMS.filter(function(i){return i.cl===k&&i.use==='prac';}); pick=any[0].id; } set.push(pick); }); S.review={set:set,idx:0,res:[]}; S.view='review'; S.ui=null; },
 breeze:function(t){ S.breeze=t.dataset.v; },
 mseason:function(t){ S.mseason=t.dataset.v; },
 fp:function(t){ S.fp[t.dataset.g]=+t.dataset.v; },
 speak:function(t){ var el=document.getElementById(t.dataset.target); try{ var ss=window.speechSynthesis; if(!ss) throw 0; if(ss.speaking){ ss.cancel(); return false; } var ut=new SpeechSynthesisUtterance(el?el.innerText:''); ut.lang='en-IN'; ut.rate=0.92; ss.speak(ut); }catch(e){ toast('Read aloud is not available in this browser.'); } return false; },
 size:function(t){ S.scale=Math.min(1.4,Math.max(0.9, r2(S.scale+0.1*(+t.dataset.d)))); applyScale(); },
};
function onClick(e){ var t=e.target.closest('[data-act]'); if(!t || t.disabled) return; var f=A[t.dataset.act]; if(!f) return; var r=f(t); if(r!==false) render(); }
document.addEventListener('click', onClick);
app.addEventListener('input', function(e){ var t=e.target;
 if(t.dataset.save){ setPath(t.dataset.save, t.value); save(); if(t.id==='nm') document.getElementById('nmErr').hidden=true; }
 if(t.dataset.range==='alt'){ S.alt=+t.value; var km=posToKm(S.alt); document.getElementById('altFig').innerHTML=SVGS.layers({km:km}); document.getElementById('altInfo').innerHTML=altInfo(km,layerAt(km)); t.setAttribute('aria-valuetext',Math.round(km)+' kilometres'); save(); }
});
app.addEventListener('change', function(e){ var t=e.target; if(t.dataset.change==='override'){ var k=t.dataset.cl, C=S.cl[k]; setRoute(k,t.value); C.override=true; if(C.status!=='mastered'){ C.stage='intro'; if(S.ui&&S.ui.cl===k) S.ui=null; } logE('override',{cl:k,route:t.value}); toast('Route changed for Mission '+CL[k].no+'.'); render(); } });
app.addEventListener('keydown', function(e){ if(e.key==='Enter' && (e.target.id==='nm'||e.target.id==='cls')){ e.preventDefault(); if(A.start()!==false) render(); } });
app.addEventListener('dragstart', function(e){ var c=e.target.closest('.dchip'); if(!c||!S.ui) return; S.ui.pick=+c.dataset.i; try{ e.dataTransfer.setData('text/plain', c.dataset.i); e.dataTransfer.effectAllowed='move'; }catch(x){} });
app.addEventListener('dragover', function(e){ if(e.target.closest('[data-drop]')) e.preventDefault(); });
app.addEventListener('drop', function(e){ var d=e.target.closest('[data-drop]'); if(!d||!S.ui||S.ui.pick==null) return; e.preventDefault(); placeChip(S.ui.pick, d.dataset.drop); render(); });

applyScale();
if(S.view==='mission' && S.mission){ var C0=S.cl[S.mission]; if(C0.stage==='practice' && !S.ui) loadNextPractice(S.mission); }
render();
})();

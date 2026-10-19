/* ===== Sky to Soil PAL · teacher view: every learner's progress, read from the class store ===== */
(function(){
'use strict';
document.body.classList.add('teacher');
var app = document.getElementById('app');
var PWKEY = 'sky2soil-teacher-pw';
var DIAG = ITEMS.filter(function(i){ return i.use==='diag'; });
var LET = 'ABCDEF';
var CONFTXT = {sure:'Sure',some:'Think so',guess:'Guessed'};
var ROUTE = {foundation:'Step-by-step path',guided:'Guided path',repair:'Fix-an-idea path',extend:'Challenge path',confirm:'Quick-check path'};
var STATUS = {'new':'Not started',active:'In progress',practised:'Practised',mastered:'Mastered'};
var T = {pw:readPw(), list:null, loaded:null, err:'', busy:false, cls:'all', q:'', sort:'cls', open:null, scale:1};

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function readPw(){ try{ return sessionStorage.getItem(PWKEY)||''; }catch(e){ return ''; } }
function writePw(v){ try{ if(v) sessionStorage.setItem(PWKEY,v); else sessionStorage.removeItem(PWKEY); }catch(e){} }
function pct(m){ return Math.round((m||0)*100)+'%'; }
function band(m){ return m>=0.9?'Provisional mastery':m>=0.8?'Proficient':m>=0.6?'Developing':m>=0.4?'Emerging':'Beginning'; }
function when(iso){ if(!iso) return '—'; var d=new Date(iso); return isNaN(d)?'—':d.toLocaleString(undefined,{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}); }
function cl(L,k){ return (L.state.cl&&L.state.cl[k])||{status:'new',m:0,mis:[],resolved:[],log:[],cp:{}}; }
function quiz(L){ var a=(L.state.diag&&L.state.diag.ans)||{}, n=0, ok=0; DIAG.forEach(function(d){ if(a[d.id]){ n++; if(a[d.id].correct) ok++; } }); return {n:n,ok:ok}; }
function flagged(L){ return ORDER.some(function(k){ return cl(L,k).flag; }); }
function held(L){ var out=[]; ORDER.forEach(function(k){ (cl(L,k).mis||[]).forEach(function(c){ if(out.indexOf(c)<0) out.push(c); }); }); return out; }
function mastered(L){ return ORDER.filter(function(k){ return cl(L,k).status==='mastered'; }).length; }

/* ---------- loading ---------- */
function load(){
 T.busy=true; T.err=''; render();
 fetch('api/learners',{headers:{'x-teacher-password':T.pw},cache:'no-store'})
 .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ return {r:r,j:j}; }); })
 .then(function(x){
  T.busy=false;
  if(x.r.status===401){ T.pw=''; writePw(''); T.list=null; T.err='That password is not right. Please try again.'; }
  else if(!x.r.ok){ T.err=x.j.error||('The server answered '+x.r.status+'.'); }
  else { T.list=x.j.learners||[]; T.loaded=new Date().toISOString(); }
  render();
 })
 .catch(function(){ T.busy=false; T.err='Could not reach the server. Check your internet connection and try again.'; render(); });
}

/* ---------- views ---------- */
function vLogin(){
 return '<section class="card stack" style="max-width:520px"><p class="eyebrow">Teachers only</p><h1 data-focus tabindex="-1">Class progress</h1>'
 +'<p>Type the teacher password to see how each learner is doing.</p>'
 +'<form class="stack" data-form="login"><div class="field"><label for="pw">Teacher password</label><input id="pw" type="password" autocomplete="current-password" required></div>'
 +(T.err?'<p class="err" role="alert">'+esc(T.err)+'</p>':'')
 +'<div class="row"><button class="btn"'+(T.busy?' disabled':'')+'>'+(T.busy?'Opening…':'Open class view')+'</button></div></form></section>';
}
function visible(){
 var q=T.q.trim().toLowerCase();
 var list=T.list.filter(function(L){ return (T.cls==='all' || (L.cls||'')===T.cls) && (!q || (L.name||'').toLowerCase().indexOf(q)>=0); });
 var by={
  name:function(a,b){ return (a.name||'').localeCompare(b.name||''); },
  cls:function(a,b){ return (a.cls||'').localeCompare(b.cls||'',undefined,{numeric:true}) || (a.name||'').localeCompare(b.name||''); },
  recent:function(a,b){ return (b.updated||'').localeCompare(a.updated||''); },
  help:function(a,b){ return (flagged(b)-flagged(a)) || (held(b).length-held(a).length) || (a.name||'').localeCompare(b.name||''); }
 };
 return list.sort(by[T.sort]);
}
function vClass(){
 var all=T.list, list=visible(), classes=[];
 all.forEach(function(L){ if(L.cls && classes.indexOf(L.cls)<0) classes.push(L.cls); });
 classes.sort(function(a,b){ return a.localeCompare(b,undefined,{numeric:true}); });
 var h='<section class="stack"><div class="row between"><div><p class="eyebrow">Teachers only</p><h1 data-focus tabindex="-1">Class progress</h1></div>'
 +'<div class="row"><button class="btn ghost" data-act="refresh"'+(T.busy?' disabled':'')+'>'+(T.busy?'Refreshing…':'Refresh')+'</button><button class="btn ghost" data-act="csv"'+(list.length?'':' disabled')+'>Download CSV</button><button class="linkbtn" data-act="signout">Sign out</button></div></div>'
 +'<p class="small">Updated '+when(T.loaded)+'. Learners appear here a few seconds after they type their name and start.</p>'
 +(T.err?'<p class="err" role="alert">'+esc(T.err)+'</p>':'')+'</section>';
 if(!all.length) return h+'<section class="card stack"><h2>No learners yet</h2><p>When students open the app and type their name, they will show up here. Press Refresh to check again.</p></section>';

 h+='<section class="card row" aria-label="Filters"><div class="field" style="flex:1 1 200px"><label for="q">Find a learner</label><input id="q" type="search" data-f="q" value="'+esc(T.q)+'" placeholder="Type a name"></div>'
 +'<div class="field"><label for="fcls">Class</label><select id="fcls" data-f="cls"><option value="all">All classes</option>'+classes.map(function(c){ return '<option'+(T.cls===c?' selected':'')+'>'+esc(c)+'</option>'; }).join('')+'</select></div>'
 +'<div class="field"><label for="fsort">Sort by</label><select id="fsort" data-f="sort">'+[['cls','Class, then name'],['name','Name'],['recent','Most recently active'],['help','Needs help first']].map(function(o){ return '<option value="'+o[0]+'"'+(T.sort===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></div></section>';

 var q=list.filter(function(L){ return quiz(L).n>=DIAG.length; }).length, mt=0, fl=list.filter(flagged);
 list.forEach(function(L){ mt+=mastered(L); });
 h+='<section class="mgrid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr))" aria-label="Summary">'
 +tile(list.length,'learners shown')+tile(q,'finished the starting quiz')+tile(mt+' / '+list.length*ORDER.length,'missions mastered')+tile(fl.length,'need a check-in')+'</section>';

 var counts={};
 list.forEach(function(L){ held(L).forEach(function(c){ counts[c]=(counts[c]||0)+1; }); });
 var top=Object.keys(counts).sort(function(a,b){ return counts[b]-counts[a]; });
 if(fl.length || top.length){
  h+='<section class="card stack"><h2>Needs attention</h2>';
  if(fl.length) h+='<p><strong>Stuck after two checkpoint tries:</strong> '+fl.map(function(L){ return '<button class="linkbtn" data-act="open" data-id="'+esc(L.id)+'">'+esc(L.name||'(no name)')+'</button>'; }).join(', ')+'</p>';
  if(top.length) h+='<div class="tw"><table class="data"><thead><tr><th>Idea learners still hold</th><th>Mission</th><th>Learners</th></tr></thead><tbody>'
   +top.slice(0,8).map(function(c){ var M=MIS[c]; return '<tr><td>“'+esc(M?M.think:c)+'”</td><td>'+esc(M&&CL[M.cl]?CL[M.cl].name:'')+'</td><td class="num">'+counts[c]+'</td></tr>'; }).join('')+'</tbody></table></div>';
  h+='</section>';
 }

 h+='<section class="card stack"><h2>Learners</h2><div class="tw"><table class="data"><thead><tr><th>Name</th><th>Class</th><th>Last active</th><th>Starting quiz</th>'
 +ORDER.map(function(k){ return '<th>'+CL[k].no+'. '+esc(CL[k].name)+'</th>'; }).join('')+'</tr></thead><tbody>';
 h+=list.map(function(L){ var z=quiz(L);
  return '<tr><td><button class="linkbtn" data-act="open" data-id="'+esc(L.id)+'">'+esc(L.name||'(no name)')+'</button></td><td>'+esc(L.cls||'—')+'</td><td class="num">'+when(L.updated)+'</td>'
  +'<td class="num">'+(z.n?z.ok+' / '+z.n+' right':'Not started')+'</td>'
  +ORDER.map(function(k){ var C=cl(L,k), st=C.status||'new';
   return '<td><span class="pill'+(st==='mastered'?' mastered':st==='active'||st==='practised'?' active':'')+'">'+STATUS[st]+'</span>'+(C.route?'<div class="small">'+pct(C.m)+(C.flag?' · <strong class="no">check in</strong>':'')+'</div>':'')+'</td>';
  }).join('')+'</tr>';
 }).join('');
 h+='</tbody></table></div>'+(list.length?'':'<p>No learners match these filters.</p>')+'</section>';
 return h;
}
function tile(n,label){ return '<div class="card stack" style="gap:2px"><span style="font-family:var(--f-display);font-size:2rem;font-weight:700;line-height:1">'+esc(n)+'</span><span class="small">'+esc(label)+'</span></div>'; }

function vLearner(L){
 var S=L.state, z=quiz(L);
 var h='<section class="stack"><div><button class="linkbtn" data-act="back">← Back to class</button></div>'
 +'<div class="row between"><div><p class="eyebrow">'+esc(L.cls?'Class '+L.cls:'No class given')+' · Last active '+when(L.updated)+'</p><h1 data-focus tabindex="-1">'+esc(L.name||'(no name)')+'</h1></div>'
 +'<button class="btn ghost" data-act="delete" data-id="'+esc(L.id)+'">Remove learner</button></div></section>';

 h+='<section class="mgrid">'+ORDER.map(function(k){ var C=cl(L,k), log=C.log||[], prac=log.filter(function(x){ return x.mode!=='cp'; }), first=prac.filter(function(x){ return x.ok && !x.att; }).length;
  var s='<div class="card mcard"><p class="eyebrow">Mission '+CL[k].no+'</p><h2>'+esc(CL[k].name)+'</h2><div class="row"><span class="pill'+(C.status==='mastered'?' mastered':'')+'">'+STATUS[C.status||'new']+'</span>'+(C.route?'<span class="pill route">'+esc(ROUTE[C.route]||C.route)+(C.override?' (changed by teacher)':'')+'</span>':'')+'</div>';
  if(!C.route) return s+'<p class="small">Starts after the starting quiz.</p></div>';
  s+='<div class="meter-row"><div class="meter" role="img" aria-label="Mastery '+pct(C.m)+'"><i style="width:'+pct(C.m)+'"></i></div><span class="meter-l">'+pct(C.m)+' · '+band(C.m)+'</span></div>'
  +'<dl class="kv small"><dt>Practice</dt><dd>'+prac.length+' answered, '+first+' right first time, '+(C.hints||0)+' hints</dd>'
  +'<dt>Checkpoint</dt><dd>'+(C.cp&&C.cp.passed?'<span class="ok">Passed</span>':(C.cp&&C.cp.tries?C.cp.tries+' '+(C.cp.tries===1?'try':'tries')+', not passed yet':'Not tried'))+'</dd></dl>';
  if(C.flag) s+='<p class="note"><strong>Check in:</strong> this learner did not pass the checkpoint after two tries.</p>';
  if((C.mis||[]).length) s+='<div><p><strong>Still believes:</strong></p><ul class="list small">'+C.mis.map(function(c){ return '<li>“'+esc(MIS[c]?MIS[c].think:c)+'”</li>'; }).join('')+'</ul></div>';
  if((C.resolved||[]).length) s+='<p class="small"><strong>Fixed ideas:</strong> '+C.resolved.length+'</p>';
  return s+'</div>';
 }).join('')+'</section>';

 var ans=(S.diag&&S.diag.ans)||{};
 h+='<section class="card stack"><h2>Starting quiz</h2><p class="small">'+(z.n?z.ok+' of '+z.n+' right':'Not started')+'</p>';
 if(z.n) h+='<div class="tw"><table class="data"><thead><tr><th>Question</th><th>Chose</th><th>Result</th><th>Confidence</th></tr></thead><tbody>'
  +DIAG.map(function(d){ var a=ans[d.id]; if(!a) return ''; return '<tr><td>'+esc(d.stem)+'</td><td class="num">'+LET[a.choice]+'</td><td>'+(a.correct?'<span class="ok">Right</span>':'<span class="no">Answer '+LET[d.key]+'</span>')+'</td><td>'+esc(CONFTXT[a.conf]||'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
 h+='</section>';

 var w=writing(S);
 h+='<section class="card stack"><h2>Written work</h2>'+(w||'<p class="small">Nothing written yet.</p>')+'</section>';
 return h;
}
function qa(q,a){ return a&&String(a).trim()?'<div class="task"><p class="small">'+esc(q)+'</p><p style="white-space:pre-wrap">'+esc(a)+'</p></div>':''; }
function writing(S){
 var h='';
 ORDER.forEach(function(k){
  var s='', R=LESSON[k]&&LESSON[k].routine, notes=(S.routines||{})['L-'+k]||[];
  if(R) R.prompts.forEach(function(p,i){ s+=qa(R.name+' · '+p, notes[i]); });
  (TASKS[k]||[]).forEach(function(t){ s+=qa(t.kind+' · '+t.prompt, (S.frq||{})[t.id]); });
  if(s) h+='<h3>'+esc(CL[k].name)+'</h3>'+s;
 });
 var rf=S.reflect||{}, pl=S.pledge||{}, fp=S.fp||{}, end='';
 end+=qa('I used to think…',rf.used)+qa('Now I think…',rf.now)+qa('Headline for this chapter',rf.headline)+qa('Climate pledge · change 1',pl.a)+qa('Climate pledge · change 2',pl.b);
 var fps=FOOTPRINT.map(function(g){ var o=g.opts.filter(function(x){ return x[1]===fp[g.k]; })[0]; return o?'<li><strong>'+esc(g.name)+':</strong> '+esc(o[0])+'</li>':''; }).join('');
 if(fps) end+='<div class="task"><p class="small">Carbon footprint check</p><ul class="list">'+fps+'</ul></div>';
 if(end) h+='<h3>Reflection and action</h3>'+end;
 return h;
}

/* ---------- CSV ---------- */
function csv(){
 var head=['Name','Class','Last active','Starting quiz right','Starting quiz answered'];
 ORDER.forEach(function(k){ head.push(CL[k].name+' status',CL[k].name+' mastery %',CL[k].name+' checkpoint',CL[k].name+' check in'); });
 head.push('Ideas still held');
 var rows=visible().map(function(L){ var z=quiz(L), r=[L.name,L.cls,L.updated,z.ok,z.n];
  ORDER.forEach(function(k){ var C=cl(L,k); r.push(STATUS[C.status||'new'], C.route?Math.round(C.m*100):'', C.cp&&C.cp.passed?'Passed':(C.cp&&C.cp.tries?C.cp.tries+' tries':''), C.flag?'Yes':''); });
  r.push(held(L).map(function(c){ return MIS[c]?MIS[c].think:c; }).join(' | '));
  return r;
 });
 var text=[head].concat(rows).map(function(r){ return r.map(function(v){ v=String(v==null?'':v); if(/^[=+\-@]/.test(v)) v="'"+v; return '"'+v.replace(/"/g,'""')+'"'; }).join(','); }).join('\r\n');
 var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob(['﻿'+text],{type:'text/csv'})); a.download='sky-to-soil-progress-'+new Date().toISOString().slice(0,10)+'.csv';
 document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
}

/* ---------- render & actions ---------- */
var lastKey='';
function render(){
 var L=T.open&&T.list&&T.list.filter(function(x){ return x.id===T.open; })[0];
 if(T.open && !L) T.open=null;
 app.innerHTML = !T.list ? vLogin() : L ? vLearner(L) : vClass();
 var key=(T.list?'list':'login')+'|'+(T.open||'');
 if(key!==lastKey){ if(lastKey){ window.scrollTo(0,0); var f=app.querySelector('[data-focus]'); if(f) f.focus({preventScroll:true}); } lastKey=key; }
}
var A = {
 refresh:function(){ load(); return false; },
 csv:function(){ csv(); return false; },
 signout:function(){ T.pw=''; writePw(''); T.list=null; T.open=null; T.err=''; },
 open:function(t){ T.open=t.dataset.id; },
 back:function(){ T.open=null; },
 'delete':function(t){
  var id=t.dataset.id, L=T.list.filter(function(x){ return x.id===id; })[0];
  if(!confirm('Remove '+(L&&L.name||'this learner')+' and all their answers? This cannot be undone. If they open the app again, they will appear again.')) return false;
  fetch('api/learners?id='+encodeURIComponent(id),{method:'DELETE',headers:{'x-teacher-password':T.pw}})
  .then(function(r){ if(!r.ok) throw 0; T.list=T.list.filter(function(x){ return x.id!==id; }); T.open=null; render(); })
  .catch(function(){ alert('Could not remove this learner. Please try again.'); });
  return false;
 },
 size:function(t){ T.scale=Math.min(1.4,Math.max(0.9,Math.round((T.scale+0.1*(+t.dataset.d))*10)/10)); document.documentElement.style.setProperty('--scale',T.scale); return false; }
};
document.addEventListener('click', function(e){ var t=e.target.closest('[data-act]'); if(!t||t.disabled) return; var f=A[t.dataset.act]; if(!f) return; if(f(t)!==false) render(); });
app.addEventListener('submit', function(e){ if(e.target.dataset.form!=='login') return; e.preventDefault(); var v=document.getElementById('pw').value; if(!v) return; T.pw=v; writePw(v); load(); });
app.addEventListener('input', function(e){ var t=e.target, f=t.dataset.f; if(!f) return; T[f]=t.value;
 var id=t.id, pos=t.selectionStart; render(); var n=document.getElementById(id); if(n){ n.focus(); if(pos!=null&&n.setSelectionRange) try{ n.setSelectionRange(pos,pos); }catch(x){} } });

if(T.pw) load(); else render();
})();

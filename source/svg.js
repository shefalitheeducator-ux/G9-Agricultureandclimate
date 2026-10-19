/* ===== Diagrams drawn for this PAL (all original, theme-aware) ===== */
var SVN = 0;
function mk(id, cols){ return '<defs>' + cols.map(function(c){ return '<marker id="'+id+'-'+c+'" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--'+c+')"/></marker>'; }).join('') + '</defs>'; }
function T(x,y,txt,cls,anchor){ return '<text x="'+x+'" y="'+y+'" class="'+(cls||'t')+'"'+(anchor?' text-anchor="'+anchor+'"':'')+'>'+txt+'</text>'; }

var SVGS = {
 composition: function(){
  var C = 2*Math.PI*62;
  function seg(p,off,col){ return '<circle r="62" style="fill:none;stroke:var(--'+col+');stroke-width:30" stroke-dasharray="'+(C*p/100).toFixed(2)+' '+C.toFixed(2)+'" stroke-dashoffset="'+(-C*off/100).toFixed(2)+'"/>'; }
  return '<svg class="fig" viewBox="0 0 420 210" role="img" aria-label="Donut chart of air: nitrogen 78 per cent, oxygen 21 per cent, other gases 1 per cent. The 1 per cent is argon 0.93, carbon dioxide 0.04 and other gases 0.03 per cent.">'
   + '<g transform="translate(100,104) rotate(-90)">'+seg(78,0,'band4')+seg(21,78,'good')+seg(1.2,98.8,'earth')+'</g>'
   + T(100,102,'Air','t-big','middle') + T(100,120,'by volume','t-sm','middle')
   + '<rect x="200" y="30" width="14" height="14" rx="3" style="fill:var(--band4)"/>' + T(222,42,'Nitrogen 78%','t-b')
   + '<rect x="200" y="56" width="14" height="14" rx="3" style="fill:var(--good)"/>' + T(222,68,'Oxygen 21%','t-b')
   + '<rect x="200" y="82" width="14" height="14" rx="3" style="fill:var(--earth)"/>' + T(222,94,'All others 1%','t-b')
   + '<rect x="200" y="108" width="206" height="72" rx="8" style="fill:var(--surface-2);stroke:var(--line)"/>'
   + T(212,126,'Inside that 1%:','t-sm') + T(212,144,'Argon 0.93%','t') + T(212,160,'Carbon dioxide 0.04%','t') + T(212,175,'Other gases 0.03%','t')
   + T(200,200,'Also: water vapour (0.1–0.4%) and dust.','t-sm')
   + '</svg>';
 },
 layers: function(o){
  o = o || {}; var id = 'ly'+(++SVN);
  var B = [ {n:'Exosphere',y:12,h:68,c:'band5',f:'Light gases escape to space'},
            {n:'Thermosphere',y:80,h:110,c:'band4',f:'Auroras · radio waves bounce'},
            {n:'Mesosphere',y:190,h:80,c:'band3',f:'Meteorites burn up'},
            {n:'Stratosphere',y:270,h:80,c:'band2',f:'Ozone layer · planes fly'},
            {n:'Troposphere',y:350,h:80,c:'band1',f:'Clouds, rain, air we breathe'} ];
  var s = '<svg class="fig tall" viewBox="0 0 380 470" role="img" aria-label="Diagram of the five layers of the atmosphere from the ground up: troposphere to 12 km, stratosphere to 50 km, mesosphere to 80 km, thermosphere to 700 km, then exosphere. A red line shows temperature falling in the troposphere, rising in the stratosphere, falling in the mesosphere and rising fast in the thermosphere.">' + mk(id,['heat']);
  B.forEach(function(b){ s += '<rect x="0" y="'+b.y+'" width="380" height="'+b.h+'" style="fill:var(--'+b.c+')"/>' + T(10,b.y+22,b.n,'t-b') + T(372,b.y+b.h-10,b.f,'t-sm2','end'); });
  [[350,'Tropopause · 12 km'],[270,'Stratopause · 50 km'],[190,'Mesopause · 80 km'],[80,'700 km']].forEach(function(l){ s += '<line x1="0" x2="380" y1="'+l[0]+'" y2="'+l[0]+'" style="stroke:var(--ink);stroke-opacity:.35" stroke-dasharray="4 4"/>' + T(10,l[0]-5,l[1],'t-xs'); });
  s += '<path d="M0 430 L40 412 L62 420 L96 398 L130 430 Z" style="fill:var(--earth);opacity:.55"/><rect x="0" y="430" width="380" height="12" style="fill:var(--earth)"/>';
  // cloud, plane, meteor, aurora
  s += '<g style="fill:var(--surface)"><ellipse cx="300" cy="390" rx="22" ry="10"/><ellipse cx="318" cy="384" rx="16" ry="11"/><ellipse cx="284" cy="386" rx="12" ry="8"/></g>';
  s += '<path d="M282 302 l34 -4 l6 -6 l4 0 l-3 7 l14 -2 l3 -4 l3 0 l-2 6 l-2 6 l-3 0 l-3 -4 l-14 -2 l3 7 l-4 0 l-6 -6 l-34 -4 z" style="fill:var(--muted)"/>';
  s += '<line x1="286" y1="205" x2="312" y2="228" style="stroke:var(--sun);stroke-width:2"/><circle cx="314" cy="230" r="3" style="fill:var(--sun)"/>';
  s += '<path d="M250 120 q15 -18 30 0 t30 0 t30 0" style="fill:none;stroke:var(--good);stroke-width:3;opacity:.8"/>';
  s += '<polyline points="205,430 145,350 215,270 125,190 330,86" style="fill:none;stroke:var(--heat);stroke-width:3" marker-end="url(#'+id+'-heat)"/>';
  s += T(210,445,'','t-xs');
  s += '<rect x="0" y="442" width="380" height="28" style="fill:var(--surface)"/>' + '<line x1="10" x2="34" y1="456" y2="456" style="stroke:var(--heat);stroke-width:3"/>' + T(40,460,'Temperature: left = colder, right = warmer. Not to scale.','t-xs');
  if(typeof o.km === 'number'){ var y = kmToY(o.km); s += '<line x1="0" x2="380" y1="'+y.toFixed(1)+'" y2="'+y.toFixed(1)+'" style="stroke:var(--accent);stroke-width:2.5"/><circle cx="356" cy="'+y.toFixed(1)+'" r="9" style="fill:var(--accent);stroke:var(--surface);stroke-width:2"/>'; }
  return s + '</svg>';
 },
 zones: function(){
  var id='zn'+(++SVN), cx=250, cy=120, r=100;
  function yl(l){ return cy - r*Math.sin(l*Math.PI/180); }
  var s = '<svg class="fig" viewBox="0 0 400 250" role="img" aria-label="Globe with the Sun on the left. Rays hit the equator directly and the poles at a slant. Zones: torrid between 23 and a half degrees north and south, temperate up to 66 and a half degrees, frigid near the poles.">'+mk(id,['sun'])
   + '<defs><clipPath id="'+id+'c"><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'"/></clipPath></defs>'
   + '<g clip-path="url(#'+id+'c)">'
   + '<rect x="140" y="0" width="220" height="'+yl(66.5)+'" style="fill:var(--band2)"/>'
   + '<rect x="140" y="'+yl(66.5)+'" width="220" height="'+(yl(23.5)-yl(66.5))+'" style="fill:var(--good-soft)"/>'
   + '<rect x="140" y="'+yl(23.5)+'" width="220" height="'+(yl(-23.5)-yl(23.5))+'" style="fill:var(--warn-soft)"/>'
   + '<rect x="140" y="'+yl(-23.5)+'" width="220" height="'+(yl(-66.5)-yl(-23.5))+'" style="fill:var(--good-soft)"/>'
   + '<rect x="140" y="'+yl(-66.5)+'" width="220" height="40" style="fill:var(--band2)"/>'
   + '</g><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" style="fill:none;stroke:var(--ink);stroke-opacity:.5"/>';
  [66.5,23.5,0,-23.5,-66.5].forEach(function(l){ var y=yl(l), hw=r*Math.cos(l*Math.PI/180); s += '<line x1="'+(cx-hw)+'" x2="'+(cx+hw)+'" y1="'+y+'" y2="'+y+'" style="stroke:var(--ink);stroke-opacity:'+(l===0?.7:.35)+'" '+(l===0?'':'stroke-dasharray="3 3"')+'/>'; s += T(cx+hw+6, y+4, (l===0?'0° Equator':(Math.abs(l)+'°'+(l>0?'N':'S')).replace('.5','½')), 't-xs'); });
  s += T(cx,yl(80)+12,'Frigid','t-sm','middle') + T(cx,(yl(66.5)+yl(23.5))/2+4,'Temperate','t-sm','middle') + T(cx,cy-14,'Torrid','t-b','middle') + T(cx,(yl(-66.5)+yl(-23.5))/2+4,'Temperate','t-sm','middle');
  s += '<circle cx="-30" cy="120" r="70" style="fill:var(--sun)"/>';
  [[30,'direct'],[120,'direct'],[210,'']].forEach(function(){});
  s += '<line x1="44" y1="120" x2="146" y2="120" style="stroke:var(--sun);stroke-width:3" marker-end="url(#'+id+'-sun)"/>';
  s += '<line x1="44" y1="60" x2="168" y2="60" style="stroke:var(--sun);stroke-width:3" marker-end="url(#'+id+'-sun)"/>';
  s += '<line x1="44" y1="180" x2="168" y2="180" style="stroke:var(--sun);stroke-width:3" marker-end="url(#'+id+'-sun)"/>';
  s += T(52,112,'Direct rays','t-xs') + T(52,52,'Slanting rays','t-xs') + T(10,240,'Direct rays heat more. Slanting rays spread out and heat less.','t-xs');
  return s + '</svg>';
 },
 pressure: function(){
  var id='pr'+(++SVN);
  var s = '<svg class="fig" viewBox="0 0 400 230" role="img" aria-label="Left: warm ground, air rises, low pressure, clouds and rain. Right: cool ground, air sinks, high pressure, clear sky. Wind blows from high to low.">'+mk(id,['heat','rain','accent'])
   + '<rect x="0" y="180" width="190" height="16" rx="3" style="fill:var(--heat);opacity:.75"/>' + T(95,214,'Warm ground','t-sm','middle')
   + '<rect x="210" y="180" width="190" height="16" rx="3" style="fill:var(--rain);opacity:.75"/>' + T(305,214,'Cool ground','t-sm','middle')
   + '<line x1="70" y1="168" x2="70" y2="96" style="stroke:var(--heat);stroke-width:3" marker-end="url(#'+id+'-heat)"/><line x1="120" y1="168" x2="120" y2="96" style="stroke:var(--heat);stroke-width:3" marker-end="url(#'+id+'-heat)"/>'
   + '<line x1="280" y1="96" x2="280" y2="168" style="stroke:var(--rain);stroke-width:3" marker-end="url(#'+id+'-rain)"/><line x1="330" y1="96" x2="330" y2="168" style="stroke:var(--rain);stroke-width:3" marker-end="url(#'+id+'-rain)"/>'
   + '<g style="fill:var(--muted);opacity:.55"><ellipse cx="95" cy="46" rx="40" ry="16"/><ellipse cx="120" cy="38" rx="26" ry="16"/></g>'
   + '<g style="stroke:var(--rain);stroke-width:2"><line x1="80" y1="68" x2="76" y2="80"/><line x1="96" y1="68" x2="92" y2="80"/><line x1="112" y1="68" x2="108" y2="80"/></g>'
   + '<circle cx="305" cy="44" r="16" style="fill:var(--sun)"/>'
   + '<circle cx="95" cy="132" r="17" style="fill:var(--surface);stroke:var(--heat);stroke-width:2"/>' + T(95,139,'L','t-big','middle')
   + '<circle cx="305" cy="132" r="17" style="fill:var(--surface);stroke:var(--rain);stroke-width:2"/>' + T(305,139,'H','t-big','middle')
   + T(10,20,'Warm air rises: LOW pressure,','t-xs') + T(10,33,'cloudy and wet','t-xs')
   + T(390,20,'Cool air sinks: HIGH pressure,','t-xs','end') + T(390,33,'clear and sunny','t-xs','end')
   + '<line x1="268" y1="140" x2="140" y2="140" style="stroke:var(--accent);stroke-width:3" marker-end="url(#'+id+'-accent)"/>' + T(204,160,'Wind: high → low','t-b','middle')
   + '</svg>';
  return s;
 },
 pressureMap: function(){
  var s='<svg class="fig" viewBox="0 0 400 200" role="img" aria-label="Pressure map with two areas. Left area: H with lines 1012, 1008, 1004 millibars. Right area: L with lines 984, 988, 992 millibars.">';
  [[30,'1012'],[55,'1008'],[80,'1004']].forEach(function(a){ s+='<circle cx="110" cy="100" r="'+a[0]+'" style="fill:none;stroke:var(--muted)"/>'+T(110,100-a[0]+12,a[1],'t-xs','middle'); });
  [[30,'984'],[55,'988'],[80,'992']].forEach(function(a){ s+='<circle cx="290" cy="100" r="'+a[0]+'" style="fill:none;stroke:var(--muted)"/>'+T(290,100-a[0]+12,a[1],'t-xs','middle'); });
  s += T(110,110,'H','t-big','middle') + T(290,110,'L','t-big','middle') + T(200,196,'Numbers show air pressure in millibars (mb).','t-xs','middle');
  return s+'</svg>';
 },
 compass: function(){
  var id='cp'+(++SVN);
  var s='<svg class="fig small" viewBox="0 0 240 240" role="img" aria-label="Compass with an arrow starting at the south-west and pointing to the centre.">'+mk(id,['accent'])
  + '<circle cx="120" cy="120" r="90" style="fill:var(--surface-2);stroke:var(--line);stroke-width:2"/>'
  + T(120,24,'N','t-b','middle') + T(120,226,'S','t-b','middle') + T(14,125,'W','t-b','middle') + T(226,125,'E','t-b','middle')
  + T(48,52,'NW','t-xs','middle') + T(192,52,'NE','t-xs','middle') + T(48,196,'SW','t-xs','middle') + T(192,196,'SE','t-xs','middle')
  + '<line x1="120" y1="40" x2="120" y2="200" style="stroke:var(--line)"/><line x1="40" y1="120" x2="200" y2="120" style="stroke:var(--line)"/>'
  + '<line x1="62" y1="178" x2="114" y2="126" style="stroke:var(--accent);stroke-width:5" marker-end="url(#'+id+'-accent)"/>'
  + '<circle cx="120" cy="120" r="5" style="fill:var(--ink)"/>';
  return s+'</svg>';
 },
 breeze: function(o){
  var night = o && o.mode==='night'; var id='bz'+(++SVN);
  var s='<svg class="fig" viewBox="0 0 400 230" role="img" aria-label="'+(night?'Night: the land is cooler, high pressure over land, a gentle land breeze blows from land to sea.':'Day: the land is warmer, low pressure over land, a sea breeze blows from sea to land.')+'">'+mk(id,['heat','rain'])
  + '<rect x="0" y="0" width="400" height="230" style="fill:var('+(night?'--band5':'--accent-soft')+');opacity:'+(night?.55:1)+'"/>'
  + '<path d="M0 150 L200 176 L200 230 L0 230 Z" style="fill:var(--earth)"/>'
  + '<rect x="200" y="172" width="200" height="58" style="fill:var(--rain);opacity:.75"/>';
  s += night ? '<path d="M44 26 a18 18 0 1 0 22 24 a14 14 0 1 1 -22 -24z" style="fill:var(--sun)"/>' : '<circle cx="50" cy="40" r="18" style="fill:var(--sun)"/>';
  var low = night ? 'rain' : 'heat', hi = night ? 'heat' : 'rain';
  if(!night){
   s += '<path d="M300 140 L110 140" style="stroke:var(--rain);stroke-width:3.5;fill:none" marker-end="url(#'+id+'-rain)"/>'
     + '<path d="M100 132 L100 70" style="stroke:var(--heat);stroke-width:3;fill:none" marker-end="url(#'+id+'-heat)"/>'
     + '<path d="M110 62 L300 62" style="stroke:var(--heat);stroke-width:2.5;fill:none;opacity:.7" marker-end="url(#'+id+'-heat)"/>'
     + '<path d="M310 70 L310 132" style="stroke:var(--rain);stroke-width:2.5;fill:none;opacity:.7" marker-end="url(#'+id+'-rain)"/>'
     + '<circle cx="70" cy="110" r="14" style="fill:var(--surface)"/>'+T(70,116,'L','t-b','middle')
     + '<circle cx="345" cy="110" r="14" style="fill:var(--surface)"/>'+T(345,116,'H','t-b','middle')
     + T(200,20,'DAY · Sea breeze: sea → land','t-b','middle')+T(60,200,'Land is warmer','t-w','start')+T(390,208,'Sea is cooler','t-w','end');
  } else {
   s += '<path d="M110 145 L300 145" style="stroke:var(--heat);stroke-width:2.5;fill:none" marker-end="url(#'+id+'-heat)"/>'
     + '<path d="M310 135 L310 75" style="stroke:var(--rain);stroke-width:2.5;fill:none;opacity:.8" marker-end="url(#'+id+'-rain)"/>'
     + '<path d="M300 66 L110 66" style="stroke:var(--rain);stroke-width:2;fill:none;opacity:.7" marker-end="url(#'+id+'-rain)"/>'
     + '<path d="M100 74 L100 136" style="stroke:var(--heat);stroke-width:2;fill:none;opacity:.7" marker-end="url(#'+id+'-heat)"/>'
     + '<circle cx="70" cy="110" r="14" style="fill:var(--surface)"/>'+T(70,116,'H','t-b','middle')
     + '<circle cx="345" cy="110" r="14" style="fill:var(--surface)"/>'+T(345,116,'L','t-b','middle')
     + T(200,20,'NIGHT · Land breeze: land → sea (gentle)','t-b','middle')+T(60,200,'Land is cooler','t-w','start')+T(390,208,'Sea is warmer','t-w','end');
  }
  return s+'</svg>';
 },
 monsoon: function(o){
  o=o||{}; var w = o.mode==='winter'; var id='mn'+(++SVN);
  var s='<svg class="fig" viewBox="0 0 400 310" role="img" aria-label="'+(w?'Schematic, not a map. Winter: cool land with high pressure. Winds blow from the north-east across the land and out over the Bay of Bengal, pick up moisture, and reach the south-east coast.':'Schematic, not a map. Summer: hot land with low pressure. Moist winds blow from the ocean in the south-west onto the land.')+'">'+mk(id,['rain','muted','heat'])
  + '<rect x="0" y="0" width="400" height="310" style="fill:var(--rain);opacity:.18"/>'
  + '<path d="M95 30 L300 30 L318 80 L262 120 L226 205 L198 262 L172 205 L140 126 L86 82 Z" style="fill:var(--earth-soft);stroke:var(--earth);stroke-width:2"/>'
  + T(198,70,'LAND','t-b','middle') + T(48,170,'Arabian','t-sm','middle') + T(48,184,'Sea','t-sm','middle') + T(340,176,'Bay of','t-sm','middle') + T(340,190,'Bengal','t-sm','middle') + T(200,298,'Indian Ocean','t-sm','middle')
  + T(8,16,'Diagram, not a map','t-xs');
  if(!w){
   s += '<circle cx="198" cy="110" r="16" style="fill:var(--surface);stroke:var(--heat);stroke-width:2"/>'+T(198,117,'L','t-big','middle')+T(198,146,'Hot land','t-xs','middle')
     + '<circle cx="110" cy="250" r="14" style="fill:var(--surface);stroke:var(--rain);stroke-width:2"/>'+T(110,256,'H','t-b','middle')
     + '<circle cx="300" cy="250" r="14" style="fill:var(--surface);stroke:var(--rain);stroke-width:2"/>'+T(300,256,'H','t-b','middle')
     + '<path d="M30 280 Q80 220 150 140" style="fill:none;stroke:var(--rain);stroke-width:4" marker-end="url(#'+id+'-rain)"/>'
     + '<path d="M70 300 Q140 240 182 170" style="fill:none;stroke:var(--rain);stroke-width:4" marker-end="url(#'+id+'-rain)"/>'
     + '<path d="M250 290 Q300 220 280 110" style="fill:none;stroke:var(--rain);stroke-width:4" marker-end="url(#'+id+'-rain)"/>'
     + T(392,236,'Moist winds from','t-xs','end') + T(392,248,'the south-west','t-xs','end');
  } else {
   s += '<circle cx="198" cy="110" r="16" style="fill:var(--surface);stroke:var(--rain);stroke-width:2"/>'+T(198,117,'H','t-big','middle')+T(198,146,'Cool land','t-xs','middle')
     + '<circle cx="330" cy="235" r="14" style="fill:var(--surface);stroke:var(--heat);stroke-width:2"/>'+T(330,241,'L','t-b','middle')
     + '<path d="M300 10 Q250 90 130 140 Q90 160 60 210" style="fill:none;stroke:var(--muted);stroke-width:3;stroke-dasharray:7 5" marker-end="url(#'+id+'-muted)"/>'
     + '<path d="M392 40 Q350 130 290 180 Q255 205 236 202" style="fill:none;stroke:var(--rain);stroke-width:4" marker-end="url(#'+id+'-rain)"/>'
     + '<g style="fill:var(--rain)"><circle cx="300" cy="160" r="3"/><circle cx="282" cy="182" r="3"/><circle cx="266" cy="194" r="3"/></g>'
     + T(392,24,'Winds from the north-east','t-xs','end') + T(62,228,'dry','t-xs','middle');
   if(!o.nolabel) s += '<path d="M230 196 L260 236" style="stroke:var(--ink);stroke-opacity:.5"/>'+T(262,250,'Rain on the','t-xs')+T(262,262,'south-east coast','t-xs')+T(262,274,'(Tamil Nadu)','t-xs');
   else s += T(330,214,'picks up moisture','t-xs','middle');
  }
  return s+'</svg>';
 },
 rain: function(o){
  var cities=(o&&o.cities)||['Chennai','Delhi'], W=420,H=240,L=40,R=12,Tp=34,Bt=34, pw=W-L-R, ph=H-Tp-Bt;
  var mx=0; cities.forEach(function(c){ RAIN[c].forEach(function(v){ if(v>mx) mx=v; }); });
  var top=Math.ceil(mx/10)*10, step = top>40?20:10, gw=pw/12, bw=(gw-6)/cities.length, cols=['accent','earth','good'];
  var s='<svg class="fig" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Bar chart of average monthly rainfall in centimetres for '+cities.join(', ')+'. '+cities.map(function(c){ return c+': '+RAIN[c].join(', '); }).join('. ')+'.">';
  for(var v=0; v<=top; v+=step){ var y=Tp+ph-ph*v/top; s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'" style="stroke:var(--line)"/>'+T(L-6,y+4,v,'t-xs','end'); }
  s += T(8,Tp-12,'cm','t-xs');
  'JFMAMJJASOND'.split('').forEach(function(m,i){
   cities.forEach(function(c,j){ var v=RAIN[c][i], h=ph*v/top, x=L+i*gw+3+j*bw; s+='<rect x="'+x.toFixed(1)+'" y="'+(Tp+ph-h).toFixed(1)+'" width="'+(bw-1).toFixed(1)+'" height="'+Math.max(h,0.5).toFixed(1)+'" rx="1.5" style="fill:var(--'+cols[j]+')"><title>'+c+', '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i]+': '+v+' cm</title></rect>'; });
   s += T(L+i*gw+gw/2, H-Bt+16, m, 't-xs','middle');
  });
  cities.forEach(function(c,j){ var x=L+j*110; s+='<rect x="'+x+'" y="8" width="12" height="12" rx="2" style="fill:var(--'+cols[j]+')"/>'+T(x+17,18,c,'t-sm'); });
  s += T(W-R,H-4,'Source: Table 3.3, NCERT Grade 9','t-xs','end');
  return s+'</svg>';
 },
 greenhouse: function(){
  var id='gh'+(++SVN);
  var s='<svg class="fig" viewBox="0 0 400 230" role="img" aria-label="Sunlight comes in through the atmosphere and warms the Earth. Heat goes back up. Some heat escapes to space; greenhouse gases trap some and send it back down.">'+mk(id,['sun','heat'])
  + '<path d="M0 200 Q200 150 400 200 L400 230 L0 230 Z" style="fill:var(--good)"/>'
  + '<path d="M0 120 Q200 70 400 120 L400 150 Q200 100 0 150 Z" style="fill:var(--accent-soft);stroke:var(--accent);stroke-opacity:.4"/>'
  + T(330,110,'Greenhouse gases','t-sm','middle')
  + '<g style="fill:var(--accent)"><circle cx="150" cy="112" r="4"/><circle cx="190" cy="104" r="4"/><circle cx="240" cy="106" r="4"/><circle cx="280" cy="114" r="4"/></g>'
  + '<circle cx="40" cy="30" r="22" style="fill:var(--sun)"/>'
  + '<line x1="62" y1="44" x2="150" y2="168" style="stroke:var(--sun);stroke-width:3" marker-end="url(#'+id+'-sun)"/>'
  + '<line x1="66" y1="34" x2="200" y2="160" style="stroke:var(--sun);stroke-width:3" marker-end="url(#'+id+'-sun)"/>'
  + T(78,22,'Sunlight comes in','t-xs')
  + '<path d="M240 172 q6 -10 0 -20 t0 -20 t0 -20 t0 -20 t0 -20 t0 -20" style="fill:none;stroke:var(--heat);stroke-width:2.5" marker-end="url(#'+id+'-heat)"/>'
  + T(250,40,'Some heat escapes','t-xs')
  + '<path d="M300 176 q6 -10 0 -20 t0 -20 t0 -16" style="fill:none;stroke:var(--heat);stroke-width:2.5"/>'
  + '<path d="M300 120 Q320 112 330 160" style="fill:none;stroke:var(--heat);stroke-width:2.5" marker-end="url(#'+id+'-heat)"/>'
  + T(200,218,'Trapped heat warms the Earth','t-w','middle');
  return s+'</svg>';
 },
 seasons: function(){
  var m='JFMAMJJASOND'.split(''), L=10, w=31.5, s='<svg class="fig" viewBox="0 0 400 170" role="img" aria-label="Timeline of the year. IMD seasons: winter December to early April, summer April to June, monsoon June to September, post-monsoon October to December. Traditional ritus: Shishira January-February, Vasanta March-April, Grishma May-June, Varsha July-August, Sharad September-October, Hemanta November-December.">';
  m.forEach(function(x,i){ s+=T(L+i*w+w/2,16,x,'t-xs','middle'); });
  s += T(L,36,'IMD seasons','t-xs');
  function bar(a,b,y,lab,col){ return '<rect x="'+(L+a*w+1)+'" y="'+y+'" width="'+((b-a)*w-2)+'" height="26" rx="6" style="fill:var(--'+col+')"/>'+T(L+(a+b)/2*w,y+17,lab,'t-bar','middle'); }
  s += bar(0,3.2,42,'Winter','band3') + bar(3.2,5.6,42,'Summer','warn-soft') + bar(5.6,9,42,'Monsoon','accent-soft') + bar(9,11,42,'Post-monsoon','good-soft') + bar(11,12,42,'W','band3');
  s += T(L,96,'Traditional ṛtus','t-xs');
  [['Śhiśhira',0,'band2'],['Vasanta',2,'good-soft'],['Grīṣhma',4,'warn-soft'],['Varṣhā',6,'accent-soft'],['Śharad',8,'band1'],['Hemanta',10,'earth-soft']].forEach(function(r){ s+=bar(r[1],r[1]+2,102,r[0],r[2]); });
  s += T(L,156,'IMD seasons overlap at the edges (winter starts in December).','t-xs');
  return s+'</svg>';
 },
 flood: function(){
  var s='<svg class="fig" viewBox="0 0 400 230" role="img" aria-label="Cross-section of a river in Punjab. Natural causes in blue: heavy monsoon rain, western disturbances, water from the hills. Human-made causes in brown: weak embankment, houses and farms on the floodplain, silt in the riverbed, late warnings.">'
  + '<path d="M0 70 L60 40 L110 70 Z" style="fill:var(--muted);opacity:.4"/><g style="fill:var(--muted);opacity:.5"><ellipse cx="170" cy="30" rx="40" ry="14"/><ellipse cx="200" cy="24" rx="26" ry="14"/></g>'
  + '<g style="stroke:var(--rain);stroke-width:2"><line x1="160" y1="48" x2="156" y2="60"/><line x1="176" y1="48" x2="172" y2="60"/><line x1="192" y1="48" x2="188" y2="60"/><line x1="208" y1="48" x2="204" y2="60"/></g>'
  + '<path d="M0 150 L120 150 L140 180 L260 180 L280 150 L400 150 L400 230 L0 230 Z" style="fill:var(--earth)"/>'
  + '<path d="M140 180 L260 180 L270 160 L130 160 Z" style="fill:var(--rain);opacity:.8"/>'
  + '<path d="M150 180 L250 180 L246 172 L154 172 Z" style="fill:var(--warn);opacity:.7"/>'
  + '<path d="M270 150 L282 128 L294 150 Z" style="fill:var(--earth-soft);stroke:var(--earth)"/><path d="M280 132 l4 10 l-3 6" style="stroke:var(--heat);stroke-width:2;fill:none"/>'
  + '<rect x="320" y="128" width="26" height="22" style="fill:var(--surface);stroke:var(--earth)"/><path d="M316 130 L333 116 L350 130 Z" style="fill:var(--heat);opacity:.8"/>'
  + '<g style="stroke:var(--good);stroke-width:2"><line x1="360" y1="150" x2="360" y2="138"/><line x1="370" y1="150" x2="370" y2="136"/><line x1="380" y1="150" x2="380" y2="138"/></g>'
  + '<g class="tag-n">'+T(230,22,'Heavy monsoon rain','t-xs')+T(230,36,'+ western disturbances','t-xs')+T(4,88,'Water from the hills','t-xs')+'</g>'
  + T(300,104,'Weak embankment','t-xs-e','middle') + T(352,170,'Homes and farms','t-oe','middle') + T(352,182,'on the floodplain','t-oe','middle') + T(200,200,'Silt in the riverbed','t-oe','middle') + T(60,182,'Late warnings','t-oe','middle')
  + '<rect x="4" y="212" width="10" height="10" style="fill:var(--rain)"/>'+T(18,221,'Natural causes','t-oe')+'<rect x="110" y="212" width="10" height="10" style="fill:var(--earth-soft)"/>'+T(124,221,'Human-made causes','t-oe');
  return s+'</svg>';
 },
 hero: function(){
  var s='<svg class="hero-art" viewBox="0 0 800 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  [['band5',0,40],['band4',40,40],['band3',80,40],['band2',120,35],['band1',155,25]].forEach(function(b){ s+='<rect x="0" y="'+b[1]+'" width="800" height="'+b[2]+'" style="fill:var(--'+b[0]+')"/>'; });
  s += '<circle cx="660" cy="70" r="30" style="fill:var(--sun)"/>';
  s += '<g style="fill:var(--surface);opacity:.9"><ellipse cx="190" cy="150" rx="46" ry="14"/><ellipse cx="220" cy="140" rx="30" ry="15"/><ellipse cx="480" cy="135" rx="38" ry="12"/><ellipse cx="505" cy="127" rx="24" ry="12"/></g>';
  s += '<path d="M0 180 Q400 160 800 180 L800 220 L0 220 Z" style="fill:var(--st5)"/>';
  for(var i=0;i<26;i++){ var x=12+i*31; s+='<path d="M'+x+' 205 q4 -12 0 -20 M'+x+' 196 q6 -4 10 -10 M'+x+' 199 q-6 -3 -9 -9" style="stroke:var(--good);stroke-width:2;fill:none"/>'; }
  s += '<path d="M30 60 q12 -16 24 0 t24 0 t24 0" style="fill:none;stroke:var(--good);stroke-width:2.5;opacity:.7"/>';
  return s+'</svg>';
 }
};
/* friendly cloud guide for the road map */
SVGS.mascot = function(){
 return '<svg class="mascot" viewBox="0 0 96 80" width="84" height="70" aria-hidden="true">'
  +'<path d="M24 66h50a16 16 0 0 0 2-31.9A22 22 0 0 0 34 28a17 17 0 0 0-10 38z" style="fill:var(--surface);stroke:var(--ink);stroke-width:2.5;stroke-linejoin:round"/>'
  +'<circle cx="42" cy="46" r="4.5" style="fill:var(--ink)"/><circle cx="60" cy="46" r="4.5" style="fill:var(--ink)"/><circle cx="43.5" cy="44.5" r="1.4" style="fill:var(--surface)"/><circle cx="61.5" cy="44.5" r="1.4" style="fill:var(--surface)"/>'
  +'<path d="M44 55q7 6 14 0" style="fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linecap:round"/>'
  +'<circle cx="35" cy="54" r="3.5" style="fill:var(--t-pink)"/><circle cx="67" cy="54" r="3.5" style="fill:var(--t-pink)"/>'
  +'<path d="M50 10v8M38 14l3 6M62 14l-3 6" style="stroke:var(--sun);stroke-width:2.5;stroke-linecap:round"/></svg>';
};
/* one small picture per mission, used on the road and the mission banner */
SVGS.micon = function(k){
 var a='style="fill:none;stroke:var(--ink);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round"', b='<svg class="micon" viewBox="0 0 64 64" aria-hidden="true">';
 if(k==='ATM') return b+'<path d="M8 50a24 24 0 0 1 48 0" style="fill:var(--t-blue)"/><path d="M8 50a24 24 0 0 1 48 0M16 50a16 16 0 0 1 32 0M24 50a8 8 0 0 1 16 0" '+a+'/><path d="M6 50h52" '+a+'/><path d="M44 18l6-3-2 6z" style="fill:var(--surface);stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round"/></svg>';
 if(k==='WEA') return b+'<circle cx="40" cy="22" r="9" style="fill:var(--sun);stroke:var(--ink);stroke-width:2.2"/><path d="M16 46h28a9 9 0 0 0 0-18 12 12 0 0 0-22 3 8 8 0 0 0-6 15z" style="fill:var(--surface);stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round"/><path d="M12 54h24M20 59h20" '+a+'/></svg>';
 if(k==='MON') return b+'<path d="M14 38h34a10 10 0 0 0 0-20 13 13 0 0 0-24 3 9 9 0 0 0-10 17z" style="fill:var(--t-lilac);stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round"/><path d="M20 45l-3 7M31 45l-3 7M42 45l-3 7" style="stroke:var(--rain);stroke-width:2.6;stroke-linecap:round"/><path d="M10 58h44" '+a+'/></svg>';
 return b+'<circle cx="32" cy="32" r="20" style="fill:var(--t-mint);stroke:var(--ink);stroke-width:2.2"/><path d="M20 24q6 2 8 8t8 6M36 16q-2 6 4 8t8 2" '+a+'/><path d="M44 46q8-4 10-14q-10 1-13 9" style="fill:var(--good-soft);stroke:var(--good);stroke-width:2.2;stroke-linejoin:round"/></svg>';
};
SVGS.breezeDay = function(){ return SVGS.breeze({mode:'day'}); };
SVGS.breezeNight = function(){ return SVGS.breeze({mode:'night'}); };
SVGS.monsoonSummer = function(){ return SVGS.monsoon({mode:'summer'}); };
SVGS.monsoonWinter = function(){ return SVGS.monsoon({mode:'winter'}); };
SVGS.rainCD = function(){ return SVGS.rain({cities:['Chennai','Delhi']}); };

function kmToY(km){ var seg=[[0,12,430,350],[12,50,350,270],[50,80,270,190],[80,700,190,80],[700,1000,80,12]]; for(var i=0;i<seg.length;i++){ var a=seg[i]; if(km<=a[1]) return a[2]+(a[3]-a[2])*((km-a[0])/(a[1]-a[0])); } return 12; }

var IMAGES = [
 {id:"IMG01",fn:"composition",name:"What air is made of (donut chart)",where:"Mission 1 lesson; repair card for ‘CO₂ is a main gas’"},
 {id:"IMG02",fn:"layers",name:"Five layers with temperature line",where:"Mission 1 lesson, altitude activity, repair cards"},
 {id:"IMG03",fn:"zones",name:"Insolation and temperature zones",where:"Mission 2 lesson; item WEA-P2"},
 {id:"IMG04",fn:"pressure",name:"Warm air rises, cool air sinks",where:"Mission 2 lesson; Mission 3 warm-up"},
 {id:"IMG05",fn:"pressureMap",name:"Pressure map (H and L)",where:"Checkpoint item WEA-C1"},
 {id:"IMG06",fn:"compass",name:"Compass: naming winds",where:"Item WEA-P1"},
 {id:"IMG07",fn:"breezeDay",name:"Sea breeze (day)",where:"Mission 2 lesson and activity"},
 {id:"IMG08",fn:"breezeNight",name:"Land breeze (night)",where:"Mission 2 lesson and activity"},
 {id:"IMG09",fn:"seasons",name:"IMD seasons and ṛtus timeline",where:"Mission 3 lesson"},
 {id:"IMG10",fn:"monsoonSummer",name:"Summer monsoon (schematic, not a map)",where:"Mission 3 lesson and activity"},
 {id:"IMG11",fn:"monsoonWinter",name:"Winter monsoon (schematic, not a map)",where:"Mission 3 lesson, activity; item MON-P6 (unlabelled version)"},
 {id:"IMG12",fn:"rainCD",name:"Rainfall chart from Table 3.3",where:"Diagnostic D7; items MON-P7; Mission 3 lesson"},
 {id:"IMG13",fn:"greenhouse",name:"Greenhouse effect",where:"Mission 4 lesson; repair cards"},
 {id:"IMG14",fn:"flood",name:"Punjab floods: natural and human-made causes",where:"Mission 4 lesson; repair cards"}
];

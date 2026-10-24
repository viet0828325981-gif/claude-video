/* ---------------- scene editor (dialog with scene strip + live preview) ---------------- */
const typeOpts=v=>TYPES.map(t=>`<option value="${t}" ${t===v?'selected':''}>${TYPE_VI[t]}</option>`).join('');
const ED={job:null,draft:null,sel:0,tpl:'minimal',rt:null,rtKey:'',raf:0,playing:true,lt:0,last:0,dirty:false,norm:null,thumbT:0,confirm:''};
function edEl(){
  let d=document.getElementById('sed');if(d)return d;
  d=document.createElement('div');d.id='sed';d.className='sed';d.hidden=true;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','sed-title');
  d.innerHTML=`<div class="sed-panel">
    <header class="sed-head"><div class="sed-hl"><h2 id="sed-title">Sửa cảnh</h2><p class="sed-sub" id="sed-sub"></p></div>
      <div class="actions"><label class="hint" for="sed-tpl">Xem với template</label><select id="sed-tpl"></select><button class="btn btn-sm" data-ed="close">Đóng</button></div></header>
    <div class="sed-body">
      <nav class="sed-strip" id="sed-strip" aria-label="Các cảnh"></nav>
      <section class="sed-view" aria-label="Xem trước cảnh">
        <div class="sed-canvas"><canvas id="sed-cv" width="${W}" height="${H}"></canvas></div>
        <div class="sed-ctl"><button class="btn btn-sm" data-ed="play" id="sed-play">Tạm dừng</button>
          <input type="range" id="sed-scrub" min="0" max="1000" value="0" aria-label="Thời điểm trong cảnh"><span class="stat" id="sed-time">0,0 s</span></div>
      </section>
      <section class="sed-form" id="sed-form" aria-label="Nội dung cảnh"></section>
    </div>
    <footer class="sed-foot">
      <div class="actions"><button class="btn btn-sm" data-ed="add">Thêm cảnh sau</button><button class="btn btn-sm" data-ed="dup">Nhân bản</button>
        <button class="btn btn-sm" data-ed="up" aria-label="Đưa cảnh lên">Lên</button><button class="btn btn-sm" data-ed="down" aria-label="Đưa cảnh xuống">Xuống</button>
        <button class="btn btn-sm btn-danger" data-ed="remove">Xoá cảnh</button></div>
      <div class="actions"><span class="hint" id="sed-dirty"></span><button class="btn btn-sm" data-ed="cancel" id="sed-cancel">Huỷ</button>
        <button class="btn btn-sm" data-ed="saveonly">Chỉ lưu</button><button class="btn btn-sm btn-primary" data-ed="save">Lưu và dựng lại</button></div>
    </footer></div>`;
  document.body.appendChild(d);
  d.addEventListener('click',edClick);d.addEventListener('input',edInput);d.addEventListener('change',edInput);
  d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();edTryClose();}});
  const sc=d.querySelector('#sed-scrub');sc.addEventListener('input',()=>{ED.playing=false;edPlayLabel();const s=edScene();ED.lt=(Number(sc.value)/1000)*edLoopLen(s);});
  d.querySelector('#sed-tpl').addEventListener('change',e=>{ED.tpl=e.target.value;ED.dirty=true;edMark();edThumbsSoon(0);});
  return d;
}
function edScene(){return ED.draft.scenes[ED.sel];}
function edLoopLen(s){return Math.max(.5,(Number(s.duration)||4)-.32);}
function edNormalized(){
  if(!ED.norm){try{ED.norm=normScript(ED.draft);}catch(e){ED.norm=null;}}
  return ED.norm;
}
function edChanged(thumbAll){ED.norm=null;ED.dirty=true;edMark();edThumbsSoon(thumbAll?0:1);}
function edMark(){const el=document.getElementById('sed-dirty');if(el)el.textContent=ED.dirty?'Có thay đổi chưa lưu':'';}
function edRT(){const tpl=TEMPLATES[ED.tpl]||kineticTpl;if(!tpl.gl){return null;}if(!ED.rt){ED.rt=makeGL();}return ED.rt;}
function openEditor(job){
  if(!job.script)return;
  const d=edEl();ED.job=job;ED.draft=JSON.parse(JSON.stringify(job.script));ED.sel=0;ED.tpl=job.template||'minimal';ED.dirty=false;ED.norm=null;ED.lt=0;ED.playing=true;ED.confirm='';
  d.querySelector('#sed-tpl').innerHTML=TPL_ORDER.map(k=>`<option value="${k}" ${k===ED.tpl?'selected':''}>${esc(TEMPLATES[k].name)}</option>`).join('');
  d.querySelector('#sed-sub').textContent=job.title||job.prompt||'';
  d.hidden=false;document.documentElement.style.overflow='hidden';
  edBuildStrip();edBuildForm();edMark();edPlayLabel();
  loadFonts().then(()=>{edThumbsSoon(0);cancelAnimationFrame(ED.raf);ED.last=performance.now();ED.raf=requestAnimationFrame(edTick);});
  setTimeout(()=>{const f=d.querySelector('[data-k="0"]');f&&f.focus();},50);
}
function edClose(){
  const d=document.getElementById('sed');if(!d)return;cancelAnimationFrame(ED.raf);d.hidden=true;document.documentElement.style.overflow='';
  if(ED.rt){ED.rt.dispose();ED.rt=null;}ED.job=null;
}
function edTryClose(){
  if(ED.dirty&&ED.confirm!=='close'){ED.confirm='close';const b=document.getElementById('sed-cancel');b.textContent='Bấm lần nữa để bỏ thay đổi';setTimeout(()=>{if(ED.confirm==='close'){ED.confirm='';b.textContent='Huỷ';}},3500);return;}
  edClose();
}
function edPlayLabel(){const b=document.getElementById('sed-play');if(b)b.textContent=ED.playing?'Tạm dừng':'Phát';}
function edTick(now){
  const d=document.getElementById('sed');if(!d||d.hidden||!ED.job)return;
  const dt=Math.min(.1,(now-ED.last)/1000);ED.last=now;
  const sc=edNormalized();
  if(sc){const s=sc.scenes[ED.sel];const len=edLoopLen(s);
    if(ED.playing){ED.lt+=dt;if(ED.lt>len+.8)ED.lt=0;}
    const lt=Math.min(ED.lt,len);const tl=timeline(sc),total=totalDur(sc);const tpl=TEMPLATES[ED.tpl]||kineticTpl;
    const cv=document.getElementById('sed-cv');renderFrame(cv.getContext('2d'),edRT(),tpl,sc,tl,total,tl[ED.sel].start+lt);
    const scrub=document.getElementById('sed-scrub');if(ED.playing)scrub.value=String(Math.round(lt/len*1000));
    document.getElementById('sed-time').textContent=lt.toFixed(1).replace('.',',')+' / '+len.toFixed(1).replace('.',',')+' s';}
  ED.raf=requestAnimationFrame(edTick);
}
function edThumbsSoon(onlySel){clearTimeout(ED.thumbT);ED.thumbT=setTimeout(()=>edThumbs(onlySel),onlySel?250:60);}
function edThumbs(onlySel){
  const sc=edNormalized();if(!sc)return;const tl=timeline(sc),total=totalDur(sc);const tpl=TEMPLATES[ED.tpl]||kineticTpl;
  const off=document.createElement('canvas');off.width=W;off.height=H;const octx=off.getContext('2d');
  sc.scenes.forEach((s,k)=>{if(onlySel&&k!==ED.sel)return;const c=document.querySelector(`#sed-strip [data-k="${k}"] canvas`);if(!c)return;
    renderFrame(octx,edRT(),tpl,sc,tl,total,tl[k].start+Math.max(0,Math.min(s.duration-.35,s.duration*.92)));
    const x=c.getContext('2d');x.drawImage(off,0,0,c.width,c.height);});
  sc.scenes.forEach((s,k)=>{const lb=document.querySelector(`#sed-strip [data-k="${k}"] .sed-tl`);if(lb)lb.textContent=`${k+1} · ${TYPE_VI[s.type]} · ${String(s.duration).replace('.',',')}s`;});
}
function edBuildStrip(){
  const st=document.getElementById('sed-strip');
  st.innerHTML=ED.draft.scenes.map((s,k)=>`<button class="sed-th" type="button" data-k="${k}" aria-pressed="${k===ED.sel}" aria-label="Cảnh ${k+1}">
    <canvas width="180" height="320" aria-hidden="true"></canvas><span class="sed-tl">${k+1} · ${TYPE_VI[s.type]||''} · ${String(s.duration).replace('.',',')}s</span></button>`).join('');
}
function edSelect(k){ED.sel=Math.max(0,Math.min(ED.draft.scenes.length-1,k));ED.lt=0;ED.playing=true;edPlayLabel();
  document.querySelectorAll('#sed-strip .sed-th').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.k)===ED.sel)));
  const b=document.querySelector(`#sed-strip [data-k="${ED.sel}"]`);b&&b.scrollIntoView({block:'nearest',inline:'nearest'});edBuildForm();}
const MARK_OPTS=v=>[['none','—'],['true','Đúng'],['false','Sai']].map(([k,l])=>`<option value="${k}" ${k===v?'selected':''}>${l}</option>`).join('');
function edBuildForm(){
  const s=edScene();const k=ED.sel;const p='sed-'+k;const list=s.type==='list'||s.type==='summary';
  const v=s.visual?normVisual(s.visual):null;
  const items=(s.items||[]);
  document.getElementById('sed-form').innerHTML=`
    <div class="sed-row"><span class="sc-no">Cảnh ${k+1} / ${ED.draft.scenes.length}</span>
      <label class="hint" for="${p}-type">Loại</label><select class="field" id="${p}-type" data-f="type">${typeOpts(s.type)}</select>
      <label class="hint" for="${p}-dur">Giây</label><input class="field num" type="number" id="${p}-dur" data-f="duration" min="2" max="10" step="0.5" value="${s.duration}"></div>
    <label class="flabel" for="${p}-heading">Tiêu đề</label><input class="field" id="${p}-heading" data-f="heading" value="${esc(s.heading)}" maxlength="48">
    ${s.type==='formula'?`<label class="flabel" for="${p}-formula">Công thức</label><input class="field" id="${p}-formula" data-f="formula" value="${esc(s.formula)}" maxlength="48" placeholder="vd: a² + b² = c²">`:''}
    <label class="flabel" for="${p}-body">${list?'Dòng dẫn (không bắt buộc)':'Nội dung'}</label><textarea class="field" id="${p}-body" data-f="body" rows="${list?2:3}" maxlength="150">${esc(s.body)}</textarea>
    ${list?`<div class="flabel">Các ý</div><div class="sed-items">${items.map((it,i)=>`<div class="sed-item">
        <input class="field" id="${p}-it${i}" data-item="${i}" data-if="text" value="${esc(it.text)}" maxlength="70" aria-label="Ý ${i+1}">
        <select class="field" id="${p}-mk${i}" data-item="${i}" data-if="mark" aria-label="Đánh dấu ý ${i+1}">${MARK_OPTS(it.mark)}</select>
        <button class="btn btn-sm btn-danger" type="button" data-ed="item-del" data-i="${i}" aria-label="Xoá ý ${i+1}">Xoá</button></div>`).join('')}
      ${items.length<4?'<button class="btn btn-sm" type="button" data-ed="item-add">Thêm ý</button>':''}</div>`:''}
    <label class="flabel" for="${p}-narr">Lời đọc <span class="hint">· viết số và ký hiệu bằng chữ</span></label>
    <textarea class="field" id="${p}-narr" data-f="narration" rows="3" maxlength="280">${esc(s.narration)}</textarea>
    <div class="sed-vis"><div class="sed-row"><span class="flabel" style="margin:0">Hình minh hoạ</span><span class="pill">${v?v.els.length+' thành phần':'Không có'}</span>
        ${v?'<button class="btn btn-sm btn-danger" type="button" data-ed="vis-del">Bỏ hình</button>':''}</div>
      ${S.sample?`<div class="sed-ai"><input class="field" id="${p}-visai" placeholder="${v?'Sửa hình, vd: thêm nhãn cạnh huyền':'Mô tả hình cần vẽ, hoặc để trống để Claude tự chọn'}" aria-label="Yêu cầu vẽ hình"><button class="btn btn-sm" type="button" data-ed="vis-ai">Claude vẽ</button></div>`:''}
      <details><summary class="hint">Sửa dạng JSON</summary><textarea class="field mono" id="${p}-visjson" data-f="visualjson" rows="6" spellcheck="false">${esc(v?JSON.stringify(v):'')}</textarea><p class="err" id="${p}-viserr" hidden></p></details></div>
    ${S.sample?`<div class="sed-vis"><label class="flabel" for="${p}-ai">Nhờ Claude sửa cả cảnh</label><div class="sed-ai"><input class="field" id="${p}-ai" placeholder="vd: thêm một ví dụ về số chẵn, rút gọn lời đọc">
      <button class="btn btn-sm" type="button" data-ed="scene-ai">Claude sửa</button></div></div>`:''}`;
}
function edInput(ev){
  const t=ev.target;if(!ED.job||!t.closest||!t.closest('#sed-form'))return;const s=edScene();
  if(t.dataset.f==='visualjson'){if(ev.type!=='change')return;const err=t.parentElement.querySelector('.err');
    if(!t.value.trim()){s.visual=null;err.hidden=true;edChanged();edBuildFormKeep();return;}
    try{const v=normVisual(JSON.parse(t.value));s.visual=v;err.hidden=true;edChanged();}catch(e){err.hidden=false;err.textContent='JSON chưa đúng: '+e.message;}
    return;}
  if(t.dataset.f){const f=t.dataset.f;
    if(f==='duration'){const n=Number(t.value);if(!isFinite(n))return;s.duration=Math.max(2,Math.min(10,n));edChanged(true);return;}
    s[f]=t.value;edChanged();if(f==='type'&&ev.type==='change'){if((s.type==='list'||s.type==='summary')&&!(s.items||[]).length)s.items=[{text:'Ý thứ nhất',mark:'none'}];edBuildForm();edBuildStripLabels();}
    return;}
  if(t.dataset.item!=null){const i=Number(t.dataset.item);s.items=s.items||[];if(!s.items[i])return;s.items[i][t.dataset.if]=t.value;edChanged();}
}
function edBuildFormKeep(){const a=document.activeElement&&document.activeElement.id;edBuildForm();if(a){const e=document.getElementById(a);e&&e.focus();}}
function edBuildStripLabels(){edThumbsSoon(0);}
async function edClick(ev){
  const b=ev.target.closest('button');if(!b||!ED.job)return;
  if(b.classList.contains('sed-th')){edSelect(Number(b.dataset.k));return;}
  const a=b.dataset.ed;if(!a)return;const sc=ED.draft.scenes;const s=edScene();
  if(a!=='cancel'&&a!=='close'&&ED.confirm){ED.confirm='';document.getElementById('sed-cancel').textContent='Huỷ';}
  if(a==='close'||a==='cancel'){edTryClose();return;}
  if(a==='play'){ED.playing=!ED.playing;if(ED.playing&&ED.lt>=edLoopLen(s))ED.lt=0;edPlayLabel();return;}
  if(a==='add'){sc.splice(ED.sel+1,0,{type:'point',heading:'Cảnh mới',body:'',items:[],formula:'',narration:'',icon:'none',visual:null,duration:4});ED.norm=null;edBuildStrip();edSelect(ED.sel+1);edChanged(true);return;}
  if(a==='dup'){sc.splice(ED.sel+1,0,JSON.parse(JSON.stringify(s)));ED.norm=null;edBuildStrip();edSelect(ED.sel+1);edChanged(true);return;}
  if(a==='up'||a==='down'){const j=ED.sel+(a==='up'?-1:1);if(j<0||j>=sc.length)return;[sc[ED.sel],sc[j]]=[sc[j],sc[ED.sel]];ED.norm=null;edBuildStrip();edSelect(j);edChanged(true);return;}
  if(a==='remove'){if(sc.length<=1){toast('Video cần ít nhất một cảnh.');return;}
    if(ED.confirm!=='remove'){ED.confirm='remove';b.textContent='Bấm lần nữa để xoá';setTimeout(()=>{if(ED.confirm==='remove'){ED.confirm='';b.textContent='Xoá cảnh';}},3000);return;}
    ED.confirm='';b.textContent='Xoá cảnh';sc.splice(ED.sel,1);ED.norm=null;edBuildStrip();edSelect(Math.min(ED.sel,sc.length-1));edChanged(true);return;}
  if(a==='item-add'){s.items=s.items||[];if(s.items.length<4)s.items.push({text:'',mark:'none'});edBuildForm();edChanged();const i=document.getElementById(`sed-${ED.sel}-it${s.items.length-1}`);i&&i.focus();return;}
  if(a==='item-del'){s.items.splice(Number(b.dataset.i),1);edBuildForm();edChanged();return;}
  if(a==='vis-del'){s.visual=null;edBuildForm();edChanged();return;}
  if(a==='vis-ai'||a==='scene-ai'){
    const inp=document.getElementById(a==='vis-ai'?`sed-${ED.sel}-visai`:`sed-${ED.sel}-ai`);const instr=inp?inp.value.trim():'';
    if(a==='scene-ai'&&!instr){inp&&inp.focus();return;}
    const k=ED.sel;const label=b.textContent;b.disabled=true;b.textContent='Claude đang làm…';
    try{
      const cur=normScene(JSON.parse(JSON.stringify(s)));
      if(a==='vis-ai'){const raw=await S.sample.json(visualPrompt(ED.draft.title,cur,instr),{cache:false,modelTier:S.model});const v=normVisual(raw&&raw.visual!==undefined?raw.visual:raw);
        if(!v)throw {code:'invalid_json'};ED.draft.scenes[k].visual=v;toast('Claude đã vẽ hình cho cảnh '+(k+1)+'.');}
      else{const raw=await S.sample.json(sceneFixPrompt(ED.draft.title,cur,instr),{cache:false,modelTier:S.model});ED.draft.scenes[k]=normScene(raw);toast('Claude đã sửa cảnh '+(k+1)+'.');}
      edChanged(true);if(ED.sel===k)edBuildForm();
    }catch(e){toast(sampleMsg(e));b.disabled=false;b.textContent=label;}
    return;}
  if(a==='save'||a==='saveonly'){
    let script;try{script=normScript(ED.draft);}catch(e){toast(e.message);return;}
    const job=ED.job;const L=localOf(job.id);const tpl=ED.tpl;stopPreview(job);edClose();
    if(a==='save'){setJob(job,{script,template:tpl,status:'ready'});queueRender(job);toast('Đã lưu, đang dựng lại.');}
    else{L.dirty=true;setJob(job,{script,template:tpl});toast('Đã lưu. Bấm “Dựng lại” khi muốn xuất video.');}
    return;}
}
function visualPrompt(title,scene,instr){
  const c={type:scene.type,heading:scene.heading,body:scene.body,items:scene.items,formula:scene.formula,narration:scene.narration,visual:scene.visual};
  return `Đây là một cảnh trong video bài giảng tiếng Việt khổ dọc có tiêu đề "${title}".
Cảnh (JSON): ${JSON.stringify(c)}
Yêu cầu của giáo viên về hình minh hoạ: """${instr||'Vẽ hình minh hoạ giúp hiểu nội dung cảnh này nhất.'}"""
${VIS_SPEC}
Trả về DUY NHẤT JSON dạng {"visual": {...}}.`;
}

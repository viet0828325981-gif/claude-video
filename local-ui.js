/* Lớp giao diện riêng của bản local: thêm nút "Chi tiết" vào mỗi thẻ video,
   mở bảng xem toàn bộ quyết định của pipeline (4 trục, skill, lời nhắc, lớp kiểm).
   Không sửa studio.html, chỉ gắn thêm từ ngoài. */
(function(){
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const MUC={chan:['Chặn','var(--warn)'],sua:['Sửa','var(--accent)'],ghi:['Ghi nhận','var(--muted)']};
const TANG={may:'Máy',claude:'Claude'};

const css=`
.xv-btn{border-color:var(--accent-2)}
#xv-truc{gap:6px 14px}
#xv-hd-list{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.xv-hd-item{display:flex;gap:10px;align-items:center;border:1px solid var(--border);border-radius:10px;padding:8px 10px;background:var(--surface-2);font-size:13px}
.xv-hd-item>b{color:var(--muted)}
.xv-hd-item>p{margin:0;flex:1;white-space:pre-wrap;max-height:3.2em;overflow:hidden;line-height:1.6}
.xv-hd-item .xv-meta{color:var(--muted);font-size:12px;white-space:nowrap}
.xv-pair{display:inline-flex;align-items:center;gap:6px}
.xv-chon{display:inline-block}
.xv-chon>summary{list-style:none;cursor:pointer;display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid var(--border);border-radius:9px;background:var(--surface-2);font:600 13px var(--font-ui)}
.xv-chon>summary::-webkit-details-marker{display:none}
.xv-chon>summary:hover{border-color:var(--fg)}
.xv-chon[open]>summary{border-color:var(--fg)}
.xv-cham{color:var(--muted);font-size:15px;line-height:1}
.xv-lg{display:block;margin-top:8px}
.xv-lg textarea{width:100%;margin-top:8px;box-sizing:border-box;font:14px/1.5 var(--font-ui)}
.xv-luoi{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;padding:12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2)}
#xv-truc-hint{flex-basis:100%}
dialog.xv{border:1px solid var(--border);border-radius:14px;padding:0;max-width:min(900px,94vw);width:900px;max-height:88vh;background:var(--surface);color:var(--fg)}
dialog.xv::backdrop{background:rgba(10,12,22,.5)}
.xv-wrap{display:flex;flex-direction:column;max-height:88vh}
.xv-head{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;gap:12px;align-items:flex-start;justify-content:space-between}
.xv-head h2{margin:0 0 4px;font-size:17px}
.xv-head p{margin:0;color:var(--muted);font-size:13px}
.xv-body{overflow:auto;padding:4px 20px 20px}
.xv-sec{margin-top:18px}
.xv-sec>h3{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:0 0 8px}
.xv-chips{display:flex;flex-wrap:wrap;gap:8px}
.xv-chip{border:1px solid var(--border);border-radius:999px;padding:5px 11px;font-size:13px;background:var(--surface-2)}
.xv-chip b{font-weight:600}
.xv-chip span{color:var(--muted)}
.xv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
.xv-stat{border:1px solid var(--border);border-radius:10px;padding:9px 11px;background:var(--surface-2)}
.xv-stat b{display:block;font-size:19px;line-height:1.3}
.xv-stat span{font-size:12px;color:var(--muted)}
table.xv-t{width:100%;border-collapse:collapse;font-size:13px}
table.xv-t th{text-align:left;font-weight:600;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em;padding:6px 8px;border-bottom:1px solid var(--border)}
table.xv-t td{padding:8px;border-bottom:1px solid var(--border);vertical-align:top}
table.xv-t tr:last-child td{border-bottom:0}
.xv-muc{font-weight:600;white-space:nowrap}
.xv-q{color:var(--muted);font-style:italic}
.xv-ok{padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--surface-2);color:var(--muted);font-size:13px}
details.xv-d{border:1px solid var(--border);border-radius:10px;margin-bottom:8px;background:var(--surface-2)}
details.xv-d>summary{padding:9px 12px;cursor:pointer;font-size:13px;font-weight:600}
details.xv-d>div{padding:0 12px 12px}
pre.xv-pre{white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.55;margin:0;font-family:ui-monospace,monospace;color:var(--fg)}
.xv-foot{padding:12px 20px;border-top:1px solid var(--border);display:flex;justify-content:flex-end}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

function secLoi(title,list){
  if(!list)return '';
  if(!list.length)return `<div class="xv-sec"><h3>${esc(title)}</h3><div class="xv-ok">Không phát hiện lỗi nào.</div></div>`;
  const rows=list.map(l=>{
    const [ten,mau]=MUC[l.muc]||MUC.ghi;
    return `<tr>
      <td class="xv-muc" style="color:${mau}">${ten}</td>
      <td>${esc(l.tieu_chi)}${l.nguon?`<br><span class="xv-q">${esc(l.nguon)}</span>`:''}</td>
      <td>${l.canh?'Cảnh '+l.canh:'—'}</td>
      <td>${l.trich_dan?`<span class="xv-q">“${esc(l.trich_dan)}”</span><br>`:''}${esc(l.van_de||'')}${l.de_xuat?`<br>→ ${esc(l.de_xuat)}`:''}</td>
      <td>${TANG[l.tang]||l.tang}</td>
    </tr>`;}).join('');
  return `<div class="xv-sec"><h3>${esc(title)}</h3><table class="xv-t">
    <thead><tr><th>Mức</th><th>Tiêu chí</th><th>Vị trí</th><th>Vấn đề</th><th>Tầng</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

function render(d){
  const t=d.truc||{};
  const tuChon=t.tu_chon||[];
  const chips=[['Thể loại',t.theloai,'theloai'],['Môn học',t.monhoc,'monhoc'],['Dạng bài',t.dangbai,'dangbai'],['Trình độ',t.trinhdo,'trinhdo'],['Phong cách',t.phongcach,'phongcach'],['Lớp',t.lop,'lop']]
    .map(([k,v,id])=>`<span class="xv-chip" title="${tuChon.includes(id)?'Claude tự chọn':'Bạn chọn tay'}"><span>${k}</span> <b>${esc(v||'—')}</b> <span style="font-size:11px">${tuChon.includes(id)?'· Claude':'· bạn'}</span></span>`).join('');
  const ag=d.agent?`<div class="xv-sec"><h3>Agent tự xem lại</h3><div class="xv-ok">
    Chạy <b style="color:var(--fg)">${d.agent.luot}</b> lượt, tự dựng <b style="color:var(--fg)">${d.agent.soAnh}</b> ảnh cảnh ra xem.
    ${d.agent.loiKe?`<br><br>${esc(d.agent.loiKe)}`:''}
    <br><br><span class="xv-q">Ảnh và kịch bản nháp nằm trong ${esc(d.agent.thuMuc||'')}</span></div></div>`:'';
  const g=d.giai_doc_lap;
  const giai=g?`<div class="xv-sec"><h3>Giải độc lập để đối chiếu</h3>${
    g.du_de?`<div class="xv-ok">Đáp số khi giải lại từ đầu, không nhìn kịch bản: <b style="color:var(--fg)">${esc(g.dap_so)}</b>${
      g.cac_buoc&&g.cac_buoc.length?`<br><br>${g.cac_buoc.map((b,i)=>`${i+1}. ${esc(b)}`).join('<br>')}`:''}</div>`
    :'<div class="xv-ok">Yêu cầu không đủ dữ kiện để giải độc lập, nên bỏ qua phép đối chiếu đáp số.</div>'}</div>`:'';
  const skills=(d.skills||[]).map(s=>`<details class="xv-d"><summary>${esc(s.truc_ten)}: ${esc(s.ten)} <span style="font-weight:400;color:var(--muted)">(${esc(s.id)})</span></summary><div>
    <pre class="xv-pre">${esc(s.cach_lam)}</pre>
    ${s.tieu_chi&&s.tieu_chi.length?`<p style="font-size:12px;color:var(--muted);margin:12px 0 4px">Tiêu chí kiểm do skill này đóng góp</p>
      <table class="xv-t"><tbody>${s.tieu_chi.map(c=>{const [ten,mau]=MUC[c.muc]||MUC.ghi;
        return `<tr><td class="xv-muc" style="color:${mau};width:80px">${ten}</td><td>${esc(c.noi_dung)}</td></tr>`;}).join('')}</tbody></table>`:''}
  </div></details>`).join('');
  const calls=(d.calls||[]).map(c=>`<tr><td>${esc(c.label)}</td><td>${esc(c.model)}</td><td>${(c.ms/1000).toFixed(1)}s</td><td>${c.usd?('$'+c.usd.toFixed(4)):'—'}</td></tr>`).join('');

  return `<div class="xv-wrap">
    <div class="xv-head"><div><h2>Chi tiết dựng kịch bản</h2><p>${esc(d.request)}</p></div>
      <button class="btn btn-sm" data-xv="close">Đóng</button></div>
    <div class="xv-body">
      <div class="xv-sec"><h3>Tóm tắt</h3><div class="xv-grid">
        <div class="xv-stat"><b style="color:var(--warn)">${d.con_chan}</b><span>lỗi chặn còn lại</span></div>
        <div class="xv-stat"><b style="color:var(--accent)">${d.con_sua}</b><span>lỗi cần sửa</span></div>
        <div class="xv-stat"><b>${d.con_ghi}</b><span>ghi nhận</span></div>
        <div class="xv-stat"><b>${d.vong_sua}</b><span>vòng tự sửa</span></div>
        <div class="xv-stat"><b>${(d.ms/1000).toFixed(0)}s</b><span>${esc(d.model)} · ${d.che==='ky'?'dựng kỹ':'dựng nhanh'}</span></div>
        <div class="xv-stat"><b>${d.usd?('$'+d.usd.toFixed(3)):'—'}</b><span>chi phí</span></div>
      </div></div>
      <div class="xv-sec"><h3>Trục đã chọn</h3><div class="xv-chips">${chips}</div>
        ${t.ly_do?`<p style="margin:10px 0 0;font-size:13px;color:var(--muted)">${esc(t.ly_do)}</p>`:''}</div>
      ${ag}
      ${giai}
      ${secLoi('Kết quả kiểm'+(d.vong_sua?' (trước khi sửa)':''),d.kiem&&d.kiem.truoc_sua)}
      ${d.kiem&&d.kiem.sau_sua?secLoi('Còn lại sau khi sửa',d.kiem.sau_sua):''}
      <div class="xv-sec"><h3>Skill đã ghép</h3>${skills}</div>
      <div class="xv-sec"><h3>Lời nhắc đã gửi cho Claude</h3>
        <details class="xv-d"><summary>Xem toàn bộ (${(d.loi_nhac||'').length} ký tự)</summary><div><pre class="xv-pre">${esc(d.loi_nhac)}</pre></div></details>
        <details class="xv-d"><summary>Kịch bản Claude trả về lần đầu</summary><div><pre class="xv-pre">${esc(JSON.stringify(d.kich_ban_dau,null,1))}</pre></div></details>
      </div>
      <div class="xv-sec"><h3>Các lượt gọi</h3><table class="xv-t">
        <thead><tr><th>Bước</th><th>Model</th><th>Thời gian</th><th>Chi phí</th></tr></thead><tbody>${calls}</tbody></table></div>
    </div>
    <div class="xv-foot"><button class="btn btn-sm" data-xv="close">Đóng</button></div>
  </div>`;
}

/* Hàng chọn trục trong khu nhập yêu cầu. Để "Claude tự chọn" thì router quyết,
   chọn tay thì trục đó khỏi hỏi Claude. */
const KHOA='xv-truc';
// Phong cách bỏ khỏi ô chọn: chỉ còn một template nên không có gì để chọn.
const COT=[['theloai','Thể loại'],['monhoc','Môn học'],['dangbai','Dạng bài'],['trinhdo','Trình độ']];
let truc={};
try{truc=JSON.parse(localStorage.getItem(KHOA)||'{}');}catch(e){}
// Job do hàng đợi tạo giữ đúng trục lúc xếp hàng, không bị đổi khi người dùng chỉnh ô chọn sau đó.
const trucTheoJob=new Map();
window.__xvTruc=jobId=>({...(jobId&&trucTheoJob.get(jobId)||truc)});
// Chế độ dựng: "nhanh" là một lượt gọi như cũ, "ky" là agent có công cụ, tự dựng ảnh thử rồi tự sửa.
let che='nhanh';
try{che=localStorage.getItem('xv-che')==='ky'?'ky':'nhanh';}catch(e){}
window.__xvChe=()=>che;

function ganChonTruc(ds){
  const hang=document.getElementById('create-btn')&&document.getElementById('create-btn').closest('.row');
  if(!hang||document.getElementById('xv-truc'))return;
  const row=document.createElement('div');row.className='row';row.id='xv-truc';
  const sel=(id,nhan,opts)=>`<span class="xv-pair"><label class="hint" for="xv-${id}">${nhan}</label><select id="xv-${id}" data-truc="${id}">
    <option value="">Claude tự chọn</option>${opts}</select></span>`;
  const o=COT.map(([k,nhan])=>sel(k,nhan,(ds.truc[k]||[]).map(s=>`<option value="${esc(s.id)}" title="${esc(s.mo_ta)}">${esc(s.ten)}</option>`).join('')))
    .join('')+sel('lop','Lớp',Array.from({length:12},(_,i)=>`<option value="${i+1}">Lớp ${i+1}</option>`).join(''));
  // Mặc định thu lại: phần lớn thời gian người dùng để Claude tự chọn hết.
  row.innerHTML=`<details class="xv-chon"><summary><span id="xv-truc-tom"></span><span class="xv-cham">⋮</span></summary>
      <div class="xv-luoi">${o}</div></details>`
    +`<span class="xv-pair"><label class="hint" for="xv-che">Cách dựng</label><select id="xv-che"
        title="Nhanh: một lượt gọi Claude. Kỹ: agent tự dựng ảnh từng cảnh, tự xem rồi tự sửa — lâu và tốn hơn nhiều.">
      <option value="nhanh">Nhanh · một lượt</option><option value="ky">Kỹ · agent tự xem lại</option></select></span>`
    +`<span class="hint" id="xv-truc-hint"></span>`;
  hang.parentNode.insertBefore(row,hang);
  row.querySelectorAll('select[data-truc]').forEach(s=>{
    s.value=truc[s.dataset.truc]||'';
    s.addEventListener('change',()=>{
      truc[s.dataset.truc]=s.value;
      for(const k of Object.keys(truc))if(!truc[k])delete truc[k];
      try{localStorage.setItem(KHOA,JSON.stringify(truc));}catch(e){}
      capNhatHint();
    });
  });
  const cs=document.getElementById('xv-che');
  cs.value=che;
  cs.addEventListener('change',()=>{che=cs.value;try{localStorage.setItem('xv-che',che);}catch(e){}capNhatHint();});
  capNhatHint();
}
// Dòng tóm tắt thay cho bảy ô chọn: chỉ nêu những mục người dùng đã chọn tay.
function capNhatHint(){
  const tom=document.getElementById('xv-truc-tom');
  if(tom){
    const ten=[];
    for(const [k,nhan] of COT) if(truc[k]){
      const o=document.querySelector(`#xv-${k} option[value="${truc[k]}"]`);
      ten.push(o?o.textContent:truc[k]);
    }
    if(truc.lop)ten.push('lớp '+truc.lop);
    tom.textContent=ten.length?ten.join(' · '):'Claude tự chọn hết';
    tom.className=ten.length?'':'xv-q';
  }
  const h=document.getElementById('xv-truc-hint');if(!h)return;
  h.textContent=che==='ky'?'Cách dựng kỹ: agent tự xem lại ảnh từng cảnh, mất vài phút mỗi video.':'';
}


let dlg=null;
function openDetail(id){
  if(!dlg){dlg=document.createElement('dialog');dlg.className='xv';document.body.appendChild(dlg);
    dlg.addEventListener('click',e=>{if(e.target.dataset&&e.target.dataset.xv==='close')dlg.close();});}
  dlg.innerHTML='<div class="xv-wrap"><div class="xv-body"><p style="padding:24px 0">Đang tải…</p></div></div>';
  dlg.showModal();
  fetch('/api/detail/'+encodeURIComponent(id)).then(r=>r.json()).then(({detail})=>{
    dlg.innerHTML=detail?render(detail)
      :`<div class="xv-wrap"><div class="xv-head"><div><h2>Chưa có chi tiết</h2><p>Video này được tạo trước khi bật pipeline, hoặc dùng kịch bản mẫu. Bấm “Viết lại kịch bản” để chạy qua pipeline.</p></div><button class="btn btn-sm" data-xv="close">Đóng</button></div></div>`;
  }).catch(e=>{dlg.innerHTML=`<div class="xv-wrap"><div class="xv-head"><div><h2>Lỗi</h2><p>${esc(e.message)}</p></div><button class="btn btn-sm" data-xv="close">Đóng</button></div></div>`;});
}

// Gắn nút vào thẻ. renderCard ghi đè innerHTML mỗi lần vẽ lại nên phải gắn lại sau mỗi lần.
// <details> không tự đóng khi bấm ra ngoài, nên menu ⋮ sẽ nằm lì trên thẻ.
function dongMenuThe(ev){
  document.querySelectorAll('details.cmenu[open]').forEach(d=>{ if(!d.contains(ev.target)) d.open=false; });
}
document.addEventListener('click',dongMenuThe);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.querySelectorAll('details.cmenu[open]').forEach(d=>d.open=false); });

function ganNut(){
  document.querySelectorAll('.card[data-id]').forEach(card=>{
    // Vào menu ⋮ nếu thẻ có, để khỏi lại bày thêm một nút ra ngoài.
    const act=card.querySelector('.cmenu-pop')||card.querySelector('.actions');
    if(!act||act.querySelector('[data-xv="detail"]'))return;
    const b=document.createElement('button');
    b.className='btn btn-sm xv-btn';b.type='button';b.dataset.xv='detail';b.textContent='Chi tiết';
    b.addEventListener('click',e=>{e.stopPropagation();openDetail(card.dataset.id);});
    act.appendChild(b);
  });
}
// Hiện bước pipeline đang chạy thay cho dòng chờ chung chung.
function tienDo(){
  document.querySelectorAll('.card[data-id]').forEach(card=>{
    const ph=card.querySelector('.stage .ph');
    if(!ph||!/viết kịch bản/i.test(ph.textContent))return;
    fetch('/api/step/'+encodeURIComponent(card.dataset.id)).then(r=>r.json()).then(({step})=>{
      if(step&&card.querySelector('.stage .ph'))card.querySelector('.stage .ph').textContent=step+'…';
    }).catch(()=>{});
  });
}
/* Ô nhập = MỘT yêu cầu. Bản gốc tách theo dòng nên một đề bài nhiều dòng bị xé thành
   nhiều video. Nhiều video thì xếp hàng đợi, chạy lần lượt chứ không song song:
   mỗi video giờ tốn 3 đến 5 lượt gọi Claude, chạy 5 cái cùng lúc sẽ nghẽn. */
const KHOA_HD='xv-hangdoi';
let hangDoi=[];
try{hangDoi=JSON.parse(localStorage.getItem(KHOA_HD)||'[]');}catch(e){}
let dangChay=false;
const luuHD=()=>{try{localStorage.setItem(KHOA_HD,JSON.stringify(hangDoi));}catch(e){}};

function docYeuCau(){return (document.getElementById('prompt-input').value||'').trim();}
function thoiLuong(){return Number(document.getElementById('dur-select').value)||30;}

// Lời giải gốc theo đề. Đăng ký trước khi tạo job vì createJobs chạy runScript ngay lập tức;
// sau đó gắn thẳng vào job để "Viết lại kịch bản" về sau vẫn còn lời giải.
const loiGiaiTheoDe=new Map();
window.__xvLoiGiai=job=>(job&&(job.loiGiaiGoc||loiGiaiTheoDe.get(job.prompt)))||'';
function taoMot(text,duration,trucItem,loiGiai){
  const S=window.__studio.S;
  if(loiGiai)loiGiaiTheoDe.set(text,loiGiai);
  const truoc=new Set(S.jobs.keys());
  const d=document.getElementById('dur-select'),cu=d.value;
  d.value=String(duration);
  try{window.__studio.createJobs([text],false);}finally{d.value=cu;}
  const moi=[...S.jobs.keys()].find(k=>!truoc.has(k));
  if(moi&&trucItem)trucTheoJob.set(moi,trucItem);
  // createJobs đã lưu job lên server TRƯỚC khi có lời giải. Không lưu lại ngay thì lần sau
  // trang nạp job từ server là mất lời giải, và "Viết lại kịch bản" sẽ âm thầm tự giải.
  if(moi&&loiGiai){const j=S.jobs.get(moi);if(j){j.loiGiaiGoc=loiGiai;window.__studio.persist(j);}}
  return moi;
}
async function choXongKichBan(id){
  const S=window.__studio.S,han=Date.now()+20*60000;
  while(Date.now()<han){
    const j=S.jobs.get(id);
    if(!j||(j.status!=='scripting'&&j.status!=='queued'))return;
    await new Promise(r=>setTimeout(r,1500));
  }
}
async function chayHangDoi(){
  if(dangChay)return;
  dangChay=true;veHangDoi();
  try{
    while(hangDoi.length){
      const it=hangDoi[0];
      const id=taoMot(it.text,it.duration,it.truc,it.loiGiai);
      hangDoi.shift();luuHD();veHangDoi();
      if(id)await choXongKichBan(id);
    }
  }finally{dangChay=false;veHangDoi();}
}
function veHangDoi(){
  const box=document.getElementById('xv-hd-list');if(!box)return;
  box.innerHTML=hangDoi.map((it,i)=>{
    const t=COT.filter(([k])=>it.truc[k]).map(([k])=>it.truc[k]).concat(it.truc.lop?['lớp '+it.truc.lop]:[]).join(' · ')||'Claude tự chọn';
    return `<div class="xv-hd-item"><b>${i+1}</b><p>${esc(it.text)}</p>
      <span class="xv-meta">${it.duration}s · ${esc(t)}</span>
      <button class="btn btn-sm" type="button" data-hd="${i}">Bỏ</button></div>`;}).join('');
  const h=document.getElementById('xv-hd-hint');
  if(h)h.textContent=dangChay?`Đang chạy, còn ${hangDoi.length} yêu cầu trong hàng đợi.`
    :hangDoi.length?`${hangDoi.length} yêu cầu đang chờ.`:'';
  const b=document.getElementById('xv-hd-run');
  if(b)b.hidden=dangChay||!hangDoi.length;
}
function docLoiGiai(){const t=document.getElementById('xv-loigiai');return t?t.value.trim():'';}
function xoaLoiGiai(){const t=document.getElementById('xv-loigiai');if(t){t.value='';capNhatLoiGiai();}}
function capNhatLoiGiai(){
  const tom=document.getElementById('xv-lg-tom');if(!tom)return;
  const t=docLoiGiai();
  tom.textContent=t?'Có lời giải của bạn · '+t.split(/\r?\n/).filter(Boolean).length+' dòng · Claude không giải lại':'Lời giải của bạn · không bắt buộc';
  tom.className=t?'':'xv-q';
}
function ganONhap(){
  const ta=document.getElementById('prompt-input'),btn=document.getElementById('create-btn');
  if(!ta||!btn||document.getElementById('xv-hd'))return;
  // Nhân bản để gỡ các listener của bản gốc (tách dòng, đổi nhãn nút).
  const ta2=ta.cloneNode(true);ta.parentNode.replaceChild(ta2,ta);
  const btn2=btn.cloneNode(true);btn.parentNode.replaceChild(btn2,btn);
  btn2.textContent='Tạo video';
  ta2.placeholder='Dán cả đề bài vào đây. Xuống dòng và công thức đều được.\n\nVí dụ: Cho đường tròn (O) và điểm M nằm ngoài đường tròn. Kẻ hai tiếp tuyến MA, MB…';
  // Ô lời giải gốc: có thì Claude không giải lại, chỉ giảng vì sao giải được như vậy.
  const lg=document.createElement('details');lg.className='xv-chon xv-lg';lg.id='xv-lg-wrap';
  lg.innerHTML='<summary><span id="xv-lg-tom">Lời giải của bạn · không bắt buộc</span><span class="xv-cham">⋮</span></summary>'
    +'<textarea id="xv-loigiai" class="field" rows="7" placeholder="Dán lời giải gốc vào đây.\n\nCó lời giải thì Claude không giải lại và không đổi cách giải: chữ trên màn hình lấy đúng lời giải của bạn, còn lời đọc giảng vì sao giải được như vậy."></textarea>';
  ta2.after(lg);
  const lgTa=lg.querySelector('textarea');
  lgTa.addEventListener('input',capNhatLoiGiai);
  const nhan=document.querySelector('label[for="prompt-input"]');
  if(nhan)nhan.textContent='Yêu cầu · cả ô này là MỘT video';
  const hint=document.getElementById('create-hint');
  if(hint)hint.textContent='Muốn nhiều video thì xếp hàng đợi, chúng chạy lần lượt.';

  btn2.addEventListener('click',()=>{
    const t=docYeuCau();
    if(!t){ta2.focus();return;}
    taoMot(t,thoiLuong(),window.__xvTruc(),docLoiGiai());
    ta2.value='';xoaLoiGiai();
  });

  const row=document.createElement('div');row.className='row';row.id='xv-hd';
  row.innerHTML=`<button class="btn btn-sm" type="button" id="xv-hd-add">Thêm vào hàng đợi</button>
    <button class="btn btn-sm" type="button" id="xv-hd-run" hidden>Chạy tiếp</button>
    <span class="hint" id="xv-hd-hint"></span>`;
  const boc=document.createElement('div');boc.id='xv-hd-list';
  btn2.closest('.row').after(row,boc);

  document.getElementById('xv-hd-add').addEventListener('click',()=>{
    const t=docYeuCau();
    if(!t){ta2.focus();return;}
    hangDoi.push({text:t,duration:thoiLuong(),truc:window.__xvTruc(),loiGiai:docLoiGiai()});
    luuHD();ta2.value='';xoaLoiGiai();veHangDoi();chayHangDoi();
  });
  document.getElementById('xv-hd-run').addEventListener('click',chayHangDoi);
  boc.addEventListener('click',e=>{
    const i=e.target.dataset&&e.target.dataset.hd;
    if(i==null)return;
    hangDoi.splice(Number(i),1);luuHD();veHangDoi();
  });
  veHangDoi();
}

// Thời lượng giờ là giới hạn cứng, nên cần thêm mốc dài cho bài phải giảng kỹ.
function themMocThoiLuong(){
  const d=document.getElementById('dur-select');if(!d||d.dataset.xv)return;
  d.dataset.xv='1';
  for(const g of [90,120,180]){
    if([...d.options].some(o=>o.value===String(g)))continue;
    const o=document.createElement('option');o.value=String(g);o.textContent=g+' giây';d.appendChild(o);
  }
}
const start=()=>{
  ganNut();themMocThoiLuong();ganONhap();
  fetch('/api/skills').then(r=>r.json()).then(ganChonTruc).catch(()=>{});
  new MutationObserver(ganNut).observe(document.body,{childList:true,subtree:true});
  setInterval(tienDo,2000);
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

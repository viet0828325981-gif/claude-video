/* Bản local của window.claude: thay các capability của Artifact (sample, db, assets, downloads, mcp)
   bằng lời gọi tới server.mjs chạy trên máy. */
(function(){
const CLIENT=Math.random().toString(36).slice(2)+Date.now().toString(36);
const err=(code,message)=>Object.assign(new Error(message||code),{code});
async function api(method,url,body,headers){
  const r=await fetch(url,{method,body,headers});
  const t=await r.text();let j=null;try{j=t?JSON.parse(t):null;}catch(e){}
  if(!r.ok)throw err((j&&j.code)||('http_'+r.status),(j&&j.message)||t||('HTTP '+r.status));
  return j;
}
const jsonBody=o=>JSON.stringify(o);
const JH={'Content-Type':'application/json'};

/* Nhận ra lượt gọi "viết kịch bản" để server chạy pipeline 4 trục + lớp kiểm,
   thay vì chỉ chuyển tiếp lời nhắc dựng sẵn trong trang. */
const LA_KICH_BAN=/^Bạn là biên kịch và đạo diễn video bài giảng/;
function jobDangViet(prompt){
  try{
    const S=window.__studio&&window.__studio.S;if(!S)return null;
    const c=[...S.jobs.values()].filter(j=>j.status==='scripting'&&j.prompt&&prompt.includes(j.prompt));
    return c.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0))[0]||null;
  }catch(e){return null;}
}
// Sửa cảnh và vẽ hình: trang chỉ gửi một cảnh, nhưng server cần cả kịch bản để giữ liên tục
// hình và canh thời lượng. Lấy ngữ cảnh từ trình sửa cảnh đang mở.
const LA_SUA_CANH=/^Đây là một cảnh trong video bài giảng tiếng Việt có tiêu đề/;
const LA_VE_HINH=/^Đây là một cảnh trong video bài giảng tiếng Việt khổ dọc có tiêu đề/;
function boiCanhCanh(prompt){
  try{
    const ED=window.__studio&&window.__studio.ED;
    if(!ED||!ED.draft||!ED.job||!Array.isArray(ED.draft.scenes))return null;
    // Yêu cầu của giáo viên nằm giữa cặp ba nháy trong lời nhắc trang dựng sẵn.
    const i=prompt.indexOf(String.fromCharCode(34).repeat(3));
    const j=i<0?-1:prompt.indexOf(String.fromCharCode(34).repeat(3),i+3);
    return {script:ED.draft,canh:ED.sel,jobId:ED.job.id,duration:ED.job.duration,
      instr:(j>i&&i>=0)?prompt.slice(i+3,j).trim():"",truc:(window.__xvTruc&&window.__xvTruc(ED.job.id))||{}};
  }catch(e){return null;}
}
const sample={
  async json(prompt,opts){
    const body={prompt,modelTier:opts&&opts.modelTier};
    if(LA_KICH_BAN.test(prompt)){
      const j=jobDangViet(prompt);
      if(j){body.kind='script';body.jobId=j.id;body.request=j.prompt;body.duration=j.duration;
        body.truc=(window.__xvTruc&&window.__xvTruc(j.id))||{};
        body.che=(window.__xvChe&&window.__xvChe())||'nhanh';}
    }
    else if(LA_SUA_CANH.test(prompt)||LA_VE_HINH.test(prompt)){
      const c=boiCanhCanh(prompt);
      if(c){body.kind=LA_VE_HINH.test(prompt)?'hinh':'canh';
        body.script=c.script;body.canh=c.canh;body.jobId=c.jobId;
        body.duration=c.duration;body.instr=c.instr;body.truc=c.truc;}
    }
    const r=await api('POST','/api/sample',jsonBody(body),JH);
    // Lớp kiểm có thể vẫn còn lỗi nặng sau vòng sửa; đừng im lặng giao cảnh hỏng cho giáo viên.
    if(r.loi&&r.loi.length){
      const nang=r.loi.filter(l=>l.muc==='chan'||(l.muc==='sua'&&l.tang==='may'));
      const t=window.__studio&&window.__studio.toast;
      if(nang.length&&t)t('Đã sửa nhưng còn '+nang.length+' lỗi: '+nang.map(l=>(l.canh?'cảnh '+l.canh+' ':'')+l.tieu_chi).join('; '));
    }
    // Phong cách là một trong bốn trục, nên pipeline quyết template, ghi vào job trước khi trang lưu.
    if(r.template&&body.jobId){const j=window.__studio.S.jobs.get(body.jobId);if(j)j.template=r.template;}
    return r.data;
  },
  async text(prompt,opts){
    const r=await api('POST','/api/sample',jsonBody({prompt,modelTier:opts&&opts.modelTier,raw:true}),JH);
    return r.text;
  }
};

function collection(name){
  const base='/api/db/'+encodeURIComponent(name);
  return {
    doc(id){
      const u=base+'/'+encodeURIComponent(id);
      return {
        id,
        set:data=>api('PUT',u,jsonBody({data,client:CLIENT}),JH),
        update:data=>api('PATCH',u,jsonBody({data,client:CLIENT}),JH),
        delete:()=>api('DELETE',u+'?client='+CLIENT),
        async get(){const r=await api('GET',u);return {id,exists:!!r.data,data:()=>r.data};}
      };
    },
    onSnapshot(cb,onErr){
      const es=new EventSource(base+'/stream?client='+CLIENT);
      es.onmessage=ev=>{
        let m;try{m=JSON.parse(ev.data);}catch(e){return;}
        if(m.origin===CLIENT)return;
        const changes=m.changes.map(c=>({type:c.type,doc:{id:c.id,data:()=>c.data,metadata:{hasPendingWrites:false}}}));
        try{cb({docChanges:()=>changes,size:changes.length});}catch(e){console.error(e);}
      };
      let failed=0;
      es.onerror=()=>{if(++failed>20&&onErr){onErr(err('disconnected','Mất kết nối server'));es.close();}};
      es.onopen=()=>{failed=0;};
      return ()=>es.close();
    }
  };
}
const db={collection};

const assets={
  async upload(blob,opts){
    const type=(opts&&opts.type)||blob.type||'application/octet-stream';
    return api('POST','/api/assets',blob,{'Content-Type':type});
  },
  delete:id=>api('DELETE','/api/assets/'+encodeURIComponent(id)),
  url:id=>'/_blob/'+id
};

const downloads={
  async save({filename,data}){
    const blob=data instanceof Blob?data:new Blob([data]);
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename||'video';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    return {ok:true};
  }
};

/* Trang gọi mcp.callTool('Claude Code Remote','fire_trigger',...) để xin giọng đọc.
   Ở bản local, lời gọi này chạy thẳng bộ đọc VieNeu trên máy. */
const mcp={
  async callTool(server,tool,args){
    if(tool==='fire_trigger')return api('POST','/api/tts/run',jsonBody(args||{}),JH);
    throw err('not_in_manifest','Công cụ '+tool+' không có ở bản local');
  }
};

const caps={sample,db,assets,downloads,mcp};
window.claude={use:async name=>{if(!(name in caps))throw err('unknown_capability',name);return caps[name];}};
})();

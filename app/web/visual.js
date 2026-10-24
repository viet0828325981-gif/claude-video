/* ---------------- content visuals ----------------
   A scene's illustration is CONTENT, written by Claude in the script as `visual`:
   {view:[w,h], els:[...]} in its own coordinate box (y down). Templates only decide HOW it is drawn
   (stroke, colours, font, motion) through a style object; they never add pictures of their own. */
const VIS_COLORS=['ink','muted','a1','a2','a3'];
const VIS_FILLS=['none','soft','a1','a2','a3'];
function normPt(p,vw,vh){if(!Array.isArray(p)||p.length<2)return null;const x=Number(p[0]),y=Number(p[1]);if(!isFinite(x)||!isFinite(y))return null;return [Math.max(-5,Math.min(vw+5,x)),Math.max(-5,Math.min(vh+5,y))];}
function normVisual(v){
  if(!v||typeof v!=='object'||!Array.isArray(v.els))return null;
  const view=Array.isArray(v.view)?v.view:[100,100];
  const vw=Math.max(20,Math.min(200,Number(view[0])||100)),vh=Math.max(20,Math.min(200,Number(view[1])||100));
  const col=c=>VIS_COLORS.includes(c)?c:'ink',fil=c=>VIS_FILLS.includes(c)?c:'none';
  const els=[];
  for(const e of v.els.slice(0,28)){
    if(!e||typeof e!=='object')continue;const t=e.t;
    if(t==='line'){const p=(Array.isArray(e.p)?e.p:[]).slice(0,40).map(q=>normPt(q,vw,vh)).filter(Boolean);if(p.length>=2)els.push({t,p,c:col(e.c),arrow:!!e.arrow,dash:!!e.dash});}
    else if(t==='poly'){const p=(Array.isArray(e.p)?e.p:[]).slice(0,40).map(q=>normPt(q,vw,vh)).filter(Boolean);if(p.length>=3)els.push({t,p,c:col(e.c),fill:fil(e.fill)});}
    else if(t==='circle'){const at=normPt(e.at,vw,vh);const r=Math.max(1,Math.min(Math.max(vw,vh),Number(e.r)||10));if(at)els.push({t,at,r,c:col(e.c),fill:fil(e.fill)});}
    else if(t==='rect'){const at=normPt(e.at,vw,vh);const wh=Array.isArray(e.wh)?[Math.max(1,Math.min(vw,Number(e.wh[0])||10)),Math.max(1,Math.min(vh,Number(e.wh[1])||10))]:null;if(at&&wh)els.push({t,at,wh,c:col(e.c),fill:fil(e.fill)});}
    else if(t==='dot'){const at=normPt(e.at,vw,vh);if(at)els.push({t,at,c:col(e.c)});}
    else if(t==='text'){const at=normPt(e.at,vw,vh);const s=cut(e.s,40);if(at&&s)els.push({t,at,s,size:[1,2,3].includes(Number(e.size))?Number(e.size):2,c:col(e.c),align:['l','c','r'].includes(e.align)?e.align:'c'});}
    else if(t==='table'){const at=normPt(e.at,vw,vh);const wh=Array.isArray(e.wh)?[Math.max(10,Math.min(vw,Number(e.wh[0])||60)),Math.max(10,Math.min(vh,Number(e.wh[1])||40))]:null;
      const rows=(Array.isArray(e.rows)?e.rows:[]).slice(0,7).map(r=>(Array.isArray(r)?r:[]).slice(0,5).map(c=>cut(c,16)));
      if(at&&wh&&rows.length&&rows[0].length)els.push({t,at,wh,rows,head:e.head!==false,c:col(e.c)});}
  }
  return els.length?{view:[vw,vh],els}:null;
}
function partialPts(pts,p,closed){
  const n=pts.length;if(p<=0||n<2)return [];const segs=n-1+(closed?1:0);
  let L=0;for(let i=1;i<=segs;i++){const a=pts[i-1],b=pts[i%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1]);}
  let left=L*clamp01(p);const out=[pts[0]];
  for(let i=1;i<=segs&&left>0;i++){const a=pts[i-1],b=pts[i%n];const d=Math.hypot(b[0]-a[0],b[1]-a[1])||1e-6;const k=Math.min(1,left/d);out.push([a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k]);left-=d;}
  return out;
}
function visCirclePts(cx,cy,r,n){const o=[];for(let i=0;i<n;i++){const a=-Math.PI/2+i/n*Math.PI*2;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;}
/* style: {stroke(ctx,pts,color,lw,closedDone), col:{ink,muted,a1,a2,a3}, fill:{soft,a1,a2,a3}, lw, font(weight,size), text(ctx,str,x,y,color,p,align), glow} */
function drawVis(ctx,f,vis,box,t0,st){
  if(!vis||!vis.els||box.w<80||box.h<80)return false;
  const lt=f.lt;if(lt<t0)return true;f.cue('visual',t0,'vis');
  const [vw,vh]=vis.view;const sc=Math.min(box.w/vw,box.h/vh);const ox=box.x+(box.w-vw*sc)/2,oy=box.y+(box.h-vh*sc)/2;
  const P=q=>[ox+q[0]*sc,oy+q[1]*sc];
  const n=vis.els.length;const span=Math.max(.6,Math.min(2.4,(f.dur-t0-.8)));const stag=Math.min(.32,span/n);const dd=Math.min(.55,Math.max(.25,stag*1.6));
  const lw=st.lw*Math.max(.7,Math.min(1.3,sc/5));
  vis.els.forEach((e,k)=>{
    const a=t0+k*stag;const p=prog(lt,a,a+dd);if(p<=0)return;const fp=prog(lt,a+dd*.7,a+dd*1.5);
    const C=st.col[e.c]||st.col.ink;
    if(e.t==='line'){const pts=e.p.map(P);const pp=partialPts(pts,E.inOut(p),false);
      if(e.dash)ctx.setLineDash([lw*3,lw*2.5]);st.stroke(ctx,pp,C,lw,false);ctx.setLineDash([]);
      if(e.arrow&&p>=1){const b=pts[pts.length-1],a2=pts[pts.length-2];const ang=Math.atan2(b[1]-a2[1],b[0]-a2[0]);const hl=lw*5;
        st.stroke(ctx,[[b[0]-Math.cos(ang-.45)*hl,b[1]-Math.sin(ang-.45)*hl],b,[b[0]-Math.cos(ang+.45)*hl,b[1]-Math.sin(ang+.45)*hl]],C,lw,false);}}
    else if(e.t==='poly'||e.t==='rect'||e.t==='circle'){
      const pts=e.t==='poly'?e.p.map(P):e.t==='rect'?[[e.at[0],e.at[1]],[e.at[0]+e.wh[0],e.at[1]],[e.at[0]+e.wh[0],e.at[1]+e.wh[1]],[e.at[0],e.at[1]+e.wh[1]]].map(P)
        :visCirclePts(e.at[0],e.at[1],e.r,72).map(P);
      if(e.fill!=='none'&&fp>0){ctx.save();ctx.globalAlpha*=fp;ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=st.fill[e.fill]||st.fill.soft;ctx.fill();ctx.restore();}
      st.stroke(ctx,partialPts(pts,E.inOut(p),true),C,lw,p>=1);}
    else if(e.t==='dot'){const q=P(e.at);ctx.save();ctx.globalAlpha*=p;ctx.fillStyle=C;ctx.beginPath();ctx.arc(q[0],q[1],lw*1.8*E.back(p),0,Math.PI*2);ctx.fill();ctx.restore();}
    else if(e.t==='text'){const q=P(e.at);const px=Math.round(sc*[0,4.2,5.6,8][e.size]);st.text(ctx,e.s,q[0],q[1],C,p,e.align,Math.max(18,Math.min(96,px)),e.size===3?700:500);}
    else if(e.t==='table'){
      const [x0,y0]=P(e.at);const tw=e.wh[0]*sc,th=e.wh[1]*sc;const R=e.rows.length,Cn=Math.max(...e.rows.map(r=>r.length));const rh=th/R,cw=tw/Cn;
      const gp=E.inOut(p);
      for(let i=0;i<=R;i++)st.stroke(ctx,partialPts([[x0,y0+i*rh],[x0+tw,y0+i*rh]],gp,false),i===1&&e.head?C:st.col.muted,i===1&&e.head?lw:lw*.6,false);
      for(let j=0;j<=Cn;j++)st.stroke(ctx,partialPts([[x0+j*cw,y0],[x0+j*cw,y0+th]],gp,false),st.col.muted,lw*.6,false);
      const fs=Math.max(18,Math.min(44,Math.min(rh*.5,cw*.32)));
      e.rows.forEach((r,i)=>r.forEach((c,j)=>{const cp=prog(lt,a+dd*.6+(i*Cn+j)*.04,a+dd*.6+(i*Cn+j)*.04+.3);
        st.text(ctx,c,x0+j*cw+cw/2,y0+i*rh+rh/2+fs*.35,i===0&&e.head?st.col.ink:st.col.muted,cp,'c',fs,i===0&&e.head?700:500);}));
    }
  });
  return true;
}
/* shared style builders */
function lineStroker(glow){return (ctx,pts,color,lw)=>{if(pts.length<2)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.lineCap='round';
  if(glow){ctx.shadowColor=color;ctx.shadowBlur=glow;}ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.stroke();ctx.restore();};}
function fadeText(fam){return (ctx,str,x,y,color,p,align,size,weight)=>{if(p<=0)return;ctx.save();ctx.globalAlpha*=clamp01(p);font(ctx,weight||500,size,fam);ctx.fillStyle=color;
  ctx.textAlign=align==='l'?'left':align==='r'?'right':'center';ctx.fillText(str,x,y+(1-E.out(clamp01(p)))*8);ctx.restore();};}
function visBelow(ctx,f,vis,top,bottom,left,right,t0,st){if(!vis)return;const h=bottom-top;if(h<150)return;drawVis(ctx,f,vis,{x:left,y:top,w:right-left,h},t0,st);}

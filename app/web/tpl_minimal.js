/* ================= TEMPLATE 4: Tối giản (nét trắng trên nền đen) ================= */
const MN={bg:'#030303',ink:'#f2f2f2',soft:'#a3a3a3',dim:'#5c5c5c',line:'rgba(242,242,242,.9)',fill:'rgba(255,255,255,.11)',
  blue:'rgba(64,96,150,.85)',green:'rgba(66,112,74,.85)',ok:'#7fd19b',bad:'#ef8a8a'};
function pathLen(pts,closed){let L=0;const n=pts.length;for(let i=1;i<n+(closed?1:0);i++){const a=pts[i-1],b=pts[i%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1]);}return L;}
function drawPath(ctx,pts,p,closed,lw,col){
  if(p<=0||pts.length<2)return;const n=pts.length;const segs=n-1+(closed?1:0);const L=pathLen(pts,closed);let left=L*clamp01(p);
  ctx.save();ctx.strokeStyle=col||MN.line;ctx.lineWidth=lw||2.5;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);
  for(let i=1;i<=segs&&left>0;i++){const a=pts[i-1],b=pts[i%n];const d=Math.hypot(b[0]-a[0],b[1]-a[1]);const k=Math.min(1,left/d);ctx.lineTo(a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k);left-=d;}
  ctx.stroke();ctx.restore();
}
function fillPoly(ctx,pts,a,col){if(a<=0)return;ctx.save();ctx.globalAlpha*=clamp01(a);ctx.beginPath();pts.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();ctx.fillStyle=col||MN.fill;ctx.fill();ctx.restore();}
function circlePts(cx,cy,r,n,a0){const o=[];for(let i=0;i<n;i++){const a=(a0||-Math.PI/2)+i/n*Math.PI*2;o.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r]);}return o;}
function annEllipse(ctx,cx,cy,rx,ry,p){ // hand-drawn circling, ~1.1 turns with drift
  if(p<=0)return;const N=90,turns=1.12;const pts=[];
  for(let i=0;i<=N*clamp01(p);i++){const t=i/N*turns*Math.PI*2-2.2;const w=1+.05*Math.sin(t*1.7)+.03*(i/N);pts.push([cx+Math.cos(t)*rx*w,cy+Math.sin(t)*ry*w+(i/N)*4]);}
  drawPath(ctx,pts,1,false,2.4,MN.ink);
}
function textLines(ctx,lines,x,y,lh,col,a,align){if(a<=0)return;ctx.save();ctx.globalAlpha*=clamp01(a);ctx.fillStyle=col;ctx.textAlign=align||'center';lines.forEach((l,k)=>ctx.fillText(l,x,y+k*lh));ctx.restore();}
/* line figures, drawn on with p (0..1) then filled */
function mnFigure(ctx,kind,cx,cy,s,p){
  const dp=E.inOut(clamp01(p/0.75)),fa=prog(p,.65,1);const h=s/2;
  const tri=(a,b,c)=>[a,b,c];
  switch(kind){
    case 'shapes':{ // right triangle with squares on its sides
      const A=[cx-h*.35,cy+h*.05],B=[cx+h*.35,cy+h*.05],C=[cx-h*.35,cy-h*.45];
      const sqB=[A,B,[B[0],B[1]+h*.7],[A[0],A[1]+h*.7]];
      const sqL=[A,C,[C[0]-h*.5,C[1]],[A[0]-h*.5,A[1]]];
      const dx=B[0]-C[0],dy=B[1]-C[1];const sqH=[C,B,[B[0]+dy,B[1]-dx],[C[0]+dy,C[1]-dx]];
      fillPoly(ctx,sqB,fa,MN.fill);fillPoly(ctx,sqL,fa,MN.blue);fillPoly(ctx,sqH,fa,MN.green);fillPoly(ctx,[A,B,C],fa*1.4);
      drawPath(ctx,[A,B,C],dp*1.6,true);drawPath(ctx,sqB,dp*1.3-.2,true);drawPath(ctx,sqL,dp*1.3-.3,true);drawPath(ctx,sqH,dp*1.3-.3,true);break;}
    case 'sigma':{ // square split into two squares and two rectangles with diagonals
      const x0=cx-h*.75,y0=cy-h*.75,S=h*1.5,m=S*.4;const sq=[[x0,y0],[x0+S,y0],[x0+S,y0+S],[x0,y0+S]];
      fillPoly(ctx,[[x0,y0],[x0+m,y0],[x0+m,y0+m],[x0,y0+m]],fa,MN.blue);fillPoly(ctx,[[x0+m,y0+m],[x0+S,y0+m],[x0+S,y0+S],[x0+m,y0+S]],fa,MN.green);
      drawPath(ctx,sq,dp*1.4,true);drawPath(ctx,[[x0+m,y0],[x0+m,y0+S]],dp*1.5-.4,false);drawPath(ctx,[[x0,y0+m],[x0+S,y0+m]],dp*1.5-.45,false);
      drawPath(ctx,[[x0+m,y0],[x0+S,y0+m]],dp*1.6-.6,false,1.6);drawPath(ctx,[[x0,y0+m],[x0+m,y0+S]],dp*1.6-.6,false,1.6);break;}
    case 'question':{
      const T=[[cx-h*.7,cy+h*.45],[cx+h*.1,cy+h*.45],[cx-h*.7,cy-h*.55]];fillPoly(ctx,T,fa);drawPath(ctx,T,dp,true);
      font(ctx,700,Math.round(s*.42),BV);textLines(ctx,['?'],cx+h*.55,cy+h*.1,0,MN.ink,fa,'center');break;}
    case 'lightbulb':{ // circle with inscribed right triangle (Thales)
      const r=h*.75;const c=circlePts(cx,cy,r,72,Math.PI);const A=[cx-r,cy],B=[cx+r,cy],P=[cx+r*Math.cos(-2.2),cy+r*Math.sin(-2.2)];
      fillPoly(ctx,[A,P,B],fa);drawPath(ctx,c,dp*1.3,true);drawPath(ctx,[A,P,B],dp*1.5-.45,false);drawPath(ctx,[A,B],dp*1.5-.5,false,1.6);break;}
    case 'check':{const x0=cx-h*.7,y0=cy-h*.7,S=h*1.4;const sq=[[x0,y0],[x0+S,y0],[x0+S,y0+S],[x0,y0+S]];
      fillPoly(ctx,[[x0,y0+S],[x0+S,y0+S],[x0+S,y0]],fa);drawPath(ctx,sq,dp*1.3,true);drawPath(ctx,[[x0,y0+S],[x0+S,y0]],dp*1.5-.5,false);break;}
    case 'cross':{const a=circlePts(cx-h*.18,cy,h*.6,4,Math.PI/4),b=circlePts(cx+h*.18,cy,h*.6,4,0);
      fillPoly(ctx,a,fa);fillPoly(ctx,b,fa*.8,MN.blue);drawPath(ctx,a,dp*1.3,true);drawPath(ctx,b,dp*1.3-.3,true);break;}
    case 'book':{ // wireframe cube
      const S=h*.95,o=S*.42;const f=[[cx-S/2-o/2,cy-S/2+o/2],[cx+S/2-o/2,cy-S/2+o/2],[cx+S/2-o/2,cy+S/2+o/2],[cx-S/2-o/2,cy+S/2+o/2]];
      const bk=f.map(q=>[q[0]+o,q[1]-o]);fillPoly(ctx,f,fa*.8);
      drawPath(ctx,f,dp*1.3,true);drawPath(ctx,bk,dp*1.3-.25,true,1.6,'rgba(242,242,242,.55)');for(let i=0;i<4;i++)drawPath(ctx,[f[i],bk[i]],dp*1.6-.6,false,1.6);break;}
    case 'target':default:{
      [0.75,0.48,0.2].forEach((k,i)=>drawPath(ctx,circlePts(cx,cy,h*k,64),dp*1.3-i*.15,true,i===2?2.5:2));
      drawPath(ctx,[[cx,cy],[cx+h*.75,cy]],dp*1.5-.5,false,1.6);fillPoly(ctx,circlePts(cx,cy,h*.2,32),fa*1.5);}
  }
}
function mnBox(ctx,x,y,w,h,p,col){drawPath(ctx,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],p,true,2,col||MN.line);}
function mnTag(ctx,txt,x,y,col,p){if(p<=0)return;font(ctx,600,22,BV);const w=ctx.measureText(txt).width+26;mnBox(ctx,x-w,y-21,w,42,E.out(p),col);
  ctx.save();ctx.globalAlpha*=prog(p,.4,1);ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(txt,x-w/2,y+8);ctx.restore();}
function mnToolbar(ctx,x,y,a,sel){ // tiny drawing-tool palette
  if(a<=0)return;ctx.save();ctx.globalAlpha*=a;rr(ctx,x-130,y-24,260,48,10);ctx.fillStyle='#1a1a1a';ctx.fill();ctx.strokeStyle='#2c2c2c';ctx.lineWidth=1.5;ctx.stroke();
  for(let i=0;i<5;i++){const cx=x-104+i*52;if(i===sel){rr(ctx,cx-17,y-17,34,34,7);ctx.fillStyle='#3a3a3a';ctx.fill();}
    ctx.strokeStyle='#cfcfcf';ctx.lineWidth=1.8;ctx.beginPath();
    if(i===0){ctx.moveTo(cx-8,y);ctx.lineTo(cx+8,y);ctx.moveTo(cx,y-8);ctx.lineTo(cx,y+8);}
    else if(i===1)ctx.rect(cx-8,y-7,16,14);else if(i===2)ctx.ellipse(cx,y,9,7,0,0,Math.PI*2);
    else if(i===3){ctx.moveTo(cx-7,y+8);ctx.lineTo(cx+7,y-8);ctx.moveTo(cx-7,y+8);ctx.lineTo(cx-8,y+3);}
    else{ctx.moveTo(cx-7,y-8);ctx.lineTo(cx+7,y-8);ctx.moveTo(cx,y-8);ctx.lineTo(cx,y+8);}
    ctx.stroke();}
  ctx.restore();
}
function mnCursor(ctx,x,y,a){if(a<=0)return;ctx.save();ctx.globalAlpha*=a;ctx.translate(x,y);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,26);ctx.lineTo(7,20);ctx.lineTo(12,31);ctx.lineTo(17,29);ctx.lineTo(12,18);ctx.lineTo(21,18);ctx.closePath();
  ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}
const minimalTpl={
  key:'minimal',name:'Tối giản',desc:'Nét trắng trên nền đen, hình vẽ dần. Âm: nền ambient, click, tiếng vẽ, chuông',gl:false,
  sfx:{intro:['m_boom',.55],scene:['m_thump',.32],click:['m_click',.55],draw:['m_ratchet',.4],title:null,heading:null,
    item:['m_tok',.32],true:['m_chime',.3],false:['m_low',.38],formula:['m_ratchet',.4],chime:['m_chime',.28]},
  music:['m_ambient',.2],
  bg(ctx){ctx.fillStyle=MN.bg;ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(W/2,H*.45,60,W/2,H*.45,H*.75);g.addColorStop(0,'rgba(255,255,255,.035)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);},
  scene(ctx,rt,f){
    const s=f.s,MW=W-150;let lt=f.lt;ctx.textBaseline='alphabetic';
    if(s.type==='title'){
      // toolbar + cursor drags a square, then the title appears under it; compressed when the scene is short
      const sc=Math.min(1,Math.max(.45,(f.dur-.7)/3.4));const lt=f.lt/sc;const f0=f;f={...f0,cue:(e,at,k)=>f0.cue(e,at*sc,k)};
      const tbA=prog(lt,0,.35)*(1-prog(lt,2.1,2.5));mnToolbar(ctx,W/2,150,tbA,lt>.8?1:-1);
      const p0=[W/2+40,150],sq0=[W/2-150,300],sq1=[W/2+150,600];let cx,cy;
      if(lt<.8){const k=E.inOut(prog(lt,.25,.75));cx=W/2+160+(p0[0]-W/2-160)*k;cy=360+(p0[1]-360)*k;}
      else if(lt<1.1){const k=E.inOut(prog(lt,.85,1.1));cx=p0[0]+(sq0[0]-p0[0])*k;cy=p0[1]+(sq0[1]-p0[1])*k;}
      else{const k=E.inOut(prog(lt,1.15,1.95));cx=sq0[0]+(sq1[0]-sq0[0])*k;cy=sq0[1]+(sq1[1]-sq0[1])*k;}
      f.cue('click',.8,'c1');f.cue('draw',1.15,'d1');
      if(lt>1.15){const x1=Math.max(sq0[0]+2,cx),y1=Math.max(sq0[1]+2,cy);const pts=[[sq0[0],sq0[1]],[x1,sq0[1]],[x1,y1],[sq0[0],y1]];
        fillPoly(ctx,pts,prog(lt,1.9,2.4)*.9);drawPath(ctx,pts,1,true,2.2);
        const corners=prog(lt,1.15,1.3)*(1-prog(lt,2.0,2.3));if(corners>0){ctx.save();ctx.globalAlpha*=corners;ctx.fillStyle=MN.ink;pts.forEach(q=>{ctx.fillRect(q[0]-4,q[1]-4,8,8);});ctx.restore();}}
      mnFigure(ctx,s.icon,W/2,450,230,prog(lt,2.1,3.2));if(lt>2.1)f.cue('draw',2.1,'d2');
      mnCursor(ctx,cx,cy,prog(lt,.15,.35)*(1-prog(lt,2.0,2.3)));
      const h=fit(ctx,s.heading,MW,3,600,BV,70,46);font(ctx,600,h.size,BV);const hy=740;
      textLines(ctx,h.lines,W/2,hy,h.size*1.15,MN.ink,prog(lt,2.3,2.9));
      const b=fit(ctx,s.body,MW,3,400,BV,36,28);font(ctx,400,b.size,BV);textLines(ctx,b.lines,W/2,hy+h.lines.length*h.size*1.15+40,b.size*1.4,MN.soft,prog(lt,2.8,3.4));
      return;
    }
    const h=fit(ctx,s.heading,MW,2,600,BV,40,30);font(ctx,600,h.size,BV);textLines(ctx,h.lines,W/2,170,h.size*1.2,MN.ink,prog(lt,.1,.5));
    if(s.type==='point'){
      f.cue('draw',.35,'d');mnFigure(ctx,s.icon,W/2,470,300,prog(lt,.35,1.45));
      const b=fit(ctx,s.body,MW,6,400,BV,40,30);font(ctx,400,b.size,BV);
      b.lines.forEach((l,k)=>textLines(ctx,[l],W/2,760+k*b.size*1.45,0,k?MN.soft:MN.ink,prog(lt,1.2+k*.25,1.7+k*.25)));
      return;
    }
    if(s.type==='formula'){
      const fm=fitF(ctx,s.formula,MW-40,600,BV,72,40);font(ctx,600,fm.size,BV);const lh=fm.size*1.2;const by=430;
      textLines(ctx,fm.lines,W/2,by,lh,MN.ink,prog(lt,.3,.8));
      const wmax=Math.max(...fm.lines.map(l=>ctx.measureText(l).width));const bx=W/2-wmax/2-34,bw=wmax+68,bt=by-fm.size-24,bh=lh*(fm.lines.length-1)+fm.size+52;
      f.cue('formula',.9,'f');mnBox(ctx,bx,bt,bw,bh,E.inOut(prog(lt,.9,1.65)));
      f.cue('chime',1.7,'ch');annEllipse(ctx,W/2,bt+bh/2,bw/2+30,bh/2+34,E.out(prog(lt,1.7,2.3))*(1-prog(lt,f.dur-1.2,f.dur-.6)));
      mnFigure(ctx,s.icon==='sigma'?'shapes':s.icon,W/2,bt+bh+250,230,prog(lt,2.0,3.0));if(lt>2)f.cue('draw',2.0,'d');
      const b=fit(ctx,s.body,MW,3,400,BV,36,28);font(ctx,400,b.size,BV);textLines(ctx,b.lines,W/2,bt+bh+460,b.size*1.4,MN.soft,prog(lt,2.4,3.0));
      return;
    }
    let y=300;
    if(s.body){const b=fit(ctx,s.body,MW,2,400,BV,34,28);font(ctx,400,b.size,BV);textLines(ctx,b.lines,W/2,y,b.size*1.35,MN.soft,prog(lt,.4,.9));y+=b.lines.length*b.size*1.35+40;}
    const n=s.items.length||1;const slot=Math.max(.5,(f.dur-1.6)/n);const L=90,R=W-90;
    s.items.forEach((it,k)=>{
      const t1=.8+k*slot;if(lt<t1)return;f.cue('item',t1,'i'+k);
      const t=fit(ctx,it.text,R-L-(it.mark!=='none'?190:60),3,400,BV,38,28);font(ctx,400,t.size,BV);const lh=t.size*1.35;const rowH=Math.max(70,t.lines.length*lh+34);
      const p=prog(lt,t1,t1+.45);
      drawPath(ctx,[[L,y],[R,y]],E.inOut(p),false,1.2,'rgba(242,242,242,.25)');
      if(s.type==='summary'){ctx.save();ctx.globalAlpha*=p;ctx.fillStyle=MN.ink;font(ctx,500,22,MONO);ctx.textAlign='left';ctx.fillText(String(k+1).padStart(2,'0'),L,y+rowH/2+8);ctx.restore();}
      else{mnBox(ctx,L+2,y+rowH/2-9,18,18,p);}
      ctx.save();ctx.globalAlpha*=prog(lt,t1+.1,t1+.5);ctx.fillStyle=MN.ink;ctx.textAlign='left';font(ctx,400,t.size,BV);
      t.lines.forEach((l,li)=>ctx.fillText(l,L+50,y+rowH/2-(t.lines.length-1)*lh/2+t.size*.35+li*lh));ctx.restore();
      if(it.mark!=='none'){const tm=t1+Math.min(slot*.55,1.2);f.cue(it.mark,tm,'m'+k);mnTag(ctx,MARK_TXT[it.mark],R,y+rowH/2,it.mark==='true'?MN.ok:MN.bad,prog(lt,tm,tm+.5));}
      y+=rowH;
      if(k===n-1)drawPath(ctx,[[L,y],[R,y]],E.inOut(p),false,1.2,'rgba(242,242,242,.25)');
    });
    if(y<H-420){const fy=Math.min(H-300,y+(H-200-y)/2);mnFigure(ctx,s.icon,W/2,fy,Math.min(240,H-200-y-40),prog(lt,.4,1.6));if(lt>.4)f.cue('draw',.4,'d');}
  },
  chrome(ctx,rt,f){
    font(ctx,500,20,MONO);ctx.textAlign='right';ctx.fillStyle=MN.dim;ctx.fillText(String(f.i+1).padStart(2,'0')+' / '+String(f.count).padStart(2,'0'),W-60,80);
    ctx.textAlign='left';font(ctx,500,20,BV);ctx.fillText(cut(f.title,30),60,80);
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(60,H-70,W-120,2);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(60,H-70,(W-120)*clamp01(f.t/f.total),2);
  }
};

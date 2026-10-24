  scene(ctx,rt,f){
    const s=f.s,MW=W-150,VS=MN_VS;ctx.textBaseline='alphabetic';
    if(s.type==='title'){
      // style intro: tool palette + cursor drags a frame; the title is written inside it
      const sc=Math.min(1,Math.max(.45,(f.dur-.7)/3.4));const lt=f.lt/sc;const f0=f;f={...f0,lt,cue:(e,at,k)=>f0.cue(e,at*sc,k)};
      const h=fit(ctx,s.heading,MW-80,3,600,BV,68,44);const b=fit(ctx,s.body,MW-80,3,400,BV,34,26);
      const hh=h.lines.length*h.size*1.15,bh=s.body?b.lines.length*b.size*1.4+24:0;const boxH=hh+bh+90;
      const top=s.visual?Math.min(H-260-boxH,760):Math.round((H-boxH)/2-20);const x0=75,x1=W-75,y0=top,y1=top+boxH;
      mnToolbar(ctx,W/2,150,prog(lt,0,.35)*(1-prog(lt,2.1,2.5)),lt>.8?1:-1);
      const tool=[W/2-52,150];let cx,cy;
      if(lt<.8){const k=E.inOut(prog(lt,.25,.75));cx=W/2+170+(tool[0]-W/2-170)*k;cy=380+(tool[1]-380)*k;}
      else if(lt<1.1){const k=E.inOut(prog(lt,.85,1.1));cx=tool[0]+(x0-tool[0])*k;cy=tool[1]+(y0-tool[1])*k;}
      else{const k=E.inOut(prog(lt,1.15,1.95));cx=x0+(x1-x0)*k;cy=y0+(y1-y0)*k;}
      f.cue('click',.8,'c1');f.cue('draw',1.15,'d1');
      if(lt>1.15){const xe=Math.max(x0+2,cx),ye=Math.max(y0+2,cy);const pts=[[x0,y0],[xe,y0],[xe,ye],[x0,ye]];
        fillPoly(ctx,pts,prog(lt,1.9,2.4)*.6);drawPath(ctx,pts,1,true,2.2);
        const hd=prog(lt,1.15,1.3)*(1-prog(lt,2.0,2.3));if(hd>0){ctx.save();ctx.globalAlpha*=hd;ctx.fillStyle=MN.ink;pts.forEach(q=>ctx.fillRect(q[0]-4,q[1]-4,8,8));ctx.restore();}}
      mnCursor(ctx,cx,cy,prog(lt,.15,.35)*(1-prog(lt,2.0,2.3)));
      font(ctx,600,h.size,BV);textLines(ctx,h.lines,W/2,y0+45+h.size*.85,h.size*1.15,MN.ink,prog(lt,2.0,2.5));
      if(s.body){font(ctx,400,b.size,BV);textLines(ctx,b.lines,W/2,y0+45+hh+24+b.size*.8,b.size*1.4,MN.soft,prog(lt,2.4,2.9));}
      if(s.visual)drawVis(ctx,f,s.visual,{x:75,y:230,w:W-150,h:y0-290},2.2,VS);
      return;
    }
    const lt=f.lt;
    const h=fit(ctx,s.heading,MW,2,600,BV,40,30);font(ctx,600,h.size,BV);textLines(ctx,h.lines,W/2,170,h.size*1.2,MN.ink,prog(lt,.1,.5));
    const top=170+h.lines.length*h.size*1.2+40;
    if(s.type==='point'){
      const b=fit(ctx,s.body,MW,7,400,BV,40,30);font(ctx,400,b.size,BV);const lh=b.size*1.45;
      let by;
      if(s.visual){drawVis(ctx,f,s.visual,{x:75,y:top,w:W-150,h:470},.35,VS);by=top+520;}
      else by=Math.max(top+60,Math.round((H-b.lines.length*lh)/2));
      b.lines.forEach((l,k)=>textLines(ctx,[l],W/2,by+k*lh,0,k?MN.soft:MN.ink,prog(lt,(s.visual?1.2:.5)+k*.25,(s.visual?1.7:1)+k*.25)));
      return;
    }
    if(s.type==='formula'){
      const fm=fitF(ctx,s.formula,MW-40,600,BV,72,40);font(ctx,600,fm.size,BV);const lh=fm.size*1.2;const by=s.visual?top+fm.size+60:Math.max(top+fm.size+60,420);
      textLines(ctx,fm.lines,W/2,by,lh,MN.ink,prog(lt,.3,.8));
      const wmax=Math.max(...fm.lines.map(l=>ctx.measureText(l).width));const bx=W/2-wmax/2-34,bw=wmax+68,bt=by-fm.size-24,bh=lh*(fm.lines.length-1)+fm.size+52;
      f.cue('formula',.9,'f');mnBox(ctx,bx,bt,bw,bh,E.inOut(prog(lt,.9,1.65)));
      f.cue('chime',1.7,'ch');annEllipse(ctx,W/2,bt+bh/2,bw/2+30,bh/2+34,E.out(prog(lt,1.7,2.3))*(1-prog(lt,f.dur-1.2,f.dur-.6)));
      const b=fit(ctx,s.body,MW,3,400,BV,36,28);font(ctx,400,b.size,BV);const ty=bt+bh+90;textLines(ctx,b.lines,W/2,ty,b.size*1.4,MN.soft,prog(lt,2.0,2.6));
      visBelow(ctx,f,s.visual,ty+(s.body?b.lines.length*b.size*1.4:0)+10,H-150,75,W-75,2.2,VS);
      return;
    }
    let y=top;
    if(s.body){const b=fit(ctx,s.body,MW,2,400,BV,34,28);font(ctx,400,b.size,BV);textLines(ctx,b.lines,W/2,y+b.size,b.size*1.35,MN.soft,prog(lt,.4,.9));y+=b.lines.length*b.size*1.35+40;}
    const n=s.items.length||1;const slot=Math.max(.5,(f.dur-1.6)/n);const L=90,R=W-90;
    s.items.forEach((it,k)=>{
      const t1=.8+k*slot;
      const t=fit(ctx,it.text,R-L-(it.mark!=='none'?190:60),3,400,BV,38,28);const lh=t.size*1.35;const rowH=Math.max(70,t.lines.length*lh+34);
      if(lt>=t1){f.cue('item',t1,'i'+k);const p=prog(lt,t1,t1+.45);
        drawPath(ctx,[[L,y],[R,y]],E.inOut(p),false,1.2,'rgba(242,242,242,.25)');
        if(s.type==='summary'){ctx.save();ctx.globalAlpha*=p;ctx.fillStyle=MN.ink;font(ctx,500,22,MONO);ctx.textAlign='left';ctx.fillText(String(k+1).padStart(2,'0'),L,y+rowH/2+8);ctx.restore();}
        else mnBox(ctx,L+2,y+rowH/2-9,18,18,p);
        ctx.save();ctx.globalAlpha*=prog(lt,t1+.1,t1+.5);ctx.fillStyle=MN.ink;ctx.textAlign='left';font(ctx,400,t.size,BV);
        t.lines.forEach((l,li)=>ctx.fillText(l,L+50,y+rowH/2-(t.lines.length-1)*lh/2+t.size*.35+li*lh));ctx.restore();
        if(it.mark!=='none'){const tm=t1+Math.min(slot*.55,1.2);f.cue(it.mark,tm,'m'+k);mnTag(ctx,MARK_TXT[it.mark],R,y+rowH/2,it.mark==='true'?MN.ok:MN.bad,prog(lt,tm,tm+.5));}
        if(k===n-1)drawPath(ctx,[[L,y+rowH],[R,y+rowH]],E.inOut(p),false,1.2,'rgba(242,242,242,.25)');}
      y+=rowH;
    });
    visBelow(ctx,f,s.visual,y+50,H-150,75,W-75,.6,VS);
  },

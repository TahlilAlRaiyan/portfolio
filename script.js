// Menu, active link, scroll bar, Dhaka clock, hero glow, footer year.
(function(){
  "use strict";
  const $=(s)=>document.querySelector(s);
  const toggle=$(".nav-toggle"),menu=$("#menu");
  const setMenu=(o)=>{menu.classList.toggle("open",o);toggle.setAttribute("aria-expanded",String(o));};
  toggle.addEventListener("click",()=>setMenu(!menu.classList.contains("open")));
  menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setMenu(false)));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")setMenu(false);});

  const links=[...menu.querySelectorAll("a")];
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    links.forEach(a=>{const on=a.getAttribute("href")==="#"+e.target.id;a.classList.toggle("active",on);on?a.setAttribute("aria-current","true"):a.removeAttribute("aria-current");});
  }),{rootMargin:"-45% 0px -50% 0px"});
  document.querySelectorAll("main section[id]").forEach(s=>io.observe(s));

  const bar=$(".progress");let tick=false;
  addEventListener("scroll",()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{
    const h=document.documentElement;bar.style.transform="scaleX("+(h.scrollTop/(h.scrollHeight-h.clientHeight||1))+")";tick=false;});},{passive:true});

  const clock=$("#clock");
  const fmt=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Dhaka",hour:"2-digit",minute:"2-digit"});
  const upd=()=>{clock.textContent=fmt.format(new Date());};upd();setInterval(upd,30000);

  const hero=$(".hero");
  if(matchMedia("(pointer:fine)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches){
    hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect();
      hero.style.setProperty("--mx",(e.clientX-r.left)+"px");hero.style.setProperty("--my",(e.clientY-r.top)+"px");});
  }
  const fine=matchMedia("(pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;

  // Section title pill: shows where you are while scrolling
  const where=$("#where");
  const io2=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;
    requestAnimationFrame(()=>place(menu.querySelector("a.active")));
    const h2=e.target.querySelector("h2"),t=e.target.id==="home"?"Home":(h2?h2.textContent:"");
    if(t&&where.textContent!==t){where.classList.add("swap");setTimeout(()=>{where.textContent=t;where.classList.remove("swap");},150);}
  }),{rootMargin:"-45% 0px -50% 0px"});
  document.querySelectorAll("main section[id]").forEach(s=>io2.observe(s));

  // Animated lines draw in when scrolled to
  const dl=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");dl.unobserve(e.target);}}),{threshold:.6});
  document.querySelectorAll(".draw").forEach(d=>dl.observe(d));

  // Heading reveal (added by JS, so headings stay visible if JS fails)
  if(!calm){const rv=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");rv.unobserve(e.target);}}),{threshold:.3});
    document.querySelectorAll("main section:not(.hero) h2").forEach(h=>{h.classList.add("reveal");rv.observe(h);});}

  // Cursor ring, magnetic buttons, card spotlight
  if(fine&&!calm){
    const c=$(".cursor");let x=0,y=0,cx=0,cy=0;
    addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY;c.classList.add("on");});
    (function loop(){cx+=(x-cx)*.2;cy+=(y-cy)*.2;c.style.transform="translate("+cx+"px,"+cy+"px)";requestAnimationFrame(loop);})();
    document.querySelectorAll("a,button").forEach(el=>{el.addEventListener("pointerenter",()=>c.classList.add("big"));el.addEventListener("pointerleave",()=>c.classList.remove("big"));});
    document.querySelectorAll(".btn").forEach(b=>{
      b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.transform="translate("+(e.clientX-r.left-r.width/2)*.18+"px,"+(e.clientY-r.top-r.height/2)*.3+"px)";});
      b.addEventListener("pointerleave",()=>{b.style.transform="";});});
    document.querySelectorAll(".skills>div").forEach(d=>d.addEventListener("pointermove",e=>{const r=d.getBoundingClientRect();
      d.style.setProperty("--mx",(e.clientX-r.left)+"px");d.style.setProperty("--my",(e.clientY-r.top)+"px");}));
  }

  // About statement: words light up as you scroll
  const st=$(".statement");
  if(st&&!calm){
    st.innerHTML=st.textContent.trim().split(/\s+/).map(w=>'<span class="w">'+w+'</span>').join(" ");
    st.classList.add("words");
    const ws=[...st.querySelectorAll(".w")];
    const light=()=>{const r=st.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight*.85-r.top)/(r.height+innerHeight*.25)));
      ws.forEach((w,i)=>w.classList.toggle("lit",i<p*ws.length*1.05));};
    addEventListener("scroll",light,{passive:true});light();
  }

  // Cursor label over project rows
  if(fine&&!calm){const c=$(".cursor");
    document.querySelectorAll(".row").forEach(r=>{
      r.addEventListener("pointerenter",()=>{c.classList.remove("big");c.classList.add("label");c.textContent="Open repo";});
      r.addEventListener("pointerleave",()=>{c.classList.remove("label");c.textContent="";});});}

  // Reactions: spotlight on cards, staggered rise-in, portrait tilt
  const fxEls=document.querySelectorAll(".card2,.resume-card,.contact li,.tl,.soc");
  fxEls.forEach(el=>el.classList.add("fx"));
  if(fine&&!calm){
    fxEls.forEach(d=>d.addEventListener("pointermove",e=>{const r=d.getBoundingClientRect();
      d.style.setProperty("--mx",(e.clientX-r.left)+"px");d.style.setProperty("--my",(e.clientY-r.top)+"px");}));
    const pt=$(".portrait");
    if(pt){pt.addEventListener("pointermove",e=>{const r=pt.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        pt.style.setProperty("--ry",(x*14)+"deg");pt.style.setProperty("--rx",(-y*14)+"deg");});
      pt.addEventListener("pointerleave",()=>{pt.style.setProperty("--rx","0deg");pt.style.setProperty("--ry","0deg");});}
  }
  if(!calm){
    const ri=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");ri.unobserve(e.target);}}),{threshold:.12});
    document.querySelectorAll(".skills>div,.row,.tl,.card2,.resume-card,.contact li,.portrait,.soc").forEach(el=>{
      const sib=[...el.parentElement.children].indexOf(el);el.style.setProperty("--d",Math.min(sib,5)*90+"ms");el.classList.add("rise");ri.observe(el);});
  }

  // Sliding nav highlight that follows hover/focus and returns to the current section
  const pill=$(".nav-pill"),wide=matchMedia("(min-width:861px)");
  function place(a){
    if(!a||!wide.matches){pill.style.opacity=0;return;}
    const li=a.parentElement;
    pill.style.opacity=1;pill.style.width=li.offsetWidth+"px";pill.style.transform="translateX("+li.offsetLeft+"px)";
  }
  const cur=()=>menu.querySelector("a.active");
  links.forEach(a=>{
    a.addEventListener("pointerenter",()=>place(a));
    a.addEventListener("focus",()=>place(a));
    a.addEventListener("blur",()=>place(cur()));
  });
  menu.addEventListener("pointerleave",()=>place(cur()));
  addEventListener("resize",()=>place(cur()));

  // Timeline line fills as you scroll
  const tl=$(".timeline");
  const fill=()=>{const r=tl.getBoundingClientRect(),vh=innerHeight;tl.style.setProperty("--p",Math.min(1,Math.max(0,(vh*.7-r.top)/r.height)));};
  addEventListener("scroll",fill,{passive:true});fill();


  // Resume / CV: preview first, then ask permission, then download
  const dlg=$("#dl-dialog");
  if(dlg&&typeof dlg.showModal==="function"){
    let obj=$("#dl-object");const ttl=$("#dl-title"),ask=$("#dl-ask"),open=$("#dl-open"),ok=$("#dl-accept");
    let file="",name="",last=null;
    document.querySelectorAll("a[data-preview]").forEach(a=>a.addEventListener("click",e=>{
      e.preventDefault();
      file=a.getAttribute("href");name=a.dataset.preview;last=a;
      ttl.textContent="Preview: "+name;
      ask.textContent="Do you want to download my "+name+"?";
      open.href=file;
      freshView(file+"#view=FitH"); // brand-new viewer each time, so it never shows the previous PDF
      dlg.showModal();ok.focus();
    }));
    function freshView(src){const n=obj.cloneNode(true);n.setAttribute("data",src);obj.replaceWith(n);obj=n;}
    const close=()=>{dlg.close();freshView("");if(last)last.focus();};
    dlg.querySelectorAll("[data-dl-cancel]").forEach(b=>b.addEventListener("click",close));
    dlg.addEventListener("click",e=>{if(e.target===dlg)close();});   // click on backdrop
    dlg.addEventListener("cancel",e=>{e.preventDefault();close();}); // Escape key
    ok.addEventListener("click",()=>{
      const a=document.createElement("a");
      a.href=file;a.download=file;a.style.display="none";
      document.body.appendChild(a);a.click();a.remove();
      close();
    });
  }

  $("#year").textContent=new Date().getFullYear();
})();

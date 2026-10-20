// Menu, footer year, and the animations/reactions for the Learning log and 404 pages.
(function(){
  "use strict";
  const $=(s)=>document.querySelector(s),$$=(s)=>document.querySelectorAll(s);
  const t=$(".nav-toggle"),m=$("#menu");
  const set=(o)=>{m.classList.toggle("open",o);t.setAttribute("aria-expanded",String(o));};
  t.addEventListener("click",()=>set(!m.classList.contains("open")));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")set(false);});
  const y=$("#year");if(y)y.textContent=new Date().getFullYear();

  const fine=matchMedia("(pointer:fine)").matches,calm=matchMedia("(prefers-reduced-motion:reduce)").matches;

  // Scroll progress bar
  const bar=$(".progress");
  if(bar){let tick=false;addEventListener("scroll",()=>{if(tick)return;tick=true;requestAnimationFrame(()=>{
    const h=document.documentElement;bar.style.transform="scaleX("+(h.scrollTop/(h.scrollHeight-h.clientHeight||1))+")";tick=false;});},{passive:true});}

  // Heading: letters rise in one by one (screen readers still get the full text)
  const hd=$("h1[data-split]");
  if(hd&&!calm){const txt=hd.textContent;hd.setAttribute("aria-label",txt);hd.classList.add("split");
    hd.innerHTML=[...txt].map((c,i)=>c===" "?" ":'<span class="ch" aria-hidden="true" style="--i:'+i+'">'+c+"</span>").join("");}

  const posts=[...$$(".post")];
  posts.forEach(p=>p.classList.add("fx"));

  // Cards rise in one after another when scrolled to
  if(!calm){
    const ri=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");ri.unobserve(e.target);}}),{threshold:.12});
    posts.forEach((el,i)=>{el.style.setProperty("--d",Math.min(i,5)*110+"ms");el.classList.add("rise");ri.observe(el);});
  }

  if(fine&&!calm){
    // Glow follows the mouse on the header area
    const hero=$(".hero");
    if(hero)hero.addEventListener("pointermove",e=>{const r=hero.getBoundingClientRect();
      hero.style.setProperty("--mx",(e.clientX-r.left)+"px");hero.style.setProperty("--my",(e.clientY-r.top)+"px");});

    // Cards: spotlight + gentle 3D tilt toward the pointer
    posts.forEach(d=>{
      d.addEventListener("pointermove",e=>{const r=d.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        d.style.setProperty("--mx",(e.clientX-r.left)+"px");d.style.setProperty("--my",(e.clientY-r.top)+"px");
        d.style.setProperty("--ry",(x*5)+"deg");d.style.setProperty("--rx",(-y*5)+"deg");});
      d.addEventListener("pointerleave",()=>{d.style.setProperty("--rx","0deg");d.style.setProperty("--ry","0deg");});
    });

    // Cursor ring that grows over links, labels the cards, and magnetic buttons
    const c=$(".cursor");
    if(c){let x=0,y=0,cx=0,cy=0;
      addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY;c.classList.add("on");});
      (function loop(){cx+=(x-cx)*.2;cy+=(y-cy)*.2;c.style.transform="translate("+cx+"px,"+cy+"px)";requestAnimationFrame(loop);})();
      $$("a,button").forEach(el=>{el.addEventListener("pointerenter",()=>c.classList.add("big"));el.addEventListener("pointerleave",()=>c.classList.remove("big"));});
      posts.forEach(r=>{
        r.addEventListener("pointerenter",()=>{c.classList.remove("big");c.classList.add("label");c.textContent="Read";});
        r.addEventListener("pointerleave",()=>{c.classList.remove("label");c.textContent="";});});
    }
    $$(".btn").forEach(b=>{
      b.addEventListener("pointermove",e=>{const r=b.getBoundingClientRect();b.style.transform="translate("+(e.clientX-r.left-r.width/2)*.18+"px,"+(e.clientY-r.top-r.height/2)*.3+"px)";});
      b.addEventListener("pointerleave",()=>{b.style.transform="";});});
  }
})();

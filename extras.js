// extras.js: flying scroll tracker, nav reactions, music on/off button.
// Load it AFTER script.js / mini.js (both use defer, so order = order of the tags).
(function(){
  "use strict";
  const $=(s)=>document.querySelector(s),$$=(s)=>[...document.querySelectorAll(s)];
  const calm=matchMedia("(prefers-reduced-motion:reduce)").matches;
  const fine=matchMedia("(pointer:fine)").matches;
  const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};

  /*MUSIC-START*/
  // Everything is generated live with the Web Audio API: no audio files, no copyright problem.
  const Music=(()=>{
    const VOL=.32,AUTO_SECONDS=95;
    const AUTO=["guitar","rain","breeze","dusk","keys","chill"]; // phonk is manual only
    const TRACKS={
      chill:{name:"Chill Lo-fi",bpm:74,fn:chill},
      phonk:{name:"Phonk",bpm:132,fn:phonk},
      guitar:{name:"Moonlit Guitar",bpm:72,fn:guitar},
      rain:{name:"Slow Rain",bpm:60,fn:rain,amb:rainBed},
      breeze:{name:"Evening Breeze",bpm:64,fn:breeze,amb:windBed},
      dusk:{name:"Dhaka Dusk",bpm:56,fn:dusk},
      keys:{name:"Night Keys",bpm:62,fn:keys}
    };
    let ctx,master,rev,bus,noiseBuf,longNoise,timer,sus,step=0,next=0,startT=0,playing=false,cur="guitar",listener=function(){};
    let mode=store.get("fx-mode");if(mode!=="auto"&&!TRACKS[mode])mode="auto";
    const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    const rnd=(n)=>(Math.random()*n)|0;

    function impulse(sec){const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
      for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.6);}return b;}
    function newBus(){const dry=ctx.createGain(),send=ctx.createGain(),sat=ctx.createWaveShaper(),c=new Float32Array(257);
      for(let i=0;i<257;i++)c[i]=Math.tanh((i/128-1)*2.4);
      sat.curve=c;dry.connect(master);send.connect(rev);sat.connect(dry);return{dry,send,sat,srcs:[]};}
    function stopSrcs(b){if(b)b.srcs.forEach(s=>{try{s.stop();}catch(e){}});}
    function init(){
      if(ctx)return true;
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return false;
      ctx=new AC();
      master=ctx.createGain();master.gain.value=0;
      const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination);
      rev=ctx.createConvolver();rev.buffer=impulse(2.4);
      const wet=ctx.createGain();wet.gain.value=.4;rev.connect(wet);wet.connect(master);
      noiseBuf=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate);
      let d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      longNoise=ctx.createBuffer(1,ctx.sampleRate*5,ctx.sampleRate);
      d=longNoise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      return true;
    }
    function out(node,send,sat){
      node.connect(sat?bus.sat:bus.dry);
      if(send){const g=ctx.createGain();g.gain.value=send;node.connect(g);g.connect(bus.send);}
    }
    function tone(t,f,dur,o){
      o=o||{};const type=o.type||"sine",vol=o.vol==null?.2:o.vol,a=o.a==null?.01:o.a,r=o.r==null?.12:o.r;
      const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(f,t);
      if(o.glide)osc.frequency.exponentialRampToValueAtTime(o.glide,t+dur);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);
      g.gain.setValueAtTime(vol,t+Math.max(a,dur));g.gain.exponentialRampToValueAtTime(.0001,t+dur+r);
      let n=osc;
      if(o.lp){const f2=ctx.createBiquadFilter();f2.type="lowpass";f2.frequency.value=o.lp;osc.connect(f2);n=f2;}
      n.connect(g);out(g,o.send,o.sat);osc.start(t);osc.stop(t+dur+r+.05);
    }
    function hit(t,dur,o){
      o=o||{};const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
      s.buffer=noiseBuf;f.type=o.type||"highpass";f.frequency.value=o.freq||7000;f.Q.value=o.q||.7;
      g.gain.setValueAtTime(o.vol==null?.1:o.vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      s.connect(f);f.connect(g);out(g,o.send);s.start(t,Math.random()*.5);s.stop(t+dur+.02);
    }
    function cow(t,f,vol){
      [f,f*1.4983].forEach(x=>{
        const o=ctx.createOscillator(),b=ctx.createBiquadFilter(),g=ctx.createGain();
        o.type="square";o.frequency.value=x;b.type="bandpass";b.frequency.value=f*1.6;b.Q.value=1.1;
        g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+.28);
        o.connect(b);b.connect(g);out(g,.12);o.start(t);o.stop(t+.3);
      });
    }
    // soft plucked-string sound: two detuned waves through a closing low-pass filter
    function pluck(t,f,vol,dur){
      const g=ctx.createGain(),lp=ctx.createBiquadFilter();
      lp.type="lowpass";lp.Q.value=.9;lp.frequency.setValueAtTime(3400,t);lp.frequency.exponentialRampToValueAtTime(600,t+.5);
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      [["sawtooth",-5],["triangle",4]].forEach(p=>{const o=ctx.createOscillator();o.type=p[0];o.frequency.value=f;o.detune.value=p[1];o.connect(lp);o.start(t);o.stop(t+dur+.05);});
      lp.connect(g);out(g,.35);
    }
    // bell-like tone from a few sine partials (electric piano, kalimba)
    const EP=[[1,1],[2,.3],[4,.06]],KALI=[[1,1],[3.93,.1]];
    function bell(t,f,vol,dur,parts,a){
      const g=ctx.createGain();g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      parts.forEach(p=>{const o=ctx.createOscillator(),h=ctx.createGain();o.type="sine";o.frequency.value=f*p[0];h.gain.value=p[1];o.connect(h);h.connect(g);o.start(t);o.stop(t+dur+.05);});
      out(g,.45);
    }
    // breathy flute with slow vibrato
    function flute(t,f,dur,vol){
      const g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
      g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.18);
      g.gain.setValueAtTime(vol,t+Math.max(.18,dur-.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur+.4);
      lfo.frequency.value=5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(f*.008,t+Math.min(.6,dur));lfo.connect(lg);
      [[1,1],[2,.22],[3,.06]].forEach(p=>{const o=ctx.createOscillator(),h=ctx.createGain();o.type="sine";o.frequency.value=f*p[0];h.gain.value=p[1];
        lg.connect(o.frequency);o.connect(h);h.connect(g);o.start(t);o.stop(t+dur+.5);});
      lfo.start(t);lfo.stop(t+dur+.5);
      hit(t,Math.min(dur,.5),{type:"bandpass",freq:f*2,q:2,vol:.012,send:.3});
      out(g,.65);
    }
    // endless background sound (rain, wind) tied to the current bus
    function loopNoise(filters,vol){
      const s=ctx.createBufferSource();s.buffer=longNoise;s.loop=true;let n=s;
      filters.forEach(x=>{const f=ctx.createBiquadFilter();f.type=x[0];f.frequency.value=x[1];f.Q.value=x[2]||.7;n.connect(f);n=f;});
      const g=ctx.createGain();g.gain.value=vol;n.connect(g);g.connect(bus.dry);s.start();bus.srcs.push(s);return g;
    }
    function rainBed(){loopNoise([["highpass",900],["lowpass",9000]],.04);loopNoise([["bandpass",380,.6]],.05);}
    function windBed(){
      const g=loopNoise([["bandpass",450,.5]],.02),lfo=ctx.createOscillator(),lg=ctx.createGain();
      lfo.frequency.value=.08;lg.gain.value=.015;lfo.connect(lg);lg.connect(g.gain);lfo.start();bus.srcs.push(lfo);
    }

    // ----- Chill lo-fi: Am7 - Fmaj7 - Cmaj7 - G6 -----
    const CH=[{n:[220,261.63,329.63,392],b:110},{n:[174.61,220,261.63,329.63],b:87.31},
              {n:[261.63,329.63,392,493.88],b:130.81},{n:[196,246.94,293.66,329.63],b:98}];
    function chill(s,t){
      const st=s%16,ch=CH[(s>>4)%4];
      if(st===0){
        ch.n.forEach((f,i)=>tone(t+i*.03,f,3.3,{type:"triangle",vol:.05,a:.9,r:1.4,lp:1100,send:.7}));
        tone(t,ch.b,1.2,{vol:.28,a:.02,r:.5});
      }
      if(st===10)tone(t,ch.b,.5,{vol:.16,a:.02,r:.3});
      if([0,3,6,8,11,14].indexOf(st)>-1&&Math.random()>.18)
        tone(t,ch.n[rnd(4)]*2,.08,{vol:.07,a:.004,r:.9,send:.8});
      if(st===0||st===10)tone(t,120,.12,{vol:.4,a:.002,r:.05,glide:42});
      if(st===4||st===12)hit(t,.14,{type:"bandpass",freq:1700,q:.8,vol:.07,send:.3});
      if(st%2===0)hit(t+(st%4===2?.03:0),.04,{freq:8000,vol:st%4?.02:.035});
    }

    // ----- Phonk: F minor, 808 bass, cowbell lead -----
    const BASS=[[0,43.65,6],[7,43.65,2],[10,51.91,4],[16,43.65,6],[23,43.65,2],[26,65.41,4],
                [32,69.3,6],[39,69.3,2],[42,65.41,4],[48,58.27,6],[55,65.41,2],[58,51.91,6]];
    const LEAD=[[0,523.25],[3,523.25],[6,554.37],[8,523.25],[11,415.3],[14,466.16],
                [16,523.25],[19,523.25],[22,554.37],[24,523.25],[27,466.16],[30,415.3],
                [32,554.37],[35,554.37],[38,622.25],[40,554.37],[43,523.25],[46,466.16],
                [48,523.25],[51,466.16],[54,415.3],[56,392],[59,415.3],[62,523.25]];
    function phonk(s,t,dt){
      const st=s%16,bar=(s>>4)%4;
      BASS.forEach(b=>{if(b[0]===s){
        tone(t,b[1],b[2]*dt,{vol:.55,a:.006,r:.12,sat:true,glide:b[1]*.94});
        tone(t,b[1]*2,b[2]*dt,{type:"triangle",vol:.1,a:.006,r:.1,sat:true});
      }});
      LEAD.forEach(l=>{if(l[0]===s)cow(t,l[1],.13);});
      if(st===0||st===7||st===10||(bar%2===1&&st===3))tone(t,150,.16,{vol:.6,a:.002,r:.05,glide:38,sat:true});
      if(st===4||st===12){hit(t,.16,{type:"bandpass",freq:1900,q:.7,vol:.28,send:.25});tone(t,190,.08,{type:"triangle",vol:.12,a:.002,r:.05});}
      hit(t,.035,{freq:8500,vol:st%2?.025:.05});
      if(st===14)hit(t,.12,{freq:7000,vol:.05});
      if(bar===2&&st>=14)hit(t+dt/2,.03,{freq:9000,vol:.04});
      if(s%32===0){[174.61,207.65].forEach(f=>tone(t,f,32*dt,{type:"sawtooth",vol:.03,a:.6,r:.8,lp:500,send:.6}));}
    }

    // ----- Moonlit Guitar: a simple fingerpicked loop (Am9 - Fmaj7 - Cmaj9 - Em7) -----
    const GC=[{b:110,n:[164.81,196,246.94,329.63]},{b:87.31,n:[174.61,220,261.63,329.63]},
              {b:130.81,n:[196,246.94,329.63,392]},{b:82.41,n:[196,246.94,293.66,392]}];
    const GP=[-1,0,1,2,1,3,2,1];
    function guitar(s,t){
      const st=s%16,ch=GC[(s>>4)%4];
      if(st%2===0){
        const k=GP[st/2];
        if(!(k>-1&&Math.random()<.08))pluck(t+Math.random()*.012,k<0?ch.b:ch.n[k],k<0?.2:.12+Math.random()*.03,k<0?1.6:1.1);
      }
      if(st===0||st===8)tone(t,110,.1,{vol:.2,a:.002,r:.05,glide:45});
      if(st===4||st===12)hit(t,.05,{freq:6500,vol:.02,send:.2});
      if(st===0&&(s>>4)%2===0)ch.n.slice(0,3).forEach((f,i)=>tone(t+i*.05,f,6,{type:"triangle",vol:.025,a:1.5,r:2,lp:900,send:.7}));
    }

    // ----- Slow Rain: rain bed + soft electric piano (Dmaj9 - Bm7 - Gmaj7 - A6) -----
    const RC=[{b:146.83,n:[220,277.18,329.63,369.99]},{b:123.47,n:[185,220,246.94,293.66]},
              {b:98,n:[146.83,185,246.94,293.66]},{b:110,n:[164.81,185,277.18,329.63]}];
    function rain(s,t,dt){
      const st=s%16,ch=RC[(s>>4)%4];
      if(st===0)bell(t,ch.b,.13,3,EP,.008);
      if([2,5,8,11,14].indexOf(st)>-1&&Math.random()<.7)bell(t+Math.random()*.02,ch.n[rnd(4)],.07,2.2,EP,.008);
      if(Math.random()<.12)tone(t+Math.random()*dt,1800+Math.random()*1800,.015,{vol:.025,a:.002,r:.2,send:.9});
    }

    // ----- Evening Breeze: kalimba notes (D pentatonic), warm pad, soft wind -----
    const KP=[293.66,329.63,369.99,440,493.88,587.33,659.25,739.99];
    let ki=3;
    function breeze(s,t,dt){
      const st=s%16;
      if(s%32===0){
        tone(t,73.42,6,{vol:.12,a:1,r:2,send:.5});tone(t,146.83,6,{vol:.07,a:1,r:2,send:.5});
        [220,293.66,369.99].forEach((f,i)=>tone(t+i*.1,f,6.2,{type:"triangle",vol:.03,a:1.5,r:2.5,lp:900,send:.8}));
      }
      if(st%2===0&&Math.random()<.5){
        ki=clamp(ki+rnd(5)-2,0,KP.length-1);bell(t,KP[ki],.09,1.8,KALI,.002);
        if(Math.random()<.25&&ki>1)bell(t+dt,KP[ki-2],.06,1.6,KALI,.002);
      }
    }

    // ----- Dhaka Dusk: tanpura drone + bansuri-style flute (Bhupali scale) -----
    const SA=146.83,BH=[293.66,329.63,369.99,440,493.88,587.33];
    let fi=2;
    function dusk(s,t,dt){
      const st=s%16,tp={0:110,4:SA,8:SA,12:SA/2}[st];
      if(tp){
        tone(t,tp,3,{type:"sawtooth",vol:.04,a:.02,r:2.2,lp:850,send:.8});
        tone(t,tp*1.004,3,{type:"sawtooth",vol:.03,a:.02,r:2.2,lp:850,send:.8});
      }
      if((st===0&&Math.random()<.9)||(st===8&&Math.random()<.5)){
        const n=2+rnd(2);let at=0;
        for(let k=0;k<n;k++){
          fi=clamp(fi+rnd(5)-2,0,BH.length-1);
          const len=k===n-1?6:2+rnd(3);
          flute(t+at*dt,BH[fi],len*dt,.09);at+=len;
        }
      }
    }

    // ----- Night Keys: slow Rhodes chords, brushes, vinyl crackle (Dm9 - Bbmaj7 - Fmaj9 - Gm7) -----
    const KC=[{b:73.42,n:[146.83,220,261.63,329.63]},{b:116.54,n:[233.08,293.66,349.23,440]},
              {b:87.31,n:[220,261.63,329.63,392]},{b:98,n:[196,233.08,293.66,349.23]}];
    function keys(s,t,dt){
      const st=s%16,ch=KC[(s>>4)%4];
      if(st===0){bell(t,ch.b,.12,2.6,EP,.008);ch.n.forEach((f,i)=>bell(t+i*.04,f,.06,2.4,EP,.008));}
      if(st===8&&Math.random()<.6)ch.n.forEach((f,i)=>bell(t+i*.05,f,.035,1.8,EP,.008));
      if([6,11,14].indexOf(st)>-1&&Math.random()<.5)bell(t,ch.n[rnd(4)]*2,.05,1.6,EP,.008);
      if(st===0||st===10)tone(t,115,.12,{vol:.22,a:.002,r:.05,glide:42});
      if(st===8)hit(t,.12,{type:"bandpass",freq:1500,q:.8,vol:.04,send:.3});
      if(st%4===2)hit(t,.04,{freq:8000,vol:.012});
      if(Math.random()<.4)hit(t+Math.random()*dt,.006,{freq:2500+Math.random()*3000,vol:.02+Math.random()*.03});
    }

    // ----- Player -----
    function pickCur(){
      if(mode!=="auto")return mode;
      const i=parseInt(store.get("fx-ai")||"0",10)||0;
      store.set("fx-ai",String((i+1)%AUTO.length));
      return AUTO[i%AUTO.length];
    }
    function enter(k,fade){
      const t=ctx.currentTime,old=bus;
      if(old){
        if(fade){old.dry.gain.setTargetAtTime(0,t,.5);old.send.gain.setTargetAtTime(0,t,.5);setTimeout(()=>stopSrcs(old),3500);}
        else stopSrcs(old);
      }
      bus=newBus();
      if(fade){bus.dry.gain.setValueAtTime(0,t);bus.dry.gain.linearRampToValueAtTime(1,t+1.5);
               bus.send.gain.setValueAtTime(0,t);bus.send.gain.linearRampToValueAtTime(1,t+1.5);}
      cur=k;step=0;next=t+(fade?.3:.08);startT=next;
      if(TRACKS[k].amb)TRACKS[k].amb();
      listener();
    }
    function sched(){
      if(next<ctx.currentTime-.1)next=ctx.currentTime+.05;
      while(next<ctx.currentTime+.25){
        if(mode==="auto"&&next-startT>AUTO_SECONDS){enter(AUTO[(AUTO.indexOf(cur)+1)%AUTO.length],true);}
        const T=TRACKS[cur],dt=60/T.bpm/4;
        T.fn(step%64,next,dt);next+=dt;step++;
      }
    }
    async function start(){
      if(!init())return false;
      try{await ctx.resume();}catch(e){return false;}
      if(ctx.state!=="running")return false;
      clearTimeout(sus);
      if(!timer){enter(pickCur(),false);timer=setInterval(sched,60);}
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(VOL,ctx.currentTime,.6);
      playing=true;listener();return true;
    }
    function stop(){
      if(!ctx||!playing)return;
      playing=false;const t=ctx.currentTime;
      master.gain.cancelScheduledValues(t);master.gain.setTargetAtTime(0,t,.15);
      clearTimeout(sus);
      sus=setTimeout(()=>{if(!playing){clearInterval(timer);timer=null;stopSrcs(bus);ctx.suspend();}},900);
      listener();
    }
    function setMode(m){
      if(m!=="auto"&&!TRACKS[m])return;
      mode=m;store.set("fx-mode",m);
      if(playing)enter(pickCur(),true);else listener();
    }
    function tryAuto(){ // works only if the browser already allows autoplay for this site
      if(!init())return Promise.resolve(false);
      return ctx.state==="running"?start():Promise.resolve(false);
    }
    function blip(f){if(playing&&ctx.state==="running")tone(ctx.currentTime,f,.04,{vol:.06,a:.002,r:.12,send:.4});}
    document.addEventListener("visibilitychange",()=>{if(!ctx||!playing)return;if(document.hidden)ctx.suspend();else ctx.resume();});
    return{start,stop,setMode,tryAuto,blip,
      listen(fn){listener=fn;},
      list:Object.keys(TRACKS).map(k=>[k,TRACKS[k].name]),
      get playing(){return playing;},get mode(){return mode;},
      get label(){return mode==="auto"?(playing?"Auto \u00B7 "+TRACKS[cur].name:"Auto"):TRACKS[mode].name;},
      _tracks:TRACKS,_bus:()=>bus};
  })();
  /*MUSIC-END*/

  // ---------- Flying scroll tracker ----------
  const tr=document.createElement("div");
  tr.className="fx-track";tr.setAttribute("aria-hidden","true");
  tr.innerHTML='<div class="fx-fill"></div><div class="fx-jet"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z"/></svg><span class="fx-pct">0%</span></div>';
  document.body.prepend(tr);
  const fill=$(".fx-fill"),jet=$(".fx-jet"),pct=$(".fx-pct");
  const read=()=>{const h=document.documentElement;return Math.min(1,Math.max(0,h.scrollTop/((h.scrollHeight-h.clientHeight)||1)));};
  let tgt=read(),cur=tgt,raf=0,shown=Math.round(tgt*100),ready=false;
  function mile(p){
    if(!ready)return;
    [25,50,75,100].forEach(m=>{if(shown<m&&p>=m&&!calm){
      jet.classList.remove("loop");void jet.offsetWidth;jet.classList.add("loop");Music.blip(m===100?1040:780);}});
  }
  function draw(){
    const w=innerWidth,x=cur*(w-jet.offsetWidth);
    jet.style.transform="translateX("+x+"px)";
    fill.style.width=(cur>.995?w:x+20)+"px";
    jet.style.setProperty("--tilt",Math.max(-18,Math.min(18,(cur-tgt)*900))+"deg");
    const p=Math.round(tgt*100);
    if(p!==shown){mile(p);shown=p;pct.textContent=p>=100?"100% \uD83C\uDFC1":p+"%";}
  }
  function frame(){
    cur=calm?tgt:cur+(tgt-cur)*.16;
    if(Math.abs(tgt-cur)<.0004)cur=tgt;
    draw();raf=cur!==tgt?requestAnimationFrame(frame):0;
  }
  addEventListener("scroll",()=>{tgt=read();if(!raf)raf=requestAnimationFrame(frame);},{passive:true});
  addEventListener("resize",()=>{tgt=read();cur=tgt;draw();});
  pct.textContent=shown>=100?"100% \uD83C\uDFC1":shown+"%";draw();ready=true;

  // ---------- Nav reactions ----------
  function burst(x,y){
    if(calm)return;
    const cols=["#8b7cff","#f5c542","#ffffff","#5eead4"];
    for(let k=0;k<10;k++){
      const s=document.createElement("i"),ang=Math.PI*2*k/10+Math.random()*.5,d=30+Math.random()*34;
      s.className="fx-spark";
      s.style.cssText="left:"+x+"px;top:"+y+"px;--c:"+cols[k%4]+";--dx:"+(Math.cos(ang)*d)+"px;--dy:"+(Math.sin(ang)*d)+"px";
      document.body.appendChild(s);setTimeout(()=>s.remove(),700);
    }
  }
  const links=$$("#menu a").length?$$("#menu a"):$$(".menu a");
  links.forEach((a,i)=>{
    if(!a.children.length){
      const txt=a.textContent.trim();
      a.setAttribute("aria-label",txt);
      a.innerHTML=[...txt].map((c,j)=>'<span class="fx-l" aria-hidden="true" style="--i:'+j+'">'+(c===" "?"&nbsp;":c)+"</span>").join("");
    }
    const li=a.parentElement;
    a.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse")Music.blip(520+i*70);});
    a.addEventListener("click",e=>{
      const r=a.getBoundingClientRect();
      burst(e.detail?e.clientX:r.left+r.width/2,e.detail?e.clientY:r.top+r.height/2);
      li.classList.remove("fx-pop");void li.offsetWidth;li.classList.add("fx-pop");Music.blip(880);
    });
  });
  dispatchEvent(new Event("resize")); // lets the sliding nav pill re-measure after the letters were split

  // ---------- Music button ----------
  const box=document.createElement("div");
  box.className="fx-snd";
  box.innerHTML='<div class="fx-tip" role="status"></div><div class="fx-menu" role="menu" hidden></div><button type="button" class="fx-trk" aria-haspopup="menu" aria-expanded="false" title="Choose music"><span></span></button>'+
    '<button type="button" class="fx-btn" aria-pressed="false"><span class="eq"><i></i><i></i><i></i><i></i></span></button>';
  document.body.appendChild(box);
  const tip=box.querySelector(".fx-tip"),trk=box.querySelector(".fx-trk"),btn=box.querySelector(".fx-btn"),menu=box.querySelector(".fx-menu");
  menu.innerHTML=[["auto","Auto (plays them all)"]].concat(Music.list).map(x=>'<button type="button" role="menuitemradio" data-k="'+x[0]+'">'+x[1]+"</button>").join("");
  let tipTimer,wanted=store.get("fx-music")!=="off";
  const evs=["pointerup","keydown","touchend","click"];
  function ui(){
    btn.classList.toggle("on",Music.playing);
    btn.setAttribute("aria-pressed",String(Music.playing));
    btn.setAttribute("aria-label",Music.playing?"Turn music off":"Turn music on");
    trk.firstChild.textContent=Music.label;
    menu.querySelectorAll("button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.k===Music.mode)));
  }
  function say(msg,ms){tip.textContent=msg;tip.classList.add("show");clearTimeout(tipTimer);if(ms)tipTimer=setTimeout(()=>tip.classList.remove("show"),ms);}
  function disarm(){evs.forEach(x=>removeEventListener(x,go,true));tip.classList.remove("show");}
  async function go(e){
    if(e.target.closest&&e.target.closest(".fx-snd"))return;
    if(!wanted)return disarm();
    if(await Music.start()){disarm();ui();}
  }
  btn.addEventListener("click",async()=>{
    if(Music.playing){wanted=false;store.set("fx-music","off");Music.stop();tip.classList.remove("show");}
    else{wanted=true;store.set("fx-music","on");if(await Music.start())disarm();}
    ui();
  });
  function closeMenu(){menu.hidden=true;trk.setAttribute("aria-expanded","false");}
  trk.addEventListener("click",()=>{const open=menu.hidden;menu.hidden=!open;trk.setAttribute("aria-expanded",String(open));if(open)tip.classList.remove("show");});
  menu.addEventListener("click",async e=>{
    const b=e.target.closest("button[data-k]");if(!b)return;
    Music.setMode(b.dataset.k);closeMenu();
    if(!Music.playing){wanted=true;store.set("fx-music","on");if(await Music.start())disarm();}
    ui();
  });
  document.addEventListener("click",e=>{if(!menu.hidden&&!box.contains(e.target))closeMenu();});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!menu.hidden){closeMenu();trk.focus();}});
  Music.listen(ui);
  const cr=$(".cursor");
  if(cr&&fine)[btn,trk].forEach(b=>{b.addEventListener("pointerenter",()=>cr.classList.add("big"));b.addEventListener("pointerleave",()=>cr.classList.remove("big"));});
  ui();
  if(wanted){
    Music.tryAuto().then(ok=>{
      ui();
      if(!ok){say("\uD83C\uDFB5 Click anywhere to start the music",8000);evs.forEach(x=>addEventListener(x,go,true));}
    });
  }
})();

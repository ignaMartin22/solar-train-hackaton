import * as THREE from 'three';

/* ---------- sign-up link ---------- */
const INSCRIPCION_URL = ""; // pegá acá el link del formulario de inscripción
document.querySelectorAll('.js-signup').forEach(a=>{
  if(INSCRIPCION_URL){ a.href=INSCRIPCION_URL; a.target="_blank"; a.rel="noopener"; return; }
  a.addEventListener('click',e=>{
    if(a.closest('.hero')) return; // hero button scrolls to the closing block
    e.preventDefault();
    a.parentElement.querySelector('.toast').textContent='Las inscripciones abren muy pronto. Volvé a este link en unos días.';
  });
});

/* ---------- clock ---------- */
const clock=document.getElementById('clock');
function tick(){const d=new Date();clock.textContent=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');}
tick(); // the 3D scene takes over the clock once it starts (scene hour follows the scroll)

/* ---------- reveal cards + route ---------- */
document.documentElement.classList.add('js'); // lets CSS hide cards until .in dissolves them in
const route=document.getElementById('route');
// WebGPU backdrop loads lazily, just before the section scrolls into view
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){import('./route-bg.js');o.disconnect();}},{rootMargin:'600px'}).observe(route);
if('IntersectionObserver' in window){
  new IntersectionObserver((en,o)=>{en.forEach(x=>{if(x.isIntersecting){route.classList.add('on');o.disconnect();}})},{threshold:.05}).observe(route);
  const co=new IntersectionObserver(en=>en.forEach(x=>x.target.classList.toggle('in',x.isIntersecting)),{threshold:.3});
  document.querySelectorAll('.card,.big,.route-head').forEach(c=>co.observe(c));
}else{route.classList.add('on');document.querySelectorAll('.card,.big,.route-head').forEach(c=>c.classList.add('in'));}

/* ---------- 3D scene ---------- */
(function(){
  if(!('WebGLRenderingContext' in window)) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas=document.getElementById('scene');
  const stage=document.querySelector('.stage');
  const sticky=document.querySelector('.stage-sticky');
  const chapters=[...document.querySelectorAll('.chapter')];
  let renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true}); }catch(e){ return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const scene=new THREE.Scene();
  scene.fog=new THREE.Fog(0x3a2230,40,260);
  const camera=new THREE.PerspectiveCamera(34,1,0.1,700);

  const hemi=new THREE.HemisphereLight(0x3d5a8a,0x1a0f0c,0.75);scene.add(hemi);
  const sunLight=new THREE.DirectionalLight(0xff9a5c,2.4);
  sunLight.position.set(60,30,-80);scene.add(sunLight);
  const key=new THREE.DirectionalLight(0xffe6cf,1.1);
  key.position.set(-20,26,24);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-36,right:36,top:24,bottom:-24,near:1,far:130});
  scene.add(key);

  /* soft reflections without an external HDR: a tiny procedural env (night-sky dome
     with a warm horizon band + three light cards) baked through PMREM */
  {
    const env=new THREE.Scene();
    const dg=new THREE.SphereGeometry(50,32,16);
    const dcol=new Float32Array(dg.attributes.position.count*3);
    const nv=new THREE.Vector3(),hue=new THREE.Color(),top=new THREE.Color(0x0a1122),hor=new THREE.Color(0xc9502a),low=new THREE.Color(0x0b0e13);
    for(let i=0;i<dg.attributes.position.count;i++){
      nv.fromBufferAttribute(dg.attributes.position,i).normalize();
      hue.copy(nv.y>0?top:low).lerp(hor,Math.pow(1-Math.abs(nv.y),4));
      dcol.set([hue.r,hue.g,hue.b],i*3);
    }
    dg.setAttribute('color',new THREE.BufferAttribute(dcol,3));
    env.add(new THREE.Mesh(dg,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
    const card=(w,h,c,i2,x,y,z)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c}));m.material.color.multiplyScalar(i2);m.position.set(x,y,z);m.lookAt(0,0,0);env.add(m);};
    card(30,12,0xff8a4c,3.0,0,5,-42);    // warm sunset band ahead of the train
    card(24,10,0x9cc4e2,1.7,-30,26,-20); // cool sky softbox
    card(18,9,0xfff0d8,2.4,26,30,18);    // warm key overhead
    const pm=new THREE.PMREMGenerator(renderer);
    scene.environment=pm.fromScene(env).texture;
    pm.dispose();
  }

  const M=(c,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.5,metalness:.1,envMapIntensity:.3},o));
  const white=M(0xf2efe9,{roughness:.34,metalness:.14,envMapIntensity:.62});
  const orange=M(0xff5a1f,{roughness:.42,emissive:0x3a0d00,envMapIntensity:.5});
  const glass=M(0x0d1119,{roughness:.07,metalness:.85,envMapIntensity:1.6});
  const dark=M(0x14171d,{roughness:.7,envMapIntensity:.35});
  const steel=M(0x9a9da3,{metalness:.9,roughness:.25,envMapIntensity:.8});
  /* solar roof: dark navy cells with a faint grid, shared across every panel */
  const cellTex=(()=>{
    const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');
    x.fillStyle='#12203c';x.fillRect(0,0,256,128);
    x.fillStyle='#0e1a30';for(let j=0;j<4;j++)for(let i=0;i<8;i++)if((i+j)%2)x.fillRect(i*32+2,j*32+2,28,28);
    x.strokeStyle='rgba(150,180,225,.4)';x.lineWidth=2;x.beginPath();
    for(let i=0;i<=8;i++){x.moveTo(i*32,0);x.lineTo(i*32,128);}
    for(let j=0;j<=4;j++){x.moveTo(0,j*32);x.lineTo(256,j*32);}
    x.stroke();
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
  })();
  const panel=M(0xffffff,{map:cellTex,roughness:.26,metalness:.6,envMapIntensity:1,emissive:0x050a18});
  /* hazard chevrons for the nose plow */
  const chevTex=(()=>{
    const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');
    x.fillStyle='#f4f0ea';x.fillRect(0,0,128,64);x.fillStyle='#ff5a1f';
    for(let i=-2;i<8;i++){x.beginPath();x.moveTo(i*24,64);x.lineTo(i*24+24,0);x.lineTo(i*24+40,0);x.lineTo(i*24+16,64);x.closePath();x.fill();}
    const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=THREE.RepeatWrapping;return t;
  })();
  const plowMat=M(0xffffff,{map:chevTex,roughness:.55,envMapIntensity:.4});
  const equip=M(0x20252e,{roughness:.55,metalness:.35,envMapIntensity:.45});
  /* cabin glazing is semi-transparent so the lit interior reads through it */
  const winMat=new THREE.MeshStandardMaterial({color:0x14202e,roughness:.06,metalness:.8,envMapIntensity:1.5,transparent:true,opacity:.3});
  const innerMat=new THREE.MeshBasicMaterial({color:0xffc990,side:THREE.BackSide});
  const innerBase=new THREE.Color(0xffc990);
  const scrBase=new THREE.Color(0x9fc8e8);
  const scrMat=new THREE.MeshBasicMaterial({color:0x9fc8e8,side:THREE.DoubleSide});
  /* riders: low-poly hackers behind the glass. Every box-shaped part (seats,
     torsos, limbs, laptops, window mullions) goes into one InstancedMesh per
     car, heads/hair/hands into a second, lit screens into a third — a full car
     of passengers costs three draw calls */
  const paxBox=new THREE.BoxGeometry(1,1,1),paxBall=new THREE.SphereGeometry(1,14,10),paxScr=new THREE.PlaneGeometry(1,1);
  const paxMat=M(0xffffff,{roughness:.8,metalness:.02,envMapIntensity:.45,emissive:0x120a05}); // faint warm lift = cabin light on the fabric
  const SEAT=0x39404e,FRAME=0x1d232d,DECK=0x161b22;
  const SKIN=[0x8a5a3c,0xb57a52,0xd9a276,0x6e4530,0xe2b48e];
  const CLOTH=[0x31435c,0x6b3a2c,0x40573a,0xcfc8ba,0xff5a1f,0x51304e,0x274050];
  const HAIR=[0x191411,0x3a2417,0x6e4a28,0x8f949c,0x241c22];
  const PANTS=[0x1c222e,0x2e2a26,0x39404e];
  const SCRN=[0x9fc8e8,0x86b4d8,0xbcd9ee,0x8fd0c0,0xe8c890];
  function riders(g,carIdx,panes){
    const B=[],S=[],C=[];
    const D=new THREE.Object3D();D.rotation.order='YXZ';
    const Q=new THREE.Quaternion(),VY=new THREE.Vector3(0,1,0),PA=new THREE.Vector3(),PB=new THREE.Vector3(),PD=new THREE.Vector3();
    const put=(arr,c,x,y,z,sx,sy,sz,rx,ry,rz)=>{
      D.position.set(x,y,z);D.rotation.set(rx||0,ry||0,rz||0);D.scale.set(sx,sy,sz);D.updateMatrix();
      arr.push([D.matrix.clone(),c]);
    };
    const limb=(c,ax,ay,az,bx,by,bz,th)=>{ // a box stretched between two joints
      PA.set(ax,ay,az);PB.set(bx,by,bz);PD.subVectors(PB,PA);const L=PD.length();
      D.position.copy(PA).add(PB).multiplyScalar(.5);
      D.quaternion.copy(Q.setFromUnitVectors(VY,PD.normalize()));D.scale.set(th,L,th);D.updateMatrix();
      B.push([D.matrix.clone(),c]);
    };
    // dark mullions + rails frame the panoramic band — the bare through-hole reads as a glow gap otherwise
    [-1,1].forEach(s=>{const mz=s*(W/2-.015);
      put(B,FRAME,(.92+LEN-.32)/2,1.545,mz,LEN-1.24,.05,.06);
      put(B,FRAME,(.92+LEN-.32)/2,2.475,mz,LEN-1.24,.05,.06);
      panes.forEach(([a,b])=>{put(B,FRAME,a-.02,2.01,mz,.07,.98,.06);put(B,FRAME,b+.02,2.01,mz,.07,.98,.06);});
    });
    panes.forEach(([a,b],i)=>{[-1,1].forEach(s=>{
      if((i+(s>0?0:1))%2)return; // alternating bays stay occupied, doors stay clear
      const h=n=>hash((i+1)*7.13+s*3.7+carIdx*11.9+n*31.7,.5);
      const x=(a+b)/2+(h(0)-.5)*.24,z=s*(W/2-.52),f=s>0?1:-1; // +z row rides facing forward, −z backward
      const hg=.93+h(1)*.11;
      const skin=SKIN[(h(2)*SKIN.length)|0],cloth=CLOTH[(h(3)*CLOTH.length)|0];
      const hairC=HAIR[(h(4)*HAIR.length)|0],pants=PANTS[(h(5)*PANTS.length)|0];
      const gaze=h(6)<.28,lean=(gaze?.04:.05+h(7)*.12)*f;
      const hipY=1.35,shY=hipY+.55*hg,nkY=shY+.05,hdY=nkY+.14,sx=x+lean*.6;
      put(B,SEAT,x-f*.06,1.12,z,.6,.1,.54);                                 // seat cushion
      put(B,SEAT,x-f*.33,1.36,z,.08,.62,.58);                               // backrest peeks over the sill
      put(B,pants,x+f*.1,1.02,z,.34,.4,.34);                                // shins below the sill line
      put(B,pants,x+f*.01,1.31,z,.44,.14,.4);                               // lap
      put(B,cloth,x,(hipY+shY)/2+.02,z,.3,.56*hg+.1,.42*hg,0,0,-lean);      // torso
      put(B,cloth,sx,shY-.01,z,.24,.1,.44*hg);                              // shoulder line
      put(B,skin,sx,nkY-.02,z,.1,.1,.1);                                    // neck
      const yaw=gaze?-s*f*.75:(h(8)-.5)*.3,pitch=(gaze?.02:.16)*f; // coders nod at the screen
      put(S,skin,sx+f*.04,hdY,z,.145*hg,.165*hg,.14*hg,0,yaw,-pitch);       // head
      put(S,hairC,sx+f*.01,hdY+.05,z,.15*hg,.125*hg,.145*hg,0,yaw,-pitch);  // hair cap
      const hs=h(8.5);
      if(hs<.3)put(B,hairC,sx-f*.1,hdY-.12,z,.1,.3,.18);                    // long hair down the back
      else if(hs<.45)put(S,hairC,sx-f*.11,hdY+.1,z,.065,.065,.065);         // bun
      const shX=sx+f*.02;
      if(gaze){ // chin on the window-side fist, watching the quebrada go by
        limb(cloth,shX,shY-.03,z+s*.2*hg,x+f*.18,1.6,z+s*.16,.078*hg);
        limb(skin,x+f*.18,1.6,z+s*.16,sx+f*.09,hdY-.16,z+s*.1,.06);
        limb(cloth,shX,shY-.03,z-s*.2*hg,x+f*.14,1.58,z-s*.15,.078*hg);
        limb(skin,x+f*.14,1.58,z-s*.15,x+f*.22,1.5,z-s*.06,.06);
      }else{[-1,1].forEach(k=>{ // elbows out, both hands on the keyboard
          limb(cloth,shX,shY-.03,z+k*.2*hg,x+f*.02,1.6,z+k*.18,.078*hg);
          limb(cloth,x+f*.02,1.6,z+k*.18,x+f*.14,1.57,z+k*.06,.064*hg);
          put(S,skin,x+f*.16,1.56,z+k*.04,.05,.045,.055);                   // hand
        });
        put(B,DECK,x+f*.21,1.52,z,.36,.03,.27,0,0,f*.05);                   // laptop held over the lap
        put(C,SCRN[(h(9)*SCRN.length)|0],x+f*.36,1.74,z,.32,.22,1,-.34,-f*Math.PI/2,0); // screen faces the rider
      }
    });});
    const mk=(geo,mat,arr)=>{if(!arr.length)return;const m=new THREE.InstancedMesh(geo,mat,arr.length),cl=new THREE.Color();
      arr.forEach(([mt,c],i)=>{m.setMatrixAt(i,mt);m.setColorAt(i,cl.set(c));});m.frustumCulled=false;g.add(m);};
    mk(paxBox,paxMat,B);mk(paxBall,paxMat,S);mk(paxScr,scrMat,C);
  }

  /* sun + glow */
  const sun=new THREE.Mesh(new THREE.CircleGeometry(22,64),new THREE.MeshBasicMaterial({color:0xff7a3a,fog:false}));
  sun.position.set(230,18,-205);scene.add(sun);
  const gc=document.createElement('canvas');gc.width=gc.height=256;const gx=gc.getContext('2d');
  const gr=gx.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(255,150,80,.9)');gr.addColorStop(.35,'rgba(255,100,40,.35)');gr.addColorStop(1,'rgba(255,90,31,0)');
  gx.fillStyle=gr;gx.fillRect(0,0,256,256);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(gc),depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));
  glow.scale.set(150,150,1);glow.position.set(230,18,-204);scene.add(glow);

  /* mountains (static, far) */
  function hash(x,z){const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);}
  function mountains(w,d,seg,amp,zOff,col,seed){
    const g=new THREE.PlaneGeometry(w,d,seg,Math.round(seg*d/w));
    g.rotateX(-Math.PI/2);
    const p=g.attributes.position;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),z=p.getZ(i);
      const back=THREE.MathUtils.clamp((d/2-z)/d,0,1);
      let h=Math.sin(x*.045+seed)*.5+Math.sin(x*.11+seed*2)*.3+Math.sin(x*.023+z*.05)*.6+hash(x+seed,z)*.35;
      h=Math.max(0,h+.35)*amp*Math.pow(back,.7);
      p.setY(i,h);
    }
    g.computeVertexNormals();
    const m=new THREE.Mesh(g,M(col,{roughness:.95,flatShading:true}));
    m.position.z=zOff;m.receiveShadow=true;scene.add(m);return m;
  }
  mountains(900,120,110,14,-150,0x6b3a2c,1.3).position.x=100;
  mountains(700,80,100,7,-78,0x3b2a27,4.1).position.x=80;
  mountains(900,90,100,12,140,0x4a2e26,7.7).rotation.y=Math.PI; // ridge behind the camera side, for the reverse angles
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(900,500),M(0x1c1714,{roughness:1}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);

  /* rail line: the train stays near the origin, the ground slides past */
  const line=new THREE.Group();line.rotation.y=0.32;scene.add(line);
  const ballast=new THREE.Mesh(new THREE.BoxGeometry(700,.35,5),M(0x3a332e,{roughness:1}));
  ballast.position.set(100,.1,0);ballast.receiveShadow=true;line.add(ballast);
  [-0.78,0.78].forEach(z=>{const r=new THREE.Mesh(new THREE.BoxGeometry(700,.14,.12),steel);r.position.set(100,.42,z);line.add(r);});
  const SL0=-220,SLN=560;
  const sleepers=new THREE.InstancedMesh(new THREE.BoxGeometry(.32,.12,2.5),M(0x2a211b,{roughness:.9}),SLN);
  sleepers.receiveShadow=true;line.add(sleepers);
  const tmp=new THREE.Object3D();
  function placeSleepers(off){for(let i=0;i<SLN;i++){tmp.position.set(SL0+i+off,.3,0);tmp.updateMatrix();sleepers.setMatrixAt(i,tmp.matrix);}sleepers.instanceMatrix.needsUpdate=true;}
  placeSleepers(0);
  // platform (left behind once the train departs)
  const platform=new THREE.Group();line.add(platform);
  const plat=new THREE.Mesh(new THREE.BoxGeometry(30,.9,5),M(0x8d8378,{roughness:.9}));
  plat.position.set(8,.45,-5.4);plat.receiveShadow=true;plat.castShadow=true;platform.add(plat);
  const edge=new THREE.Mesh(new THREE.BoxGeometry(30,.06,.35),orange);edge.position.set(8,.93,-3.1);platform.add(edge);
  // station sign
  const post=new THREE.Mesh(new THREE.BoxGeometry(.12,2.6,.12),dark);post.position.set(4,2.2,-6.6);platform.add(post);
  const sign=new THREE.Mesh(new THREE.BoxGeometry(3,.7,.1),orange);sign.position.set(4,3.4,-6.6);platform.add(sign);

  /* trackside props: cardones, rocks and km posts, recycled along a loop */
  const LOOP=260, LOOP0=-120;
  const props=[];
  const cactusMat=M(0x40573a,{roughness:.9,flatShading:true});
  const rockMat=M(0x7a4636,{roughness:1,flatShading:true});
  function cardon(h){
    const g=new THREE.Group();
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.32,.38,h,7),cactusMat);trunk.position.y=h/2;trunk.castShadow=true;g.add(trunk);
    const arms=1+Math.floor(Math.random()*2);
    for(let a=0;a<arms;a++){
      const s=a?-1:1, ah=h*(.35+Math.random()*.25), ay=h*(.3+Math.random()*.25);
      const hor=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.8,6),cactusMat);hor.rotation.z=Math.PI/2;hor.position.set(s*.5,ay,0);g.add(hor);
      const up=new THREE.Mesh(new THREE.CylinderGeometry(.22,.24,ah,6),cactusMat);up.position.set(s*.9,ay+ah/2-.1,0);up.castShadow=true;g.add(up);
    }
    return g;
  }
  let seed=3;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<70;i++){
    const far=rnd();
    // −z side (platform side) can be close; +z side stays clear of the camera paths
    const z=far<.5? -(5.6+rnd()*34) : (rnd()<.4 ? 3.6+rnd()*1.6 : 15+rnd()*30);
    let o;
    if(rnd()<.55 && Math.abs(z)>4.5){o=cardon(2.4+rnd()*3.2);}
    else{o=new THREE.Mesh(new THREE.DodecahedronGeometry(.4+rnd()*(Math.abs(z)>8?2.2:.6),0),rockMat);o.position.y=.2;o.castShadow=true;o.rotation.set(rnd()*3,rnd()*3,0);}
    o.userData.base=LOOP0+rnd()*LOOP;o.position.z=z;line.add(o);props.push(o);
  }
  // a white-walled pueblo with a bell tower, passing by on the far side
  {
    const town=new THREE.Group();
    const wall=M(0xefe6d8,{roughness:.9}),roof=M(0xb4553a,{roughness:.85,flatShading:true});
    for(let i=0;i<16;i++){
      const w=2+rnd()*2.6,h=1.6+rnd()*1.4,d=2+rnd()*2;
      const hx=rnd()*44,hz=-(15+rnd()*16);
      const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);b.position.set(hx,h/2,hz);b.castShadow=true;b.receiveShadow=true;town.add(b);
      const r=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.75,.9,4),roof);r.rotation.y=Math.PI/4;r.scale.set(w/Math.max(w,d),1,d/Math.max(w,d));r.position.set(hx,h+.45,hz);town.add(r);
    }
    const tw=new THREE.Group();tw.position.set(22,0,-20);
    const t1=new THREE.Mesh(new THREE.BoxGeometry(2.2,7,2.2),wall);t1.position.y=3.5;t1.castShadow=true;tw.add(t1);
    const t2=new THREE.Mesh(new THREE.BoxGeometry(1.7,2.2,1.7),wall);t2.position.y=8.1;tw.add(t2);
    const arch=new THREE.Mesh(new THREE.BoxGeometry(1.75,1,0.6),M(0x2a211b));arch.position.y=8.2;tw.add(arch);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.9,16,8,0,Math.PI*2,0,Math.PI/2),M(0xc9a26a,{roughness:.6}));dome.position.y=9.2;tw.add(dome);
    const cross=new THREE.Mesh(new THREE.BoxGeometry(.08,.7,.08),dark);cross.position.y=10.4;tw.add(cross);
    town.add(tw);
    town.userData.base=60;line.add(town);props.push(town);
  }
  for(let i=0;i<13;i++){
    const g=new THREE.Group();
    const p=new THREE.Mesh(new THREE.BoxGeometry(.16,1.1,.16),M(0xf4f0ea));p.position.y=.55;g.add(p);
    const t=new THREE.Mesh(new THREE.BoxGeometry(.18,.2,.18),orange);t.position.y=1.15;g.add(t);
    g.position.z=2.9;g.userData.base=LOOP0+i*(LOOP/13);line.add(g);props.push(g);
  }

  /* the train: two articulated cars, a driving cab on each outer end and a bellows
     joining the inner ends — the real Tren Solar de la Quebrada */
  const W=2.5,LEN=10.4,GAP=.6;
  function extrude(shape,depth,bevel){
    const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:!!bevel,bevelSize:bevel||0,bevelThickness:bevel||0,bevelSegments:3,curveSegments:12});
    g.translate(0,0,-depth/2);return g;
  }
  function poly(pts){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);return s;}
  /* side silhouette: sloped cab nose at x=0, flat inner end at x=LEN facing the bellows.
     The panoramic band is a real through-hole, so the lit interior shows behind the glass */
  function carShape(){
    const s=new THREE.Shape();
    s.moveTo(.34,.55);
    s.lineTo(LEN-.06,.55);
    s.quadraticCurveTo(LEN,.55,LEN,.62);
    s.lineTo(LEN,2.7);
    s.quadraticCurveTo(LEN,2.88,LEN-.16,2.88);
    s.lineTo(1.72,2.88);
    s.quadraticCurveTo(1.32,2.88,.95,2.62);  // roof rounds into the forehead
    s.lineTo(.42,1.6);                       // long straight windshield rake
    s.quadraticCurveTo(.26,1.32,.2,1.02);    // nose cone
    s.quadraticCurveTo(.14,.72,.34,.55);     // chin
    const win=new THREE.Path();
    win.moveTo(.95,1.56);win.lineTo(LEN-.35,1.56);win.lineTo(LEN-.35,2.46);win.lineTo(.95,2.46);win.closePath();
    s.holes.push(win);
    return s;
  }
  /* mountain-silhouette stripe: a solid band whose top edge is a sawtooth of peaks */
  function stripeShape(){
    const s=new THREE.Shape();
    s.moveTo(.55,.56);s.lineTo(LEN-.06,.56);s.lineTo(LEN-.06,.98);
    const peaks=[[9.8,1.05],[9.05,1.32],[8.15,1.07],[7.3,1.42],[6.3,1.1],[5.25,1.5],[4.35,1.08],[3.5,1.4],[2.6,1.06],[1.8,1.3],[1.05,1.04]];
    peaks.forEach(([p,h])=>{s.lineTo(p+.48,.98);s.lineTo(p,h);s.lineTo(p-.48,.98);});
    s.lineTo(.55,.98);s.closePath();
    return s;
  }
  const train=new THREE.Group();line.add(train);
  const wheels=[],beams=[];
  const lampW=new THREE.MeshBasicMaterial({color:0xfff2d6,transparent:true});
  const lampR=new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true});
  function box(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;}
  /* a slab tilted to lie on the cab's sloped face (front windshield, destination sign) */
  function slant(w,h,d,mat,deg,x,y,z){const m=box(w,h,d,mat,x,y,z);m.rotation.z=THREE.MathUtils.degToRad(deg);return m;}

  function car(tail){
    const g=new THREE.Group();
    if(tail)g.scale.x=-1; // mirrored: cab faces +x
    const body=new THREE.Mesh(extrude(carShape(),W-.16,.08),white);body.castShadow=true;g.add(body);
    g.add(new THREE.Mesh(extrude(stripeShape(),W+.04),orange)); // wraps onto the nose like the real paint

    // lit cabin behind the glass: an inside-out warm shell + silhouettes of people coding
    g.add(box(LEN-1,2.05,W-.85,innerMat,(1+LEN)/2,1.85,0));
    const panes=[[1.12,1.9],[3.3,4.62],[4.88,6.2],[6.46,7.55],[9.05,10.16]];
    panes.forEach(([a,b])=>{[-1,1].forEach(s=>{
      g.add(box(b-a-.06,.9,.05,winMat,(a+b)/2,2.01,s*(W/2-.05)));
    });});
    riders(g,tail?1:0,panes);
    // plug doors with orange frames, two per side per car
    [[2.02,3.04],[7.72,8.74]].forEach(([a,b])=>{
      [-1,1].forEach(s=>{
        const d=new THREE.Group();d.position.z=s*(W/2+.015);
        d.add(box(b-a,.9,.06,dark,(a+b)/2,1.13,0));      // solid leaf below the beltline
        d.add(box(b-a-.2,.8,.07,winMat,(a+b)/2,1.98,0)); // door glass shows the cabin
        [a+.06,b-.06].forEach(x=>d.add(box(.06,1.72,.08,orange,x,1.55,0)));
        d.add(box(.05,1.72,.07,dark,(a+b)/2,1.55,0));
        g.add(d);
      });
    });

    // windshield slab on the sloped face + wraparound corner panes + parked wipers
    g.add(slant(.95,.07,1.78,glass,62.5,.6,2.06,0));
    [-1,1].forEach(s=>{
      const p=box(.5,.82,.05,glass,.82,2.05,s*(W/2-.04));p.rotation.z=THREE.MathUtils.degToRad(27);g.add(p);
      g.add(slant(.58,.032,.05,dark,73.5,.56,2.085,s*.44)); // wiper resting on the raked glass
    });
    // destination display riding just above the glass
    g.add(slant(.3,.07,1.15,dark,62.5,.74,2.5,0));
    const dt=slant(.14,.075,.55,new THREE.MeshBasicMaterial({color:0xff8a4c}),62.5,.7,2.51,0);g.add(dt);

    // roof: dark tray, solar array, AC hump by the bellows, cab antenna fin
    g.add(box(LEN-2.5,.05,W-.46,dark,(1.95+LEN-.4)/2,2.895,0));
    for(let k=0;k<5;k++)g.add(box(1.42,.05,W-.6,panel,2.5+k*1.56,2.945,0));
    g.add(box(1.0,.13,W-1.05,equip,LEN-1.25,2.97,0));
    const fin=new THREE.Mesh(new THREE.ConeGeometry(.14,.46,4),dark);fin.position.set(1.55,3.08,0);fin.rotation.y=Math.PI/4;g.add(fin);

    // headlight clusters on the nose
    [-1,1].forEach(s=>{
      const l1=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),tail?lampR:lampW);l1.position.set(.3,1.06,s*.8);g.add(l1);
      const l2=new THREE.Mesh(new THREE.SphereGeometry(.06,10,6),tail?lampW:lampR);l2.position.set(.3,1.06,s*.95);g.add(l2);
    });
    if(!tail){const beam=new THREE.SpotLight(0xffe2b8,2.2,45,.45,.6,1);beam.position.set(.2,.95,0);beam.target.position.set(-20,0,0);g.add(beam);g.add(beam.target);beams.push(beam);}

    // chevron plow + coupler under the nose
    const plow=slant(.55,.08,1.6,plowMat,16,.24,.72,0);g.add(plow);
    g.add(box(.4,.28,.5,dark,.34,.48,0));

    // underfloor cover + two bogies
    g.add(box(LEN-1.7,.3,W-.4,dark,LEN/2+.45,.44,0));
    [2.7,LEN-1.9].forEach(bx=>{
      const b=box(2.4,.34,W-.6,dark,bx,.52,0);b.castShadow=true;g.add(b);
      g.add(box(2.7,.09,W-.68,dark,bx,.34,0));
      [-.68,.68].forEach(dx=>[-.8,.8].forEach(z=>{
        const w=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.15,18),steel);
        w.rotation.x=Math.PI/2;w.position.set(bx+dx,.58,z);g.add(w);wheels.push(w);
      }));
    });
    train.add(g);
    return g;
  }
  car(false);
  const c1=car(true);c1.position.x=2*LEN+GAP;

  // the bellows (fuelle) bridging the inner ends
  const bellows=new THREE.Group();bellows.position.x=LEN+GAP/2;
  bellows.add(box(GAP-.12,1.95,W-.55,dark,0,1.62,0));
  for(let i=0;i<4;i++)bellows.add(box(.07,2.05,W-.4,dark,(i-1.5)*(GAP-.2)/3,1.62,0));
  bellows.add(box(GAP+.15,.5,W-.5,dark,0,.42,0));
  train.add(bellows);
  const TMID=(2*LEN+GAP)/2-1.5; // train centre in line space once docked (nose ≈ -1.4)

  /* floating 3D slashes + sun ring (they ride with the train so they stay in frame) */
  const fx=new THREE.Group();line.add(fx);
  const slashGeo=new THREE.ExtrudeGeometry(poly([[0,0],[.7,0],[2.2,3.2],[1.5,3.2]]),{depth:.35,bevelEnabled:true,bevelSize:.05,bevelThickness:.05,bevelSegments:2});
  slashGeo.center();
  const slashMat=M(0xff5a1f,{roughness:.35,metalness:.2,emissive:0x5a1400});
  const slashMatW=M(0xf4f0ea,{roughness:.35,metalness:.1});
  const slashes=[];
  [[8,7,-7,1.3],[18,9.5,-12,1.8],[-1,8.5,-14,.9],[27,5.5,-5,1],[12,5.2,4,.55],[34,12,-24,2.4],[22,3.6,7,.5],[-8,4,-6,.8],[40,6,8,1.1]].forEach(([x,y,z,s],i)=>{
    const m=new THREE.Mesh(slashGeo,i%3===2?slashMatW:slashMat);m.position.set(x,y,z);m.scale.setScalar(s);
    m.rotation.set(rnd()*.6,rnd()*Math.PI,rnd()*.4);m.castShadow=true;
    m.userData={by:y,ph:rnd()*6.28,sp:.3+rnd()*.4};fx.add(m);slashes.push(m);
  });
  const ring=new THREE.Mesh(new THREE.TorusGeometry(7,.18,16,120),new THREE.MeshBasicMaterial({color:0xff5a1f}));
  ring.position.set(30,9,-30);fx.add(ring);
  const ring2=new THREE.Mesh(new THREE.TorusGeometry(9.5,.05,8,140),new THREE.MeshBasicMaterial({color:0xffb38a,transparent:true,opacity:.55}));
  ring2.position.copy(ring.position);fx.add(ring2);

  /* ---------- space layer: stars, dark planet, moon, rocket launch, light-speed streaks ---------- */
  const dpr=Math.min(devicePixelRatio,2);
  function starLayer(n,size,minEl){
    const g=new THREE.BufferGeometry(),pos=[],col=[];
    for(let i=0;i<n;i++){
      const el=THREE.MathUtils.degToRad(minEl+Math.pow(Math.random(),.7)*(88-minEl)),az=Math.random()*Math.PI*2,r=480;
      pos.push(Math.cos(el)*Math.sin(az)*r,Math.sin(el)*r,-Math.cos(el)*Math.cos(az)*r);
      const f=THREE.MathUtils.clamp((THREE.MathUtils.radToDeg(el)-minEl)/25,0,1),w=.55+Math.random()*.45;
      col.push(w*f,w*f,(w+.08)*f);
    }
    g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    const m=new THREE.PointsMaterial({size:size*dpr,sizeAttenuation:false,vertexColors:true,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending});
    const p=new THREE.Points(g,m);scene.add(p);return p;
  }
  const stars=starLayer(2200,1.4,9),bright=starLayer(160,2.8,14);

  const PLANET=new THREE.Vector3(240,66,-287);
  const planet=new THREE.Mesh(new THREE.SphereGeometry(34,64,32),new THREE.MeshStandardMaterial({color:0x2a3766,roughness:1,emissive:0x0a1030,fog:false,transparent:true}));
  planet.position.copy(PLANET);scene.add(planet);
  const pglow=new THREE.Sprite(new THREE.SpriteMaterial({map:glow.material.map,color:0x6f8cff,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,opacity:.55,transparent:true}));
  pglow.scale.set(120,120,1);pglow.position.copy(PLANET).add(new THREE.Vector3(0,0,-40));scene.add(pglow);
  const pring=new THREE.Mesh(new THREE.RingGeometry(46,64,160),new THREE.MeshBasicMaterial({color:0xf4f0ea,transparent:true,opacity:.22,side:THREE.DoubleSide,fog:false,depthWrite:false}));
  pring.position.copy(PLANET);pring.rotation.set(-1.25,.35,.2);scene.add(pring);
  const pring2=new THREE.Mesh(new THREE.RingGeometry(66,67.5,160),new THREE.MeshBasicMaterial({color:0xff5a1f,transparent:true,opacity:.5,side:THREE.DoubleSide,fog:false,depthWrite:false}));
  pring2.position.copy(PLANET);pring2.rotation.copy(pring.rotation);scene.add(pring2);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(6,32,16),new THREE.MeshStandardMaterial({color:0xd9d2c6,roughness:1,emissive:0x1a1814,fog:false,transparent:true}));
  moon.position.copy(PLANET).add(new THREE.Vector3(-70,48,10));scene.add(moon);

  // generic rocket
  const rocket=new THREE.Group();
  const rw=new THREE.MeshStandardMaterial({color:0xf4f0ea,roughness:.4,fog:false}),rd=new THREE.MeshStandardMaterial({color:0x15181f,roughness:.6,fog:false});
  const rb=new THREE.Mesh(new THREE.CylinderGeometry(.55,.6,7,16),rw);rb.position.y=3.5;rocket.add(rb);
  const rn=new THREE.Mesh(new THREE.ConeGeometry(.55,2,16),rw);rn.position.y=8;rocket.add(rn);
  const rs=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,.5,16),new THREE.MeshStandardMaterial({color:0xff5a1f,fog:false}));rs.position.y=5.4;rocket.add(rs);
  for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.BoxGeometry(.08,1.4,1),rd);const a=i*Math.PI*2/3;f.position.set(Math.sin(a)*.7,.7,Math.cos(a)*.7);f.rotation.y=a;rocket.add(f);}
  const flameMat=new THREE.SpriteMaterial({map:glow.material.map,color:0xffc38a,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,transparent:true});
  const flame=new THREE.Sprite(flameMat);flame.scale.set(7,11,1);flame.position.y=-3.5;rocket.add(flame);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glow.material.map,color:0xffffff,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,transparent:true}));core.scale.set(2.6,4,1);core.position.y=-1;rocket.add(core);
  rocket.scale.setScalar(1.5);scene.add(rocket);
  const padGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glow.material.map,color:0xffa060,depthWrite:false,fog:false,blending:THREE.AdditiveBlending,transparent:true,opacity:0}));
  const PAD=new THREE.Vector3(150,0,-200);padGlow.position.copy(PAD);padGlow.scale.set(60,40,1);scene.add(padGlow);
  const TRAIL=220,trailPos=new Float32Array(TRAIL*3);let trailN=0;
  const trailGeo=new THREE.BufferGeometry();trailGeo.setAttribute('position',new THREE.BufferAttribute(trailPos,3));trailGeo.setDrawRange(0,0);
  const trailLine=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:0xfff1de,transparent:true,opacity:.8,fog:false,depthWrite:false}));scene.add(trailLine);
  const smoke=new THREE.Points(trailGeo,new THREE.PointsMaterial({color:0xf4e6d4,size:5,transparent:true,opacity:.18,depthWrite:false,fog:false}));scene.add(smoke);
  const rp=new THREE.Vector3(),rv=new THREE.Vector3(),UP=new THREE.Vector3(0,1,0);
  function rocketAt(u){rp.set(PAD.x+130*Math.pow(u,2.2),PAD.y+300*u,PAD.z-30*u);rv.set(286*Math.pow(u,1.2),300,-30).normalize();}
  let lastTrail=0;

  // light-speed streaks, attached to the camera
  scene.add(camera);
  const WN=700,warpPos=new Float32Array(WN*6),warpSeed=new Float32Array(WN*3);
  for(let i=0;i<WN;i++){const a=Math.random()*Math.PI*2,r=2+Math.random()*16;warpSeed[i*3]=Math.cos(a)*r;warpSeed[i*3+1]=Math.sin(a)*r;warpSeed[i*3+2]=-Math.random()*220;}
  const warpGeo=new THREE.BufferGeometry();warpGeo.setAttribute('position',new THREE.BufferAttribute(warpPos,3));
  const warpMat=new THREE.LineBasicMaterial({color:0xd6e6ff,transparent:true,opacity:0,fog:false,depthWrite:false,blending:THREE.AdditiveBlending});
  const warp=new THREE.LineSegments(warpGeo,warpMat);warp.frustumCulled=false;camera.add(warp);
  const flashEl=document.getElementById('flash'),hudEl=document.getElementById('hud');

  /* sparks */
  const N=500,pg=new THREE.BufferGeometry(),pp=new Float32Array(N*3),pv=new Float32Array(N);
  for(let i=0;i<N;i++){pp[i*3]=(Math.random()-.3)*140;pp[i*3+1]=Math.random()*30;pp[i*3+2]=-Math.random()*100+20;pv[i]=.2+Math.random()*.8;}
  pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
  const dust=new THREE.Points(pg,new THREE.PointsMaterial({color:0xffa36b,size:.18,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending}));scene.add(dust);

  /* camera angles, in rail-line space (docked train: nose x≈-1.4, tail x≈+20, centre x≈9.2; +z = side facing the viewer)
     [position, look-at, fov offset] — desktop and phone variants */
  const V=(x,y,z)=>new THREE.Vector3(x,y,z);
  const SHOTS={
    wide:[
      {p:V(-16.3,3.4,10.9), t:V(-1.4,2.6,-.5),   name:'CAM 01 · ANDÉN'},
      {p:V(2.5,17,8.5),     t:V(TMID,2.4,-1.5),  name:'CAM 02 · CENITAL · PANELES'},
      {p:V(7.5,2.6,15),     t:V(TMID+1,2.2,-30), name:'CAM 03 · LATERAL BAJA'},
      {p:V(3.2,2.2,8.8),    t:V(10.6,1.9,-.8),   name:'CAM 04 · COSTADO'},
      {p:V(-44,22,26),      t:V(10.5,1.2,-9),    name:'CAM 05 · AÉREA'},
      {p:V(-6,1.5,7),       t:V(318,66,-197),    name:'CAM 06 · CIELO · ESTRELLAS'}
    ],
    narrow:[
      {p:V(-6,4.6,22),      t:V(2,3.2,0),        name:'CAM 01 · ANDÉN'},
      {p:V(5,24,9),         t:V(9,2.4,-2),       name:'CAM 02 · CENITAL · PANELES'},
      {p:V(5,2.2,15),       t:V(10,3,-28),       name:'CAM 03 · LATERAL BAJA'},
      {p:V(3,2.6,11.5),     t:V(9.5,2.1,-1),     name:'CAM 04 · COSTADO'},
      {p:V(-52,30,30),      t:V(10,3,-9),        name:'CAM 05 · AÉREA'},
      {p:V(-9,1.8,10),      t:V(318,80,-197),    name:'CAM 06 · CIELO · ESTRELLAS'}
    ]
  };
  const NEXT=['PRE-HACKATÓN','VOLCÁN','PURMAMARCA','TILCARA','ÓRBITA','TILCARA'];

  let narrow=false;
  function resize(){
    const w=sticky.clientWidth,h=sticky.clientHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;
    narrow=w<760;camera.fov=narrow?52:34;camera.updateProjectionMatrix();
  }
  addEventListener('resize',resize);resize();

  let mx=0,my=0,cx=0,cy=0;
  addEventListener('pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;});

  // scroll → "shot" index as a float: 0 = hero, 1..4 = chapters (each chapter's centre)
  let shotF=0,stageVisible=true;
  function measure(){
    const vh=innerHeight;
    const centres=chapters.map(c=>{const r=c.getBoundingClientRect();return r.top+r.height/2-vh/2;});
    // centres[i] is how far chapter i's middle is from the viewport middle (px)
    let f=0;
    const first=centres[0];
    const heroSpan=first+scrollY>0?first+scrollY:vh; // distance from page top to chapter 1 centre
    if(first>0){f=1-first/heroSpan;}
    else{
      f=chapters.length;
      for(let i=0;i<chapters.length-1;i++){
        if(centres[i+1]>0){const span=centres[i+1]-centres[i];f=1+i+(-centres[i])/span;break;}
      }
    }
    const lastC=centres[centres.length-1];
    if(lastC<=0)f=chapters.length+Math.min(-lastC/vh,1);
    shotF=THREE.MathUtils.clamp(f,0,chapters.length+1);
  }
  addEventListener('scroll',measure,{passive:true});addEventListener('resize',measure);measure();
  if('IntersectionObserver' in window){new IntersectionObserver(e=>{stageVisible=e[0].isIntersecting;}).observe(stage);}

  const speedEl=document.getElementById('speed'),statusEl=document.getElementById('status'),statusText=document.getElementById('statusText');
  const nextEl=document.getElementById('next'),progEl=document.getElementById('prog'),camEl=document.getElementById('cam'),camText=document.getElementById('camText');
  const todEl=document.getElementById('tod');
  const boardEl=document.querySelector('.board');
  let boardSide='right'; // 'left' | 'right' | 'off' — 'off' leaves the stage clear for the big statement
  function boardApply(){
    if(boardEl.classList.contains('bye')||boardEl.classList.contains('hi'))return; // converges on animationend
    const off=boardSide==='off',isOff=boardEl.classList.contains('off');
    if(off===isOff&&(off||boardEl.classList.contains('le')===(boardSide==='left')))return;
    if(!off&&isOff){ // rematerialize on the target side, no need to dissolve what's already gone
      boardEl.classList.remove('off');
      boardEl.classList.toggle('le',boardSide==='left');
      boardEl.classList.add('hi');
      return;
    }
    boardEl.classList.add('bye');
  }
  function setBoardSide(s){boardSide=s;boardApply();}
  boardEl.addEventListener('animationend',()=>{
    if(boardEl.classList.contains('bye')){
      boardEl.classList.remove('bye');
      boardEl.classList.toggle('le',boardSide==='left');
      boardEl.classList.toggle('off',boardSide==='off');
      if(boardSide!=='off')boardEl.classList.add('hi');
    }else{
      boardEl.classList.remove('hi');
      boardApply(); // in case the target changed mid-animation
    }
  });
  const START=150,STOP=-1.5,DUR=6.5,CRUISE=15;
  let t0=performance.now(),last=t0,arrX=START,speed=0,travel=0,state='',lastShot=-1;
  const camPos=new THREE.Vector3(),camTgt=new THREE.Vector3(),wantPos=new THREE.Vector3(),wantTgt=new THREE.Vector3();
  let camInit=false;
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;

  /* day → night: the ride is one hackathon day — morning departure, night arrival */
  const SKY=[
    {t:0,   sky:['#79aed8','#a9cfe8','#d7e4e6','#ecdfbe','#f4c684','#f09a55'], sun:[-170,95],  sunC:0xffe9c2, glow:.7,  dir:[-110,70,-70], dirC:0xfff0d8, dirI:2.6, keyC:0xfff4e0, keyI:1.5,  keyP:[-55,20,30],  hs:0x9cc4e2, hg:0x8a7358, hi:1.0,  fog:0x93a8b2, night:0,   exp:1.06},
    {t:2,   sky:['#4d94d0','#82b9df','#bcd7e0','#dfd9c2','#eed09a','#eeb478'], sun:[0,150],    sunC:0xfff3da, glow:.55, dir:[20,120,-60],  dirC:0xfff6e8, dirI:2.7, keyC:0xffffff, keyI:1.35, keyP:[-18,60,26],  hs:0x9cbdd8, hg:0x8a7358, hi:1.0,  fog:0x93a6b0, night:0,   exp:1.06},
    {t:3.1, sky:['#35507a','#6a6a8a','#a0705a','#cd7a42','#e8904c','#f6a45e'], sun:[120,50],   sunC:0xffcf92, glow:.85, dir:[80,38,-75],   dirC:0xffd9a4, dirI:2.5, keyC:0xfff0d8, keyI:1.3,  keyP:[-24,30,25],  hs:0x7488ac, hg:0x5a4636, hi:.85,  fog:0x8a7268, night:.08, exp:1.08},
    {t:4.3, sky:['#03050b','#0a1122','#17233a','#5a2c2a','#c9502a','#ff8a4c'], sun:[230,18],   sunC:0xff7a3a, glow:1,   dir:[60,30,-80],   dirC:0xff9a5c, dirI:2.4, keyC:0xffe6cf, keyI:1.1,  keyP:[-20,26,24],  hs:0x3d5a8a, hg:0x1a0f0c, hi:.75,  fog:0x3a2230, night:.32, exp:1.05},
    {t:5.2, sky:['#020409','#060b1a','#0d1528','#1c2740','#2e3648','#3a4250'], sun:[250,-30],  sunC:0xff7a3a, glow:0,   dir:[-50,60,-40],  dirC:0x5a70a8, dirI:.55, keyC:0x93aad8, keyI:.5,   keyP:[-16,30,24],  hs:0x243352, hg:0x0a0908, hi:.5,   fog:0x0a1018, night:.85, exp:1.0},
    {t:6,   sky:['#010204','#04070f','#080f1c','#0d1524','#141c2c','#1a2333'], sun:[260,-70],  sunC:0xff7a3a, glow:0,   dir:[-50,60,-40],  dirC:0x4a5f98, dirI:.4,  keyC:0x7f9bc8, keyI:.4,   keyP:[-16,30,24],  hs:0x1a2640, hg:0x05060a, hi:.45,  fog:0x05080f, night:1,   exp:.97},
  ];
  const PCT=[0,26,46,68,84,100];
  SKY.forEach(k=>{k.skyC=k.sky.map(h=>new THREE.Color(h));k.sunCC=new THREE.Color(k.sunC);k.dirCC=new THREE.Color(k.dirC);k.keyCC=new THREE.Color(k.keyC);k.hsCC=new THREE.Color(k.hs);k.hgCC=new THREE.Color(k.hg);k.fogCC=new THREE.Color(k.fog);});
  const _c=new THREE.Color(),LN=(a,b,f)=>a+(b-a)*f;
  let lastGrad='',nightK=0;
  function applySky(dt_,t){
    let i=0;while(i<SKY.length-2&&dt_>=SKY[i+1].t)i++;
    const a=SKY[i],b=SKY[i+1],f=THREE.MathUtils.clamp((dt_-a.t)/(b.t-a.t),0,1);
    let g='linear-gradient(180deg';
    for(let j=0;j<6;j++)g+=',#'+_c.copy(a.skyC[j]).lerp(b.skyC[j],f).getHexString()+' '+PCT[j]+'%';
    g+=')';if(g!==lastGrad){lastGrad=g;sticky.style.background=g;}
    sun.position.set(LN(a.sun[0],b.sun[0],f),LN(a.sun[1],b.sun[1],f),-205);
    sun.material.color.copy(a.sunCC).lerp(b.sunCC,f);
    glow.position.set(sun.position.x,sun.position.y,-204);
    glow.material.opacity=LN(a.glow,b.glow,f)*(.85+.15*Math.sin(t*.8));
    sunLight.color.copy(a.dirCC).lerp(b.dirCC,f);sunLight.intensity=LN(a.dirI,b.dirI,f);
    sunLight.position.set(LN(a.dir[0],b.dir[0],f),LN(a.dir[1],b.dir[1],f),LN(a.dir[2],b.dir[2],f));
    key.color.copy(a.keyCC).lerp(b.keyCC,f);key.intensity=LN(a.keyI,b.keyI,f);
    key.position.set(LN(a.keyP[0],b.keyP[0],f),LN(a.keyP[1],b.keyP[1],f),LN(a.keyP[2],b.keyP[2],f));
    hemi.color.copy(a.hsCC).lerp(b.hsCC,f);hemi.groundColor.copy(a.hgCC).lerp(b.hgCC,f);hemi.intensity=LN(a.hi,b.hi,f);
    scene.fog.color.copy(a.fogCC).lerp(b.fogCC,f);
    renderer.toneMappingExposure=LN(a.exp,b.exp,f);
    nightK=THREE.MathUtils.smoothstep(LN(a.night,b.night,f),.05,.9);
  }

  function setState(s){if(s===state)return;state=s;
    statusEl.classList.toggle('docked',s==='docked');
    statusText.textContent=s==='arriving'?'LLEGANDO':s==='docked'?'EN ANDÉN · ABORDANDO':'EN VIAJE';}

  function frame(now){
    requestAnimationFrame(frame);
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!stageVisible)return;
    const t=(now-t0)/1000;

    // 1) arrival, then cruise driven by scroll
    const k=reduce?1:Math.min(t/DUR,1);
    const newArr=START+(STOP-START)*(1-Math.pow(1-k,3));
    const arrV=(arrX-newArr)/Math.max(dt,1e-3);arrX=newArr;
    train.position.x=arrX;
    const wantSpeed=(k>=1&&shotF>.35&&!reduce)?CRUISE:0;
    speed+=(wantSpeed-speed)*Math.min(dt*.9,1);
    travel+=speed*dt;
    const v=k<1?arrV:speed;
    setState(k<1?'arriving':(speed>.4?'moving':'docked'));
    speedEl.textContent=Math.round(v*1.6)+' km/h';

    // scenery slides toward +x (train runs toward −x)
    placeSleepers(travel%1);
    platform.position.x=((travel+120)%LOOP+LOOP)%LOOP-120;
    props.forEach(o=>{let x=((o.userData.base-LOOP0+travel)%LOOP+LOOP)%LOOP+LOOP0;o.position.x=x;});
    wheels.forEach(w=>w.rotation.y-=v*dt*3.3);
    train.position.y=v>.5?Math.sin(t*28)*.012:0;

    // floating objects
    const tt=reduce?0:t;
    slashes.forEach(s=>{s.position.y=s.userData.by+Math.sin(tt*s.userData.sp+s.userData.ph)*.6;if(!reduce)s.rotation.y+=.004*s.userData.sp;s.rotation.x=Math.sin(tt*.4+s.userData.ph)*.25;});
    ring.rotation.y=Math.sin(tt*.3)*.5;ring.rotation.x=Math.cos(tt*.25)*.2;
    ring2.rotation.y=-Math.sin(tt*.22)*.6;ring2.rotation.x=.3+Math.sin(tt*.3)*.15;
    if(!reduce){const a=pg.attributes.position.array;for(let i=0;i<N;i++){a[i*3+1]+=pv[i]*.02;a[i*3]+=(speed*.02-.01);if(a[i*3+1]>32)a[i*3+1]=0;if(a[i*3]>100)a[i*3]-=140;}pg.attributes.position.needsUpdate=true;}

    // space: twinkle, rocket launch cycle, light speed — all fades in as night falls
    applySky(shotF,t);
    bright.material.opacity=(.75+.25*Math.sin(tt*2.3))*nightK;
    pring.rotation.z=.2+tt*.01;
    planet.material.opacity=nightK;moon.material.opacity=nightK;
    pglow.material.opacity=.55*nightK;pring.material.opacity=.22*nightK;pring2.material.opacity=.5*nightK;
    dust.material.opacity=.15+.7*nightK;beams.forEach(b=>b.intensity=.3+2.2*nightK);
    lampW.opacity=lampR.opacity=.35+.65*nightK; // lamps, cabin light and laptop screens glow as night falls
    innerMat.color.copy(innerBase).multiplyScalar(.8+.2*nightK);scrMat.color.copy(scrBase).multiplyScalar(.5+.5*nightK);
    const cyc=reduce?.55:(t%24)/15;
    if(cyc<=1){
      rocket.visible=nightK>.2;rocketAt(cyc);rocket.position.copy(rp);rocket.quaternion.setFromUnitVectors(UP,rv);
      flameMat.opacity=.85+.15*Math.sin(t*40);
      padGlow.material.opacity=Math.max(0,1-cyc*5)*nightK;
      if(t-lastTrail>.06&&trailN<TRAIL){trailPos.set([rp.x,rp.y,rp.z],trailN*3);trailN++;trailGeo.setDrawRange(0,trailN);trailGeo.attributes.position.needsUpdate=true;lastTrail=t;}
      trailLine.material.opacity=.8*nightK;smoke.material.opacity=.18*nightK;
    }else{
      rocket.visible=false;padGlow.material.opacity=0;
      trailLine.material.opacity=Math.max(0,trailLine.material.opacity-dt*.25);smoke.material.opacity=trailLine.material.opacity*.22;
      if(trailLine.material.opacity<=0&&trailN){trailN=0;trailGeo.setDrawRange(0,0);}
    }
    // the star-rain warp is the climax of the last chapter ("un viaje"), not a separate stop
    const w=THREE.MathUtils.smoothstep(shotF,chapters.length-.6,chapters.length+.1);
    warp.visible=w>.01;
    if(warp.visible){
      const len=1+w*55;
      for(let i=0;i<WN;i++){
        let z=warpSeed[i*3+2]+(reduce?0:dt*(60+w*420));if(z>0)z-=220;warpSeed[i*3+2]=z;
        const x=warpSeed[i*3],y=warpSeed[i*3+1];
        warpPos.set([x,y,z,x,y,z-len],i*6);
      }
      warpGeo.attributes.position.needsUpdate=true;warpMat.opacity=w;
    }
    flashEl.style.opacity=(Math.max(0,w-.85)*2.4).toFixed(2); // bloom on exit, keep the statement readable
    stars.material.opacity=bright.material.opacity*(1-w*.7);
    hudEl.classList.toggle('on',shotF>chapters.length-.5);
    if(w>.5){statusText.textContent='VIAJE NOCTURNO';speedEl.textContent='LUZ';state='';}
    const baseFov=narrow?52:34,fv=baseFov+w*22;if(Math.abs(camera.fov-fv)>.05){camera.fov=fv;camera.updateProjectionMatrix();}

    // 2) camera: blend between shots (hold near each chapter, move between them)
    const shots=SHOTS[narrow?'narrow':'wide'];
    const i0=Math.min(Math.floor(shotF),shots.length-1),i1=Math.min(i0+1,shots.length-1);
    let f=shotF-i0; f=THREE.MathUtils.clamp((f-.18)/.64,0,1); f=ease(f);
    wantPos.lerpVectors(shots[i0].p,shots[i1].p,f);
    wantTgt.lerpVectors(shots[i0].t,shots[i1].t,f);
    // slow drift + mouse parallax so every angle keeps breathing
    const drift=reduce?0:Math.sin(t*.25);
    wantPos.x+=drift*1.2+cx*3.5; wantPos.y+=-cy*1.6+Math.cos(t*.2)*(reduce?0:.4);
    cx+=(mx-cx)*.04;cy+=(my-cy)*.04;
    line.localToWorld(wantPos);line.localToWorld(wantTgt);
    if(!camInit){camPos.copy(wantPos);camTgt.copy(wantTgt);camInit=true;}
    const damp=Math.min(dt*4,1);
    camPos.lerp(wantPos,damp);camTgt.lerp(wantTgt,damp);
    camera.position.copy(camPos);camera.lookAt(camTgt);

    // HUD
    const shot=Math.round(shotF);
    if(shot!==lastShot){lastShot=shot;camText.textContent=shots[Math.min(shot,shots.length-1)].name;nextEl.textContent=NEXT[Math.min(shot,NEXT.length-1)];camEl.classList.toggle('on',shotF>.5);
      const ch=chapters[shot-1];setBoardSide(shot>chapters.length?'off':!ch?'right':ch.classList.contains('center')?'off':ch.classList.contains('right')?'left':'right');}
    progEl.style.width=(Math.min(shotF/chapters.length,1)*100).toFixed(1)+'%';
    // the platform clock runs on hackathon time: 08:00 departure → ~23:30 arrival
    const hr=8+shotF/(chapters.length+1)*15.5;
    clock.textContent=String(Math.floor(hr)).padStart(2,'0')+':'+String(Math.floor((hr%1)*60)).padStart(2,'0');
    const tod=hr<12?'MAÑANA':hr<20?'TARDE':'NOCHE';
    if(todEl.textContent!==tod)todEl.textContent=tod;

    renderer.render(scene,camera);
  }
  requestAnimationFrame(frame);
})();

/* ---------- snap scroll: inside the stage each wheel tick glides to the next stop ---------- */
(function(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const stage=document.querySelector('.stage');
  const stops=[...document.querySelectorAll('.chapter')];
  let busy=false,restAt=0;

  function targets(){
    const vh=innerHeight,y=scrollY;
    const t=[y+stage.getBoundingClientRect().top]; // hero = stage top
    stops.forEach(c=>{const r=c.getBoundingClientRect();t.push(y+r.top+r.height/2-vh/2);});
    return t; // the last stop is the closing chapter — after it the page flows on its own
  }
  function glide(to){
    const from=scrollY,d=to-from,t0=performance.now();
    const dur=Math.min(880,400+Math.abs(d)*.26);
    busy=true;
    (function step(now){
      const p=Math.min((now-t0)/dur,1),e=p<.5?4*p*p*p:1-Math.pow(-2*p+2,3)/2;
      scrollTo({top:from+d*e,behavior:'instant'});
      if(p<1)requestAnimationFrame(step);else{busy=false;restAt=performance.now();}
    })(t0);
  }
  function hop(dir){
    const y=scrollY,ts=targets(),n=ts.length;
    if(y<ts[0]-2||y>ts[n-1]+2)return false;
    let idx=-1;
    if(dir>0){for(let i=0;i<n;i++)if(ts[i]>y+4){idx=i;break;}}
    else{for(let i=n-1;i>=0;i--)if(ts[i]<y-4){idx=i;break;}}
    if(idx<0)return false;
    glide(ts[idx]);return true;
  }
  const lock=()=>busy||performance.now()-restAt<280;
  addEventListener('wheel',e=>{
    if(e.ctrlKey||!e.deltaY)return; // pinch-zoom and horizontal pans stay native
    if(lock()){e.preventDefault();return;}
    // mouse-wheel notches (line mode or ≥40px per event) glide stop-to-stop;
    // small pixel deltas are a trackpad pan — let it scroll natively
    if(e.deltaMode===0&&Math.abs(e.deltaY)<40)return;
    if(hop(Math.sign(e.deltaY)))e.preventDefault();
  },{passive:false});
  addEventListener('keydown',e=>{
    if(e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable],a[href],button'))return;
    const dir={ArrowDown:1,PageDown:1,' ':1,ArrowUp:-1,PageUp:-1}[e.key];
    if(!dir)return;
    if(lock()){e.preventDefault();return;}
    if(hop(dir))e.preventDefault();
  });
})();

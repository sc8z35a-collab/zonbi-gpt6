'use strict';
/* Procedural world: every surface, structure and character is rendered locally. */
window.DZWorld = (() => {
  if (!window.THREE) return null;
  const T = THREE;
  const mobile = matchMedia('(pointer: coarse)').matches;
  const scene = new T.Scene();
  scene.background = new T.Color(0x74786a);
  scene.fog = new T.FogExp2(0x737e70, .022);
  const camera = new T.PerspectiveCamera(62, innerWidth / innerHeight, .08, 230);
  camera.position.set(4, 2.5, 21);
  camera.rotation.order = 'YXZ';
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: new URLSearchParams(location.search).get('capture')==='1' });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  document.getElementById('game-world').appendChild(renderer.domElement);
  let seed = 47219;
  function rand(a = 0, b = 1) { seed = (seed * 16807) % 2147483647; return a + (seed / 2147483647) * (b - a); }
  const staticGroup = new T.Group(); scene.add(staticGroup);
  const obstacles = [], buildings = [];
  const detailCounts = {propMultiplier:5,barrels:120,sidewalkDebris:600,roadScatter:350,vegetation:800,puddles:90};
  const mat = (color, roughness = .85, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
  const concrete = mat(0x727364), concreteDark = mat(0x454f46), rust = mat(0x73503b,.9,.35), metal = mat(0x343e37,.65,.65), black = mat(0x141c1b), wood = mat(0x655344), roadPaint = mat(0xb8ad7c), sand = mat(0x8a8262), debrisMat = mat(0x626255), leafMat = mat(0x4a5238);
  const boxGeo = new T.BoxGeometry(1,1,1);
  function box(w,h,d, material,x=0,y=0,z=0,parent=staticGroup){ const m = new T.Mesh(boxGeo,material);m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m; }
  function cylinder(rt,rb,h,material,x,y,z,parent=staticGroup,segments=8){const m=new T.Mesh(new T.CylinderGeometry(rt,rb,h,segments),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function beam(a,b,r,material,parent=staticGroup){const av=new T.Vector3(...a),bv=new T.Vector3(...b);const m=cylinder(r,r,av.distanceTo(bv),material,0,0,0,parent,6);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return m;}
  function textureCanvas(size,paint){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=renderer.capabilities.getMaxAnisotropy();return tx;}
  const asphaltTx=textureCanvas(512,(c,s)=>{c.fillStyle='#454a43';c.fillRect(0,0,s,s);for(let i=0;i<22000;i++){const g=Math.floor(rand(36,100));c.fillStyle=`rgba(${g},${g+4},${g},.35)`;c.fillRect(rand(0,s),rand(0,s),rand(1,3),rand(1,3));}for(let i=0;i<30;i++){let x=rand(0,s),y=rand(0,s);c.strokeStyle='#242e26';c.lineWidth=rand(.3,1.4);c.beginPath();c.moveTo(x,y);for(let j=0;j<9;j++){x+=rand(-14,14);y+=rand(0,15);c.lineTo(x,y);}c.stroke();}});asphaltTx.wrapS=asphaltTx.wrapT=T.RepeatWrapping;asphaltTx.repeat.set(8,30);
  const roadMat=new T.MeshStandardMaterial({map:asphaltTx,bumpMap:asphaltTx,bumpScale:.045,roughnessMap:asphaltTx,roughness:.82,color:0x9a9e8c});
  box(160,.2,210,roadMat,0,-.12,-45);
  box(5,.24,135,concrete,-12,.03,-25);box(5,.24,135,concrete,12,.03,-25);
  for(let z=-95;z<40;z+=7){box(.11,.012,3,roadPaint,-.15,.002,z);box(.11,.012,3,roadPaint,.15,.002,z);}
  for(let x=-7;x<8;x+=2)box(1,.015,4,concrete,x,.007,-16);
  for(let z=-90;z<40;z+=2.5){box(.18,.29,2.3,concreteDark,-9.45,.01,z);box(.18,.29,2.3,concreteDark,9.45,.01,z);}
  // A weathered facade atlas, including cracked masonry and dark window interiors.
  const facades=[];
  ['#787867','#717568','#6e756a','#8b8270','#69716c'].forEach(base=>{
    const tx=textureCanvas(512,(c,s)=>{c.fillStyle=base;c.fillRect(0,0,s,s);for(let i=0;i<18000;i++){c.fillStyle=rand()>.45?'rgba(17,28,22,.07)':'rgba(225,211,166,.06)';c.fillRect(rand(0,s),rand(0,s),rand(1,5),rand(1,9));}for(let y=0;y<s;y+=64){c.fillStyle='#414b4140';c.fillRect(0,y,s,2);for(let x=0;x<s;x+=64){c.fillStyle='#343e36';c.fillRect(x+11,y+10,40,43);c.fillStyle=rand()>.85?'#9b9370':'#23322e';c.fillRect(x+14,y+13,34,37);c.fillStyle='#a1a18a';c.fillRect(x+10,y+52,43,3);c.fillStyle='#747b68';c.fillRect(x+29,y+12,2,40);c.fillRect(x+12,y+31,38,2);if(rand()>.5){c.fillStyle='#162822';c.beginPath();c.moveTo(x+15,y+14);c.lineTo(x+28,y+22);c.lineTo(x+17,y+47);c.closePath();c.fill();}c.fillStyle='#26382b30';c.fillRect(x+9,y+55,44,rand(4,12));}}for(let i=0;i<60;i++){c.fillStyle='#1a312c16';c.fillRect(rand(0,s),rand(0,s),rand(2,10),rand(30,160));}});
    facades.push(new T.MeshStandardMaterial({map:tx,roughness:.97,color:0xa1a494}));
  });
  function textSign(text,sub,w,h,color='#c6bea0',bg='#344437'){
    const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=256;const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,1024,256);c.strokeStyle=color;c.globalAlpha=.4;c.lineWidth=8;c.strokeRect(10,10,1004,236);c.globalAlpha=1;c.fillStyle=color;c.font='bold 100px sans-serif';c.textAlign='center';c.fillText(text,512,135);c.font='25px sans-serif';c.fillText(sub,512,201);for(let i=0;i<300;i++){c.fillStyle='#07191130';c.fillRect(rand(0,1024),rand(0,256),rand(1,25),rand(1,7));}const tx=new T.CanvasTexture(canvas);tx.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,roughness:.85,side:T.DoubleSide}));
  }
  // Tall, uneven urban canyon with external structural detail.
  for(let side of [-1,1]){
    for(let i=0;i<10;i++){
      const z=27-i*14.5,w=rand(8,13),h=rand(13,32),d=rand(11,14),x=side*(10.4+w/2);
      buildings.push({x,z,w,h,d,side});
      box(w,h,d,facades[(i+(side===1?2:0))%5],x,h/2,z);
      box(w+.35,.4,d+.4,concreteDark,x,h+.1,z);
      box(w,.6,d,concreteDark,x,3.2,z);
      box(.4,h,.4,concreteDark,side*10.25,h/2,z-d/2+.2);
      for(let f=5;f<h;f+=3.7)box(w+.12,.15,d+.12,concreteDark,x,f,z);
      // Ground-floor shutter bays face the road.
      for(let q=-1;q<=1;q++){
        box(.08,2.3,3.2,metal,side*10.35,1.5,z+q*3.8);
        for(let k=.5;k<2.7;k+=.24)box(.13,.04,3.15,rust,side*10.28,k,z+q*3.8);
        if(rand()>.55){for(let b=0;b<2;b++){const plank=box(.15,.2,3.4,wood,side*10.15,1.1+b*.85,z+q*3.8);plank.rotation.x=(b?1:-1)*.23;}}
      }
      for(let j=0;j<4;j++){const b=box(rand(.7,2),rand(.2,.7),rand(.8,2.4),concreteDark,x+rand(-w/3,w/3),h+.6,z+rand(-d/3,d/3));b.rotation.y=rand(0,3);}
      if(i%2===0){cylinder(.09,.09,4,metal,x,h+2,z);beam([x-1,h+3,z],[x+1,h+3,z],.04,metal);}
      if(i===1||i===3){const sign=textSign(i===1?(side===1?'EVACUATE':'LAST STOP'):'NO SIGNAL',i===1?'QUARANTINE ZONE — KEEP OUT':'EMERGENCY NETWORK OFFLINE',7,1.65);sign.position.set(side*10.2,4.2,z);sign.rotation.y=side===1?-Math.PI/2:Math.PI/2;staticGroup.add(sign);}
      if(i===2&&side===1){for(let f=7;f<h-1;f+=3.7){box(1.3,.15,5,metal,9.7,f,z);for(let j=-2;j<=2;j++)beam([9.1,f,z+j],[9.1,f+1,z+j],.025,metal);beam([9.1,f+1,z-2.5],[9.1,f+1,z+2.5],.04,metal);}}
    }
  }
  for(let i=0;i<35;i++){const x=rand(-85,85),h=rand(15,65),z=rand(-165,-125);box(rand(8,17),h,rand(8,15),facades[i%5],x,h/2,z);}
  // Distant cross-street arch and bold quarantine billboard.
  box(25,1.1,1.3,rust,0,8.3,-57);box(.45,8,.45,metal,-9,4,-57);box(.45,8,.45,metal,9,4,-57);
  const warning=textSign('DEAD ZONE','RESTRICTED AREA   /   NO ENTRY   /   SECTOR 07',13,2.5,'#c9ba86','#404a3b');warning.position.set(0,7.5,-56.25);staticGroup.add(warning);
  const hazardMat=(()=>{const tx=textureCanvas(128,(c)=>{c.fillStyle='#373b31';c.fillRect(0,0,128,128);c.fillStyle='#a79155';for(let x=-128;x<256;x+=64){c.beginPath();c.moveTo(x,0);c.lineTo(x+32,0);c.lineTo(x+160,128);c.lineTo(x+128,128);c.fill();}for(let i=0;i<600;i++){c.fillStyle='#26372a44';c.fillRect(rand(0,128),rand(0,128),rand(1,5),rand(1,7));}});return new T.MeshStandardMaterial({map:tx,roughness:.8});})();
  function barricade(x,z,angle=0){const g=new T.Group();staticGroup.add(g);g.position.set(x,0,z);g.rotation.y=angle;box(3.2,.85,.65,concrete,0,.42,0,g);box(3.4,.2,.95,concreteDark,0,.1,0,g);box(3,.38,.67,hazardMat,0,.64,0,g);obstacles.push({x,z,r:1.7});}
  barricade(-5,-7,-.1);barricade(5,-33,.12);barricade(-5,-55,.08);barricade(6,31);
  function car(x,z,angle,color){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;staticGroup.add(g);const bodyMat=mat(color,.78,.38);box(1.9,.55,4.4,bodyMat,0,.65,0,g);box(1.65,.65,2.1,bodyMat,0,1.15,-.2,g);box(1.68,.46,1.95,black,0,1.3,-.2,g);box(1.7,.1,2.15,bodyMat,0,1.65,-.2,g);for(let side of [-1,1]){box(.08,.55,.15,bodyMat,side*.86,1.35,-.3,g);for(let end of [-1,1]){const wheel=cylinder(.4,.4,.23,black,side*.98,.42,end*1.4,g,12);wheel.rotation.z=Math.PI/2;const rim=cylinder(.2,.2,.24,rust,side*1.01,.42,end*1.4,g,8);rim.rotation.z=Math.PI/2;}box(.2,.07,.32,metal,side*.93,.94,.7,g);}box(1.9,.14,.16,rust,0,.43,2.2,g);box(1.5,.26,.04,black,0,.7,2.23,g);const lamp=mat(0xaea779);box(.4,.22,.08,lamp,-.65,.8,2.24,g);box(.4,.22,.08,lamp,.65,.8,2.24,g);const hood=box(1.85,.09,1.2,rust,0,.99,1.5,g);hood.rotation.x=-.13;for(let i=0;i<12;i++)box(rand(.1,.35),.013,rand(.1,.45),rust,rand(-.7,.7),1.7,rand(-1,.7),g);obstacles.push({x,z,r:2.45});return g;}
  car(-6.9,5,-.22,0x536053);car(6.6,-15,.25,0x7b7358);car(-6.6,-36,2.9,0x384c47);car(6.8,18,-.6,0x64564b);car(4,-64,.4,0x586455);
  const lampGlow = new T.MeshStandardMaterial({color:0xffd093,emissive:0xffa851,emissiveIntensity:3});
  for(let z=23;z>-90;z-=23){for(let side of [-1,1]){const x=side*9.1;cylinder(.1,.18,6.5,metal,x,3.25,z);beam([x,6.5,z],[x-side*2,6.9,z],.075,metal);box(.4,.15,.9,metal,x-side*2,6.87,z);box(.3,.04,.65,lampGlow,x-side*2,6.78,z);if(z>-35){const l=new T.PointLight(0xffb567,12,13,2);l.position.set(x-side*2,6.4,z);scene.add(l);}}}
  // Sagging power cables cut across the street.
  for(let z=-5;z>-90;z-=25){for(let j=0;j<3;j++){const pts=[];for(let k=0;k<=16;k++){const x=-12+k*1.5;pts.push(new T.Vector3(x,10+j*.32-2*Math.sin(k/16*Math.PI),z+j*.5));}const curve=new T.CatmullRomCurve3(pts);const m=new T.Mesh(new T.TubeGeometry(curve,24,.027,4,false),black);staticGroup.add(m);}}
  function barrel(x,z){cylinder(.38,.38,.95,rust,x,.5,z,staticGroup,12);cylinder(.4,.4,.04,metal,x,.12,z);cylinder(.4,.4,.04,metal,x,.87,z);box(.14,.3,.01,roadPaint,x,.5,z+.385);}
  for(let i=0;i<detailCounts.barrels;i++)barrel((i%2?1:-1)*rand(7.7,9),rand(-82,34));
  for(let i=0;i<detailCounts.sidewalkDebris;i++){const side=i%2?1:-1,x=side*rand(7.4,10),z=rand(-90,35);const b=box(rand(.15,.85),rand(.08,.45),rand(.15,.65),i%3===0?rust:debrisMat,x,.12,z);b.rotation.set(rand(-.4,.4),rand(0,6),rand(-.4,.4));}
  for(let i=0;i<detailCounts.roadScatter;i++){const x=rand(-9,9),z=rand(-85,35);if(i%4===0){const p=box(rand(.15,.4),.009,rand(.18,.5),sand,x,.012,z);p.rotation.y=rand(0,6);}else{const b=box(rand(.08,.25),rand(.05,.13),rand(.1,.3),debrisMat,x,.04,z);b.rotation.y=rand(0,6);}}
  // Scrubby vegetation, multiple thin stalks and weathered rubble along sidewalks.
  for(let i=0;i<detailCounts.vegetation;i++){const x=(i%2?1:-1)*rand(8.9,10),z=rand(-90,37);for(let k=0;k<3;k++){const b=box(.04,rand(.18,.55),.018,leafMat,x+rand(-.15,.15),.18,z+rand(-.15,.15));b.rotation.z=rand(-.45,.45);}}
  const puddleMat = new T.MeshStandardMaterial({color:0x68776f,roughness:.13,metalness:.8,transparent:true,opacity:.45});
  for(let i=0;i<detailCounts.puddles;i++){const p=new T.Mesh(new T.CircleGeometry(rand(.5,2),12),puddleMat);p.rotation.x=-Math.PI/2;p.scale.y=rand(1,2.5);p.position.set(rand(-8,8),.011,rand(-65,35));staticGroup.add(p);}
  // Sandbag checkpoint.
  for(let row=0;row<3;row++)for(let n=0;n<6-row;n++){const b=box(.8,.26,.5,sand,-8+n*.72+row*.3,.18+row*.25,-22);b.rotation.y=rand(-.15,.15);}
  const stencil=textSign('STOP','INFECTED BEYOND THIS POINT',2.3,1.3,'#ccb98c','#643f2e');stencil.position.set(-6,1.9,-7);stencil.rotation.y=.08;staticGroup.add(stencil);beam([-6,.5,-7.1],[-6,2.5,-7.1],.055,rust);
  // Lighting and atmospheric sky.
  const hemi=new T.HemisphereLight(0xb4c5b3,0x31342b,2.3);scene.add(hemi);
  const sun=new T.DirectionalLight(0xffd0a0,3.3);sun.position.set(-22,38,-65);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);sun.shadow.radius=2;sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=40;sun.shadow.camera.bottom=-40;sun.shadow.camera.near=1;sun.shadow.camera.far=130;sun.shadow.bias=-.0005;sun.shadow.normalBias=.06;sun.target.position.set(0,0,-18);scene.add(sun,sun.target);
  const skyGeo=new T.SphereGeometry(200,24,16);const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color(0x334d4b)},bottom:{value:new T.Color(0xc3ab7e)}},vertexShader:'varying vec3 vPos; void main(){vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',fragmentShader:'varying vec3 vPos; uniform vec3 top; uniform vec3 bottom; void main(){float h=normalize(vPos).y; vec3 c=mix(bottom,top,smoothstep(-0.03,0.65,h)); float clouds=sin(vPos.x*.05+sin(vPos.z*.07)*2.0)*sin(vPos.z*.03+vPos.y*.04); c+=clouds*.018; gl_FragColor=vec4(c,1.0); }'});const sky=new T.Mesh(skyGeo,skyMat);scene.add(sky);
  const sunBall=new T.Mesh(new T.SphereGeometry(4.5,24,16),new T.MeshBasicMaterial({color:0xffd2a0,fog:false}));sunBall.position.set(-42,48,-170);scene.add(sunBall);
  // Merge static draw calls by material; retain independent animated models.
  function mergeStatic(group){
    group.updateMatrixWorld(true);const buckets=new Map();group.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material).push(g);});
    const merged=new T.Group();buckets.forEach((gs,material)=>{const attrs={};['position','normal','uv'].forEach(name=>{const size=name==='uv'?2:3;const count=gs.reduce((n,g)=>n+g.attributes.position.count,0);const arr=new Float32Array(count*size);let offset=0;gs.forEach(g=>{if(g.attributes[name])arr.set(g.attributes[name].array,offset);offset+=g.attributes.position.count*size;});attrs[name]=new T.BufferAttribute(arr,size);});const geometry=new T.BufferGeometry();Object.entries(attrs).forEach(([n,a])=>geometry.setAttribute(n,a));const m=new T.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;merged.add(m);gs.forEach(g=>g.dispose());});scene.remove(group);scene.add(merged);return merged;
  }
  Object.assign(detailCounts,window.DZUrbanDetail({T,scene,renderer,staticGroup,box,cylinder,beam,mat,textureCanvas,rand,buildings,materials:{metal,rust,black,wood,concreteDark,sand}}));
  mergeStatic(staticGroup);
  // Floating ash and volumetric-looking smoke sprites, generated without image assets.
  const smokeTx=textureCanvas(128,(c,s)=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(180,182,156,.3)');g.addColorStop(.35,'rgba(146,160,143,.16)');g.addColorStop(1,'rgba(100,130,111,0)');c.fillStyle=g;c.fillRect(0,0,s,s);});
  const smoke=[];for(let i=0;i<17;i++){const m=new T.SpriteMaterial({map:smokeTx,color:0x677168,transparent:true,opacity:rand(.2,.65),depthWrite:false});const s=new T.Sprite(m);s.position.set(rand(-7,7),rand(.3,3.5),rand(-80,5));s.scale.set(rand(9,20),rand(3,7),1);scene.add(s);smoke.push(s);}
  const ashCount=1750;const ashPositions=new Float32Array(ashCount*3);for(let i=0;i<ashCount;i++){ashPositions[i*3]=rand(-15,15);ashPositions[i*3+1]=rand(.1,22);ashPositions[i*3+2]=rand(-80,32);}const ashGeometry=new T.BufferGeometry();ashGeometry.setAttribute('position',new T.BufferAttribute(ashPositions,3));const ash=new T.Points(ashGeometry,new T.PointsMaterial({color:0xd2cfaa,size:.035,transparent:true,opacity:.55,depthWrite:false}));scene.add(ash);
  // Fire lights near the wreck: emissive, animated, feathered sprites.
  const fireTx=textureCanvas(128,(c,s)=>{const g=c.createRadialGradient(64,76,2,64,64,60);g.addColorStop(0,'rgba(255,235,146,1)');g.addColorStop(.2,'rgba(255,165,50,.9)');g.addColorStop(.5,'rgba(230,70,12,.25)');g.addColorStop(1,'rgba(120,20,0,0)');c.fillStyle=g;c.fillRect(0,0,s,s);});
  const fires=[];for(let i=0;i<7;i++){const f=new T.Sprite(new T.SpriteMaterial({map:fireTx,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));f.position.set(6.6+rand(-.6,.6),1+rand(0,.5),-13.2+rand(-.7,.7));f.scale.set(.7,1.5,1);scene.add(f);fires.push(f);}const fireLight=new T.PointLight(0xff762f,25,12,2);fireLight.position.set(6.5,2,-13.2);scene.add(fireLight);
  const tiers=[
    {name:'徘徊者',en:'WALKER',hp:75,speed:1.12,damage:9,reward:40,color:0x92947a,cloth:0x4b5a52,scale:1,hex:'#a7b58b',desc:'街をさまよう初期感染体。動きは遅いが、集団になると脅威。'},
    {name:'疾走者',en:'RUNNER',hp:115,speed:2.05,damage:13,reward:85,color:0x93916c,cloth:0x6b5942,scale:.96,hex:'#d2b86e',desc:'変異した筋肉を持つ俊敏な感染体。距離を取り、素早く仕留めろ。'},
    {name:'装甲兵',en:'ARMORED',hp:280,speed:.95,damage:21,reward:180,color:0x747e70,cloth:0x43514e,scale:1.14,hex:'#70afac',desc:'防護装備に身を包んだ元兵士。頑丈な胴体より頭部を狙え。'},
    {name:'破壊者',en:'BRUTE',hp:560,speed:1.32,damage:30,reward:350,color:0x81755e,cloth:0x523f35,scale:1.45,hex:'#d98753',desc:'異常発達した巨体で迫る危険個体。一撃が重く、接近は厳禁。'},
    {name:'暴君',en:'TYRANT',hp:1200,speed:1.7,damage:43,reward:800,color:0x5c7464,cloth:0x353d38,scale:1.75,hex:'#c46c62',desc:'隔離区域の頂点に立つ最終変異体。最大火力と十分な強化が必要。'}
  ];
  const eyeMats=tiers.map((t,i)=>new T.MeshStandardMaterial({color:i>=3?0xff8951:0xdfc995,emissive:i>=3?0xff4a14:0xf1b958,emissiveIntensity:3}));
  const zombieMats=tiers.map(t=>({skin:mat(t.color),cloth:mat(t.cloth),wound:mat(0x493528),boot:mat(0x2b3029),bone:mat(0xb5ac89)}));
  function createLegacyZombie(tierIndex,x,z){
    const t=tiers[tierIndex],m=zombieMats[tierIndex],root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(t.scale);scene.add(root);
    const torso=new T.Group();torso.position.y=1.08;root.add(torso);
    box(.52,.66,.3,m.cloth,0,.17,0,torso);box(.45,.16,.29,m.wound,0,-.13,.012,torso);box(.51,.11,.32,m.boot,0,-.08,0,torso);
    box(.07,.55,.012,m.boot,0,.19,.159,torso);box(.12,.13,.024,m.cloth,-.15,.31,.17,torso);
    cylinder(.075,.1,.13,m.skin,0,.57,0,torso);
    const head=new T.Group();head.position.set(0,.77,.035);head.rotation.z=.1;torso.add(head);
    const skull=new T.Mesh(new T.SphereGeometry(.22,8,7),m.skin);skull.scale.set(.85,1.15,.85);skull.castShadow=true;head.add(skull);
    box(.26,.13,.28,m.skin,0,-.16,.03,head);box(.2,.045,.025,m.wound,0,-.13,.18,head);box(.045,.11,.07,m.skin,0,-.015,.18,head);
    for(const side of [-1,1]){box(.075,.058,.03,m.boot,side*.087,.046,.174,head);box(.038,.027,.033,eyeMats[tierIndex],side*.087,.05,.19,head);box(.05,.09,.055,m.skin,side*.19,0,0,head);}
    box(.065,.11,.015,m.wound,.08,.14,.15,head);box(.1,.15,.02,m.wound,-.13,-.02,.1,head);
    if(tierIndex===2){const helmet=new T.Mesh(new T.SphereGeometry(.242,8,5,0,Math.PI*2,0,Math.PI*.55),m.cloth);helmet.position.y=.015;head.add(helmet);box(.6,.48,.13,metal,0,.24,.19,torso);for(let a=-1;a<=1;a++)box(.13,.18,.12,m.cloth,a*.18,.08,.26,torso);}
    if(tierIndex>=3){box(.7,.27,.38,m.skin,0,.38,0,torso);for(let i=-1;i<=1;i++){const spike=new T.Mesh(new T.ConeGeometry(.065,.3+Math.abs(i)*.1,5),m.bone);spike.position.set(i*.2,.62,-.02);spike.rotation.z=-i*.6;torso.add(spike);}box(.3,.36,.025,m.wound,0,.2,.19,torso);}
    const limbs=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.145,.88,0);root.add(leg);box(.2,.42,.23,m.cloth,0,-.2,0,leg);const shin=new T.Group();shin.position.set(0,-.4,0);leg.add(shin);box(.16,.37,.18,m.cloth,0,-.16,.025,shin);box(.19,.14,.31,m.boot,0,-.33,.08,shin);limbs.push(leg);
      const arm=new T.Group();arm.position.set(side*.34,.43,0);torso.add(arm);box(.17,.33,.19,m.cloth,0,-.15,0,arm);const fore=new T.Group();fore.position.set(0,-.29,0);fore.rotation.x=-.38;arm.add(fore);box(.13,.31,.15,m.skin,0,-.13,.01,fore);box(.14,.14,.085,m.skin,0,-.32,.03,fore);for(let f=0;f<3;f++)box(.026,.095,.035,m.skin,-.045+f*.045,-.41,.045,fore);limbs.push(arm);
    }
    const ring=new T.Mesh(new T.RingGeometry(.45,.48,24),new T.MeshBasicMaterial({color:new T.Color(t.hex),transparent:true,opacity:.26,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.02;ring.userData.ownMaterial=true;root.add(ring);
    return {root,torso,head,limbs,tier:tierIndex,hp:t.hp,maxHp:t.hp,speed:t.speed,damage:t.damage,phase:rand(0,6),attack:0,flash:0,scale:t.scale};
  }
  function animateLegacyZombie(z,time,moving=true){const f=time*(z.tier===1?8:3.3)+z.phase,amp=moving?.52:.1;z.limbs[0].rotation.x=Math.sin(f)*amp;z.limbs[2].rotation.x=-Math.sin(f)*amp;z.limbs[1].rotation.x=-.85-Math.sin(f)*.22;z.limbs[3].rotation.x=-.9+Math.sin(f)*.18;z.torso.rotation.z=Math.sin(f)*.055;z.torso.position.y=1.08+Math.sin(f*2)*.025;z.head.rotation.z=.1+Math.sin(f*.6)*.05;}
  const zombieRig=window.DZZombieRig({T,scene,tiers,mat,box,textureCanvas,rand,metal});
  const createZombie=zombieRig.create,animateZombie=zombieRig.animate;
  // First-person weapon meshes are lit by the world and never intersect the near plane.
  const gun=new T.Group();camera.add(gun);scene.add(camera);gun.visible=false;
  const gunMetal=mat(0x373d39,.3,.8),gunSlide=mat(0x686d62,.32,.85),gunGrip=mat(0x242d26,.9,.1),handMat=mat(0x8f8367);
  let muzzle=null,weaponSlide=null,weaponMagazine=null,weaponHand=null;
  const muzzleLight=new T.PointLight(0xffc46d,0,7,2);camera.add(muzzleLight);muzzleLight.position.set(.3,-.2,-.7);
  function disposeModel(root){root.traverse(o=>{if(o.isMesh&&o.geometry!==boxGeo)o.geometry.dispose();if(o.isSprite||o.userData.ownMaterial)o.material?.dispose();});root.removeFromParent();}
  function buildGun(index){while(gun.children.length)disposeModel(gun.children[0]);weaponMagazine=null;const g=new T.Group();gun.add(g);
    const long=index>0,len=index===2?.83:index===4?.93:index===5?1.02:long?.73:.4;
    box(.1,.13,len,gunMetal,0,0,-len/2,g);weaponSlide=box(.105,.065,len*.75,gunSlide,0,.085,-len*.45,g);weaponSlide.userData.baseZ=-len*.45;const grip=box(.085,.21,.11,gunGrip,0,-.16,-.08,g);grip.rotation.x=-.22;
    box(.04,.05,.035,gunGrip,0,.135,-len+.1,g);box(.035,.037,.028,gunMetal,-.04,.132,-.07,g);box(.035,.037,.028,gunMetal,.04,.132,-.07,g);
    if(long){weaponMagazine=box(.085,.24,.15,gunGrip,0,-.19,-.31,g);weaponMagazine.userData.baseY=-.19;box(.14,.1,.3,gunGrip,0,-.02,.12,g);for(let i=0;i<7;i++)box(.125,.02,.014,gunMetal,0,.135,-.16-i*.045,g);box(.11,.1,len*.4,gunGrip,0,-.015,-len*.7,g);if(index===4){const scope=cylinder(.055,.055,.28,gunMetal,0,.2,-.27,g,12);scope.rotation.x=Math.PI/2;}}
    if(index===2){const barrel=cylinder(.035,.035,.5,gunMetal,0,-.05,-.64,g,10);barrel.rotation.x=Math.PI/2;}
    if(index===5){box(.2,.19,.25,gunGrip,.1,-.12,-.24,g);}
    if(!long){weaponMagazine=box(.073,.045,.085,gunMetal,0,-.285,-.065,g);weaponMagazine.userData.baseY=-.285;}
    const hand=box(.11,.15,.12,handMat,.045,-.19,-.07,g);weaponHand=hand;hand.rotation.z=-.2;const sleeve=box(.14,.18,.38,gunGrip,.06,-.27,.16,g);sleeve.rotation.x=.2;
    if(long){box(.12,.12,.16,handMat,-.06,-.09,-.5,g);const arm=box(.15,.16,.38,gunGrip,-.14,-.18,-.29,g);arm.rotation.y=-.4;arm.rotation.x=-.35;}
    muzzle=new T.Sprite(new T.SpriteMaterial({map:fireTx,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));muzzle.position.set(0,.03,-len-.07);muzzle.scale.set(.42,.42,1);muzzle.visible=false;g.add(muzzle);
    gun.position.set(camera.aspect<1?.09:.28,camera.aspect<1?-.18:-.28,camera.aspect<1?-.7:-.44);gun.rotation.set(0,.025,0);return len;
  }
  function animateWeapon(recoil,reload,fullReload){if(weaponSlide)weaponSlide.position.z=weaponSlide.userData.baseZ+Math.min(.09,recoil*.7);const progress=reload>0?Math.sin((1-reload/(fullReload||1))*Math.PI):0;if(weaponMagazine)weaponMagazine.position.y=weaponMagazine.userData.baseY-progress*.2;if(weaponHand){weaponHand.position.y=-.19-progress*.09;weaponHand.rotation.x=progress*.3;}}
  buildGun(0);
  const quality='ULTRA';
  function setQuality(){return quality;}
  function environment(time,dt){fires.forEach((f,i)=>{f.scale.y=1.3+Math.sin(time*9+i*2)*.45;f.material.opacity=.65+Math.sin(time*12+i)*.25;});fireLight.intensity=22+Math.sin(time*17)*5;smoke.forEach((s,i)=>{s.position.x+=Math.sin(time*.13+i)*dt*.09;});for(let i=0;i<ashCount;i++){ashPositions[i*3]+=.12*dt;ashPositions[i*3+1]-=.14*dt;if(ashPositions[i*3+1]<0)ashPositions[i*3+1]=20;if(ashPositions[i*3]>16)ashPositions[i*3]=-16;}ashGeometry.attributes.position.needsUpdate=true;}
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
  return {T,scene,camera,renderer,obstacles,detailCounts,tiers,createZombie,animateZombie,triggerAttack:zombieRig.attack,reactToHit:zombieRig.hit,startDeath:zombieRig.die,animateDeath:zombieRig.animateDeath,disposeModel,gun,buildGun,animateWeapon,get muzzle(){return muzzle;},muzzleLight,environment,setQuality,mobile,rand};
})();

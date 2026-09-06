'use strict';
/* Articulated procedural performance: distance-driven gait, joint overlap,
   attack anticipation/contact/recovery, hit reactions and three collapse clips. */
window.DZZombieRig = function({T,scene,tiers,mat,box,textureCanvas,rand,metal}) {
  const skinTexture=textureCanvas(1024,(c,s)=>{c.fillStyle='#a8a48c';c.fillRect(0,0,s,s);for(let i=0;i<50000;i++){c.fillStyle=rand()>.5?'#383e3025':'#dfce9c15';c.fillRect(rand(0,s),rand(0,s),rand(1,5),rand(1,4));}for(let i=0;i<140;i++){const x=rand(0,s),y=rand(0,s);const g=c.createRadialGradient(x,y,0,x,y,rand(10,45));g.addColorStop(0,'#4b493c85');g.addColorStop(1,'#4b493c00');c.fillStyle=g;c.fillRect(x-50,y-50,100,100);}for(let i=0;i<60;i++){c.beginPath();let x=rand(0,s),y=rand(0,s);c.moveTo(x,y);for(let n=0;n<7;n++){x+=rand(-12,12);y+=rand(2,15);c.lineTo(x,y);}c.strokeStyle='#54644c66';c.lineWidth=rand(1,2.7);c.stroke();}});
  const clothTexture=textureCanvas(512,(c,s)=>{c.fillStyle='#a8a395';c.fillRect(0,0,s,s);for(let x=0;x<s;x+=3){c.fillStyle=x%2?'#20282420':'#f1ddc218';c.fillRect(x,0,1,s);c.fillRect(0,x,s,1);}for(let i=0;i<7500;i++){c.fillStyle='#21282016';c.fillRect(rand(0,s),rand(0,s),rand(1,7),rand(1,12));}for(let i=0;i<20;i++){c.fillStyle='#343b2c50';c.beginPath();c.ellipse(rand(0,s),rand(0,s),rand(8,40),rand(4,24),rand(0,3),0,Math.PI*2);c.fill();}});
  const materials=tiers.map((t,i)=>({skin:new T.MeshStandardMaterial({color:t.color,map:skinTexture,bumpMap:skinTexture,bumpScale:.008,roughness:.82}),cloth:new T.MeshStandardMaterial({color:t.cloth,map:clothTexture,bumpMap:clothTexture,bumpScale:.005,roughness:.98}),wound:mat(0x513e32,.91),boot:mat(0x242d28,.88),bone:mat(0xb5ae8d,.76),eye:new T.MeshStandardMaterial({color:i>=3?0xd88a5d:0xb8b07f,emissive:i>=3?0xd45d30:0xa39046,emissiveIntensity:1.4,roughness:.19}),socket:mat(0x243026),nail:mat(0x73705a)}));
  const smooth=(a,b,k,dt)=>T.MathUtils.lerp(a,b,1-Math.exp(-k*dt));
  const clamp=T.MathUtils.clamp;
  const ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  function joint(parent,x,y,z){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
  function oval(parent,m,rx,ry,rz,x=0,y=0,z=0){const mesh=new T.Mesh(new T.SphereGeometry(1,24,18),m);mesh.scale.set(rx,ry,rz);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function limb(parent,m,top,bottom,length,x=0,y=0,z=0){const mesh=new T.Mesh(new T.CylinderGeometry(top,bottom,length,20,4),m);mesh.position.set(x,y-length/2,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function stitch(parent,m,x,y,z,count=7,spacing=.025){for(let i=0;i<count;i++)box(.006,.014,.005,m,x+i*spacing,y,z,parent);}
  function create(tierIndex,x,z){
    const t=tiers[tierIndex],m=materials[tierIndex],root=new T.Group();root.position.set(x,0,z);root.scale.setScalar(t.scale);scene.add(root);
    const pelvis=joint(root,0,.94,0),torso=joint(pelvis,0,.26,0),neck=joint(torso,0,.42,.005),head=joint(torso,0,.66,.027);
    oval(pelvis,m.cloth,.24,.19,.15,0,-.015,0);oval(torso,m.cloth,.235,.31,.155,0,.095,0);oval(torso,tierIndex>=3?m.skin:m.cloth,.295,.19,.18,0,.25,.005);oval(torso,m.skin,.17,.19,.126,0,-.14,0);
    // Asymmetric torn hem, collar, buttons, pockets, seams and fabric folds.
    for(let s of [-1,1]){const collar=box(.12,.04,.16,m.cloth,s*.105,.41,.055,torso);collar.rotation.z=s*.34;oval(torso,m.cloth,.115,.12,.028,s*.145,.23,.162);stitch(torso,m.bone,s*.145-.052,.15,.188,5,.023);for(let n=0;n<4;n++){const fold=oval(torso,m.cloth,.18,.008,.012,0,-.08+n*.055,.155);fold.rotation.z=s*.07;}}
    for(let n=0;n<5;n++)oval(torso,m.boot,.011,.011,.008,0,.3-n*.07,.178);
    box(.45,.056,.315,m.boot,0,.025,0,pelvis);box(.075,.055,.025,metal,.018,.027,.17,pelvis);
    for(let n=0;n<7;n++){const shred=limb(torso,m.cloth,.025,.002,rand(.06,.13),-.19+n*.06,-.15,.1);shred.rotation.z=rand(-.3,.3);}
    limb(neck,m.skin,.071,.089,.16,0,.06,0);
    // Sculpted head silhouette: cranial vault, cheeks, brows, nose, ears and hinged jaw.
    oval(head,m.skin,.168,.205,.156,0,.015,-.005);oval(head,m.skin,.137,.105,.11,0,-.093,.066);
    const jaw=joint(head,0,-.095,.028);oval(jaw,m.skin,.117,.071,.10,0,-.055,.04);oval(jaw,m.wound,.091,.018,.052,0,-.01,.109);
    for(let n=0;n<6;n++)box(.017,.026,.018,m.bone,-.051+n*.02,-.013,.151,jaw);
    for(const side of [-1,1]){
      oval(head,m.skin,.055,.068,.049,side*.124,-.044,.092);oval(head,m.socket,.054,.034,.024,side*.068,.035,.135);oval(head,m.eye,.024,.022,.017,side*.068,.037,.155);oval(head,m.socket,.009,.014,.008,side*.068,.037,.169);
      const brow=oval(head,m.skin,.058,.018,.022,side*.066,.075,.143);brow.rotation.z=-side*.2;oval(head,m.skin,.03,.061,.026,side*.166,-.004,-.001);oval(head,m.wound,.011,.033,.012,side*.18,-.002,.01);
      oval(head,m.skin,.027,.055,.028,side*.028,-.002,.14);
    }
    oval(head,m.skin,.026,.065,.039,0,-.003,.164);oval(head,m.socket,.016,.009,.01,-.021,-.043,.187);oval(head,m.socket,.016,.009,.01,.021,-.043,.187);
    const scar=oval(head,m.wound,.023,.067,.008,-.1,.084,.135);scar.rotation.z=.25;stitch(head,m.bone,-.123,.081,.145,3,.018);
    for(let n=0;n<7;n++){const tendon=oval(neck,m.skin,.011,.084,.009,(n-3)*.02,-.035,.077);tendon.rotation.z=(n-3)*.08;}
    const hips=[],knees=[],feet=[],shoulders=[],elbows=[],wrists=[],fingers=[],limbs=[];
    for(const side of [-1,1]){
      const hip=joint(pelvis,side*.14,-.01,0);oval(hip,m.cloth,.123,.22,.127,0,-.19,0);limb(hip,m.cloth,.113,.081,.39);const knee=joint(hip,0,-.4,0);oval(knee,m.cloth,.088,.077,.092,0,0,.015);limb(knee,m.cloth,.08,.064,.37);const foot=joint(knee,0,-.365,.015);oval(foot,m.boot,.087,.074,.16,0,-.045,.053);box(.18,.03,.29,m.boot,0,-.095,.04,foot);for(let l=0;l<4;l++)box(.10,.01,.016,m.bone,0,.004,.04+l*.026,foot);
      for(let n=0;n<4;n++){const fold=oval(knee,m.cloth,.079,.012,.079,0,-.13-n*.052,0);fold.rotation.z=side*.1;}
      box(.014,.35,.019,m.cloth,side*.098,-.2,.067,hip);oval(knee,m.wound,.058,.045,.01,side*.012,.01,.094);
      const shoulder=joint(torso,side*.29,.31,0);oval(shoulder,tierIndex>=3?m.skin:m.cloth,.113,.127,.115);limb(shoulder,m.cloth,.099,.081,.28);const elbow=joint(shoulder,0,-.29,0);oval(elbow,m.skin,.072,.073,.073);limb(elbow,m.skin,.073,.045,.28);oval(elbow,m.skin,.05,.105,.055,0,-.09,.018);
      for(let v=0;v<3;v++){const vein=limb(elbow,m.wound,.003,.002,.15,(v-1)*.019,-.045,.067);vein.rotation.z=(v-1)*.07;}
      const wrist=joint(elbow,0,-.285,0);oval(wrist,m.skin,.063,.071,.033,0,-.039,0);
      const handDigits=[];for(let f=0;f<5;f++){const thumb=f===4;const finger=joint(wrist,thumb?side*.064:-.045+f*.029,thumb?-.035:-.085,0);if(thumb)finger.rotation.z=side*.85;const length=thumb?.036:.041+(f===1||f===2?.007:0);limb(finger,m.skin,.012,.01,length);const tip=joint(finger,0,-length,0);limb(tip,m.skin,.0098,.0075,length*.75);oval(tip,m.nail,.009,.014,.003,0,-length*.58,-.009);handDigits.push({base:finger,tip,thumb});}
      if(tierIndex===2){oval(shoulder,metal,.13,.12,.12,0,.015,.035);box(.12,.14,.08,metal,0,-.07,.08,knee);}
      hips.push(hip);knees.push(knee);feet.push(foot);shoulders.push(shoulder);elbows.push(elbow);wrists.push(wrist);fingers.push(handDigits);limbs.push(hip,shoulder);
    }
    if(tierIndex===2){const helmet=new T.Mesh(new T.SphereGeometry(.19,28,16,0,Math.PI*2,0,Math.PI*.55),m.cloth);helmet.position.set(0,.035,-.01);helmet.scale.set(1,1,1.08);head.add(helmet);box(.43,.35,.105,metal,0,.22,.184,torso);for(let a=-1;a<=1;a++)box(.105,.12,.085,m.cloth,a*.135,.08,.255,torso);box(.039,.47,.03,m.boot,-.18,.18,.17,torso);box(.039,.47,.03,m.boot,.18,.18,.17,torso);}
    if(tierIndex>=3){for(const side of [-1,1]){oval(torso,m.skin,.2,.18,.2,side*.2,.25,0);for(let n=0;n<3;n++){const spike=new T.Mesh(new T.ConeGeometry(.043,.19+n*.045,12),m.bone);spike.position.set(side*(.2+n*.055),.39,-.015);spike.rotation.z=-side*(.2+n*.22);torso.add(spike);}}for(let n=0;n<5;n++){const rib=oval(torso,m.bone,.16,.012,.016,0,.03+n*.044,.186);rib.rotation.z=.06;}oval(torso,m.wound,.09,.19,.012,.035,.1,.192);}
    root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const phase=rand(0,Math.PI*2);
    return {root,torso,head,limbs,tier:tierIndex,hp:t.hp,maxHp:t.hp,speed:t.speed,damage:t.damage,scale:t.scale,phase,attack:0,rig:{pelvis,neck,jaw,hips,knees,feet,shoulders,elbows,wrists,fingers},anim:{gait:phase,blend:0,variant:rand(.75,1.2),asym:rand(-1,1),hit:0,hitHead:false,hitSide:1,attackTime:-1,attackHand:0,attackDuration:1.15,impactFired:false,deathTime:0,deathVariant:0,lastX:x,lastZ:z}}
  }
  function attack(e){const a=e.anim;if(a.attackTime>=0)return;a.attackTime=0;a.attackHand=1-a.attackHand;a.attackDuration=e.tier===1?.86:e.tier>=3?1.35:1.12;a.impactFired=false;}
  function hit(e,head,side=1){e.anim.hit=1;e.anim.hitHead=head;e.anim.hitSide=side;if(head&&e.tier<3&&e.anim.attackTime>=0&&e.anim.attackTime<e.anim.attackDuration*.38)e.anim.attackTime=-1;}
  function die(e,head){e.anim.deathTime=0;e.anim.deathVariant=head?0:Math.floor(rand(1,3));e.anim.attackTime=-1;e.anim.deathRotations=new Map();e.root.traverse(o=>{if(o.isGroup)e.anim.deathRotations.set(o,o.rotation.clone());});}
  function animate(e,time,moving=true,dt=1/60){
    const a=e.anim,r=e.rig,runner=e.tier===1,heavy=e.tier>=3;
    const distance=Math.hypot(e.root.position.x-a.lastX,e.root.position.z-a.lastZ)/e.scale;a.lastX=e.root.position.x;a.lastZ=e.root.position.z;
    a.gait+=distance/(runner?1.15:.87)*Math.PI*2;a.blend=smooth(a.blend,moving&&distance>.00001?1:0,7,dt);
    const phase=a.gait,blend=a.blend,breath=Math.sin(time*2.6+e.phase),limp=(e.hp<e.maxHp*.35?1.6:1)*(runner?.02:.13)*a.variant;
    let strike=0,anticipation=0,recovery=0,impact=false;
    if(a.attackTime>=0){a.attackTime+=dt;const p=a.attackTime/a.attackDuration;anticipation=ease(p/.34)*(1-ease((p-.32)/.11));strike=ease((p-.31)/.16)*(1-ease((p-.56)/.32));recovery=ease((p-.55)/.4);if(p>=.46&&!a.impactFired){impact=true;a.impactFired=true;}if(p>=1)a.attackTime=-1;}
    a.hit=Math.max(0,a.hit-dt*(heavy?4.5:3.1));const recoil=Math.sin(a.hit*Math.PI)*a.hit;
    const sway=Math.sin(phase)*(.027+limp*.3)*blend;
    r.pelvis.position.y=.94+(Math.cos(phase*2)*.023-Math.abs(Math.sin(phase))*.018)*blend+(breath*.005)-strike*.055;
    r.pelvis.rotation.y=Math.sin(phase)*.085*blend;r.pelvis.rotation.z=sway;r.pelvis.position.x=Math.sin(phase)*.026*blend;
    e.torso.rotation.x=(runner?.19:heavy?.11:.08)+breath*.017+Math.cos(phase*2)*.018*blend-anticipation*.2+strike*.3-recoil*(a.hitHead?.09:.29);
    e.torso.rotation.z=-sway*1.5+Math.sin(time*.55+e.phase)*.02+recoil*a.hitSide*.18;e.torso.rotation.y=-r.pelvis.rotation.y*.65+Math.sin(phase*.5)*limp*.17+(a.attackHand?1:-1)*(anticipation*.22-strike*.25);
    e.head.rotation.x=-.065+breath*.025+Math.sin(phase+.6)*.038*blend+recoil*(a.hitHead?-.55:.12)-strike*.09;
    e.head.rotation.z=a.asym*.055+Math.sin(time*.7+e.phase)*.04-sway*.5+recoil*a.hitSide*(a.hitHead?.33:.08);
    e.head.rotation.y=Math.sin(time*.48+e.phase)*.07-e.torso.rotation.y*.4;
    r.jaw.rotation.x=.09+(breath+1)*.026+strike*.27+recoil*.2;
    for(let i=0;i<2;i++){
      const side=i===0?-1:1,p=phase+i*Math.PI,wave=Math.sin(p),lift=Math.max(0,Math.cos(p)),amp=runner?.71:heavy?.44:.46;
      const hipTarget=-wave*amp*blend+(i===0?limp:0)*blend*.3-strike*.08;
      r.hips[i].rotation.x=hipTarget;r.hips[i].rotation.z=side*(.028+limp*.08)+side*Math.sin(p)*.026*blend;
      const kneeTarget=.065+Math.pow(lift,1.6)*(runner?1.22:.72)*blend+(i===0?limp*.5:0)*blend;
      r.knees[i].rotation.x=kneeTarget;r.feet[i].rotation.x=-hipTarget-kneeTarget+(wave<0?.05:.14)*blend;r.feet[i].rotation.z=-r.pelvis.rotation.z*.8;
      let shoulderX=runner?wave*.59-.28:-.55-wave*.15*blend;let shoulderZ=side*(heavy?.22:.095);
      let elbowX=runner?-.95-Math.cos(p)*.2:-.23-Math.sin(p+.8)*.15*blend;
      if(i===a.attackHand){shoulderX+=anticipation*.65-strike*1.45;shoulderZ+=side*(anticipation*.32-strike*.22);elbowX-=anticipation*1.1;elbowX+=strike*.12;}else{shoulderX-=strike*.35;shoulderZ+=side*strike*.16;}
      shoulderX+=recoil*(i===0?-.4:.25);r.shoulders[i].rotation.x=smooth(r.shoulders[i].rotation.x,shoulderX,17,dt);r.shoulders[i].rotation.z=smooth(r.shoulders[i].rotation.z,shoulderZ,13,dt);r.shoulders[i].rotation.y=side*.05+strike*(i===a.attackHand?-side*.28:0);
      r.elbows[i].rotation.x=smooth(r.elbows[i].rotation.x,elbowX,16,dt);r.wrists[i].rotation.x=.18+Math.sin(p-1)*.11*blend-strike*.3;r.wrists[i].rotation.z=side*.11+Math.sin(time*2+i+e.phase)*.055;
      r.fingers[i].forEach((f,n)=>{const curl=.2+Math.sin(time*1.1+e.phase+n*.5)*.075+strike*.15;f.base.rotation.x=-curl;f.tip.rotation.x=-.32-curl*.7;});
    }
    return {impact,strike,anticipation};
  }
  function animateDeath(e,dt){const a=e.anim,r=e.rig;a.deathTime+=dt;const t=a.deathTime,v=a.deathVariant;
    // Settle limbs independently instead of rotating the whole model as one block.
    const fall=ease((t-.12)/.88),settle=ease((t-.85)/.55),side=v===1?-1:1;
    if(v===0){r.pelvis.position.y=.94-fall*.69;r.pelvis.rotation.x=-fall*1.43;e.torso.rotation.x=-.05-fall*.12;e.head.rotation.x=-.2-fall*.3;r.knees.forEach((k,i)=>k.rotation.x=.15+Math.sin(fall*Math.PI)*.75+settle*.13);r.hips.forEach((h,i)=>h.rotation.x=.12+Math.sin(fall*Math.PI)*.36);}
    else if(v===1){r.pelvis.position.y=.94-fall*.71;r.pelvis.rotation.z=side*fall*1.44;e.torso.rotation.x=.16+fall*.3;e.torso.rotation.y=fall*.34;r.knees[0].rotation.x=.75*fall;r.knees[1].rotation.x=.36*fall;r.hips[0].rotation.x=-.38*fall;r.hips[1].rotation.x=.24*fall;}
    else{const kneel=ease(t/.5);r.pelvis.position.y=.94-kneel*.4-fall*.34;r.knees.forEach(k=>k.rotation.x=kneel*1.55);r.hips.forEach(h=>h.rotation.x=-kneel*.7);e.torso.rotation.x=.12+fall*.7;r.pelvis.rotation.x=fall*.85;e.head.rotation.x=fall*.4;}
    r.shoulders.forEach((s,i)=>{s.rotation.x=smooth(s.rotation.x,v===0?-.75:1.1,5,dt);s.rotation.z=smooth(s.rotation.z,(i===0?-1:1)*(.35+Math.sin(fall*Math.PI)*.65),5,dt);});r.elbows.forEach((el,i)=>el.rotation.x=smooth(el.rotation.x,-.3-i*.24,4,dt));r.wrists.forEach((w,i)=>w.rotation.x=smooth(w.rotation.x,.45,3,dt));r.jaw.rotation.x=.26;
    if(t>1.15&&t<1.7)e.head.rotation.z=Math.sin((t-1.15)*18)*.07*(1-settle);
    if(t>6)e.root.position.y=-ease((t-6)/1.4)*.8;
  }
  return {create,animate,attack,hit,die,animateDeath};
};

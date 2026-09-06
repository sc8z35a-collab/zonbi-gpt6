'use strict';
/* High-detail architectural and set-dressing pass. Units are metres. */
window.DZUrbanDetail = function(ctx) {
  const {T,scene,staticGroup,box,cylinder,beam,mat,textureCanvas,rand,buildings,materials} = ctx;
  const {metal,rust,black,wood,concreteDark,sand} = materials;
  const counts={windows:0,airConditioners:0,balconies:0,additionalProps:0};
  function pbr(base,kind){
    const albedo=textureCanvas(1024,(c,s)=>{
      c.fillStyle=base;c.fillRect(0,0,s,s);
      for(let i=0;i<64000;i++){const light=rand()>.48;c.fillStyle=light?'rgba(233,227,205,.075)':'rgba(13,24,20,.08)';c.fillRect(rand(0,s),rand(0,s),rand(.5,3.5),rand(.5,5));}
      if(kind==='brick'){for(let y=0;y<s;y+=32){for(let x=-64;x<s;x+=128){const dx=x+(y%64?64:0);c.strokeStyle='#333d3266';c.lineWidth=4;c.strokeRect(dx,y,128,32);c.fillStyle=`rgba(35,30,20,${rand(.02,.18)})`;c.fillRect(dx+3,y+3,121,25);}}}
      for(let i=0;i<180;i++){const x=rand(0,s),y=rand(0,s),w=rand(3,45),h=rand(30,370);const gradient=c.createLinearGradient(0,y,0,y+h);gradient.addColorStop(0,'rgba(16,35,27,.24)');gradient.addColorStop(1,'rgba(16,35,27,0)');c.fillStyle=gradient;c.fillRect(x,y,w,h);}
      for(let i=0;i<50;i++){let x=rand(0,s),y=rand(0,s);c.beginPath();c.moveTo(x,y);for(let j=0;j<12;j++){x+=rand(-9,9);y+=rand(3,19);c.lineTo(x,y);}c.strokeStyle='#202b2680';c.lineWidth=rand(.5,2.4);c.stroke();}
      for(let i=0;i<55;i++){c.fillStyle='#26352b25';c.beginPath();c.ellipse(rand(0,s),rand(0,s),rand(8,50),rand(4,18),rand(0,6),0,Math.PI*2);c.fill();}
    });
    const m=new T.MeshStandardMaterial({map:albedo,bumpMap:albedo,bumpScale:kind==='brick'?.07:.035,roughnessMap:albedo,roughness:.98,metalness:0});return m;
  }
  const wallMats=[pbr('#827f71','plaster'),pbr('#797c72','plaster'),pbr('#766455','brick'),pbr('#898370','plaster')];
  const paleMetal=pbr('#8b9486','metal');paleMetal.metalness=.48;paleMetal.roughness=.63;
  const frame=mat(0x858f80,.57,.5),frameDark=mat(0x49584d,.67,.65),interior=mat(0x101f1c),curtain=mat(0x969078),brick=mat(0x73523c),bagMat=mat(0x27312b,.65),bottleMat=mat(0x58684d,.23,.25),paperMat=mat(0xb6ae8d),orange=mat(0xb56535),reflector=mat(0xd9ccaa);
  const glassMats=[0x54675e,0x72847c,0x334a47,0x928f77].map(color=>new T.MeshPhysicalMaterial({color,roughness:.18,metalness:.68,clearcoat:1,clearcoatRoughness:.13,side:T.DoubleSide}));
  const darkStainTx=textureCanvas(256,(c,s)=>{c.clearRect(0,0,s,s);for(let i=0;i<150;i++){const x=rand(0,s),y=rand(0,s);const g=c.createRadialGradient(x,y,0,x,y,rand(10,65));g.addColorStop(0,'rgba(17,27,18,.19)');g.addColorStop(1,'rgba(17,27,18,0)');c.fillStyle=g;c.fillRect(0,0,s,s);}});
  const stain=new T.MeshBasicMaterial({map:darkStainTx,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  function sphere(rx,ry,rz,m,x,y,z,parent=staticGroup){const mesh=new T.Mesh(new T.SphereGeometry(1,18,12),m);mesh.scale.set(rx,ry,rz);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function shard(points,m,parent){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(shape),m);mesh.castShadow=true;parent.add(mesh);return mesh;}
  function aircon(g,x,y){counts.airConditioners++;box(.91,.56,.42,paleMetal,x,y,.39,g);box(.97,.07,.48,metal,x,y+.31,.39,g);box(.035,.68,.09,rust,x-.34,y-.12,.12,g);box(.035,.68,.09,rust,x+.34,y-.12,.12,g);
    const fan=cylinder(.205,.205,.016,interior,x-.18,y,.613,g,28);fan.rotation.x=Math.PI/2;
    for(let n=0;n<10;n++){const a=n*Math.PI/5;beam([x-.18+Math.cos(a)*.185,y+Math.sin(a)*.185,.634],[x-.18-Math.cos(a)*.185,y-Math.sin(a)*.185,.634],.006,frameDark,g);}
    for(let yy=-.18;yy<=.18;yy+=.06)box(.22,.016,.02,frameDark,x+.27,y+yy,.613,g);
    const points=[new T.Vector3(x+.42,y-.16,.37),new T.Vector3(x+.6,y-.3,.27),new T.Vector3(x+.61,y-.9,.14)];const tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),16,.026,8,false),rust);g.add(tube);
  }
  function windowUnit(g,x,y,index){counts.windows++;const w=1.58,h=2.12,broken=rand()<.33;
    box(w+.23,h+.22,.06,concreteDark,x,y,.088,g);box(w,h,.055,interior,x,y,.13,g);
    // Deep jambs, cast sill shadows, mullions and inset glass.
    for(const side of [-1,1])box(.085,h+.07,.28,frame,x+side*w/2,y,.245,g);
    for(const side of [-1,1])box(w+.12,.075,.26,frame,x,y+side*h/2,.245,g);
    box(.065,h,.14,frameDark,x,y,.27,g);box(w,.055,.12,frameDark,x,y+.1,.28,g);
    box(w+.42,.12,.52,wallMats[0],x,y-h/2-.095,.26,g);
    if(!broken){for(let side of [-1,1]){box(w/2-.1,h-.14,.025,glassMats[index%4],x+side*w/4,y,.21,g);box(.025,h-.2,.014,frame,x+side*w/4-.24,y,.231,g);}}
    else {
      for(const side of [-1,1]){const tri=shard([[0,0],[.66,0],[.55,-.3],[.38,-.17],[.19,-.53]],glassMats[index%4],g);tri.position.set(x+(side===-1?-.7:.06),y+1,.24);}
      const tri=shard([[0,0],[.65,0],[.57,.45],[.36,.13],[.2,.35]],glassMats[(index+1)%4],g);tri.position.set(x-.71,y-1,.23);
      if(rand()>.45){for(let i=0;i<4;i++){const c=box(.13,rand(.5,1.6),.027,curtain,x-.65+i*.15,y+.17,.18,g);c.rotation.z=rand(-.12,.12);}}
      if(rand()>.55){const b=box(w+.18,.14,.1,wood,x,y-.2,.43,g);b.rotation.z=rand(-.3,.3);const b2=box(w+.15,.12,.11,wood,x,y+.35,.45,g);b2.rotation.z=rand(-.4,.4);}
    }
    if(index%8===0){const railY=y-.48;box(w+.5,.12,.85,concreteDark,x,y-1.17,.58,g);beam([x-.91,railY,1],[x+.91,railY,1],.025,metal,g);for(let n=0;n<8;n++)beam([x-.88+n*.25,y-1.13,1],[x-.88+n*.25,railY,1],.014,metal,g);counts.balconies++;}
  }
  buildings.forEach((b,index)=>{
    const g=new T.Group();g.position.set(b.side*10.35,0,b.z);g.rotation.y=b.side===1?-Math.PI/2:Math.PI/2;staticGroup.add(g);
    box(b.d,b.h,.13,wallMats[index%4],0,b.h/2,0,g);
    const columns=Math.max(3,Math.floor(b.d/2.5));let serial=0;
    for(let y=5.1;y<b.h-1.3;y+=3.12){
      box(b.d,.105,.22,concreteDark,0,y-1.4,.13,g);
      for(let j=0;j<columns;j++){const x=-b.d/2+(j+.5)*b.d/columns;windowUnit(g,x,y,index*17+serial++);if((serial+index)%7===2)aircon(g,x+1.02,y-.52);}
    }
    for(const side of [-1,1]){const xx=side*(b.d/2-.18);cylinder(.065,.065,b.h-.3,rust,xx,b.h/2,.29,g,16);for(let y=1;y<b.h;y+=2.5){box(.22,.07,.17,metal,xx,y,.23,g);cylinder(.088,.088,.1,metal,xx,y,.3,g,16);}beam([xx,.45,.3],[xx+.35,.13,.55],.067,rust,g);}
    // Storefront architecture: frame, recessed doors, sill and roll-shutter ridges.
    for(let j=-1;j<=1;j++){const x=j*3.65;box(3.27,2.8,.12,interior,x,1.5,.12,g);for(const side of [-1,1])box(.13,2.9,.29,wallMats[(index+1)%4],x+side*1.67,1.5,.25,g);box(3.45,.2,.34,frameDark,x,3,.25,g);
      if((j+index)%3===0){box(1.2,2.35,.08,frameDark,x-.3,1.38,.22,g);box(1.02,1.65,.016,glassMats[index%4],x-.3,1.56,.271,g);box(.045,.45,.1,rust,x+.14,1.35,.35,g);box(1.9,.12,.75,concreteDark,x-.3,.2,.47,g);}
      else for(let y=.28;y<2.86;y+=.115){const slat=box(3.16,.075,.06,paleMetal,x,y,.24,g);if(index%4===0&&y<.8)slat.rotation.z=.07;}
      box(3.4,.17,.98,wallMats[(index+2)%4],x,3.18,.53,g);beam([x-1.4,2.45,.23],[x-1.4,3.08,.92],.025,rust,g);beam([x+1.4,2.45,.23],[x+1.4,3.08,.92],.025,rust,g);
    }
    // Utility panel, cables, exposed reinforcement on a spalled corner.
    box(.67,1.12,.21,metal,b.d/2-1,1.1,.3,g);box(.56,.98,.035,frameDark,b.d/2-1,1.12,.422,g);box(.06,.18,.045,rust,b.d/2-.8,1.05,.45,g);
    for(let j=0;j<4;j++)beam([-b.d/2+.3+j*.12,.2,.23],[-b.d/2+.3+j*.12,2.5+rand(0,1),.23],.018,rust,g);
    const decal=new T.Mesh(new T.PlaneGeometry(b.d,4.5),stain);decal.position.set(0,2.7,.46);g.add(decal);
    for(let n=0;n<5;n++){const bx=rand(-b.d/2+.3,b.d/2-.3);box(rand(.12,.3),rand(.15,.4),.07,brick,bx,rand(.3,2.3),.17,g);}
    // Rooftop coping, water tanks, ductwork and ventilation caps.
    box(b.d+.15,.16,.56,wallMats[index%4],0,b.h+.15,.16,g);for(let n=0;n<3;n++){box(1.4,.8,1.2,metal,b.x+rand(-2,2),b.h+.5,b.z+rand(-3,3));cylinder(.32,.39,.4,frame,b.x+rand(-2,2),b.h+1.1,b.z+rand(-3,3),staticGroup,20);}
    if(index%3===0){const tx=b.x,ty=b.h+2;cylinder(1,1.05,2.5,rust,tx,ty,b.z,staticGroup,24);const roof=new T.Mesh(new T.ConeGeometry(1.08,.6,24),frameDark);roof.position.set(tx,ty+1.54,b.z);staticGroup.add(roof);for(const s of [-1,1])beam([tx+s*.7,b.h,b.z],[tx+s*.7,ty-1,b.z],.055,metal);}
    // Individual cracked tiles on near-facing end walls.
    if(index<8){const front=new T.Group();front.position.set(b.x,0,b.z+b.d/2+.025);staticGroup.add(front);for(let y=4.9;y<b.h-1.5;y+=3.12)for(let xx=-b.w/2+1.3;xx<b.w/2-1;xx+=2.5)windowUnit(front,xx,y,index+Math.round(xx+y));}
  });
  // Extra distinct props, on top of fivefold baseline scatter.
  function propGroup(x,z){const g=new T.Group();g.position.set(x,.14,z);g.rotation.y=rand(0,Math.PI*2);staticGroup.add(g);counts.additionalProps++;return g;}
  for(let i=0;i<180;i++){
    const x=(i%2?1:-1)*rand(7.8,9.55),z=rand(-85,33),g=propGroup(x,z),kind=i%9;
    if(kind===0){ // wooden shipping pallet
      for(let k=0;k<5;k++)box(.16,.09,1.1,wood,-.46+k*.22,.12,0,g);for(let k=-1;k<=1;k++)box(1.1,.12,.13,wood,0,.035,k*.42,g);for(let k=0;k<10;k++)cylinder(.012,.012,.012,rust,-.46+(k%5)*.22,.17,k<5?-.4:.4,g,6);
    }else if(kind===1){ // tied garbage bags and seams
      for(let k=0;k<3;k++){const bx=k*.25-.25;sphere(.26,.32,.23,bagMat,bx,.27,rand(-.12,.12),g);sphere(.055,.075,.055,bagMat,bx,.59,0,g);beam([bx-.03,.56,0],[bx+.06,.63,.02],.017,black,g);}
    }else if(kind===2){ // traffic cones
      box(.43,.045,.43,black,0,.025,0,g);cylinder(.035,.2,.58,orange,0,.33,0,g,24);cylinder(.092,.12,.1,reflector,0,.36,0,g,24);
    }else if(kind===3){ // cardboard boxes with tape and torn flaps
      box(.66,.49,.58,sand,0,.25,0,g);box(.08,.008,.6,paperMat,0,.5,0,g);const flap=box(.32,.018,.54,sand,.34,.54,0,g);flap.rotation.z=.3;box(.26,.16,.009,paperMat,0,.3,.296,g);
    }else if(kind===4){ // discarded bicycle, frame and spoked wheels
      for(const end of [-1,1]){const wheel=new T.Mesh(new T.TorusGeometry(.3,.023,8,32),black);wheel.position.set(end*.56,.33,0);g.add(wheel);for(let j=0;j<12;j++){const a=j*Math.PI/6;beam([end*.56,.33,0],[end*.56+Math.cos(a)*.28,.33+Math.sin(a)*.28,0],.0035,metal,g);}}
      [[[-.56,.33,0],[0,.31,0]],[[0,.31,0],[-.2,.82,0]],[[-.2,.82,0],[-.56,.33,0]],[[0,.31,0],[.4,.86,0]],[[.4,.86,0],[-.2,.82,0]],[[.4,.86,0],[.56,.33,0]]].forEach(v=>beam(v[0],v[1],.02,rust,g));box(.24,.055,.13,black,-.2,.85,0,g);beam([.4,.87,-.18],[.4,.87,.18],.016,metal,g);g.rotation.x=.48;
    }else if(kind===5){ // bottles and cans
      for(let k=0;k<4;k++){const bx=rand(-.25,.25),bz=rand(-.25,.25);cylinder(.045,.055,.2,bottleMat,bx,.11,bz,g,12);cylinder(.02,.028,.075,bottleMat,bx,.245,bz,g,12);cylinder(.024,.024,.025,rust,bx,.285,bz,g,12);}
    }else if(kind===6){ // broken bricks, with cavities
      for(let k=0;k<6;k++){const bx=rand(-.35,.35),bz=rand(-.35,.35),y=.06+Math.floor(k/3)*.11;box(.26,.11,.13,brick,bx,y,bz,g);for(let h=-1;h<=1;h++)box(.037,.005,.055,interior,bx+h*.07,y+.057,bz,g);}
    }else if(kind===7){ // wheeled refuse bin
      box(.65,.8,.63,frameDark,0,.44,0,g);box(.72,.07,.7,metal,0,.88,0,g);for(let s of [-1,1]){const wh=cylinder(.095,.095,.07,black,s*.28,.09,-.24,g,16);wh.rotation.z=Math.PI/2;}box(.3,.04,.1,black,0,.91,.24,g);box(.28,.2,.012,roadLabel(),0,.57,.322,g);
    }else{ // curled metal sheets, pipes and ceramic fragments
      for(let k=0;k<3;k++){const pipe=cylinder(.055,.055,rand(.5,1.1),rust,k*.15-.15,.09,0,g,16);pipe.rotation.x=Math.PI/2;}const plate=box(.7,.024,.45,metal,.15,.13,0,g);plate.rotation.z=.19;
    }
  }
  function roadLabel(){return paperMat;}
  // Storm drains, manhole covers, loose rebar and pavement stains.
  for(let z=29;z>-88;z-=7){for(let side of [-1,1]){box(.46,.015,.84,black,side*8.85,.013,z);for(let j=0;j<8;j++)box(.48,.025,.025,metal,side*8.85,.028,z-.35+j*.1);}}
  for(let i=0;i<16;i++){const x=rand(-6,6),z=rand(-82,30);cylinder(.48,.48,.018,metal,x,.016,z,staticGroup,40);for(let n=-3;n<=3;n++)box(.62,.012,.018,rust,x,.03,z+n*.085);}
  for(let i=0;i<85;i++){const x=rand(-8,8),z=rand(-82,32);const d=new T.Mesh(new T.PlaneGeometry(rand(.6,2.5),rand(.5,2)),stain);d.rotation.x=-Math.PI/2;d.position.set(x,.017,z);staticGroup.add(d);}
  // A static environment map supplies sky reflections to glass and damp materials.
  const envScene=new T.Scene();envScene.background=new T.Color(0x819185);const hemi=new T.HemisphereLight(0xdac9a7,0x1f302a,3);envScene.add(hemi);const top=new T.Mesh(new T.SphereGeometry(70,32,20),new T.MeshBasicMaterial({color:0x9da58d,side:T.BackSide}));envScene.add(top);for(let i=0;i<12;i++){const m=new T.Mesh(new T.BoxGeometry(10,20+rand(0,30),10),new T.MeshBasicMaterial({color:0x3e5048}));const a=i/12*Math.PI*2;m.position.set(Math.cos(a)*40,0,Math.sin(a)*40);envScene.add(m);}const pmrem=new T.PMREMGenerator(ctx.renderer);const env=pmrem.fromScene(envScene,.045,.1,100);scene.environment=env.texture;pmrem.dispose();envScene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  return counts;
};

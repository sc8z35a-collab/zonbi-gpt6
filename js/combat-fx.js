'use strict';
/* Atmospheric weather and physical combat feedback; all generated locally. */
window.DZCombatFX = function(W){
  const {T,scene,camera,obstacles}=W;
  const random=(a,b)=>a+Math.random()*(b-a);
  const brass=new T.MeshStandardMaterial({color:0xb9954d,metalness:.82,roughness:.34});
  const shellGeometry=new T.CylinderGeometry(.014,.015,.052,12),fragmentGeometry=new T.BoxGeometry(.035,.035,.035);
  const grenadeMat=new T.MeshStandardMaterial({color:0x56654a,metalness:.48,roughness:.58}),grenadeGeo=new T.SphereGeometry(.1,20,16);
  const sparkMat=new T.MeshBasicMaterial({color:0xffc982}),dustMat=new T.MeshStandardMaterial({color:0x8b8873,roughness:1});
  const impactMat=new T.MeshBasicMaterial({color:0x202a22,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false});
  const impacts=[],particles=[],projectiles=[];
  const flashCanvas=document.createElement('canvas');flashCanvas.width=flashCanvas.height=128;const ctx=flashCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,249,197,1)');gradient.addColorStop(.2,'rgba(255,172,66,.9)');gradient.addColorStop(.55,'rgba(242,69,17,.3)');gradient.addColorStop(1,'rgba(92,38,17,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);const flareMap=new T.CanvasTexture(flashCanvas);flareMap.colorSpace=T.SRGBColorSpace;
  const rainCount=2800,rainPositions=new Float32Array(rainCount*6),rainVelocity=new Float32Array(rainCount);
  for(let i=0;i<rainCount;i++){const n=i*6;rainPositions[n]=random(-17,17);rainPositions[n+1]=random(0,23);rainPositions[n+2]=random(-42,25);rainPositions[n+3]=rainPositions[n]-.06;rainPositions[n+4]=rainPositions[n+1]+random(.18,.42);rainPositions[n+5]=rainPositions[n+2]+.04;rainVelocity[i]=random(14,22);}
  const rainGeo=new T.BufferGeometry();rainGeo.setAttribute('position',new T.BufferAttribute(rainPositions,3));const rain=new T.LineSegments(rainGeo,new T.LineBasicMaterial({color:0xc3d9cf,transparent:true,opacity:.2,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
  const rippleGeo=new T.RingGeometry(.85,1,32),ripples=[];
  const rippleMats=[0,1,2,3,4,5,6,7].map(()=>new T.MeshBasicMaterial({color:0xaebdb0,transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide}));
  for(let i=0;i<120;i++){const m=new T.Mesh(rippleGeo,rippleMats[i%8]);m.rotation.x=-Math.PI/2;m.position.set(random(-8.8,8.8),.025,random(-80,33));scene.add(m);ripples.push({mesh:m,phase:(i%8)/8});}
  const blastLight=new T.PointLight(0xff9e45,0,18,2);scene.add(blastLight);let blastLife=0;
  const lightning=new T.DirectionalLight(0xc4ddff,0);lightning.position.set(12,45,-40);scene.add(lightning);let nextLightning=20,lightningLife=0,weather=true;try{weather=localStorage.getItem('deadzone-weather')!=='off';}catch(e){}rain.visible=weather;ripples.forEach(r=>r.mesh.visible=weather);
  const ray=new T.Ray(),sphere=new T.Sphere(),point=new T.Vector3();
  function surfaceHit(origin,dir,maxDistance=70){let best=null,nearest=maxDistance;ray.set(origin,dir);
    function offer(t,normal,metal=false){if(t>.02&&t<nearest){nearest=t;best={point:origin.clone().addScaledVector(dir,t),normal:new T.Vector3(...normal),metal,distance:t};}}
    if(dir.y<-.001){const tg=(-.015-origin.y)/dir.y,gx=Math.abs(origin.x+dir.x*tg);offer(gx>9.55?(.155-origin.y)/dir.y:tg,[0,1,0]);}
    if(dir.x>.001)offer((10.28-origin.x)/dir.x,[-1,0,0]);else if(dir.x<-.001)offer((-10.28-origin.x)/dir.x,[1,0,0]);
    const o=W.rayObstacle?W.rayObstacle(origin,dir,nearest):null;if(o&&o.distance<nearest){nearest=o.distance;best={point:o.point,normal:o.normal,metal:o.metal,distance:o.distance};}return best;
  }
  function spawnParticle(position,velocity,material,life=.5,kind='fragment',geometry=fragmentGeometry){const mesh=new T.Mesh(geometry,material);mesh.position.copy(position);scene.add(mesh);const p={mesh,velocity,life,total:life,kind,bounced:false,spin:new T.Vector3(random(-12,12),random(-12,12),random(-12,12)),owned:false};particles.push(p);return p;}
  function shell(weapon){camera.updateMatrixWorld();const origin=new T.Vector3(camera.aspect<1?.13:.3,-.15,-.72).applyMatrix4(camera.matrixWorld);const v=new T.Vector3(random(1.5,2.7),random(.8,1.5),random(.1,.7)).applyQuaternion(camera.quaternion);const p=spawnParticle(origin,v,brass,7,'shell',shellGeometry);if(weapon===2)p.mesh.scale.set(1.5,1.8,1.5);}
  function impact(hit){if(!hit)return;const origin=hit.point.clone().addScaledVector(hit.normal,.018);for(let i=0;i<(hit.metal?12:7);i++){const v=hit.normal.clone().multiplyScalar(random(1,3)).add(new T.Vector3(random(-1.8,1.8),random(.3,2),random(-1.8,1.8)));spawnParticle(origin,v,hit.metal?sparkMat:dustMat,random(.18,.6));}
    const mesh=new T.Mesh(new T.CircleGeometry(random(.027,.065),14),impactMat);mesh.position.copy(origin);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),hit.normal);scene.add(mesh);impacts.push(mesh);if(impacts.length>140){const old=impacts.shift();scene.remove(old);old.geometry.dispose();}}
  function explosion(position){
    for(let i=0;i<56;i++){const v=new T.Vector3(random(-1,1),random(.2,1),random(-1,1)).normalize().multiplyScalar(random(3,11));spawnParticle(position,v,i%3?sparkMat:dustMat,random(.5,1.5));}
    const sprite=new T.Sprite(new T.SpriteMaterial({map:flareMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));sprite.position.copy(position).add(new T.Vector3(0,.5,0));sprite.scale.setScalar(.8);scene.add(sprite);particles.push({mesh:sprite,life:.65,total:.65,kind:'flare',owned:true});
    const ring=new T.Mesh(new T.RingGeometry(.94,1,64),new T.MeshBasicMaterial({color:0xd9b982,transparent:true,opacity:.7,side:T.DoubleSide,depthWrite:false}));ring.position.copy(position);ring.position.y=.04;ring.rotation.x=-Math.PI/2;scene.add(ring);particles.push({mesh:ring,life:.6,total:.6,kind:'shockwave',owned:true});
    blastLight.position.copy(position).add(new T.Vector3(0,1,0));blastLife=.5;blastLight.intensity=85;
  }
  function throwGrenade(origin,dir,onExplode){const mesh=new T.Mesh(grenadeGeo,grenadeMat);mesh.position.copy(origin);mesh.castShadow=true;const pin=new T.Mesh(new T.BoxGeometry(.045,.09,.045),brass);pin.position.y=.11;mesh.add(pin);scene.add(mesh);projectiles.push({mesh,velocity:dir.clone().multiplyScalar(11).add(new T.Vector3(0,3.8,0)),fuse:1.8,onExplode,bounces:0});}
  function updateProjectiles(dt){for(let i=projectiles.length-1;i>=0;i--){const g=projectiles[i];g.fuse-=dt;g.velocity.y-=9.8*dt;const next=g.mesh.position.clone().addScaledVector(g.velocity,dt);
      const hitObstacle=W.pointInObstacle?W.pointInObstacle(next,.1):null;if(hitObstacle){const top=(hitObstacle.h||1.5)+.1;if(g.mesh.position.y>=top-.05&&g.velocity.y<0){next.y=top;g.velocity.y=Math.abs(g.velocity.y)*.36;g.velocity.x*=.69;g.velocity.z*=.69;}else{const probe=g.mesh.position.clone();probe.x=next.x;if(W.pointInObstacle(probe,.1))g.velocity.x*=-.45;probe.x=g.mesh.position.x;probe.z=next.z;if(W.pointInObstacle(probe,.1))g.velocity.z*=-.45;next.x=g.mesh.position.x;next.z=g.mesh.position.z;}}
      if(next.x<-10.15||next.x>10.15){g.velocity.x=-g.velocity.x*.5;next.x=T.MathUtils.clamp(next.x,-10.15,10.15);}if(next.z<-84||next.z>35){g.velocity.z=-g.velocity.z*.5;next.z=T.MathUtils.clamp(next.z,-84,35);}
      const floor=Math.abs(next.x)>9.55?.25:.08;if(next.y<floor){next.y=floor;g.velocity.y=Math.abs(g.velocity.y)>1?Math.abs(g.velocity.y)*.36:0;g.velocity.x*=.69;g.velocity.z*=.69;g.bounces++;}else if(next.y<=floor+.001){g.velocity.x*=Math.max(0,1-dt*3);g.velocity.z*=Math.max(0,1-dt*3);}g.mesh.position.copy(next);g.mesh.rotation.x+=dt*7;g.mesh.rotation.z+=dt*4;
      if(g.fuse<=0){projectiles.splice(i,1);const p=g.mesh.position.clone();scene.remove(g.mesh);g.mesh.children[0].geometry.dispose();explosion(p);g.onExplode(p);}
    }}
  function update(time,dt,combat){rain.position.set(camera.position.x,0,camera.position.z-12);if(weather){for(let i=0;i<rainCount;i++){const n=i*6,dy=rainVelocity[i]*dt;rainPositions[n]+=.9*dt;rainPositions[n+1]-=dy;rainPositions[n+3]+=.9*dt;rainPositions[n+4]-=dy;if(rainPositions[n+1]<0){const len=rainPositions[n+4]-rainPositions[n+1];rainPositions[n]=random(-17,17);rainPositions[n+1]=23;rainPositions[n+2]=random(-42,25);rainPositions[n+3]=rainPositions[n]-.06;rainPositions[n+4]=23+len;rainPositions[n+5]=rainPositions[n+2]+.04;}}rainGeo.attributes.position.needsUpdate=true;
      ripples.forEach(r=>{r.phase=(r.phase+dt*1.4)%1;r.mesh.scale.setScalar(.015+r.phase*.22);});rippleMats.forEach((m,i)=>{m.opacity=(1-ripples[i].phase)*.19;});
      nextLightning-=dt;if(nextLightning<0){nextLightning=random(20,34);if(!matchMedia('(prefers-reduced-motion: reduce)').matches){lightningLife=1.1;api.onThunder?.();}}lightningLife=Math.max(0,lightningLife-dt);lightning.intensity=lightningLife>0?Math.sin(lightningLife/1.1*Math.PI)*1.7:0;
    }
    if(!combat)return;updateProjectiles(dt);if(blastLife>0){blastLife=Math.max(0,blastLife-dt);blastLight.intensity=blastLife/.5*85;}
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;const t=1-p.life/p.total;if(p.velocity){p.velocity.y-=9.8*dt;p.mesh.position.addScaledVector(p.velocity,dt);p.mesh.rotation.x+=p.spin.x*dt;p.mesh.rotation.z+=p.spin.z*dt;if(p.mesh.position.y<.04){p.mesh.position.y=.04;p.velocity.y=Math.abs(p.velocity.y)*.28;p.velocity.x*=.63;p.velocity.z*=.63;p.spin.multiplyScalar(.4);}}
      if(p.kind==='flare'){p.mesh.scale.setScalar(.8+t*7);p.mesh.material.opacity=(1-t)*.9;}if(p.kind==='shockwave'){p.mesh.scale.setScalar(.2+t*6);p.mesh.material.opacity=(1-t)*.45;}if(p.kind==='light')p.mesh.intensity=(1-t)*85;
      if(p.life<=0){scene.remove(p.mesh);if(p.owned){if(!p.mesh.isSprite)p.mesh.geometry?.dispose();p.mesh.material?.dispose();}particles.splice(i,1);}
    }}
  function clear(){blastLife=0;blastLight.intensity=0;for(const p of particles){scene.remove(p.mesh);if(p.owned){if(!p.mesh.isSprite)p.mesh.geometry?.dispose();p.mesh.material?.dispose();}}particles.length=0;for(const p of projectiles){scene.remove(p.mesh);p.mesh.children[0].geometry.dispose();}projectiles.length=0;impacts.forEach(m=>{scene.remove(m);m.geometry.dispose();});impacts.length=0;}
  const api={update,shell,impact,surfaceHit,throwGrenade,explosion,clear,onThunder:null,get projectiles(){return projectiles;},get shellCount(){return particles.filter(p=>p.kind==='shell').length;},get weather(){return weather;},toggleWeather(persist=true){weather=!weather;if(persist&&!/selftest=1/.test(location.search))try{localStorage.setItem('deadzone-weather',weather?'on':'off');}catch(e){}rain.visible=weather;ripples.forEach(r=>r.mesh.visible=weather);if(!weather){lightning.intensity=0;lightningLife=0;}return weather;}};return api;
};

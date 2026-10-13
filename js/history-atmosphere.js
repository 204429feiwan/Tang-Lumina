/* An independent cinnabar palace column and coiling dragon behind the floating chronology.
 * Built with the existing Three.js runtime; rendered by the city's ONE renderer.
 */
'use strict';
window.createHistoryAtmosphere = function (T, count = 12) {
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0xf0e3ca, .010);
  scene.add(new T.HemisphereLight(0xfff3dc, 0x81604b, 2.4));
  const goldLight = new T.DirectionalLight(0xffdcaa, 3.4);
  goldLight.position.set(-9, 20, 14);scene.add(goldLight);
  const jadeLight = new T.DirectionalLight(0xe0ad76, 1.8);
  jadeLight.position.set(8, 6, -9);scene.add(jadeLight);
  const camera = new T.PerspectiveCamera(42, 1, .1, 220);
  const column = new T.Group();scene.add(column);
  const topFocus = 33 + (count - 1) * 6.5, bottom = 18, top = topFocus + 16, height = top - bottom;
  const materials = [];
  function track(material) { materials.push({material, opacity:material.opacity});return material; }
  const engravingCanvas=document.createElement('canvas');engravingCanvas.width=engravingCanvas.height=256;
  const engraving=engravingCanvas.getContext('2d');engraving.fillStyle='#a28068';engraving.fillRect(0,0,256,256);
  engraving.strokeStyle='#e1ba73';engraving.lineWidth=2;
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=col*64+(row%2)*32,y=row*64;
    engraving.beginPath();engraving.moveTo(x-28,y+38);engraving.bezierCurveTo(x-25,y+16,x-9,y+16,x,y+28);engraving.bezierCurveTo(x+4,y+5,x+28,y+7,x+30,y+29);engraving.bezierCurveTo(x+46,y+23,x+51,y+46,x+32,y+47);engraving.lineTo(x-24,y+47);engraving.stroke();
  }
  const engravingMap=new T.CanvasTexture(engravingCanvas);engravingMap.wrapS=engravingMap.wrapT=T.RepeatWrapping;engravingMap.repeat.set(2,height/5);
  const coreMaterial = track(new T.MeshStandardMaterial({color:0x9c3c2b,metalness:.34,roughness:.61,bumpMap:engravingMap,bumpScale:.095,emissive:0x3b170f,emissiveIntensity:.08,transparent:true,opacity:1}));
  const core = new T.Mesh(new T.CylinderGeometry(1.82,1.94,height,40,1,false),coreMaterial);
  core.position.y=(top+bottom)/2;column.add(core);

  // A broad vermilion palace shaft, with one raised dragon winding on its surface.
  const gold=track(new T.MeshStandardMaterial({color:0xd4aa62,metalness:.78,roughness:.3,transparent:true,opacity:.97}));
  const darkGold=track(new T.MeshStandardMaterial({color:0x9a632f,metalness:.65,roughness:.43,transparent:true,opacity:.9}));
  function addMesh(geometry,material,x=0,y=0,z=0) {
    const mesh=new T.Mesh(geometry,material);mesh.position.set(x,y,z);column.add(mesh);return mesh;
  }
  for(const y of [bottom-.3,top+.3]) {
    addMesh(new T.CylinderGeometry(2.42,2.42,.72,40),darkGold,0,y,0);
    addMesh(new T.TorusGeometry(2.22,.14,10,40),gold,0,y+.32,0).rotation.x=Math.PI/2;
  }
  // Cross beams and gilded brackets read as palace architecture as the camera descends.
  for(const level of [0,3,6,9]) {
    const y=topFocus-level*6.5+8;
    addMesh(new T.BoxGeometry(7,.42,1.25),coreMaterial,0,y,0);
    addMesh(new T.BoxGeometry(7.4,.12,1.32),gold,0,y+.28,0);
    for(const side of [-1,1]) {
      const bracket=addMesh(new T.BoxGeometry(1.55,.22,.5),darkGold,side*2.25,y-.55,0);
      bracket.rotation.z=side*.42;
    }
  }
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    addMesh(new T.CylinderGeometry(.026,.026,height,6),darkGold,Math.sin(a)*1.88,(top+bottom)/2,Math.cos(a)*1.88);
  }
  function curve(t,phase=-3.2,offset=0) {
    const angle=t*height*.31+phase+offset;
    const radius=2.08+Math.sin(t*height*.68)*.045;
    return new T.Vector3(Math.sin(angle)*radius,top-t*height,Math.cos(angle)*radius);
  }
  // A chased-gold relief supplies the fine scales and flowing mane that geometry alone loses at page scale.
  const reliefTexture=new T.TextureLoader().load('../images/history/imperial-dragon-relief.png');
  reliefTexture.colorSpace=T.SRGBColorSpace;
  const reliefMaterial=track(new T.MeshStandardMaterial({
    map:reliefTexture,transparent:true,alphaTest:.32,side:T.DoubleSide,
    metalness:.28,roughness:.47,depthWrite:false,opacity:1
  }));
  const reliefGeometry=new T.CylinderGeometry(2.03,2.03,7,48,1,true,-.94,1.88);
  for(let index=0;index<count;index++) {
    const relief=new T.Mesh(reliefGeometry,reliefMaterial);
    relief.position.y=topFocus-index*6.5+5.1;
    relief.rotation.y=index*50*Math.PI/180;
    column.add(relief);
  }
  // Restrained chased-metal rings on the core, with no arms joining the cards.
  const collarCount=Math.floor(height/3.8), collarGeometry=new T.TorusGeometry(1.98,.045,8,40);
  const collars=new T.InstancedMesh(collarGeometry,track(new T.MeshStandardMaterial({color:0xc99c57,metalness:.72,roughness:.34,transparent:true,opacity:.85})),collarCount);
  const dummy=new T.Object3D();
  for(let i=0;i<collarCount;i++){dummy.position.set(0,bottom+1+i*3.8,0);dummy.rotation.x=Math.PI/2;dummy.updateMatrix();collars.setMatrixAt(i,dummy.matrix);}
  column.add(collars);

  const spriteCanvas=document.createElement('canvas');spriteCanvas.width=spriteCanvas.height=32;
  const context=spriteCanvas.getContext('2d'), glow=context.createRadialGradient(16,16,0,16,16,16);
  glow.addColorStop(0,'rgba(255,250,218,1)');glow.addColorStop(.15,'rgba(255,239,184,.88)');glow.addColorStop(.45,'rgba(255,218,149,.22)');glow.addColorStop(1,'rgba(255,205,136,0)');
  context.fillStyle=glow;context.fillRect(0,0,32,32);
  const sprite=new T.CanvasTexture(spriteCanvas);sprite.colorSpace=T.SRGBColorSpace;
  let seed=618907;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const dustPositions=[],dustColors=[];
  for(let i=0;i<1250;i++){
    const a=random()*Math.PI*2,r=3.2+random()*14;
    dustPositions.push(Math.sin(a)*r,bottom-8+random()*(height+16),Math.cos(a)*r);
    const gold=random()>.23;dustColors.push(gold?1:.4,gold?.78:.91,gold?.43:.76);
  }
  const dustGeometry=new T.BufferGeometry();dustGeometry.setAttribute('position',new T.Float32BufferAttribute(dustPositions,3));dustGeometry.setAttribute('color',new T.Float32BufferAttribute(dustColors,3));
  const dustMaterial=track(new T.PointsMaterial({map:sprite,size:.14,vertexColors:true,transparent:true,opacity:.74,depthWrite:false,blending:T.AdditiveBlending}));
  const dust=new T.Points(dustGeometry,dustMaterial);scene.add(dust);
  const glintGeometry=new T.BufferGeometry();glintGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(30*3),3));
  const glints=new T.Points(glintGeometry,track(new T.PointsMaterial({map:sprite,color:0xffdf96,size:.24,transparent:true,opacity:.85,depthWrite:false,blending:T.AdditiveBlending})));column.add(glints);

  const lanternPositions=[];
  for(let i=0;i<110;i++)lanternPositions.push((random()-.5)*24,.8+random()*6,(random()-.5)*24);
  const lanternGeometry=new T.BufferGeometry();lanternGeometry.setAttribute('position',new T.Float32BufferAttribute(lanternPositions,3));
  const lanternMaterial=new T.PointsMaterial({map:sprite,color:0xffd393,size:.13,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending});
  const lanterns=new T.Points(lanternGeometry,lanternMaterial);
  let lastOpacity=-1;
  function update(index,time,opacity,cityOpacity) {
    scene.visible=opacity>.001;
    if(opacity!==lastOpacity){for(const item of materials)item.material.opacity=item.opacity*opacity;lastOpacity=opacity;}
    const focusY=topFocus-index*6.5;
    camera.position.set(0,focusY+1.1,26);camera.lookAt(0,focusY,0);
    column.rotation.y=-index*50*Math.PI/180+Math.sin(time*.07)*.055;
    dust.rotation.y=-index*.12+time*.012;dust.position.y=Math.sin(time*.13)*.6;
    const positions=glintGeometry.attributes.position;
    for(let i=0;i<30;i++){
      const t=(i/30+time*.008)%1,p=curve(t,i%2?Math.PI+.35:.35,i%2?.40:.28);
      positions.setXYZ(i,p.x,p.y,p.z);
    }
    positions.needsUpdate=true;
    lanterns.visible=cityOpacity>.001;lanternMaterial.opacity=.64*cityOpacity;
    lanterns.position.y=Math.sin(time*.24)*.32;lanterns.rotation.y=Math.sin(time*.07)*.018;
  }
  return {scene,camera,lanterns,update,particleCount:1390};
};

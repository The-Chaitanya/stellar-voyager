import * as THREE from 'three';

// Procedural teaching visuals: geometry and noise, not a fluid or relativity solver.
const noise = `
float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.13);}`;
const surfaceVertex=`varying vec3 p;varying vec3 n;varying vec3 eye;void main(){p=position;vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);eye=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;

export function createStellarEffects(system, star, glow) {
  let seed=2048;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const material=(uniforms,vertexShader,fragmentShader,extra={})=>new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,...extra});
  const add=mesh=>{system.add(mesh);return mesh;};
  const transparent={transparent:true,depthWrite:false,blending:THREE.AdditiveBlending};
  const surface=material({time:{value:0},tint:{value:new THREE.Color()},giant:{value:0}},surfaceVertex,`
    varying vec3 p;varying vec3 n;varying vec3 eye;uniform float time;uniform vec3 tint;uniform float giant;${noise}
    void main(){
      vec3 flow=p*6.+vec3(sin(p.y*4.+time*.08),time*.055,cos(p.x*3.-time*.06))*.7;
      float convection=fbm(flow);vec3 warped=p*(32.-giant*16.)+vec3(convection*2.,time*.12,0.);
      float cells=fbm(warped);float lanes=smoothstep(.28,.56,cells);
      float spots=1.-.66*smoothstep(.66,.79,fbm(p*5.+vec3(0.,time*.022,0.)));
      float limb=.36+.64*pow(max(dot(normalize(n),normalize(eye)),0.),.45);
      vec3 hot=tint*(.86+lanes*.26)+vec3(.1)*smoothstep(.58,.78,cells);
      gl_FragColor=vec4(hot*(.93+convection*.24)*spots*limb,1.);
    }`);
  star.material.dispose();star.material=surface;

  // Soft, overlapping gas parcels with differential rotation and turbulent edges.
  const parcels=420, centers=[],sizes=[],phases=[];
  for(let i=0;i<parcels;i++){
    const arm=i%3,r=.35+Math.pow(random(),.7)*3.8;
    const a=arm*Math.PI*2/3+r*.85+(random()-.5)*1.1;
    centers.push(Math.cos(a)*r,(random()-.5)*(1.2+r*.24),Math.sin(a)*r*.65);
    sizes.push(.55+random()*1.05);phases.push(random()*30);
  }
  const gasGeometry=new THREE.InstancedBufferGeometry();
  const quad=new THREE.PlaneGeometry(1,1);gasGeometry.index=quad.index;gasGeometry.attributes.position=quad.attributes.position;gasGeometry.attributes.uv=quad.attributes.uv;
  gasGeometry.setAttribute('center',new THREE.InstancedBufferAttribute(new Float32Array(centers),3));
  gasGeometry.setAttribute('parcelSize',new THREE.InstancedBufferAttribute(new Float32Array(sizes),1));
  gasGeometry.setAttribute('phase',new THREE.InstancedBufferAttribute(new Float32Array(phases),1));gasGeometry.instanceCount=parcels;
  const gasMat=material({time:{value:0},collapse:{value:0},opacity:{value:1}},`
    attribute vec3 center;attribute float parcelSize;attribute float phase;
    uniform float time;uniform float collapse;varying vec2 tex;varying float ph;varying float radius;
    void main(){tex=uv;ph=phase;radius=length(center);float a=time*.055/(.5+radius)+collapse*.9;
      vec3 c=center;c.xz=mat2(cos(a),-sin(a),sin(a),cos(a))*c.xz;c*=1.-collapse*.7;
      c.y+=sin(time*.13+phase)*.12;vec4 mv=modelViewMatrix*vec4(c,1.);
      mv.xy+=position.xy*parcelSize*(1.-collapse*.4);gl_Position=projectionMatrix*mv;}`,`
    varying vec2 tex;varying float ph;varying float radius;uniform float time;uniform float opacity;${noise}
    void main(){vec2 q=(tex-.5)*2.;float edge=1.-smoothstep(.2,1.,length(q));
      vec3 v=vec3(q*2.8,ph+time*.045);float density=fbm(v+fbm(v*1.7));
      float filament=smoothstep(.28,.75,density);float alpha=edge*filament*.16*opacity;
      vec3 gas=mix(vec3(.21,.12,.32),vec3(.26,.63,.75),smoothstep(.3,.75,density));
      gas=mix(gas,vec3(.76,.28,.22),smoothstep(2.,4.7,radius)*.65);
      gl_FragColor=vec4(gas,alpha);}`,transparent);
  const gas=add(new THREE.Mesh(gasGeometry,gasMat));gas.frustumCulled=false;

  // Magnetic-loop geometry carries bright knots of plasma along each arch.
  const flares=add(new THREE.Group());const flareMeshes=[];
  for(let i=0;i<9;i++){
    const points=[];for(let j=0;j<=48;j++){const a=j/48*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*.3, .952+Math.sin(a)*(.25+(i%3)*.11),0));}
    const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,.012,5,false);
    const fm=material({time:{value:0},offset:{value:i*1.17},growth:{value:0},tint:{value:new THREE.Color()},power:{value:1}},
      `uniform float growth;varying vec2 tex;void main(){tex=uv;vec3 p=position;p.y=.952+(p.y-.952)*growth;p.z+=sin(uv.x*3.14159)*growth*.07;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      `varying vec2 tex;uniform float time;uniform float offset;uniform vec3 tint;uniform float power;
      void main(){float moving=.55+.45*sin(tex.x*27.-time*2.+offset);float ends=sin(tex.x*3.14159);gl_FragColor=vec4(tint*(1.+moving*.8),(.3+moving*.6)*power*sqrt(max(ends,0.)));}`,transparent);
    const loop=new THREE.Mesh(geometry,fm);loop.rotation.set(i*.73,i*1.39,i*.91);flares.add(loop);flareMeshes.push(loop);
    const halo=new THREE.Mesh(geometry,fm.clone());halo.rotation.copy(loop.rotation);halo.scale.setScalar(1.012);halo.material.uniforms.power.value=.23;flares.add(halo);flareMeshes.push(halo);
  }

  // A one-way expanding, corrugated shell; its phase also follows timeline scrubbing.
  const shockMat=material({time:{value:0},phase:{value:0}},surfaceVertex,`
    varying vec3 p;varying vec3 n;varying vec3 eye;uniform float time;uniform float phase;${noise}
    void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(eye))),2.2);
      float knots=fbm(p*12.+time*.025);float veins=smoothstep(.4,.69,knots);
      vec3 color=mix(vec3(.19,.48,1.),vec3(1.,.28,.07),phase);
      gl_FragColor=vec4(color*(.7+veins),rim*(.2+veins*.65)*(1.-phase*.65));}`,{...transparent,side:THREE.FrontSide});
  const shock=add(new THREE.Mesh(new THREE.SphereGeometry(1,80,48),shockMat));
  const debrisCount=5500, directions=[],speeds=[],randoms=[];
  for(let i=0;i<debrisCount;i++){const u=random()*2-1,a=random()*Math.PI*2,v=Math.sqrt(1-u*u);directions.push(v*Math.cos(a),u,v*Math.sin(a));speeds.push(.35+random()*.65);randoms.push(random());}
  const debrisGeometry=new THREE.BufferGeometry();debrisGeometry.setAttribute('position',new THREE.Float32BufferAttribute(directions,3));debrisGeometry.setAttribute('speed',new THREE.Float32BufferAttribute(speeds,1));debrisGeometry.setAttribute('seed',new THREE.Float32BufferAttribute(randoms,1));
  const debrisMat=material({phase:{value:0},time:{value:0},gentle:{value:0},pixelRatio:{value:1}},`
    attribute float speed;attribute float seed;uniform float phase;uniform float time;uniform float gentle;uniform float pixelRatio;varying float heat;varying float alpha;
    void main(){float expansion=.8+phase*4.4;vec3 pos=position*expansion*(.6+speed*.4);
      if(gentle>.5){pos.y*=1.45;pos.xz*=.72+.28*abs(position.y);}
      pos+=position*sin(seed*87.+time*.2)*.018;vec4 mv=modelViewMatrix*vec4(pos,1.);
      gl_Position=projectionMatrix*mv;gl_PointSize=clamp((9.+seed*15.)*pixelRatio/max(1.,-mv.z),1.,8.);
      heat=speed;alpha=(1.-phase*.55)*(.35+seed*.65);}`,`
    varying float heat;varying float alpha;uniform float gentle;
    void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;
      vec3 c=mix(vec3(1.,.21,.055),vec3(.38,.7,1.),heat);
      if(gentle>.5)c=mix(vec3(.16,.7,.8),vec3(.78,.29,.36),heat);
      gl_FragColor=vec4(c,exp(-d*d*5.)*alpha);}`,transparent);
  const debris=add(new THREE.Points(debrisGeometry,debrisMat));debris.frustumCulled=false;

  // Thick accretion flow; the approaching side brightens with the viewing direction.
  const hole=add(new THREE.Group());
  const shadow=new THREE.Mesh(new THREE.SphereGeometry(.69,64,40),new THREE.MeshBasicMaterial({color:0x000000}));hole.add(shadow);
  const accretionMat=material({time:{value:0},opacity:{value:1}},`
    varying vec3 p;varying vec3 world;varying vec3 tangent;
    void main(){p=position;world=(modelMatrix*vec4(position,1.)).xyz;tangent=normalize(mat3(modelMatrix)*vec3(-position.y,position.x,0.));gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}`,`
    varying vec3 p;varying vec3 world;varying vec3 tangent;uniform float time;uniform float opacity;${noise}
    void main(){float r=length(p.xy),a=atan(p.y,p.x);float orbit=a-time*1.15/pow(r,1.5);
      vec3 flow=vec3(cos(orbit)*r*5.,sin(orbit)*r*5.,r*12.);float turb=fbm(flow);
      float strands=.55+.45*sin(r*100.+turb*8.+a*2.);
      float inner=smoothstep(.77,.92,r),outer=1.-smoothstep(1.65,2.9,r);
      float beam=pow(1.+.33*dot(normalize(cameraPosition-world),normalize(tangent)),2.4);
      vec3 heat=mix(vec3(1.,.2,.025),vec3(1.,.86,.53),1.-smoothstep(.85,2.4,r));
      gl_FragColor=vec4(heat*(.55+strands*.5+turb*.5)*beam,inner*outer*opacity);}`,{...transparent,side:THREE.DoubleSide});
  const diskGroup=new THREE.Group();diskGroup.rotation.x=1.18;hole.add(diskGroup);
  for(let i=0;i<3;i++){const disk=new THREE.Mesh(new THREE.RingGeometry(.77,2.9,160,24),i===0?accretionMat:accretionMat.clone());disk.position.z=(i-1)*.028;disk.material.uniforms.opacity.value=i===1?.72:.2;diskGroup.add(disk);}
  // This halo illustrates lensed disk light, without claiming general-relativistic ray tracing.
  const lensMat=material({time:{value:0}},surfaceVertex,`
    varying vec3 p;varying vec3 n;varying vec3 eye;uniform float time;${noise}
    void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(eye))),4.);
      float bands=.65+.35*noise(p*24.+time*.09);gl_FragColor=vec4(vec3(1.,.59,.21)*bands,rim*.7);}`,transparent);
  const lens=new THREE.Mesh(new THREE.SphereGeometry(.77,64,40),lensMat);hole.add(lens);
  let stageKey='',stageAge=0;
  return {
    seek(){stageAge=0;},
    update({s,f,selected,time,dt,radius,reduced,playing,pixelRatio}){
      const key=selected+s;if(key!==stageKey){stageKey=key;stageAge=0;}
      if(!reduced&&!playing)stageAge+=dt;
      surface.uniforms.time.value=time;surface.uniforms.tint.value.set(s===3?'#ff853b':s===5?'#d8edff':selected==='sun'?'#ffc375':'#b6d9ff');surface.uniforms.giant.value=s===3?1:0;
      glow.material.uniforms.tint.value.copy(surface.uniforms.tint.value);
      gas.visible=s<2;gasMat.uniforms.time.value=time;gasMat.uniforms.collapse.value=s===0?f*.45:.45+f*.5;gasMat.uniforms.opacity.value=s===0?1:1-f*.85;
      flares.visible=s===1||s===2||s===3;flares.scale.setScalar(radius);flares.rotation.y=time*.024;
      flareMeshes.forEach((m,i)=>{
        const event=Math.floor(i/2),phase=(time/(9+event*.73)+event*.173)%1;
        const birth=THREE.MathUtils.smoothstep(phase,.05,.24),fade=1-THREE.MathUtils.smoothstep(phase,.65,.96);
        const u=m.material.uniforms;u.time.value=time;u.tint.value.copy(surface.uniforms.tint.value);
        u.growth.value=.08+birth*(.65+phase*.9);u.power.value=(i%2?.2:.9)*birth*fade;
      });
      const phase=Math.min(.98,f+(1-f)*(1-Math.exp(-stageAge/10)));
      shock.visible=s===4&&selected!=='sun';shock.scale.setScalar(.95+phase*4.65);shockMat.uniforms.time.value=time;shockMat.uniforms.phase.value=phase;
      debris.visible=s===4;debrisMat.uniforms.time.value=time;debrisMat.uniforms.phase.value=phase;debrisMat.uniforms.gentle.value=selected==='sun'?1:0;debrisMat.uniforms.pixelRatio.value=pixelRatio;
      hole.visible=s===5&&selected==='heavy';for(const m of diskGroup.children)m.material.uniforms.time.value=time;lensMat.uniforms.time.value=time;
      if(hole.visible){star.visible=false;glow.visible=false;}
    }
  };
}

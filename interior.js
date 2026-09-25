import * as THREE from './three.module.js';
const layer=(name,color,radius,text,fusion=false)=>({name,color,radius,text,fusion});
export function interiorLayers(track,stage){
  if(stage===1)return [
    layer('Gathering gas','#c98249',1,'Gas is still falling inward. Gravity supplies most of the energy as the young star contracts.'),
    layer('Heating centre','#ffd17c',.45,'The centre is getting hotter and denser. Steady hydrogen fusion has not started yet.')];
  if(stage===2)return track==='sun'?[
    layer('Convection zone','#de702d',1,'Hot gas rises and cooler gas sinks, carrying energy toward the surface.'),
    layer('Radiative zone','#ffbd55',.7,'Energy works its way outward as light is repeatedly absorbed and re-emitted.'),
    layer('Hydrogen-fusing core','#fff3ad',.26,'Hydrogen nuclei join to make helium, releasing energy. The Sun’s core is about 15 million degrees Celsius.',true)
  ]:[
    layer('Outer envelope','#79aaff',1,'Energy travels outward through the surrounding gas, mainly by radiation.'),
    layer('Mixing, fusing core','#f3e4ad',.43,'Hydrogen becomes helium and releases energy. Strong convection mixes fuel inside this massive star’s core.',true)];
  if(stage===3)return track==='sun'?[
    layer('Expanded envelope','#d75c35',1,'The outer gas has swollen and cooled. This is why the star looks red.'),
    layer('Hydrogen-burning shell','#ffc055',.46,'Hydrogen fusion continues in a shell around the centre.',true),
    layer('Helium-fusing core','#f6efa6',.25,'This example shows a later giant phase: helium joins to make carbon and oxygen. Earlier, the helium core is not yet fusing.',true)
  ]:[
    layer('Outer envelope','#ce5d3c',1,'The extended outer layers surround a much smaller, hotter interior.'),
    layer('Hydrogen & helium shells','#ffad4e',.76,'Fusion in shells makes helium, carbon and oxygen. This is a simplified late-life snapshot.',true),
    layer('Carbon, neon & oxygen shells','#ee7069',.55,'Deeper, hotter burning shells build progressively heavier elements.',true),
    layer('Silicon-burning shell','#ab99ef',.34,'In the final stages, silicon burning produces iron-group elements.',true),
    layer('Iron core','#96b5ca',.19,'Iron fusion cannot supply the energy needed to support this core. Eventually it collapses.')];
  return [];
}
export function createInterior(parent){
  const group=new THREE.Group();parent.add(group);
  const uniforms={cut:{value:0},time:{value:0},count:{value:0},selected:{value:0},
    radii:{value:[1,0,0,0,0]},colors:{value:Array.from({length:5},()=>new THREE.Color())},burn:{value:[0,0,0,0,0]}};
  const vertex='varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const shell=new THREE.Mesh(new THREE.SphereGeometry(1,80,56),new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:`
    varying vec3 p;uniform float cut;uniform vec3 colors[5];uniform float time;
    void main(){if(p.z>cut)discard;float grain=.84+.12*sin(p.x*61.+sin(p.y*37.)+time*.13)*sin(p.y*53.);gl_FragColor=vec4(colors[0]*grain,1.);}`}));
  group.add(shell);
  const face=new THREE.Mesh(new THREE.CircleGeometry(1,128),new THREE.ShaderMaterial({uniforms,vertexShader:vertex,side:THREE.DoubleSide,fragmentShader:`
    varying vec3 p;uniform float cut;uniform float time;uniform int count;uniform int selected;
    uniform float radii[5];uniform vec3 colors[5];uniform float burn[5];
    void main(){float r=sqrt(dot(p.xy,p.xy)+cut*cut);if(r>1.)discard;int band=0;
      for(int i=1;i<5;i++){if(i<count&&r<radii[i])band=i;}
      vec3 c=colors[band];float ripple=.94+.06*sin(r*95.-time*1.8);
      float energy=burn[band]*(.09+.09*sin(time*2.2+r*55.));
      float focus=band==selected?1.1:.8;
      gl_FragColor=vec4(c*(ripple+energy)*focus,1.);}`}));
  group.add(face);group.visible=false;
  return {setLayers(layers){uniforms.count.value=layers.length;layers.forEach((l,i)=>{uniforms.radii.value[i]=l.radius;uniforms.colors.value[i].set(l.color);uniforms.burn.value[i]=l.fusion?1:0;});},
    update({active,peel,radius,time,camera,selected}){group.visible=active;if(!active)return;
      group.quaternion.copy(camera.getWorldQuaternion(new THREE.Quaternion()));
      group.scale.setScalar(Math.max(.9,radius));uniforms.cut.value=1-peel*.01;
      face.position.z=uniforms.cut.value+.001;uniforms.time.value=time;uniforms.selected.value=selected;
    }};
}

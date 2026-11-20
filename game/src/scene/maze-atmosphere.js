import { Reflector } from './water-mirror.js';
import { POLISH } from '../polish.js';
import { shoreField, waterShader } from './water-surface.js';
const styles = [
  ['青竹渡', 0xbac7b6, 0x7fa7ae, 0xffdfaa, 0x41786c, 'water', -0.65, 0.02],
  ['紅楓驛', 0xd0baa0, 0x91a1a2, 0xffcd87, 0x90745d, 'earth', -0.79, 0.02],
  ['蘆花汀', 0xb3d3ce, 0x6aa3b1, 0xffe7ac, 0x427c79, 'water', -0.65, 0.018],
  ['聽雪棧', 0xcbd9e3, 0x7998b5, 0xf1f3ff, 0x95aebe, 'mist', -7.5, 0.019],
  ['空山琴臺', 0xbfc7b5, 0x82969a, 0xffd3a0, 0x8caaa4, 'mist', -5.5, 0.022],
  ['桃花石陣', 0xdac9c0, 0xabb8b1, 0xffdcbd, 0x829174, 'earth', -0.88, 0.02],
  ['襄陽殘垣', 0xc3aba1, 0x927b77, 0xffbd8e, 0x92765f, 'earth', -1.0, 0.023],
  ['寒玉石室', 0x445e68, 0x182d42, 0x9cdce8, 0x315e66, 'water', -1.0, 0.021],
  ['倒影天街', 0xc0bccf, 0x747eaa, 0xffdeaf, 0x837e9d, 'water', -2.18, 0.018],
  ['無刻漏臺', 0x414e68, 0x182137, 0xe8cfa6, 0x35435e, 'stars', -7.0, 0.017]
];
const atmospheres = styles.map(([name, horizon, zenith, sun, base, mode, level, fog]) => ({
  name,
  horizon,
  zenith,
  sun,
  base,
  mode,
  level,
  fog
}));
const bytes = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
function setting(index) {
  return atmospheres[index] || atmospheres[0];
}
const hashNoise = `
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545);}
 float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),u.x),u.y);}
`;
const post = `
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
`;
function stageSky(T, profile) {
  const stars = profile.mode === 'stars',
    cave = profile.name === '寒玉石室';
  const mat = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      horizon: { value: new T.Color(profile.horizon) },
      zenith: { value: new T.Color(profile.zenith) },
      sunColor: { value: new T.Color(profile.sun) },
      night: { value: stars ? 1 : 0 },
      glow: { value: cave ? 0.06 : stars ? 0.3 : 1 }
    },
    vertexShader:
      'varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 dir;uniform vec3 horizon,zenith,sunColor;uniform float night,glow;${hashNoise}
    void main(){vec3 n=normalize(dir);float h=max(0.,n.y),s=max(0.,dot(n,normalize(vec3(-.58,.27,-.76))));vec3 c=mix(horizon,zenith,pow(h,.56));
      vec2 uv=n.xz/max(.12,h+.09);float clouds=noise(uv*.95)*.6+noise(uv*2.5)*.26+noise(uv*5.4)*.14;
      c=mix(c,mix(horizon,sunColor,.28),smoothstep(.52,.79,clouds)*.19);c+=sunColor*(pow(s,14.)*.19+smoothstep(.9983,.9990,s)*.74)*glow*smoothstep(0.,.16,h);
      if(night>.5){vec2 sp=vec2(atan(n.x,n.z)*63.,asin(clamp(n.y,-1.,1.))*62.);vec2 grid=floor(sp);float rad=length(fract(sp)-vec2(hash(grid),hash(grid+4.)));float star=step(.87,hash(grid+17.))*smoothstep(.100,.018,rad);c+=vec3(.54,.64,.81)*star;}
      gl_FragColor=vec4(c,1.);${post}}`
  });
  const sky = new T.Mesh(new T.SphereGeometry(80, 36, 18), mat);
  sky.name = profile.name + '天色';
  sky.renderOrder = -500;
  return sky;
}
// A maze water stage with the shared surface: depth from the bank, lapping edge, fine flecks.
function stageWater(T, p, gpu, scenery) {
  const base = new T.Color(p.base),
    haze = new T.Color(p.horizon),
    cave = p.name === '寒玉石室';
  const shore = scenery ? shoreField(T, scenery, p.level) : null;
  const shader = waterShader(T, {
    name: 'Maze_Mirrored_Water',
    deep: base.clone().multiplyScalar(cave ? 0.5 : 0.4),
    shallow: base
      .clone()
      .lerp(haze, cave ? 0.2 : 0.14)
      .multiplyScalar(cave ? 1.15 : 0.86),
    haze,
    sky: haze.clone(),
    foam: haze.clone().lerp(new T.Color(0xffffff), cave ? 0.25 : 0.55),
    mist: p.fog,
    sparkle: cave ? 0.3 : 0.4,
    mirror: gpu,
    shore
  });
  const geom = new T.PlaneGeometry(165, 165);
  let mesh;
  if (gpu) {
    mesh = new Reflector(geom, {
      clipBias: 0.003,
      textureWidth: 512,
      textureHeight: 384,
      multisample: 0,
      shader
    });
    const reflect = mesh.onBeforeRender;
    let last = null;
    mesh.onBeforeRender = function (renderer, scene, cam, ...rest) {
      if (last === cam.userData.ferryVersion) return;
      last = cam.userData.ferryVersion;
      reflect.call(this, renderer, scene, cam, ...rest);
    };
  } else mesh = new T.Mesh(geom, new T.ShaderMaterial(shader));
  if (shore) {
    mesh.material.uniforms.shoreMap.value = shore.texture;
    mesh.material.addEventListener('dispose', () => shore.texture.dispose());
  }
  mesh.name = p.name + '遠景地平面';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = p.level;
  return mesh;
}
function stagePlane(T, p, gpu, scenery = null) {
  if (POLISH.water && p.mode === 'water') return stageWater(T, p, gpu, scenery);
  const water = p.mode === 'water',
    cloud = ['mist', 'cloud', 'stars'].includes(p.mode),
    geom = new T.PlaneGeometry(165, 165);
  const uniforms = {
    color: { value: new T.Color(p.base) },
    base: { value: new T.Color(p.base) },
    haze: { value: new T.Color(p.horizon) },
    tDiffuse: { value: null },
    textureMatrix: { value: new T.Matrix4() },
    universe: { value: p.mode === 'stars' ? 1 : 0 },
    time: { value: 0 },
    mirrorOn: { value: water && gpu ? 1 : 0 },
    mode: { value: water ? 1 : cloud ? 2 : 0 },
    density: { value: p.fog }
  };
  const vertexShader =
    'uniform mat4 textureMatrix;varying vec4 ref;varying vec3 pos;void main(){ref=textureMatrix*vec4(position,1.);pos=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const fragmentShader = `uniform vec3 base,haze;uniform sampler2D tDiffuse;uniform float time,mode,mirrorOn,density,universe;varying vec4 ref;varying vec3 pos;${hashNoise}
  void main(){vec2 p=pos.xz;float n=noise(p*.48)*.64+noise(p*1.97)*.36,f=1.-exp(-pow(density*distance(cameraPosition,pos),2.));vec3 c=base;
    if(mode<.5){float coarse=noise(p*3.),grit=noise(p*37.);c*=.80+.33*n+.12*grit;c=mix(c,haze,.07*coarse);}
    else if(mode<1.5){float a=sin(p.y*7.+p.x*1.2+time*.62+sin(p.x)*1.8),b=sin(p.x*4.3+p.y*2.1-time*.4);
      vec2 uv=ref.xy/ref.w+vec2(a,b)*.003;vec3 reflectColor=mirrorOn>.5?texture2D(tDiffuse,clamp(uv,.002,.998)).rgb:haze*.80;
      float fres=pow(1.-abs(normalize(cameraPosition-pos).y),2.);c=mix(base*(.78+n*.38),reflectColor,.23+fres*.52);c+=vec3(.11,.13,.11)*pow(max(0.,a*.55+b*.45),14.);}
    else{float vapour=noise(p*.11+time*.017)*.54+noise(p*.21)*.30+noise(p*.60)*.16;c=mix(base,haze,smoothstep(.17,.84,vapour)*.56);
      if(universe>.5){vec2 sp=p*.67,g=floor(sp);float d=length(fract(sp)-vec2(hash(g),hash(g+9.)));
        c+=vec3(.59,.63,.69)*step(.74,hash(g+31.))*(1.-smoothstep(.016,.052,d));
        float belt=exp(-5.*abs(sin(p.x*.055+p.y*.094+vapour*.6)));c+=vec3(.022,.027,.05)*belt*vapour;}}
    gl_FragColor=vec4(mix(c,haze,f*.89),1.);${post}}`;
  let mesh;
  if (water && gpu) {
    mesh = new Reflector(geom, {
      clipBias: 0.003,
      textureWidth: 512,
      textureHeight: 384,
      multisample: 0,
      shader: { name: 'Maze_Mirrored_Water', uniforms, vertexShader, fragmentShader }
    });
    const reflect = mesh.onBeforeRender;
    let last = null;
    mesh.onBeforeRender = function (renderer, scene, cam, ...rest) {
      if (last === cam.userData.ferryVersion) return;
      last = cam.userData.ferryVersion;
      reflect.call(this, renderer, scene, cam, ...rest);
    };
  } else mesh = new T.Mesh(geom, new T.ShaderMaterial({ uniforms, vertexShader, fragmentShader }));
  mesh.name = p.name + '遠景地平面';
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = p.level;
  return mesh;
}

export { atmospheres, bytes, setting, stageSky, stagePlane };

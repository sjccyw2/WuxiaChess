import { Reflector } from './water-mirror.js';
function buildRiver(T, useMirror) {
  const vertexShader = `
    uniform mat4 textureMatrix; varying vec4 reflectionUv; varying vec3 wpos;
    void main(){wpos=(modelMatrix*vec4(position,1.)).xyz;reflectionUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
  `;
  const fragmentShader = `
    uniform sampler2D tDiffuse; uniform float time;uniform float mirrorOn; varying vec4 reflectionUv;varying vec3 wpos;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);}
    void main(){
      vec2 p=wpos.xz;float t=time*.50;
      float a=sin(p.x*3.6+p.y*1.6+t+2.0*noise(p*.69));
      float b=sin(p.y*8.-p.x*2.1-t*1.3+1.9*sin(p.x*1.3+p.y*.6+t*.2));
      vec2 wobble=vec2(a+b*.6,b+a*.4)*.0025;
      vec3 view=normalize(cameraPosition-wpos);float fres=pow(1.-abs(view.y),2.4);
      float bed=noise(p*.79)*.65+noise(p*2.6)*.35;
      vec3 water=mix(vec3(.038,.163,.142),vec3(.112,.326,.273),bed);
      vec2 uv=reflectionUv.xy/reflectionUv.w+wobble;
      vec3 refl=mirrorOn>.5?texture2D(tDiffuse,clamp(uv,.002,.998)).rgb:vec3(.34,.43,.37);
      water=mix(water,refl,.32+.5*fres);
      float ridge=pow(max(0.,b*.61+a*.39),17.);water+=vec3(.14,.21,.17)*ridge*(.3+.7*bed);
      float glint=smoothstep(.84,1.,sin(p.y*19.+7.*noise(p*1.9)+t))*smoothstep(.69,.93,noise(p*vec2(2.5,5.8)));
      water+=vec3(.33,.31,.22)*glint;
      float riverFog=1.-exp(-.00066*pow(length(cameraPosition-wpos),2.));water=mix(water,vec3(.49,.56,.51),riverFog*.86);
      gl_FragColor=vec4(water,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;
  const uniforms = {
    color: { value: new T.Color() },
    textureMatrix: { value: new T.Matrix4() },
    tDiffuse: { value: null },
    time: { value: 0 },
    mirrorOn: { value: useMirror ? 1 : 0 }
  };
  const geom = new T.PlaneGeometry(160, 160);
  let surface;
  if (useMirror) {
    surface = new Reflector(geom, {
      clipBias: 0.003,
      textureWidth: 512,
      textureHeight: 384,
      multisample: 0,
      shader: { name: 'FerryRiver', uniforms, vertexShader, fragmentShader }
    });
    const reflect = surface.onBeforeRender;
    let lastKey = '';
    surface.onBeforeRender = function (renderer, scene, camera, ...rest) {
      if (camera.userData.ferryVersion === lastKey) return;
      lastKey = camera.userData.ferryVersion;
      reflect.call(this, renderer, scene, camera, ...rest);
    };
  } else surface = new T.Mesh(geom, new T.ShaderMaterial({ uniforms, vertexShader, fragmentShader }));
  surface.name = '洛水';
  surface.rotation.x = -Math.PI / 2;
  surface.position.y = -0.65;
  surface.userData.kind = 'water';
  return surface;
}
function buildSky(T) {
  const geo = new T.SphereGeometry(78, 44, 20);
  const mat = new T.ShaderMaterial({
    side: T.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {},
    vertexShader: `varying vec3 dir;void main(){dir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec3 dir;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545);}
    float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);}
    void main(){vec3 n=normalize(dir);float h=max(0.,n.y);
      vec3 horizon=vec3(.58,.66,.62),zenith=vec3(.155,.31,.34);
      vec3 c=mix(horizon,zenith,pow(h,.56));vec3 sun=normalize(vec3(-.59,.24,-.75));
      float sd=max(0.,dot(n,sun));c+=vec3(.39,.20,.065)*pow(sd,10.);c+=vec3(.75,.48,.20)*smoothstep(.9987,.9994,sd);
      vec2 uv=n.xz/max(.09,h+.05);float cloud=noise(uv*1.22)*.55+noise(uv*2.4)*.29+noise(uv*4.85)*.16;
      c=mix(c,vec3(.88,.78,.62),smoothstep(.54,.76,cloud)*.25*smoothstep(.01,.25,h));
      gl_FragColor=vec4(c,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
  const sky = new T.Mesh(geo, mat);
  sky.renderOrder = -500;
  sky.name = '晨霧天光';
  return sky;
}

export { buildRiver, buildSky };

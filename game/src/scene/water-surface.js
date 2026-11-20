// Water surface shading shared by the ferry river and the maze water stages:
// depth that deepens away from the bank, a lapping edge, a restrained mirror
// and fine drifting flecks. Used only when POLISH.water is on.

// Squared Euclidean distance transform of one row or column (Felzenszwalb).
function distanceLine(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s;
    do {
      const r = v[k];
      s = (f[q] + q * q - f[r] - r * r) / (2 * q - 2 * r);
    } while (s <= z[k] && --k > -1);
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = Infinity;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const r = v[k];
    d[q] = (q - r) * (q - r) + f[r];
  }
}

// How far each patch of water lies from anything standing in it. Built once per
// map on the processor: scenery crossing the waterline is marked
// on a grid, then turned into a distance texture the surface shader reads.
function shoreField(T, scenery, level, span = 22, size = 352, range = 3) {
  const cell = (span * 2) / size,
    lo = level - 0.03,
    hi = level + 0.24,
    far = 1e7;
  const grid = new Float64Array(size * size).fill(far);
  const mark = (x, z) => {
    const cx = Math.floor((x + span) / cell),
      cz = Math.floor((z + span) / cell);
    if (cx >= 0 && cz >= 0 && cx < size && cz < size) grid[cz * size + cx] = 0;
  };
  const p = new T.Vector3();
  scenery.updateMatrixWorld(true);
  for (const group of scenery.children) {
    if (group.userData.distant) continue;
    group.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const attr = mesh.geometry.attributes.position,
        index = mesh.geometry.index?.array,
        count = index ? index.length : attr.count;
      const w = new Float32Array(attr.count * 3);
      for (let i = 0; i < attr.count; i++)
        p.fromBufferAttribute(attr, i)
          .applyMatrix4(mesh.matrixWorld)
          .toArray(w, i * 3);
      for (let i = 0; i < count; i += 3) {
        const a = (index ? index[i] : i) * 3,
          b = (index ? index[i + 1] : i + 1) * 3,
          c = (index ? index[i + 2] : i + 2) * 3;
        const ya = w[a + 1],
          yb = w[b + 1],
          yc = w[c + 1];
        if (Math.max(ya, yb, yc) < lo || Math.min(ya, yb, yc) > hi) continue;
        if (Math.abs(w[a]) > span + 6 && Math.abs(w[b]) > span + 6 && Math.abs(w[c]) > span + 6)
          continue;
        // Sample finely enough to catch both the grid cell and the thin slab at the waterline.
        const edge = Math.max(
          Math.hypot(w[b] - w[a], w[b + 2] - w[a + 2]),
          Math.hypot(w[c] - w[a], w[c + 2] - w[a + 2]),
          Math.hypot(w[c] - w[b], w[c + 2] - w[b + 2])
        );
        const rise = Math.max(ya, yb, yc) - Math.min(ya, yb, yc);
        const steps = Math.min(360, Math.ceil(Math.max(edge / (cell * 0.7), rise / 0.11)) + 1);
        for (let u = 0; u <= steps; u++)
          for (let v = 0; v <= steps - u; v++) {
            const s = u / steps,
              t = v / steps,
              r = 1 - s - t,
              y = ya * r + yb * s + yc * t;
            if (y >= lo && y <= hi)
              mark(w[a] * r + w[b] * s + w[c] * t, w[a + 2] * r + w[b + 2] * s + w[c + 2] * t);
          }
      }
    });
  }
  const f = new Float64Array(size),
    d = new Float64Array(size),
    v = new Int32Array(size),
    z = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) f[y] = grid[y * size + x];
    distanceLine(f, size, d, v, z);
    for (let y = 0; y < size; y++) grid[y * size + x] = d[y];
  }
  const data = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) f[x] = grid[y * size + x];
    distanceLine(f, size, d, v, z);
    for (let x = 0; x < size; x++)
      data[y * size + x] = Math.round(255 * Math.min(1, (Math.sqrt(d[x]) * cell) / range));
  }
  const texture = new T.DataTexture(data, size, size, T.RedFormat, T.UnsignedByteType);
  texture.magFilter = texture.minFilter = T.LinearFilter;
  texture.wrapS = texture.wrapT = T.ClampToEdgeWrapping;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return { texture, span };
}

const vertexShader = `
  uniform mat4 textureMatrix; varying vec4 reflectionUv; varying vec3 wpos;
  void main(){wpos=(modelMatrix*vec4(position,1.)).xyz;reflectionUv=textureMatrix*vec4(position,1.);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}
`;
const fragmentShader = `
  uniform sampler2D tDiffuse, shoreMap;
  uniform float time, mirrorOn, shoreOn, shoreSpan, mist, sparkle, calm;
  uniform vec3 deep, shallow, haze, sky, foam;
  varying vec4 reflectionUv; varying vec3 wpos;
  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+1.),u.x),u.y);}
  void main(){
    vec2 p=wpos.xz; float t=time;
    vec3 toEye=cameraPosition-wpos; float dist=length(toEye); vec3 view=toEye/dist;
    // 0 at the bank, 1 in open water three cells out
    float bank=shoreOn>.5?texture2D(shoreMap,p/(2.*shoreSpan)+.5).r:1.;
    float drift=noise(p*.42+vec2(t*.03,0.));
    float swellA=sin(p.x*1.9+p.y*.8+t*.5+3.*drift);
    float swellB=sin(p.y*3.1-p.x*1.3-t*.66+2.*noise(p*.7+9.));
    float ripple=noise(p*6.+vec2(t*.3,-t*.2))-.5;
    // The surface lies quieter in the lee of the bank.
    vec2 tilt=(vec2(swellA*.55+swellB*.45,swellB*.55-swellA*.45)+ripple*1.3)*(.4+.6*bank)*calm;
    float bed=noise(p*.8)*.6+noise(p*2.7)*.4;
    vec3 body=mix(shallow,deep,smoothstep(0.,1.,bank)*(.74+.26*bed));
    body*=.94+.06*swellA*swellB;
    vec2 uv=reflectionUv.xy/reflectionUv.w+tilt*.0026;
    vec3 mirror=mirrorOn>.5?texture2D(tDiffuse,clamp(uv,.002,.998)).rgb:sky;
    float fres=pow(1.-abs(view.y),2.6);
    // What stands over the water reflects clearly; open sky only tints it.
    float open=smoothstep(.14,.5,dot(abs(mirror-sky),vec3(1.)));
    vec3 c=mix(body,mirror,(.07+.15*open)+(.40+.25*open)*fres);
    // A band of light laps at the bank, and one faint ring spreads from it.
    float lapAt=bank+.008*sin(t*.9+9.*noise(p*1.6));
    float lap=1.-smoothstep(.004,.034,lapAt);
    float ring=smoothstep(.82,1.,sin(bank*60.-t*1.05+drift*7.))*(1.-smoothstep(.05,.22,bank))*smoothstep(.02,.06,bank);
    c=mix(c,foam,(lap*.3+ring*.07)*shoreOn);
    // Fine flecks that drift and blink, instead of long streaks.
    vec2 g=p*3.1+tilt*.1, id=floor(g), f=fract(g)-.5;
    float seed=hash(id);
    vec2 jitter=(vec2(hash(id+7.),hash(id+13.))-.5)*.6;
    float blink=smoothstep(.7,1.,sin(t*(1.+seed*1.5)+seed*40.));
    float fleck=smoothstep(.14,.0,length((f-jitter)*vec2(1.,2.3)));
    c+=foam*fleck*blink*step(.5,seed)*sparkle*(.3+.7*bank);
    float fog=1.-exp(-pow(mist*dist,2.));
    gl_FragColor=vec4(mix(c,haze,fog*.86),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

// Uniforms for one body of water. Colours are linear working-space values.
function waterShader(
  T,
  { name, deep, shallow, haze, sky, foam, mist, sparkle = 0.5, calm = 1, mirror, shore }
) {
  const uniforms = {
    color: { value: new T.Color() },
    textureMatrix: { value: new T.Matrix4() },
    tDiffuse: { value: null },
    time: { value: 0 },
    mirrorOn: { value: mirror ? 1 : 0 },
    shoreMap: { value: shore?.texture || null },
    shoreOn: { value: shore ? 1 : 0 },
    shoreSpan: { value: shore?.span || 1 },
    mist: { value: mist },
    sparkle: { value: sparkle },
    calm: { value: calm },
    deep: { value: deep },
    shallow: { value: shallow },
    haze: { value: haze },
    sky: { value: sky },
    foam: { value: foam }
  };
  return { name, uniforms, vertexShader, fragmentShader };
}

export { shoreField, waterShader };

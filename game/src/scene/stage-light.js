// Stage lighting: a warm key that pools on the board, cool sky fill, a colour grade
// folded into tone mapping (no extra pass), view-anchored mist and lantern glow.
// Everything here is behind POLISH.lighting; with it off none of this runs.
import { fieldSize } from '../data/terrain.js';
import { setting, isNight } from './maze-atmosphere.js';

// The grade replaces three's CustomToneMapping hook, so it costs a few
// instructions per fragment instead of a full-screen pass and a render target.
const GRADE = `vec3 CustomToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	float lum = dot( color, vec3( .2126, .7152, .0722 ) );
	// Split tone: shade leans to ink blue, sunlit faces to warm paper.
	color *= mix( vec3( .92, .98, 1.07 ), vec3( 1.06, 1.0, .93 ), smoothstep( .04, .85, lum ) );
	// Filmic shoulder and toe that keep the mid-tones saturated.
	color = clamp( ( color * ( 2.51 * color + .03 ) ) / ( color * ( 2.43 * color + .59 ) + .14 ), 0., 1. );
	float grey = dot( color, vec3( .2126, .7152, .0722 ) );
	// Muted colours gain more than strong ones, so nothing turns garish.
	float sat = max( color.r, max( color.g, color.b ) ) - min( color.r, min( color.g, color.b ) );
	color = mix( vec3( grey ), color, 1.0 + .26 * ( 1. - sat ) );
	// Lifted, slightly cool blacks: mist never reaches pure black.
	return clamp( color * .99 + vec3( .004, .006, .009 ), 0., 1. );
}`;
let graded = false;
function installGrade(T, renderer) {
  const stub = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
  if (!graded) {
    const chunk = T.ShaderChunk.tonemapping_pars_fragment;
    // An unexpected three.js build keeps its stock tone mapping.
    if (!chunk.includes(stub)) return false;
    T.ShaderChunk.tonemapping_pars_fragment = chunk.replace(stub, GRADE);
    graded = true;
  }
  renderer.toneMapping = T.CustomToneMapping;
  return true;
}

// Per-map rigs. Each keeps the map's own sun and sky hues; only the balance of
// key to fill, the fill temperature and the exposure are set here.
//   key: sun colour pull toward warm, strength   fill: sky/ground strength
//   rim: back light strength   exposure   mist: share of the map's fog kept when looking down
//   ground: the colour light bounces up in, where the map's base colour is not its ground
const base = { warm: 0.3, key: 3.0, fill: 1.08, cool: 0.5, rim: 0.75, exposure: 0.96, mist: 0.42 };
const rigs = [
  { key: 3.0, fill: 1.05 }, // 青竹渡: morning sun through river mist
  { warm: 0.45, key: 3.1, fill: 1.02, cool: 0.3 }, // 紅楓驛: low autumn sun
  { key: 2.9, fill: 1.1, cool: 0.55 }, // 蘆花汀: open bright marsh
  { warm: 0.35, key: 3.1, fill: 1.05, cool: 0.5, exposure: 0.97 }, // 聽雪棧: cold high light on snow
  { warm: 0.22, key: 2.7, fill: 1.1, cool: 0.45, mist: 0.5 }, // 空山琴臺: thin sun in mountain mist
  { warm: 0.3, key: 2.9, fill: 1.1, cool: 0.4 }, // 桃花石陣: soft spring light
  { warm: 0.14, key: 3.1, fill: 1.02, cool: 0.5 }, // 襄陽殘垣: low sun through dust and smoke
  { warm: 0, key: 2.9, fill: 1.2, cool: 0.2, rim: 1.0, exposure: 1.02, mist: 0.5 }, // 寒玉石室: jade glow in the dark
  { warm: 0.25, key: 2.9, fill: 1.1, cool: 0.55 }, // 倒影天街: lavender dusk
  { warm: 0.1, key: 3.0, fill: 1.3, cool: 0.3, rim: 1.0, exposure: 0.82, mist: 0.5 }, // 無刻漏臺: lamplight under stars
  { warm: 0.28, key: 2.9, fill: 1.12, cool: 0.5 }, // 神龍竹堂: humid sea light
  { warm: 0.36, key: 2.9, fill: 1.08, cool: 0.4, mist: 0.48 }, // 絕情花徑: soft light in a closed valley
  { warm: 0.3, key: 3.1, fill: 1.06, cool: 0.5 }, // 鐵掌溪灘: clear mountain light on water
  { warm: 0.16, key: 2.9, fill: 1.3, cool: 0.3, rim: 1.0, exposure: 0.86, mist: 0.5 }, // 西夏夜苑: lantern light
  { warm: 0.3, key: 3.0, fill: 1.1, cool: 0.45, mist: 0.5 }, // 黑木繡閣: bright air above the cloud
  // 谷底棋臺: late sun over the west cliff, cool shade. Its base colour is the pond's, so the bounce is given: earth.
  { warm: 0.3, key: 2.4, fill: 1.08, cool: 0.7, rim: 0.7, exposure: 0.95, mist: 0.6, ground: 0x6f6a58 },
  { warm: 0.24, key: 2.75, fill: 1.12, cool: 0.5, mist: 0.5, ground: 0x726f64 }, // 石樑溫家: hazy light over the ravine; bounce off brick
  { warm: 0.16, key: 2.9, fill: 1.3, cool: 0.3, rim: 1.0, exposure: 0.88, mist: 0.5 }, // 萬安寺: lamplight under the pagoda
  { warm: 0.32, key: 3.1, fill: 1.05, cool: 0.5, mist: 0.5 }, // 光明頂: high wind and clear sun on the summit
  { warm: 0.08, key: 2.1, fill: 0.95, cool: 0.6, rim: 0.6, exposure: 0.92, mist: 0.45 } // 俠客島: sea light in the mouth of a cave
];
function stageRig(index) {
  return { ...base, ...(rigs[index] || rigs[0]) };
}

function lightStage(T, scene, index, sun) {
  const profile = setting(index),
    rig = stageRig(index),
    night = isNight(index);
  const horizon = new T.Color(index ? profile.horizon : 0xbcc7b9),
    zenith = new T.Color(index ? profile.zenith : 0x7fa7ae),
    ground = new T.Color(rig.ground ?? (index ? profile.base : 0x809a89));
  // Fill: the sky's own colour pushed cooler, over a dim warm bounce from the ground.
  const sky = horizon
    .clone()
    .lerp(zenith, 0.38)
    .lerp(new T.Color(0x8fb4e6), rig.cool * 0.4);
  if (!night) sky.lerp(new T.Color(0xffffff), 0.12);
  const bounce = ground
    .clone()
    .lerp(new T.Color(0x8a6f52), night ? 0.1 : 0.35)
    .multiplyScalar(0.8);
  const fill = new T.HemisphereLight(sky, bounce, rig.fill);
  scene.add(fill);

  // Key: the map's sun, a little warmer, shaped as a wide cone so its light pools
  // on the board and thins out over the surroundings.
  const { width, height } = fieldSize(index),
    radius = Math.hypot(width, height) / 2;
  const keyColour = new T.Color(index ? profile.sun : 0xffdfa9).lerp(
    new T.Color(0xffb45e),
    rig.warm
  );
  const distance = 54,
    plateau = radius * 1.2 + 2.4,
    edge = plateau * 2.5;
  const angle = Math.atan(edge / distance);
  const key = new T.SpotLight(
    keyColour,
    rig.key,
    0,
    angle,
    1 - Math.atan(plateau / distance) / angle,
    0
  );
  key.position
    .set(...sun)
    .normalize()
    .multiplyScalar(distance);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  // The shadow map covers the board and its near scenery, not the whole cone.
  const reach = radius + 4.5;
  key.shadow.focus = Math.atan(reach / distance) / angle;
  key.shadow.camera.near = distance - 22;
  key.shadow.camera.far = distance + 26;
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.028;
  scene.add(key, key.target);

  // Rim: cool sky light from behind the sun's side, so shaded faces keep their form.
  const rim = new T.DirectionalLight(zenith.clone().lerp(new T.Color(0xd6ecff), 0.45), rig.rim);
  rim.position.set(7, 7, -9);
  scene.add(rim);

  scene.userData.rig = { ...rig, fill, key, rim, fog: scene.fog.density };
  return scene.userData.rig;
}

// Mist thins when the camera looks down at the board and gathers toward the
// horizon, so the stage stays clear and the distance still recedes.
function anchorMist(scene, water) {
  const rig = scene.userData.rig;
  scene.onBeforeRender = (renderer, _scene, camera) => {
    renderer.toneMappingExposure = rig.exposure;
    const down = Math.abs(camera.matrixWorld.elements[9]),
      t = Math.min(1, Math.max(0, (down - 0.3) / 0.45)),
      clear = t * t * (3 - 2 * t);
    const density = rig.fog * (1 - (1 - rig.mist) * clear);
    scene.fog.density = density;
    const u = water?.material?.uniforms;
    if (u?.density) u.density.value = density;
    if (u?.mist) u.mist.value = density;
  };
}

// Glowing parts take their own painted colour as light, and get a soft halo.
function kindleGlow(T, scene, scenery, index) {
  const night = isNight(index);
  const cell = 0.55,
    clusters = new Map(),
    p = new T.Vector3(),
    tint = new T.Color();
  scenery.updateMatrixWorld(true);
  scenery.traverse((mesh) => {
    const mat = mesh.material;
    if (!mesh.isMesh || !mat?.emissive || !mat.emissive.getHex()) return;
    const pos = mesh.geometry.attributes.position,
      col = mesh.geometry.attributes.color;
    const mean = new T.Color(0, 0, 0);
    for (let i = 0; i < pos.count; i++) {
      p.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (col) tint.setRGB(col.getX(i), col.getY(i), col.getZ(i));
      else tint.copy(mat.color);
      mean.add(tint);
      const key =
        Math.floor(p.x / cell) + ',' + Math.floor(p.y / cell) + ',' + Math.floor(p.z / cell);
      let c = clusters.get(key);
      if (!c) clusters.set(key, (c = { x: 0, y: 0, z: 0, r: 0, g: 0, b: 0, n: 0 }));
      c.x += p.x;
      c.y += p.y;
      c.z += p.z;
      c.r += tint.r;
      c.g += tint.g;
      c.b += tint.b;
      c.n++;
    }
    if (mat.name === 'Maze_Luminous' && pos.count) {
      // The shared grey-teal glow becomes each model's own painted hue.
      mean.multiplyScalar(1 / pos.count);
      const peak = Math.max(mean.r, mean.g, mean.b, 0.001);
      mat.emissive.copy(mean).lerp(tint.copy(mean).multiplyScalar(1 / peak), 0.35);
      mat.emissiveIntensity = night ? 0.5 : 0.42;
    } else mat.emissiveIntensity *= 1.45;
  });
  // Merge neighbouring grid cells so one lantern gets one halo.
  const spots = [];
  for (const c of clusters.values()) {
    const s = {
      x: c.x / c.n,
      y: c.y / c.n,
      z: c.z / c.n,
      r: c.r / c.n,
      g: c.g / c.n,
      b: c.b / c.n,
      n: c.n
    };
    const near = spots.find((o) => Math.hypot(o.x - s.x, o.y - s.y, o.z - s.z) < 0.5);
    if (near) {
      const w = s.n / (near.n + s.n);
      for (const k of ['x', 'y', 'z', 'r', 'g', 'b']) near[k] += (s[k] - near[k]) * w;
      near.n += s.n;
    } else spots.push(s);
  }
  if (!spots.length) return null;
  spots.sort((a, b) => b.n - a.n);
  spots.length = Math.min(spots.length, 72);
  const corners = [-1, -1, 1, -1, 1, 1, -1, 1],
    centre = [],
    corner = [],
    colour = [],
    ids = [];
  spots.forEach((s, k) => {
    const peak = Math.max(s.r, s.g, s.b, 0.001),
      size = night ? 0.5 : 0.46;
    for (let j = 0; j < 4; j++) {
      centre.push(s.x, s.y, s.z);
      corner.push(corners[j * 2] * size, corners[j * 2 + 1] * size);
      colour.push(s.r / peak, s.g / peak, s.b / peak);
    }
    ids.push(k * 4, k * 4 + 1, k * 4 + 2, k * 4, k * 4 + 2, k * 4 + 3);
  });
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(centre, 3));
  geo.setAttribute('corner', new T.Float32BufferAttribute(corner, 2));
  geo.setAttribute('color', new T.Float32BufferAttribute(colour, 3));
  geo.setIndex(ids);
  geo.computeBoundingSphere();
  const mat = new T.ShaderMaterial({
    name: 'Stage_Glow',
    transparent: true,
    depthWrite: false,
    blending: T.AdditiveBlending,
    uniforms: { strength: { value: night ? 0.22 : 0.2 } },
    vertexShader: `attribute vec2 corner; attribute vec3 color; varying vec2 at; varying vec3 tint;
      void main(){ at = corner; tint = color; vec4 mv = modelViewMatrix * vec4(position, 1.);
        mv.xy += corner; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float strength; varying vec2 at; varying vec3 tint;
      void main(){ float d = length(at) / ${night ? '.5' : '.46'}; float halo = pow(max(0., 1. - d), 2.2);
        gl_FragColor = vec4(tint * halo * strength, 1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  // Tone mapping an additive layer would add the lifted black; keep it raw.
  mat.toneMapped = false;
  const halos = new T.Mesh(geo, mat);
  halos.name = 'stage-glow';
  halos.renderOrder = 20;
  halos.frustumCulled = false;
  scene.add(halos);
  return halos;
}

export { installGrade, stageRig, lightStage, anchorMist, kindleGlow };

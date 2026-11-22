import { landform0 } from './landforms/landform-0.js';
import { landform1 } from './landforms/landform-1.js';
import { landform2 } from './landforms/landform-2.js';
import { landform3 } from './landforms/landform-3.js';
import { landform4 } from './landforms/landform-4.js';
import { landform5 } from './landforms/landform-5.js';
import { landform6 } from './landforms/landform-6.js';
import { landform7 } from './landforms/landform-7.js';
import { landform8 } from './landforms/landform-8.js';
import { landform9 } from './landforms/landform-9.js';
import { landform10 } from './landforms/landform-10.js';
import { landform11 } from './landforms/landform-11.js';
import { landform12 } from './landforms/landform-12.js';
import { landform13 } from './landforms/landform-13.js';
import { landform14 } from './landforms/landform-14.js';
import { landform15 } from './landforms/landform-15.js';
import { buildVillage } from './village.js';
import { buildLandscape } from './landscape.js';
import { buildCourtyard, cutFerryLandscape } from './courtyard.js';
import { buildRiver, buildSky } from './river.js';
import {
  fieldCells,
  fieldSize,
  mapLayout,
  FIELD_CENTER,
  FIELD_SIZE
} from '../data/terrain.js';
import { mazeScenery } from './maze-scenery.js';
import { setting, stagePlane, stageSky, isNight } from './maze-atmosphere.js';
import { buildFieldProps } from './field-props.js';
import { POLISH } from '../polish.js';
import { lightStage, anchorMist, kindleGlow } from './stage-light.js';

const SUN = [-8.4, 13, 5.1];
const sunDirection = () => [...SUN];
function batchStructure(T, original) {
  const group = new T.Group(),
    buckets = new Map();
  group.name = original.name;
  group.userData = { occluder: true, kind: 'architecture' };
  original.traverse((m) => {
    if (!m.isMesh) return;
    const mat = m.material,
      geo = m.geometry,
      g = geo.attributes,
      idx = geo.index;
    const glow = mat.emissive?.getHex() || 0,
      metal = (mat.metalness || 0) > 0.23;
    const key = glow + '-' + metal;
    if (!buckets.has(key)) buckets.set(key, { pos: [], norm: [], col: [], glow, metal });
    const out = buckets.get(key),
      pt = new T.Vector3(),
      normal = new T.Vector3(),
      nm = new T.Matrix3().getNormalMatrix(m.matrixWorld);
    for (let j = 0; j < (idx?.count ?? g.position.count); j++) {
      const i = idx ? idx.getX(j) : j;
      pt.fromBufferAttribute(g.position, i).applyMatrix4(m.matrixWorld);
      out.pos.push(pt.x, pt.y, pt.z);
      if (g.normal) normal.fromBufferAttribute(g.normal, i).applyNormalMatrix(nm);
      else normal.set(0, 1, 0);
      out.norm.push(normal.x, normal.y, normal.z);
      out.col.push(
        mat.color.r * (g.color?.getX(i) ?? 1),
        mat.color.g * (g.color?.getY(i) ?? 1),
        mat.color.b * (g.color?.getZ(i) ?? 1)
      );
    }
  });
  for (const b of buckets.values()) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(b.norm, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(b.col, 3));
    g.computeBoundingSphere();
    const material = new T.MeshStandardMaterial({
      vertexColors: true,
      side: T.DoubleSide,
      roughness: b.metal ? 0.58 : 0.85,
      metalness: b.metal ? 0.25 : 0.025,
      emissive: b.glow,
      emissiveIntensity: 0.74
    });
    const mesh = new T.Mesh(g, material);
    mesh.castShadow = !b.glow;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
// The ferry's banks, rocks and plants are some thirty small meshes with one kind of
// material. Baked into world space and joined by how they take shadow, they draw in
// three calls a pass instead of thirty, in the main view, the mirror and the shadow map.
function joinLandscape(T, scenery) {
  const sets = new Map(),
    point = new T.Vector3(),
    normal = new T.Vector3(),
    turn = new T.Matrix3();
  scenery.updateMatrixWorld(true);
  for (const mesh of [...scenery.children]) {
    const u = mesh.userData,
      g = mesh.geometry;
    if (!mesh.isMesh || !u.environment || u.occluder) continue;
    if (!mesh.material.isMeshLambertMaterial || g.index || !g.attributes.normal || !g.attributes.color)
      continue;
    const key = [mesh.castShadow, mesh.receiveShadow, Boolean(u.distant)].join();
    if (!sets.has(key)) sets.set(key, { first: mesh, pos: [], norm: [], col: [], parts: [] });
    const set = sets.get(key),
      a = g.attributes;
    turn.getNormalMatrix(mesh.matrixWorld);
    for (let i = 0; i < a.position.count; i++) {
      point.fromBufferAttribute(a.position, i).applyMatrix4(mesh.matrixWorld);
      normal.fromBufferAttribute(a.normal, i).applyMatrix3(turn).normalize();
      set.pos.push(point.x, point.y, point.z);
      set.norm.push(normal.x, normal.y, normal.z);
      set.col.push(a.color.getX(i), a.color.getY(i), a.color.getZ(i));
    }
    set.parts.push(mesh);
  }
  for (const { first, pos, norm, col, parts } of sets.values()) {
    if (parts.length < 2) continue;
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.Float32BufferAttribute(norm, 3));
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const joined = new T.Mesh(geo, first.material);
    joined.name = first.name;
    joined.castShadow = first.castShadow;
    joined.receiveShadow = first.receiveShadow;
    joined.userData = { ...first.userData, fadeable: false };
    for (const part of parts) {
      scenery.remove(part);
      part.geometry.dispose();
      if (part !== first) part.material.dispose();
    }
    scenery.add(joined);
  }
}
const reliefs = [
  landform0,
  landform1,
  landform2,
  landform3,
  landform4,
  landform5,
  landform6,
  landform7,
  landform8,
  landform9,
  landform10,
  landform11,
  landform12,
  landform13,
  landform14,
  landform15
];
function finishTerrain(T, map, scenery) {
  const relief = reliefs[map](T, mapLayout(map));
  // Cutaway and the software renderer classify each immediate scenery child.
  if (relief.children.length) scenery.add(...relief.children.slice());
  scenery.updateMatrixWorld(true);
  return scenery;
}
function makeScenery(T, index = 0) {
  const map = Number.isInteger(index) && index >= 0 && index < reliefs.length ? index : 0;
  if (map > 0) return finishTerrain(T, map, mazeScenery(T, map, fieldCells(map)));
  const scenery = new T.Group();
  scenery.name = '青竹渡';
  scenery.userData.mapIndex = 0;
  const land = buildLandscape(T),
    village = buildVillage(T);
  village.updateMatrixWorld(true);
  const span = FIELD_SIZE / 7;
  for (const chunk of [...land.children]) {
    chunk.position.x *= span;
    chunk.position.z *= span;
    if (chunk.userData.occluder || chunk.userData.distant) {
      const height = chunk.userData.distant ? span : 1.19;
      chunk.scale.setScalar(height);
      chunk.position.y *= height;
    } else chunk.scale.set(span, 1, span);
    scenery.add(chunk);
  }
  for (const chunk of village.children) {
    const structure = batchStructure(T, chunk);
    structure.scale.set(span, chunk.name.includes('boat') ? 1 : 1.35, span);
    scenery.add(structure);
  }
  const ferry = fieldCells(0);
  cutFerryLandscape(T, scenery, ferry, FIELD_CENTER);
  if (POLISH.lighting) joinLandscape(T, scenery);
  scenery.add(
    buildCourtyard(T, ferry, FIELD_CENTER),
    buildFieldProps(
      T,
      ferry.filter((c) => c.kind !== 'bridge'),
      FIELD_CENTER
    )
  );
  return finishTerrain(T, map, scenery);
}
function decorateWorld(T, scene, scenery, gpu) {
  const index = scenery.userData.mapIndex || 0;
  const profile = setting(index);
  scene.background = new T.Color(index ? profile.horizon : 0xb7c4b6);
  scene.fog = new T.FogExp2(index ? profile.horizon : 0xbcc7b9, index ? profile.fog : 0.025);
  scene.add(scenery, index ? stageSky(T, profile) : buildSky(T));
  const water = index ? stagePlane(T, profile, gpu, scenery) : buildRiver(T, gpu, scenery);
  scene.add(water);
  if (POLISH.lighting) {
    lightStage(T, scene, index, SUN);
    anchorMist(scene, water);
    kindleGlow(T, scene, scenery, index);
    return water;
  }
  const night = isNight(index);
  scene.add(
    new T.HemisphereLight(
      index
        ? new T.Color(profile.horizon).lerp(new T.Color(0xfff3db), night ? 0.35 : 0.64)
        : 0xf0f0d8,
      index ? profile.base : 0x809a89,
      night ? 1.63 : 1.56
    )
  );
  const sun = new T.DirectionalLight(index ? profile.sun : 0xffdfa9, night ? 1.78 : 2.1);
  sun.position.set(...SUN);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, {
    left: -14,
    right: 14,
    top: 14,
    bottom: -14,
    near: 0.6,
    far: 45
  });
  sun.shadow.bias = -0.00028;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 2;
  scene.add(sun);
  const rim = new T.DirectionalLight(0x9cbebd, 0.52);
  rim.position.set(7, 7, -9);
  scene.add(rim);
  return water;
}
// Fade actual obstructions between the camera and the playable surface. Picking never consults these meshes.
class Cutaway {
  constructor(T, scenery) {
    this.T = T;
    this.ray = new T.Ray();
    this.hit = new T.Vector3();
    const index = scenery.userData.mapIndex,
      { width, height } = fieldSize(index);
    const cells = fieldCells(index);
    this.groundPoints = cells.map(
      ({ x, y }) => new T.Vector3(x - (width - 1) / 2, 0.14, y - (height - 1) / 2)
    );
    const rows = new Float32Array(height);
    for (const { x, y } of cells) rows[y] += 2 ** x;
    this.localCutaway = Boolean(scenery.userData.mapIndex);
    this.entries = scenery.children
      .filter((g) => g.userData.occluder)
      .map((group) => {
        const box = new T.Box3().setFromObject(group),
          strength = { value: 1 };
        group.traverse((m) => {
          if (!m.isMesh) return;
          m.material.onBeforeCompile = (shader) => {
            shader.uniforms.ferrySolid = strength;
            shader.uniforms.ferryRows = { value: rows };
            shader.uniforms.ferryLocal = { value: this.localCutaway ? 1 : 0 };
            shader.vertexShader =
              'varying vec3 ferryWorld;\n' +
              shader.vertexShader.replace(
                '#include <worldpos_vertex>',
                `#include <worldpos_vertex>
                ferryWorld = (modelMatrix * vec4(transformed, 1.)).xyz;`
              );
            shader.fragmentShader =
              'uniform float ferryRows[' +
              height +
              ']; uniform float ferrySolid; uniform float ferryLocal; varying vec3 ferryWorld;\n' +
              shader.fragmentShader.replace(
                '#include <clipping_planes_fragment>',
                `#include <clipping_planes_fragment>
                if (ferrySolid < .99) {
                  float t = (cameraPosition.y - .14) / max(.0001, cameraPosition.y - ferryWorld.y);
                  vec2 ground = mix(cameraPosition.xz, ferryWorld.xz, t);
                  vec2 cell=floor(ground+vec2(${(width / 2).toFixed(1)},${(height / 2).toFixed(1)}));
                  bool coversTile=false;
                  if(t>1. && cell.x>=0. && cell.x<${width.toFixed(1)} && cell.y>=0. && cell.y<${height.toFixed(1)}) {
                    float bits=0.;
                    for(int row=0;row<${height};row++) if(float(row)==cell.y) bits=ferryRows[row];
                    coversTile=mod(floor(bits/exp2(cell.x)),2.)>.5;
                  }
                  if (ferryLocal < .5 || coversTile) {
                    vec2 p=mod(floor(gl_FragCoord.xy),4.);
                    float d=mod(p.x*2.+p.y*3.+mod(p.x*p.y,5.),16.)/16.;
                    if(d>ferrySolid)discard;
                  }
                }`
              );
          };
        });
        return { group, box, strength };
      });
  }
  update(cam, title) {
    for (const { group, box, strength } of this.entries) {
      let obstructs = false;
      if (!title) {
        for (const point of this.groundPoints) {
          this.ray.origin.copy(cam.position);
          this.ray.direction.copy(point).sub(cam.position).normalize();
          if (
            this.ray.intersectBox(box, this.hit) &&
            this.hit.distanceToSquared(cam.position) + 0.16 < cam.position.distanceToSquared(point)
          ) {
            obstructs = true;
            break;
          }
        }
      }
      group.userData.cutaway = obstructs;
      strength.value = obstructs ? (this.localCutaway ? 0.29 : 0.12) : 1;
    }
  }
}

export { sunDirection, makeScenery, decorateWorld, Cutaway };

// The ground of Xiangyang after the long siege: raised wards of the old city, a
// trampled camp below the south terrace, the drain ditch, the east gate road,
// and dry ridged country that climbs to the horizon. One sampler serves the
// mesh, the props that stand on it and the far scenery.
const clamp = (t) => Math.max(0, Math.min(1, t));
const smooth = (t) => {
  const u = clamp(t);
  return u * u * (3 - 2 * u);
};
const blend = (a, b, t) => a + (b - a) * t;
const rectDistance = (x, z, r) =>
  Math.hypot(Math.max(r[0] - x, 0, x - r[2]), Math.max(r[1] - z, 0, z - r[3]));

function wardRuns(layout) {
  const bounds = [];
  layout.mask.forEach((row, j) => {
    for (const match of row.matchAll(/#+/g)) {
      const x = match.index - layout.width / 2,
        z = j - layout.height / 2;
      bounds.push([x, z, x + match[0].length, z + 1]);
    }
  });
  return bounds;
}

// Clay footings under the city walls, the barbican and the trebuchet pad.
const footings = [
  [-6.9, -8.25, 3.3, -6.82],
  [2.9, -8.95, 5.9, -6.84],
  [5.8, -8.2, 8.3, -6.95],
  [8.0, -7.95, 11.45, -2.15],
  [-9.95, -6.2, -8.55, 1.0],
  [6.0, -0.5, 8.75, 0.4],
  [-8.85, -0.45, -7.95, 0.35],
  [-8.85, -3.45, -7.95, -2.6],
  [-11.6, 2.4, -8.9, 4.9]
];
// Shallow pits where stones from the enemy engines came down.
const craters = [
  [-4.6, 8.3, 0.55],
  [7.4, 10.6, 0.7],
  [-7.6, 9.9, 0.6],
  [10.6, 1.9, 0.5],
  [-11.4, -2.4, 0.65],
  [1.3, 12.2, 0.75],
  [12.4, -8.6, 0.6]
];
const cx = 7.5;
const channel = (x) => 1.12 + 0.18 * Math.sin(x * 0.42 + 0.5);
const gateRoad = (x) =>
  -5.04 + 0.95 * smooth((x - 8) / 6.8) + 0.24 * Math.sin(Math.max(0, x - 10) * 0.58);
// The camp road leaves the south terrace and bends away to the south-east.
const campRoad = (x) => 9.1 + 0.55 * Math.sin(x * 0.31 + 0.4) + 0.04 * x;

function terrain6(layout) {
  const wards = wardRuns(layout);
  function sample(x, z) {
    const hills =
      Math.sin(x * 0.51 + Math.sin(z * 0.81)) * 0.5 +
      Math.sin(z * 0.72 - x * 0.2) * 0.32 +
      Math.cos(x * 1.57 + z * 1.22) * 0.18;
    const grain = Math.sin(x * 2.9 + Math.sin(z * 2.3) * 1.4) * Math.sin(z * 3.1 - x * 0.7);
    const edge =
      Math.hypot(x / 16.1, (z + 0.3) / 12.7) +
      0.035 * Math.sin(z * 0.58) +
      0.027 * Math.sin(x * 0.64);
    // Low country around the wards, rising as worn ridges toward the horizon.
    const ridge = 1 - Math.abs(Math.sin(x * 0.17 + 1.6 * Math.sin(z * 0.13) + 0.4));
    const swell = Math.sin(x * 0.083 + 0.7) * Math.cos(z * 0.096 - 0.3);
    const far = smooth((edge - 1.12) / 1.25);
    let ground = -0.46 + 0.09 * hills + 0.025 * grain;
    ground += far * (1.1 + 2.4 * ridge * ridge + 1.6 * swell) + smooth((edge - 1.9) / 0.9) * 3.2;
    const d = Math.min(...wards.map((r) => rectDistance(x, z, r)));
    const fort = Math.min(...footings.map((r) => rectDistance(x, z, r)));
    const bank = 1 - smooth((d - 0.06) / 1.18);
    const bastion = 1 - smooth((fort - 0.1) / 1.5);
    let y = blend(ground, -0.048 + 0.01 * hills, bank);
    y = blend(y, -0.06 + 0.012 * hills, bastion);
    // The ditch: a cut with a flat, wet bed, deeper than the old drain.
    const off = Math.abs(z - channel(x));
    const reachEast = 1 - smooth((x - 9.6) / 1.8);
    const drain = (1 - smooth((off - 0.16) / 0.42)) * smooth((x + 0.9) / 1.6) * reachEast;
    const bed = (1 - smooth((off - 0.08) / 0.2)) * smooth((x + 0.5) / 1.2) * reachEast;
    y -= 0.3 * drain + 0.06 * bed;
    const marketBank = 1 - smooth(rectDistance(x, z, [2.35, 1.72, 6.45, 2.52]) / 0.42);
    y = blend(y, -0.26, marketBank);
    const road =
      (1 - smooth((Math.abs(z - gateRoad(x)) - 0.65) / 0.5)) * smooth((x - (cx - 1.6)) / 0.75);
    const grade = blend(0.037, -0.71, smooth((x - (cx + 0.57)) / 6.1));
    y = blend(y, grade, road * (1 - smooth((edge - 0.82) / 0.33)));
    // Old earth lanes that silt has spread across parts of the paving.
    const westLane =
      (1 - smooth((Math.abs(x + 5.1 + 0.48 * Math.sin(z * 0.5)) - 0.47) / 0.9)) *
      smooth((z + 6.45) / 0.9) *
      (1 - smooth((z - 5.5) / 1.14));
    const southLane =
      (1 - smooth((Math.abs(z - 4.1 - 0.34 * Math.sin(x * 0.59)) - 0.55) / 1.08)) *
      smooth((x + 6.09) / 1.12) *
      (1 - smooth((x - 5.48) / 1.23));
    const ashDrift =
      (1 - smooth(Math.hypot((x - 1.72) / 3.4, (z + 0.79) / 0.92))) *
      (0.76 + 0.2 * Math.sin(x * 1.6 + z * 0.9));
    const silt = Math.max(westLane, southLane, ashDrift) * (1 - smooth(d / 0.32));
    y = Math.max(y, blend(-1.24, 0.056 + 0.005 * hills, smooth(silt / 0.6)));
    const ovenBase = 1 - smooth(rectDistance(x, z, [-3.5, 7.55, -1.0, 8.69]) / 0.68);
    y = blend(y, -0.43, ovenBase);
    // The camp terrace south of the wards is levelled by many feet.
    const camp =
      (1 - smooth(rectDistance(x, z, [-9.2, 7.0, 10.4, 11.6]) / 1.6)) * (1 - bank) * (1 - ovenBase);
    y = blend(y, -0.34 + 0.04 * hills + 0.012 * grain, camp * 0.85);
    const track = (1 - smooth((Math.abs(z - campRoad(x)) - 0.42) / 0.55)) * (1 - bank);
    y -= 0.03 * track;
    let pit = 0;
    for (const [px, pz, r] of craters) {
      const q = Math.hypot(x - px, z - pz) / r;
      if (q < 1.6) pit = Math.max(pit, 1 - smooth(q));
      if (q < 1.6) y += 0.09 * (1 - smooth(q)) * -1 + 0.035 * Math.exp(-((q - 1.05) ** 2) * 9);
    }
    return { y, hills, grain, bank, bastion, drain, bed, road, edge, silt, camp, track, pit, far };
  }
  return { sample, channel, gateRoad, campRoad, craters };
}

export { terrain6, channel, gateRoad, campRoad, craters, smooth, clamp, blend };

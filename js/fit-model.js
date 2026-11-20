(() => {
  const { catalog } = globalThis.Mono;
  const { sin, cos, PI, abs, max, min, exp, sqrt } = Math;
  const TAU = PI * 2;
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => max(a, min(b, v));
  const bell = v => exp(-v * v);
  const steps = (count, fn) => Array.from({ length: count }, (_, i) => fn(i));
  const circle = (count, fn) => steps(count, i => fn(i * TAU / count));
  const unit = v => {
    const length = Math.hypot(...v) || 1;
    return v.map(n => n / length);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // Interpolate centimetre cross sections along a garment or limb, keeping extrema at their measured sections.
  function section(knots, t) {
    let i = 0;
    while (i < knots.length - 2 && t > knots[i + 1][0]) i++;
    const a = knots[i], b = knots[i + 1], left = knots[max(0, i - 1)], right = knots[min(knots.length - 1, i + 2)];
    const span = b[0] - a[0], u = clamp((t - a[0]) / span, 0, 1);
    return a.slice(1).map((start, j) => {
      const k = j + 1, end = b[k], delta = end - start;
      const m0 = delta * (start - left[k]) > 0 || i === 0 ? (end - left[k]) / (b[0] - left[0]) * span : 0;
      const m1 = delta * (right[k] - end) > 0 || i + 2 === knots.length ? (right[k] - start) / (right[0] - a[0]) * span : 0;
      return clamp(mix(start, end, u) + u * (1 - u) * ((1 - u) * (m0 - delta) + u * (delta - m1)), min(start, end), max(start, end));
    });
  }

  function surface(hex, kind = 0, tone = 1) {
    const n = Number.parseInt(hex.slice(1), 16);
    return [(n >> 16) / 255 * tone, (n >> 8 & 255) / 255 * tone, (n & 255) / 255 * tone, kind];
  }

  class Mesh {
    constructor() {
      this.points = [];
      this.coats = [];
      this.triangles = [];
    }
    vertex(point, coat) {
      this.coats.push(coat);
      return this.points.push(point) - 1;
    }
    bridge(a, b, skip) {
      for (let i = 0; i < a.length; i++) {
        if (skip?.(i)) continue;
        const j = (i + 1) % a.length;
        this.triangles.push(a[i], a[j], b[i], a[j], b[j], b[i]);
      }
    }
    rings(rows, coat) {
      let prev;
      for (const row of rows) {
        const current = row.map(p => this.vertex(p, coat));
        if (prev) this.bridge(prev, current);
        prev = current;
      }
    }
    patch(rows, coat) {
      let prev;
      for (const row of rows) {
        const current = row.map(p => this.vertex(p, coat));
        if (prev) this.bridge(prev, current, i => i === row.length - 1);
        prev = current;
      }
    }
    finish() {
      const vertices = new Float32Array(this.points.length * 10);
      const indices = new Uint16Array(this.triangles);
      for (let i = 0; i < indices.length; i += 3) {
        const a = indices[i], b = indices[i + 1], c = indices[i + 2];
        const p = this.points[a], q = this.points[b], r = this.points[c];
        const ux = q[0] - p[0], uy = q[1] - p[1], uz = q[2] - p[2];
        const vx = r[0] - p[0], vy = r[1] - p[1], vz = r[2] - p[2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        for (const k of [a, b, c]) {
          vertices[k * 10 + 3] += nx;
          vertices[k * 10 + 4] += ny;
          vertices[k * 10 + 5] += nz;
        }
      }
      this.points.forEach((p, i) => {
        const k = i * 10;
        vertices.set(p, k);
        const length = Math.hypot(vertices[k + 3], vertices[k + 4], vertices[k + 5]) || 1;
        for (let n = 3; n < 6; n++) vertices[k + n] /= length;
        vertices.set(this.coats[i], k + 6);
      });
      return { vertices, indices };
    }
  }

  function ellipsoid(mesh, c, r, coat, count = 20) {
    mesh.rings(steps(13, i => {
      const phi = mix(-PI / 2 + .001, PI / 2 - .001, i / 12);
      return circle(count, a => [c[0] + sin(a) * cos(phi) * r[0], c[1] + sin(phi) * r[1], c[2] + cos(a) * cos(phi) * r[2]]);
    }), coat);
  }

  function tube(mesh, path, radius, coat, closed = false) {
    const rings = path.map((p, i) => {
      const before = path[closed ? (i + path.length - 1) % path.length : max(0, i - 1)];
      const after = path[closed ? (i + 1) % path.length : min(path.length - 1, i + 1)];
      const tangent = unit(after.map((v, n) => v - before[n]));
      const side = unit(cross(tangent, abs(tangent[1]) < .92 ? [0, 1, 0] : [1, 0, 0]));
      const normal = cross(side, tangent);
      return circle(6, a => p.map((v, n) => v + radius * (side[n] * sin(a) + normal[n] * cos(a))));
    });
    if (closed) rings.push(rings[0]);
    mesh.rings(rings, coat);
  }

  function sculptHead(mesh, height, shoulder, skin) {
    const headHeight = 21.6 + (height - 170) * .055;
    const chin = height - headHeight;
    const head = [[0, 1.4, 2.5, 2.9], [.04, 3.5, 4.3, 2.15], [.13, 5.1, 5.7, 1.25],
      [.24, 6.15, 6.9, .05], [.39, 6.85, 7.85, -.45], [.54, 7.25, 8.25, -.65],
      [.67, 7.35, 8.4, -.65], [.81, 6.8, 7.85, -.8], [.92, 5.25, 6.2, -.8], [.975, 3.1, 3.8, -.8], [1, .12, .15, -.8]];
    mesh.rings(steps(37, i => {
      const t = i / 36, [w, d, z0] = section(head, t);
      return circle(56, a => {
        const x = w * sin(a), front = max(0, cos(a));
        const bridge = .54 * bell(x / 1.8) * bell((t - .40) / .18) + .64 * bell(x / 1.75) * bell((t - .329) / .075);
        const cheeks = .24 * bell((abs(x) - 3.6) / 2.45) * bell((t - .365) / .14);
        return [x, chin + t * headHeight, z0 + d * cos(a) + front ** 3 * (bridge + cheeks)];
      });
    }), skin);
    const neck = [[shoulder - 3.8, 8.4, 6.9, -.48], [shoulder, 6.85, 6.15, -.4],
      [shoulder + 3.3, 5.25, 5.05, -.4], [chin - 2.0, 4.7, 4.75, -.35], [chin + 4.4, 5.5, 5.4, -.38]];
    mesh.rings(neck.map(([y, w, d, z]) => circle(40, a => [w * sin(a), y - 1.2 * max(0, cos(a)), z + d * cos(a)])), skin);
    for (const s of [-1, 1]) ellipsoid(mesh, [s * 6.86, chin + headHeight * .425, -.65], [1.05, 2.15, 1.25], skin);
  }

  function sculptArm(mesh, side, pose, skin, opening) {
    const { shoulder, half, elbow, wrist, reach } = pose;
    const arm = [
      [wrist - .6, reach, 1.55, 2.35, 2.65], [wrist + 2, reach, 1.6, 2.55, 2.4],
      [mix(wrist, elbow, .38), reach + .5, 1.25, 3.65, 3.6], [mix(wrist, elbow, .72), reach + .8, .3, 4.35, 4.05],
      [elbow - 1, reach + .75, -.85, 3.8, 3.95], [elbow + 3, reach + .3, -.6, 4.2, 4.2],
      [mix(elbow, shoulder, .5), half + 2.3, -.25, 5.05, 5.3], [shoulder - 4, half -.2, .0, 5.3, 5.25]
    ];
    // End inside the sleeve opening so buried deltoids cannot break its surface as the fit tightens.
    const armTop = opening ? opening.y + .8 : wrist + 3, count = opening ? 25 : 3;
    mesh.rings(steps(count + 1, i => {
      const y = mix(arm[0][0], armTop, i / count);
      let [x, z, w, d] = section(arm, y);
      const blend = opening ? clamp((y - opening.y + 10) / 10, 0, 1) : 0;
      if (opening) {
        x = mix(x, opening.x, blend);
        z = mix(z, -.25, blend);
        w = min(w, opening.radius - .85);
        d = min(d, opening.radius * 1.05 - .85);
      }
      return circle(24, a => [side * x + w * sin(a), y + blend * .23 * w * side * sin(a), z + d * cos(a)]);
    }), skin);
    const palm = [[wrist - 9.6, reach - .65, 2.55, 1.25, 3.0], [wrist - 8.4, reach - .72, 2.45, 1.65, 3.3],
      [wrist - 5.2, reach - .55, 2.14, 2.0, 3.65], [wrist - 1.5, reach -.15, 1.65, 1.85, 2.72], [wrist + .6, reach, 1.6, 1.7, 2.5]];
    mesh.rings(palm.map(([y, x, z, w, d]) => circle(22, a => [side * x + w * sin(a), y, z + d * cos(a)])), skin);
    for (let f = 0; f < 4; f++) {
      const len = [6.7, 7.1, 6.45, 4.9][f], spread = 2.52 - f * 1.68, radius = [.84, .88, .78, .70][f];
      mesh.rings(steps(7, i => {
        const t = i / 6, w = radius * [.12, .78, .92, .98, .91, 1, .98][i];
        return circle(10, a => [side * (reach - .68 - .84 * (1 - t) ** 2) + w * sin(a), wrist - 8.75 - (1 - t) * len, 2.52 + spread * (1 + .05 * (1 - t)) + .38 * (1 - t) + w * cos(a)]);
      }), skin);
    }
    mesh.rings(steps(9, i => {
      const t = i / 8, w = sin(min(1, t * 2.5) * PI / 2) * 1.12 + .08;
      return circle(12, a => [side * (reach - 1.9 + .65 * t) + w * sin(a), wrist - 9.4 + 6.1 * t, 6.5 - t * 2 + w * cos(a)]);
    }), skin);
  }

  function trousers(mesh, side, crotch, waist, coat) {
    const ankle = 10.25 + side * .65, hip = 8.55 + (waist - 78) * .055, girth = (waist - 78) * .045;
    const forward = side > 0 ? 1.8 : -1.55;
    const knots = [[0, ankle, 5.0, 6.35, 5.6], [.035, ankle - .12, 5.0, 6.42, 5.5],
      [.17, ankle + .1, 2.3, 6.0, 5.9], [.34, ankle - .35, .8, 5.8, 6.1], [.47, ankle - .3, 1.0, 6.1, 6.4],
      [.55, ankle - .23, 1.65, 6.35, 6.1], [.72, mix(ankle, hip, .55), .55, 7.25 + girth * .36, 7.8],
      [1, hip, -.48, hip + .18, 9.25 + girth * .6], [1.13, hip * .96, -.6, hip * 1.04, 10.4 + girth],
      [1.32, hip * .9, -.4, hip * 1.01, 9.6 + girth]];
    function point(t, a) {
      const [x, z, w, d] = section(knots, t), y = mix(7.9, crotch, t);
      const crease = (.28 * cos(6 * a + .8 * sin(t * 9 + side)) + .21 * cos(4 * a - t * 4)) * (1 - .45 * t);
      const folds = bell((t - .50) / .094) * .39 * sin(t * 48 + side * sin(a) * 2.1)
        + bell((t - .067) / .067) * .46 * cos(t * 49 + sin(a) * 2.05);
      const r = crease + folds;
      return [side * x + sin(a) * (w + r), y + (.68 * cos(a + .4) - .31 * sin(2 * a)) * bell(t / .09),
        z + forward * (1 - min(t, 1)) + (d + r) * cos(a)];
    }
    mesh.rings(steps(55, i => circle(36, a => point(i * 1.32 / 54, a))), coat);
    const stitch = coat.map((v, i) => i < 3 ? v * .865 : v);
    const outer = side * PI / 2;
    tube(mesh, steps(36, i => point(i * 1.22 / 35, outer)), .078, stitch);
    tube(mesh, circle(36, a => point(.02, a)), .093, stitch, true);

    const sole = surface("#b9b3a4"), upper = surface("#e5e0d2", 0), trim = surface("#d6d0c1");
    function shoeRing(y, amount, base, length, heightProfile) {
      return circle(38, a => {
        const c = cos(a), sn = sin(a), d = c * length + base;
        const w = (4.0 + .68 * (c + 1) * .5 + .36 * bell((c - .25) / .48)) * amount;
        return [side * ankle + w * sn + side * d * .085, y + heightProfile * (.58 - .45 * c - .13 * cos(2 * a)), forward + d];
      });
    }
    mesh.rings([shoeRing(.05, .89, 4.35, 12, 0), shoeRing(.28, 1.02, 4.35, 12.5, .30),
      shoeRing(1.12, 1.03, 4.35, 12.55, .32)], sole);
    mesh.rings([shoeRing(1.05, 1.025, 4.35, 12.53, .31), shoeRing(2.0, 1.02, 4.3, 12.48, .48),
      shoeRing(2.25, 1.0, 4.32, 12.4, .49)], trim);
    mesh.rings([shoeRing(2.15, 1, 4.32, 12.4, .48), shoeRing(3.05, .96, 4.1, 12.1, .93),
      shoeRing(3.74, .91, 3.34, 11.4, 1.38), shoeRing(4.6, .83, 1.8, 10.2, 1.8),
      shoeRing(6.0, .74, -.15, 7.6, 1.5), shoeRing(8.1, .66, -.6, 5.6, .88)], upper);
    for (let i = 0; i < 3; i++) {
      const z = 6.0 + i * 1.3;
      tube(mesh, steps(7, j => { const f = j / 3 - 1; return [side * (ankle + z * .085) + f * 2.05, 6.88 - i * .34 - f * f * .6, forward + z + .22 * f]; }), .13, trim);
    }
  }
  function clothe(mesh, pose, profile, product, row, color, skin) {
    const { shoulder, half, wrist, elbow, reach } = pose;
    const shirt = product.category === "shirt", kind = shirt ? 2 : 1;
    const cloth = surface(catalog.colors[color].hex, kind);
    const binding = surface(catalog.colors[color].hex, kind, .945), thread = surface(catalog.colors[color].hex, kind, .83);
    const room = clamp(row.circumference - profile.chest, -15, 36);
    const allowance = max(0, room), loose = .42 + allowance * .046;
    const chest = profile.chest * .187 + .53 + room * .075 + allowance * .093;
    const depth = profile.chest * .126 + .35 + room * .034 + allowance * .085;
    const waist = profile.waist * .155 + chest * .33 + allowance * .06;
    const waistDepth = profile.waist * .088 + depth * .4 + allowance * .03;
    const hem = shoulder + 2 - row.length * .87;
    const collarY = shoulder + 4.7;
    const collarW = shirt ? 6.25 : 6.85, collarD = shirt ? 6.45 : 7.4;
    const shape = [[0, max(chest * .89, waist) + 1.1, max(depth * .81, waistDepth) + .35, .0],
      [.19, max(chest * .87, waist) + .45, max(depth * .8, waistDepth) + .25, .05],
      [.40, max(chest * .875, waist - .6), max(depth * .85, waistDepth - .3), -.1], [.61, chest * .97, depth * .97, -.13],
      [.73, chest, depth, -.16], [.84, mix(chest, half, .46), depth * .94, -.26],
      [.915, half + allowance * .044, depth * .79, -.36], [.94, half -.25, depth * .69, -.38],
      [.965, half * .84, depth * .61, -.36], [.985, half * .57, max(collarD + .66, depth * .54), -.3],
      [1, collarW, collarD, -.18]];
    const low = .615, high = .94, n = 64, wing = 6;
    function point(t, a, shapeAt = section(shape, t)) {
      const [w, d, center] = shapeAt, c = cos(a), s = sin(a);
      const hanging = (1 - t) ** 1.1 * loose;
      const folds = hanging * (.76 * cos(8 * a + .67 * sin(t * 5 + a)) + .32 * sin(13 * a - 2.2 * t) + .17 * cos(18 * a + t))
        + .42 * abs(s) ** 2 * bell((t - .63) / .15) * sin(30 * t + 4.25 * c)
        + .24 * bell((t - .31) / .16) * sin(24 * t + 6 * c + s);
      const hemWave = bell(t / .14) * ((shirt ? 3.1 : 1.05) * s * s + .55 * sin(3 * a + .55));
      const scoop = (shirt ? 2.55 : 3.4) * max(0, c) ** 2 + .67 * max(0, -c) ** 2;
      const y = mix(hem, collarY, t) + hemWave - scoop * clamp((t - .93) / .07, 0, 1)
        - 1.6 * s * s * bell((t - .94) / .070);
      return [(w + folds) * s, y, center + (d + folds) * c];
    }
    // The side panels are cut open from underarm to shoulder. Sleeves reuse the boundary vertices.
    function warp(t, a) {
      const local = Math.acos(clamp(abs(cos(a)), 0, 1));
      const original = wing * TAU / n, edge = PI / 2 - original;
      const h = clamp((t - low) / (high - low), 0, 1);
      const blend = clamp(min((t - low + .065) / .065, (high + .045 - t) / .045), 0, 1);
      const halfOpening = mix(original, .065 + .67 * max(0, sin(PI * h)) ** .75, blend);
      const target = PI / 2 - halfOpening;
      const angle = local <= edge ? local * target / edge : target + (local - edge) * halfOpening / original;
      return Math.atan2(Math.sign(sin(a)) * sin(angle), Math.sign(cos(a)) * cos(angle));
    }
    const levels = [...steps(24, i => i * low / 24), ...steps(17, i => mix(low, high, i / 16)), .953, .965, .976, .985, .994, 1];
    const rings = levels.map(t => {
      const dims = section(shape, t);
      return circle(n, a => mesh.vertex(point(t, warp(t, a), dims), cloth));
    });
    const start = 24, end = 40;
    rings.slice(1).forEach((ring, i) => mesh.bridge(rings[i], ring, j => i >= start && i < end
      && ((j >= n / 4 - wing && j < n / 4 + wing) || (j >= 3 * n / 4 - wing && j < 3 * n / 4 + wing))));
    mesh.rings([circle(n, a => { const p = point(0, a); return [p[0] * .98, p[1] + .38, p[2] * .98]; }),
      circle(n, a => point(0, a))], binding);
    tube(mesh, circle(n, a => point(.023, a)), .081, binding, true);
    for (const side of [-1, 1]) {
      const mid = side > 0 ? n / 4 : n * 3 / 4, left = mid - wing, right = mid + wing;
      const boundary = [];
      for (let j = left; j <= right; j++) boundary.push(rings[start][j], rings[end][j]);
      for (let i = start + 1; i < end; i++) boundary.push(rings[i][left], rings[i][right]);
      const centerY = (mesh.points[rings[end][mid]][1] + mesh.points[rings[start][mid]][1]) * .5;
      const edge = boundary.map(index => {
        const p = mesh.points[index];
        return { index, p, a: Math.atan2((p[2] + .27) / (depth * .65), (p[1] - centerY) / ((high - low) * (collarY - hem) * .5)) };
      }).sort((a, b) => side * (a.a - b.a));
      const shoulderSeam = edge.map(v => v.p);
      tube(mesh, shoulderSeam, .085, binding, true);
      const endY = shoulder - (shirt ? 21 : 20.4 + room * .12);
      const r = 5.28 + allowance * .072 + (profile.chest - 96) * .025 + (shirt ? .42 : 0);
      const armX = max(half + .8 + allowance * .04, chest - .65);
      function sleevePoint(a, x, y, z, w, d, tilt, ripple = 0) {
        const f = ripple * (sin(5 * a + .6) + .5 * sin(8 * a));
        return [side * (x + (w + f) * cos(a)), y + w * tilt * cos(a), z + (d + f) * sin(a)];
      }
      const last = a => sleevePoint(a, armX, endY, -.25, r, r * 1.05, .23, .17);
      let previous = edge.map(v => v.index);
      for (let i = 1; i <= 9; i++) {
        const t = i / 9;
        const next = edge.map(({ p, a }) => {
          const target = last(a), out = max(0, cos(a));
          const q = [mix(p[0], target[0], .64) + side * (1.6 * out + .35),
            mix(p[1], target[1], .39) + 1.45 * out, mix(p[2], target[2], .45) + .34 * sin(a)];
          return mesh.vertex(p.map((v, j) => (1 - t) ** 2 * v + 2 * (1 - t) * t * q[j] + t * t * target[j]), cloth);
        });
        mesh.bridge(previous, next);
        previous = next;
      }
      if (shirt) {
        const sleeve = [[wrist - .1, reach, 1.6, 3.7, 3.9], [wrist + 4.2, reach + .1, 1.6, 4.05, 4.1],
          [wrist + 5.4, reach + .1, 1.6, 4.55, 4.55], [mix(wrist, elbow, .55), reach + .7, .75, 5.0, 5.15],
          [elbow - 1, reach + .65, -.65, 5.55, 5.8], [endY, armX, -.25, r, r * 1.05]];
        for (let i = 1; i <= 26; i++) {
          const y = mix(endY, wrist - .1, i / 26), [x, z, w, d] = section(sleeve, y);
          const cuff = y <= wrist + 4.2;
          const next = edge.map(({ a }) => {
            const fold = cuff ? .035 : .4 * sin((y - wrist) * .72 + 1.8 * cos(a)) * (bell((y - elbow) / 6.5) + .65 * bell((y - wrist - 7) / 4));
            return mesh.vertex(sleevePoint(a, x, y, z, w + fold, d + fold, (y - wrist) / (endY - wrist) * .23, cuff ? .03 : .19), cuff ? binding : cloth);
          });
          mesh.bridge(previous, next);
          previous = next;
        }
        for (const y of [wrist + .3, wrist + 4.1]) {
          const [x, z, w, d] = section(sleeve, y);
          tube(mesh, edge.map(({ a }) => sleevePoint(a, x, y, z, w + .025, d + .025, .02, .025)), .085, thread, true);
        }
      } else {
        tube(mesh, edge.map(({ a }) => { const p = last(a); return [p[0], p[1] + .8, p[2]]; }), .10, binding, true);
      }
      const inside = previous.map(index => {
        const p = mesh.points[index], cx = side * (shirt ? reach : armX), cz = shirt ? 1.6 : -.25;
        return mesh.vertex([mix(p[0], cx, .12), p[1] + .35, mix(p[2], cz, .12)], binding);
      });
      mesh.bridge(previous, inside);
      sculptArm(mesh, side, pose, skin, shirt ? null : { y: endY, x: armX, radius: r });
      tube(mesh, steps(28, i => point(mix(.02, low, i / 27), side * PI / 2)), .065, binding);
    }

    const opening = a => point(1, a);
    mesh.rings(steps(5, i => circle(n, a => {
      const v = i / 4, p = opening(a);
      return [p[0] * (1 - .19 * v), p[1] + (shirt ? 2.05 : 1.25) * v + .18 * sin(v * PI), -.18 + (p[2] + .18) * (1 - .17 * v)];
    })), binding);
    tube(mesh, circle(n, opening), .13, binding, true);
    if (!shirt) return;

    function front(t, x, raise) {
      let lo = -1.39, hi = 1.39;
      const dims = section(shape, t);
      for (let i = 0; i < 10; i++) {
        const a = (lo + hi) * .5;
        if (point(t, a, dims)[0] < x) lo = a; else hi = a;
      }
      const p = point(t, (lo + hi) * .5, dims);
      return [p[0], p[1], p[2] + raise];
    }
    mesh.patch(steps(42, i => [-1.08, -.87, .85, 1.07].map(x => front(i / 41, x, abs(x) > 1 ? .14 : .32))), binding);
    const buttons = surface("#d9d1bd");
    for (let i = 0; i < 6; i++) {
      const p = front(.09 + .148 * i, 0, .44);
      ellipsoid(mesh, p, [.46, .46, .17], buttons, 14);
    }
    const pocket = steps(9, i => steps(11, j => {
      const u = j / 10, t = mix(.562 - .027 * (1 - abs(2 * u - 1)), .735, i / 8);
      return front(t, chest * (.27 + .47 * u), .19 + .13 * sin(u * PI));
    }));
    mesh.patch(pocket, cloth);
    tube(mesh, [...pocket.map(row => row[0]).reverse(), ...pocket[0].slice(1), ...pocket.slice(1).map(row => row.at(-1))], .105, binding);
    tube(mesh, pocket.at(-1), .145, binding);
    for (const side of [-1, 1]) {
      const flap = steps(8, i => steps(43, j => {
        const v = i / 7, a = side * mix(.045, PI, j / 42), c = cos(a), s = sin(a);
        const tip = max(0, 1 - abs(abs(a) - .61) / .55);
        const top = [5.38 * s + side * .55 * max(0, c), collarY + 2.18 - 1.2 * max(0, c), 5.65 * c - .13];
        const back = [mix(top[0], 8.35 * s, v), top[1] - 3.8 * v, mix(top[2], 8.65 * c - .3, v)];
        if (c <= .04 || !v) return back;
        // The collar points lie on this particular garment's chest, including its current ease and drape.
        const bottom = 1 - (.066 + .182 * tip) * c;
        const x = mix(top[0], side * (1.25 + 8.7 * abs(s)), v);
        const p = front(mix(1, bottom, v), x, .56 + .42 * sin(v * PI));
        p[1] += (1 - v) * 2.05;
        const blend = clamp((c - .04) / .31, 0, 1);
        return p.map((value, k) => mix(back[k], value, blend));
      }));
      mesh.patch(side < 0 ? flap : flap.map(r => r.slice().reverse()), cloth);
      tube(mesh, flap.at(-1), .13, thread);
    }
  }

  function showroom(mesh) {
    const side = surface("#c1beb1", 4), top = surface("#d7d5c9", 4);
    const disc = (r, y) => circle(88, a => [r * sin(a), y, r * cos(a)]);
    mesh.rings([disc(30.35, -2.2), disc(31.1, -1.72), disc(31.1, -.5), disc(30.65, -.16)], side);
    mesh.rings([disc(30.66, -.16), disc(30.1, -.02), disc(21, -.02), disc(12, -.02), disc(.04, -.02)], top);
  }

  function buildModel(profile, product, size, color) {
    const mesh = new Mesh(), h = profile.height;
    const shoulder = h - (21.6 + (h - 170) * .055) - 8.35;
    const half = profile.shoulder * .467;
    const allowance = max(0, product.chart.find(r => r.size === size).circumference - profile.chest);
    const reach = max(half + 3.75, profile.chest * .18 + 3.45 + allowance * .11, profile.waist * .155 + 7.7 + allowance * .06);
    const pose = { shoulder, half, elbow: shoulder - h * .179, wrist: shoulder - h * .329, reach };
    const skin = surface("#cfc2ae"), trouser = surface(color === "charcoal" ? "#827a6c" : "#575752", 3);
    const crotch = h * .452 + (profile.leg - 82) * .62;
    showroom(mesh);
    sculptHead(mesh, h, shoulder, skin);
    for (const side of [-1, 1]) {
      trousers(mesh, side, crotch, profile.waist, trouser);
    }
    clothe(mesh, pose, profile, product, product.chart.find(row => row.size === size), color, skin);
    return mesh.finish();
  }
  // Both renderers project the same indexed, smooth-normal mesh. No model or texture requests are needed.
  const vertexSource = `
    attribute vec3 aPosition, aNormal, aColor;
    attribute float aKind;
    uniform vec4 uCamera;
    uniform float uCenter, uLightPass;
    varying vec3 vPosition, vNormal, vColor, vShadow;
    varying float vKind;
    void main() {
      mat2 turn = mat2(uCamera.x, -uCamera.y, uCamera.y, uCamera.x);
      vec2 xz = turn * aPosition.xz;
      vec2 nxz = turn * aNormal.xz;
      vec3 centered = vec3(xz.x, aPosition.y - 85.0, xz.y);
      vec3 light = normalize(vec3(-.62, .84, .65));
      vec3 horizontal = normalize(vec3(light.z, 0., -light.x));
      vec3 vertical = cross(light, horizontal);
      vec3 lightPoint = vec3(dot(centered, horizontal) / 103., dot(centered, vertical) / 103., -dot(centered, light) / 154.);
      vShadow = lightPoint * .5 + .5;
      vNormal = vec3(nxz.x, aNormal.y, nxz.y);
      vPosition = aPosition;
      vColor = aColor;
      vKind = aKind;
      float dy = aPosition.y - uCenter;
      vec3 cameraPoint = vec3(xz.x * uCamera.z, (.9894 * dy - .145 * xz.y) * uCamera.w, -(.9894 * xz.y + .145 * dy) / 225.);
      gl_Position = vec4(mix(cameraPoint, lightPoint, uLightPass), 1.);
    }`;
  const fragmentSource = `
    precision highp float;
    uniform sampler2D uShadow;
    uniform float uLightPass, uShadowEnabled;
    varying vec3 vPosition, vNormal, vColor, vShadow;
    varying float vKind;
    void main() {
      if (uLightPass > .5) {
        float depth = gl_FragCoord.z * 255.;
        gl_FragColor = vec4(floor(depth) / 255., fract(depth), 0., 1.);
        return;
      }
      vec3 n = normalize(gl_FrontFacing ? vNormal : -vNormal);
      vec3 key = normalize(vec3(-.62, .84, .65));
      float direct = max(dot(n, key), 0.);
      float lit = 1.;
      if (uShadowEnabled > .5 && direct > .01) {
        float visibility = 0.;
        float threshold = vShadow.z - .0021 - .0046 * (1. - direct);
        for (int y = -1; y <= 1; y++) {
          for (int x = -1; x <= 1; x++) {
            vec2 packedDepth = texture2D(uShadow, vShadow.xy + vec2(float(x), float(y)) * .00135).rg;
            visibility += step(threshold, packedDepth.x + packedDepth.y / 255.);
          }
        }
        lit = visibility / 9.;
      }
      float fill = max(dot(n, normalize(vec3(.84, .35, -.32))), 0.);
      float light = .61 + .365 * direct * mix(.24, 1., lit) + .092 * fill + .042 * max(n.y, 0.) - .035 * (1. - lit);
      vec3 color = vColor * light;
      if (vKind < .5) {
        vec3 halfway = normalize(key + vec3(0., .145, .9894));
        color += vec3(.077, .073, .065) * pow(max(dot(n, halfway), 0.), 23.) * lit;
      } else if (vKind < 3.5) {
        float weave = sin(vPosition.y * 7.5 + sin(vPosition.x)) * sin((vPosition.x + .71 * vPosition.z) * 6.3);
        float sheen = pow(1. - abs(dot(n, vec3(0., .145, .9894))), 3.);
        color += vColor * ((vKind > 1.5 && vKind < 2.5 ? .012 : .006) * weave + .038 * sheen);
      } else {
        vec2 shoe = vec2((abs(vPosition.x) - 10.4) / 6.8, (vPosition.z - 3.) / 12.);
        color *= 1. - .27 * exp(-dot(shoe, shoe));
      }
      gl_FragColor = vec4(color, 1.);
    }`;

  function gpuRenderer(canvas) {
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, powerPreference: "low-power" });
    if (!gl) return null;
    const vShader = gl.createShader(gl.VERTEX_SHADER), fShader = gl.createShader(gl.FRAGMENT_SHADER);
    const program = gl.createProgram();
    const vbo = gl.createBuffer(), ibo = gl.createBuffer();
    const shadowMap = gl.createTexture(), depth = gl.createRenderbuffer(), target = gl.createFramebuffer();
    function destroy() {
      gl.deleteProgram(program); gl.deleteShader(vShader); gl.deleteShader(fShader);
      gl.deleteBuffer(vbo); gl.deleteBuffer(ibo);
      gl.deleteFramebuffer(target); gl.deleteRenderbuffer(depth); gl.deleteTexture(shadowMap);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
    gl.shaderSource(vShader, vertexSource); gl.compileShader(vShader);
    gl.shaderSource(fShader, fragmentSource); gl.compileShader(fShader);
    gl.attachShader(program, vShader); gl.attachShader(program, fShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { destroy(); return null; }
    gl.useProgram(program);
    const uniform = name => gl.getUniformLocation(program, name);
    const camera = uniform("uCamera"), center = uniform("uCenter"), pass = uniform("uLightPass"), shadows = uniform("uShadowEnabled");
    gl.uniform1i(uniform("uShadow"), 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    for (const [name, length, offset] of [["aPosition", 3, 0], ["aNormal", 3, 3], ["aColor", 3, 6], ["aKind", 1, 9]]) {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, length, gl.FLOAT, false, 40, offset * 4);
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.enable(gl.DEPTH_TEST);
    const limit = min(1024, gl.getParameter(gl.MAX_TEXTURE_SIZE));
    gl.bindTexture(gl.TEXTURE_2D, shadowMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, limit, limit, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    for (const rule of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, rule, gl.NEAREST);
    for (const rule of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, rule, gl.CLAMP_TO_EDGE);
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, limit, limit);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowMap, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    const shadowReady = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1f(shadows, shadowReady ? 1 : 0);
    let length = 0;
    return {
      ratio: () => min(2, window.devicePixelRatio || 1),
      setModel(model) {
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.DYNAMIC_DRAW);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.DYNAMIC_DRAW);
        length = model.indices.length;
      },
      draw(yaw, width, height, world, centerY) {
        gl.uniform4f(camera, cos(yaw), sin(yaw), 2 * height / (world * width), 2 / world);
        gl.uniform1f(center, centerY);
        if (shadowReady) {
          gl.bindTexture(gl.TEXTURE_2D, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target);
          gl.viewport(0, 0, limit, limit);
          gl.clearColor(1, 0, 0, 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.uniform1f(pass, 1);
          gl.enable(gl.POLYGON_OFFSET_FILL);
          gl.polygonOffset(2, 2);
          gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_SHORT, 0);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
          gl.bindTexture(gl.TEXTURE_2D, shadowMap);
        }
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform1f(pass, 0);
        gl.drawElements(gl.TRIANGLES, length, gl.UNSIGNED_SHORT, 0);
      },
      destroy
    };
  }

  // Devices without WebGL still get depth-tested triangles and smoothly interpolated cloth shading.
  function softwareRenderer(canvas) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    let model, projected, frame, depth;
    return {
      ratio: (w, h) => min(1.5, window.devicePixelRatio || 1, 810 / h, sqrt(485000 / (w * h))),
      setModel(next) { model = next; projected = new Float32Array(next.vertices.length / 10 * 6); },
      draw(yaw, width, height, world, centerY) {
        if (!frame || frame.width !== width || frame.height !== height) {
          frame = ctx.createImageData(width, height);
          depth = new Float32Array(width * height);
        }
        depth.fill(-1e4);
        const pixels = frame.data;
        pixels.fill(0);
        const c = cos(yaw), s = sin(yaw), scale = height / world;
        const vertices = model.vertices, tris = model.indices;
        for (let k = 0, j = 0; k < vertices.length; k += 10, j += 6) {
          const x = vertices[k], y = vertices[k + 1] - centerY, z = vertices[k + 2];
          const tx = c * x + s * z, tz = c * z - s * x;
          const nx = c * vertices[k + 3] + s * vertices[k + 5], ny = vertices[k + 4], nz = c * vertices[k + 5] - s * vertices[k + 3];
          const direct = max(0, -.504 * nx + .683 * ny + .528 * nz);
          let light = .61 + .365 * direct + .092 * max(0, .871 * nx + .363 * ny - .332 * nz) + .042 * max(ny, 0);
          if (vertices[k + 9] > 3.5) light *= 1 - .23 * exp(-(((abs(x) - 10.4) / 6.8) ** 2 + ((z - 3) / 12) ** 2));
          const shine = vertices[k + 9] < .5 ? 21 * max(0, -.289 * nx + .476 * ny + .829 * nz) ** 21 : 0;
          projected[j] = width * .5 + tx * scale;
          projected[j + 1] = height * .5 - (.9894 * y - .145 * tz) * scale;
          projected[j + 2] = .9894 * tz + .145 * y;
          for (let n = 0; n < 3; n++) projected[j + 3 + n] = 255 * vertices[k + 6 + n] * light + shine;
        }
        const p = projected;
        for (let i = 0; i < tris.length; i += 3) {
          const a = tris[i] * 6, b = tris[i + 1] * 6, d = tris[i + 2] * 6;
          const ax = p[a], ay = p[a + 1], bx = p[b], by = p[b + 1], cx = p[d], cy = p[d + 1];
          const den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
          if (abs(den) < .003) continue;
          const x0 = max(0, Math.ceil(min(ax, bx, cx) - .5)), x1 = min(width - 1, Math.floor(max(ax, bx, cx) - .5));
          const y0 = max(0, Math.ceil(min(ay, by, cy) - .5)), y1 = min(height - 1, Math.floor(max(ay, by, cy) - .5));
          const au = (by - cy) / den, av = (cx - bx) / den, bu = (cy - ay) / den, bv = (ax - cx) / den;
          for (let y = y0; y <= y1; y++) {
            let u = au * (x0 + .5 - cx) + av * (y + .5 - cy), v = bu * (x0 + .5 - cx) + bv * (y + .5 - cy);
            let pixel = y * width + x0;
            for (let x = x0; x <= x1; x++, pixel++, u += au, v += bu) {
              const w = 1 - u - v;
              if (u < -.00001 || v < -.00001 || w < -.00001) continue;
              const z = u * p[a + 2] + v * p[b + 2] + w * p[d + 2];
              if (z <= depth[pixel]) continue;
              depth[pixel] = z;
              const k = pixel * 4;
              for (let n = 0; n < 3; n++) pixels[k + n] = u * p[a + 3 + n] + v * p[b + 3 + n] + w * p[d + 3 + n];
              pixels[k + 3] = 255;
            }
          }
        }
        ctx.putImageData(frame, 0, 0);
      },
      destroy() { frame = depth = model = projected = null; }
    };
  }
  function mount(stage) {
    const scene = stage.querySelector(".fitting-scene"), toolbar = stage.querySelector(".fitting-toolbar");
    const signalOwner = new AbortController(), options = { signal: signalOwner.signal };
    const buttons = [...toolbar.querySelectorAll("[data-angle]")];
    const framingButton = toolbar.querySelector("[data-framing]");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let canvas = scene.querySelector("canvas"), renderer, pending = 0, geometryChanged = false, disposed = false;
    let params, lastKey, yaw = -.18, motion = null, drag = null, observer, torso = false;

    function software() {
      const next = canvas.cloneNode(false);
      canvas.replaceWith(next);
      canvas = next;
      try { renderer = softwareRenderer(canvas); } catch { renderer = null; }
      if (!renderer) {
        canvas.hidden = toolbar.hidden = stage.querySelector(".fitting-rotate-hint").hidden = true;
        stage.querySelector(".fitting-fallback").hidden = stage.querySelector(".fitting-unavailable").hidden = false;
      }
    }
    try { renderer = gpuRenderer(canvas); } catch { renderer = null; }
    if (!renderer) software();
    else canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      if (disposed) return;
      renderer.destroy();
      software();
      geometryChanged = true;
      schedule();
    }, options);

    function schedule() {
      if (!pending && !disposed && renderer && params) pending = requestAnimationFrame(draw);
    }
    function indicate() {
      for (const button of buttons) {
        const distance = Math.acos(clamp(cos(yaw - Number(button.dataset.angle) * PI / 180), -1, 1));
        button.setAttribute("aria-pressed", String(distance < .25));
      }
    }
    function draw(now) {
      pending = 0;
      if (!params || !renderer || disposed) return;
      if (geometryChanged) {
        renderer.setModel(buildModel(params.profile, params.product, params.size, params.color));
        geometryChanged = false;
      }
      if (motion) {
        const t = clamp((now - motion.time) / 245, 0, 1);
        yaw = motion.start + motion.delta * (1 - (1 - t) ** 3);
        if (t === 1) motion = null;
        indicate();
      }
      const w = scene.clientWidth, h = scene.clientHeight;
      if (!w || !h) return;
      const ratio = renderer.ratio(w, h);
      const width = max(1, Math.round(w * ratio)), height = max(1, Math.round(h * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
      let world = max(187, params.profile.height + 10, 73 * h / w);
      let center = world * .5 - 6.5;
      if (torso) {
        const shoulder = params.profile.height - (21.6 + (params.profile.height - 170) * .055) - 8.35;
        const length = params.product.chart.find(row => row.size === params.size).length;
        const lower = shoulder + 2 - length * .87 - 7, upper = shoulder + 10;
        world = max(upper - lower, (params.profile.shoulder + 25) * h / w);
        center = (lower + upper) * .5;
      }
      scene.style.setProperty("--plinth-width", 77 * h / world + "px");
      renderer.draw(yaw, width, height, world, center);
      if (motion) schedule();
    }
    function aim(angle) {
      const delta = Math.atan2(sin(angle - yaw), cos(angle - yaw));
      if (reducedMotion.matches) { yaw += delta; motion = null; indicate(); }
      else motion = { start: yaw, delta, time: performance.now() };
      schedule();
    }
    toolbar.addEventListener("click", event => {
      const button = event.target.closest("[data-angle]");
      if (button) aim(Number(button.dataset.angle) * PI / 180);
      if (event.target.closest("[data-framing]")) {
        torso = !torso;
        stage.dataset.frame = torso ? "torso" : "full";
        framingButton.textContent = torso ? "ดูเต็มตัว" : "ดูช่วงตัว";
        describe();
        schedule();
      }
    }, options);
    function describe() {
      if (params) canvas.setAttribute("aria-label", `หุ่นลอง${params.product.name} สี${catalog.colors[params.color].name} ไซซ์ ${params.size} มุมมอง${torso ? "ช่วงตัว" : "เต็มตัว"} หมุนด้วยปุ่มลูกศรซ้ายและขวา`);
    }
    scene.addEventListener("pointerdown", event => {
      if (event.target !== canvas || drag || event.button !== 0) return;
      motion = null;
      drag = { id: event.pointerId, x: event.clientX, yaw };
      scene.setPointerCapture(event.pointerId);
      canvas.classList.add("is-dragging");
    }, options);
    scene.addEventListener("pointermove", event => {
      if (drag?.id !== event.pointerId) return;
      yaw = drag.yaw + (event.clientX - drag.x) * TAU / max(260, scene.clientWidth * .94);
      indicate(); schedule();
    }, options);
    function release(event) {
      if (drag?.id !== event.pointerId) return;
      drag = null;
      canvas.classList.remove("is-dragging");
      if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    }
    scene.addEventListener("pointerup", release, options);
    scene.addEventListener("pointercancel", release, options);
    scene.addEventListener("lostpointercapture", release, options);
    scene.addEventListener("keydown", event => {
      if (event.target !== canvas) return;
      const keys = { ArrowLeft: -PI / 12, ArrowRight: PI / 12 };
      if (event.key === "Home") aim(0);
      else if (event.key === "End") aim(PI);
      else if (Object.hasOwn(keys, event.key)) {
        motion = null; yaw += keys[event.key]; indicate(); schedule();
      } else return;
      event.preventDefault();
    }, options);
    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(schedule);
      observer.observe(scene);
    }
    window.addEventListener("resize", schedule, options);
    return {
      update(profile, product, size, color) {
        const next = [product.id, size, color, ...Object.keys(catalog.measurements).map(k => profile[k])].join("/");
        if (next === lastKey) return;
        lastKey = next;
        params = { profile, product, size, color };
        describe();
        geometryChanged = true;
        schedule();
      },
      destroy() {
        disposed = true;
        signalOwner.abort();
        observer?.disconnect();
        cancelAnimationFrame(pending);
        renderer?.destroy();
        renderer = params = null;
      }
    };
  }

  globalThis.Mono.fitModel = { mount };
})();

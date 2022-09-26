/**
 * Author: Daniel Silva (@returndaniels)
 * Email: danielss@dcc.ufrj.br
 * https://observablehq.com/@returndaniels/intersecao-entre-circulos-e-poligonos
 *
 */

import { vec2, util2d } from "@esperanc/funcoes-2d-uteis";

polyDemo = () => {
  const width = 920;
  const height = 600;
  const demo = html`<canvas
    width="${width}"
    height="${height}"
    style="border:1px solid gray"
  ></canvas>`;
  const ctx = demo.getContext("2d");

  const isos = [
    [
      [200, 300],
      [300, 200],
    ],
    [
      [100, 100],
      [100, 20],
    ],
    [
      [320, 350],
      [420, 350],
    ],
  ];

  const rects = [
    [
      [100, 480],
      [100, 440],
      [140, 480],
      [60, 480],
      [100, 520],
    ],
    [
      [700, 480],
      [700, 440],
      [740, 480],
      [660, 480],
      [700, 520],
    ],
    [
      [800, 280],
      [800, 240],
      [840, 280],
      [760, 280],
      [800, 320],
    ],
  ];

  const cirs = [
    [
      [700, 150],
      [700, 50],
    ],
    [
      [400, 200],
      [400, 150],
    ],
    [
      [600, 350],
      [600, 420],
    ],
  ];

  const drawPoints = (p) => {
    ctx.beginPath();
    ctx.arc(...p, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPolygon = (pol, getPolygon, ctx) => {
    pol.forEach(drawPoints);
    ctx.beginPath();
    getPolygon(...pol).forEach((p) => ctx.lineTo(...p));
    ctx.closePath();
    ctx.stroke();
  };

  const drawPolygons = (pols, getPolygon, ctx, red) =>
    pols.forEach((pol, i) => {
      ctx.fillStyle = ctx.strokeStyle = red(pol, i) ? "red" : "black";
      drawPolygon(pol, getPolygon, ctx);
    });

  const update = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = ctx.strokeStyle = "black";

    const tt = (t1, t2) =>
      polygonsIntersection(isosceles(...t1), isosceles(...t2));
    const tc = (iso, cir) => polygonCircleIntersection(isosceles(...iso), cir);
    const tr = (iso, rect) =>
      polygonsIntersection(rectangle(...rect), isosceles(...iso));
    const rr = (r1, r2) =>
      polygonsIntersection(rectangle(...r1), rectangle(...r2));
    const rc = (rect, cir) =>
      polygonCircleIntersection(rectangle(...rect), cir);
    const cc = (c1, c2) => circlesIntersection(c1, c2);

    const checkIso = (iso, idx) => {
      for (let i = 0; i < isos.length; i++) {
        if (tt(iso, isos[i]) && i != idx) return true;
        if (tc(iso, cirs[i])) return true;
        if (tr(iso, rects[i])) return true;
      }
    };
    const checkRect = (rect, idx) => {
      for (let i = 0; i < rects.length; i++) {
        if (rr(rects[i], rect) && i != idx) return true;
        if (rc(rect, cirs[i])) return true;
        if (tr(isos[i], rect)) return true;
      }
    };
    const checkCircle = (cir, idx) => {
      for (let i = 0; i < cirs.length; i++) {
        if (cc(cirs[i], cir) && i != idx) return true;
        if (rc(rects[i], cir)) return true;
        if (tc(isos[i], cir)) return true;
      }
    };

    drawPolygons(isos, isosceles, ctx, checkIso);
    drawPolygons(rects, rectangle, ctx, checkRect);

    cirs.forEach((cir, i) => {
      const [center, border] = cir;
      const dist = vec2.dist(center, border);

      ctx.fillStyle = ctx.strokeStyle = checkCircle(cir, i) ? "red" : "black";

      cir.forEach(drawPoints);
      ctx.beginPath();
      ctx.arc(...center, dist, 0, Math.PI * 2);
      ctx.stroke();
    });
  };
  update();

  let prevMouse = null;
  const dragBase = (e, pts) => {
    const mouse = [e.offsetX, e.offsetY];
    const [base] = pts;
    const vtx = pts.slice(1).map((p) => vec2.sub([], p, base));

    const delta = vec2.sub([], mouse, prevMouse);
    prevMouse = mouse;
    vec2.add(base, base, delta);
    vtx.forEach((v, i) => vec2.add(pts[i + 1], v, base));
  };

  const dragVtx = (e, pts, edge) => {
    const mouse = [e.offsetX, e.offsetY];
    const [base] = pts;

    const diff = vec2.sub([], mouse, prevMouse);
    const delta = vec2.sub([], mouse, prevMouse);
    prevMouse = mouse;

    if (pts.length <= 2) vec2.add(pts[1], pts[1], delta);
    else {
      let diff1 = [];
      let diff2 = [];

      const rotateEdge = (ed, base, deg) => vec2.rotate(ed, ed, base, deg);
      const trasnform = (pt, op, pt3, pt4, r1, r2, delta, base) => {
        diff1 = [];
        diff2 = [];
        vec2.add(pt, pt, delta);
        vec2.add(op, op, [-delta[0], -delta[1]]);
        vec2.sub(diff1, pt3, base);
        vec2.sub(diff2, pt4, base);
        rotateEdge(r1, base, Math.PI / 2 - vec2.angle(diff1, diff2));
        rotateEdge(r2, base, Math.PI / 2 - vec2.angle(diff1, diff2));
      };

      if (edge == 1)
        trasnform(pts[1], pts[4], pts[1], pts[2], pts[2], pts[3], delta, base);
      if (edge == 2)
        trasnform(pts[2], pts[3], pts[2], pts[4], pts[1], pts[4], delta, base);
      if (edge == 3)
        trasnform(pts[3], pts[2], pts[3], pts[1], pts[1], pts[4], delta, base);
      if (edge == 4)
        trasnform(pts[4], pts[1], pts[4], pts[3], pts[2], pts[3], delta, base);
    }
  };

  const polygonsEvent = (pols, mouse) => {
    pols.forEach((pol) => {
      pol.forEach((r, i) => {
        let p = pol[i];
        let d = vec2.distance(mouse, p);
        if (d <= 5) {
          demo.onmousemove =
            i == 0
              ? (e) => {
                  dragBase(e, pol);
                  update();
                }
              : (e) => {
                  dragVtx(e, pol, i);
                  update();
                };
        }
      });
    });
  };
  demo.onmousedown = (e) => {
    const mouse = [e.offsetX, e.offsetY];
    prevMouse = mouse;
    demo.onmousemove = null;

    polygonsEvent(isos, mouse);
    polygonsEvent(rects, mouse);
    polygonsEvent(cirs, mouse);
  };

  demo.onmouseup = () => {
    demo.onmousemove = null;
  };

  return demo;
};

//
// Returns the 3 vertices of an isosceles triangle
// defined by the center point of its base and the
// opposite vertex
//
function isosceles(basePoint, oppositeVertex) {
  const u = vec2.sub([], basePoint, oppositeVertex);
  const v = [-u[1], u[0]];
  const w = [u[1], -u[0]];
  return [
    oppositeVertex,
    vec2.add([], basePoint, v),
    vec2.add([], basePoint, w),
  ];
}

//
// Returns the 4 vertices of an rectangle
// defined by the center point of its base
// and the 4 vertices
//
function rectangle(center, e1, e2, e3, e4) {
  const u1 = vec2.sub([], e1, center);
  const u2 = vec2.sub([], e2, center);
  const u3 = vec2.sub([], e3, center);
  const u4 = vec2.sub([], e4, center);

  const v1 = vec2.add([], u1, u3);
  const v2 = vec2.add([], u1, u2);
  const v3 = vec2.add([], u2, u4);
  const v4 = vec2.add([], u3, u4);

  return [
    vec2.add([], center, v1),
    vec2.add([], center, v2),
    vec2.add([], center, v3),
    vec2.add([], center, v4),
  ];
}

function polygonCircleIntersection(pol, circle) {
  const numberPoints = pol.length;
  if (util2d.pointInPoly(circle[0], pol)) return true;
  for (let i = 0; i < numberPoints; i++) {
    for (let j = 0; j < 360; j++) {
      let degree = (j * Math.PI) / 180;
      let p = [];
      vec2.rotate(p, circle[1], circle[0], degree);
      if (
        vec2.segmentsIntersect(
          pol[i],
          pol[(i + 1) % numberPoints],
          circle[0],
          p
        )
      )
        return true;
    }
  }
  util2d.p;
  return false;
}

function circlesIntersection(circle1, circle2) {
  const [center1, border1] = circle1;
  const [center2, border2] = circle2;

  const radio1 = vec2.dist(center1, border1);
  const radio2 = vec2.dist(center2, border2);

  const dist = vec2.dist(center1, center2);
  return dist <= radio1 + radio2;
}

function polygonsIntersection(pol1, pol2) {
  const numberPoints = pol1.length;
  const numberPoints2 = pol2.length;
  let pointsInPol1 = 0,
    pointsInPol2 = 0;

  for (let i = 0; i < numberPoints; i++) {
    for (let j = 0; j < numberPoints2; j++) {
      const intersection = vec2.segmentsIntersect(
        pol1[i],
        pol1[(i + 1) % numberPoints],
        pol2[j],
        pol2[(j + 1) % numberPoints2]
      );
      if (intersection) return true;
      if (util2d.pointInPoly(pol2[j], pol1)) pointsInPol1++;
    }
    if (util2d.pointInPoly(pol1[i], pol2)) pointsInPol2++;
  }
  if (pointsInPol2 == 4 || pointsInPol1 == 4) return true;
  util2d.p;
  return false;
}

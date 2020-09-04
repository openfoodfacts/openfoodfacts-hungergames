export const points2Path = (points, close) =>
  "M " +
  points.map((point) => `${point.x} ${point.y}`).join(" L ") +
  (close ? " Z" : "");

export const points2Key = (points) =>
  [...points]
    .sort((pA, pB) => (pA.x == pB.x ? pA.y - pB.y : pA.x - pB.x))
    .map((point) => `(${point.x},${point.y})`)
    .join("");

const compare3points = (pA, pB, pC) =>
  (pB.x - pA.x) * (pC.y - pA.y) - (pB.y - pA.y) * (pC.x - pA.x) > 0;

export const getConvexPoints = (points) => {
  const sortedPoints = [...points].sort((pA, pB) => pA.x - pB.x);

  const enveloppe = [0];

  while (
    enveloppe[enveloppe.length - 1] !== enveloppe[0] ||
    enveloppe.length === 1
  ) {
    const a = enveloppe[enveloppe.length - 1];
    for (let b = 0; b < sortedPoints.length; b++) {
      if (a !== b) {
        let bord = true;
        let c = 0;
        while (c < sortedPoints.length && bord) {
          if (
            c !== a &&
            c !== b &&
            compare3points(sortedPoints[a], sortedPoints[b], sortedPoints[c])
          ) {
            bord = false;
          }
          c++;
        }
        if (bord) {
          enveloppe.push(b);
        }
      }
    }
  }
  return enveloppe
    .slice(0, enveloppe.length)
    .map((pointIndex) => sortedPoints[pointIndex]);
};

export const getCenter = (points) => {
  const sum = points.reduce((pA, pB) => ({ x: pA.x + pB.x, y: pA.y + pB.y }), {
    x: 0,
    y: 0,
  });
  return { x: sum.x / points.length, y: sum.y / points.length };
};

export const getBoxes = (textAnnotations) => {
  const rep = {};
  textAnnotations.forEach((box, boxIndex) => {
    if (boxIndex > 0) {
      rep[points2Key(box.boundingPoly.vertices)] = {
        boxIndex: boxIndex,
        points: box.boundingPoly.vertices,
        path: points2Path(box.boundingPoly.vertices, true),
        text: box.description,
        visible: true,
        toDelete: false,
      };
    }
  });
  return rep;
};

export const getGraphConnexComponents = (graph) => {
  const node2component = {};

  Object.keys(graph).forEach((key, index) => {
    node2component[key] = index;
  });
  Object.keys(graph).forEach((key) => {
    const neighbors = [...graph[key], key];

    const components = neighbors.map((n) => node2component[n]); //get all components to fusion

    const minComponentId = components.reduce(
      (a, b) => Math.min(a, b),
      Object.keys(graph).length
    );

    Object.keys(graph).forEach((key) => {
      if (components.includes(node2component[key])) {
        node2component[key] = minComponentId;
      }
    });
  });

  return node2component;
};

export const getHullPaths = (graph, boxes) => {
  const node2component = getGraphConnexComponents(graph); //associate each noteId to a component number
  if (boxes === 0) {
    boxes += 1;
  }

  // we reverse the key/value
  // for each component index we get the list of nodeId
  const component2nodes = {};
  Object.keys(node2component).forEach((node) => {
    const componentId = node2component[node];
    if (component2nodes[componentId] === undefined) {
      component2nodes[componentId] = [node];
    } else {
      component2nodes[componentId].push(node);
    }
  });

  //now we will return a dict associated key to convex cell
  const rep = {};
  Object.keys(component2nodes).forEach((key) => {
    const points = component2nodes[key].reduce(
      (accumulateur, nodeId) => [...accumulateur, ...boxes[nodeId].points],
      []
    );
    const componentKey = [...component2nodes[key]]
      .sort((nodeId1, nodeId2) => (nodeId1 < nodeId2 ? 1 : -1))
      .join("-");

    rep[componentKey] = {
      // rep[points.join("//")] = {
      path: points2Path(getConvexPoints(points), true),
      points: points,
      text: "",
      visible: true,
    };
  });

  return rep;
};

export const sortKeys = (node1Key, node2Key) => {
  const start = node2Key > node1Key ? node2Key : node1Key;
  const end = node2Key <= node1Key ? node2Key : node1Key;
  return [start, end];
};

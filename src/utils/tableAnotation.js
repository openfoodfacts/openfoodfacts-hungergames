export const getBoxes = (textAnnotations) => {
  const rep = {};
  textAnnotations.slice(1).forEach((box) => {
    const path = box.boundingPoly.vertices
      .map(
        (coords, index) =>
          `${index === 0 ? "M" : "L"} ${coords.x} ${coords.y} ${
            index === box.boundingPoly.vertices.length - 1 ? "Z" : ""
          }`
      )
      .join(" ");
    rep[path] = {
      text: box.description,
      visible: true,
      toDelete: false,
    };
  });
  return rep;
};

export const getPath = (points) =>
  `M ${points
    .map(
      ({ x, y }, index) =>
        `${x} ${y} ${index === points.length - 1 ? "" : "L "}`
    )
    .join("")}`;

export const getCenter = (path) => {
  const X = [];
  const Y = [];
  path
    .split(" ")
    .filter((x) => !isNaN(x) && x.length > 0)
    .forEach((x, i) => {
      if (i % 2 === 0) {
        X.push(parseInt(x));
      } else {
        Y.push(parseInt(x));
      }
    });
  return {
    x: parseInt(X.reduce((a, b) => a + b, 0) / X.length),
    y: parseInt(Y.reduce((a, b) => a + b, 0) / Y.length),
  };
};

export const getGraphConnexComponents = (graph) => {
  const node2component = {};

  Object.keys(graph).forEach((key, index) => {
    node2component[key] = index;
  });
  Object.keys(graph).forEach((key) => {
    const neighbors = [...graph[key], key];
    // neighbors.push(key);

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

const getHullPath = (component) => {
  if (component.length === 0) {
    return component[0];
  }

  const X = [];
  const Y = [];

  component.forEach((path) => {
    path
      .split(" ")
      .filter((x) => !isNaN(x) && x.length > 0)
      .forEach((x, i) => {
        if (i % 2 === 0) {
          X.push(parseInt(x));
        } else {
          Y.push(parseInt(x));
        }
      });
  });

  const enveloppe = [];
  for (let i = 0; i < X.length; i++) {
    for (let j = 0; j < X.length; j++) {
      if (i !== j) {
        let bord = true;
        let k = 0;
        while (k < X.length && bord) {
          if (
            k !== i &&
            k !== j &&
            (X[j] - X[i]) * (Y[k] - Y[i]) - (Y[j] - Y[i]) * (X[k] - X[i]) > 0
          ) {
            bord = false;
          }
          k++;
        }
        if (bord) {
          enveloppe.push([i, j]);
        }
      }
    }
  }

  const convexHall = enveloppe[0];
  while (convexHall.length < enveloppe.length - 1) {
    enveloppe.forEach(([i, j]) => {
      if (convexHall.length < enveloppe.length) {
        if (
          i === convexHall[convexHall.length - 1] &&
          j !== convexHall[convexHall.length - 2]
        ) {
          convexHall.push(j);
        } else if (
          j === convexHall[convexHall.length - 1] &&
          i !== convexHall[convexHall.length - 2]
        ) {
          convexHall.push(i);
        }
      }
    });
  }

  return `M ${convexHall.map((i) => ` ${X[i]} ${Y[i]} `).join("L")} Z`;
};
export const getHullPaths = (graph) => {
  const node2component = getGraphConnexComponents(graph);

  const component2nodes = {};

  Object.keys(node2component).forEach((node) => {
    const componentId = node2component[node];
    if (component2nodes[componentId] === undefined) {
      component2nodes[componentId] = [node];
    } else {
      component2nodes[componentId].push(node);
    }
  });

  const rep = {};

  Object.keys(component2nodes).forEach((key) => {
    rep[getHullPath(component2nodes[key])] = {
      text: "",
      visible: true,
    };
  });

  return rep;
};

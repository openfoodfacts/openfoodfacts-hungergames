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
        // X.push(x);
        X.push(parseInt(x));
      } else {
        // Y.push(x);
        Y.push(parseInt(x));
      }
    });
  return {
    x: parseInt(X.reduce((a, b) => a + b, 0) / X.length),
    y: parseInt(Y.reduce((a, b) => a + b, 0) / Y.length),
  };
};

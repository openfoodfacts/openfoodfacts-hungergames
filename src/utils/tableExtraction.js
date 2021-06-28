// import axios from "axios";
// import { OFF_IMAGE_URL } from "./const";
const axios = require("axios");
const OFF_IMAGE_URL = "https://static.openfoodfacts.org/images/products";
const nutrimentTranslation = require("../data/nutrients_translation_remapped.json");
const { distance } = require("fastest-levenshtein");

const OVERLAPPING_THRESHOLD = 0.75;

const isOverlapping = (boxA, boxB) => {
  const ref = Math.min(boxA.maxY - boxA.minY, boxB.maxY - boxB.minY);
  const overlappDist =
    Math.min(boxA.maxY, boxB.maxY) - Math.max(boxA.minY, boxB.minY);
  return overlappDist / ref > OVERLAPPING_THRESHOLD;
};

const addExpression = (trad, expression, nutriKey) => {
  if (expression.length === 0) {
    return null;
  }
  const word = expression[0];
  if (trad[word] === undefined) {
    trad[word] = {};
  }

  if (expression.length === 1) {
    trad[word]["nutriKey"] = nutriKey;
  } else {
    addExpression(trad[word], expression.slice(1), nutriKey);
  }
};

const remapTranslation = (lang) => {
  if (!Object.keys(nutrimentTranslation).includes(lang)) {
    return {};
  }
  const translationTree = {};

  Object.keys(nutrimentTranslation[lang]).forEach((nutryKey) => {
    nutrimentTranslation[lang][nutryKey].forEach((trad) => {
      const cleanTrad = trad
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      const splitted = cleanTrad.split(" ");
      addExpression(translationTree, splitted, nutryKey);
    });
  });
  return translationTree;
};

const boxIsInside = (box, { minX, minY, maxX, maxY }) => {
  let nbComplet = 0;
  box["boundingPoly"]["vertices"].forEach(({ x, y }) => {
    if (x !== undefined && y !== undefined) {
      nbComplet += 1;
    }
  });
  if (nbComplet < 4) {
    // remove bounding bx with incomplet number of points
    return false;
  }
  let hasPointInside = false;
  box["boundingPoly"]["vertices"].forEach(({ x, y }) => {
    if (minX <= x && maxX >= x && minY <= y && maxY >= y) {
      hasPointInside = true;
    }
  });
  return hasPointInside;
};

const addGlobalBox = (box) => {
  const extremaValues = {
    minX: -1,
    minY: -1,
    maxX: -1,
    maxY: -1,
  };

  box["boundingPoly"]["vertices"].forEach(({ x, y }) => {
    if (x && x > extremaValues.maxX) {
      extremaValues.maxX = x;
    }
    if (y && y > extremaValues.maxY) {
      extremaValues.maxY = y;
    }
    if (x && (x < extremaValues.minX || extremaValues.minX === -1)) {
      extremaValues.minX = x;
    }
    if (y && (y < extremaValues.minY || extremaValues.minY === -1)) {
      extremaValues.minY = y;
    }
  });

  return { ...box, ...extremaValues };
};

const extractValues = (text) => {
  const cleanText = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/,/gi, ".")
    .replace(/[^0-9a-z.><=~%]/gi, "");

  const grams = [
    ...cleanText.matchAll(
      /[<|>|<|=|>|=|~]{0,1}[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*g/g
    ),
  ]
    .map((x) => x[0])
    .filter((x) => x !== "g");
  const milligrams = [
    ...cleanText.matchAll(
      /[<|>|<|=|>|=|~]{0,1}[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*mg/g
    ),
  ]
    .map((x) => x[0])
    .filter((x) => x !== "mg");
  const mcg = [
    ...cleanText.matchAll(
      /[<|>|<|=|>|=|~]{0,1}[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*mcg/g
    ),
  ]
    .map((x) => x[0])
    .filter((x) => x !== "mcg");
  const percents = [
    ...cleanText.matchAll(
      /[<|>|<|=|>|=|~]{0,1}[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*%/g
    ),
  ]
    .map((x) => x[0])
    .filter((x) => x !== "%");
  const kJ = [...cleanText.matchAll(/[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*kj/g)]
    .map((x) => x[0])
    .filter((x) => x !== "kj");
  const kcal = [...cleanText.matchAll(/[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*kcal/g)]
    .map((x) => x[0])
    .filter((x) => x !== "kcal");
  //   je n'arrive pas a extraire les chiffres qui ne sont dans aucune liste précédente. Au pire, je chercherai tous les nombre puis filtrer.
  //   const alone = [
  //     ...cleanText.matchAll(
  //       /^(?:[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*){1,}[^(?:kcal)(?:kj)g(?:mg)%]$/g
  //     ),
  //   ].map((x) => x[0]);

  const all = [
    ...cleanText.matchAll(
      /[<|>|<|=|>|=|~]{0,1}[0-9]*[<|>|<|=|>|=|~|.]*[0-9]*/g
    ),
  ]
    .map((x) => x[0])
    .filter((x) => !["", "<", ">", "<", "=", ">", "=", "~", "."].includes(x));
  return {
    grams,
    milligrams,
    mcg,
    percents,
    kJ,
    kcal,
    all,
    // alone,
  };
};

function getNutrimentBoxes(filteredBoxes, linkBoxes, lang) {
  console.log({ filteredBoxes, linkBoxes, lang });
  const translationTree = remapTranslation(lang);
  const rep = [];

  const seenBoxes = [];

  Object.keys(linkBoxes).forEach((k) => {
    const i = parseInt(k);
    if (!seenBoxes.includes(i)) {
      const currentSolution = {};
      const boxes = [i];
      let translation = translationTree;

      let j = i;
      while (translation !== undefined && j !== null) {
        let text = filteredBoxes[j].description;
        text = text
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");
        if (
          translation[text] !== undefined &&
          translation[text]["nutriKey"] !== undefined
        ) {
          // This is a potential solution
          currentSolution.key = translation[text]["nutriKey"];
          currentSolution.boxes = [...boxes];
        }
        if (translation[text] !== undefined) {
          translation = translation[text];
          j = linkBoxes[j];
          boxes.push(j);
        } else {
          translation = translation[text];
        }
      }

      rep.push({
        ...currentSolution,
        text: currentSolution.boxes
          ? currentSolution.boxes
              .map((j) =>
                filteredBoxes[j].description
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .toLowerCase()
                  .replace(/[^a-z0-9]/g, "")
              )
              .join(" ")
          : filteredBoxes[i].description
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, ""),
      });
      if (currentSolution.boxes) {
        currentSolution.boxes.forEach((j) => seenBoxes.push(j));
      }
    }
  });
  return rep;
}
function getValues(filteredBoxes, linkBoxes) {
  const values = [];

  const seenBoxes = [];
  Object.keys(linkBoxes).forEach((k) => {
    const index = parseInt(k);
    const box = filteredBoxes[index];

    if (!seenBoxes.includes(index)) {
      seenBoxes.push(index);
      let text = box.description;
      let { grams, milligrams, mcg, percents, kJ, kcal, all } = extractValues(
        text
      );

      let i = index;
      const group = [i];
      let again = true;
      while (all.length > 0 && linkBoxes[i] !== null && again) {
        again = false;
        let {
          grams: newGrams,
          milligrams: newMilligrams,
          mcg: newMcg,
          percents: newPercents,
          kJ: newKJ,
          kcal: newKcal,
          all: newAll,
        } = extractValues(text + filteredBoxes[linkBoxes[i]].description);
        if (
          grams.length < newGrams.length ||
          milligrams.length < newMilligrams.length ||
          mcg.length < newMcg.length ||
          percents.length < newPercents.length ||
          kJ.length < newKJ.length ||
          kcal.length < newKcal.length
        ) {
          again = true;
          seenBoxes.push(linkBoxes[i]);
          group.push(linkBoxes[i]);
          i = linkBoxes[i];
          text = text + filteredBoxes[i].description;
          grams = newGrams;
          milligrams = newMilligrams;
          mcg = newMcg;
          percents = newPercents;
          kJ = newKJ;
          kcal = newKcal;
          all = newAll;
        }
      }

      if (all.length > 0) {
        values.push({
          boxesIndexes: [...group],
          text: [
            ...grams,
            ...milligrams,
            ...mcg,
            ...percents,
            ...kJ,
            ...kcal,
            ...all,
          ],
        });
      }
    }
  });

  return values;
}

function filterBoxes(ocrData, { minX, minY, maxX, maxY }) {
  const filteredBoxes = ocrData.boxes
    .filter((box) => boxIsInside(box, { minX, minY, maxX, maxY }))
    .map((box) => addGlobalBox(box))
    .sort((a, b) => a.minY - b.minY);

  const diffX = filteredBoxes.map((b) => b.maxY - b.minY).sort()[
    Math.floor(filteredBoxes.length / 2)
  ];

  let X_sorted_indexes = [...filteredBoxes.map((_, i) => i)];
  X_sorted_indexes.sort(
    (a, b) => -filteredBoxes[a].minX + filteredBoxes[b].minX
  );

  const linkBoxes = {};
  X_sorted_indexes.forEach((k) => {
    const i = parseInt(k);
    linkBoxes[i] = null;
    let j = i - 1;
    while (
      linkBoxes[i] === null &&
      j >= 0 &&
      filteredBoxes[j].maxY > filteredBoxes[i].minY
    ) {
      if (
        filteredBoxes[i].maxX - diffX <= filteredBoxes[j].minX &&
        filteredBoxes[i].maxX + diffX >= filteredBoxes[j].minX &&
        isOverlapping(filteredBoxes[i], filteredBoxes[j])
      ) {
        linkBoxes[i] = j;
      }
      j = j - 1;
    }
    j = i + 1;
    while (
      linkBoxes[i] === null &&
      j < filteredBoxes.length &&
      filteredBoxes[j].minY < filteredBoxes[i].maxY
    ) {
      if (
        filteredBoxes[i].maxX - diffX <= filteredBoxes[j].minX &&
        filteredBoxes[i].maxX + diffX >= filteredBoxes[j].minX &&
        isOverlapping(filteredBoxes[i], filteredBoxes[j])
      ) {
        linkBoxes[i] = j;
      }
      j = j + 1;
    }
  });
  return { filteredBoxes, linkBoxes };
}

const ocr = {
  async getOCRdata(imageUrl) {
    const {
      data: {
        responses: [{ textAnnotations: textAnnotations }],
      },
    } = await axios.get(`${OFF_IMAGE_URL}/${imageUrl.split(".jpg")[0]}.json`);

    return {
      lang: textAnnotations[0]["locale"],
      text: textAnnotations[0]["description"],
      boxes: textAnnotations.slice(1),
    };
  },
  getData(ocrData, { minX, minY, maxX, maxY }) {
    const { filteredBoxes, linkBoxes } = filterBoxes(ocrData, {
      minX,
      minY,
      maxX,
      maxY,
    });
    filteredBoxes.forEach((x, i) => {
      filteredBoxes[i] = { id: i, ...x };
    });
    const values = getValues(filteredBoxes, linkBoxes);
    const nutriments = getNutrimentBoxes(
      filteredBoxes,
      linkBoxes,
      ocrData.lang
    );
    return { filteredBoxes, values, nutriments };
  },
  bestMatch({ search, lang = "", except = [] }) {
    if (!search) {
      return [];
    }
    let translation = nutrimentTranslation[lang];
    if (!translation) {
      translation = nutrimentTranslation["en"];
    }

    const noralizedSearch = search
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return Object.keys(translation)
      .filter((nutriKey) => !except.includes(nutriKey))
      .map((nutriKey) => {
        const text = translation[nutriKey][0]
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
        return { key: nutriKey, text, d: distance(noralizedSearch, text) };
      })
      .sort((a, b) => a.d - b.d)
      .slice(0, 5);
  },
};
export default ocr;

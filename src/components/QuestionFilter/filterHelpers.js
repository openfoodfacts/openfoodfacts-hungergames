import { getURLParam } from "../../utils";

const randomInsightTypeChoices = ["label", "category", "brand"];
const getRandomInsightType = () =>
  randomInsightTypeChoices[
    Math.floor(randomInsightTypeChoices.length * Math.random())
  ];
export const getInitialInsightType = () => {
  const urlParamValue = getURLParam("type");

  if (urlParamValue.length) {
    return urlParamValue;
  }

  return getRandomInsightType();
};

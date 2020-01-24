import countries from "./data/countries";


export const countryMap = function () {
    const countryMap = {};
    countries.forEach(c => {
        countryMap[c.id] = c.label;
    })
    return countryMap;
}();
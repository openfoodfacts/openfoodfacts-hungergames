import countries from './data/countries';
import { localSettings } from "./settings";

export const getLang = () => {
    const settings = localSettings.fetch();
    return settings.lang || "en";
}

export default (() => {
    const matches = /^https:\/\/((world|\w{2})(?:-(\w{2}))?)\.openfoodfacts\.org/.exec(
        window.location.href,
    );
    if (!matches) {
        return { subDomain: 'world', countryCode: 'world', languageCode: 'en' };
    }

    const countryCode = matches[2].toLowerCase();
    if (matches[3]) {
        return {
            subDomain: matches[1],
            countryCode: countryCode,
            languageCode: matches[3],
        };
    }

    const country = countries.find(
        country =>
            country.countryCode !== undefined &&
            country.countryCode.toLowerCase() === countryCode,
    );
    const languageCode = country === undefined ? 'en' : country.languageCode;
    return {
        subDomain: matches[1],
        countryCode: countryCode,
        languageCode: languageCode,
    };
})();

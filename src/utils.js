export const getURLParam = key => {
    const urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has(key)) {
        return "";
    }

    return urlParams.get(key);
};
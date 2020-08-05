export const getURLParam = key => {
    const urlParams = new URLSearchParams(window.location.search);

    if (!urlParams.has(key)) {
        return "";
    }

    return urlParams.get(key);
};

export const removeEmptyKeys = obj => {
  Object.keys(obj).forEach(
    key => (obj[key] === undefined || obj[key] === '') && delete obj[key]
  )
  return obj
}

export const updateURLParam = (key, value) => {
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set(key, value);
  const newRelativePathQuery =
    window.location.pathname + "?" + urlParams.toString();
  history.pushState(null, "", newRelativePathQuery);
};

export const setURLParams = (parameters) => {
  const urlParams = new URLSearchParams();
  Object.keys(parameters).forEach((key) => {
    if (parameters[key]) {
      urlParams.set(key, parameters[key]);
    }
  });

  const newRelativePathQuery =
    window.location.pathname + "?" + urlParams.toString();
  history.pushState(null, "", newRelativePathQuery);
};

export const deleteURLParam = (key) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.has(key)) {
    return;
  }

  urlParams.delete(key);

  const newRelativePathQuery =
    window.location.pathname +
    (urlParams.toString().length ? `?${urlParams.toString()}` : "");

  history.pushState(null, "", newRelativePathQuery);
};

export const getURLParam = (key) => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.has(key)) {
    return "";
  }

  return urlParams.get(key);
};

export const removeEmptyKeys = (obj) => {
  Object.keys(obj).forEach(
    (key) => (obj[key] === undefined || obj[key] === "") && delete obj[key]
  );
  return obj;
};

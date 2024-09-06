export function getData(src, options = {}) {
  return fetchExcel(src, options);
}

function fetchExcel(src, options) {
  return fetch(src, options).then((res) => {
    if (res.status !== 200) {
      return Promise.reject(res);
    }
    return res.arrayBuffer();
  });
}

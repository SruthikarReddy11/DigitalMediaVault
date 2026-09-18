const archiverMock = () => ({
  pipe: () => {},
  append: () => {},
  file: () => {},
  directory: () => {},
  finalize: () => Promise.resolve(),
  on: () => {},
});

module.exports = archiverMock;

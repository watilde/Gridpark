module.exports = {
  editor: {
    create: jest.fn(),
    createModel: jest.fn(),
    setModelLanguage: jest.fn(),
    getModels: jest.fn(() => []),
  },
  Uri: { parse: jest.fn(uri => ({ toString: () => uri })) },
  languages: {
    typescript: {
      javascriptDefaults: { setCompilerOptions: jest.fn(), addExtraLib: jest.fn() },
      typescriptDefaults: { setCompilerOptions: jest.fn(), addExtraLib: jest.fn() },
    },
    getLanguages: jest.fn(() => []),
  },
  KeyMod: {},
  KeyCode: {},
};

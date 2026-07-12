export default {
  '*.{js,mjs,cjs,ts,mts,cts}': ['eslint --fix', 'prettier --write'],
  '*.{json,jsonc,md,yaml,yml}': 'prettier --write',
};

# Source CLI Preservation

The top-level source CLI files were hashed before Phase 2 edits and again after all foundation verification. All 14 file sizes and SHA-256 hashes matched exactly.

| File | Bytes | SHA-256 |
|---|---:|---|
| `bin.ts` | 347 | `bc87800b64a2c829be9c53c123c2b8556d927f023a70a7089cc439348c5affeb` |
| `cli.test.ts` | 7582 | `84df3ec0b3985b58cde2b22625cead84d7bacd44a6adf478715c60f25f82e511` |
| `cli.ts` | 23484 | `0b29febcccc6658284d450432f0353df51014c8cd25b718641d8895c9a4b5bac` |
| `features-state.test.ts` | 20064 | `0a42b7988c86b21313ba20223e0ac6c1fd297543707c101dbff891e4cfb1a435` |
| `features-state.ts` | 23891 | `be89866d287bd3a848729470493852b934fa89a18f33474fe6f2dcd8dfa6a565` |
| `issues-state.test.ts` | 11197 | `12a7d4764e1b2f799f205a3e38aca4766f7a2ac5ec3d861887a56f6ad127e6fd` |
| `issues-state.ts` | 34935 | `b9ca63fcf7e6f590d5ec7f4de5d88b2e3d52f92ad500cbea41406fd41656fd83` |
| `milestone-progress.ts` | 2241 | `1c1e8976c861bdf6c26e90fe3aef1e0b9cc0ee7a4b4cc3cccaf67cc7fcfabfb4` |
| `milestone-state.test.ts` | 16508 | `19eddf96250e381bd35fb2ccef77c58d31387d93fcf5e3cfc4ac0ee3c8bbe82f` |
| `milestone-state.ts` | 13040 | `9565531de6dced30efe881c20d416e9d0c7b2fe72f2757f6f44432380420e685` |
| `progress-state.test.ts` | 6757 | `20636a5fdb84e5565edf2752eb8d159f97271ed88553b07682f619de2915933d` |
| `progress-state.ts` | 14307 | `8015e0036ff694c2cae01592b887d34e8858358b4d51c82dce31e77c0233b559` |
| `README.md` | 3355 | `ed45bd27891d74fac7100026e32d9fe700e5001af3a8efdaf7b343392db5fec4` |
| `status-scanner.ts` | 7215 | `680722ae5976f318b237073071610d7fc3fecb2f51fe44dfe541ac5b792bd23d` |

The focused source suite ran before and after Phase 2:

- Test suites: 5 passed of 5.
- Tests: 109 passed of 109.
- Failures: 0.

Phase 3 still records a fresh formal hash inventory immediately before copying because the source CLI is junction-shared and has no intrinsic Git revision.

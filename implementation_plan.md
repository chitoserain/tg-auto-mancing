# Plan to Simplify and Consolidate Artifact Extraction

To avoid writing duplicate scenario blocks and legacy functions for every new artifact, we will centralize the artifacts list in the data layer (`items.js`) and check for any matching artifact dynamically.

## Proposed Changes

### Data and Utility Layer

#### [MODIFY] [items.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/data/items.js)
- Add and export an `ARTIFACTS` array containing regex patterns for all artifacts:
  ```javascript
  const ARTIFACTS = [
      /Trisu?la Poseidon/i,
      /Kotak Coklat/i,
      /Ketupat Raja Namrud/i,
      /Poke Ball/i,
      /Bola FIFA/i
  ];
  ```

#### [MODIFY] [parsing.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/utils/parsing.js)
- Import `ARTIFACTS` from `items.js`.
- Scan inventory lines against `ARTIFACTS` and return `hasArtifacts` as a boolean flag.
- Remove individual `hasTrisula`, `hasKotakCoklat`, etc. flags from the return object.

#### [MODIFY] [actions.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/utils/actions.js)
- Remove individual legacy functions `extractTrisula`, `extractKotakCoklat`, `extractKetupat`, `extractPokeBall`, and `extractBolaFifa`.
- Only export `sendMancing`, `checkInventory`, `processActions`, `sellAll`, and `extractAllArtifacts`.

### Scenarios Layer

#### [MODIFY] [basic.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/scenarios/basic.js)
- Import `extractAllArtifacts` instead of the legacy individual extractors.
- Replace the five separate `if (hasItem)` conditional blocks with a single `if (hasArtifacts)` check calling `extractAllArtifacts`.

#### [MODIFY] [vip.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/scenarios/vip.js)
- Import `extractAllArtifacts` instead of the legacy individual extractors.
- Replace the five separate `if (hasItem)` conditional blocks with a single `if (hasArtifacts)` check calling `extractAllArtifacts`.

#### [MODIFY] [inventory_check.js](file:///d:/Auto%20Mancing/auto-mancing-v2/features/mancing/scenarios/inventory_check.js)
- Import `extractAllArtifacts` instead of the legacy individual extractors.
- Replace the five separate `if (hasItem)` conditional blocks with a single `if (hasArtifacts)` check calling `extractAllArtifacts`.

## Verification Plan

### Automated/Local Tests
- Run `node features/mancing/utils/test_verification_local.js` to ensure the compilation and other functionality are unaffected.

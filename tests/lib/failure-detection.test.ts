import { describe, expect, it } from "vitest";

const shouldFailOnPurpose = process.env.TEST_FAIL_DETECTION === "1";

describe("failure detection", () => {
  const testFn = shouldFailOnPurpose ? it : it.skip;

  testFn("fails intentionally when TEST_FAIL_DETECTION=1", () => {
    expect("ok").toBe("not-ok");
  });
});

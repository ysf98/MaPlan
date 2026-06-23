import { describe, expect, it } from "vitest";
import { getWinningOptionIds } from "@/lib/groupPolls";

describe("group poll ranking", () => {
  it("elige la opción con más votos", () => {
    expect(
      getWinningOptionIds("poll", [
        { id: "a", voteCount: 2 },
        { id: "b", voteCount: 4 }
      ])
    ).toEqual(["b"]);
  });

  it("mantiene empates en encuestas", () => {
    expect(
      getWinningOptionIds("poll", [
        { id: "a", voteCount: 3 },
        { id: "b", voteCount: 3 }
      ])
    ).toEqual(["a", "b"]);
  });

  it("no inventa un ganador sin votos", () => {
    expect(
      getWinningOptionIds("poll", [
        { id: "a", voteCount: 0 },
        { id: "b", voteCount: 0 }
      ])
    ).toEqual([]);
  });
});

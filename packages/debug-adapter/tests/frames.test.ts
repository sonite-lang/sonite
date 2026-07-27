import { describe, expect, it } from "vitest";
import { filterStackFrames, isSoniteInternalFrame } from "../src/locate-lldb.js";

describe("frame filtering", () => {
  it("hides runtime and async body frames by default", () => {
    expect(isSoniteInternalFrame("sn_print_str")).toBe(true);
    expect(isSoniteInternalFrame("fetchUser__async__body")).toBe(true);
    expect(isSoniteInternalFrame("main")).toBe(false);
  });

  it("filters stack frames unless showNativeFrames is set", () => {
    const frames = [
      { name: "main" },
      { name: "sn_throw" },
      { name: "helper" },
    ];
    expect(filterStackFrames(frames, false).map((f) => f.name)).toEqual([
      "main",
      "helper",
    ]);
    expect(filterStackFrames(frames, true)).toHaveLength(3);
  });
});

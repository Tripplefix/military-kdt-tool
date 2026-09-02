import { describe, expect, it } from "vitest";
import {
  blockPatchSchema,
  categoryPatchSchema,
  personnelInputSchema,
  personnelPatchSchema,
  settingsPatchSchema,
  termPatchSchema,
  unitPatchSchema,
} from "@/shared/schemas";

describe("Patch-Schemas setzen keine Defaults ein", () => {
  it("personnelPatchSchema lässt nicht gesendete Felder weg", () => {
    expect(personnelPatchSchema.parse({ phone: "079" })).toEqual({ phone: "079" });
    expect(unitPatchSchema.parse({ label: "X" })).toEqual({ label: "X" });
    expect(categoryPatchSchema.parse({ color: "#AABBCC" })).toEqual({ color: "#AABBCC" });
    expect(termPatchSchema.parse({ de: "Neu" })).toEqual({ de: "Neu" });
    expect(blockPatchSchema.parse({ title: "T" })).toEqual({ title: "T" });
    expect(settingsPatchSchema.parse({ phoneKp: "1" })).toEqual({ phoneKp: "1" });
  });
  it("Input-Schemas füllen Defaults", () => {
    expect(personnelInputSchema.parse({ name: "Muster" })).toMatchObject({ name: "Muster", rank: "", role: "other", unitId: null, phone: "", order: 0 });
  });
  it("Patch-Schemas lehnen unbekannte Felder ab", () => {
    expect(() => personnelPatchSchema.parse({ foo: 1 })).toThrow();
  });
});

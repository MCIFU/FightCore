import type { DemoUniverse } from "../demo/simulate";
import { divisionById } from "../domain/reference";
import type { PortraitInput } from "./face";

const ageOn = (birth: string, on: string) => Math.floor((Date.parse(on) - Date.parse(birth)) / (365.25 * 86400000));

/** Maps a demo fighter to the traits the portrait generator uses. */
export function portraitInputs(u: DemoUniverse, today: string): (PortraitInput & { slug: string })[] {
  return u.fighters.map((f) => {
    const d = divisionById.get(f.divisionId)!;
    const arch = u.archetypes.get(f.id);
    return {
      id: f.id,
      slug: f.slug,
      sex: f.sex,
      country: f.country,
      age: ageOn(f.birthDate, today),
      mass: (d.limitKg - 52) / (120 - 52),
      grappler: arch === "grappler" || arch === "wrestler",
      brawler: arch === "brawler" || arch === "pressure",
    };
  });
}

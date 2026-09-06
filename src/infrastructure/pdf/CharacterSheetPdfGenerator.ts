import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { ICharacterSheetPdfGenerator } from "../../domain/ports/ICharacterSheetPdfGenerator";
import { PersonajeApi } from "../../domain/types/personajes.types";
import { CharacterEquipmentApi } from "../../domain/types/equipment.types";
import {
  escribirCompetencias,
  escribirConjuros,
  escribirEquipo,
  escribirOrganizaciones,
  escribirRasgos,
  escribirTransfondo,
} from "../../utils/escribirPdf";

const SKILL_FIELD_MAP: Record<string, [string, string]> = {
  acrobatics: ["acroPROF", "Acrobatics"],
  athletics: ["athPROF", "Athletics"],
  arcana: ["arcanaPROF", "Arcana"],
  deception: ["decepPROF", "Deception"],
  history: ["histPROF", "History"],
  performance: ["perfPROF", "Performance"],
  intimidation: ["intimPROF", "Intimidation"],
  investigation: ["investPROF", "Investigation"],
  "sleight-of-hand": ["sohPROF", "SleightofHand"],
  medicine: ["medPROF", "Medicine"],
  nature: ["naturePROF", "Nature"],
  perception: ["perPROF", "Perception"],
  insight: ["insightPROF", "Insight"],
  persuasion: ["persPROF", "Persuasion"],
  religion: ["religPROF", "Religion"],
  stealth: ["stealthPROF", "Stealth"],
  survival: ["survPROF", "Survival"],
  "animal-handling": ["anhanPROF", "AnHan"],
};

export default class CharacterSheetPdfGenerator implements ICharacterSheetPdfGenerator {
  async generate(character: PersonajeApi, playerName: string): Promise<Uint8Array> {
    const pdfPath = path.join(process.cwd(), "src/utils/hoja-nueva.pdf");
    const existingPdfBytes = fs.readFileSync(pdfPath);
    const originalPdf = await PDFDocument.load(existingPdfBytes);
    const form = originalPdf.getForm();

    const backgroundTypeName =
      typeof character?.background?.type === "string"
        ? character?.background?.type
        : character?.background?.type?.name;

    const background = character?.background?.type
      ? `${character?.background?.name ?? ""}${backgroundTypeName ? ` (${backgroundTypeName})` : ""}`
      : (character?.background?.name ?? "");

    form.getTextField("CharacterName").setText(character?.name);
    form.getTextField("ClassLevel").setText(
      (character?.classes ?? []).map((cl) => `${cl.name} ${cl.level}`).join(", ")
    );
    form.getDropdown("Background").addOptions([background ?? ""]);
    form.getDropdown("Background").select(background ?? "");
    form.getTextField("PlayerName").setText(playerName);
    form.getDropdown("Race").addOptions([character?.race ?? ""]);
    form.getDropdown("Race").select(character?.race ?? "");
    form.getDropdown("Alignment").addOptions([character?.background?.alignment ?? ""]);
    form.getDropdown("Alignment").select(character?.background?.alignment ?? "");
    form.getTextField("ExperiencePoints").setText(character?.XP + "/" + character?.XPMax);

    form.getTextField("CharacterName 2").setText(character?.name);
    form.getTextField("Age").setText((character?.appearance?.age ?? 0) + " años");
    form.getTextField("Eyes").setText(character?.appearance?.eyes);
    form.getTextField("Height").setText((character?.appearance?.height ?? 0) + " cm");
    form.getTextField("Skin").setText(character?.appearance?.skin);
    form.getTextField("Weight").setText((character?.appearance?.weight ?? 0) + " kg");
    form.getTextField("Hair").setText(character?.appearance?.hair);

    const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;
    const getAttrVal = (key: string) =>
      character?.attributes?.find((a) => a.key === key)?.value ?? 10;
    const getAttrMod = (key: string) =>
      character?.attributes?.find((a) => a.key === key)?.modifier ??
      Math.floor(getAttrVal(key) / 2 - 5);

    const bonus: Record<string, number> = {
      str: getAttrMod("str"),
      dex: getAttrMod("dex"),
      con: getAttrMod("con"),
      int: getAttrMod("int"),
      wis: getAttrMod("wis"),
      cha: getAttrMod("cha"),
    };

    abilities.forEach((ability) => {
      form.getTextField(ability.toUpperCase() + "score").setText(getAttrVal(ability) + "");
      form.getTextField(ability.toUpperCase() + "bonus").setText(this.formatNumber(bonus[ability]) + "");

      if (character?.saving_throws?.includes(ability)) {
        form.getCheckBox(ability.toUpperCase() + "savePROF").check();
        form
          .getTextField(ability.toUpperCase() + "save")
          .setText(this.formatNumber(bonus[ability] + character?.prof_bonus) + "");
      } else {
        form
          .getTextField(ability.toUpperCase() + "save")
          .setText(this.formatNumber(bonus[ability]) + "");
      }
    });

    character?.skills?.forEach((skill) => {
      const fields = SKILL_FIELD_MAP[skill?.key];
      if (!fields) return;

      if (skill?.value) {
        form.getCheckBox(fields[0]).check();
      }
      form.getTextField(fields[1]).setText(this.formatNumber(skill?.modifier) + "");
    });

    if (character?.equipment?.find((equi) => equi.name === "Escudo" && equi.equipped)) {
      form.getCheckBox("shieldyes").check();
    }

    const monkTrait = character?.traits?.find((trait) => trait.id === "martial-arts");
    let unarmedSlot = 0;

    if (monkTrait) {
      const dado = parseInt(monkTrait.summary.join(" ").split("1d")[1][0]);
      const strVal = character?.attributes?.find((a) => a.key === "str")?.value ?? 10;
      const dexVal = character?.attributes?.find((a) => a.key === "dex")?.value ?? 10;
      const max = Math.max(strVal, dexVal);
      const daño = Math.floor(max / 2 - 5);

      form.getTextField("Attack1").setText("Cuerpo a cuerpo");
      form.getTextField("AtkBonus1").setText("+" + ((character?.prof_bonus ?? 0) + daño));
      form.getTextField("Damage1").setText("1d" + dado + " +" + daño);
      unarmedSlot = 1;
    }

    character?.equipment
      ?.filter((equi) => equi?.weapon !== undefined)
      ?.forEach((equi, index: number) => {
        if (index + unarmedSlot < 3) {
          form
            .getTextField("Attack" + (index + unarmedSlot + 1))
            .setText(equi.name + " " + (equi.isMagic ? " +1" : ""));
          form
            .getTextField("AtkBonus" + (index + unarmedSlot + 1))
            .setText("+" + this.sumAttackBonus(character, equi));
          form.getTextField("Damage" + (index + unarmedSlot + 1)).setText(
            equi?.weapon?.damage
              ?.map(
                (damage) =>
                  damage?.dice + " +" + this.sumDamageBonus(character, equi) + " " + damage?.name
              )
              .join(", ")
          );
        }
      });

    const moneyArray = Array.isArray(character?.money) ? character.money : [];
    const getCoinQty = (abbrs: string[], names: string[]) => {
      const found = moneyArray.find(
        (m) =>
          (m?.abbreviation && abbrs.includes(m.abbreviation.toLowerCase())) ||
          (m?.name && names.some((n) => m.name.toLowerCase().includes(n)))
      );
      return found ? (found.quantity ?? 0) : 0;
    };

    form.getTextField("Copper").setText(getCoinQty(["pc", "cp"], ["cobre", "copper"]) + "");
    form.getTextField("Silver").setText(getCoinQty(["pp", "sp"], ["plata", "silver"]) + "");
    form.getTextField("Electrum").setText(getCoinQty(["pe", "ep"], ["electrum"]) + "");
    form.getTextField("Gold").setText(getCoinQty(["po", "gp"], ["oro", "gold"]) + "");
    form.getTextField("Platinum").setText(getCoinQty(["ppt", "pp"], ["platino", "platinum"]) + "");

    form.getTextField("HPMax").setText(character?.HPMax + "");
    form.getTextField("ProfBonus").setText("+" + character?.prof_bonus);
    form.getTextField("AC").setText(character?.CA + "");
    form.getTextField("Init").setText(this.formatNumber(character.initiativeBonus) + "");
    form.getTextField("Speed").setText(character?.speed?.walk + "");

    form
      .getTextField("HitDiceTotal")
      .setText(
        character.classes?.map((clase) => clase.level + "d" + (clase.hit_die ?? "?")).join(" / ") + ""
      );

    const skillPerception = character?.skills?.find((skill) => skill?.key === "perception");
    const passivePerception = skillPerception?.passive;

    if (passivePerception !== undefined) {
      form.getTextField("PWP").setText(String(passivePerception));
    } else if (skillPerception) {
      form.getTextField("PWP").setText(10 + skillPerception.modifier + "");
    } else {
      form.getTextField("PWP").setText(10 + bonus.wis + "");
    }

    await escribirRasgos({
      traits: character?.traits ?? [],
      invocations: character?.invocations ?? [],
      disciplines: [],
      metamagic: [],
      dotes: character?.dotes ?? [],
      pdfDoc: originalPdf,
    });

    await escribirCompetencias({
      pdfDoc: originalPdf,
      languages: character?.languages,
      proficiencies: character?.proficiencies,
    });

    await escribirTransfondo({
      pdfDoc: originalPdf,
      background: character?.background,
    });

    await escribirEquipo({
      pdfDoc: originalPdf,
      equipment: character?.equipment,
      personaje: character,
      form,
    });

    await escribirOrganizaciones({
      pdfDoc: originalPdf,
      personaje: character,
      form,
    });

    await escribirConjuros({
      form,
      personaje: character,
    });

    if (character?.img) {
      const imageResponse = await fetch(character.img);
      if (!imageResponse.ok) {
        throw new Error(`Error descargando la imagen: ${imageResponse.statusText}`);
      }
      const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
      const contentType = String(imageResponse.headers.get("content-type") || "");

      let image;
      if (contentType.includes("png")) {
        image = await originalPdf.embedPng(imageBytes);
      } else if (contentType.includes("jpeg") || contentType.includes("jpg")) {
        image = await originalPdf.embedJpg(imageBytes);
      } else {
        throw new Error(`Formato de imagen no soportado: ${contentType}`);
      }

      const page = originalPdf.getPage(1);
      page.drawImage(image, {
        x: 39,
        y: 490,
        width: 155,
        height: 155,
      });
    }

    form.flatten();

    const nuevoPdf = await PDFDocument.create();
    const [pag1, pag2, pag3] = await nuevoPdf.copyPages(originalPdf, [0, 1, 2]);

    nuevoPdf.addPage(pag1);
    nuevoPdf.addPage(pag2);

    const hasSpellcasting = (character.classes ?? []).some(
      (clase) => clase.class !== "monk" && clase.class !== "barbarian"
    );

    if (hasSpellcasting) {
      nuevoPdf.addPage(pag3);
    }

    return nuevoPdf.save();
  }

  private sumDamageBonus(character: PersonajeApi, equip: CharacterEquipmentApi): number {
    if (equip.damageBonus !== undefined) {
      let suma = equip.damageBonus;

      if (
        equip?.weapon?.range === "Distancia" &&
        character?.traits?.map((trait) => trait.id)?.includes("fighter-fighting-style-archery")
      ) {
        suma += 2;
      }

      return suma;
    }

    let suma = equip?.isMagic ? 1 : 0;
    const getAttrVal = (key: string) =>
      character.attributes?.find((a) => a.key === key)?.value ?? 10;

    if (
      equip?.weapon?.properties.find(
        (prop) => prop.name.toLowerCase() === "finesse" || prop.name.toLowerCase() === "sutileza"
      )
    ) {
      const max = Math.max(getAttrVal("str"), getAttrVal("dex"));
      suma += Math.floor(max / 2 - 5);
    } else if (equip?.weapon?.range === "Distancia") {
      suma += Math.floor(getAttrVal("dex") / 2 - 5);
      if (character?.traits?.map((trait) => trait.id)?.includes("fighter-fighting-style-archery")) {
        suma += 2;
      }
    } else {
      suma += Math.floor(getAttrVal("str") / 2 - 5);
    }

    return suma;
  }

  private sumAttackBonus(character: PersonajeApi, equip: CharacterEquipmentApi): number {
    if (equip.attackBonus !== undefined) {
      return equip.attackBonus;
    }

    let suma = this.sumDamageBonus(character, equip);

    if (
      character?.proficiencies?.some((arma) =>
        equip?.proficiencies?.some((p) => p.id === arma?.id)
      )
    ) {
      suma += character?.prof_bonus ?? 0;
    }

    return suma;
  }

  private formatNumber(num: number): string {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}

const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

import { attributeField, skillField } from "../../fields.mjs";

export default class AttributesSkillsFields {
  static get attributes() {
    return {
      attributes: new SchemaField({
        body: new SchemaField(attributeField("DGNS.Body")),
        agility: new SchemaField(attributeField("DGNS.Agility")),
        charisma: new SchemaField(attributeField("DGNS.Charisma")),
        intellect: new SchemaField(attributeField("DGNS.Intellect")),
        psyche: new SchemaField(attributeField("DGNS.Psyche")),
        instinct: new SchemaField(attributeField("DGNS.Instinct")),
      }),
    };
  }

  static get skills() {
    return {
      skills: new SchemaField({
        athletics: new SchemaField(skillField("body", "DGNS.Athletics")),
        brawl: new SchemaField(skillField("body", "DGNS.Brawl")),
        force: new SchemaField(skillField("body", "DGNS.Force")),
        melee: new SchemaField(skillField("body", "DGNS.Melee")),
        stamina: new SchemaField(skillField("body", "DGNS.Stamina")),
        toughness: new SchemaField(skillField("body", "DGNS.Toughness")),

        crafting: new SchemaField(skillField("agility", "DGNS.Crafting")),
        dexterity: new SchemaField(skillField("agility", "DGNS.Dexterity")),
        navigation: new SchemaField(skillField("agility", "DGNS.Navigation")),
        mobility: new SchemaField(skillField("agility", "DGNS.Mobility")),
        projectiles: new SchemaField(skillField("agility", "DGNS.Projectiles")),
        stealth: new SchemaField(skillField("agility", "DGNS.Stealth")),

        arts: new SchemaField(skillField("charisma", "DGNS.Arts")),
        conduct: new SchemaField(skillField("charisma", "DGNS.Conduct")),
        expression: new SchemaField(skillField("charisma", "DGNS.Expression")),
        leadership: new SchemaField(skillField("charisma", "DGNS.Leadership")),
        negotiation: new SchemaField(
          skillField("charisma", "DGNS.Negotiation")
        ),
        seduction: new SchemaField(skillField("charisma", "DGNS.Seduction")),

        artifact: new SchemaField(skillField("intellect", "DGNS.Artifact")),
        engineering: new SchemaField(
          skillField("intellect", "DGNS.Engineering")
        ),
        focus: new SchemaField(skillField("intellect", "DGNS.Focus")),
        legends: new SchemaField(skillField("intellect", "DGNS.Legends")),
        medicine: new SchemaField(skillField("intellect", "DGNS.Medicine")),
        science: new SchemaField(skillField("intellect", "DGNS.Science")),

        cunning: new SchemaField(skillField("psyche", "DGNS.Cunning")),
        deception: new SchemaField(skillField("psyche", "DGNS.Deception")),
        domination: new SchemaField(skillField("psyche", "DGNS.Domination")),
        faith: new SchemaField(skillField("psyche", "DGNS.Faith")),
        reaction: new SchemaField(skillField("psyche", "DGNS.Reaction")),
        willpower: new SchemaField(skillField("psyche", "DGNS.Willpower")),

        empathy: new SchemaField(skillField("instinct", "DGNS.Empathy")),
        orienteering: new SchemaField(
          skillField("instinct", "DGNS.Orienteering")
        ),
        perception: new SchemaField(skillField("instinct", "DGNS.Perception")),
        primal: new SchemaField(skillField("instinct", "DGNS.Primal")),
        survival: new SchemaField(skillField("instinct", "DGNS.Survival")),
        taming: new SchemaField(skillField("instinct", "DGNS.Taming")),
      }),
    };
  }
}

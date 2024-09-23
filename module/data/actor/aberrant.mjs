import { armorField } from "../fields.mjs";
import AttributesSkillsFields from "./partials/attributes.skills.mjs";
import ConditionFields from "./partials/condition.mjs";
import DetailsFields from "./partials/details.mjs";
import GeneralFields from "./partials/general.mjs";

const { SchemaField, StringField, HTMLField, NumberField } =
  foundry.data.fields;

export default class AberrantData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static _systemType = "aberrant";

  static defineSchema() {
    return {
      ...AttributesSkillsFields.attributes,
      ...AttributesSkillsFields.skills,
      ...GeneralFields.general,
      ...GeneralFields.state,
      ...GeneralFields.fighting,
      ...ConditionFields.condition,
      ...DetailsFields.details,
      ...DetailsFields.backrounds,
      ...DetailsFields.biography,
      armor: new SchemaField(armorField()),
      variant: new StringField({}),
      tactics: new HTMLField({}),
      rapture: new StringField({}),
      skinbags: new NumberField({ integer: true, min: 0, initial: 0 }),
      phase: new StringField({ initial: "primal" }),
    };
  }

  prepareBaseData() {}
}

import ConditionFields from "./partials/condition.mjs";
import GeneralFields from "./partials/general.mjs";
import { armorField } from "../fields.mjs";

const { SchemaField, StringField, HTMLField, NumberField } =
  foundry.data.fields;

export default class FromHellData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static _systemType = "fromHell";

  static defineSchema() {
    return {
      ...GeneralFields.general,
      ...GeneralFields.state,
      ...GeneralFields.fighting,
      ...ConditionFields.condition,
      armor: new SchemaField(armorField()),
      tactics: new HTMLField({}),
      about: new HTMLField({}),
    };
  }

  prepareBaseData() {}
}

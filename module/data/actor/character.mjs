/* Data fields definitions imports */
import AttributesSkillsFields from "./partials/attributes.skills.mjs";
import ConditionFields from "./partials/condition.mjs";
import GeneralFields from "./partials/general.mjs";
import DetailsFields from "./partials/details.mjs";

const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

export default class CharacterData extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static _systemType = "character";

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
    };
  }

  /** @inheritdoc */
  prepareBaseData() {}
}

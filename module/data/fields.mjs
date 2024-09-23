const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

/**
 * Function that generate structure for attribute
 * @param {*} label Label for a attribute
 * @returns
 */
function attributeField(label) {
  return {
    value: new NumberField({
      nullable: false,
      integer: true,
      initial: 1,
      min: 1,
      label: label,
    }),
  };
}

/**
 *  Function that generate structure for skill
 * @param {*} attribute String of attribute connected to skill
 * @param {*} label Label for a skill
 * @returns
 */
function skillField(attribute, label) {
  return {
    attribute: new StringField({ initial: attribute }),
    value: new NumberField({
      nullable: false,
      integer: true,
      initial: 0,
      min: 0,
      label: label,
    }),
  };
}

function armorField() {
  return {
    name: new StringField({}),
    rating: new NumberField({ integer: true, min: 0, initial: 0 }),
  };
}

export { attributeField, skillField, armorField };

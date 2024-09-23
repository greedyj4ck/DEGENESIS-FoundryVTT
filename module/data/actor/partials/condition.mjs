const {
  SchemaField,
  NumberField,
  StringField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

export default class ConditionFields {
  static get condition() {
    return {
      condition: new SchemaField({
        ego: new SchemaField({
          value: new NumberField({ integer: true, initial: 0 }),
          max: new NumberField({ integer: true, initial: 0 }),
          override: new NumberField({ integer: true, initial: 0 }),
        }),
        spore: new SchemaField({
          value: new NumberField({ integer: true, initial: 0 }),
          max: new NumberField({ integer: true, initial: 0 }),
          permanent: new NumberField({ integer: true, initial: 0 }),
          override: new NumberField({ integer: true, initial: 0 }),
        }),
        fleshwounds: new SchemaField({
          value: new NumberField({ integer: true, initial: 0 }),
          max: new NumberField({ integer: true, initial: 0 }),
          override: new NumberField({ integer: true, initial: 0 }),
        }),
        trauma: new SchemaField({
          value: new NumberField({ integer: true, initial: 0 }),
          max: new NumberField({ integer: true, initial: 0 }),
          override: new NumberField({ integer: true, initial: 0 }),
        }),
      }),
    };
  }
}

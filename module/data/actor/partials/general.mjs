const {
  SchemaField,
  NumberField,
  StringField,
  HTMLField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

export default class GeneralFields {
  static get general() {
    return {
      general: new SchemaField({
        movement: new NumberField({ initial: 0, integer: true }),
        encumbrance: new SchemaField({
          max: new NumberField({ initial: 0, integer: true }),
          current: new NumberField({ initial: 0, integer: true }),
          override: new NumberField({ initial: 0, integer: true }),
        }),
        armor: new NumberField({ initial: 0, integer: true }),
        actionModifier: new NumberField({ initial: 0, integer: true }),
      }),
    };
  }

  static get fighting() {
    return {
      fighting: new SchemaField({
        initiative: new NumberField({ initial: 0, integer: true }),
        dodge: new NumberField({ initial: 0, integer: true }),
        mentalDefense: new NumberField({ initial: 0, integer: true }),
        passiveDefense: new NumberField({ initial: 0, integer: true }),
      }),
    };
  }

  static get state() {
    return {
      state: new SchemaField({
        motion: new BooleanField({ initial: false }),
        active: new BooleanField({ initial: false }),
        cover: new NumberField({ initial: 0, min: 0, integer: true }),
        initiative: new SchemaField({
          value: new NumberField({ initial: 0, min: 0, integer: true }),
          actions: new NumberField({ initial: 1, min: 1, integer: true }),
        }),
        spentEgo: new SchemaField({
          value: new NumberField({ initial: 0, min: 0, max: 3, integer: true }),
          actionBonus: new NumberField({
            initial: 0,
            min: 0,
            max: 3,
            integer: true,
          }),
        }),
        spentSpore: new SchemaField({
          value: new NumberField({ initial: 0, min: 0, max: 3, integer: true }),
          actionBonus: new NumberField({
            initial: 0,
            min: 0,
            max: 3,
            integer: true,
          }),
        }),
      }),
    };
  }
}

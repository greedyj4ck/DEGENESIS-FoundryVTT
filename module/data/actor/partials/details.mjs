const {
  SchemaField,
  NumberField,
  StringField,
  HTMLField,
  BooleanField,
  ArrayField,
  IntegerSortField,
} = foundry.data.fields;

/**
 *
 *
 *
 *
 */

export default class DetailsFields {
  static get details() {
    return {
      details: new SchemaField({
        age: new StringField({ label: "DGNS.Age" }),
        sex: new StringField({ label: "DGNS.Sex" }),
        height: new StringField({ label: "DGNS.Age" }),
        weight: new StringField({ label: "DGNS.Age" }),
        experience: new StringField({ label: "DGNS.Experience" }),
      }),
    };
  }

  static get backrounds() {
    return {
      backgrounds: new SchemaField({
        allies: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Allies",
        }),
        authority: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Authority",
        }),
        network: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Network",
        }),
        renown: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Renown",
        }),
        resources: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Resources",
        }),
        secrets: new NumberField({
          integer: true,
          nullable: false,
          initial: 0,
          min: 0,
          max: 6,
          label: "DGNS.Secrets",
        }),
      }),
    };
  }

  static get biography() {
    return {
      biography: new HTMLField({ label: "DGNS.Biography" }),
      gmnotes: new HTMLField({ label: "DGNS.Gmnotes" }),
    };
  }
}

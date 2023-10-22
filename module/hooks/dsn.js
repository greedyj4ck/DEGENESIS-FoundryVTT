export default function () {
  Hooks.once("diceSoNiceReady", (dice3d) => {
    dice3d.addSystem(
      { id: "degenesis", name: "DEGENESIS: Rebirth Black 3D" },
      "exclusive",
      "preferred"
    );

    dice3d.addSystem(
      { id: "degenesis-white", name: "DEGENESIS: Rebirth White 3D" },
      "exclusive"
    );
    dice3d.addSystem(
      { id: "degenesis-pureBlood", name: "DEGENESIS: Rebirth Pure Blood 3D" },
      "exclusive"
    );
    dice3d.addSystem(
      {
        id: "degenesis-taintedBlood",
        name: "DEGENESIS: Rebirth Tainted Blood 3D",
      },
      "exclusive"
    );
    dice3d.addSystem(
      { id: "degenesis2d", name: "DEGENESIS: Rebirth (Textured)" },
      "exclusive"
    );

    dice3d.addDicePreset({
      type: "d6",
      labels: [
        "systems/degenesis/icons/dice-faces/d1.png",
        "systems/degenesis/icons/dice-faces/d2.png",
        "systems/degenesis/icons/dice-faces/d3.png",
        "systems/degenesis/icons/dice-faces/d4.png",
        "systems/degenesis/icons/dice-faces/d5.png",
        "systems/degenesis/icons/dice-faces/d6.png",
      ],
      bumpMaps: [
        "systems/degenesis/icons/dice-faces/d1_bump.png",
        "systems/degenesis/icons/dice-faces/d2_bump.png",
        "systems/degenesis/icons/dice-faces/d3_bump.png",
        "systems/degenesis/icons/dice-faces/d4_bump.png",
        "systems/degenesis/icons/dice-faces/d5_bump.png",
        "systems/degenesis/icons/dice-faces/d6_bump.png",
      ],
      system: "degenesis2d",
    });

    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_black.gltf",
      system: "degenesis",
    });

    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_white.gltf",
      system: "degenesis-white",
    });

    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile: "systems/degenesis/icons/dice-faces/degenesix_pureBlood.gltf",
      system: "degenesis-pureBlood",
    });

    dice3d.addDicePreset({
      type: "d6",
      labels: "",
      modelFile:
        "systems/degenesis/icons/dice-faces/degenesix_taintedBlood.gltf",
      system: "degenesis-taintedBlood",
    });
  });
}

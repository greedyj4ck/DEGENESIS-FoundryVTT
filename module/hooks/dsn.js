export default function () {

    Hooks.once('diceSoNiceReady', (dice3d) => {
        dice3d.addSystem({ id: "degenesis", name: "DEGENESIS: Rebirth" }, "exclusive");
        dice3d.addDicePreset({
          type: "d6",
          labels: [
            'systems/degenesis/icons/dice-faces/d1.png',
            'systems/degenesis/icons/dice-faces/d2.png',
            'systems/degenesis/icons/dice-faces/d3.png',
            'systems/degenesis/icons/dice-faces/d4.png',
            'systems/degenesis/icons/dice-faces/d5.png',
            'systems/degenesis/icons/dice-faces/d6.png'
          ],
          bumpMaps: [
            'systems/degenesis/icons/dice-faces/d1_bump.png',
            'systems/degenesis/icons/dice-faces/d2_bump.png',
            'systems/degenesis/icons/dice-faces/d3_bump.png',
            'systems/degenesis/icons/dice-faces/d4_bump.png',
            'systems/degenesis/icons/dice-faces/d5_bump.png',
            'systems/degenesis/icons/dice-faces/d6_bump.png'
          ],
          system: "degenesis"
        });
    
        dice3d.addSystem(
          { id: "degenesis3d-black", name: "DEGENESIS: Rebirth Black 3D" },
          "exclusive"
        );
        dice3d.addSystem(
          { id: "degenesis3d-white", name: "DEGENESIS: Rebirth White 3D" },
          "exclusive"
        );
        dice3d.addSystem(
          { id: "degenesis3d-pureBlood", name: "DEGENESIS: Rebirth Pure Blood 3D" },
          "exclusive"
        );
        dice3d.addSystem(
          {
            id: "degenesis3d-taintedBlood",
            name: "DEGENESIS: Rebirth Tainted Blood 3D",
          },
          "exclusive"
        );
      
        dice3d.addDicePreset({
          type: "d6",
          labels: "",
          modelFile: "systems/degenesis/icons/dice-faces/degenesix_black.gltf",
          system: "degenesis3d-black",
        });
      
        dice3d.addDicePreset({
          type: "d6",
          labels: "",
          modelFile: "systems/degenesis/icons/dice-faces/degenesix_white.gltf",
          system: "degenesis3d-white",
        });
      
        dice3d.addDicePreset({
          type: "d6",
          labels: "",
          modelFile: "systems/degenesis/icons/dice-faces/degenesix_pureBlood.gltf",
          system: "degenesis3d-pureBlood",
        });
      
        dice3d.addDicePreset({
          type: "d6",
          labels: "",
          modelFile: "systems/degenesis/icons/dice-faces/degenesix_taintedBlood.gltf",
          system: "degenesis3d-taintedBlood",
        });
        
    
      });
}
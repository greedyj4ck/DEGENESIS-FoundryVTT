// HOOKS FOR CONTEXT MENUS

// ACTOR CONTEXT MENU
export default function() {
Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
    
    // DEPRECATRED - REMOVE WITH NEXT RELEASE 

    /* options.push( 
    {
      name : "Import KatharSys Character",
      condition: true,
      icon: '<i class="fas fa-plus"></i>',
      callback: target => {
        DegenesisImporter.KatharSysCharacterImportDialog(target.attr('data-entity-id'))
      }
      
    }) */
  })
}
export default function() {
Hooks.on("getActorDirectoryEntryContext", async (html, options) => {
    options.push( 
    {
      name : "Import KatharSys Character",
      condition: true,
      icon: '<i class="fas fa-plus"></i>',
      callback: target => {
        DegenesisImporter.KatharSysCharacterImportDialog(target.attr('data-entity-id'))
      }
      
    })
  })
}
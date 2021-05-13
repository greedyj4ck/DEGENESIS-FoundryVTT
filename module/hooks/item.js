export default function () {

    // If a container is deleted, reset location of all items within it.
    Hooks.on("deleteItem", (item) => {
        if (item.isOwned && item.type == "transportation")
        {
            let items = actor.items.filter(i => i.location  == itemid).map(i => {
                return {_id : i.id, "data.location" : ""}
            });
            item.actor.updateEmbeddedDocuments("Item", items);
        }
    })
}
export default function () {

    // If a container is deleted, reset location of all items within it.
    Hooks.on("deleteOwnedItem", (actor, item) => {
        if (item.type == "transportation")
        {
            let items = foundry.utils.deepClone(actor.data.items.filter(i => i.data.location  == itemid));
            items.forEach(i => i.data.location = "");
            console.log(items);
            actor.updateEmbeddedEntity("OwnedItem", items);
        }
    })
}
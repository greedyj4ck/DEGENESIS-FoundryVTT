export default function () {

    // If a container is deleted, reset location of all items within it.
    Hooks.on("deleteOwnedItem", (actor, item) => {
        if (item.type == "transportation")
        {
            let items = duplicate(actor.data.items.filter(i => i.data.location  == item._id));
            items.forEach(i => i.data.location = "");
            console.log(items);
            actor.updateEmbeddedEntity("OwnedItem", items);
        }
    })
}
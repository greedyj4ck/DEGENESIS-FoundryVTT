export default function () {

    //Hooks.on("chatMessage", (html, content, msg) => {
    //   let command = content.split(" ");
    //   if (command[0].includes("/name"))
    //   {
    //         let response = fetch("http://localhost:3000/name", {
    //             method: "POST"
    //         }).then(r => r.text())
    //         .then(text => {
    //             let name = `${text} 
    //             <span class="cluster-credits">Powered by <a href="https://degenesis-cluster.com">Degenesis Cluster</a></span>` 
    //             // send request
    //             ChatMessage.create({content : name})
    //       }).catch(error => {
    //         console.error(error)
    //         ui.notifications.error(error)
    //       })
    //       return false

    //   }
    // })


    // Activate chat listeners defined in dice-wfrp4e.js
    Hooks.on('renderChatLog', (log, html, data) => {

        html.find(".chat-control-icon").click(ev => {
            let cl = new game.degenesis.apps.ClusterInterface();
            cl.render(true);
        })

        html.find(".chat-control-icon").mouseover(ev => {
            $(ev.currentTarget).attr("title", "Access The Cluster")
        })

    });

}

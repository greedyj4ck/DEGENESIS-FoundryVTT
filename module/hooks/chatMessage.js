Hooks.on("chatMessage", (html, content, msg) => {
    command = content.split(" ");
    if (command[0].includes("/name"))
    {
        fetch("https://www.degenesis-cluster.com/name_generator/generate", {
        method : "POST",
        mode: "cors",
        "Content-Type": 'application/x-www-form-urlencoded',
        data: "?cult=1&gender=1"
        }).then(response => response.text())
          .then(text => {
              let name = `${text} 
              <span class="cluster-credits">Powered by <a href="https://degenesis-cluster.com">Degenesis Cluster</a></span>` 
              // send request
              ChatMessage.create({content : name})
        })

    }
})
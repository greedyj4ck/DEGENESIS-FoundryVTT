

import { DEGENESIS } from "../config.js"
import { CLUSTER } from "../config.js"

export class ClusterInterface extends Application {
    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "the-cluster",
        classes: ["degenesis", "cluster-interface"],
        title: "The Cluster",
        template: "systems/degenesis/templates/apps/cluster.html",
        width: 1000,
        height: 800,
        resizable: true,
        });
    }


    getData()
    {
        let data = super.getData();
        data.genders = CLUSTER.genders;
        data.cults = DEGENESIS.cults;
        data.randomizerOptions = CLUSTER.randomizerOptions;
        return data
    }
}
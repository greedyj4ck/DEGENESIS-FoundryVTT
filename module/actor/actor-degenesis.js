/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class DegenesisActor extends Actor {
  
    prepareData() 
    {
        try
        {
            super.prepareData();
            const data = this.data;

            if (data.data.skills.focus.value)
                data.data.status.ego.max = (data.data.skills.focus.value + data.data.attributes[data.data.skills.focus.attribute].value) * 2
            else if (data.data.skills.primal.value)
                data.data.status.ego.max = (data.data.skills.primal.value + data.data.attributes[data.data.skills.primal.attribute].value) * 2

            if (data.data.skills.willpower.value)
                data.data.status.spore.max = (data.data.skills.willpower.value + data.data.attributes[data.data.skills.willpower.attribute].value) * 2
            else if (data.data.skills.faith.value)
                data.data.status.spore.max = (data.data.skills.faith.value + data.data.attributes[data.data.skills.faith.attribute].value) * 2
    
            data.data.status.fleshwounds.max = (data.data.attributes.body.value + data.data.skills.toughness.value) * 2 
            
            // data.data.status.ego.max = 10;
            // data.data.status.fleshwounds.max = 10;
            // data.data.status.spore.max =10;
            // data.data.status.ego.max = 10;
            
        }
        catch(e)
        {
            console.log(e);
        }
    }
}

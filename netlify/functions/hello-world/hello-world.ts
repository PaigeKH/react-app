import { Handler } from '@netlify/functions'
import axios from 'axios';
import stats from '../stats.json'
import { createClient } from '@supabase/supabase-js'

export const handler: Handler = async (event, context) => {

  const sessionID = event.queryStringParameters?.nickname;
  const userID = event.queryStringParameters?.userID;

  const url = !!event.queryStringParameters?.cursor ? 'https://dragcave.net/api/v2/user?username=' + event.queryStringParameters?.name + '&filter=ADULTS_AND_FROZEN&after=' + event.queryStringParameters?.cursor: 
  'https://dragcave.net/api/v2/user?username=' + event.queryStringParameters?.name + '&filter=ADULTS_AND_FROZEN&limit=100000';


  // Create a single supabase client for interacting with your database
  const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_SECRET ?? '');
  let { data: access_tokens, error } = await supabase
  .from('access_tokens')
  .select('*')
  .eq('user_id', userID)

  if ("" + access_tokens?.[0].session_id !== sessionID || "" + access_tokens?.[0]?.user_id !== userID) {
    return {
      statusCode: 400,
      body: 'Invalid user',
    }
  }

  
  const config = {
    method: 'get',
    url: url,
    headers: {
      Authorization: 'Bearer ' + access_tokens?.[0]?.access_token,
    },
  };

  return axios(config).then(async response => {
    let { data: dragons, error } = await supabase
    .from('dragons')
    .select('*')
    .eq('owner_id', userID)

    dragons?.forEach((dragon) => {
      if (dragon.breed && response.data.dragons[dragon.id]) {

        //convert dragon code to hash
        let hash = 0;
        for (let i = 0, len = dragon.id.length; i < len; i++) {
            let chr = dragon.id.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0; // Convert to 32bit integer
        }
  
        //use hash as a seed
        function random() {
          var x = Math.sin(hash++) * 10000;
          return x - Math.floor(x);
        }
  
        //generate dragon values from code
        function getStatModifier(stat) {
          return Math.floor(stat * (random() * .2 - .1));
        }
  

        const dragonResponse = response.data.dragons[dragon.id];
        Object.assign(dragonResponse, stats[dragon.breed]);
        dragonResponse.breed = dragon.breed;
        dragonResponse.hp += getStatModifier(dragonResponse.hp); 
        dragonResponse.mp += getStatModifier(dragonResponse.mp); 
        dragonResponse.stamina += getStatModifier(dragonResponse.stamina); 
        dragonResponse.intellect += getStatModifier(dragonResponse.intellect); 
        dragonResponse.wisdom += getStatModifier(dragonResponse.wisdom); 
        dragonResponse.spirit += getStatModifier(dragonResponse.spirit); 
        dragonResponse.agility += getStatModifier(dragonResponse.agility); 
        dragonResponse.speed += getStatModifier(dragonResponse.speed); 
        dragonResponse.strength += getStatModifier(dragonResponse.strength); 
        dragonResponse.defense += getStatModifier(dragonResponse.defense); 
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
    }

  }).catch(error => {
    return {
      statusCode: 422,
      body: JSON.stringify(error),
    }
});
}

import { Handler } from '@netlify/functions'
import axios from 'axios';

export const handler: Handler = async (event, context) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);

  const sessionID = event.queryStringParameters?.sessionID;
  const userID = event.queryStringParameters?.userID;

  let { data: access_tokens, access_error } = await supabase
  .from('access_tokens')
  .select('*')
  .eq('user_id', userID)

  if ("" + access_tokens?.[0].session_id !== sessionID || "" + access_tokens?.[0]?.user_id !== userID || access_error) {
    return {
      statusCode: 400,
      body: 'Invalid user',
    }
  } 

  let { data: dragons, dragon_error } = await supabase
  .from('dragons')
  .select('*')
  .eq('owner_id', userID)
  .neq('breed', null)

  let { data: active_dragon, active_dragon_error } = await supabase
  .from('users')
  .select('active_dragon')
  .eq('user_id', userID)

  let query = '';
  dragons.forEach(dragon => {
      query += dragon.id + ','
  });

  const config = {
    method: 'get',
    url: 'https://dragcave.net/api/v2/dragons?ids=' + query,
    headers: {
      Authorization: 'Bearer ' + access_tokens?.[0]?.access_token,
    },
  };

  return axios(config).then(async response => {
    dragons.forEach(dragon => {
      Object.assign(dragon, response.data.dragons[dragon.id]);
  });

  let newHead = null;
  const dragonFiltered = dragons.filter((dragon) => {
    if (dragon.id === active_dragon[0].active_dragon) {
      newHead = dragon;
    }
    return dragon.id !== active_dragon[0].active_dragon;
  })

  dragonFiltered.unshift(newHead);

    return {
      statusCode: 200,
      body: JSON.stringify({
        dragonFiltered,
      }),
    }
  })
}

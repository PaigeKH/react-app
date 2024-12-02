import { Handler } from '@netlify/functions'
import axios from 'axios';

export const handler: Handler = async (event, context) => {

  const sessionID = event.queryStringParameters?.sessionID;
  const userID = event.queryStringParameters?.userID;
  const dragonID = event.queryStringParameters?.dragonID;
  const cursor = event.queryStringParameters?.cursor;
  const username = event.queryStringParameters?.username;
  const dragonName = event.queryStringParameters?.dragonName;

  const url = cursor !== '' ? 'https://dragcave.net/api/v2/user?username=' + username + '&filter=ADULTS_AND_FROZEN&after=' + cursor : 'https://dragcave.net/api/v2/user?username=' + username + '&filter=ADULTS_AND_FROZEN&limit=100000';

  if (!dragonID || !userID || !sessionID || !username) {
    console.warn('Missing data');
    return {
      statusCode: 400,
      body: 'Missing data' + JSON.stringify(event.queryStringParameters),
    }
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);

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

  const config = {
    method: 'get',
    url: url,
    headers: {
      Authorization: 'Bearer ' + access_tokens?.[0]?.access_token,
    },
  };

  return axios(config).then(async response => {
    if (response.data.dragons[dragonID] || response.data.dragons['\'' + dragonID + '\'']) {
      const { data, dragon_error } = await supabase
      .from('dragons')
      .upsert({ id: dragonID, owner: username, owner_id: userID })
      .select()

      if (data) {
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: data,
            name: dragonName,
            id: dragonID,
          }),
        }
      } else {
        console.warn('Dragon error')
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: dragon_error,
          }),
        }
      }


    } else {
      console.warn('missing dragon')
      return {
        statusCode: 400,
        body: 'Missing dragon',
      }
    }
  })
}

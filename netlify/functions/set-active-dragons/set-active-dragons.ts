import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);

  const sessionID = event.queryStringParameters?.sessionID;
  const userID = event.queryStringParameters?.userID;
  const dragon = event.queryStringParameters?.dragon;

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

  const { data, error } = await supabase
  .from('users')
  .update({ active_dragon: dragon })
  .eq('user_id', userID)
  .select()

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify(error),
    }
  } 
      
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  }
}

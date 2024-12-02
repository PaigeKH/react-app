import { Handler } from '@netlify/functions'
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);

export const handler: Handler = async (event, context) => {

  let { data: users, error } = await supabase
  .from('users')
  .select('*')
  .neq('active_dragon', null)

  if (users && !error) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
      }),
    } 
  }

  return {
    statusCode: 400,
    body: JSON.stringify({
      error,
    }),
  }
}

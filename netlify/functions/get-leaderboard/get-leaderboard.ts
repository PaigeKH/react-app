import { Handler } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);


  let { data: dragons, dragons_error } = await supabase
  .from('dragons')
  .select('id,owner,wins,losses')

  let { data: users, users_error } = await supabase
  .from('users')
  .select('username,wins,losses')

  if (!users || !dragons || users_error || dragons_error) {
    return {
      statusCode: 400,
      body: 'Error fetching data',
    }
  } 

  dragons.sort((a, b) => b.wins - a.wins)
  const topFiveDragons = dragons.slice(0, 5);
  topFiveDragons.forEach((dragon) => {
    if (!dragon.wins && !dragon.losses) {
      dragon.winrate = '0%';
    } else {
      dragon.winrate = Math.floor((dragon.wins / (dragon.wins + dragon.losses)) * 100) + '%';
    }
  })

  users.sort((a, b) => b.wins - a.wins)
  const topFiveUsers = users.slice(0, 5);
  topFiveUsers.forEach((user) => {
    if (!user.wins && !user.losses) {
      user.winrate = '0%';
    } else {
      user.winrate = Math.floor((user.wins / (user.wins + user.losses)) * 100) + '%';
    }
  })

  return {
    statusCode: 200,
    body: JSON.stringify({
      users: topFiveUsers,
      dragons: topFiveDragons,
    }),
  }
}

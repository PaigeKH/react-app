/* eslint-disable no-fallthrough */
import { Handler } from '@netlify/functions';
import stats from '../stats.json';
import attacks from './attacks.json';
import axios from 'axios';

interface Turn {
  attacker?: string,
  defender?: string,
  attackName?: string,
  attackerDelta?: StatDelta,
  defenderDelta?: StatDelta,
  dragon1EnergyLeft?: EnergyLeft,
  dragon2EnergyLeft?: EnergyLeft,
  isCrit?: boolean,
  isTypeModifier?: boolean,
  isBodyModifier?: boolean,
}

interface EnergyLeft {
  hpLeft?: number,
  staminaLeft?: number,
  manaLeft?: number,
}

interface StatDelta {
  healthDelta?: number,
  staminaDelta?: number,
  manaDelta?: number,
  intellectDelta?: number,
  wisdomDelta?: number,
  spiritDelta?: number,
  agilityDelta?: number,
  speedDelta?: number,
  strengthDelta?: number,
  defenseDelta?: number,
}

export const handler: Handler = async (event, context) => {
  async function updateWinLoss(d1: any, d2: any) {

    let winner = d1;
    let loser = d2;
  
    if (d1.hp <= 0 && d2.hp <= 0) {
      winner = d2;
      loser = d1;
    } else if (d2.hp <= 0) {
      winner = d1;
    } else {
      winner = d2;
    }
  
    const { data_winner, error_winner } = await supabase
    .from('dragons')
    .update({ wins: winner.wins + 1})
     .eq('id', winner?.id)
    .select()

    const { wadas, sfasf } = await supabase
    .from('dragons')
    .update({ losses: loser.losses + 1 })
    .eq('id', loser.id)
    .select()
  }

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET);

  const sessionId = event?.queryStringParameters?.sessionId;
  const userId = event?.queryStringParameters?.userId;
  const opponentName = event?.queryStringParameters?.opponentName;

  let { data: access_tokens, error } = await supabase
  .from('access_tokens')
  .select('*')
  .eq('user_id', userId)

  if ("" + access_tokens?.[0]?.session_id !== sessionId || "" + access_tokens?.[0]?.user_id !== userId || error) {
    return {
      statusCode: 400,
      body: 'Invalid user',
    }
  }

  let { data: curr_user_dragon_id, curr_user_id_error } = await supabase
  .from('users')
  .select('active_dragon')
  .eq('user_id', userId)

  let { data: opp_user_dragon_id, opp_user_id_error } = await supabase
  .from('users')
  .select('active_dragon')
  .eq('username', opponentName)

  const id1 = curr_user_dragon_id[0].active_dragon;
  const id2 = opp_user_dragon_id[0].active_dragon;

  if (!id1 || !id2 || curr_user_id_error || opp_user_id_error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Missing dragon data.',
      }),
    }
  }

  const config = {
    method: 'get',
    url: 'https://dragcave.net/api/v2/dragons?ids=' + id1 + ',' + id2,
    headers: {
      Authorization: 'Bearer ' + process.env.DC_SECRET,
    },
  };

  let { data: curr_dragon, curr_user_error } = await supabase
  .from('dragons')
  .select('*')
  .eq('id', id1)

  let { data: opp_dragon, opp_user_error } = await supabase
  .from('dragons')
  .select('*')
  .eq('id', id2)

  if (!opp_dragon || !curr_dragon || curr_user_error || opp_user_error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Missing dragon breed.',
      }),
    }
  }

  const dragon1Breed = curr_dragon[0].breed;
  const dragon2Breed = opp_dragon[0].breed;

  return axios(config).then(async response => {
    const dragon1 = response.data.dragons[id1];
    dragon1.breed = dragon1Breed;
    dragon1.stats = stats[dragon1.breed];
    dragon1.maxHP = dragon1.stats.hp * 15;
    dragon1.hp = dragon1.stats.hp * 15;
    dragon1.maxMP = dragon1.stats.mp * 10;
    dragon1.mp = dragon1.stats.mp * 10;
    dragon1.maxStamina = dragon1.stats.stamina * 10;
    dragon1.stamina = dragon1.stats.stamina * 10;
    dragon1.agility = dragon1.stats.agility;
    dragon1.speed = dragon1.stats.speed;
    dragon1.spirit = dragon1.stats.spirit;
    dragon1.wins = curr_dragon[0].wins;
    dragon1.losses = curr_dragon[0].losses;


    const dragon2 = response.data.dragons[id2];
    dragon2.breed = dragon2Breed;
    dragon2.stats = stats[dragon2.breed];
    dragon2.maxHP = dragon2.stats.hp * 15;
    dragon2.hp = dragon2.stats.hp * 15;
    dragon2.maxMP = dragon2.stats.mp * 10;
    dragon2.mp = dragon2.stats.mp * 10;
    dragon2.maxStamina = dragon2.stats.stamina * 10;
    dragon2.stamina = dragon2.stats.stamina * 10;
    dragon2.agility = dragon2.stats.agility;
    dragon2.speed = dragon2.stats.speed;
    dragon2.spirit = dragon2.stats.spirit;
    dragon2.wins = opp_dragon[0].wins;
    dragon2.losses = opp_dragon[0].losses;

  
    let battleLog: string[] = [];
    const battle: Turn[] = [];

    battle.push({
      dragon1EnergyLeft: {
        hpLeft: dragon1.maxHP,
        manaLeft: dragon1.maxMP,
        staminaLeft: dragon1.maxStamina
      },
      dragon2EnergyLeft: {
        hpLeft: dragon2.maxHP,
        manaLeft: dragon2.maxMP,
        staminaLeft: dragon2.maxStamina
      }
    })
  
    while (dragon1.hp > 0 && dragon2.hp > 0) {
      const turn1: Turn = {};
      turn1.attackerDelta = {};
      turn1.defenderDelta = {};
      turn1.dragon1EnergyLeft = {};
      turn1.dragon2EnergyLeft = {};

      // determine order
      const order = determineOrder(dragon1, dragon2);
      turn1.attacker = order[0];
      turn1.defender = order[1];

      // choose attack
      const attack1 = chooseAttack(order[0], battleLog);
      turn1.attackName = attack1.name;
      battleLog.push("" + order[0].name + " uses " + attack1.name + "!");

      // damage calc
      if (attack1.damage) {
        const damage1 = damageCalc(order[0], order[1], attack1, battleLog, turn1);
        order[1].hp = Math.max(order[1].hp - damage1, 0);
        order[0].hp = Math.max(order[0].hp + (turn1.attackerDelta.healthDelta ?? 0), 0);
      }
      statusCalc(order[0], order[1], attack1, battleLog, turn1);
      order[0].stamina -= attack1.stamina;
      order[0].mp -= attack1.mp;

      turn1.dragon1EnergyLeft.hpLeft = dragon1.hp;
      turn1.dragon1EnergyLeft.manaLeft = dragon1.mp;
      turn1.dragon1EnergyLeft.staminaLeft = dragon1.stamina;
      turn1.dragon2EnergyLeft.hpLeft = dragon2.hp;
      turn1.dragon2EnergyLeft.manaLeft = dragon2.mp;
      turn1.dragon2EnergyLeft.staminaLeft = dragon2.stamina;

      battle.push(turn1);

      // check if done
      if (order[1].hp <= 0 || order[0].hp <= 0) {
        await updateWinLoss(order[0], order[1]);

        return {
          statusCode: 200,
          body: JSON.stringify({
            battlelog: battle,
            winner: order[0].name,
            dragon1: dragon1,
            dragon2: dragon2,
          }),
        }
      }

      const turn2: Turn = {};
      turn2.attackerDelta = {};
      turn2.defenderDelta = {};
      turn2.dragon1EnergyLeft = {};
      turn2.dragon2EnergyLeft = {};
      turn2.attacker = order[1];
      turn2.defender = order[0];

      // choose attack
      const attack2 = chooseAttack(order[1], battleLog);
      battleLog.push("" + order[1].name + " uses " + attack2.name + "!");
      turn2.attackName = attack2.name;

      // damage calc
      if (attack2.damage) {
        const damage2 = damageCalc(order[1], order[0], attack2, battleLog, turn2);
        order[0].hp = Math.max(order[0].hp - damage2, 0);
        order[1].hp = Math.max(order[1].hp + (turn2.attackerDelta.healthDelta ?? 0), 0);
      }
      statusCalc(order[1], order[0], attack2, battleLog, turn2);
      order[1].stamina -= attack2.stamina;
      order[1].mp -= attack2.mp;

      turn2.dragon1EnergyLeft.hpLeft = dragon1.hp;
      turn2.dragon1EnergyLeft.manaLeft = dragon1.mp;
      turn2.dragon1EnergyLeft.staminaLeft = dragon1.stamina;
      turn2.dragon2EnergyLeft.hpLeft = dragon2.hp;
      turn2.dragon2EnergyLeft.manaLeft = dragon2.mp;
      turn2.dragon2EnergyLeft.staminaLeft = dragon2.stamina;

      battle.push(turn2);

      // check if done
      if (order[1].hp <= 0 || order[0].hp <= 0) {
        await updateWinLoss(order[1], order[0]);

        return {
          statusCode: 200,
          body: JSON.stringify({
            battlelog: battle,
            winner: order[1].name,
            dragon1: dragon1,
            dragon2: dragon2,
          }),
        }
      }
  
      // restore energy
      dragon1.mp = Math.min(dragon1.mp + dragon1.spirit, dragon1.maxMP);
      dragon1.stamina = Math.min(dragon1.stamina + dragon1.spirit, dragon1.maxStamina);
      dragon2.mp = Math.min(dragon2.mp + dragon2.spirit, dragon2.maxMP);
      dragon2.stamina = Math.min(dragon2.stamina + dragon2.spirit, dragon2.maxStamina);

      const endTurn: Turn = {};
      endTurn.dragon1EnergyLeft = {
        hpLeft: dragon1.hp,
        manaLeft: dragon1.mp,
        staminaLeft: dragon1.stamina,
      };
      endTurn.dragon2EnergyLeft = {
        hpLeft: dragon2.hp,
        manaLeft: dragon2.mp,
        staminaLeft: dragon2.stamina,
      };
      battle.push(endTurn);
    }
  
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'There was a problem with the battle.',
      }),
    }

  }).catch(error => {
    console.warn(error)
    return {
      statusCode: 422,
      body: JSON.stringify(error),
    }
  });
}

function determineOrder(dragon1, dragon2)  {
  if (dragon1.speed > dragon2.speed) {
    return [dragon1, dragon2];
  } else if (dragon2.speed > dragon1.speed) {
    return [dragon2, dragon1]
  } else {
    if (Math.random() >= .5) {
      return [dragon1, dragon2]
    } else {
      return [dragon2, dragon1]
    }
  }
};

function chooseAttack(dragon, battlelog) {
  const attackList = dragon.stats.attacks;
  const attack =  attacks[attackList[Math.floor(Math.random() * (attackList.length))]];
  if (attack.mp > dragon.mp || attack.stamina > dragon.stamina) {
    battlelog.push('' + dragon.name + ' wants to use ' + attack.name + ', but they don\'t have enough energy!');
    return attacks.Rest;
  }
  return attack;
};

function statusCalc(attacker, defender, attack, battleLog, turn) {
  if (attack.ownStatChange) {
    if ('hp' in attack.ownStatChange) {
      if (attack.ownStatChange.hp < 0) {
        attacker.hp = Math.max(0, attacker.hp + attack.ownStatChange.hp);
      } else {
        attacker.hp = Math.min(attacker.maxHP, attacker.hp + attack.ownStatChange.hp);
      }
      turn.attackerDelta.healthDelta = attack.ownStatChange.hp;
    }
    if ('mp' in attack.ownStatChange) {
      if (attack.ownStatChange.mp < 0) {
        attacker.mp = Math.max(0, attacker.mp + attack.ownStatChange.mp);
      } else {
        attacker.mp = Math.min(attacker.maxMP, attacker.mp + attack.ownStatChange.mp);
      }
      turn.attackerDelta.healthDelta = attack.ownStatChange.mp;
    }
    if ('stamina' in attack.ownStatChange) {
      attacker.stamina = Math.min(attacker.stamina, attacker.stamina + attack.ownStatChange.stamina);
      turn.attackerDelta.staminaDelta = attack.ownStatChange.stamina;
    }
    if ('intellect' in attack.ownStatChange) {
      attacker.intellect *= attack.ownStatChange.intellect;
      turn.attackerDelta.intellectDelta = attack.ownStatChange.intellect;
    }
    if ('wisdom' in attack.ownStatChange) {
      attacker.wisdom *= attack.ownStatChange.wisdom;
      turn.attackerDelta.wisdomDelta = attack.ownStatChange.wisdom;
    }
    if ('spirit' in attack.ownStatChange) {
      attacker.spirit *= attack.ownStatChange.spirit;
      turn.attackerDelta.spiritDelta = attack.ownStatChange.spirit;
    }
    if ('agility' in attack.ownStatChange) {
      attacker.agility *= attack.ownStatChange.agility;
      turn.attackerDelta.agilityDelta = attack.ownStatChange.agility;
    }
    if ('speed' in attack.ownStatChange) {
      attacker.speed *= attack.ownStatChange.speed;
      turn.attackerDelta.speedDelta = attack.ownStatChange.speed;
    }
    if ('strength' in attack.ownStatChange) {
      attacker.strength *= attack.ownStatChange.strength;
      turn.attackerDelta.strengthDelta = attack.ownStatChange.strength;
    }
    if ('defense' in attack.ownStatChange) {
      attacker.defense *= attack.ownStatChange.defense;
      turn.attackerDelta.defenseDelta = attack.ownStatChange.defense;
    }
  }
}

function damageCalc(attacker, defender, attack, battleLog, turn) {
  const STAB = (attacker.ele2 === attack.type || attacker.ele2 === attack.type);
  let critChance = 0;
  let isCrit = false;
  let missChance = 0;
  let isMiss = false;
  let outgoingDamage = 0;
  let incomingDamage = 0;
  let randomRoll = 1 + (Math.random() * .25);

  if (attack.source !== 'Self') {
    missChance = Math.floor(Math.random() * 1000)
    if (missChance < (defender.stats.speed * 100)/attacker.stats.speed) {
      turn.isMiss = true;
      turn.defenderDelta.healthDelta = 0;
      return 0;
    }
    isMiss = true;
  }

  if (attack.source === "Physical") {
    critChance = Math.floor(Math.random() * 1000);
    if (critChance < attacker.stats.agility) {
      isCrit = true;
    }

    outgoingDamage = attack.damage * attacker.stats.strength * randomRoll;
    outgoingDamage = STAB ? outgoingDamage * 1.5 : outgoingDamage;
    outgoingDamage = isCrit ? outgoingDamage * 2 : outgoingDamage;
    incomingDamage = Math.ceil(outgoingDamage / defender.stats.defense);

  } else {
    critChance = Math.floor(Math.random() * 1000);
    if (critChance < attacker.stats.intellect) {
      isCrit = true;
    }

    outgoingDamage = attack.damage * attacker.stats.wisdom * randomRoll;
    outgoingDamage = STAB ? outgoingDamage * 1.5 : outgoingDamage;
    outgoingDamage = isCrit ? outgoingDamage * 2 : outgoingDamage;

    incomingDamage = Math.ceil(outgoingDamage / defender.stats.spirit);
  }

  if (isCrit) {
    turn.isCrit = true;
  }

  if (attack.selfDamage) {
    turn.attackerDelta.healthDelta = Math.ceil(incomingDamage * -.1);
  }

  turn.defenderDelta.healthDelta = incomingDamage * -1;
  return incomingDamage;
}
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

  return axios(config).then(response => {
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

    console.warn('1')
  
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
        battleLog.push("" + order[1].name + " has " + order[1].hp + "HP left!");
      } else {
        statusCalc(order[0], order[1], attack1, battleLog, turn1);
      }
      order[0].stamina -= attack1.stamina;
      order[0].mp -= attack1.mp;

      console.warn('2', order[1])


      // check if done
      if (order[1].hp <= 0) {
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

      turn1.dragon1EnergyLeft.hpLeft = dragon1.hp;
      turn1.dragon1EnergyLeft.manaLeft = dragon1.mp;
      turn1.dragon1EnergyLeft.staminaLeft = dragon1.stamina;
      turn1.dragon2EnergyLeft.hpLeft = dragon2.hp;
      turn1.dragon2EnergyLeft.manaLeft = dragon2.mp;
      turn1.dragon2EnergyLeft.staminaLeft = dragon2.stamina;

      battle.push(turn1);
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
        battleLog.push("" + order[0].name + " has " + order[0].hp + "HP left!");
      } else {
        statusCalc(order[1], order[0], attack2, battleLog, turn2);
      }
      order[1].stamina -= attack2.stamina;
      order[1].mp -= attack2.mp;

      turn2.dragon1EnergyLeft.hpLeft = dragon1.hp;
      turn2.dragon1EnergyLeft.manaLeft = dragon1.mp;
      turn2.dragon1EnergyLeft.staminaLeft = dragon1.stamina;
      turn2.dragon2EnergyLeft.hpLeft = dragon2.hp;
      turn2.dragon2EnergyLeft.manaLeft = dragon2.mp;
      turn2.dragon2EnergyLeft.staminaLeft = dragon2.stamina;

      battle.push(turn2);

      console.warn('3')

      // check if done
      if (order[0].hp <= 0) {
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
      dragon1.mp = Math.min(dragon1.mp + 100, dragon1.maxMP);
      dragon1.stamina = Math.min(dragon1.stamina + 100, dragon1.maxStamina);
      dragon2.mp = Math.min(dragon2.mp + 100, dragon2.maxMP);
      dragon2.stamina = Math.min(dragon2.stamina + 100, dragon2.maxStamina);

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

      console.warn('4')

    }
  
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'There was a problem with the battle.',
      }),
    }

  }).catch(error => {
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
    switch (attack.ownStatChange) {
      case "HP":
        attacker.HP = Math.min(attacker.maxHP, attacker.HP + attack.ownStatChange.HP);
        battleLog.push("" + attacker.name + " restores " + attack.ownStatChange.HP + " HP!");
        turn.attackerDelta.healthDelta = attack.ownStatChange.HP;
      case "MP":
        attacker.MP = Math.min(attacker.maxMP, attacker.MP + attack.ownStatChange.MP);
        battleLog.push("" + attacker.name + " restores " + attack.ownStatChange.MP + " MP!");
        turn.attackerDelta.manaDelta = attack.ownStatChange.MP;
      case "stamina":
        attacker.stamina = Math.min(attacker.stamina, attacker.stamina + attack.ownStatChange.Stamina);
        battleLog.push("" + attacker.name + " restores " + attack.ownStatChange.stamina + " stamina!");
        turn.attackerDelta.staminaDelta = attack.ownStatChange.stamina;
      case "intellect":
        attacker.intellect *= attack.ownStatChange.intellect;
        battleLog.push("" + attacker.name + "'s Intellect has increased!");
        turn.attackerDelta.intellectDelta = attack.ownStatChange.intellect;
      case "wisdom":
        attacker.wisdom *= attack.ownStatChange.wisdom;
        battleLog.push("" + attacker.name + "'s Wisdom has increased!");
        turn.attackerDelta.wisdomDelta = attack.ownStatChange.wisdom;
      case "spirit":
        attacker.spirit *= attack.ownStatChange.spirit;
        battleLog.push("" + attacker.name + "'s Spirit has increased!");
        turn.attackerDelta.spiritDelta = attack.ownStatChange.spirit;
      case "agility":
        attacker.agility *= attack.ownStatChange.agility;
        battleLog.push("" + attacker.name + "'s Agility has increased!");
        turn.attackerDelta.agilityDelta = attack.ownStatChange.agility;
      case "speed":
        attacker.speed *= attack.ownStatChange.speed;
        battleLog.push("" + attacker.name + "'s Speed has increased!");
        turn.attackerDelta.speedDelta = attack.ownStatChange.speed;
      case "strength":
        attacker.strength *= attack.ownStatChange.strength;
        battleLog.push("" + attacker.name + "'s Strength has increased!");
        turn.attackerDelta.strengthDelta = attack.ownStatChange.strength;
      case "defense":
        attacker.defense *= attack.ownStatChange.defense;
        battleLog.push("" + attacker.name + "'s Defense has increased!");
        turn.attackerDelta.defenseDelta = attack.ownStatChange.defense;
    }
  }
}

function damageCalc(attacker, defender, attack, battleLog, turn) {
  const STAB = (attacker.ele2 === attack.type || attacker.ele2 === attack.type);
  let critChance = 0;
  let isCrit = false;
  let outgoingDamage = 0;
  let incomingDamage = 0;
  let randomRoll = 1 + (Math.random() * .25);

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
    battleLog.push("A critical hit!");
  }

  battleLog.push("" + defender.name + " takes " + incomingDamage + "damage!");
  turn.defenderDelta.healthDelta = incomingDamage * -1;
  return incomingDamage;
}
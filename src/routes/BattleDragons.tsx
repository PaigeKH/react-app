import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from 'primereact/button';
import './SubmitDragon.css';
import { useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { ProgressBar } from 'primereact/progressbar';
import { Dragon } from './Dragon';
import 'primeicons/primeicons.css';
import { Card } from 'primereact/card';
import TopBar from '../TopBar';


//class BattleDragons extends React.Component<{}, {battlelog: string[]}> {


/*
  Battle anims order:
    Show who is attacking
    List the attack
    List damage done
    Decrease stam/health/mana 
    List the effects
    On battle end, show winner/loser 
  Show both sprites
  
*/

interface Turn {
  attacker?: Dragon,
  defender?: Dragon,
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

export default function BattleDragons() {
  const [battlelog, setBattlelog] = useState<Turn[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [dragon1, setDragon1] = useState<Dragon>();
  const [dragon2, setDragon2] = useState<Dragon>();

  const [turn, setTurn] = useState<number>(0);
  const [playAnimation, setPlayAnimation] = useState<boolean>(true);

  const routeParams = useParams();
  const { user, isAuthenticated } = useAuth0();

  useEffect(() => {
    //Implementing the setInterval method
    const interval = setInterval(() => {
      if (playAnimation) {
        if (turn < battlelog.length - 1) {
          setTurn(turn + 1);
        } else {  
          clearInterval(interval);
        }
      }
    }, turn % 3 === 0 ? 1500 : 2000);
    if (!playAnimation) {
      clearInterval(interval)
    }
    //Clearing the interval
    return () => clearInterval(interval);
}, [isLoaded, turn, playAnimation]);

  const runBattle = () => {
    if (isAuthenticated && user) {
      axios.get(
        "/.netlify/functions/sim-battle", {
        params: {
          sessionId: user.nickname,
          userId: user?.sub?.split("|")[2],
          opponentName: routeParams.opponentName,
        }
      }).then((response) => {
        setBattlelog(response.data.battlelog);
        setDragon1(response.data.dragon1);
        setDragon2(response.data.dragon2);
        setIsLoaded(true);
      }).catch((error) => {
        console.warn("Error:", error);
      });
    }
  }

  const goBack = () => {
    setPlayAnimation(false);
    if (turn) {
      setTurn(turn - 1);
    }
  }

  const goForward = () => {
    setPlayAnimation(false);
    if (turn < battlelog.length - 1) {
      setTurn(turn + 1);
    }
  }

  const togglePlay = () => {
    setPlayAnimation(!playAnimation);
  }

  const goToStart = () => {
    setPlayAnimation(false);
    setTurn(0);
  }

  const goToEnd = () => {
    setPlayAnimation(false);
    setTurn(battlelog.length - 1);
  }

  const getCardText = () => {
    if (turn) {
      const attacker = battlelog[turn].attacker;
      const defender = battlelog[turn].defender;
      if (attacker && defender) {
        let turnStr = attacker.name ?? attacker.id + ' uses ' + battlelog[turn].attackName + '!';
        if (battlelog[turn].isCrit) {
          turnStr += '\nA critical hit!'
        }
        turnStr += '\n' + (defender.name ?? defender.id) + ' takes ' + ((battlelog[turn].defenderDelta?.healthDelta ?? 0) * -1) + ' damage!'

        if (battlelog[turn].dragon1EnergyLeft?.hpLeft === 0) {
          turnStr += '\n' + (dragon1?.name ?? dragon1?.id) + ' has been defeated! ' + (dragon2?.name ?? dragon2?.id) + ' is the winner!'
        } else if (battlelog[turn].dragon2EnergyLeft?.hpLeft === 0) {
          turnStr += '\n' + (dragon2?.name ?? dragon2?.id) + ' has been defeated! ' + (dragon1?.name ?? dragon1?.id) + ' is the winner!'
        }



        return turnStr;
      } else {
        return 'The dragons rest to regain energy.';
      }
    }
    return 'The battle begins.';
  }

  const d1hpl = isLoaded ? battlelog[turn].dragon1EnergyLeft?.hpLeft : 0;
  const d2hpl = isLoaded ? battlelog[turn].dragon2EnergyLeft?.hpLeft : 0;
  const d1mpl = isLoaded ? battlelog[turn].dragon1EnergyLeft?.manaLeft : 0;
  const d2mpl = isLoaded ? battlelog[turn].dragon2EnergyLeft?.manaLeft : 0;
  const d1sl = isLoaded ? battlelog[turn].dragon1EnergyLeft?.staminaLeft : 0;
  const d2sl = isLoaded ? battlelog[turn].dragon2EnergyLeft?.staminaLeft : 0;

  return (
    <div>
    <TopBar/>
    <div style={{display: 'flex', flex:'flex-grow', justifyContent: 'center', minWidth: '100vw'}}>
      <div style={{flexDirection: 'column'}}>

      <div style={{flexDirection: 'column',}}>
        <div>
        {!isLoaded && <Button label={'Start Battle!'} onClick={runBattle}/>}
        {isLoaded && 
        (d1hpl || d1hpl === 0) && (d2hpl || d2hpl === 0) &&
        (d1mpl || d1mpl === 0) && (d2mpl || d2mpl === 0) &&
        (d1sl || d1sl === 0) && (d2sl || d2sl === 0) && <div>

          <div style={{flexDirection: 'row', display: 'flex', justifyContent: 'space-between'}}>

          <div style={{minWidth: '10vw', flexDirection: 'column', justifySelf: 'center'}}>
          <img style={{filter: 'drop-shadow(5px #fff)'}} src={'https://dragcave.net/image/' + dragon1?.id + '.gif'} alt={'Sprite for dragon ' + (dragon1?.name ?? dragon1?.id)}/>
          <p style={{flex: 1}}>{dragon1?.name ?? <i>{'(' + dragon1?.id + ')'}</i>}</p>
          <ProgressBar value={Math.ceil((d1hpl * 100) / (dragon1?.maxHP ?? 1))} color="green"></ProgressBar>
          <ProgressBar value={Math.ceil((d1mpl * 100) / (dragon1?.maxMP ?? 1))} color="blue"></ProgressBar>
          <ProgressBar value={Math.ceil((d1sl * 100) / (dragon1?.maxStamina ?? 1))} color="orange"></ProgressBar>
          </div>
          <div style={{minWidth: '30vw'}}/>
          <div style={{minWidth: '10vw'}}>
          <img src={'https://dragcave.net/image/' + dragon2?.id + '.gif'} alt={'Sprite for dragon ' + (dragon2?.name ?? dragon2?.id)}/>
          <p style={{flex: 1}}>{dragon2?.name ?? <i>{'(' + dragon2?.id + ')'}</i>}</p>
          <ProgressBar value={Math.ceil((d2hpl * 100) / (dragon2?.maxHP ?? 1))} color="green"></ProgressBar>
          <ProgressBar value={Math.ceil((d2mpl * 100) / (dragon2?.maxMP ?? 1))} color="blue"></ProgressBar>
          <ProgressBar value={Math.ceil((d2sl * 100) / (dragon2?.maxStamina ?? 1))} color="orange"></ProgressBar>
          </div>
          </div>
          </div>}
        </div>

      </div>
      <Card>
        <p style={{fontSize: '20px', whiteSpace: 'pre-line'}}>{getCardText()}</p>
      </Card>
      {isLoaded && <div style={{flexDirection: 'row', alignContent: 'flex-end'}}>
        <Button icon='pi pi-backward' onClick={goToStart}></Button>
        <Button icon='pi pi-step-backward-alt' onClick={goBack}/>
        <Button icon={playAnimation ? 'pi pi-pause' : 'pi pi-play'} onClick={togglePlay}></Button>
        <Button icon='pi pi-step-forward-alt' onClick={goForward}></Button>
        <Button icon='pi pi-forward' onClick={goToEnd}></Button>
      </div>}
      </div>

    </div>
    </div>
  );
}


import { Button } from 'primereact/button';
import { Dragon } from './routes/Dragon';

interface DragonCardProps {
    dragon: Dragon;
    onClick: (dragon: Dragon) => void;
}

export default function DragonCard({dragon, onClick}: DragonCardProps)  {
    const selectDragon = () => {
        onClick(dragon);
    }

  return (
    <div>
      <header>
        <Button style={{width: '100%', marginTop: '1px'}} onClick={selectDragon} id={dragon.id}>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <div style={{display: 'flex', flexDirection: 'row'}}>
              <div style={{flex: 1}}><img src={"https://dragcave.net/image/" + dragon.id + ".gif"} alt="Adopt one today!"/></div>
              <div style={{flex: 1}}>
              <p style={{flex: 1}}>{dragon.name ?? <i>{'(' + dragon.id + ')'}</i>}</p>
              <p style={{flex: 1}}>{dragon.breed ? 'Registered' : 'Not Registered'}</p>
              </div>
            </div>
        </div>
        </Button>
      </header>
    </div>
  );
};


import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import TopBar from '../TopBar';
import axios from 'axios';
import { VirtualScroller } from 'primereact/virtualscroller';
import { Dragon } from './Dragon';
import { useEffect, useState } from 'react';
import BasicDemo from './Test2';
import DragonCard from '../DragonCard';

export default function Test() {
  // const toast = useRef<Toast>(null);
  const [dataIsLoaded, setDataIsLoaded] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const [selectedDragon, setSelectedDragon] = useState<Dragon>();
  const [dragons, setDragons] = useState<Dragon[]>([]);

  const { user } = useAuth0();

  useEffect(() => {
    getDragons(null);
  }, [])

  const getDragons = (cursor: string | null) => {
    axios.get('/.netlify/functions/hello-world', {    
      params: {
        nickname: user?.nickname,
        name: user?.name,
        cursor: cursor,
        userID: user?.sub?.split("|")[2],
      }
    }).then((response) => {
        //@ts-ignore
        setDragons(Object.values(response.data.dragons));
        setDataIsLoaded(true);

      }).catch((error) => {
        console.warn('Error:', error)
      });
     }

     const displayDragon = (item: Dragon) => {
      return (
        <DragonCard dragon={item} onClick={() => {}}/>
      // <div>
      //   {item.id}
      // </div>
      );
     }

    return (
      <div>
        <TopBar/>
        <header>
            <VirtualScroller items={dragons} itemTemplate={displayDragon} itemSize={50} style={{width: '20vw', height: '20vh'}}>

            </VirtualScroller>

        </header>
      </div>
    );
};
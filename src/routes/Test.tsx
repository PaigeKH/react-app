import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import TopBar from '../TopBar';
import axios from 'axios';
import { Dragon } from './Dragon';
import { SyntheticEvent, useEffect, useState } from 'react';
import { OrderList, OrderListChangeEvent } from 'primereact/orderlist';


export default function Test() {
  const [dragons, setDragons] = useState<Dragon[]>([]);

  const { user } = useAuth0();


  const getDragons = () => {
    axios.get('/.netlify/functions/get-registered-dragons', {
      params: {
        sessionID: user?.nickname,
        userID: user?.sub?.split("|")[2],
      }
    }).then((response) => {
      console.warn(response);
      setDragons(response.data.dragonFiltered);
    }).catch((error) => {
      console.warn(error);
    });
  }

  useEffect(() => {
    getDragons();
  }, [])

  const onOrderChange = (event: OrderListChangeEvent) => {
    setDragons(event.value);

    axios.get('/.netlify/functions/set-active-dragons', {
      params: {
        sessionID: user?.nickname,
        userID: user?.sub?.split("|")[2],
        dragon: event.value[0].id,
      }
    }).then((response) => {}).catch((error) => {
      console.warn(error);
      getDragons();
    });
  }

  const handleManualReorder = (dragon: Dragon) => {
    const newList = dragons.filter((dr) => {
      return dr.id !== dragon.id;
    })
    newList.unshift(dragon);
    console.warn(newList);
    //@ts-ignore
    const event: OrderListChangeEvent = {
      value: newList,
    }
    onOrderChange(event);
  }

  const itemTemplate = (dragon:Dragon) => {
    if (dragons[0] === dragon) {
      return (
        <div style={{width: '40vw', backgroundColor: 'var(--primary-color)', borderRadius: '5px', display: 'inline-flex', justifyContent: 'space-between', paddingRight: '5vw'}}>
            <img src={'https://dragcave.net/image/'+ dragon.id +'.gif'}/>
            <div style={{alignContent: 'center', color: 'var(--primary-color-text)'}}>
              <div>{dragon.name}</div>
              <div className="font-bold">{dragon.id}</div>
              <div className="font-bold">{dragon.breed}</div>
              <div className="font-bold"><b>{'Active Dragon'}</b></div>
            </div>
        </div>
    );
    }


    return (
      <div onDoubleClick={() => {
        handleManualReorder(dragon);
      }} style={{width: '40vw', display: 'inline-flex', justifyContent: 'space-between', paddingRight: '5vw'}}>
      <img src={'https://dragcave.net/image/'+ dragon.id +'.gif'}/>
      <div style={{alignContent: 'center'}}>
        <div>{dragon.name}</div>
        <div>{dragon.id}</div>
        <div>{dragon.breed}</div>
      </div>
  </div>
    );
};
  
    return (
      <div>
        <TopBar/>
        <header>
          <OrderList dataKey="id" value={dragons} onChange={onOrderChange} itemTemplate={itemTemplate} 
            header="Registered Dragons" dragdrop></OrderList>        </header>
      </div>
    );
};
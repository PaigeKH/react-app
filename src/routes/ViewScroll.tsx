import React, {useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import './SubmitDragon.css';
import { Dragon } from './Dragon';
import DragonCard from '../DragonCard';
import { useAuth0 } from '@auth0/auth0-react';
import { ProgressSpinner } from 'primereact/progressspinner';
import TopBar from '../TopBar';
import { Toast } from 'primereact/toast';
import { FloatLabel } from 'primereact/floatlabel';
import { VirtualScroller } from 'primereact/virtualscroller';

const pages: string[] = [''];
let currentPage = 1;
let hasNextPage: boolean;

export default function ViewScroll() {
  const toast = useRef<Toast>(null);
  const scroller = useRef<VirtualScroller>(null);

  const [dataIsLoaded, setDataIsLoaded] = useState<boolean>(false);
  const [selectedDragon, setSelectedDragon] = useState<Dragon>();
  const [dragons, setDragons] = useState<Dragon[]>([]);
  const [filteredDragons, setFilteredDragons] = useState<Dragon[]>([]);

  const { user } = useAuth0();

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
        setFilteredDragons(Object.values(response.data.dragons));
        setDataIsLoaded(true);

        if (!pages.includes(response.data.data.endCursor)) {
          pages.push(response.data.data.endCursor);
        }
        hasNextPage = response.data.data.hasNextPage;
      }).catch((error) => {
        console.warn('Error:', error)
      });
  }

  const goBack = () => {
    if (currentPage > 1) {
      currentPage--;
      getDragons(pages[currentPage - 1]); 
    }
  }

  const goForward = () => {
    if (hasNextPage) {
      getDragons(pages[currentPage]);
      currentPage++;
    }
  }

  const submitDragon = (event: any) => {
    axios.get('/.netlify/functions/submit-dragon-to-db', {    
      params: {
        sessionID: user?.nickname,
        username: user?.name,
        cursor: pages[currentPage - 1],
        dragonID: selectedDragon?.id,
        userID: user?.sub?.split("|")[2],
        remove: selectedDragon?.registered,
      }
    }).then((response) => {
      showToast(false, 'Submitted/removed ' + (response.data.name ?? response.data.message[0].id) + ' successfully.');
    }).catch((error) => {
      console.warn(error);
      showToast(true, 'Error submitting dragon' + error)
    })
  };

  useEffect(() => {
    getDragons(null);
  }, [])

  const showToast = (isError: boolean, message: string) => {
    toast.current?.show({ 
      severity: isError ? 'error' : 'success',
      summary: isError ? 'Error' : 'Success',
      detail: message,
     });
};

const updateFilter = (event: React.FormEvent<HTMLInputElement>) => {
  if (!dragons) {
    return;
  }

  const filtered = dragons.filter((dragon) => {
    const id = dragon.id.toLowerCase();
    const breed = dragon?.breed?.toLowerCase() ?? '';
    const name = dragon.name?.toLowerCase() ?? '';

    if (event.currentTarget.value !== '' &&
      id.includes(event.currentTarget.value.toLowerCase()) || 
      breed?.includes(event.currentTarget.value.toLowerCase()) ||
      name?.includes(event.currentTarget.value.toLowerCase())) {
        return dragon;
      }
    else {
      return false;
    }
  })

  setFilteredDragons(filtered);
  scroller.current?.scrollToIndex(0);
};

  const selectDragon = (dragon: Dragon): void => {
    setSelectedDragon(dragon);
  };

  const displayDragon = (item: Dragon) => {
    return (
      <DragonCard dragon={item} onClick={selectDragon}/>
    );
   }

  if (!dataIsLoaded) {
    return (
      <div>
        <TopBar/>
        <ProgressSpinner/>
        Loading dragons...
      </div>
    )
  }

  return (
    <div style={{maxHeight: '80vh', marginTop: '5vh'}}>
      <TopBar/>
      <Toast ref={toast} />
      <header className='buttonContainers'>
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>

      <FloatLabel>
        <InputText onInput={updateFilter}/>
        <label>Filter</label>
      </FloatLabel>
      <VirtualScroller ref={scroller} items={filteredDragons} itemTemplate={displayDragon} itemSize={200} style={{width: '20vw', height: '60vh'}}/>

        <div style={{justifyContent: 'center'}}>
        {/* <Button onClick={goBack} label='◀ Previous'></Button>
        <Button onClick={goForward} label='Next ▶'></Button> */}
        </div>
        </div>


        <div style={{backgroundColor: 'var(--primary-700)', marginLeft: '2vw'}}>
        <a><img src={"https://dragcave.net/image/" + selectedDragon?.id} alt={'Sprite for dragon ' + (selectedDragon?.name ?? selectedDragon?.id)}/></a>
        <Button label={(!selectedDragon?.registered && selectedDragon?.submitted) ? 'Remove' : 'Submit'} onClick={submitDragon}></Button>
        <div style={{display: 'flex', width: '50vw', justifyContent: 'space-around', fontSize: '2vmin'}}>
          <div>
          <p>General Stats</p>
          <p>{'Code: ' + selectedDragon?.id}</p>
          <p>{'Name: ' + (selectedDragon?.name ?? 'None')}</p>
          <p>{'Owner: ' + selectedDragon?.owner}</p>
          <p>{'Egg laid on: ' + selectedDragon?.start}</p>
          <p>{'Egg hatched on: ' + selectedDragon?.hatch}</p>
          <p>{'Grew up on: ' + selectedDragon?.grow}</p>
          <p>{'Died on: ' + (selectedDragon?.death ?? 'Never')}</p>
          <p>{'Views : ' + selectedDragon?.views}</p>
          <p>{'Unique Views: ' + selectedDragon?.unique}</p>
          <p>{'Clicks: ' + selectedDragon?.clicks}</p>
          <p>{'Gender : ' + selectedDragon?.gender}</p>
          <p>{'Mother: ' + (selectedDragon?.parent_f?.name ?? 'None')}</p>
          <p>{'Father: ' + (selectedDragon?.parent_m?.name ?? 'None')}</p>
          </div>
          <div>
          <p>Combat Stats</p>
          <p>{'HP: ' + (selectedDragon?.hp ?? '')}</p>
          <p>{'Mana: ' + (selectedDragon?.mp ?? '')}</p>
          <p>{'Intellect: ' + (selectedDragon?.intellect ?? '')}</p>
          <p>{'Wisdom: ' + (selectedDragon?.wisdom ?? '')}</p>
          <p>{'Spirit: ' + (selectedDragon?.spirit ?? '')}</p>
          <p>{'Agility: ' + (selectedDragon?.agility ?? '')}</p>
          <p>{'Speed: ' + (selectedDragon?.speed ?? '')}</p>
          <p>{'Strength: ' + (selectedDragon?.strength ?? '')}</p>
          <p>{'Defense: ' + (selectedDragon?.defense ?? '')}</p>
          <p>{'Body Type: ' + (selectedDragon?.body ?? '')}</p>
          <p>{'Element 1: ' + (selectedDragon?.ele1 ?? '')}</p>
          <p>{'Element 2: ' + (selectedDragon?.ele2 ?? '')}</p>
          <p>{'Breed: ' + (selectedDragon?.breed ?? '')}</p>
          </div>
          <p>Attacks</p>
        </div>
        </div>
      </header>
    </div>
  );
};
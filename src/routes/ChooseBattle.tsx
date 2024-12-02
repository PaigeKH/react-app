import { useEffect, useState } from 'react';
import axios from 'axios';
import './SubmitDragon.css';
import { useNavigate } from 'react-router-dom';
import { ScrollPanel } from 'primereact/scrollpanel';
import TopBar from '../TopBar';
import { ProgressSpinner } from 'primereact/progressspinner';
import UserCard from '../UserCard';

export default function ChooseBattle() {
  const [userList, setUserList] = useState<any[]>(['No log yet.']);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  
  const fetchAPI = () => {
    axios.get(
      "/.netlify/functions/get-users").then((response) => {
      //@ts-ignore
      setUserList(response.data.users);
      setIsLoading(false);
    }).catch((error) => {
      console.warn("Error:", error);
    });
  }

  useEffect(() => {
    fetchAPI();
  }, [isLoading])

  const startBattle = (user: any) => {
    navigate('/battle/' + user.username);
  }

  if (isLoading) {
    return (
      <ProgressSpinner/>
    )
  }

  return (
    <div>
      <TopBar/>
      <header className="buttonContainers">
        <div className="button">
        <div style={{width: '50vw', height: '80vh'}}>
          <ScrollPanel>
          {userList.map(user => 
            <UserCard onClick={startBattle} user={user}/>
          )}
          </ScrollPanel>
        </div>
        </div>
      </header>
    </div>
  );
}


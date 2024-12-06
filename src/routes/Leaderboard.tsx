import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import TopBar from '../TopBar';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

export default function Leaderboard() {
  const { user } = useAuth0();
  const [userLeaderboard, setUserLeaderboard] = useState<any[]>([]);
  const [dragonLeaderboard, setDragonLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const userColumns = [
    {field: 'username', header: 'Username'},
    {field: 'wins', header: 'Wins'},
    {field: 'losses', header: 'Losses'},
    {field: 'winrate', header: 'Win Rate'}
];
const dragonColumns = [
    {field: 'id', header: 'ID'},
    {field: 'owner', header: 'Owner'},
    {field: 'wins', header: 'Wins'},
    {field: 'losses', header: 'Losses'},
    {field: 'winrate', header: 'Win Rate'}
];
  
  const fetchAPI = () => {
    axios.get(
      "/.netlify/functions/get-leaderboard").then((response) => {
      //@ts-ignore
    //   setLeaderboard(response.data.users);
    setDragonLeaderboard(response.data.dragons);
    setUserLeaderboard(response.data.users);
      setIsLoading(false);
    }).catch((error) => {
      console.warn("Error:", error);
    });
  }

  useEffect(() => {
    fetchAPI();
  }, [])
  

    if (isLoading) {
        return (
            <ProgressSpinner/>
        )
    }

    return (
      <div>
        <TopBar/>
        <div style={{display: 'inline-flex'}}>
            <DataTable value={dragonLeaderboard} tableStyle={{ minWidth: '40vw' }}>
                {dragonColumns.map((col, i) => (
                    <Column key={col.field} field={col.field} header={col.header} />
                ))}
            </DataTable>
            <div style={{paddingRight: '5vw'}}/>
            <DataTable value={userLeaderboard} tableStyle={{ minWidth: '40vw' }}>
                {userColumns.map((col, i) => (
                    <Column key={col.field} field={col.field} header={col.header} />
                ))}
            </DataTable>
        </div>
      </div>
    );
};
import './App.css';
import { useAuth0 } from '@auth0/auth0-react';
import TopBar from '../TopBar';

export default function Home() {
  const { user } = useAuth0();

    return (
      <div>
        <TopBar/>
        <header className="App-header">
          {user ? <p>
            Hello, {user?.name}
          </p> : <></>}
            <p>
                Welcome to the shrimp tank.
            </p>
            <p>
            This website is in beta.
            </p>
        </header>
      </div>
    );
};
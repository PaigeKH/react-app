import React from 'react';
import './App.css';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from './routes/Home';
import ErrorPage from './routes/ErrorPage';
import BattleDragons from './routes/BattleDragons';
import ViewScroll from './routes/ViewScroll';
import ChooseBattle from './routes/ChooseBattle';
import Test from './routes/Test';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home/>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/battle/:opponentName',
    element: <BattleDragons/>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/battle',
    element: <ChooseBattle/>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/scroll',
    element: <ViewScroll/>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/party',
    element: <Test/>,
    errorElement: <ErrorPage />,
  },
]);

class App extends React.Component<{}, {}> {
  render() {
    return (
      <PrimeReactProvider value={{ripple: true}}>
        <div className="App-header">
      <RouterProvider router={router} />
      </div>
      </PrimeReactProvider>
    );
  }
}

export default App;
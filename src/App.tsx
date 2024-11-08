import React from 'react';
import './App.css';
import { Menubar } from 'primereact/menubar';
import { PrimeReactProvider } from 'primereact/api';
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { MenuItem, MenuItemCommandEvent } from 'primereact/menuitem';
import Home from './Home';
import NavBar from './APITest';

class App extends React.Component<{}, {tab: number}> {
  constructor(props: {}) {
    super(props);

    this.state = {
      tab: 0,
    }
}

  switchTab = (event: MenuItemCommandEvent) => {
    switch (event.item.label) {
      case 'Not Home':
        this.setState({
          tab: 1
        })
        break;
      case 'idk':
        this.setState({
          tab: 2
        })
        break;
      default:
        this.setState({
          tab: 0
        })
        break;
    }
  }

  render() {
    return (
      <PrimeReactProvider>
      <div className="App">
      <Menubar model={[{label: 'Home', command: this.switchTab}, {label: 'Not Home', command:this.switchTab}, {label: 'idk'}]}/>
      </div>
      <Home shouldDisplay={this.state.tab === 0}/>
      <NavBar shouldDisplay={this.state.tab === 1}/>
      </PrimeReactProvider>
    );
  }
}

export default App;
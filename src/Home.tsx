import React from 'react';
import logo from './logo.svg';
import './App.css';

class Home extends React.Component<{shouldDisplay: boolean}, {}> {

  render() {
    if (!this.props.shouldDisplay) {
        return (<></>);
      }

    return (
      <div>
        <header className="App-header">
            <p>
                Shrimp Jam.
            </p>
        </header>
      </div>
    );
  }
}

export default Home;
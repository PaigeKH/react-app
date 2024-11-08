import React from 'react';
import './App.css';
import { Button } from 'primereact/button';
import axios from 'axios';

class APITest extends React.Component<{shouldDisplay: boolean}, {responseText: string, items: any, dataIsLoaded: boolean}> {
  constructor(props: {shouldDisplay: boolean}) {
    super(props);

    this.state = {
      responseText: '-',
      items: '',
      dataIsLoaded: true,
    }
  };

  fetchAPI = () => {
    axios.get(
      "https://dragcave.net/api/v2/dragon/1CocK", {
        headers: {
          'Authorization': 'test',
        }
      }
  )
  .then((response) => {
    console.warn(response);
      this.setState({
          items: response.data,
          dataIsLoaded: true,
      });
  });
  };

  render() {
    if (!this.props.shouldDisplay) {
        return (<></>);
      }

    return (
      <div>
        <header className="App-header">
        <Button label={'Search'} onClick={this.fetchAPI}/>
            <p>
                Welcome to the shrimp tank.
            </p>
            <p>
              {this.state.responseText}
            </p>
        </header>
      </div>
    );
  }
}

export default APITest;
import React from 'react';
import * as actions from 'actions';
import store from 'store';
class Loading extends React.Component {
  constructor(props) {
    super(props);
  }

  login = () => {
    store.dispatch(actions.web3TorusConnect());
  };
  render() {
    return (
      <div>
        <div className='container-custom'>
          <img
            alt=''
            src={require('assets/img/lg.blue-longcat-spinner.gif')}
            className='gif-load'
          />
          <button onClick={this.login}>Login</button>
        </div>
      </div>
    );
  }
}

export default Loading;

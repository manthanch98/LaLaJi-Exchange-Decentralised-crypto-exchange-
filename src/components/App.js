import { Component } from 'react';
import './App.css';
import Navbar from './Navbar';
import Content from './content';
import { loadWeb3 , loadAccount, loadToken, loadExchange} from '../store/interactions';
import { connect } from 'react-redux';
import Web3 from "web3/dist/web3.min";

import { contractsLoadedSelector } from '../store/selectors';

class App extends Component {

  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
    
  }

  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    await window.ethereum.enable();
    const networkId = await web3.eth.net.getId()
    const accounts = await loadAccount(web3,dispatch)
    web3.eth.getAccounts(console.log);
    const token= await loadToken(web3,networkId,dispatch)
    if(!token){
      window.alert('Token smart contract not detected on current network')
      return
    }
    
    const exchange= await loadExchange(web3,networkId,dispatch)
    if(!exchange){
      window.alert('Exchange smart contract not detected on current network')
      return
    }
    
    loadExchange(web3,networkId,dispatch)
    
  }

  render() {
    return (
      <div>
        <Navbar/>
        {this.props.contractLoaded ? <Content/> : <div className='content'></div>}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return{
    contractLoaded: contractsLoadedSelector(state)
  }
}



export default connect(mapStateToProps)(App);

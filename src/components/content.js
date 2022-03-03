import React,{Component} from "react";
import {connect} from 'react-redux';
import { loadAllOrders, subscribeToEvent} from "../store/interactions";
import { exchangeSelector } from "../store/selectors";
import Trades from "./Trades";
import OrderBook from "./orderbook";
import MyTransactions from "./MyTransactions"
import Balance from "./Balance";
import NewOrder from "./NewOrder";



class Content extends Component{
  componentWillMount() {
    this.loadBlockchainData(this.props)
  }

  async loadBlockchainData(props) {
    const {dispatch,exchange}= props
    await loadAllOrders(exchange,dispatch)
    await subscribeToEvent(exchange,dispatch)
  }

    render(){
        return(
            <div className="content">
          <div className="vertical-split">
            <Balance/>

            <NewOrder/>
          </div>
          <div className="vertical">
            <OrderBook/>
          </div>
          <div className="vertical">

            <MyTransactions/>
          </div>
          <div className="vertical">
            <Trades/>
          </div>
        </div>
        )
    }
}

function mapStateToProps(state) {
    return{
      exchange: exchangeSelector(state)
    }
}

export default connect(mapStateToProps)(Content);

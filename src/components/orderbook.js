import React,{ Component } from "react";
import { connect } from "react-redux";
import { OverlayTrigger,Tooltip } from "react-bootstrap";
import {
    orderBookSelector,
    orderBookLoadedSelector
} from '../store/selectors'
import { fillOrder } from "../store/interactions";
import {
    exchangeSelector,
    accountSelector,
    orderFillingSelector
  } from '../store/selectors'
import ClipLoader from "react-spinners/ClipLoader";


const showOrderBook= (props) =>{
    const {orderBook}= props

    return(
        <tbody>
            {orderBook.sellOrders.map((order)=> renderOrder(order,props))}
            <tr>
                <th>Udhari</th>
                <th>Udhari/ETH</th>
                <th>ETH</th>
            </tr>
            {orderBook.buyOrders.map((order)=> renderOrder(order,props))}
        </tbody>
    )
}

const renderOrder= (order,props) =>{
    const {dispatch,exchange,account}= props
    return(
        <OverlayTrigger
            key={order.id}
            placement='auto'
            overlay={
                <Tooltip id={order.id}>
                    {`Click here to ${order.orderFillAction}`}
                </Tooltip>
            }
        >
            <tr 
            key={order.id}
            className="order-book-order"
            onClick={(e) => fillOrder(dispatch, exchange, order, account)}>
                <td>{order.tokenAmount}</td>
                <td className={`text-${order.orderTypeAction}`}>{order.tokenPrice}</td>
                <td>{order.etherAmount}</td>
            </tr>
        </OverlayTrigger>
    )
}

class OrderBook extends Component{
    render(){
        return(
            <div className="card bg-dark text-white">
              <div className="card-header">
                OrderBook
              </div>
              <div className="card-body order-book">
                  <table className="table table-dark table-sm small">
                    {this.props.showOrderBook ? showOrderBook(this.props):<ClipLoader/>}
                  </table>
              </div>
            </div>
        )
    }
}

function mapStateToProps(state){
    const orderBookLoaded= orderBookLoadedSelector(state)
    const orderFilling= orderFillingSelector(state)
    return{
        orderBook: orderBookSelector(state),
        showOrderBook: orderBookLoaded && !orderFilling,
        exchange: exchangeSelector(state),
        account: accountSelector(state)
    }
}

export default connect(mapStateToProps)(OrderBook);
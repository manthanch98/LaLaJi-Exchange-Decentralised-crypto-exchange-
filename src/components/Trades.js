import React,{ Component } from "react";
import { connect } from "react-redux";
import { filledOrdersLoadedSelector, filledOrdersSelector } from "../store/selectors";



const showFilledOrders= (filledOrders) =>{
    return(
        <tbody>
            {
            filledOrders.map((orders) => {
            return(
                
                <tr>
                <td className="text-muted">{orders.formattedTimestamp}</td>
                <td>{orders.tokenAmount}</td>
                <td className={`text-${orders.tokenPriceClass}`}>{orders.tokenPrice}</td>
            </tr>
            )
        })
        }               
        </tbody>
       
    )
}


class Trades extends Component{
    render(){
        return(
            <div className="card bg-dark text-white">
              <div className="card-header">
                Trades
              </div>
              <div className="card-body">
                <table className="table table-dark ">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Udhari</th>
                            <th>Udhari/ETH</th>      
                        </tr>
                    </thead>
                    {this.props.filledOrdersLoaded ? showFilledOrders(this.props.filledOrders):<tbody></tbody>}
                </table>
              </div>
            </div>
        )
    }
}

function mapStateToProps(state){
  

    return{
        filledOrdersLoaded: filledOrdersLoadedSelector(state),
        filledOrders: filledOrdersSelector(state)
    }
}

export default connect(mapStateToProps)(Trades)
import Web3 from "web3/dist/web3.min";
import UdhariToken from '../abis/UdhariToken.json'
import Exchange from '../abis/Exchange.json'

import { web3Loaded,
    web3AccountLoaded,
    tokenLoaded,
    exchangeLoaded,
    cancelledOrdersLoaded,
    filledOrdersLoaded,
    allOrdersLoaded,
    orderCancelling,
    orderCancelled,
    orderFilling,
    orderFilled,
    etherBalanceLoaded,
    tokenBalanceLoaded,
    exchangeEtherBalanceLoaded,
    exchangeTokenBalanceLoaded,
    balancesLoaded,
    balancesLoading
} from "./actions";

import { ETHER_address, tokensConverter } from "../helpers";

//WEB3
 export const loadWeb3= (dispatch) => {
    const web3 = new Web3(Web3.givenProvider || "http://localhost:7545");
    dispatch(web3Loaded(web3))
    return web3
 }

 //load Accounts
export const loadAccount= async (web3,dispatch) => {
    const accounts= await web3.eth.getAccounts()
    const account= accounts[0]
    dispatch(web3AccountLoaded(account))
    return account
}

export const loadToken= async (web3,networkId,dispatch) => {
    try{
        const token=new web3.eth.Contract(UdhariToken.abi, UdhariToken.networks[networkId].address)
        dispatch(tokenLoaded(token))
        return token
    } catch(error){
        console.log("contract not deployed to the current network. please select another network with metamask")
        return null
    }
}



//Exchange
export const loadExchange= async (web3,networkId,dispatch) => {
    try{
        const exchange=new web3.eth.Contract(Exchange.abi, Exchange.networks[networkId].address)
        dispatch(exchangeLoaded(exchange))
        return exchange
    } catch(error){
        window.alert("contract not deployed to the current network. please select another network with metamask")
        return null
    }
}

export const loadAllOrders= async (exchange,dispatch) => {
    //fetch cancelled orders with 'cancel' event stream
    const cancelStream= await exchange.getPastEvents('Cancel',{fromBlock: 0, toBlock: 'latest'})
    //format cancelled orers
    const cancelledOrders= cancelStream.map((event) => event.returnValues)
    //add cancelled oredrs to redux store
    dispatch(cancelledOrdersLoaded(cancelledOrders))


    //fetch filled order with 'trade' event stream
    const tradeStream= await exchange.getPastEvents('Trade',{fromBlock: 0, toBlock: 'latest'})
    //format filled orers
    const filledOrders= tradeStream.map((event) => event.returnValues)
    //add filled oredrs to redux store
    dispatch(filledOrdersLoaded(filledOrders))

    //fetch all orders with 'order' stream
    const orderStream= await exchange.getPastEvents('Order',{fromBlock: 0, toBlock: 'latest'})
    //format orders orers
    const allOrders= orderStream.map((event) => event.returnValues)
    //add open oredrs to redux store
    dispatch(allOrdersLoaded(allOrders))
}

export const subscribeToEvent= async (exchange,dispatch)=>{
    exchange.events.Cancel({},(error,event) => {
        dispatch(orderCancelled(event.returnValues))
    })
    exchange.events.Trade({},(error,event) => {
        dispatch(orderFilled(event.returnValues))
    })
    exchange.events.Deposit({},(error,event) => {
        dispatch(balancesLoaded())
    })
    exchange.events.Withdraw({},(error,event) => {
        dispatch(balancesLoaded())
    })
}

//Cancel Order
export const cancelOrder = (dispatch, exchange, order, account) => {
    exchange.methods.cancelOrder(order.id).send({ from: account })
    .on('transactionHash', (hash) => {
       dispatch(orderCancelling())
    })
    .on('error', (error) => {
      console.log(error)
      window.alert('There was an error!')
    })
}

//fill Order
export const fillOrder = (dispatch, exchange, order, account) => {
    exchange.methods.fillOrder(order.id).send({ from: account })
    .on('transactionHash', (hash) => {
       dispatch(orderFilling())
    })
    .on('error', (error) => {
      console.log(error)
      window.alert('There was an error!')
    })
}

//Loads Balance
export const loadBalances = async (dispatch,web3,exchange,token,account) => {
    if(typeof account !== 'undefined') {
        // Ether balance in wallet
        const etherBalance = await web3.eth.getBalance(account)
        dispatch(etherBalanceLoaded(etherBalance))
  
        // Token balance in wallet
        const tokenBalance = await token.methods.balanceOf(account).call()
        dispatch(tokenBalanceLoaded(tokenBalance))
  
        // Ether balance in exchange
        const exchangeEtherBalance = await exchange.methods.balanceOf(ETHER_address, account).call()
        dispatch(exchangeEtherBalanceLoaded(exchangeEtherBalance))
  
        // Token balance in exchange
        const exchangeTokenBalance = await exchange.methods.balanceOf(token.options.address, account).call()
        dispatch(exchangeTokenBalanceLoaded(exchangeTokenBalance))
  
        // Trigger all balances loaded
        dispatch(balancesLoaded())
      } else {
        window.alert('Please login with MetaMask')
      }
}
  

export const depositEther = (dispatch, exchange, web3, amount, account) => {
    exchange.methods.depositEther().send({ from: account,  value: web3.utils.toWei(amount, 'ether') })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
      window.location.reload(false)
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
}

export const withdrawEther = (dispatch, exchange, web3, amount, account) => {
    exchange.methods.withdrawEther(web3.utils.toWei(amount, 'ether')).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
      window.location.reload(false)
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
}

export const depositToken = (dispatch, exchange, web3, token, amount, account) => {
    amount = web3.utils.toWei(amount, 'ether')
  
    token.methods.approve(exchange.options.address, amount).send({ from: account })
    .on('transactionHash', (hash) => {
      exchange.methods.depositToken(token.options.address, amount).send({ from: account })
      .on('transactionHash', (hash) => {
        dispatch(balancesLoading())
        window.location.reload(false)
      })
      .on('error',(error) => {
        console.error(error)
        window.alert(`There was an error!`)
      })
    })
  }
  
  export const withdrawToken = (dispatch, exchange, web3, token, amount, account) => {
    exchange.methods.withdrawTokens(token.options.address, web3.utils.toWei(amount, 'ether')).send({ from: account })
    .on('transactionHash', (hash) => {
      dispatch(balancesLoading())
      window.location.reload(false)
    })
    .on('error',(error) => {
      console.error(error)
      window.alert(`There was an error!`)
    })
  }
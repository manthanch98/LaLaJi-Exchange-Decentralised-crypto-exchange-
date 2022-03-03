import {create, filter, get, groupBy, reject} from 'lodash'
import { createSelector } from 'reselect'
import {ETHER_address ,tokensConverter,GREEN,RED, formatBalance } from '../helpers'
import moment from 'moment'
import _ from 'lodash'

//Accouunt Loaded
const account = state => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

//WEb3 Selector
const web3= state => get(state,'web3.connection')
export const web3Selector= createSelector(web3,w=>w)

//UdhariToken Loaded?
const tokenLoaded= state => get(state,'token.loaded',false)
export const tokenLoadedSelector= createSelector(tokenLoaded,tl=>tl)

//token contract Selector
const token= state => get(state,'token.contract') 
export const tokenSelector= createSelector(token,t=>t)

//Exchange loaded?
const exchangeLoaded= state => get(state,'exchange.loaded',false) 
export const exchangeLoadedSelector= createSelector(exchangeLoaded,el=>el)

//Exchange contract Selector
const exchange= state => get(state,'exchange.contract') 
export const exchangeSelector= createSelector(exchange,e=>e)

//UdhariToken,Exchange Contract Selector
export const contractsLoadedSelector= createSelector(
    tokenLoaded,
    exchangeLoaded,
    (tl,el) =>(tl&&el)
)


////////////////////////////////////////////////////////////
//All Orders Selector
const allOrdersLoaded = state => get(state,'exchange.allOrders.loaded',false)
const allOrders= state => get(state,'exchange.allOrders.data',[])

////////////////////////////////////////////////////////////
//Cancelled Order Selector
const cancelledOrdersLoaded = state => get(state,'exchange.cancelledOrders.loaded',false)
export const cancelledOrdersLoadedSelector= createSelector(cancelledOrdersLoaded,loaded=> loaded)

const cancelledOrders = state => get(state,'exchange.cancelledOrders.data',[])
export const cancelledOrdersSelector= createSelector(cancelledOrders,o=>o)


//////////////////////////////////////////////////////////////
//Filled Orders Selector
const filledOrdersLoaded = state => get(state,'exchange.filledOrders.loaded',false)
export const filledOrdersLoadedSelector= createSelector(filledOrdersLoaded,loaded=> loaded)

const filledOrders= state => get(state,'exchange.filledOrders.data',[])
export const filledOrdersSelector= createSelector(
    filledOrders,
    (orders) => {
        //sort orders by date
        orders= orders.sort((a,b)=> a.timestamp - b.timestamp)


        //decorate order
        orders= decorateFilledOrders(orders)

        //sort orders by date desvending for display
        orders= orders.sort((a,b)=> b.timestamp - a.timestamp)
        return orders
    }
)

///////////////////////////////////////////////////////////////////
//Decorate Orders
const decorateFilledOrders = (orders) => {
    // Track previous order to compare history
    let previousOrder = orders[0]
    return(
      orders.map((order) => {
        order = decorateOrder(order)
        order = decorateFilledOrder(order, previousOrder)
        previousOrder = order // Update the previous order once it's decorated
        return order
      })
    )
  }


const decorateFilledOrder = (order, previousOrder) => {
    return({
      ...order,
      tokenPriceClass: tokenPriceClass(order.tokenPrice, order.id, previousOrder)
    })
  }


const decorateOrder = (order) => {
    let etherAmount
    let tokenAmount
  
    if(order.tokenGive == ETHER_address) {
      etherAmount = order.amountGive
      tokenAmount = order.amountGet
    } else {
      etherAmount = order.amountGet
      tokenAmount = order.amountGive
    }
    
    // Calculate token price to 5 decimal places
    const precision = 100000
    let tokenPrice = (etherAmount / tokenAmount)
    tokenPrice = Math.round(tokenPrice * precision) / precision
  
    return({
      ...order,
      etherAmount: tokensConverter(etherAmount),
      tokenAmount: tokensConverter(tokenAmount),
      tokenPrice,
      formattedTimestamp: moment.unix(order.timestamp).format('h:mm:ss a M/D')
    })
}

const tokenPriceClass = (tokenPrice, orderId, previousOrder) => {
    // Show green price if only one order exists
    if(previousOrder.id === orderId) {
      return GREEN
    }
  
    // Show green price if order price higher than previous order
    // Show red price if order price lower than previous order
    if(previousOrder.tokenPrice <= tokenPrice) {
      return GREEN // success
    } else {
      return RED // danger
    }
}

const openOrders = state => {
  const all= allOrders(state)
  const cancelled= cancelledOrders(state)
  const filled= filledOrders(state)

  const openOrders= reject(all,(order)=>{
    const orderFilled= filled.some((o) => o.id === order.id)
    const orderCancelled= cancelled.some((o) => o.id === order.id)
    return(orderFilled || orderCancelled)
  })
  return openOrders
}

const orderBookLoaded = state => cancelledOrdersLoaded(state) && filledOrdersLoaded(state) && allOrdersLoaded(state)
export const orderBookLoadedSelector= createSelector(orderBookLoaded,loaded=>loaded)

//Create Order book
export const orderBookSelector= createSelector(
  openOrders,
  (orders)=>{
    //Decorate Orders
    orders= decorateOrderBookOrders(orders)
    //Group orders by "ordderType"
    orders= groupBy(orders,'orderType')
    //fetch buy orders
    const buyOrders= get(orders,'buy',[])
    //sort buy orderes by token prie
    orders={
      ...orders,
      buyOrders:buyOrders.sort((a,b)=> b.tokenPrice-a.tokenPrice)
    }
    //fetch sell orders
    const sellOrders= get(orders,'sell',[])
    //sort sell orderes by token prie
    orders={
      ...orders,
      sellOrders:sellOrders.sort((a,b)=> b.tokenPrice-a.tokenPrice)
    }
    return orders
  }
)

const decorateOrderBookOrders= (orders) => {
  return(
    orders.map((order) => {
      order= decorateOrder(order)
      order= decorateOrderBookOrder(order)
      return (order)
    })
  )
}

const decorateOrderBookOrder= (order) => {
  const orderType= order.tokenGive === ETHER_address ? 'buy':'sell'
  return({
    ...order,
    orderType,
    orderTypeAction: (orderType ==='buy' ? GREEN:RED),
    orderFillAction: orderType === 'buy' ? 'sell':'buy'
  })
}

export const myFilledOrdersLoadedSelector = createSelector(filledOrdersLoaded, loaded => loaded)

export const myFilledOrdersSelector = createSelector(
  account,
  filledOrders,
  (account, orders) => {
    // Find our orders
    orders= orders.filter(order=> _.isEqual(order.user,account))
    // Sort by date ascending
    orders = orders.sort((a,b) => a.timestamp - b.timestamp)
    // Decorate orders - add display attributes
    orders = decorateMyFilledOrders(orders, account)
    return orders
  }
)

const decorateMyFilledOrders = (orders, account) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyFilledOrder(order, account)
      return(order)
    })
  )
}

const decorateMyFilledOrder = (order, account) => {
  const myOrder = order.user === account

  let orderType
  if(myOrder) {
    orderType = order.tokenGive === ETHER_address ? 'buy' : 'sell'
  } else {
    orderType = order.tokenGive === ETHER_address ? 'sell' : 'buy'
  }

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED),
    orderSign: (orderType === 'buy' ? '+' : '-')
  })
}

export const myOpenOrdersLoadedSelector = createSelector(orderBookLoaded, loaded => loaded)

export const myOpenOrdersSelector = createSelector(
  account,
  openOrders,
  (account, orders) => {
    // Filter orders created by current account
    orders= orders.filter(order=> _.isEqual(order.user,account))
    // Decorate orders - add display attributes
    orders = decorateMyOpenOrders(orders)
    // Sort orders by date descending
    orders = orders.sort((a,b) => b.timestamp - a.timestamp)
    return orders
    
  }
)



const decorateMyOpenOrders = (orders, account) => {
  return(
    orders.map((order) => {
      order = decorateOrder(order)
      order = decorateMyOpenOrder(order, account)
      return(order)
    })
  )
}

const decorateMyOpenOrder = (order, account) => {
  let orderType = order.tokenGive === ETHER_address ? 'buy' : 'sell'

  return({
    ...order,
    orderType,
    orderTypeClass: (orderType === 'buy' ? GREEN : RED)
  })
}

const orderCancelling = state => get(state, 'exchange.orderCancelling', false)
export const orderCancellingSelector = createSelector(orderCancelling, status => status)



const orderFilling = state => get(state, 'exchange.orderFilling', false)
export const orderFillingSelector = createSelector(orderFilling, status => status)

//Balances
const balancesLoading = state => get(state, 'exchange.balancesLoading', true)
export const balancesLoadingSelector = createSelector(balancesLoading, status => status)

const etherBalance = state => get(state, 'web3.Etherbalance', 0)
export const etherBalanceSelector = createSelector(
  etherBalance,
  (balance) => {
    return formatBalance(balance)
  }
)

const tokenBalance = state => get(state, 'web3.Tokenbalance', 0)
export const tokenBalanceSelector = createSelector(
  tokenBalance,
  (balance) => {
    ////////////////////////////////
    console.log("ABCD")
    return formatBalance(balance)
  }
)

const exchangeEtherBalance = state => get(state, 'exchange.etherBalance', 0)
export const exchangeEtherBalanceSelector = createSelector(
  exchangeEtherBalance,
  (balance) => {
    return formatBalance(balance)
  }
)

const exchangeTokenBalance = state => get(state, 'exchange.tokenBalance', 0)
export const exchangeTokenBalanceSelector = createSelector(
  exchangeTokenBalance,
  (balance) => {
    return formatBalance(balance)
  }
)


const  etherDepositAmount= state=> get(state,'exchange.etherDepositAmount',null)
export const etherDepositAmountSelector= createSelector(etherDepositAmount,amount=>amount)

const etherWithdrawAmount = state => get(state, 'exchange.etherWithdrawAmount', null)
export const etherWithdrawAmountSelector = createSelector(etherWithdrawAmount, amount => amount)

const tokenDepositAmount = state => get(state, 'exchange.tokenDepositAmount', null)
export const tokenDepositAmountSelector = createSelector(tokenDepositAmount, amount => amount)

const tokenWithdrawAmount = state => get(state, 'exchange.tokenWithdrawAmount', null)
export const tokenWithdrawAmountSelector = createSelector(tokenWithdrawAmount, amount => amount)

const buyOrder= state=> get(state,'exchange.buyOrder',{})
export const buyOrderSelector= createSelector(buyOrder,order=>order)

const sellOrder= state=> get(state,'exchange.sellOrder',{})
export const sellOrderSelector= createSelector(sellOrder,order=>order)
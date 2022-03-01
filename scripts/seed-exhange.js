
const wait= (seconds) => {
    const milliseconds= seconds*1000
    return new Promise(resolve => setTimeout(resolve,milliseconds))
}

const tokensConverter= (n) => {
    return new web3.utils.toBN(web3.utils.toWei(n.toString(),'ether'))
}

const ETHER_address= "0x0000000000000000000000000000000000000000"


const Token= artifacts.require("UdhariToken")
const Exchange= artifacts.require("Exchange")


module.exports = async function(callback){
    try{
        //Fetch accouts from wallet
        const accounts= await web3.eth.getAccounts()

        //fetch the deployed token
        const token= await Token.deployed()
        console.log('Token Fetched',token.address)

        //fetch the deployed exchange
        const exchange= await Exchange.deployed()
        console.log('Exchange Fetched',exchange.address)

        //Give tokens to accouts[1]
        const sender= accounts[0]
        const receiver= accounts[1]
        let amount = web3.utils.toWei('10000','ether')

        await token.transfer(receiver,amount,{from: sender})
        console.log(`Transferred ${amount} tokens from ${sender} to ${receiver}`)  //Correct it

        //setup exchange users
        const user1= accounts[0]
        const user2= accounts[1]

        //User1 deposit Ether
        amount =1 
        await exchange.depositEther({from: user1, value: tokensConverter(amount)})
        console.log(`Deposited ${amount} Ether from ${user1}`)

        //user2 approves tokens
        amount= 1000
        await token.approve(exchange.address,tokensConverter(amount),{from: user2})
        console.log(`Approved ${amount} tokens from ${user2}`)

        //user2 deposits Tokens
        await exchange.depositToken(token.address,tokensConverter(amount),{from: user2})
        console.log(`Depossited ${amount} tokens from ${user2}`)

        //////////////////////////////////////////////////////////////////////
        //Seed a cancelled orders

        //user1 makes order to get tokens
        let result
        let orderId

        result= await exchange.makeOrder(token.address,tokensConverter(100),ETHER_address,tokensConverter(0.1),{from: user1})
        console.log(`make order from ${user1}`)

        //User 1 cancelles order
        orderId= result.logs[0].args.id
        await exchange.cancelOrder(orderId,{from: user1})
        console.log(`cancelled order from ${user1}`)

        /////////////////////////////////////////////////////////////////////
        //Send Filled order

        //User1 makes order
        result = await exchange.makeOrder(token.address,tokensConverter(100),ETHER_address,tokensConverter(0.1),{from: user1})
        console.log(`made order from ${user1}`)

        //User2 fills order
        orderId= result.logs[0].args.id
        await exchange.fillOrder(orderId,{from:user2})
        console.log(`filled order from ${user1}`)

        //wait 1 second
        await wait(1)

        //user 1 makes another order
        result= await exchange.makeOrder(token.address,tokensConverter(50),ETHER_address,tokensConverter(0.01),{from: user1})
        console.log(`made order from ${user1}`)

        //user2 fills another order
        orderId= result.logs[0].args.id
        await exchange.fillOrder(orderId,{from: user2})

        //wait 1 second
        await wait(1)

        //user1 makes final order
        result= await exchange.makeOrder(token.address,tokensConverter(200),ETHER_address,tokensConverter(0.15),{from: user1})
        console.log(`made order from ${user1}`)

        //user2 fills final order
        orderId= result.logs[0].args.id
        await exchange.fillOrder(orderId,{from: user2})
        console.log(`filled order from ${user1}`)

        //wait 1 second
        await wait(1)

        /////////////////////////////////////////////////////////////////////
        //Seed Open Orders

        //user1 makes 10 order
        for(let i=1;i<=10;i++){
            result= await exchange.makeOrder(token.address,tokensConverter(10*i),ETHER_address,tokensConverter(0.01),{from: user1})
            console.log(`make order from ${user1}`)
            await wait(1)
        }

        //user2 makes 10 orders
        for(let i=1;i<=10;i++){
            result= await exchange.makeOrder(ETHER_address,tokensConverter(0.01),token.address,tokensConverter(10*i),{from: user1})
            console.log(`make order from${user2}`)
            await wait(1)
        }

    }catch(err){
        console.log(err)
    }


    callback()
}
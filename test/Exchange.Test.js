import { use } from 'chai'
import { before, iteratee } from 'lodash'
import Web3 from 'web3'
import {tokensConverter, EVM_Revert, ETHER_address} from './helpers'

const Exchange= artifacts.require('./Exchange')
const UdhariToken= artifacts.require('./UdhariToken')
require('chai').use(require('chai-as-promised')).should()



contract('Exchange',([deployer,feeAccount, user1,user2]) => {
    let exchange
    let myToken
    const feePercent= 10

    beforeEach(async () => {
        myToken= await UdhariToken.new()
        exchange= await Exchange.new(feeAccount, feePercent)
        myToken.transfer(user1, tokensConverter(100), {from: deployer})
    })

    describe('Deployment', () => {
        it('Tracks the Fess account', async () => {
            const result= await exchange.feeAccount()
            result.should.equal(feeAccount)
        })

        it('Tracks the Fess perentage', async () => {
            const result= await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('fallback', () => {
        it('reverts when Ether is sent', async() => {
            await exchange.sendTransaction({value:1, from: user1}).should.be.rejectedWith(EVM_Revert)
        })
    })

    describe('Depositing ether', async() => {
        let result
        let amount

        beforeEach(async () => {
            amount= tokensConverter(1)
            result= await exchange.depositEther({from: user1, value: amount})
        })

        it('Tracks the ether deposit', async() => {
            const balance= await exchange.tokens(ETHER_address, user1)
            balance.toString().should.equal(amount.toString())
        })

        it("emit a Deposit event", async() => {
            const log= result.logs[0]
            log.event.should.equal('Deposit')

            const event = log.args
            event.token.toString().should.equal(ETHER_address,'Token address is correct')
            event.user.toString().should.equal(user1,"User address is correct")
            event.amount.toString().should.equal(amount.toString(),"Amount is correct")
            event.balance.toString().should.equal(amount.toString(), 'Balance is coorect')

        })

    })

    describe('Withdrawing ether', async() => {
        let result
        let amount

        beforeEach(async () => {
            amount= tokensConverter(1)
            await exchange.depositEther({from: user1, value: amount})
        })

        describe('Success', () => {
            beforeEach(async() => {
                result= await exchange.withdrawEther(amount,{from: user1})
            })

            it('Withdraw ether funds', async() =>{
                const balance= await exchange.tokens(ETHER_address,user1)
                balance.toString().should.equal('0')
            })

            it("emit a Withdraw event", async() => {
                const log= result.logs[0]
                log.event.should.equal('Withdraw')
                const event = log.args
                event.token.toString().should.equal(ETHER_address,'Token address is correct')
                event.user.toString().should.equal(user1,"User address is correct")
                event.amount.toString().should.equal(amount.toString(),"Amount is correct")
                event.balance.toString().should.equal('0', 'Balance is correct')
    
            })

        })

        describe('Failure', () =>{
            it('rejets withdraw for isufficient balance' ,async() =>{
                await exchange.withdrawEther(tokensConverter(100), {from: user1}).should.be.rejectedWith(EVM_Revert)
            })
        })

    })

    describe('Depositing tokens', () => {
        let result
        let amount

       

       describe('Success', () => {

        beforeEach(async () => {
            amount= tokensConverter(10)
            await myToken.approve(exchange.address, tokensConverter(10), {from: user1})
            result = await exchange.depositToken(myToken.address,tokensConverter(10),{from: user1})
        })

        it('tracks the token deposit', async () => {
            let balance
            balance= await myToken.balanceOf(exchange.address)
            balance.toString().should.equal(amount.toString())
            balance= await exchange.tokens(myToken.address, user1)
            balance.toString().should.equal(amount.toString())
        })

        it("emit a Deposit event", async() => {
            const log= result.logs[0]
            log.event.should.equal('Deposit')

            const event = log.args
            event.token.toString().should.equal(myToken.address,'Token address is correct')
            event.user.toString().should.equal(user1,"User address is correct")
            event.amount.toString().should.equal(tokensConverter(10).toString(),"Amount is correct")
            event.balance.toString().should.equal(tokensConverter(10).toString(), 'Balance is coorect')

        })

       })

       describe('Failure', () => {

        it('rejects Ether Deposits', async() => {
            await exchange.depositToken(ETHER_address,tokensConverter(10), {from: user1}).should.be.rejectedWith(EVM_Revert)
        })

        it('Fails when no tokens are approved', async() => {
            await exchange.depositToken(myToken.address,tokensConverter(10),{from: user1}).should.be.rejectedWith(EVM_Revert)
        })
           
    })

    })

    describe('Withdrawing tokens', () => {
        let result
        let amount

       describe('Success', () => {

        beforeEach(async () => {
            amount= tokensConverter(10)
            await myToken.approve(exchange.address, tokensConverter(10), {from: user1})
            await exchange.depositToken(myToken.address,tokensConverter(10),{from: user1})

            result= await exchange.withdrawTokens(myToken.address, amount,{from: user1})
        })

        it('Withdraw token funds', async () => {
            const balance= await exchange.tokens(myToken.address, user1)
            balance.toString().should.equal('0')
        })

        it("emit a Withdraw event", async() => {
            const log= result.logs[0]
            log.event.should.equal('Withdraw')

            const event = log.args
            event.token.toString().should.equal(myToken.address,'Token address is correct')
            event.user.toString().should.equal(user1,"User address is correct")
            event.amount.toString().should.equal(tokensConverter(10).toString(),"Amount is correct")
            event.balance.toString().should.equal('0', 'Balance is coorect')

        })

       })

       describe('Failure', () => {

        it('rejects Ether withdraws', async() => {
            await exchange.withdrawTokens(ETHER_address,tokensConverter(10), {from: user1}).should.be.rejectedWith(EVM_Revert)
        })

        it('Fails for insufficient balances', async() => {
            await exchange.withdrawTokens(myToken.address,tokensConverter(10),{from: user1}).should.be.rejectedWith(EVM_Revert)
        })
           
    })

    })

    describe('checking balances', async() =>{
        beforeEach(async() => { 
            exchange.depositEther({from: user1, value: tokensConverter(1)})
        })

        it('returns user balance', async() => {
            const result= await exchange.balanceOf(ETHER_address, user1)
            result.toString().should.equal(tokensConverter(1).toString())
        })
    })

    describe('making order', async()=> {
        let result

        beforeEach(async() => {
        result = await exchange.makeOrder(myToken.address, tokensConverter(1),ETHER_address,tokensConverter(1),{from: user1})

        })

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal('1')

            const order= await exchange.orders('1')
            order.id.toString().should.equal('1')
            order.user.toString().should.equal(user1.toString())
            order.tokenGet.toString().should.equal(myToken.address.toString())
            order.amountGet.toString().should.equal(tokensConverter(1).toString())
            order.tokenGive.toString().should.equal(ETHER_address)
            order.amountGive.toString().should.equal(tokensConverter(1).toString())
        })

        it("emit a Order event", async() => {
            const log= result.logs[0]
            log.event.should.equal('Order')
        
            const event = log.args
            event.id.toString().should.equal('1')
            event.user.toString().should.equal(user1.toString())
            event.tokenGet.toString().should.equal(myToken.address.toString())
            event.amountGet.toString().should.equal(tokensConverter(1).toString())
            event.tokenGive.toString().should.equal(ETHER_address)
            event.amountGive.toString().should.equal(tokensConverter(1).toString())
        })
    })

    describe('Order ations', async () => {
        beforeEach(async() =>{
            await exchange.depositEther({from: user1, value: tokensConverter(1)})
            await myToken.transfer(user2,tokensConverter(100),{from: deployer})
            await myToken.approve(exchange.address,tokensConverter(2),{from: user2})
            await exchange.depositToken(myToken.address,tokensConverter(2),{from: user2})
            await exchange.makeOrder(myToken.address,tokensConverter(1),ETHER_address,tokensConverter(1),{from: user1})

        })

        describe('Filing Order', async() => {
            let result

            describe('Success', async() => {
                beforeEach(async() => {
                    result= await exchange.fillOrder('1',{from: user2})
                })

                it('executes the trade and charge fees', async () => {
                    let balance
                    balance= await exchange.balanceOf(myToken.address,user1)
                    balance.toString().should.equal(tokensConverter(1).toString(),'User1 received tokens')
                    balance= await exchange.balanceOf(ETHER_address,user2)
                    balance.toString().should.equal(tokensConverter(1).toString(),'User2 received ether')
                    balance= await exchange.balanceOf(ETHER_address , user1)
                    balance.toString().should.equal('0','User2 Ether deducted')
                    balance= await exchange.balanceOf(myToken.address, user2)
                    balance.toString().should.equal(tokensConverter(0.9).toString(),'User2 tokens deducted with fee applied')
                    const feeAccount= await exchange.feeAccount()
                    balance= await exchange.balanceOf(myToken.address, feeAccount)
                    balance.toString().should.equal(tokensConverter(0.1).toString(),'FeeAccount received fee')
                })

                it('Updates filled order', async () => {
                    const orderFilled= await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })

                it('Emits a "Trade" event', async () => {
                    const log = result.logs[0]
                    log.event.should.equal('Trade')
                    const event = log.args
                    event.id.toString().should.equal('1')
                    event.user.should.equal(user1)
                    event.tokenGet.toString().should.equal(myToken.address)
                    event.amountGet.toString().should.equal(tokensConverter(1).toString())
                    event.tokenGive.should.equal(ETHER_address)
                    event.amountGive.toString().should.equal(tokensConverter(1).toString())
                    event.userFill.should.equal(user2)
                    event.timestamp.toString().length.should.be.at.least(1)
                })


            })
        })

        describe('Cancelling orders', async () => {
            let result
    
            describe('Succcess', async () => {
                beforeEach(async() =>{
                    result= await exchange.cancelOrder('1', {from: user1})
                })
    
                it('Updates cancelled orders', async () => {
                    const orderCancelled= await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })
    
            })
    
            describe('Failure', async () => {
                it('rejects invalid order id', async() => {
                    const invalidOrderId=999
                    await exchange.cancelOrder(invalidOrderId,{from: user1}).should.be.rejectedWith(EVM_Revert)
                })

                it('rejects Unauthorized cancelation', async () => {
                    await exchange.cancelOrder('1',{from: user2}).should.be.rejectedWith(EVM_Revert)
                })

            })
    
        })

    })



})
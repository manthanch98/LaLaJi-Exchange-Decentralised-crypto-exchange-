const { result, before } = require('lodash')
const { default: Web3 } = require('web3')
const _deploy_contracts = require('../migrations/2_deploy_contracts')

import {tokensConverter, EVM_Revert} from './helpers'

const UdhariToken= artifacts.require('./UdhariToken')
require('chai').use(require('chai-as-promised')).should()



contract('UdhariToken',([deployer,receiver,exchange]) => {
    const name= 'Udhari'
    const symbol= 'UDH'
    const decimals= '18'
    const totalSupply= tokensConverter(10000000).toString()
    let myToken

    beforeEach(async () => {
        myToken= await UdhariToken.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            const result = await myToken.name()
            result.should.equal(name)
        })

        it('tracks the symbol', async() => {
            const result = await myToken.symbol()
            result.should.equal(symbol)
        })

        it('tracks the decimals', async() => {
            const result = await myToken.decimals()
            result.toString().should.equal(decimals)
        })

        it('tracks the totalSupply', async() => {
            const result = await myToken.totalSupply()
            result.toString().should.equal(totalSupply)
        })
        
        it('assigns totalSupply to deployer', async() => {
            const result = await myToken.balanceOf(deployer)
            result.toString().should.equal(totalSupply)
        })

    })

    describe('Sending Tokens', () => {
        let amount
        let result

        beforeEach(async () => {
            amount= tokensConverter(100)
            result= await myToken.transfer(receiver,amount, {from:deployer})
        })

        describe('Success', async() => {
            it("transfers token balance", async() => {
                let balanceOf
                
                balanceOf= await myToken.balanceOf(deployer)
                balanceOf.toString().should.equal(tokensConverter(9999900).toString())
                balanceOf= await myToken.balanceOf(receiver)
                balanceOf.toString().should.equal(tokensConverter(100).toString())
    
            })
    
            it("emit a transfer event", async() => {
                const log= result.logs[0]
                log.event.should.equal('Transfer')
    
                const event = log.args
                event._from.toString().should.equal(deployer,'from is correct')
                event._to.toString().should.equal(receiver,"to is correct")
                event._value.toString().should.equal(amount.toString(),"value is correct")
    
            })
        })

        describe("Failure", async() => {
            it('rejects insufficient balance', async () => {
                let invalidAmount
                invalidAmount= tokensConverter(1000000000)
                await myToken.transfer(receiver,invalidAmount,{from: deployer}).should.be.rejectedWith(EVM_Revert);

            })

            it("rejects invalid receiver address", async () => {
                await myToken.transfer(0x0,amount, {from: deployer}).should.be.rejected;
            })
        })

    })


    describe('approving tokens', () => {
        let amount;
        let result;
        
        beforeEach(async() => {
            amount= tokensConverter(100)
            result= await myToken.approve(exchange, amount,{from: deployer})
        })

        describe('Success',() => {
            it("allocates an allowance for delegated token spending", async() => {
                const allowance= await myToken.allowance(deployer,exchange)
                allowance.toString().should.equal(amount.toString())
            })

            it("emit an approval event", async() => {
                const log= result.logs[0]
                log.event.should.equal('Approval')
    
                const event = log.args
                event._owner.toString().should.equal(deployer,'Owner is correct')
                event._spender.toString().should.equal(exchange,"Spender is correct")
                event._value.toString().should.equal(amount.toString(),"value is correct")
    
            })

        })


        describe('Failure', () => {
            it("rejects invalid spender",async() => {
                await myToken.approve(0x0, amount, {from: deployer}).should.be.rejected
            })
        })
    })
    
    describe("Delegated token transfer", () => {
        let amount
        let result

        beforeEach(async () => {
            amount= tokensConverter(100)
            await myToken.approve(exchange,amount,{from: deployer})
        })

        describe('Success', async() => {
            beforeEach(async() => {
                result= await myToken.transferFrom(deployer,receiver,amount,{from: exchange})
            })

            it("transfers token balance", async() => {
                let balanceOf
                balanceOf= await myToken.balanceOf(deployer)
                balanceOf.toString().should.equal(tokensConverter(9999900).toString())
                balanceOf= await myToken.balanceOf(receiver)
                balanceOf.toString().should.equal(tokensConverter(100).toString())
    
            })

            it("resets allowance", async() => {
                const allowance= await myToken.allowance(deployer,exchange)
                allowance.toString().should.equal('0')
            })
    
            it("emit a transfer event", async() => {
                const log= result.logs[0]
                log.event.should.equal('Transfer')
    
                const event = log.args
                event._from.toString().should.equal(deployer,'from is correct')
                event._to.toString().should.equal(receiver,"to is correct")
                event._value.toString().should.equal(amount.toString(),"value is correct")
    
            })
        })

        describe("Failure", async() => {
            it('rejects insufficient balance', async () => {
                let invalidAmount
                invalidAmount= tokensConverter(1000000000)
                await myToken.transferFrom(deployer, receiver,invalidAmount,{from: exchange}).should.be.rejectedWith(EVM_Revert);

            })

            it("rejects invalid receiver address", async () => {
                await myToken.transferFrom(deployer, 0x0,amount, {from: exchange}).should.be.rejected;
            })
        })

    })










})
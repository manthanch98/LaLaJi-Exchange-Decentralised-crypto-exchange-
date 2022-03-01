export const tokensConverter= (n) => {
    return new web3.utils.toBN(web3.utils.toWei(n.toString(),'ether'))
}

export const EVM_Revert= "Returned error: VM Exception while processing transaction: revert"

export const ETHER_address= "0x0000000000000000000000000000000000000000"
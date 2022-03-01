export const GREEN = 'success'
export const RED = 'danger'
export const DECIMALS = (10**18)

export const tokensConverter= (wei) => {
    if(wei) {
        return(wei / DECIMALS)
    }
}

export const ETHER_address= "0x0000000000000000000000000000000000000000"

export const formatBalance= (balance)=>{
    balance= tokensConverter(balance)
    balance= (Math.round(balance * 100) / 100).toFixed(2);
    return balance
}
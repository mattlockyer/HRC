
/********************************
Option 1
********************************/
//...
// in client
//...
const customNodeOptions = {
    rpcUrl: 'http://localhost:3000',
    chainId: net,
    //added fields
    chainName: 'Harmony',
    nativeSymbol: 'ONE',
    txPayloadMod: {
        index: 3,
        addParams: ['0x0', '0x0'],
    }
}
//...
//in fortmatic sdk
//...
const RLP = require('eth-lib/lib/rlp')
//...
if (txPayloadMod !== undefined) {
    let params = RLP.decode(params)
    params.splice(txPayload.index, 0, ...txPayload.addParams)
    params = [RLP.encode(params)]
}
//... sign and send
//...
//back in client
//...
const fm = new Fortmatic('pk_live_A6E8969B5067A9B8', customNodeOptions);
const web3 = new Web3(fm.getProvider());
//...


/********************************
Option 2 if there are security concerns (there might be...)
********************************/
//...
// in client
//...
const customNodeOptions = {
    rpcUrl: 'http://localhost:3000',
    chainId: net,
    //added fields
    chainName: 'Harmony',
    chainType: 'hmy',
    nativeSymbol: 'ONE',
    txPayload: {
        fromShardId: '0x0',
        toShardId: '0x0'
    }
}
//...
//in fortmatic sdk
//...
const RLP = require('eth-lib/lib/rlp')
//...
if (chainType === 'hmy') {
    let params = RLP.decode(params)
    //!!!probably should validate that txPayload.fromShardId and txPayload.toShardId are 32bits
    params.splice(3, 0, txPayload.fromShardId, txPayload.toShardId)
    params = [RLP.encode(params)]
    //... sign and send
}
//...
//back in client
//...
const fm = new Fortmatic('pk_live_A6E8969B5067A9B8', customNodeOptions);
const web3 = new Web3(fm.getProvider());
//...
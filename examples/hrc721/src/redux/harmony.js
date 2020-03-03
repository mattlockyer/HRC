import { UPDATE, reducer } from '../util/redux-util'
import { waitForInjected, getExtAccount } from '../util/hmy-util'
import { Harmony, HarmonyExtension } from '@harmony-js/core'
import { ChainID, ChainType } from '@harmony-js/utils'
import { getTokens, getMarket } from './hrc721'
import { crowdsaleInit, getRaised } from './crowdsale'


/********************************
TESTING FORTMATIC / WEB3 
********************************/
import Web3 from 'web3'
import Fortmatic from 'fortmatic';




import config from '../../config'
const { ENV, network, net, url } = config


//state
const defaultState = {
    harmony: null,
    hmy: null,
    hmyExt: null,
    active: null,
    minter: null,
    account: null,
    fortmatic: null,
    bech32Addresses: [],
    addresses: [],
    //app ui state, should be in app.js reducer (TBD)
    processing: false,
    dialogState: {
        open: false,
        title: '',
        content: null,
    },
}
const harmonyKeys = Object.keys(defaultState)
export const harmonyState = ({ harmonyReducer: { ...keys } }) => {
    Object.keys(keys).forEach((k) => {
        if (!harmonyKeys.includes(k)) delete keys[k]
    })
    return keys
}
/********************************
Functions / Actions
********************************/

export const updateDialogState = (dialogState) => async (dispatch) => {
    dispatch({ type: UPDATE, dialogState })
}
export const updateProcessing = (processing) => async (dispatch) => {
    dispatch({ type: UPDATE, processing })
}

/********************************
This is only enabled for localnet hmy e.g. Alice's account
********************************/

const oneToHexAddress = (hmy, address) => hmy.crypto.getAddress(address).basicHex
const hexToOneAddress = (hmy, address) => hmy.crypto.toBech32(address)

export const fortmaticTransfer = ({ amount, address }) => async (dispatch, getState) => {
    dispatch(updateProcessing(true))
    const { hmy, minter, fortmatic } = getState().harmonyReducer
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }
    /********************************
    TESTING FORTMATIC / WEB 3
    ********************************/
    const customNodeOptions = {
        //rpcUrl: 'http://localhost:9500',
        rpcUrl: 'http://localhost:3000',
        chainId: net,
    }
    const fm = new Fortmatic('pk_live_A6E8969B5067A9B8', customNodeOptions);
    const web3 = new Web3(fm.getProvider());
    //...
    let isUserLoggedIn = await fm.user.isLoggedIn();
    let provider
    if (isUserLoggedIn) {
        provider = fm.getProvider()
    } else {
        await fm.user.login()
        isUserLoggedIn = await fm.user.isLoggedIn();
        provider = fm.getProvider()
    }
    console.log(isUserLoggedIn)
    console.log('provider', provider)
    // Get user account wallet address first
    const accounts = await web3.eth.getAccounts()
    console.log('accounts', accounts)
    // Construct Ether transaction params

    const sendValue = web3.utils.toWei(amount, 'ether'); // Convert 1 ether to wei

    const txnParams = {
        from: fortmatic.address,
        to: minter.address,
        value: sendValue
    }
    
    // Send Ether transaction with web3
    web3.eth.sendTransaction(txnParams)
        .once('transactionHash', (hash) => { console.log(hash); })
        .once('receipt', (receipt) => { console.log(receipt); })

}

/********************************
This is only enabled for localnet hmy e.g. Alice's account
********************************/

export const transferONE = ({ amount, address }) => async (dispatch, getState) => {
    dispatch(updateProcessing(true))
    const { hmy, hmyExt, active } = getState().harmonyReducer
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }

    if (address.indexOf('0x')) address = hexToOneAddress(hmy, address)

    console.log(new hmy.utils.Unit(amount).asEther().toWei(),address)
    const harmony = active.isExt ? hmyExt : hmy
    const tx = harmony.transactions.newTx({
        to: address,
        value: new hmy.utils.Unit(amount).asEther().toWei(),
        gasLimit: '210000',
        shardID: 0,
        toShardID: 0,
        gasPrice: new hmy.utils.Unit('1').asGwei().toWei(),
    });
    const signedTX = await harmony.wallet.signTransaction(tx);
    signedTX.observed().on('transactionHash', (txHash) => {
        console.log('--- txHash ---', txHash);
    })
    .on('receipt', (receipt) => {
        console.log('--- receipt ---', receipt);
        const { active } = getState().harmonyReducer
        dispatch(getBalances(active))
        dispatch(updateProcessing(false))
    }).on('error', console.error)
    const [sentTX, txHash] = await signedTX.sendTransaction();
    const confirmedTX = await sentTX.confirm(txHash);
    console.log(confirmedTX)
}

export const setActive = (which) => async (dispatch, getState) => {
    const state = getState().harmonyReducer
    const active = state[which]
    if (!active) return
    const { hmy } = state
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }
    if (!active.isExt) {
        hmy.wallet.setSigner(active.address)
    }
    dispatch({ type: UPDATE, active })
    dispatch(getBalances(active))
}
export const getBalanceONE = (account) => async (dispatch, getState) => {
    const { hmy, hmyExt } = getState().harmonyReducer
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }

    if (account.address.indexOf('0x')) account.address = hexToOneAddress(hmy, address)

    let result
    if (account.isExt) {
        result = (await hmyExt.blockchain.getBalance({ address: account.address }).catch((err) => {
            console.log(err);
        })).result
    } else {
        result = (await hmy.blockchain.getBalance({ address: account.address }).catch((err) => {
            console.log(err);
        })).result
    }
    account.balanceONE = new hmy.utils.Unit(result).asWei().toEther()

    dispatch({ type: UPDATE, [account.name]: account })
}
export const getBalances = (account) => async (dispatch, getState) => {
    const { active } = getState().harmonyReducer
    dispatch(getBalanceONE(account || active))
    dispatch(getTokens(account || active))
    dispatch(getRaised(account || active))
}

export const harmonyInit = () => async (dispatch) => {
    console.log(url)
    const hmy = new Harmony(url, {
        chainType: ChainType.Harmony,
        chainId: net,
    })
    dispatch({ type: UPDATE, hmy })


    // // Create client and replace web3 provider
    // const fm = new Fortmatic('pk_live_A6E8969B5067A9B8');
    // // const web3 = new Web3(fm.getProvider());
    // console.log(fm)
    // console.log('provider', fm.getProvider())
    // console.log(hmy)
    // let isUserLoggedIn = await fm.user.isLoggedIn();
    // if (isUserLoggedIn) {
    //     console.log(fm.getProvider())
    // } else {
    //     fm.user.login().then(async () => {
    //         isUserLoggedIn = await fm.user.isLoggedIn();
    //         console.log(fm.getProvider())
    //     });
    // }

    // const fm = new Fortmatic('YOUR_API_KEY');

    // // End user customizes the ETH amount
    // fm.transactions.send({
    //     to: '0xe0cef4417a772512e6c95cef366403839b0d6d6d'
    // });

    // // End user customizes the destination
    // fm.transactions.send({
    //     amount: '56.10003',
    // });

    const harmony = await waitForInjected(1)
    let hmyExt
    if (harmony) {
        hmyExt = new HarmonyExtension(harmony, {
            chainId: net
        });
        console.log(hmyExt)
    }
    // 0x7c41e0668b551f4f902cfaec05b5bdca68b124ce
    const minter = hmy.wallet.addByPrivateKey('45e497bd45a9049bcb649016594489ac67b9f052a6cdf5cb74ee2427a60bf25e')
    minter.name = 'Alice'
    // 0xea877e7412c313cd177959600e655f8ba8c28b40
    let account
    if (!hmyExt) {
        account = hmy.wallet.addByMnemonic('surge welcome lion goose gate consider taste injury health march debris kick')
        account.name = 'Bob'
    } else {
        account = await getExtAccount(hmyExt)
        account.name = 'My Account'
    }

    const bech32Addresses = [account.bech32Address, minter.bech32Address]

    if (ENV !== 'local') {
        bech32Addresses.pop()
    }
    dispatch({ type: UPDATE,
        minter, account,
        bech32Addresses
    })

    //testing fortmatic
    const fortmatic = {
        name: 'fortmatic',
        address: '0xC9680844a5C16fed92fc78eE652Ad90B73D54819'
    }
    dispatch(getBalanceONE(fortmatic))


    dispatch(setActive('account'))
    if (ENV === 'local') {
        console.log("setting minter")
        dispatch(setActive('minter'))
    }

    dispatch(crowdsaleInit())

}

//reducer
export const harmonyReducer = (state = {
    ...defaultState
}, action) => reducer(state, action)

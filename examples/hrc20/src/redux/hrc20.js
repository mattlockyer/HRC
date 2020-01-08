import { UPDATE, reducer } from '../util/redux-util'
import HarmonyMintable from '../build/contracts/HarmonyMintable.json'
import {udpateProcessing, getBalances, updateProcessing} from './harmony'

//state
const defaultState = {
    tokenContract: null,
}
const hrc20Keys = Object.keys(defaultState)
export const hrc20State = ({ hrc20Reducer: { ...keys } }) => {
    Object.keys(keys).forEach((k) => {
        if (!hrc20Keys.includes(k)) delete keys[k]
    })
    return keys
}
const getContractInstance = (hmy, artifact) => {
    return hmy.contracts.createContract(artifact.abi, artifact.networks[2].address)
}
export const transferHRC = ({ amount, address }) => async (dispatch, getState) => {
    dispatch(updateProcessing(true))
    dispatch({ type: UPDATE })
    const { hmy, active } = getState().harmonyReducer
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }
    console.log(amount, address)
    const contract = await getContractInstance(hmy, HarmonyMintable)
    const tx = contract.methods.transfer(address, parseInt(amount)).send({
        from: active.address,
        gasLimit: '1000000',
        gasPrice: new hmy.utils.Unit('10').asGwei().toWei(),
    }).on('transactionHash', function(hash){
        console.log(hash)
    }).on('receipt', function(receipt){
        console.log(receipt)
    }).on('confirmation', function(confirmationNumber, receipt){
        console.log(confirmationNumber, receipt)
        const { active } = getState().hrc20Reducer
        dispatch(getBalances(active))
        dispatch(updateProcessing(false))
    }).on('error', console.error)
}

export const getBalanceHRC = (account) => async (dispatch, getState) => {
    const { hmy } = getState().harmonyReducer
    if (!hmy) {
        console.log('call loadContracts first')
        return
    }
    const contract = await getContractInstance(hmy, HarmonyMintable)
    const balance = await contract.methods.balanceOf(account.address).call({
        gasLimit: '210000',
        gasPrice: '100000',
    })
    
    account.balanceHRC = balance.toString()
    dispatch({ type: UPDATE, [account.name]: account })
}

//reducer
export const hrc20Reducer = (state = {
    ...defaultState
}, action) => reducer(state, action)

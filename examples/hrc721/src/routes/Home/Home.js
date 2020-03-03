import React, {useEffect} from 'react'
import { useDispatch } from 'react-redux'
import { setActive, bech32Addresses, fortmaticTransfer } from '../../redux/harmony'

import Form from '../../components/Form/Form'
import Inventory from './../../components/Inventory/Inventory'
import config from '../../../config'
const {ENV} = config

import { route, bubble, button } from './Home.module.scss'

export default function Home(props) {

    const {
        harmonyState: { active, fortmatic },
        hrc721State: { balances },
    } = props

    const dispatch = useDispatch()

    return (
        <div className={route}>



            <section>
                {active &&
                    <div className={bubble}>
                        <h3>{active.name}</h3>
                        <p>ONE: {active.balanceONE}</p>
                        { ENV === 'local' &&
                            <button 
                                onClick={() => dispatch(setActive(active.name === 'Alice' ? 'account' : 'minter'))}
                                className={button}
                            >Toggle User</button>
                        }
                    </div>
                    
                }
            </section>



            { fortmatic && 
            <section>
                <p>Will transfer from Fortmatic address: {fortmatic.address.substring(0, 16) + '...'}</p>
                <Form
                    {...{
                        active,
                        title: 'Test Fortmatic',
                        addressType: 'bech32Address',
                        addresses: bech32Addresses,
                        submit: fortmaticTransfer
                    }}
                />
                <p>ONE: {fortmatic.balanceONE}</p>
            </section>
            }


            {active && balances[active.name] && Object.keys(balances[active.name]).length > 0 &&
                <section>
                    <h2>Items</h2>
                    <Inventory {...props}
                        balance={active && balances && balances[active.name]}
                        wallet={true}
                    />
                </section>
            }
        </div>
    )
}
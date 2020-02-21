import React, {useState} from 'react'
import { useDispatch } from 'react-redux'
import { setActive } from '../../redux/harmony'

import { addItem } from '../../redux/crowdsale'
import Form from '../../components/Form/Form'

import { route, bubble, button } from './Create.module.scss'
import config from '../../../config'
const {ENV} = config


export default function Home(props) {

    const {
        harmonyState: { active, bech32Addresses },
        hrc721State: { balances },
    } = props

    const [link, setLink] = useState(null)

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



            { active &&
            <section>
                <Form
                    {...{
                        active,
                        title: 'Add Item',
                        fields: [
                            { label: 'Limit', type: 'number'},
                            { label: 'Price', type: 'number'},
                            { label: 'Link', type: 'text', onChange: (val) => setLink(val)},
                        ],
                        lowerContent:link && <img style={{ width: '100%' }} src={link} onError={() => setLink(null)} />,
                        submit: addItem
                    }}
                />

            </section>
            }

            

        </div>
    )
}
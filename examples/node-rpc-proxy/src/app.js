const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const request = require('request');
const { encode, decode } = require('@harmony-js/crypto');
/********************************
Config
********************************/
const config = require('../config')
const { port } = config
/********************************
Express
********************************/
const app = express()
app.use(cors())
app.use(bodyParser.json())
/********************************
Routes
********************************/
app.post('/', (req, res) => {
	const { body } = req
	switch(body.method) {
		case 'eth_chainId': 
			res.send({"jsonrpc":"2.0","id": body.id,"result":"0x2"})
			return
		case 'eth_sendRawTransaction': 
			let params = req.body.params[0]
			params = decode(params)
			console.log(params)
			params.splice(3, 0, '0x', '0x')
			body.params = [encode(params)]
		break;
	}
	//always
	body.method = body.method.replace('eth_', 'hmy_')
	//proxy pass
	request({
		url: 'http://localhost:9500',
		method: 'post',
		headers: { 
			"content-type": "application/json"
		},
		body: JSON.stringify(body),
	}, (error, response, body) => {
		console.log('method\n\n', req.body.method)
		console.log('error\n\n', error)
		// console.log(response)
		console.log('body\n\n', body)
		res.send(body)
	})
	
})
app.get('/', (req, res) => {
	res.send('ok')
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
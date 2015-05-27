import {Component, View, If} from 'angular2/angular2';
import {status, text} from '../utils/fetch'
import { Router} from 'angular2/router';

@Component({
	selector: 'home'
})
@View({
	templateUrl: 'home/home.html',
	directives: [If]
})
export class Home {
	jwt: string;
	decodedJwt: string;
	ioresp: string;

	constructor(router: Router) {
		this.router = router;
		this.jwt = localStorage.getItem('jwt');
		this.decodedJwt = this.jwt && jwt_decode(this.jwt);
		console.log('setting up socket')
		this._setupSocket()
	}

	logout() {
		localStorage.removeItem('jwt');
		this.router.parent.navigate('/login');
	}

	callCascada(){
		this._callApi('Uli', 'http://10.0.1.154:8087/ctrlWater/?spot=pond&state=on&til=60');
	}

	callAnonymousApi() {
		this._callApi('Anonymous', 'http://localhost:3001/api/random-quote');
	}

	callSecuredApi() {
		this._callApi('Secured', 'http://localhost:3001/api/protected/random-quote');
	}
	_callApi(type, url) {
		this.response = null;
		this.api = type;
		fetch(url, {
			method: 'GET',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
				'Authorization': 'bearer ' + this.jwt
			}
		})
		.then(status)
		.then(text)
		.then((response) => {
			this.response = response;
		})
		.catch((error) => {
			this.response = error.message;
		});
	}
	_setupSocket(){
		this.ioresp = 'dogfood'
		this.tleft = 999
		var namespace = '/test'; 
		var socket = io.connect('http://10.0.1.154:8087' + namespace);
		socket.on('connect', function() {
			socket.emit('my event', {"data": "Im connected!"});
			console.log('imconnected')
		});
		var that = this
		socket.on('my response', function(msg) {
			console.log(msg.data);
			var dtao = JSON.parse(msg.data)
			that.ioresp = dtao;
			console.log(dtao.pond.tleft)
			that.tleft = dtao.pond.tleft
			//$('#tdisp').html(dtao.pond.tleft)
		});		
	}

}

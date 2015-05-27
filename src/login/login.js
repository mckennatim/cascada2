import {Component, View} from 'angular2/angular2';
import {status, json} from '../utils/fetch'
import { Router, RouterLink } from 'angular2/router';

@Component({
  selector: 'login'
})
@View({
  templateUrl: 'login/login.html',
  directives: [RouterLink]
})
export class Login {
  constructor(router: Router) {
    this.router = router;
  }

  login(event, username, password) {
    event.preventDefault();
    fetch('http://10.0.1.154:8089/auth', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username, password
      })
    })
    .then(status)
    .then(json)
    .then((response) => {
      console.log(response)
      localStorage.setItem('jwt', response.token);
      this.router.parent.navigate('/home');
    })
    .catch((error) => {
      alert(error.message);
      console.log(error.message);
    });
  }

  signup(event) {
    event.preventDefault();
    this.router.parent.navigate('/signup');
  }
}

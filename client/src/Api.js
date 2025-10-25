import { ApiURL } from './config/config.json';

import { DateTime as luxon } from 'luxon';

class Api {
    
    constructor() {

        if (Api._instance) {
            throw new Error("Singleton classes can't be instantiated more than once.")
        }
        Api._instance = this;

        this.onUpdate = function() { };

        setInterval(async() => {
            this.onUpdate();
            // Signal()
        }, 25000);

    }


    /* REGION: REQUESTS API */

    async request_frStreamers() {
        console.log("request_frStreamers()");

        const options = {
            method: 'GET'
        };

        let res = null;
          
        res = await fetch(ApiURL + '/api/v1/streamers/fr-streamers', options)
            .then(response => {return response.json();})
            .catch(err => console.error(err));

        return res;
    }

}

var instance = new Api(); // Executes succesfully

export default instance;

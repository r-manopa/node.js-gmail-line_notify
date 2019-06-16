const fs = require('fs');
const path = require('path');
const http = require('http');
const destroyer = require('server-destroy');
const open = require('open');
const url = require('url');
const {google} = require('googleapis');

class GMail {

    constructor (options) {

        let _options = options || {};

        this.token = _options.token || path.join(__dirname, 'token.json');
        this.scopes = _options.scopes || ['https://www.googleapis.com/auth/gmail.readonly'];
        this.host = _options.host || 'http://localhost';
        this.port = _options.port || '3000';

        const keyPath = _options.oauth2_keys || path.join(__dirname, 'oauth2.keys.json');
        if(fs.existsSync(keyPath)) {
            this.keys = require(keyPath).installed || require(keyPath).web;
        }
        else {
            throw Error(`File is "${keyPath}" not found`);
        }

        this.client = new google.auth.OAuth2(
            this.keys.client_id,
            this.keys.client_secret,
            this.keys.redirect_uris[0]
        );

        google.options({auth: this.client});
    }

    listMessages(command) {

        return this.authenticate()
            .then(async cilent => {
                const gmail = google.gmail({version: 'v1', auth: cilent});
                const res = await gmail.users.messages.list({
                    userId: 'me',
                    q: command || ''
                });
                return res.data;
            });
    }

    authenticate() {
        return new Promise( async (resolve, reject) => {
            if(fs.existsSync(this.token)) {

                let tokens = require(this.token);

                //console.log(tokens);

                if(tokens.expiry_date < Date.now()) {

                    this.client.setCredentials({
                        refresh_token: tokens.refresh_token
                    });

                    tokens = await this.client.getAccessToken().then(_token => _token.res.data);

                    this._createTokenFile(tokens);
                    console.log('new token');
                }

                this.client.credentials = tokens;

                resolve(this.client);
            }
            else {
                this.getNewToken();

                reject(`File is "${this.token}" not found`);
            }
        });
    }

    getNewToken() {
        return new Promise((resolve, reject) => {
            const authorizeUrl = this.client.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes.join(' '),
            });
            const server = http.createServer(async (req, res) => {
                try {
                    if (req.url.indexOf('/oauth2callback') > -1) {
                        const qs = new url.URL(req.url, `${this.host}:${this.port}`).searchParams;
                        res.end('Authentication successful! Please return to the console.');
                        server.destroy();
                        const {tokens} = await this.client.getToken(qs.get('code'));
                        await this._createTokenFile(tokens);
                        resolve(tokens);
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
            server.listen(this.port, () => {
                open(authorizeUrl, {wait: false}).then(cp => cp.unref())
            });
            destroyer(server);
        });
    }

    _createTokenFile(tokens) {
        return new Promise( async (resolve, reject) => {
            fs.writeFile(this.token, JSON.stringify(tokens), (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Token stored to', this.token);
                    resolve(this.token)
                }
            });
        });
    }
}

module.exports = GMail;
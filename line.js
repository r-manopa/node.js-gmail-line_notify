const fs = require('fs');
const path = require('path');
const request = require('request-promise');

class LineNotify {

    constructor(options) {
        let _options = options || {};

        this.notify_url = 'https://notify-api.line.me/api/notify';
        const line_token = _options.line_token || path.join(__dirname, 'line_token.json');

        if(fs.existsSync(line_token)) {
            this.notify_token = require(line_token).notify;
        }
    }

    sendMessage(message) {
        return request({
            url: this.notify_url,
            headers: {
                "Authorization": "Bearer " + this.notify_token,
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            form: {
                message: message
            }
        });
    }
}

module.exports = LineNotify;
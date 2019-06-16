const GMail = require('./gmail');
const LineNotify = require('./line');

const gmailClient = new GMail();
const notify = new LineNotify();

const main = () => {
    // ดูได้จาก https://support.google.com/mail/answer/7190
    let command = 'from:duyz.dev@gmail.com is:unread newer_than:1d';

    gmailClient
        .listMessages(command)
        .then(msg => {
            if(msg.resultSizeEstimate > 0) {

                let notifyMsg = "วันนี้มีเมล์ใหม่ที่ยังไม่ได้อ่าน\n" +
                    "จาก : duyz.dev@gmail.com \n" +
                    "จำนวน : " + msg.resultSizeEstimate + " ฉบับ";

                notify
                    .sendMessage(notifyMsg)
                    .then(res => console.log(res))
                    .catch(err => console.error(err));
            }
            else {
                console.log('no result');
            }
        })
        .catch(err => console.error(err));
};

main();

setInterval(() => {
    main();
}, (1000 * 60)); // ส่งทุกๆ 1 นาที



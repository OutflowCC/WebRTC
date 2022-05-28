const path = require("path");
const express = require('express');
var axios = require("axios").default;
var cookieParser = require('cookie-parser');

const app = express()
const config = require("./config");
const port = config.port;


if (!config.METERED_DOMAIN) {
    throw new Error("Please specify the METERED_DOMAIN.\nAdd as an environment variable or in the .env file or directly specify in the src/config.js\nIf you are unsure where to get METERED_DOMAIN please read the Getting Started Guide here: https://docs.metered.ca/docs/getting-started");
}

if (!config.METERED_SECRET_KEY) {
    throw new Error("Please specify the METERED_SECRET_KEY.\nAdd as an environment variable or in the .env file or directly specify in the src/config.js\nIf you are unsure where to get METERED_SECRET_KEY please read the Getting Started Guide here: https://docs.metered.ca/docs/getting-started");
}

app.use(cookieParser())

// -----------------
var mysql = require('mysql');
var connection = mysql.createConnection({
    host: '194.67.104.222', user: 'django', password: '8A6TFeAtqj$4*HUy', database: 'outflow'
})

connection.connect(function (err) {
    if (err) {
        console.error('error connecting: ' + err.stack);
        return;
    }
    console.log('connected as id ' + connection.threadId);
});


app.use(function (req, res, next) {
    var sessionId = null;
    if (req.cookies && req.cookies.hasOwnProperty('sessionid')) {
        sessionId = req.cookies.sessionid;
        connection.query('SELECT COUNT(*) FROM django_session WHERE session_key = ? ', [sessionId], function (error, results, fields) {
            if (error) throw error;
            if (results[0]['COUNT(*)'] !== undefined && results[0]['COUNT(*)'] > 0) {
                next();
            } else {
                return res.send('');
            }
        });
    }
})
// -----------------

app.use("/", express.static(path.join(__dirname, '/public')))

app.get("/validate-meeting", function (req, res) {
    var options = {
        method: 'GET', url: "https://" + config.METERED_DOMAIN + '/api/v1/room/' + req.query.meetingId, params: {
            secretKey: config.METERED_SECRET_KEY
        }, headers: {
            Accept: 'application/json'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        res.send({
            success: true
        })
    }).catch(function (error) {
        console.error(error);
        res.send({
            success: false
        })
    });
});

app.post("/create-meeting-room", function (req, res) {
    var options = {
        method: 'POST', url: "https://" + config.METERED_DOMAIN + '/api/v1/room/', params: {
            secretKey: config.METERED_SECRET_KEY
        }, headers: {
            Accept: 'application/json'
        }
    };

    axios.request(options).then(function (response) {
        console.log(response.data);
        res.send({
            success: true, ...response.data
        })
    }).catch(function (error) {
        console.error(error);
        res.send({
            success: false
        })
    });
});

app.get("/metered-domain", function (req, res) {
    res.send({
        domain: config.METERED_DOMAIN
    });
});


app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`)
});
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const fs = require('fs');
const path = require('path');
const rfs = require('rotating-file-stream');
const morgan = require('morgan');
const helmet = require('helmet');
const routes = require('./routes');
const env = require('node-env-file');

env(path.join(__dirname,'/../','.env'));

const app = express();


/**
 * Middlewares For the application
 */

app.use(bodyParser.json());

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Access-Control-Allow-Headers, Access-Control-Allow-Methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers');
    console.log(`${req.method} ${req.url} ${req.path}`);
    next();
})

const logDirectory = path.join(__dirname, '/../', 'log');

if (!fs.existsSync(logDirectory)) { fs.mkdirSync(logDirectory); }

const accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory
 });

 app.use(morgan('combined', { stream: accessLogStream }));

 app.use(helmet());

 routes(app);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});


const port = process.env.PORT || '3000';
app.set('port', port);


const server = http.createServer(app);

server.listen(port, () => console.log(`Running on localhost:${port}`));

module.exports = app;
///////////////////////////////////////Package Require ///////////////////////////////////////
const smtp = require('./config/main.js');
const express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  logger = require('morgan'),
  cors = require('cors'),
  port = 3000;
// const api_key = 'key-a14dbfed56acf890771e7d1f3d372a82';
// const domain = 'mail.aftersale.in';
// const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });

// const cors = require('cors');
app.use(cors());
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Header', 'X-Requested-With,Content-Type,Authorization')
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS')
    // if (res.method === 'OPTIONS') return res.sendStatus(200)
    next()
})

const Sequelize = require('sequelize');
const { sequelize } = require('./config/db.config');

var json2xls = require('json2xls');
// const { Server } = require('ws');
// const { ExpressPeerServer } = require('peer');

///////////////////////////////////////////Email Config ///////////////////////////////////////
const nodemailer = require('nodemailer');

// const { PeerServer } = require('peer');

// const peerServer = PeerServer({ port: 9000, path: '/peerServer' });



// let smtpAuth = {
//   user: "vB5uBGFvQ06ugmCSGQcjSw",
//   pass: "SG.vB5uBGFvQ06ugmCSGQcjSw.cFZCx-Lc-LtYHS2lTQ9crd5udwSMjDvemGSCL-rbcyw"
// }
// let smtpConfig = {
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   secure: false,
//   auth: smtpAuth
//   //auth:cram_md5
// };
let smtpAuth = {
  user: smtp.smtpuser,
  pass: smtp.smtppass
}
let smtpConfig = {
  host: smtp.smtphost,
  port: smtp.smtpport,
  secure: false,
  auth: smtpAuth
  //auth:cram_md5
};

// console.log("smtp ", smtp)
let transporter = nodemailer.createTransport(smtpConfig);
transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  }
  // else {
  //   console.log('Server is ready to take our messages');
  // }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////Database or models require/////////////////////////////////////
const Op = Sequelize.Op;
const db = require('./config/db.config.js');
// const email = require('./config/email')
const Employees = db.Employees;
//////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////Middleware

app.use(bodyParser.json({ limit: '50mb' })); // Send JSON responses
app.use('/images', express.static('images/employees'))
app.use('/documents', express.static('images/documents'))
app.use('/resume', express.static('images/resume'))
// app.use(xmlparser());
app.use(cors());
// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', "*");
//   res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   if (req.method === 'OPTIONS') {
//       return res.send(200);
//   } else {
//       return next();
//   }
// });
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  if (req.method === 'OPTIONS') {
    return res.send(200);
  }
  else {
    console.log("request url is....",req.url)
    // console.log("payload is....",req.body)
    let biometricURL = req.url.includes('/iclock/cdata.aspx')
    console.log("biometricURL is....",biometricURL)

    let exceptions = ["/login", "/sentOtp", "/forgotPassword", "/getUserDetails", "/employeesAttendanceDownload", "/downloadDsr"]
    if (!exceptions.includes(req.url) && !biometricURL) {
      let employeeIdMiddleware = req.body.employeeIdMiddleware
      let permissionName = req.body.permissionName
      if (employeeIdMiddleware && permissionName) {
        let query = `select  
        userGroups.modules
      from
        Employees
        inner join userGroups on Employees.userGroup = userGroups.userGroupId
      where
        employeeId = '${employeeIdMiddleware}'`
        sequelize.query(query,
          {
            type: Sequelize.QueryTypes.SELECT
          }).then(re => {
            // console.log("re value is ....", re)
            if (re.length == 0) res.status(400).send("Employee Id is not Valid")
            else {
              if (re[0]['modules'][permissionName] == true) return next();
              else res.status(420).send("You dont have the Permission for this page")
            }

          }, error => {
            console.log("error occured while fetching data..", error)
            res.status(421).send("error occurred in middleware")
          })
      }
      else {
        if(req.method == "GET"){
          return next();
        } else {
          res.status(400).send("Employee id or Permission name is missing from the payload..")
        }
      }
    }
    else return next();
  }
});
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(express.static('uploads'));
// app.use('/images',express.static('images'));
app.use(json2xls.middleware);
// Start the server
let server = app.listen(port);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});


io.on('connection', function (socket) {
  console.log('a user connected');

  console.log("socket id---------------- ", socket.id); // 'G5p5...'


  // socket.join('channel1');

  // Send a message to all sockets in the "channel1" room
  // io.to('channel1').emit('new message', 'A new user has joined the channel');

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });

  socket.on('new message', function (msg) {
    let parsedMessage = JSON.parse(msg);
    console.log('parsedMessage: ' + parsedMessage);
    if (parsedMessage.action == 'joinChannel') {
      socket.join(parsedMessage.projectId);
    } else {
      // socket.
    }
    // io.emit('chat message', msg);
  });
});

// const sslOptions = {
//   key: fs.readFileSync('/etc/letsencrypt/live/api.hr.timesofpeople.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/api.hr.timesofpeople.com/fullchain.pem')
// };

// const peerServer = ExpressPeerServer(https.createServer(sslOptions, app));

// app.use('/peerjs', peerServer);

// peerServer.on('connection', (client) => {
//   console.log('Peer connected:', client.getId());
// });

// peerServer.on('disconnect', (client) => {
//   console.log('Peer disconnected:', client.getId());
// });

// const server = https.createServer(sslOptions, app);
// server.listen(3000, () => {
//   console.log('Server started on port 3000');
// });

// <<<<<<< HEAD
// const peerServer = ExpressPeerServer(server, {
//   secure: true,
//   // port: 443,
//   ssl: {
//       key: fs.readFileSync('/etc/letsencrypt/live/api.hr.timesofpeople.com/privkey.pem'),
//       cert: fs.readFileSync('/etc/letsencrypt/live/api.hr.timesofpeople.com/fullchain.pem')
//   }
// });

// const wsServer = new Server({ server });

// // Create a PeerServer with the WebSocket server and options
// const peerServer = ExpressPeerServer(wsServer, {
//   debug: true,
//   allow_discovery: true
// });

// app.use('/server', peerServer);

// const { PeerServer } = require('peer');

// const peerServer = PeerServer({
//   port: 9000,
// });

// peerServer.on('connection', (client) => {
//   console.log("connection ", client.id)
// });

// peerServer.on('disconnect', (client) => {
//   console.log("disconnected ", client.id)
// });



console.log("App Listening on Port ", port)
require('./app/routes')(app);
// const ngrok = require('ngrok');
// (async function() {
//   const url = await ngrok.connect(8000);
//   console.log("url = ",url);
// })();

function mailer(transporter, email, subject, message) {
  // console.log(email, subject, message)
  transporter.sendMail({
    from: {
      name: 'HR Portal',
      address: 'support@timesofpeople.com'
    },
    to: email,
    subject: `${subject}`,
    html: `${message}`,
  });
}

function formatDate(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('-');
  //12-01-2022
}

function apperisalNotification() {
  Employees.findAll({}).then(result => {
    result.forEach(async (v, i) => {
      let DOJ = v.DOJ
      let apperisalDays = v.apperisalDays
      let firstName = v.firstName
      let lastName = v.lastName
      let companyName = v.companyName
      let employeeID = v.employeeID
      let date = new Date(DOJ)
      date.setDate(date.getDate() + parseInt(apperisalDays));
      // console.log("", date)
      let date1 = ("0" + date.getDate()).slice(-2);
      let month1 = ("0" + (date.getMonth() + 1)).slice(-2);
      let year1 = date.getFullYear();
      let newOne = year1 + "-" + month1 + "-" + date1
      let newDate = new Date()
      let date2 = ("0" + newDate.getDate()).slice(-2);
      let month2 = ("0" + (newDate.getMonth() + 1)).slice(-2);
      let year2 = newDate.getFullYear();
      let newOne2 = year2 + "-" + month2 + "-" + date2
      if (newOne == newOne2) {
        let email2 = "vkumar@mckinsol.com"
        let subject = "Employee Apperisal Reminder Notification"
        let message = `Hello Team HR, <br><br> ${firstName} ${lastName} (${employeeID}) completed all ${apperisalDays} days in ${companyName}. Now, its time to appreciate him.`
        mailer(transporter, email2, subject, message)
        console.log(newOne, newOne2, "date matched")
      }
    })
  })
}

// apperisalNotification()




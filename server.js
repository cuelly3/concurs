const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const bcrypt = require('bcrypt');
const path = require('path');
const mysql = require('mysql');

let eA=false, eN=false;
let rounde=1;

let blacks=[], whites=[];

const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static(path.join(__dirname, "public")));


app.get('/u', (req, res) => {
    res.sendFile(__dirname + '/public/ger.html');
});

const users= [  ];
let activi=users.length;


  io.on('connection', (socket)=>{
    console.log('sa conectat cnv', activi);
    //console.log(users[0].useru);
    socket.join('room1');
    socket.emit('mesaj', 'Bine ai venit, ',users[activi-1].useru, activi);
    console.log(users.length, " si ", users)
    socket.on('disconnect', ()=>{
        users.pop();
        activi=users.length;
        console.log('S-a deconectat cineva');
        console.log('au ramas '+activi+' activi');
        io.to('room1').emit('STOP');
        users.splice(0,users.length);
        eA=false;
        eN=false;
    });
    socket.on('culoarea', (clr,cne)=>{
        users[cne-1].culoare=clr;
        console.log(users);
        socket.broadcast.emit('astanu',clr);
        if(cne==1)
        eA=true;
        if(cne==2)
        eN=true;
        if(eA && eN)
        {
            console.log('start');
            io.to('room1').emit('START', users[0].culoare, users[1].culoare);
            io.to('room1').emit('runde',rounde);
          }
    });
  socket.on('zaruri',(z1,z2)=>{
    socket.broadcast.emit('zaruri',z1,z2);
    rounde++;
    io.to('room1').emit('runde',rounde);
  });
socket.on('semarita',(x)=>{
  io.to('room1').emit('runde',rounde);
});
  socket.on('mutare',(c1,d,c2)=>{
    socket.broadcast.emit('mutare',c1,d,c2);
  });

  socket.on('victori', (w1,b1,ew,eb)=>{
    socket.broadcast.emit('victori',w1,b1,ew,eb);
  })
  socket.on('gara',()=>socket.broadcast.emit('gara'));
});

  
  server.listen(3000 || process.env.PORT, () => {
    console.log('listening on *:3000');
  });

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "users_table"
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });



app.get('/users', (req, res)=>{
res.json(users);
});

app.post('/submit-form',async (req,res)=>{
    try{
        const salt = await bcrypt.genSalt(10);
        const hashedpass = await bcrypt.hash(req.body.pass, salt);
        const user= {name:req.body.username, parola:hashedpass};
        users.push(user);   
    
            var sql = "INSERT INTO users (username, pass) VALUES ('"+user.name+"','"+user.parola+"')";
            con.query(sql, function (err, result) {
                if (err) throw err;
                console.log("1 record added!");
                res.sendFile(path.join(__dirname, 'public/coscos.html'))
              });
    }
              catch{
        res.status(500).send('sami');
    }
});
app.post('/users-login', async (req,res)=>{
    //const user = users.find(user => user.name === req.body.name);    
        con.query("SELECT * FROM users WHERE username = '"+req.body.username+"' ", function (err, result) {
         // if (err) console.log('sami');
      const user=Object.values(JSON.parse(JSON.stringify(result)));
     //console.log(user);
     if(user == ""){
      res.sendFile(path.join(__dirname, 'public/neparerau4.html'));
      //res.status(404).send('nue');
     }
        else
      try{

        (async () => {
            const result1 = await bcrypt.compare(req.body.pass, user[0].pass);
            if(result1)
        {
            
            activi++; 
            users.push({id:activi,useru:req.body.username,culoare: 'aqua'});
            res.sendFile(path.join(__dirname, 'public/ger.html'));
          }
            else
            res.sendFile(path.join(__dirname, 'public/neparerau3.html'));
 
        })();
    }
      catch{
        res.status(404).send('asdas');
    }
});
});

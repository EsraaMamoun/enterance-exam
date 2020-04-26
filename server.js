'use strict';

require('dotenv').config();
const cors = require('cors');
const PORT = process.env.PORT;
const express = require('express');
const app = express();
app.use(cors());
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error',(err)=>console.log(err));
const superagent = require('superagent');
const methodOverride = require('method-override');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(('/public'),express.static('public')); 
app.set('view engine', 'ejs');

////////////////////////////////////

app.get('/search', (req,res)=>{
    res.render('search');
})

app.post('/show',(req,res)=>{
    superagent.get(`https://digimon-api.herokuapp.com/api/digimon/name/${req.body.search}`)
    .then((data)=>{
        let allData = data.body.map((digimon)=>{
            return new Digimon(digimon);
        })
        res.render('show',{allData:allData});
    }).catch(err=>errorHandler(err,req,res));
})

//////////////////////////////////////

app.get('/',(req,res)=>{
    superagent('https://digimon-api.herokuapp.com/api/digimon')
    .then((data)=>{
        let allData = data.body.map((digimon)=>{
            return new Digimon(digimon);
        })
        res.render('index',{allData:allData});
    }).catch(err=>errorHandler(err,req,res));
})
/////////////////////////////////////

app.get('/favourite', (req,res)=>{
    res.render('favourite');
})

app.post('/favourite', (req,res)=>{
    const {name,img,level} = req.body;
    const SQL = 'INSERT INTO digimon (name,img,level) VALUES ($1,$2,$3) WHERE id=$4';
    const value = [name,img,level];
    client.query(SQL,value)
    .then((data)=>{
        res.redirect(`/favourite`, {theData:data.rows});
    }).catch((err)=>errorHandler(err,req,res));
})

///////////////////////////////////////

app.get('/details/:id',(req,res)=>{
    const {name,img,level} = req.body;
    const SQL = 'SELECT * FROM digimon WHERE id=$1';
    const value = [name,img,level];
    client.query(SQL,value).then((result)=>{
        res.render('details', {theResults:result.rows[0]})
    })
})

//////////////////////////////////////

function Digimon(digimon) {
    this.name = digimon.name;
    this.img = digimon.img;
    this.level = digimon.level;
}
////////////////////////////////////
function errorHandler(err,req,res) {
    res.status(500).send(err);
}

function notFound(req,res) {
    res.status(404).send('NOT FOUND !!');
}

app.get('*',notFound);

client.connect().then(()=>{
    app.listen(PORT, ()=>console.log(`My app listinig on ${PORT}`));
})
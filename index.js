const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
require('dotenv').config()
const admin = require('firebase-admin');
const ObjectId =require('mongodb').ObjectID;


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.hlzye.mongodb.net/${process.env.DB_Name}?retryWrites=true&w=majority`;
const app = express()
const port =process.env.PORT || 5000

app.use(bodyParser.json())
app.use(cors())

var serviceAccount = require("./configs/sunrise-mart-firebase-adminsdk-lp4wj-3908c2f426.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:"process.env.FIRE_DB"
});

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const productsCollection = client.db("sunriseMart").collection("products");
  const ordersCollection = client.db("sunriseMart").collection("orders");
  //post product data in db
  app.post('/addProduct', (req,res)=>{
    const newProduct = req.body;
    productsCollection.insertOne(newProduct)
    .then(result=>{
      
      res.send(result.insertedCount > 0)
    })
  })

  app.get('/products', (req,res)=>{
    productsCollection.find()
    .toArray((err, items)=>{
      res.send(items)
    })  
  })

  app.get('/product/:id', (req,res)=>{
    productsCollection.find({_id: ObjectId(req.params.id)})
    .toArray( (err, documents)=>{
      res.send(documents[0]);
    })
  })

  app.delete('/delete/:id', (req,res)=>{ 
    productsCollection.deleteOne({_id: ObjectId(req.params.id)})
    .then( result=>{
      res.send(result.deletedCount > 0)
    })
  })

  app.post('/addOrder', (req, res) => {
      const newOrder= req.body;
      ordersCollection.insertOne(newOrder)
      .then(result=>{
        res.send(result.insertedCount > 0);
      })
  })

  app.get('/orders', (req, res) => {
    const bearer=req.headers.authorization;
     if(bearer && bearer.startsWith('Bearer ')){
      const idToken =bearer.split(' ')[1];
      admin.auth().verifyIdToken(idToken)
       .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if(tokenEmail == queryEmail){
              ordersCollection.find({email: queryEmail})
                .toArray((err, documents)=>{
                  res.status(200).send(documents)
                })
          }
          else{
            res.status(401).send('Un-authorized Access')
          }
       })
       .catch((error) => {
          res.status(401).send('Un-authorized Access')
       });
   }
   else{
      res.status(401).send('Un-authorized Access')
   }
  })
});

app.get('/', (req, res) => {
  
  res.send('Hello World!')
})

app.listen(port)
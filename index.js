const express=require('express');
const cors=require('cors');
// requireing JWT, jwt generate token
const jwt=require('jsonwebtoken');
// requireing cookiperser
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app=express();
const port=process.env.PORT || 5000;

// console.log(process.env.DB_USER) 
// middleware
app.use(cors({
  origin:['http://localhost:5173'],
  // connection with font end
  credentials:true
}));
app.use(express.json());
// use cookieParser
app.use(cookieParser());

// my made meddleware
const logger= async(req,res,next)=>{
  console.log("created my middleware",req.host,req.originalUrl);
  next();
}

const veryfyToken=async(req,res,next)=>{
  const token =req.cookies?.token;
  // console.log("value of the token",token);
  if(!token){
    return res.status(401).send({message:"not Authorized"})
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (error,decoded)=>{
    // error
    if(error ){
      console.log(error)
      return res.status(401).send({message:'unauthorized'})
    }
    // if valide token then decoded
    // console.log("value of the token2", decoded);
    req.user=decoded;
          next();
  })
}

// test server
app.get('/',(req,res)=>{
    res.send("Doctor server is Running")
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.il352b3.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const database = client.db("carDoctor");
    const serviceCollection = database.collection("services");
    const bookingCollection= database.collection("bookings");
    // jwt authorization releted api
    app.post('/jwt',async(req,res)=>{
      const user=req.body;
      console.log(user);
      // creating token and set settings of token. After that res.send to fontend
      const token= jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res
      .cookie('token', token,{
        httpOnly: true,
        secure: false,
        sameSite: 'none',
      })
      .send({succes: true});
      // console.log(token)
    })
    // service all data api get 
    app.get("/services", async(req,res)=>{
        const cursor=serviceCollection.find();
        const result=await cursor.toArray();
        res.send(result);
    })
    // service find one data api get
    app.get("/services/:id", async(req,res)=>{
        // id get from client site
        const id=req.params.id;
        // finding particular service by id
        const query={_id: new ObjectId(id)};
        // finding particular filed from particular data we have get before
       const options={
        projection:{
            service_id:1,
            title: 1,
            service_id:1,
            price:1,
            img:1
        }
       }
       const result=await serviceCollection.findOne(query,options);
       res.send(result);
    })
    // book data get from data base
    app.get("/bookings",veryfyToken,async(req,res)=>{
      console.log(req.query.email)
      // console.log("TOKEN IS HERE",req.cookies.token)
      console.log("From valid user",req.user.email)
      let query={}
      if(req.query.email !== req.query.email){
        return res.status(403).send({massage: "Forbiden"})
      }
      if(req.query.email){
        query={email:req.query.email}
      }
      const cursor=bookingCollection.find(query);
      const result=await cursor.toArray();
      res.send(result);
    })
    // booking service order api
    app.post("/bookings", async(req,res)=>{
        const booking =req.body;
        // console.log(booking);
        const result=await bookingCollection.insertOne(booking);
        res.send(result);
    })
    //UPDATE booking 
    app.patch("/bookings/:id", express.json(), async (req, res) => {
      const updatedBookings = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      console.log(updatedBookings);
      const updateDoc = {
          $set: {
              status: updatedBookings.status
          },
      };
      const result = await bookingCollection.updateOne(filter, updateDoc);
      res.send(result);
  })
    // delete booking service order
    app.delete("/bookings/:id", async(req,res)=>{
      const id=req.params.id;
      // console.log(id);
      // const query={_id: new ObjectId(id)}
      const query = { _id: new ObjectId(id) };
      const result= await bookingCollection.deleteOne(query);
      res.send(result);

    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{
    console.log(`car doctor listening on port ${port}`)
});
require('dotenv').config()
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()

//meidlewere
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.ls3lx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const servicesCollection = client.db("ServiceDB").collection("Services");
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        
        // get the servise
        app.get('/services', async(req, res)=>{
          const result = await servicesCollection.find().toArray()
          res.send(result)
        })
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await servicesCollection.findOne(query);
            res.send(result);
        });
        // get the email user 

        app.get('/services/email/:email', async (req, res) => {
            const email = req.params.email;
            const query = { 'buyer.email': email };
            const result = await servicesCollection.find(query).toArray();
            res.send(result);
        });
        //the add services
        app.post('/services', async(req, res)=>{
            const addService = req.body;
            
            const result = await servicesCollection.insertOne(addService);
            res.send(result)
        })




        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send('The  Service sharing Web Application')
})

app.listen(port, () => {
    console.log(`This a servise : ${port}`);
})
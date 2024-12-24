require('dotenv').config()
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express()

//meidlewere

app.use(cors({
    origin: ['http://localhost:5173',
        'https://homerepier.netlify.app'

    ],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())


const verifyToken = (req, res, next) => {
    console.log(req.params.email);
    const token = req?.cookies?.token;
    console.log(token);
    if (!token) {
        return res.status(401).send({ message: 'unAuthorize access' })
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unAuthorize access' })
        }
        req.user = decoded
    })
    next()

}

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
        const serviceStatusCollection = client.db("ServiceDB").collection("serviceStatus");
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });


        // get  apis token 

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '10h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })

                .send({ success: true })
        })


        app.post('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
                })
                .send({ success: true })
        })


        // get the servise/serch
        app.get('/services', async (req, res) => {
            const { sherchprams } = req.query;
            let option = {}
            if (sherchprams) {
                option = { name: { $regex: sherchprams, $options: 'i' } }
            }
            const result = await servicesCollection.find(option).toArray()
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
        app.post('/services', async (req, res) => {
            const addService = req.body;
            const result = await servicesCollection.insertOne(addService);
            res.send(result)
        })

        // update the on service
        app.patch('/services/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: data
            }
            const result = await servicesCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        // delete the service
        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })


        //Purchase now apis 

        app.get('/serviceStatus', async (req, res) => {
            const result = await serviceStatusCollection.find().toArray()
            res.send(result)
        })

        app.get('/serviceStatus/:email', verifyToken, async (req, res) => {
            const decodedEmail = req.user?.email;
            const isBuyer = req.query.buyer;
            const email = req.params.email;
            if (decodedEmail !== email){
                return res.status(403).send({message:'forbidden access'})
            }

            let query = {}
            if (isBuyer) {
                query.buyer = email
            } else {
                query.email = email
            }

            const result = await serviceStatusCollection.find(query).toArray()
            res.send(result)
        })


        app.put('/serviceStatus/:id', async (req, res) => {
            const { id } = req.params;
            const { serviceStatus } = req.body;
            const result = await serviceStatusCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: { serviceStatus } }
            );
            res.send(result);

        });



        app.post('/serviceStatus', async (req, res) => {
            const addServicestatus = req.body;
            const result = await serviceStatusCollection.insertOne(addServicestatus);
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
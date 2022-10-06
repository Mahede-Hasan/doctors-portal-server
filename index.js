const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ntvpzhn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors-service').collection('treatmentService');
        const bookingCollection = client.db('doctors-service').collection('booking');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const service = await cursor.toArray();
            res.send(service);
        })

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            const query = { date: date }
            const bookings = await bookingCollection.find(query).toArray();
            const services = await serviceCollection.find().toArray();

            services.forEach(service=>{
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const bookSlot = serviceBookings.map(book => book.slot)
                const available = service.slots.filter(slot => !bookSlot.includes(slot))
                service.slots = available
            })
            res.send(services);
        })

        app.get('/booking', async(req, res) =>{
            const patient = req.query.patient;
            const query = {patient: patient};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
          })

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
              return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            return res.send({ success: true, result });
          })
    }
    finally {

    }
}

run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('hello Express');
})

app.listen(port, () => {
    console.log('server running', port)
})
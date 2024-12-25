const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

// MongoDB bağlantı URI'si
const uri = "mongodb+srv://efe:123@cluster0.b2tpx.mongodb.net/?retryWrites=true&w=majority";

// Middleware
app.use(cors());
app.use(express.json());

// Ana sayfa (root) endpoint'i
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // 'index.html' dosyasını döndür
});

let db, messagesCollection;

// MongoDB'ye bağlan
MongoClient.connect(uri)
    .then(client => {
        console.log("MongoDB'ye bağlanıldı");
        db = client.db('contact');
        messagesCollection = db.collection('messages');
    })
    .catch(error => console.error("MongoDB bağlantı hatası:", error));

// API endpoint: Mesajları getir
app.get('/messages', async (req, res) => {
    try {
        const messages = await messagesCollection.find().toArray();
        res.status(200).json(messages);
    } catch (err) {
        console.error("Hata:", err);
        res.status(500).json({ error: 'Mesajlar alınırken bir hata oluştu.' });
    }
});

// API endpoint: Yeni mesaj ekle
app.post('/messages', async (req, res) => {
    try {
        const newMessage = req.body;

        if (!newMessage.username || !newMessage.email || !newMessage.mesaj) {
            return res.status(400).json({ error: 'Eksik alanlar mevcut.' });
        }

        const result = await messagesCollection.insertOne(newMessage);
        res.status(201).json({ message: 'Mesaj başarıyla eklendi', id: result.insertedId });
    } catch (err) {
        console.error("Hata:", err);
        res.status(500).json({ error: 'Mesaj eklenirken bir hata oluştu.' });
    }
});

// Güncelleme endpoint'i
app.put('/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedMessage = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz ID formatı.' });
        }

        const result = await messagesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedMessage }
        );

        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Mesaj başarıyla güncellendi.' });
        } else {
            res.status(404).json({ message: 'Mesaj bulunamadı.' });
        }
    } catch (err) {
        console.error("Güncelleme hatası:", err);
        res.status(500).json({ error: 'Mesaj güncellenirken bir hata oluştu.' });
    }
});

// Silme endpoint'i
app.delete('/messages/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Geçersiz ID formatı.' });
        }

        const result = await messagesCollection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Mesaj başarıyla silindi.' });
        } else {
            res.status(404).json({ message: 'Mesaj bulunamadı.' });
        }
    } catch (err) {
        console.error("Silme hatası:", err);
        res.status(500).json({ error: 'Mesaj silinirken bir hata oluştu.' });
    }
});

// Sunucuyu başlat
app.listen(port, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${port}`);
});

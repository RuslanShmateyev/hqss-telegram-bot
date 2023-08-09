const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = {
    checkUser: async function (chat_id) {//check if user in db
        const [rows] = await pool.execute('SELECT * FROM users WHERE chat_id = ?', [chat_id]);
        return rows.length > 0;    
    },
    addUser: async function (phone, chat_id) { //add user to db
        const [rows] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
        if (rows.length > 0) return false;
        await pool.execute('INSERT INTO users (phone, chat_id) VALUES (?, ?)', [phone, chat_id]);
        return true;
    }
};
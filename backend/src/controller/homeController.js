import pool from '../configs/connectDB';

let getHomePage = async (req, res) => {
  const [rows, fields] = await pool.query('SELECT * FROM vehicles')
  return res.send(rows)
}

module.exports = {
  getHomePage
}
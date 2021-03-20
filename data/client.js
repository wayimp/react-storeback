import axios from 'axios'

const baseURL = 'http://localhost:3030'

const client = axios.create({
  baseURL,
})

module.exports = { client, baseURL }

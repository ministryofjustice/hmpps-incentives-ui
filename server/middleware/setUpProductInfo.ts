import express, { type Router } from 'express'

import config from '../config'

export default function setUpProductInfo(): Router {
  const router = express.Router()

  router.get('/info', (req, res) => {
    res.send({
      productId: config.applicationInfo.productId,
    })
  })

  return router
}

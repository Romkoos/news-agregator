import { buildServer } from './infrastructure/server.js'

const server = buildServer({
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
})

const port = Number(process.env.PORT ?? 3001)

server.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }
})

import request from 'supertest'
import app from '../src/app'

describe('not found handler', () => {
  it('returns 404 json payload for unknown routes', async () => {
    const res = await request(app).get('/api/v1/unknown-route')
    expect(res.status).toBe(404)
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining('Rota não encontrada'),
      })
    )
  })
})

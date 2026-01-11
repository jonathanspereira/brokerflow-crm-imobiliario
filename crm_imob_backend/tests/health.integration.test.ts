import request from 'supertest'
import app from '../src/app'

describe('Health check', () => {
  it('returns healthy payload', async () => {
    const res = await request(app).get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ status: expect.any(String) }),
      })
    )
  })
})

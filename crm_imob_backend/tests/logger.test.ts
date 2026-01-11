import { Logger } from '../src/utils/helpers'

describe('Logger', () => {
  test('logs info with prefix', () => {
    const logger = new Logger('Test')
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})

    logger.log('hello world')

    expect(spy).toHaveBeenCalled()
    const callArg = spy.mock.calls[0][0] as string
    expect(callArg).toContain('[Test]')
    spy.mockRestore()
  })
})

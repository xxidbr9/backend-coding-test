import assert from 'assert'
import respOk from '../infrastructure/transport/http/respOk';

describe('Checking transport http response', () => {
  it('should return correctly', (done) => {
    assert.deepEqual(respOk("test", { test: "" }), { message: "test", data: { test: "" } })
    done()
  });
});

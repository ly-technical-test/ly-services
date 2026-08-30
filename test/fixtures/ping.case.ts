import { RouteTestCase } from '../interface/route-test-case.interface.js';

export const PING_TEST_CASE: RouteTestCase = {
  description: '/ping (GET)',
  method: 'get',
  path: '/v1/ping',
  expectedStatus: 200,
  expectedBody: {
    code: 200,
    data: 'pong',
    message: 'ok',
    metadata: {
      method: 'GET',
      route: '/v1/ping',
    },
  },
};

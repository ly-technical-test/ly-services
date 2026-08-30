import { RouteTestCase } from '../interface/route-test-case.interface.js';

export const NOT_FOUND_TEST_CASE: RouteTestCase = {
  description: '/ (GET) not_found',
  method: 'get',
  path: '/v1/no-exists-xD',
  expectedStatus: 404,
  expectedBody: {
    code: 404,
    data: null,
    message: 'not_found',
    metadata: {
      method: 'GET',
      route: '/v1/no-exists-xD',
    },
  },
};

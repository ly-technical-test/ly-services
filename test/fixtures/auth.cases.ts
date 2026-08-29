import { RouteTestCase } from '../interface/route-test-case.interface.js';

export const CUSTOMERS_UNAUTHORIZED_CASE: RouteTestCase = {
  description: '/customers (GET) unauthorized',
  method: 'get',
  path: '/v1/customers',
  expectedStatus: 401,
  expectedBody: {
    code: 401,
    data: null,
    message: 'Unauthorized',
    metadata: {
      method: 'GET',
      route: '/v1/customers',
    },
  },
};

export const BILLING_UNAUTHORIZED_CASE: RouteTestCase = {
  description: '/billing/list (GET) unauthorized',
  method: 'get',
  path: '/v1/billing/list',
  expectedStatus: 401,
  expectedBody: {
    code: 401,
    data: null,
    message: 'Unauthorized',
    metadata: {
      method: 'GET',
      route: '/v1/billing/list',
    },
  },
};

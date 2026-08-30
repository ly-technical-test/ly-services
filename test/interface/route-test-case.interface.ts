export interface RouteTestCase {
  description: string;
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  expectedStatus: number;
  expectedBody: {
    code: number;
    data: any;
    message: string;
    metadata: {
      method: string;
      route: string;
    };
  };
}

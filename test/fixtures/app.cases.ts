import { RouteTestCase } from '../interface/route-test-case.interface.js';
import * as pingCases from './ping.case.js';
import * as notFoundCases from './not-found.cases.js';
import * as authCases from './auth.cases.js';

const caseModules = [pingCases, notFoundCases, authCases];

export const APP_E2E_CASES: RouteTestCase[] = caseModules.flatMap(
  (module) => Object.values(module) as RouteTestCase[],
);

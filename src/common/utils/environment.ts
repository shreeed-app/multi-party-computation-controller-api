enum Environment {
  PRODUCTION = "production",
  DEVELOPMENT = "development",
  TEST = "test",
}

const _is = (target: Environment): boolean => {
  return process.env.NODE_ENV === target;
};

const isProduction = (): boolean => _is(Environment.PRODUCTION);
const isDevelopment = (): boolean => _is(Environment.DEVELOPMENT);
const isTest = (): boolean => _is(Environment.TEST);

export { Environment, isDevelopment, isProduction, isTest };

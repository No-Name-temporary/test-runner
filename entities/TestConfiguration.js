/* eslint-disable max-len */
/* eslint-disable no-loop-func */
/* eslint-disable no-param-reassign */
const helpers = require('./utils/helpers');

class TestConfiguration {
  constructor({
    title, httpRequest,
  }) {
    this.title = title;
    this.method = httpRequest.method;
    this.url = httpRequest.url;
    this.body = httpRequest.body;
    this.assertions = httpRequest.assertions;
  }

  checkAssertions(response) {
    const results = [];
    let targetValue;
    let actualValue;
    let comparisonType;
    let property;
    let success;
    let responseHeaders;

    for (let i = 0; i < this.assertions.length; i += 1) {
      const assertion = this.assertions[i];
      const assertionType = this.assertions[i].type;
      switch (assertionType) {
        case 'statusCode':
          targetValue = assertion.target;
          actualValue = response.status;
          comparisonType = assertion.comparison;
          property = null;

          success = TestConfiguration.checkResTimeOrStatusCode({
            targetValue, actualValue, comparisonType,
          });
          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });

          break;
        case 'responseTime':
          targetValue = assertion.target;
          actualValue = response.headers['request-duration'];
          comparisonType = assertion.comparison;
          property = null;

          success = TestConfiguration.checkResTimeOrStatusCode({
            targetValue, actualValue, comparisonType,
          });
          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });
          break;
        case 'headers':
          responseHeaders = response.headers;
          comparisonType = assertion.comparison;
          targetValue = assertion.target;
          property = assertion.property;

          success = TestConfiguration
            .checkHeaders(assertion, responseHeaders, comparisonType);
          actualValue = response.headers[property] || null;

          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });
          break;
        case 'body':
          targetValue = assertion.target || null;
          property = helpers.formatProperty(assertion.property);
          comparisonType = assertion.comparison;
          actualValue = null;

          if ((!response.data) || (!Array.isArray(response.data) && typeof response.data !== 'object')) {
            success = false;
          } else {
            const responseBody = response.data;
            actualValue = property !== '$.' ? helpers.getValue(responseBody, property) : responseBody;
            success = TestConfiguration.checkJsonBody(targetValue, actualValue, comparisonType);
          }

          if (typeof actualValue === 'object' || Array.isArray(actualValue)) {
            actualValue = actualValue;
            property = property === '$.' ? null : property;
          }

          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });

          break;
        default:
          results.push({
            assertionType,
            targetValue: this.assertions[assertionType],
            actualValue: null,
            success: null,
            error: 'Unrecognized assertion type',
          });
      }
    }
    return results;
  }

  static checkResTimeOrStatusCode({ targetValue, actualValue, comparisonType }) {
    let result;

    switch (comparisonType) {
      case 'lessThan':
        actualValue = Number(actualValue);
        result = actualValue < targetValue;
        break;
      case 'greaterThan':
        actualValue = Number(actualValue);
        result = actualValue > targetValue;
        break;
      case 'notEqualTo':
        actualValue = String(actualValue);
        result = actualValue !== String(targetValue);
        break;
      case 'equalTo':
        actualValue = String(actualValue);
        result = actualValue === String(targetValue);
        break;
      default:
        result = false;
    }
    return result;
  }

  static checkHeaders(assertion, responseHeaders, comparisonType) {
    let result;

    switch (comparisonType) {
      case 'lessThan':
        result = Number(responseHeaders[assertion.property]) < Number(assertion.target);
        break;
      case 'greaterThan':
        result = Number(responseHeaders[assertion.property]) > Number(assertion.target);
        break;
      case 'notEqualTo':
        result = responseHeaders[assertion.property] !== assertion.target;
        break;
      case 'equalTo':
        result = responseHeaders[assertion.property] === assertion.target;
        break;
      case 'contains':
        result = responseHeaders[assertion.property].includes(assertion.target);
        break;
      case 'notContains':
        result = !responseHeaders[assertion.property].includes(assertion.target);
        break;
      case 'greaterThanOrEqualTo':
        result = Number(responseHeaders[assertion.property])
        >= Number(assertion.target);
        break;
      case 'lessThanOrEqualTo':
        result = Number(responseHeaders[assertion.property])
        <= Number(assertion.target);
        break;
      default:
        result = false;
    }
    return result;
  }

  static checkJsonBody(targetValue, actualValue, comparisonType) {
    let result;

    switch (comparisonType) {
      case 'lessThan':
        actualValue = Number(actualValue);
        result = actualValue < targetValue;
        break;
      case 'greaterThan':
        actualValue = Number(actualValue);
        result = actualValue > targetValue;
        break;
      case 'notEqualTo':
        result = actualValue !== targetValue;
        break;
      case 'equalTo':
        result = actualValue === targetValue;
        break;
      case 'contains':
        if (typeof actualValue === 'boolean') {
          result = actualValue === targetValue;
        } else if (!actualValue || typeof actualValue === 'number') {
          result = false;
        } else if (typeof actualValue === 'string') {
          result = actualValue.includes(targetValue);
        } else {
          result = helpers.containsKeysOrVals(actualValue, targetValue);
        }
        break;
      case 'notContains':
        if (typeof actualValue === 'boolean') {
          result = actualValue !== targetValue;
        } else if (!actualValue || typeof actualValue === 'number') {
          result = false;
        } else if (typeof actualValue === 'string') {
          result = !actualValue.includes(targetValue);
        } else {
          result = !helpers.containsKeysOrVals(actualValue, targetValue);
        }
        break;
      case 'greaterThanOrEqualTo':
        actualValue = Number(actualValue);
        result = actualValue >= targetValue;
        break;
      case 'lessThanOrEqualTo':
        actualValue = Number(actualValue);
        result = actualValue <= targetValue;
        break;
      case 'hasKey':
        result = helpers.hasKeys(actualValue, targetValue);
        break;
      case 'notHasKey':
        result = !helpers.hasKeys(actualValue, targetValue);
        break;
      case 'hasValue':
        result = helpers.hasValues(actualValue, targetValue);
        break;
      case 'notHasValue':
        result = helpers.hasValues(actualValue, targetValue);
        break;
      case 'isEmpty':
        if (Array.isArray(actualValue)) {
          result = actualValue.length === 0;
        } else if (actualValue === null) {
          result = false;
        } else if (typeof actualValue === 'object') {
          result = helpers.isObjectEmpty(actualValue);
        } else {
          result = String(actualValue) === '';
        }
        break;
      case 'isNotEmpty':
        if (Array.isArray(actualValue)) {
          result = actualValue.length !== 0;
        } else if (actualValue === null) {
          result = false;
        } else if (typeof actualValue === 'object') {
          result = !helpers.isObjectEmpty(actualValue);
        } else {
          result = String(actualValue) === '';
        }
        break;
      case 'isNull':
        result = actualValue === null;
        break;
      case 'isNotNull':
        result = actualValue !== null;
        break;
      default:
        result = false;
    }
    return result;
  }
}

module.exports = TestConfiguration;

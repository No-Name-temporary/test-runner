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
    let assertionHeaders;
    let responseHeaders;
    let bodyAssertions;

    const assertionTypes = Object.keys(this.assertions);
    for (let i = 0; i < assertionTypes.length; i += 1) {
      const assertionType = assertionTypes[i];
      switch (assertionType) {
        case 'statusCode':
          targetValue = this.assertions[assertionType].target;
          actualValue = response.status;
          comparisonType = this.assertions[assertionType].comparison;
          property = null;

          success = TestConfiguration.checkResTimeOrStatusCode({
            targetValue, actualValue, comparisonType,
          });
          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });

          break;
        case 'responseTime':
          targetValue = this.assertions[assertionType].target;
          actualValue = response.headers['request-duration'];
          comparisonType = this.assertions[assertionType].comparison;
          property = null;

          success = TestConfiguration.checkResTimeOrStatusCode({
            targetValue, actualValue, comparisonType,
          });
          results.push({
            assertionType, targetValue, actualValue, comparisonType, property, success,
          });
          break;
        case 'headers':
          assertionHeaders = this.assertions[assertionType];
          responseHeaders = response.headers;

          assertionHeaders.forEach((assertionHeader) => {
            comparisonType = assertionHeader.comparison;

            success = TestConfiguration
              .checkHeaders(assertionHeader, responseHeaders, comparisonType);
            targetValue = assertionHeader.target;
            actualValue = response.headers[assertionHeader.property] || null;
            comparisonType = assertionHeader.comparison;
            property = assertionHeader.property;

            results.push({
              assertionType, targetValue, actualValue, comparisonType, property, success,
            });
          });
          break;
        case 'jsonBody':
          bodyAssertions = this.assertions[assertionType];
          bodyAssertions.forEach((assertion) => {
            targetValue = assertion.target || null;
            property = assertion.property[0] !== '$' ? `$.${assertion.property}` : assertion.property;
            comparisonType = assertion.comparison;
            actualValue = null;

            if ((!response.data) || (!Array.isArray(response.data) && typeof response.data !== 'object')) {
              success = false;
            } else {
              const responseBody = response.data;
              actualValue = property ? helpers.getValue(responseBody, property) : responseBody;
              success = TestConfiguration.checkJsonBody(targetValue, actualValue, comparisonType);
            }
            results.push({
              assertionType, targetValue, actualValue, comparisonType, property, success,
            });
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
      case 'less_than':
        actualValue = Number(actualValue);
        result = actualValue < targetValue;
        break;
      case 'greater_than':
        actualValue = Number(actualValue);
        result = actualValue > targetValue;
        break;
      case 'not_equal_to':
        actualValue = String(actualValue);
        result = actualValue !== targetValue;
        break;
      case 'equal_to':
        actualValue = String(actualValue);
        result = actualValue === targetValue;
        break;
      default:
        result = false;
    }
    return result;
  }

  static checkHeaders(assertionHeader, responseHeaders, comparisonType) {
    let result;

    switch (comparisonType) {
      case 'less_than':
        result = Number(responseHeaders[assertionHeader.property]) < Number(assertionHeader.target);
        break;
      case 'greater_than':
        result = Number(responseHeaders[assertionHeader.property]) > Number(assertionHeader.target);
        break;
      case 'not_equal_to':
        result = responseHeaders[assertionHeader.property] !== assertionHeader.target;
        break;
      case 'equal_to':
        result = responseHeaders[assertionHeader.property] === assertionHeader.target;
        break;
      case 'contains':
        result = responseHeaders[assertionHeader.property].includes(assertionHeader.target);
        break;
      case 'not_contains':
        result = !responseHeaders[assertionHeader.property].includes(assertionHeader.target);
        break;
      case 'greater_than_or_equal_to':
        result = Number(responseHeaders[assertionHeader.property])
        >= Number(assertionHeader.target);
        break;
      case 'less_than_or_equal_to':
        result = Number(responseHeaders[assertionHeader.property])
        <= Number(assertionHeader.target);
        break;
      default:
        result = false;
    }
    return result;
  }

  static checkJsonBody(targetValue, actualValue, comparisonType) {
    let result;

    switch (comparisonType) {
      case 'less_than':
        actualValue = Number(actualValue);
        result = actualValue < targetValue;
        break;
      case 'greater_than':
        actualValue = Number(actualValue);
        result = actualValue > targetValue;
        break;
      case 'not_equal_to':
        result = actualValue !== targetValue;
        break;
      case 'equal_to':
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
      case 'not_contains':
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
      case 'greater_than_or_equal_to':
        actualValue = Number(actualValue);
        result = actualValue >= targetValue;
        break;
      case 'less_than_or_equal_to':
        actualValue = Number(actualValue);
        result = actualValue <= targetValue;
        break;
      case 'has_key':
        result = helpers.hasKeys(actualValue, targetValue);
        break;
      case 'not_has_key':
        result = !helpers.hasKeys(actualValue, targetValue);
        break;
      case 'has_value':
        result = helpers.hasValues(actualValue, targetValue);
        break;
      case 'not_has_value':
        result = helpers.hasValues(actualValue, targetValue);
        break;
      case 'is_empty':
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
      case 'is_not_empty':
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
      case 'is_null':
        result = actualValue === null;
        break;
      case 'is_not_null':
        result = actualValue !== null;
        break;
      default:
        result = false;
    }
    return result;
  }
}

module.exports = TestConfiguration;

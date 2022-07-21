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
            assertionType, targetValue, actualValue, comparisonType,property, success,
          });
          break;
        case 'headers':
          let assertionHeaders = this.assertions[assertionType];
          let responseHeaders = response.headers;
          comparisonType = this.assertions[assertionType].comparison;
            
          assertionHeaders.forEach(assertionHeader => {
            console.log("comparisonType ====>>", comparisonType);
						
            success = TestConfiguration.checkHeaders(assertionHeader, responseHeaders, comparisonType);
						console.log("success ====>>>", success);
            targetValue = assertionHeader.target;
            actualValue = response.headers[assertionHeader.property] || null;
            comparisonType = assertionHeader.comparison;
            property = assertionHeader.property;
            
						console.log("push =======> ", {
              assertionType, targetValue, actualValue, comparisonType, property, success,
            });
            results.push({
              assertionType, targetValue, actualValue, comparisonType, property, success,
            });
          })
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
				console.log("responseHeaders[assertionHeader.property]====> ", responseHeaders[assertionHeader.property]);
				console.log("assertionHeader.target=====> ", assertionHeader.target);
        result = responseHeaders[assertionHeader.property] === assertionHeader.target;
        break;
        case 'contains':
          result = responseHeaders[assertionHeader.property].includes(assertionHeader.target);
          break;
        case 'not_contains':
          result = !responseHeaders[assertionHeader.property].includes(assertionHeader.target); 
          break;
        case 'greater_than_or_equal_to': 
          result = Number(responseHeaders[assertionHeader.property]) >= Number(assertionHeader.target);
          break;
        case 'less_than_or_equal_to':
          result = Number(responseHeaders[header.property]) <= Number(assertionHeader.target); 
          break 
      default:
				console.log("default =======> ", result);
        result = false;
    }
    return result;
  }
}

module.exports = TestConfiguration;

/**
 * Typing the key-value pairs of the inputted regex test syntax.
 */
interface RegexTestInputs {
    [keyName: string]: RegExp | RegexTestInputs
}

/**
 * A utility class to test a given syntax of data against some regular expressions.
 * This is mostly intended to regulate what is valid information on a form to avoid bot spam.
 * You can nest your regex tests like a JSON object.
 * If a tested value is an array, then it will run the regex test on each index.
 */
class RegexTester {
    requiredRegexTests: RegexTestInputs;
    optionalRegexTests: RegexTestInputs | null;

    /**
     * @param requiredRegexTests A key-value pair of the required data field names and the regex test.
     * @param optionalRegexTests A key-value pair of the optional data field names and the regex test.
     */
    constructor(requiredRegexTests: RegexTestInputs, optionalRegexTests?: RegexTestInputs) {
        this.requiredRegexTests = requiredRegexTests;
        this.optionalRegexTests = optionalRegexTests ? optionalRegexTests : null;
    }

    /**
     * Runs the regex tests against an inputted data set.
     * 
     * @param data The inputted data set.
     * @param regexTestObject This is mostly to be able to call this function recursively. If you're calling this funciton outside of "regexTester.ts", you don't need to worry about this.
     * @returns A string error message if a regex test fails, or the parsed data set if all regex tests pass.
     */
    runTest(data: object, regexTestObject?: RegexTestInputs): string | {[key: string]: any} {
        let returnData = {};
        
        if(!regexTestObject) {
            regexTestObject = {};
            Object.assign(regexTestObject, this.requiredRegexTests);
            Object.assign(regexTestObject, this.optionalRegexTests);
        }

        /**
         * Looping through all the tests.
         */
        for(let i = 0; i < Object.keys(regexTestObject).length; i++) {
            const keyName = Object.keys(regexTestObject)[i];

            /**
             * If it's a required field and it's missing, return an error message.
             */
            if(typeof this.requiredRegexTests[keyName] != 'undefined' && (typeof data[keyName as keyof typeof data] == 'undefined' || data[keyName as keyof typeof data] == '')) {
                return `Error: missing field: ${keyName}`;
            }

            /**
             * If it's an optional field and it's missing, just skip the test entirely.
             */
            if(this.optionalRegexTests && typeof this.optionalRegexTests[keyName] != 'undefined' && (typeof data[keyName as keyof typeof data] == 'undefined' || data[keyName as keyof typeof data] == '')) {
                returnData = {...returnData,
                    [keyName]: ''
                };
                continue;
            }

            /**
             * Now that we're certain the current value is defined, reference it to a variable.
             */
            let value = data[keyName as keyof typeof data] as string | object;

            /**
             * If the current regex test is an object, that means we need to recursively call this funciton.
             */
            if(!(regexTestObject[keyName] instanceof RegExp)) {
                /**
                 * If the value is an array, we must iteratate over it and call this recursevly at each index.
                 */
                if(Array.isArray(value)) {
                    for(let j = 0; j < value.length; j++) {
                        const result = this.runTest(value[j] as object, regexTestObject[keyName] as RegexTestInputs);

                        /**
                         * If it returns an error message, return it to the top level in the call stack.
                         */
                        if(typeof result == 'string') return result + ` (At index ${j+1})`;
                    }
                }
                /**
                 * Otherwise, just call this recursevly on the value.
                 */
                else {
                    const result = this.runTest(value as object, regexTestObject[keyName] as RegexTestInputs);

                    /**
                     * If it returns an error message, return it to the top level in the call stack.
                     */
                    if(typeof result == 'string') return result;
                }
            }
            /**
             * Otherwise we'll have to match the test.
             */
            else {
                /**
                 * If it's an array, we'll have to iterate over the values.
                 */
                if(Array.isArray(value)) {
                    for(let j = 0; j < value.length; j++) {
                        /**
                         * If the array value is an object, run this recursevly.
                         */
                        if(typeof value[j] === 'object') {
                           return this.runTest(value[j] as object, regexTestObject![keyName] as RegexTestInputs)
                        }
                        /**
                         * Otherise, just run the match value function.
                         */
                        else {
                            const result = matchTest(value[j].toString(), keyName);

                            /**
                             * If it returns an error message, return it to the top level in the call stack.
                             */
                            if(typeof result == 'string') return result + ` (At index ${j+1})`;
                        }
                    }
                }
                /**
                 * Otherwise it's a basic value, and we can just call the match test function.
                 */
                else {
                    const result = matchTest(value.toString(), keyName);

                    /**
                     * If the result is an error message, then we should return that to the top of the call stack.
                     */
                    if(typeof result === 'string') return result;
                }
            }

            /**
             * Now that we're certain it's a valid data field, add it to the returned data object.
             */
            returnData = {...returnData,
                [keyName]: value
            };
        }

        function matchTest(value:string, keyName:string) {
            /**
             * Then we run the test.
             */
            const result = value.match(regexTestObject![keyName] as RegExp);

            /**
             * If Regex rest completly fails, just return a basic error message.
             */
            if(!result) return `Error: Please provide a valid ${keyName}`;

            /**
             * If Regex test fails but all joined matches are equal to the inputted value, this means it's too long.
             */
            if(result.length > 1 && result[result.length-1] !== '' && result.join('') === value) return `Error: ${keyName} exceeds maximum character length.`;
            
            /**
             * If Regex test fails, then search for the illegal character and send back an error message stating so.
             */
            if(result[0] != value) return `Error: illegal character "${value.split(result[0])[1] == "" ? value.split(result[0])[0].charAt(0) : value.split(result[0])[1].charAt(0)}" in ${keyName}.`;

            /**
             * If none of the gaurd clauses apply, then return true.
             */
            return true;
        }

        return returnData;
    }
}

export default RegexTester;
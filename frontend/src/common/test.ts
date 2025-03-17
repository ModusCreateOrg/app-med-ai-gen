/**
 * This function has high cyclomatic complexity through multiple nested conditions
 * and loops. It calculates a special sequence based on input parameters.
 */
export function calculateComplexSequence(n: number, threshold: number = 100): number {
    let result = 0;
    
    for (let i = 0; i < n; i++) {
        if (i % 2 === 0) {
            if (i % 3 === 0) {
                result += i * 2;
            } else if (i % 5 === 0) {
                result += i * 3;
            } else {
                result += i;
            }
        } else {
            if (i % 3 === 0) {
                if (i % 4 === 0) {
                    result += i * 4;
                } else if (i % 7 === 0) {
                    result += i * 5;
                } else {
                    result += i * 2;
                }
            } else if (i % 5 === 0) {
                if (result > threshold) {
                    result = Math.floor(result / 2);
                } else {
                    result *= 2;
                }
            }
        }

        if (result > threshold) {
            if (i % 6 === 0) {
                result = Math.floor(result / 3);
            } else if (i % 8 === 0) {
                result = Math.floor(result / 4);
            } else if (i % 9 === 0) {
                result = Math.floor(result / 5);
            }
        }

        switch (i % 4) {
            case 0:
                if (result < threshold / 2) {
                    result += 10;
                }
                break;
            case 1:
                if (result < threshold / 3) {
                    result += 20;
                }
                break;
            case 2:
                if (result < threshold / 4) {
                    result += 30;
                }
                break;
            default:
                if (result < threshold / 5) {
                    result += 40;
                }
        }
    }
    
    return result;
}

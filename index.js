const display = document.getElementById('display');
const expression = document.getElementById('expression');
let currentValue = '0';
let previousExpression = '';
let shouldResetDisplay = false;
let isDegree = true;

function updateDisplay() {
    display.value = currentValue;
    expression.textContent = previousExpression;
}

function toggleScientific() {
    const panel = document.getElementById('basic-panel');
    panel.classList.toggle('sci-on');
}

function toggleDegRad() {
    isDegree = !isDegree;
    document.getElementById('degRadBtn').textContent = isDegree ? 'DEG' : 'RAD';
}

function appendToDisplay(input) {
    if (currentValue === 'Error') {
        currentValue = '0';
    }
    
    if (shouldResetDisplay && !isOperator(input)) {
        currentValue = '0';
        shouldResetDisplay = false;
    }
    
    if (currentValue === '0' && input !== '.') {
        if (!isOperator(input)) {
            currentValue = input;
        } else {
            currentValue += input;
        }
    } else {
        if (isOperator(input) && isOperator(currentValue[currentValue.length - 1])) {
            currentValue = currentValue.slice(0, -1) + input;
        } else if (input === '.' && hasDecimalInCurrentNumber()) {
            return;
        } else {
            currentValue += input;
        }
    }
    
    shouldResetDisplay = false;
    updateDisplay();
}

function isOperator(char) {
    return ['+', '-', '*', '/', '×', '÷', '−', '%', '^'].includes(char);
}

function hasDecimalInCurrentNumber() {
    const parts = currentValue.split(/[\+\-\*\/\×\÷\−\%\^\(\)]/);
    const lastNumber = parts[parts.length - 1];
    return lastNumber.includes('.');
}

function clearDisplay() {
    currentValue = '0';
    previousExpression = '';
    shouldResetDisplay = false;
    updateDisplay();
}

function backspace() {
    if (currentValue === 'Error') {
        currentValue = '0';
    } else if (currentValue.length > 1) {
        currentValue = currentValue.slice(0, -1);
    } else {
        currentValue = '0';
    }
    updateDisplay();
}

function toggleSign() {
    if (currentValue === '0' || currentValue === 'Error') return;
    
    if (currentValue.charAt(0) === '-') {
        currentValue = currentValue.slice(1);
    } else {
        currentValue = '-' + currentValue;
    }
    updateDisplay();
}

function calculate() {
    try {
        previousExpression = currentValue;
        
        // Preprocess expression to support functions like cos(2), sin(30), etc.
        let expression = preprocessExpression(currentValue);
        
        let result = eval(expression);
        
        if (Number.isFinite(result)) {
            result = Math.round(result * 100000000) / 100000000;
            currentValue = result.toString();
        } else {
            currentValue = 'Error';
        }
        
        shouldResetDisplay = true;
        updateDisplay();
    } catch (error) {
        currentValue = 'Error';
        shouldResetDisplay = true;
        updateDisplay();
    }
}

// Append a function token like "cos(" to the display for typed expressions
function appendFunction(name) {
    const token = name === '√' ? 'sqrt(' : `${name}(`;
    if (currentValue === 'Error' || (shouldResetDisplay && !isOperator(token))) {
        currentValue = token;
        shouldResetDisplay = false;
    } else if (currentValue === '0') {
        currentValue = token;
    } else {
        currentValue += token;
    }
    updateDisplay();
}

// Convert user-friendly expression to a JS-evaluable string
function preprocessExpression(expr) {
    let s = expr;
    // Basic operators
    s = s.replace(/×/g, '*')
         .replace(/÷/g, '/')
         .replace(/−/g, '-')
         .replace(/\^/g, '**')
         .replace(/%/g, '/100');

    // Constants (if user typed them)
    s = s.replace(/π/g, `(${Math.PI})`).replace(/\be\b/g, `(${Math.E})`);

    // Factorial postfix e.g., 5! or (2+3)!
    s = replaceFactorial(s);

    // Function calls: sin(...), cos(...), tan(...), log(...), ln(...), sqrt(...)
    s = transformFunctions(s);

    return s;
}

function replaceFactorial(s) {
    // Replace numbers or parenthesized expressions followed by ! with factorial(...)
    // Loop until no further replacements
    let prev;
    const numberFactorial = /(\b\d+(?:\.\d+)?)!/g;
    const parenFactorial = /(\([^()]*\))!/g;
    do {
        prev = s;
        s = s.replace(numberFactorial, (_, num) => `factorial(${num})`);
        s = s.replace(parenFactorial, (_, group) => `factorial(${group})`);
    } while (s !== prev);
    return s;
}

function transformFunctions(s) {
    const funcs = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt'];
    let i = 0;
    let out = '';
    while (i < s.length) {
        let matched = false;
        for (const f of funcs) {
            if (s.startsWith(f + '(', i)) {
                // Find matching parenthesis
                const start = i + f.length + 1; // position after 'f('
                let depth = 1;
                let j = start;
                while (j < s.length && depth > 0) {
                    if (s[j] === '(') depth++;
                    else if (s[j] === ')') depth--;
                    j++;
                }
                const inside = s.slice(start, j - 1);
                const transformedInside = transformFunctions(inside); // allow nested functions
                let replacement;
                switch (f) {
                    case 'sin':
                        replacement = isDegree
                            ? `Math.sin((${transformedInside})*Math.PI/180)`
                            : `Math.sin(${transformedInside})`;
                        break;
                    case 'cos':
                        replacement = isDegree
                            ? `Math.cos((${transformedInside})*Math.PI/180)`
                            : `Math.cos(${transformedInside})`;
                        break;
                    case 'tan':
                        replacement = isDegree
                            ? `Math.tan((${transformedInside})*Math.PI/180)`
                            : `Math.tan(${transformedInside})`;
                        break;
                    case 'log':
                        replacement = `Math.log10(${transformedInside})`;
                        break;
                    case 'ln':
                        replacement = `Math.log(${transformedInside})`;
                        break;
                    case 'sqrt':
                        replacement = `Math.sqrt(${transformedInside})`;
                        break;
                }
                out += replacement;
                i = j; // move past closing ')'
                matched = true;
                break;
            }
        }
        if (!matched) {
            out += s[i];
            i++;
        }
    }
    return out;
}

function applyFunction(func) {
    if (currentValue === 'Error') return;
    
    try {
        let value = parseFloat(currentValue);
        let result;
        
        switch(func) {
            case 'sin':
                result = isDegree ? Math.sin(value * Math.PI / 180) : Math.sin(value);
                break;
            case 'cos':
                result = isDegree ? Math.cos(value * Math.PI / 180) : Math.cos(value);
                break;
            case 'tan':
                result = isDegree ? Math.tan(value * Math.PI / 180) : Math.tan(value);
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                break;
            case 'square':
                result = value * value;
                break;
            case 'cube':
                result = value * value * value;
                break;
            case 'factorial':
                result = factorial(Math.floor(value));
                break;
        }
        
        if (Number.isFinite(result)) {
            result = Math.round(result * 100000000) / 100000000;
            previousExpression = func + '(' + currentValue + ')';
            currentValue = result.toString();
            shouldResetDisplay = true;
            updateDisplay();
        } else {
            currentValue = 'Error';
            updateDisplay();
        }
    } catch (error) {
        currentValue = 'Error';
        updateDisplay();
    }
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

function insertE() {
    if (shouldResetDisplay || currentValue === '0') {
        currentValue = Math.E.toFixed(10);
        shouldResetDisplay = false;
    } else {
        currentValue += '*' + Math.E.toFixed(10);
    }
    updateDisplay();
}

function insertPi() {
    if (shouldResetDisplay || currentValue === '0') {
        currentValue = Math.PI.toFixed(10);
        shouldResetDisplay = false;
    } else {
        currentValue += '*' + Math.PI.toFixed(10);
    }
    updateDisplay();
}

function insertE() {
    if (shouldResetDisplay || currentValue === '0') {
        currentValue = Math.E.toFixed(10);
        shouldResetDisplay = false;
    } else {
        currentValue += '*' + Math.E.toFixed(10);
    }
    updateDisplay();
}

// Initialize
updateDisplay();
    
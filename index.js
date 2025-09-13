const display = document.getElementById('display');

function appendToDisplay(input) {
    display.value += input; //display ma input dina euta bnda badi input dina parxa so +=
}

function clearDisplay(){
    display.value = ""; //display ma kei xa vani sabb clear garna
}

function calculate() {
    try {
        display.value = eval(display.value); //eval function takes an expression jastai (7-6) and calculate garii result dinxa and it is used for calculations
    } catch (error) {
        display.value = "Error"; //if the expression is invalid then it will show error
    }
}
    
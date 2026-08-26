// Handlers de Máscara em Inputs HTML nativos

export function aplicarMascaraInput(inputElement, formatarFn) {
    if (!inputElement) return;

    inputElement.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
            const pos = inputElement.selectionStart;
            const val = inputElement.value;
            if (pos > 0 && /\D/.test(val[pos - 1])) {
                e.preventDefault();
                const digits = val.slice(0, pos).replace(/\D/g, "");
                if (digits.length > 0) {
                    const newDigits = digits.slice(0, -1);
                    const remaining = val.slice(pos).replace(/\D/g, "");
                    const combined = newDigits + remaining;
                    inputElement.value = formatarFn(combined);

                    const targetDigitsCount = newDigits.length;
                    let newPos = 0;
                    let digitsCount = 0;
                    while (newPos < inputElement.value.length && digitsCount < targetDigitsCount) {
                        if (/\d/.test(inputElement.value[newPos])) {
                            digitsCount++;
                        }
                        newPos++;
                    }
                    inputElement.setSelectionRange(newPos, newPos);
                }
            }
        }
    });

    inputElement.addEventListener('input', (e) => {
        const cursorPosition = inputElement.selectionStart;
        const oldVal = inputElement.value;
        const newVal = formatarFn(oldVal);

        if (newVal === oldVal) return;

        inputElement.value = newVal;

        const digitsBeforeCursor = oldVal.slice(0, cursorPosition).replace(/\D/g, "").length;

        let newPos = 0;
        let digitsCount = 0;
        while (newPos < newVal.length && digitsCount < digitsBeforeCursor) {
            if (/\d/.test(newVal[newPos])) {
                digitsCount++;
            }
            newPos++;
        }

        if (newPos < newVal.length && /\D/.test(newVal[newPos]) && e.inputType === 'insertText') {
            while (newPos < newVal.length && /\D/.test(newVal[newPos])) {
                newPos++;
            }
        }

        inputElement.setSelectionRange(newPos, newPos);
    });
}

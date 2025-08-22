export class CodeExecutor {
    constructor() {
        this.compilersAvailable = {
            python: true,
            cpp: true
        };
    }

    async runCode(language, code, inputData = '') {
        const startTime = performance.now();
        
        let result;
        if (language === 'python') {
            result = await this.runPythonCode(code, inputData);
        } else if (language === 'cpp') {
            result = await this.runCppCode(code, inputData);
        } else {
            throw new Error('Unsupported language');
        }
        
        const endTime = performance.now();
        result.executionTime = (endTime - startTime).toFixed(2);
        
        return result;
    }

    async runPythonCode(code, inputData = '') {
        try {
            const response = await fetch('/run-python', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, input_data: inputData })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            return {
                output: result.output || '',
                error: result.error || '',
                returnCode: result.return_code || 0
            };
            
        } catch (error) {
            throw new Error('Ошибка выполнения Python: ' + error.message);
        }
    }

    async runCppCode(code, inputData = '') {
        try {
            const response = await fetch('/run-cpp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, input_data: inputData })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            return {
                output: result.output || '',
                error: result.error || '',
                returnCode: result.return_code || 0
            };
            
        } catch (error) {
            throw new Error('Ошибка выполнения C++: ' + error.message);
        }
    }

    async checkCompilers() {
        try {
            const response = await fetch('/check-compilers');
            if (response.ok) {
                const compilers = await response.json();
                this.compilersAvailable.python = !compilers.python.includes('Not available');
                this.compilersAvailable.cpp = !compilers['g++'].includes('Not available');
            }
        } catch (error) {
            console.warn('Не удалось проверить компиляторы:', error);
        }
    }

    isCompilerAvailable(language) {
        return this.compilersAvailable[language];
    }
}
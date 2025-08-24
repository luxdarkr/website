export class ExamplesManager {
    constructor() {
        this.examples = {
            python: [],
            cpp: []
        };
        this.fallbackExamples = this.getFallbackExamples();
    }

    getFallbackExamples() {
        return {
            python: [
                {
                    id: "hello",
                    name: "Hello World",
                    description: "Простая программа выводящая приветствие",
                    content: `print("Hello, World!")\nprint("Добро пожаловать в Python!")`
                },
                {
                    id: "calculator",
                    name: "Калькулятор", 
                    description: "Простой калькулятор с вводом данных",
                    content: `# Простой калькулятор на Python
def calculator():
    try:
        num1 = float(input("Введите первое число: "))
        operator = input("Введите оператор (+, -, *, /): ")
        num2 = float(input("Введите второе число: "))
        
        if operator == '+':
            result = num1 + num2
        elif operator == '-':
            result = num1 - num2
        elif operator == '*':
            result = num1 * num2
        elif operator == '/':
            if num2 == 0:
                return "Ошибка: деление на ноль!"
            result = num1 / num2
        else:
            return "Неверный оператор!"
        
        return f"Результат: {result}"
    
    except ValueError:
        return "Ошибка: введите числа корректно!"

print(calculator())`
                }
            ],
            cpp: [
                {
                    id: "hello", 
                    name: "Hello World",
                    description: "Базовая программа на C++",
                    content: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    cout << "Добро пожаловать в C++!" << endl;\n    return 0;\n}`
                },
                {
                    id: "calculator",
                    name: "Калькулятор",
                    description: "Калькулятор на C++ с switch-case", 
                    content: `#include <iostream>\nusing namespace std;\n\nint main() {\n    double num1, num2;\n    char operation;\n    \n    cout << "Введите первое число: ";\n    cin >> num1;\n    \n    cout << "Введите оператор (+, -, *, /): ";\n    cin >> operation;\n    \n    cout << "Введите второе число: ";\n    cin >> num2;\n    \n    switch(operation) {\n        case '+':\n            cout << "Результат: " << num1 + num2 << endl;\n            break;\n        case '-':\n            cout << "Результат: " << num1 - num2 << endl;\n            break;\n        case '*':\n            cout << "Результат: " << num1 * num2 << endl;\n            break;\n        case '/':\n            if (num2 != 0) {\n                cout << "Результат: " << num1 / num2 << endl;\n            } else {\n                cout << "Ошибка: деление на ноль!" << endl;\n            }\n            break;\n        default:\n            cout << "Неверный оператор!" << endl;\n    }\n    \n    return 0;\n}`
                }
            ]
        };
    }

    async loadExamples(language) {
        console.log(`Loading examples for: ${language}`);
        try {
            const examples = await this.fetchExamples(language);
            this.examples[language] = examples;
            console.log(`Successfully loaded ${examples.length} examples for ${language}`);
            return examples;
        } catch (error) {
            console.warn('Using fallback examples due to error:', error);
            this.examples[language] = this.fallbackExamples[language] || [];
            return this.examples[language];
        }
    }

    async fetchExamples(language) {
        try {
            console.log(`Fetching examples from: /examples/${language}`);
            const response = await fetch(`/examples/${language}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const examples = await response.json();
            console.log(`Received examples:`, examples);
            return examples;
            
        } catch (error) {
            console.error(`Error fetching examples for ${language}:`, error);
            throw error;
        }
    }

    async loadExampleContent(language, exampleId) {
        console.log(`Loading example content: ${language}/${exampleId}`);
        try {
            const response = await fetch(`/example/${language}/${exampleId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            console.log(`Successfully loaded example content`);
            return data.content;
            
        } catch (error) {
            console.warn('Using fallback example content due to error:', error);
            const example = this.fallbackExamples[language]?.find(ex => ex.id === exampleId);
            return example?.content || `// Пример ${exampleId} не найден`;
        }
    }

    getExampleName(language, exampleId) {
        const example = this.examples[language].find(ex => ex.id === exampleId);
        return example ? example.name : exampleId;
    }
}
export class ExamplesManager {
    constructor() {
        this.examples = {
            python: [],
            cpp: []
        };
    }

    async loadExamples(language) {
        try {
            const examples = await this.fetchExamples(language);
            this.examples[language] = examples;
            return examples;
        } catch (error) {
            console.warn('Не удалось загрузить примеры:', error);
            this.examples[language] = [];
            return [];
        }
    }

    async fetchExamples(language) {
        const response = await fetch(`/examples/${language}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }

    async loadExampleContent(language, exampleId) {
        const response = await fetch(`/example/${language}/${exampleId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.content;
    }

    getExampleName(language, exampleId) {
        const example = this.examples[language].find(ex => ex.id === exampleId);
        return example ? example.name : exampleId;
    }

    async loadExample(language, exampleId) {
        console.log(`Loading example: ${language}/${exampleId}`);
        try {
            const response = await fetch(`/example/${language}/${exampleId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Загружаем пример в редактор
            this.editor.setValue(data.content);
            
            // Устанавливаем подсказку для входных данных
            const example = this.examples[language].find(ex => ex.id === exampleId);
            if (example && example.input_hint) {
                this.setInputHint(example.input_hint);
            } else {
                this.clearInputHint();
            }
            
            this.uiManager.showNotification(`Загружен пример: ${this.getExampleName(language, exampleId)}`);
            
        } catch (error) {
            console.error('Ошибка загрузки примера:', error);
            this.uiManager.showNotification('Не удалось загрузить пример: ' + error.message, 'error');
        }
    }

    setInputHint(hint) {
        const inputHint = document.getElementById('inputHint');
        if (!inputHint) {
            // Создаем элемент для подсказки, если его нет
            const inputSection = document.querySelector('.input-section');
            if (inputSection) {
                const hintElement = document.createElement('div');
                hintElement.id = 'inputHint';
                hintElement.className = 'input-hint';
                hintElement.innerHTML = `💡 ${hint}`;
                inputSection.appendChild(hintElement);
            }
        } else {
            inputHint.innerHTML = `💡 ${hint}`;
        }
    }

    clearInputHint() {
        const inputHint = document.getElementById('inputHint');
        if (inputHint) {
            inputHint.remove();
        }
    }
}
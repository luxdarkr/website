import { CodeExecutor } from './code-executor.js';
import { ExamplesManager } from './examples-manager.js';
import { UIManager } from './ui-manager.js';
import { loadStyles } from './utils/style-loader.js';

class CodeRunner {
    constructor() {
        this.editor = null;
        this.currentLanguage = 'python';
        this.isRunning = false;
        
        this.executor = new CodeExecutor();
        this.examplesManager = new ExamplesManager();
        this.uiManager = new UIManager();
        
        this.init();
    }

    async init() {
        // Загружаем стили
        loadStyles();
        
        this.initCodeMirror();
        this.setupEventListeners();
        this.loadSavedCode();
        
        await this.executor.checkCompilers();
        await this.examplesManager.loadExamples(this.currentLanguage);
        
        this.uiManager.renderExamples(this.currentLanguage, this.examplesManager.examples);
    }

    initCodeMirror() {
        this.editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            indentUnit: 4,
            indentWithTabs: false,
            electricChars: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Ctrl-Enter': () => this.runCode(),
                'Cmd-Enter': () => this.runCode()
            }
        });

        this.editor.setValue(this.getDefaultCode('python'));
    }

    setupEventListeners() {
        // Выбор языка
        document.getElementById('languageSelect').addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });

        // Кнопка запуска
        document.getElementById('runBtn').addEventListener('click', () => {
            this.runCode();
        });

        // Кнопка очистки
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearEditor();
        });

        // Табы вывода
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.uiManager.switchTab(e.target.dataset.tab);
            });
        });
    
        document.getElementById('inputData').addEventListener('input', () => {
            this.saveInputData();
        });
        // Автосохранение кода
        this.editor.on('change', () => {
            this.saveCode();
        });

        // Обработчик для примеров (делегирование событий)
        const examplesContainer = document.querySelector('.example-buttons');
        if (examplesContainer) {
            examplesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('example-btn')) {
                    const lang = e.target.dataset.lang;
                    const exampleId = e.target.dataset.example;
                    this.loadExample(lang, exampleId);
                }
            });
        }

        this.loadInputData();
    }

    async changeLanguage(language) {
        this.currentLanguage = language;
        
        // Меняем режим редактора
        const mode = language === 'python' ? 'python' : 'text/x-c++src';
        this.editor.setOption('mode', mode);
        
        // Загружаем сохранённый код
        const savedCode = localStorage.getItem(`code_${language}`);
        if (savedCode) {
            this.editor.setValue(savedCode);
        } else {
            this.editor.setValue(this.getDefaultCode(language));
        }
        
        // Загружаем и отображаем примеры для нового языка
        await this.examplesManager.loadExamples(language);
        this.uiManager.renderExamples(language, this.examplesManager.examples);
        
        this.uiManager.clearOutput();
    }

    getDefaultCode(language) {
        return language === 'python' ? 
            '# Напишите ваш Python код здесь\nprint("Hello, World!")' :
            '// Напишите ваш C++ код здесь\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}';
    }

    async runCode() {
        if (this.isRunning) return;
        
        const code = this.editor.getValue();
        const inputData = document.getElementById('inputData').value; // Получаем входные данные
        
        // Проверяем доступность компилятора
        if (!this.executor.isCompilerAvailable(this.currentLanguage)) {
            this.uiManager.showError(`${this.currentLanguage} компилятор не доступен`);
            return;
        }
        
        this.isRunning = true;
        this.uiManager.setStatus('Запуск кода...', true);
        this.uiManager.clearOutput();
        
        try {
            const result = await this.executor.runCode(this.currentLanguage, code, inputData);
            this.uiManager.showOutput(result.output, result.error, result.executionTime, result.returnCode);
        } catch (error) {
            this.uiManager.showError('Ошибка выполнения: ' + error.message);
        } finally {
            this.isRunning = false;
            this.uiManager.setStatus('Готов к работе', false);
        }
    }

    async loadExample(language, exampleId) {
        try {
            const content = await this.examplesManager.loadExampleContent(language, exampleId);
            this.editor.setValue(content);
            this.uiManager.showNotification(`Загружен пример: ${this.examplesManager.getExampleName(language, exampleId)}`);
        } catch (error) {
            this.uiManager.showNotification('Не удалось загрузить пример', 'error');
        }
    }

    saveInputData() {
        const inputData = document.getElementById('inputData').value;
        localStorage.setItem(`input_data`, inputData);
    }

    loadInputData() {
        const savedInputData = localStorage.getItem(`input_data`);
        if (savedInputData) {
            document.getElementById('inputData').value = savedInputData;
        }
    }

    clearEditor() {
        if (confirm('Очистить редактор?')) {
            this.editor.setValue('');
            document.getElementById('inputData').value = '';
            this.uiManager.clearOutput();
            localStorage.removeItem(`code_${this.currentLanguage}`);
            localStorage.removeItem(`input_data`);
        }
    }

    saveCode() {
        const code = this.editor.getValue();
        localStorage.setItem(`code_${this.currentLanguage}`, code);
    }

    loadSavedCode() {
        const savedCode = localStorage.getItem(`code_${this.currentLanguage}`);
        if (savedCode) {
            this.editor.setValue(savedCode);
        }
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.codeRunner = new CodeRunner();
});
import { showNotification } from './utils/notifications.js';

export class UIManager {
    constructor() {
        this.statusElement = document.getElementById('statusText');
        this.runButton = document.getElementById('runBtn');
        this.outputElement = document.getElementById('outputContent');
        this.errorElement = document.getElementById('errorContent');
        this.executionTimeElement = document.getElementById('executionTime');
    }

    setStatus(message, loading = false) {
        this.statusElement.innerHTML = loading ? 
            `<span class="loader"></span>${message}` : 
            message;
        
        this.runButton.disabled = loading;
    }

    showOutput(output, error, executionTime, returnCode = 0) {
        if (error || returnCode !== 0) {
            this.errorElement.textContent = error || `Программа завершилась с кодом ${returnCode}`;
            this.switchTab('error');
            this.outputElement.textContent = output || '';
        } else {
            this.outputElement.textContent = output;
            this.errorElement.textContent = '';
            this.switchTab('output');
        }
        
        this.executionTimeElement.textContent = `Время: ${executionTime}ms`;
    }

    showError(message) {
        this.errorElement.textContent = message;
        this.switchTab('error');
    }

    clearOutput() {
        this.outputElement.textContent = '';
        this.errorElement.textContent = '';
        this.executionTimeElement.textContent = '';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        this.outputElement.style.display = tabName === 'output' ? 'block' : 'none';
        this.errorElement.style.display = tabName === 'error' ? 'block' : 'none';
    }

    renderExamples(language, examples) {
        const container = document.querySelector('.example-buttons');
        if (!container) return;

        const currentExamples = examples[language] || [];
        
        if (currentExamples.length === 0) {
            container.innerHTML = '<div class="examples-error">Примеры не найдены</div>';
            return;
        }

        container.innerHTML = currentExamples.map(example => `
            <button class="example-btn" 
                    data-lang="${language}" 
                    data-example="${example.id}"
                    title="${example.description || example.name}">
                <strong>${example.name}</strong>
                ${example.description ? `<br><small>${example.description}</small>` : ''}
            </button>
        `).join('');
    }

    showNotification(message, type = 'success') {
        showNotification(message, type);
    }
}
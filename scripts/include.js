class ComponentIncluder {
    constructor() {
        this.components = {};
    }

    async loadComponent(name) {
        if (this.components[name]) {
            return this.components[name];
        }

        try {
            const response = await fetch(`../components/${name}.html`);
            if (!response.ok) {
                throw new Error(`Компонент ${name} не найден`);
            }

            const html = await response.text();
            this.components[name] = html;
            return html;
        } catch (error) {
            console.error('Ошибка загрузки компонента:', error);
            return `<div class="error">Ошибка загрузки ${name}</div>`;
        }
    }

    async includeAll() {
        try {
            // Вставляем header
            const headerHtml = await this.loadComponent('header');
            const headerPlaceholder = document.getElementById('header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.outerHTML = headerHtml;
            } else {
                console.error('Элемент header-placeholder не найден');
            }

            // Вставляем footer
            const footerHtml = await this.loadComponent('footer');
            const footerPlaceholder = document.getElementById('footer-placeholder');
            if (footerPlaceholder) {
                footerPlaceholder.outerHTML = footerHtml;
            } else {
                console.error('Элемент footer-placeholder не найден');
            }

            // Добавляем активный класс к текущей странице
            this.highlightCurrentPage();

        } catch (error) {
            console.error('Ошибка включения компонентов:', error);
            this.showError('Ошибка загрузки компонентов страницы');
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'component-error';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }

    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop();
        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage ||
                (currentPage === '' && linkPage === 'index.html') ||
                (currentPage === undefined && linkPage === 'index.html')) {
                link.classList.add('active');
            }
        });
    }
}

// Добавим стиль для активной ссылки
const activeLinkStyle = document.createElement('style');
activeLinkStyle.textContent = `
    nav a.active {
        color: #ffeb3b !important;
        font-weight: bold;
        position: relative;
    }
    
    nav a.active::after {
        content: '';
        position: absolute;
        bottom: -5px;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: #ffeb3b;
    }
    
    .component-error {
        background: #ffebee;
        color: #c62828;
        padding: 1rem;
        border: 1px solid #ef5350;
        border-radius: 5px;
        margin: 1rem 0;
        text-align: center;
    }
`;
document.head.appendChild(activeLinkStyle);

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    const includer = new ComponentIncluder();
    await includer.includeAll();
});

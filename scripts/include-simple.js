class ComponentIncluder {
    constructor() {
        // Определяем базовый путь от корня проекта
        this.basePath = window.location.pathname.includes('/pages/') ? '../' : './';
        
        this.components = {
            'header': `
                <header>
                    <nav>
                        <div class="logo">МойСайт</div>
                        <ul>
                            <li><a href="${this.basePath}index.html">Главная</a></li>
                            <li><a href="${this.basePath}pages/code.html">Код</a></li>
                            <li><a href="${this.basePath}pages/games.html">Игры</a></li>
                            <li><a href="${this.basePath}pages/articles.html">Статьи</a></li>
                            <li><a href="${this.basePath}pages/notes.html">Заметки</a></li>
                        </ul>
                    </nav>
                </header>
            `,
            'footer': `
                <footer>
                    <p>&copy; 2025 Мой Сайт. Все права защищены.</p>
                </footer>
            `
        };
    }

    includeAll() {
        // Вставляем header
        const headerPlaceholder = document.getElementById('header-placeholder');
        if (headerPlaceholder) {
            headerPlaceholder.outerHTML = this.components['header'];
        }

        // Вставляем footer
        const footerPlaceholder = document.getElementById('footer-placeholder');
        if (footerPlaceholder) {
            footerPlaceholder.outerHTML = this.components['footer'];
        }

        // Добавляем активный класс к текущей странице
        this.highlightCurrentPage();
    }

    highlightCurrentPage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            const linkPage = linkHref.split('/').pop();
            
            // Определяем, активна ли ссылка
            let isActive = false;
            
            if (currentPage === 'index.html' && linkHref.includes('index.html')) {
                isActive = true;
            } else if (linkPage === currentPage) {
                isActive = true;
            } else if (currentPage === '' && linkHref.includes('index.html')) {
                isActive = true;
            }
            
            if (isActive) {
                link.classList.add('active');
            }
        });
    }

    // Метод для получения правильного пути к файлам
    getAssetPath(relativePath) {
        return `${this.basePath}${relativePath}`;
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
`;
document.head.appendChild(activeLinkStyle);

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const includer = new ComponentIncluder();
    includer.includeAll();
    
    // Сохраняем объект для использования в других скриптах
    window.componentIncluder = includer;
});

// Глобальная функция для получения правильных путей
function getPath(relativePath) {
    if (typeof componentIncluder !== 'undefined') {
        return componentIncluder.getAssetPath(relativePath);
    }
    
    // Fallback: определяем базовый путь автоматически
    const isInPages = window.location.pathname.includes('/pages/');
    const base = isInPages ? '../' : './';
    return base + relativePath;
}
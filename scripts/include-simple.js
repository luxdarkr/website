class ComponentIncluder {
    constructor() {
        // Используем абсолютные пути от корня сайта
        this.basePath = '/';
        
        this.components = {
            'header': `
                <header>
                    <nav>
                        <div class="logo">МойСайт</div>
                        <ul>
                            <li><a href="${this.basePath}">Главная</a></li>
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
                    <p>&copy; 2024 Мой Сайт. Все права защищены.</p>
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
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            
            // Сравниваем пути
            const isActive = 
                currentPath === linkHref ||
                (currentPath === '/' && linkHref === '/') ||
                (currentPath.includes('code.html') && linkHref.includes('code.html')) ||
                (currentPath.includes('games.html') && linkHref.includes('games.html')) ||
                (currentPath.includes('articles.html') && linkHref.includes('articles.html')) ||
                (currentPath.includes('notes.html') && linkHref.includes('notes.html'));
            
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
    
    // Fallback
    return '/' + relativePath;
}
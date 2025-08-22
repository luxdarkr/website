class NotesManager {
    constructor() {
        this.notes = [];
        this.init();
    }

    init() {
        this.loadNotes();
        this.setupEventListeners();
        this.renderNotes();
        this.loadDraft();
    }

    setupEventListeners() {
        const form = document.getElementById('noteForm');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addNote();
        });

        // Автосохранение черновика
        document.getElementById('noteTitle').addEventListener('input', () => this.autoSaveDraft());
        document.getElementById('noteContent').addEventListener('input', () => this.autoSaveDraft());

        // Поиск
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchNotes(e.target.value);
        });
    }

    autoSaveDraft() {
        const title = document.getElementById('noteTitle').value;
        const content = document.getElementById('noteContent').value;
        
        if (title || content) {
            localStorage.setItem('noteDraft', JSON.stringify({ title, content }));
        }
    }

    loadDraft() {
        const draft = localStorage.getItem('noteDraft');
        if (draft) {
            const { title, content } = JSON.parse(draft);
            document.getElementById('noteTitle').value = title || '';
            document.getElementById('noteContent').value = content || '';
        }
    }

    addNote() {
        const titleInput = document.getElementById('noteTitle');
        const contentInput = document.getElementById('noteContent');
        
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!title || !content) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.notes.unshift(newNote); // Добавляем в начало
        this.saveNotes();
        this.renderNotes();
        
        // Очищаем форму и черновик
        titleInput.value = '';
        contentInput.value = '';
        localStorage.removeItem('noteDraft');
        
        // Показываем уведомление
        this.showNotification('Заметка сохранена!');
    }

    deleteNote(id) {
        if (confirm('Удалить эту заметку?')) {
            this.notes = this.notes.filter(note => note.id !== id);
            this.saveNotes();
            this.renderNotes();
            this.showNotification('Заметка удалена');
        }
    }

    searchNotes(query) {
        const searchTerm = query.toLowerCase().trim();
        
        if (!searchTerm) {
            this.renderNotes(this.notes);
            return;
        }

        const filteredNotes = this.notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm)
        );
        
        this.renderNotes(filteredNotes);
    }

    saveNotes() {
        localStorage.setItem('userNotes', JSON.stringify(this.notes));
    }

    loadNotes() {
        const savedNotes = localStorage.getItem('userNotes');
        if (savedNotes) {
            this.notes = JSON.parse(savedNotes);
        }
    }

    renderNotes(notesToRender = null) {
        const notes = notesToRender || this.notes;
        const container = document.getElementById('notesContainer');
        
        if (notes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Заметок пока нет</h3>
                    <p>Создайте свою первую заметку!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notes.map(note => `
            <div class="note-card">
                <h3>${this.escapeHtml(note.title)}</h3>
                <div class="note-date">${this.formatDate(note.createdAt)}</div>
                <div class="note-content">${this.escapeHtml(note.content).replace(/\n/g, '<br>')}</div>
                <button class="delete-btn" onclick="notesManager.deleteNote('${note.id}')">
                    Удалить
                </button>
            </div>
        `).join('');
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        // Создаём уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 1rem 2rem;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Удаляем через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Добавляем стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Инициализируем менеджер заметок
const notesManager = new NotesManager();

export function loadStyles() {
    const styles = [
        '../styles/animations.css',
        '../styles/editor.css',
        '../styles/examples.css'
    ];

    styles.forEach(stylePath => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = stylePath;
        document.head.appendChild(link);
    });
}
document.addEventListener('DOMContentLoaded', (): void => {
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach((anchor: Element): void => {
        anchor.addEventListener('click', function(e: Event): void {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href) {
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}); 
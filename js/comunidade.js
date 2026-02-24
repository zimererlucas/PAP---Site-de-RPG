// comunidade.js

document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.rule-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');

            // Update active link
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Show target section, hide others
            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    // Scroll to top of content area on mobile
                    if (window.innerWidth < 992) {
                        section.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
});

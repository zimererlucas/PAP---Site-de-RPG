// Sistema.js

document.addEventListener('DOMContentLoaded', () => {
    // Find all reader layouts (Rulebook and Continents)
    const layouts = document.querySelectorAll('.reader-layout');

    layouts.forEach(layout => {
        const sidebarLinks = layout.querySelectorAll('.sidebar-link');
        const sections = layout.querySelectorAll('.rule-section');

        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('data-section');

                // Update active link ONLY within this layout
                sidebarLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show target section, hide others ONLY within this layout
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
});

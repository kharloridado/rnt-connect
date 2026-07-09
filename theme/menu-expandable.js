var AppMenuControl = (function () {

    // ── Private helpers ─────────────────────────────────────────────────────

    function isCollapsed(layout) {
        return layout.classList.contains('menu-collapsed');
    }

    function syncAccessibility(layout, control, links) {
        var collapsed = isCollapsed(layout);
        control.setAttribute('aria-expanded', String(!collapsed));
        control.setAttribute('aria-label', collapsed ? 'Expand the menu' : 'Collapse the menu');

        if (links) {
            links.querySelectorAll('a, button, [tabindex]').forEach(function (el) {
                el.setAttribute('tabindex', collapsed ? '-1' : '0');
            });
        }
    }

    // ── Public API ───────────────────────────────────────────────────────────

    function init() {
        var layout  = document.querySelector('.layout');
        var control = document.querySelector('.app-menu-control');
        var links   = document.querySelector('.app-menu-links');

        if (!layout || !control) { return; }
        if (control.dataset.a11yBound) { return; } // already initialised

        // Make the control a proper keyboard-accessible button
        control.setAttribute('role', 'button');
        if (!control.hasAttribute('tabindex')) { control.setAttribute('tabindex', '0'); }
        if (links && !links.id) { links.id = 'app-menu-links'; }
        control.setAttribute('aria-controls', 'app-menu-links');

        // Handlers
        function onKeydown(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                control.click();
            }
        }

        function onMutation() {
            syncAccessibility(layout, control, links);
        }

        var observer = new MutationObserver(onMutation);
        observer.observe(layout, { attributes: true, attributeFilter: ['class'] });

        control.addEventListener('keydown', onKeydown);

        // Store everything needed for cleanup on the element itself
        control._a11y = {
            observer: observer,
            onKeydown: onKeydown
        };

        control.dataset.a11yBound = 'true';

        syncAccessibility(layout, control, links); // set initial state
    }

    function destroy() {
        var control = document.querySelector('.app-menu-control');
        if (!control || !control._a11y) { return; }

        control._a11y.observer.disconnect();
        control.removeEventListener('keydown', control._a11y.onKeydown);

        delete control._a11y;
        delete control.dataset.a11yBound;
    }

    return { init: init, destroy: destroy };

})();
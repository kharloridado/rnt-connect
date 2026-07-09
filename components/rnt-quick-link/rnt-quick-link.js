/* ===========================================================================
 * rnt-quick-link.js — behavior for the Quick Link Card custom Block
 * Escalation: L4 (vanilla JS, no framework, no build step).
 *
 * The pressed state is pure CSS (:active). This script's only job is to bridge
 * the click to an OutSystems action/event — no toggle, no persistent state.
 *
 * OutSystems Reactive wiring (place this file in the Block's Required Scripts):
 *   OnReady    -> RntQuickLink.init($element, { onClick: ... })   // bind
 *   OnDestroy  -> RntQuickLink.destroy($element)                   // unbind
 *
 * Associating an OutSystems event/action — two ways, use either or both:
 *   1) Pass an onClick callback to init() that runs your client action, e.g.
 *        RntQuickLink.init($element, { onClick: function (d) { $actions.NotifyOnClick(d.label); } });
 *   2) Relay the bubbling "rnt-quick-link:click" CustomEvent (detail =
 *      { label }) to the Block's OnClick output event.
 *
 * Keyboard: the markup is a native <button>, so Enter/Space already trigger
 * click() — no extra key handling needed (SC 2.1.1).
 * init/destroy are idempotent and safe to call per Block instance.
 * ======================================================================== */
(function (global) {
  'use strict';

  var BLOCK = 'rnt-quick-link';
  var HANDLER = '__rntQuickLinkHandler';   // stored ref so destroy() can unbind
  var CALLBACK = '__rntQuickLinkOnClick';

  function labelOf(el) {
    var label = el.querySelector('.rnt-quick-link__label');
    return (label ? label.textContent : el.textContent || '').trim();
  }

  function handleClick(el) {
    var detail = { label: labelOf(el) };

    // 1) OutSystems client action callback, if one was supplied to init()
    if (typeof el[CALLBACK] === 'function') {
      el[CALLBACK](detail);
    }
    // 2) bubbling event the Block can relay to its OnClick output event
    el.dispatchEvent(new CustomEvent('rnt-quick-link:click', {
      bubbles: true,
      detail: detail
    }));
  }

  function bind(el, onClick) {
    if (el[HANDLER]) {                  // already bound — just refresh the callback
      if (typeof onClick === 'function') el[CALLBACK] = onClick;
      return;
    }
    if (typeof onClick === 'function') el[CALLBACK] = onClick;
    var handler = function () { handleClick(el); };
    el[HANDLER] = handler;
    el.addEventListener('click', handler);
  }

  function unbind(el) {
    if (el[HANDLER]) {
      el.removeEventListener('click', el[HANDLER]);
      delete el[HANDLER];
    }
    delete el[CALLBACK];
  }

  function eachCard(root, fn) {
    var scope = (root && root.querySelectorAll) ? root : document;
    // include the root itself if it is a card (Block root element case)
    if (scope.classList && scope.classList.contains(BLOCK)) fn(scope);
    Array.prototype.forEach.call(scope.querySelectorAll('.' + BLOCK), fn);
  }

  /**
   * Bind all quick-link cards in scope. Call from the Block's OnReady.
   * @param {Element|Document} [root]            scope (pass $element)
   * @param {{onClick?: function}} [options]     onClick(detail) -> run client action
   */
  function init(root, options) {
    var onClick = options && options.onClick;
    eachCard(root, function (el) { bind(el, onClick); });
  }

  /**
   * Remove listeners + callbacks in scope. Call from the Block's OnDestroy.
   * @param {Element|Document} [root]            scope (pass $element)
   */
  function destroy(root) {
    eachCard(root, unbind);
  }

  global.RntQuickLink = { init: init, destroy: destroy };
})(window);

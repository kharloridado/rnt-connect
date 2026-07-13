/* ============================================================
 * RNTTagsCollapse — clamp OutSystems Dropdown Tags (virtual-select)
 * to a max number of tag rows, collapsing overflow into "+N more".
 *
 * Escalation: L4 — ExtendedClass + JS on the Dropdown Tags pattern.
 * Pairs with rnt-tags-collapse.css.
 *
 * Usage (Screen/Block OnReady, or Dropdown Tags OnInitialize):
 *   RNTTagsCollapse.init($parameters.WidgetId, { maxRows: 2 });
 *
 * Cleanup (OnDestroy):
 *   RNTTagsCollapse.destroy($parameters.WidgetId);
 *
 * WidgetId = the Id you set on the Dropdown Tags pattern (or any
 * ancestor element that contains exactly one virtual-select).
 * ============================================================ */
(function (global) {
  'use strict';

  var CLS_BLOCK = 'rnt-tags-collapse';
  var CLS_HIDDEN = 'rnt-tags-collapse__tag--is-hidden';
  var CLS_MORE = 'rnt-tags-collapse__more';
  var CLS_MEASURING = 'rnt-tags-collapse--is-measuring';

  var instances = {}; // widgetId -> { observers, el, raf }

  function findValueEl(root) {
    return root.querySelector('.vscomp-toggle-button .vscomp-value');
  }

  function getTags(valueEl) {
    return Array.prototype.slice.call(
      valueEl.querySelectorAll('.vscomp-value-tag')
    );
  }

  function removeChip(valueEl) {
    var chip = valueEl.querySelector('.' + CLS_MORE);
    if (chip) chip.remove();
  }

  function buildChip(count, wrapper) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = CLS_MORE;
    chip.textContent = '+' + count + ' more';
    chip.setAttribute(
      'aria-label',
      count + ' more selected. Open dropdown to view all selections.'
    );
    chip.addEventListener('click', function (e) {
      e.stopPropagation();
      // Default behavior: open the dropdown so the user can see/manage all.
      var toggle = wrapper.querySelector('.vscomp-toggle-button');
      if (toggle) toggle.click();
    });
    return chip;
  }

  function collapse(wrapper, maxRows) {
    var inst = instances[wrapper.id];
    if (!inst) return;

    var valueEl = findValueEl(wrapper);
    if (!valueEl) return;

    inst.adjusting = true; // guard: ignore our own mutations
    wrapper.classList.add(CLS_MEASURING);

    // 1. Reset: show everything, drop old chip
    removeChip(valueEl);
    getTags(valueEl).forEach(function (t) {
      t.classList.remove(CLS_HIDDEN);
    });

    var tags = getTags(valueEl);
    if (tags.length === 0) {
      wrapper.classList.remove(CLS_MEASURING);
      inst.adjusting = false;
      return;
    }

    // 2. Measure row positions. Tags on the same row share offsetTop.
    var firstTop = tags[0].offsetTop;
    var rowTops = [firstTop];
    tags.forEach(function (t) {
      if (rowTops.indexOf(t.offsetTop) === -1) rowTops.push(t.offsetTop);
    });
    rowTops.sort(function (a, b) { return a - b; });

    if (rowTops.length <= maxRows) {
      // Everything already fits — nothing to collapse.
      wrapper.classList.remove(CLS_MEASURING);
      inst.adjusting = false;
      return;
    }

    var lastAllowedTop = rowTops[maxRows - 1];

    // 3. Hide every tag that starts beyond the allowed rows.
    var visible = [];
    tags.forEach(function (t) {
      if (t.offsetTop > lastAllowedTop) {
        t.classList.add(CLS_HIDDEN);
      } else {
        visible.push(t);
      }
    });

    // 4. Insert chip, then keep hiding trailing tags until the chip
    //    itself fits inside the last allowed row.
    var hiddenCount = tags.length - visible.length;
    var chip = buildChip(hiddenCount, wrapper);
    valueEl.appendChild(chip);

    while (chip.offsetTop > lastAllowedTop && visible.length > 0) {
      var lastVisible = visible.pop();
      lastVisible.classList.add(CLS_HIDDEN);
      hiddenCount++;
      chip.textContent = '+' + hiddenCount + ' more';
      chip.setAttribute(
        'aria-label',
        hiddenCount + ' more selected. Open dropdown to view all selections.'
      );
    }

    wrapper.classList.remove(CLS_MEASURING);
    // Release the guard on the next frame so the observer skips
    // the mutations this pass generated.
    requestAnimationFrame(function () {
      inst.adjusting = false;
    });
  }

  function scheduleCollapse(wrapper, maxRows) {
    var inst = instances[wrapper.id];
    if (!inst) return;
    if (inst.raf) cancelAnimationFrame(inst.raf);
    inst.raf = requestAnimationFrame(function () {
      collapse(wrapper, maxRows);
    });
  }

  function init(widgetId, options) {
    var opts = options || {};
    var maxRows = opts.maxRows || 2;
    var tries = opts.retries != null ? opts.retries : 20;

    var wrapper = document.getElementById(widgetId);
    if (!wrapper) return;

    // virtual-select initializes async — retry briefly until it exists.
    if (!findValueEl(wrapper)) {
      if (tries > 0) {
        setTimeout(function () {
          init(widgetId, Object.assign({}, opts, { retries: tries - 1 }));
        }, 100);
      }
      return;
    }

    destroy(widgetId); // idempotent re-init
    wrapper.classList.add(CLS_BLOCK);

    var inst = { adjusting: false, raf: null, observers: [] };
    instances[widgetId] = inst;

    // Re-collapse whenever virtual-select re-renders the tag list…
    var mo = new MutationObserver(function () {
      if (!inst.adjusting) scheduleCollapse(wrapper, maxRows);
    });
    mo.observe(findValueEl(wrapper), { childList: true, subtree: true });
    inst.observers.push(mo);

    // …and whenever the control changes width.
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(function () {
        if (!inst.adjusting) scheduleCollapse(wrapper, maxRows);
      });
      ro.observe(wrapper.querySelector('.vscomp-toggle-button'));
      inst.observers.push(ro);
    }

    scheduleCollapse(wrapper, maxRows);
  }

  function destroy(widgetId) {
    var inst = instances[widgetId];
    if (!inst) return;
    inst.observers.forEach(function (o) { o.disconnect(); });
    if (inst.raf) cancelAnimationFrame(inst.raf);
    delete instances[widgetId];
  }

  global.RNTTagsCollapse = { init: init, destroy: destroy };
})(window);

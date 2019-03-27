/*!
 * bsStepper v1.5.0 (https://github.com/Johann-S/bs-stepper)
 * Copyright 2018 - 2019 Johann-S <johann.servoire@gmail.com>
 * Licensed under MIT (https://github.com/Johann-S/bs-stepper/blob/master/LICENSE)
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Stepper = factory());
}(this, function () { 'use strict';

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  var matches = window.Element.prototype.matches;

  var closest = function closest(element, selector) {
    return element.closest(selector);
  };

  var WinEvent = function WinEvent(inType, params) {
    return new window.Event(inType, params);
  };

  var createCustomEvent = function createCustomEvent(eventName, params) {
    var cEvent = new window.CustomEvent(eventName, params);
    return cEvent;
  };
  /* istanbul ignore next */


  function polyfill() {
    if (!window.Element.prototype.matches) {
      matches = window.Element.prototype.msMatchesSelector || window.Element.prototype.webkitMatchesSelector;
    }

    if (!window.Element.prototype.closest) {
      closest = function closest(element, selector) {
        if (!document.documentElement.contains(element)) {
          return null;
        }

        do {
          if (matches.call(element, selector)) {
            return element;
          }

          element = element.parentElement || element.parentNode;
        } while (element !== null && element.nodeType === 1);

        return null;
      };
    }

    if (!window.Event || typeof window.Event !== 'function') {
      WinEvent = function WinEvent(inType, params) {
        params = params || {};
        var e = document.createEvent('Event');
        e.initEvent(inType, Boolean(params.bubbles), Boolean(params.cancelable));
        return e;
      };
    }

    if (typeof window.CustomEvent !== 'function') {
      var originPreventDefault = window.Event.prototype.preventDefault;

      createCustomEvent = function createCustomEvent(eventName, params) {
        var evt = document.createEvent('CustomEvent');
        params = params || {
          bubbles: false,
          cancelable: false,
          detail: null
        };
        evt.initCustomEvent(eventName, params.bubbles, params.cancelable, params.detail);

        evt.preventDefault = function () {
          if (!this.cancelable) {
            return;
          }

          originPreventDefault.call(this);
          Object.defineProperty(this, 'defaultPrevented', {
            get: function get() {
              return true;
            }
          });
        };

        return evt;
      };
    }
  }

  polyfill();

  var MILLISECONDS_MULTIPLIER = 1000;
  var transitionEndEvent = 'transitionend';
  var customProperty = 'bsStepper';

  var show = function show(stepperNode, indexStep, options) {
    var stepper = stepperNode[customProperty];

    if (stepper._steps[indexStep].classList.contains(options.classNames.active) || stepper._stepsContents[indexStep].classList.contains(options.classNames.active)) {
      return;
    }

    var showEvent = createCustomEvent('show.bs-stepper', {
      cancelable: true,
      detail: {
        indexStep: indexStep
      }
    });
    stepperNode.dispatchEvent(showEvent);

    var activeStep = stepper._steps.filter(function (step) {
      return step.classList.contains(options.classNames.active);
    });

    var activeContent = stepper._stepsContents.filter(function (content) {
      return content.classList.contains(options.classNames.active);
    });

    if (showEvent.defaultPrevented) {
      return;
    }

    if (activeStep.length) {
      activeStep[0].classList.remove(options.classNames.active);
    }

    if (activeContent.length) {
      activeContent[0].classList.remove(options.classNames.active);
      activeContent[0].classList.remove(options.classNames.block);
    }

    showStep(stepperNode, stepper._steps[indexStep], stepper._steps, options);
    showContent(stepperNode, stepper._stepsContents[indexStep], stepper._stepsContents, activeContent, options);
  };

  var showStep = function showStep(stepperNode, step, stepList, options) {
    stepList.forEach(function (step) {
      var trigger = step.querySelector(options.selectors.trigger);
      trigger.setAttribute('aria-selected', 'false'); // if stepper is in linear mode, set disabled attribute on the trigger

      if (stepperNode.classList.contains(options.classNames.linear)) {
        trigger.setAttribute('disabled', 'disabled');
      }
    });
    step.classList.add(options.classNames.active);
    var currentTrigger = step.querySelector(options.selectors.trigger);
    currentTrigger.setAttribute('aria-selected', 'true'); // if stepper is in linear mode, remove disabled attribute on current

    if (stepperNode.classList.contains(options.classNames.linear)) {
      currentTrigger.removeAttribute('disabled');
    }
  };

  var showContent = function showContent(stepperNode, content, contentList, activeContent, options) {
    var shownEvent = createCustomEvent('shown.bs-stepper', {
      cancelable: true,
      detail: {
        indexStep: contentList.indexOf(content)
      }
    });

    function complete() {
      content.classList.add(options.classNames.block);
      content.removeEventListener(transitionEndEvent, complete);
      stepperNode.dispatchEvent(shownEvent);
    }

    if (content.classList.contains(options.classNames.fade)) {
      content.classList.remove(options.classNames.none);
      var duration = getTransitionDurationFromElement(content);
      content.addEventListener(transitionEndEvent, complete);

      if (activeContent.length) {
        activeContent[0].classList.add(options.classNames.none);
      }

      content.classList.add(options.classNames.active);
      emulateTransitionEnd(content, duration);
    } else {
      content.classList.add(options.classNames.active);
      stepperNode.dispatchEvent(shownEvent);
    }
  };

  var getTransitionDurationFromElement = function getTransitionDurationFromElement(element) {
    if (!element) {
      return 0;
    } // Get transition-duration of the element


    var transitionDuration = window.getComputedStyle(element).transitionDuration;
    var floatTransitionDuration = parseFloat(transitionDuration); // Return 0 if element or transition duration is not found

    if (!floatTransitionDuration) {
      return 0;
    } // If multiple durations are defined, take the first


    transitionDuration = transitionDuration.split(',')[0];
    return parseFloat(transitionDuration) * MILLISECONDS_MULTIPLIER;
  };

  var emulateTransitionEnd = function emulateTransitionEnd(element, duration) {
    var called = false;
    var durationPadding = 5;
    var emulatedDuration = duration + durationPadding;

    function listener() {
      called = true;
      element.removeEventListener(transitionEndEvent, listener);
    }

    element.addEventListener(transitionEndEvent, listener);
    window.setTimeout(function () {
      if (!called) {
        element.dispatchEvent(WinEvent(transitionEndEvent));
      }

      element.removeEventListener(transitionEndEvent, listener);
    }, emulatedDuration);
  };

  var detectAnimation = function detectAnimation(contentList, options) {
    if (options.animation) {
      contentList.forEach(function (content) {
        content.classList.add(options.classNames.fade);
        content.classList.add(options.classNames.none);
      });
    }
  };

  function buildClickStepLinearListener(options) {
    return function clickStepLinearListener(event) {
      event.preventDefault();
    };
  }

  function buildClickStepNonLinearListener(options) {
    return function clickStepNonLinearListener(event) {
      event.preventDefault();
      var step = closest(event.target, options.selectors.steps);
      var stepperNode = closest(step, options.selectors.stepper);
      var stepper = stepperNode[customProperty];

      var stepIndex = stepper._steps.indexOf(step);

      stepper._currentIndex = stepIndex;
      show(stepperNode, stepIndex, options);
    };
  }

  var DEFAULT_OPTIONS = {
    linear: true,
    animation: false,
    selectors: {
      steps: '.step',
      trigger: '.step-trigger',
      stepper: '.bs-stepper'
    },
    classNames: {
      active: 'active',
      linear: 'linear',
      block: 'dstepper-block',
      none: 'dstepper-none',
      fade: 'fade'
    }
  };

  var Stepper =
  /*#__PURE__*/
  function () {
    function Stepper(element, _options) {
      var _this = this;

      if (_options === void 0) {
        _options = {};
      }

      this._element = element;
      this._currentIndex = 0;
      this._stepsContents = [];
      this.options = _extends({}, DEFAULT_OPTIONS, _options); // FIXME(ioxua-os): Find a better alternative to deep copy objects

      this.options.selectors = _extends({}, DEFAULT_OPTIONS.selectors, this.options.selectors);
      this.options.classNames = _extends({}, DEFAULT_OPTIONS.classNames, this.options.classNames);

      if (this.options.linear) {
        this._element.classList.add(this.options.classNames.linear);
      }

      this._steps = [].slice.call(this._element.querySelectorAll(this.options.selectors.steps)).filter(function (step) {
        return step.hasAttribute('data-target');
      });

      this._steps.forEach(function (step) {
        _this._stepsContents.push(_this._element.querySelector(step.getAttribute('data-target')));
      });

      detectAnimation(this._stepsContents, this.options);

      this._setLinkListeners();

      Object.defineProperty(this._element, customProperty, {
        value: this,
        writable: true
      });

      if (this._steps.length) {
        show(this._element, this._currentIndex, this.options);
      }
    } // Private


    var _proto = Stepper.prototype;

    _proto._setLinkListeners = function _setLinkListeners() {
      var _this2 = this;

      this._steps.forEach(function (step) {
        var trigger = step.querySelector(_this2.options.selectors.trigger);

        if (_this2.options.linear) {
          _this2._clickStepLinearListener = buildClickStepLinearListener(_this2.options);
          trigger.addEventListener('click', _this2._clickStepLinearListener);
        } else {
          _this2._clickStepNonLinearListener = buildClickStepNonLinearListener(_this2.options);
          trigger.addEventListener('click', _this2._clickStepNonLinearListener);
        }
      });
    } // Public
    ;

    _proto.next = function next() {
      this._currentIndex = this._currentIndex + 1 <= this._steps.length - 1 ? this._currentIndex + 1 : this._steps.length - 1;
      show(this._element, this._currentIndex, this.options);
    };

    _proto.previous = function previous() {
      this._currentIndex = this._currentIndex - 1 >= 0 ? this._currentIndex - 1 : 0;
      show(this._element, this._currentIndex, this.options);
    };

    _proto.to = function to(stepNumber) {
      var tempIndex = stepNumber - 1;
      this._currentIndex = tempIndex >= 0 && tempIndex < this._steps.length ? tempIndex : 0;
      show(this._element, this._currentIndex, this.options);
    };

    _proto.reset = function reset() {
      this._currentIndex = 0;
      show(this._element, this._currentIndex, this.options);
    };

    _proto.destroy = function destroy() {
      var _this3 = this;

      this._steps.forEach(function (step) {
        var trigger = step.querySelector(_this3.options.selectors.trigger);

        if (_this3.options.linear) {
          trigger.removeEventListener('click', _this3._clickStepLinearListener);
        } else {
          trigger.removeEventListener('click', _this3._clickStepNonLinearListener);
        }
      });

      this._element[customProperty] = undefined;
      this._element = undefined;
      this._currentIndex = undefined;
      this._steps = undefined;
      this._stepsContents = undefined;
      this._clickStepLinearListener = undefined;
      this._clickStepNonLinearListener = undefined;
    };

    return Stepper;
  }();

  return Stepper;

}));
//# sourceMappingURL=bs-stepper.js.map

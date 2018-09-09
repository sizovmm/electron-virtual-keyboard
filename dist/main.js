'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('electron'),
    ipcMain = _require.ipcMain;

var EventEmitter = require('events');

var VirtualKeyboard = function (_EventEmitter) {
    _inherits(VirtualKeyboard, _EventEmitter);

    function VirtualKeyboard(webContent) {
        _classCallCheck(this, VirtualKeyboard);

        var _this = _possibleConstructorReturn(this, (VirtualKeyboard.__proto__ || Object.getPrototypeOf(VirtualKeyboard)).call(this));

        _this.webContent = webContent;
        _this.keyBuffer = [];
        _this.keyPressWait = 30;
        _this.init();
        return _this;
    }

    _createClass(VirtualKeyboard, [{
        key: 'init',
        value: function init() {
            var _this2 = this;

            // renderer to main process message api handlers
            ipcMain.on('virtual-keyboard-keypress', function (e, value) {
                return _this2.receiveKeyPress(e, value);
            });
            ipcMain.on('virtual-keyboard-config', this.config.bind(this));

            // redirect select events back to renderer process
            this.on('buffer-empty', function () {
                _this2.webContent.send('keyboard-buffer-empty');
            });
        }
    }, {
        key: 'config',
        value: function config(e, key, value) {
            if (key == 'keyPressWait') {
                this.keyPressWait = parseInt(value);
            }
        }
    }, {
        key: 'receiveKeyPress',
        value: function receiveKeyPress(e, value) {
            // continues adding keys to the key buffer without stopping a flush
            var chars = String(value).split('');
            for (var i = 0; i < chars.length; i++) {
                this.keyBuffer.push(chars[i]);
            }

            // don't call flushBuffer if already flushing
            if (!this.flushing) {
                this.flushBuffer();
            }
        }
    }, {
        key: 'flushBuffer',
        value: function flushBuffer() {
            var ch = this.keyBuffer.shift();
            if (ch === undefined) {
                this.flushing = false;
                this.emit('buffer-empty');
                return;
            }

            this.flushing = true;

            // keydown
            this.webContent.sendInputEvent({
                type: 'keyDown',
                keyCode: ch
            });

            // keypres
            this.webContent.sendInputEvent({
                type: 'char',
                keyCode: ch
            });

            // keyup
            this.webContent.sendInputEvent({
                type: 'keyUp',
                keyCode: ch
            });

            setTimeout(this.flushBuffer.bind(this), this.keyPressWait);
        }
    }]);

    return VirtualKeyboard;
}(EventEmitter);

module.exports = VirtualKeyboard;

(function createBrowserTtAdapter(global) {
  var canvas = document.getElementById("game");
  var textInput = document.getElementById("text-input");
  var keyboardInputHandlers = [];
  var keyboardConfirmHandlers = [];
  var keyboardCompleteHandlers = [];
  var keyboardBlurHandlers = [];
  var touchStartHandlers = [];
  var touchMoveHandlers = [];
  var touchEndHandlers = [];
  var wheelHandlers = [];
  var keyboardState = {
    value: "",
    maxLength: 300,
    active: false
  };

  function emit(list, event) {
    for (var i = 0; i < list.length; i += 1) list[i](event);
  }

  function normalizeTouchEvent(event) {
    return event;
  }

  function getSystemInfoSync() {
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(320, Math.round(rect.width || window.innerWidth || 375));
    var height = Math.max(568, Math.round(rect.height || window.innerHeight || 667));
    return {
      platform: /android/i.test(navigator.userAgent)
        ? "android"
        : /iphone|ipad|ios/i.test(navigator.userAgent)
          ? "ios"
          : "devtools",
      pixelRatio: window.devicePixelRatio || 1,
      windowWidth: width,
      windowHeight: height,
      screenWidth: width,
      screenHeight: height,
      safeArea: {
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        width: width,
        height: height
      }
    };
  }

  function createImage() {
    return new Image();
  }

  function loadFont(path) {
    if (!document.fonts || !path) return "";
    try {
      var font = new FontFace("VonwaonBitmap", "url(" + path + ")");
      font.load().then(function onFontLoad(loaded) {
        document.fonts.add(loaded);
      }).catch(function noop() {});
    } catch (error) {}
    return "VonwaonBitmap";
  }

  function request(options) {
    var method = options.method || "GET";
    fetch(options.url, {
      method: method,
      headers: options.header || options.headers || {},
      body: method.toUpperCase() === "GET" ? undefined : JSON.stringify(options.data || {})
    }).then(function onResponse(response) {
      return response.text().then(function onText(text) {
        if (options.success) {
          options.success({
            statusCode: response.status,
            data: text
          });
        }
      });
    }).catch(function onError(error) {
      if (options.fail) options.fail({ errMsg: error && error.message ? error.message : "request fail" });
    });
  }

  function downloadFile(options) {
    fetch(options.url).then(function onResponse(response) {
      if (!response.ok) throw new Error("downloadFile status " + response.status);
      return response.blob().then(function onBlob(blob) {
        var url = URL.createObjectURL(blob);
        if (options.success) {
          options.success({
            statusCode: response.status,
            tempFilePath: url,
            filePath: url
          });
        }
      });
    }).catch(function onError(error) {
      if (options.fail) options.fail({ errMsg: error && error.message ? error.message : "downloadFile fail" });
    });
  }

  function createInnerAudioContext() {
    var audio = new Audio();
    audio.preload = "auto";
    var api = {
      loop: false,
      autoplay: false,
      volume: 1,
      get src() {
        return audio.src;
      },
      set src(value) {
        audio.src = value || "";
      },
      get duration() {
        return audio.duration || 0;
      },
      get currentTime() {
        return audio.currentTime || 0;
      },
      set currentTime(value) {
        try {
          audio.currentTime = Number(value) || 0;
        } catch (error) {}
      },
      play: function play() {
        audio.loop = !!api.loop;
        audio.volume = typeof api.volume === "number" ? api.volume : 1;
        return audio.play();
      },
      pause: function pause() {
        audio.pause();
      },
      stop: function stop() {
        audio.pause();
        try {
          audio.currentTime = 0;
        } catch (error) {}
      },
      seek: function seek(value) {
        try {
          audio.currentTime = Number(value) || 0;
        } catch (error) {}
      },
      destroy: function destroy() {
        audio.pause();
        audio.src = "";
      },
      onCanplay: function onCanplay(fn) {
        audio.addEventListener("canplay", fn);
      },
      onPlay: function onPlay(fn) {
        audio.addEventListener("play", fn);
      },
      onEnded: function onEnded(fn) {
        audio.addEventListener("ended", fn);
      },
      onError: function onError(fn) {
        audio.addEventListener("error", function handleError() {
          fn({ errMsg: "audio error" });
        });
      }
    };
    return api;
  }

  function showKeyboard(options) {
    keyboardState.value = String((options && options.defaultValue) || "");
    keyboardState.maxLength = Number(options && options.maxLength) || 300;
    keyboardState.active = true;
    textInput.maxLength = keyboardState.maxLength;
    textInput.value = keyboardState.value;
    textInput.classList.add("active");
    setTimeout(function focusInput() {
      textInput.focus();
      textInput.setSelectionRange(textInput.value.length, textInput.value.length);
    }, 0);
    if (options && options.success) options.success();
  }

  function hideKeyboard() {
    if (!keyboardState.active) return;
    keyboardState.active = false;
    textInput.classList.remove("active");
    textInput.blur();
  }

  textInput.addEventListener("input", function onInput() {
    keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
    emit(keyboardInputHandlers, { value: keyboardState.value });
  });

  textInput.addEventListener("keydown", function onKeydown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
      emit(keyboardConfirmHandlers, { value: keyboardState.value });
      emit(keyboardCompleteHandlers, { value: keyboardState.value });
      hideKeyboard();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      hideKeyboard();
      emit(keyboardBlurHandlers, { value: keyboardState.value });
    }
  });

  textInput.addEventListener("blur", function onBlur() {
    if (!keyboardState.active) return;
    keyboardState.value = textInput.value.slice(0, keyboardState.maxLength);
    emit(keyboardBlurHandlers, { value: keyboardState.value });
    keyboardState.active = false;
    textInput.classList.remove("active");
  });

  canvas.addEventListener("wheel", function onWheel(event) {
    emit(wheelHandlers, event);
  }, { passive: false });

  global.tt = {
    createCanvas: function createCanvas() {
      return canvas;
    },
    isBrowserAdapter: true,
    createImage: createImage,
    getSystemInfoSync: getSystemInfoSync,
    getMenuButtonBoundingClientRect: function getMenuButtonBoundingClientRect() {
      return { top: 14, bottom: 46, left: getSystemInfoSync().windowWidth - 96, right: getSystemInfoSync().windowWidth - 16 };
    },
    loadFont: loadFont,
    request: request,
    downloadFile: downloadFile,
    createInnerAudioContext: createInnerAudioContext,
    showKeyboard: showKeyboard,
    hideKeyboard: hideKeyboard,
    onKeyboardInput: function onKeyboardInput(fn) {
      keyboardInputHandlers.push(fn);
    },
    onKeyboardConfirm: function onKeyboardConfirm(fn) {
      keyboardConfirmHandlers.push(fn);
    },
    onKeyboardComplete: function onKeyboardComplete(fn) {
      keyboardCompleteHandlers.push(fn);
    },
    onKeyboardBlur: function onKeyboardBlur(fn) {
      keyboardBlurHandlers.push(fn);
    },
    onTouchStart: function onTouchStart(fn) {
      touchStartHandlers.push(fn);
    },
    onTouchMove: function onTouchMove(fn) {
      touchMoveHandlers.push(fn);
    },
    onTouchEnd: function onTouchEnd(fn) {
      touchEndHandlers.push(fn);
    },
    onWheel: function onWheel(fn) {
      wheelHandlers.push(fn);
    },
    onMouseWheel: function onMouseWheel(fn) {
      wheelHandlers.push(fn);
    },
    getStorageSync: function getStorageSync(key) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        return "";
      }
    },
    setStorageSync: function setStorageSync(key, value) {
      try {
        localStorage.setItem(key, String(value));
      } catch (error) {}
    },
    getGameRecorderManager: null,
    shareAppMessage: null,
    saveVideoToPhotosAlbum: null,
    navigateToScene: null
  };
})(window);

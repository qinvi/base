var webSocketMse = {
    mseMap: null,
    mimeCodec: 'video/mp4; codecs="avc1.42e028"',
    needData: true,
    lastEndTime: 0,
    errorCount: 0,
    queue: [],
    sourceBuffer: null,
    mediaSource: null,
    checkInterval: null,
    ws: null,
    StopVideo: function (videoLabel) {
        let mseMap = webSocketMse.mseMap;
        if (mseMap == null) return;
        var mse = mseMap.get(videoLabel);
        if (mse != null) {
            mse.mseStop();
        }
    },

    msePlay: function (videoLabel, wsURL, call) {
        this.StopVideo(videoLabel);
        let me = webSocketMse;
        let mseMap = me.mseMap;
        if (mseMap == null) {
            mseMap = new Map();
        }
        me.video = videoLabel;
        // videoLabel.seekable = false;
        videoLabel.controls = false;
        videoLabel.oncontextmenu = function () {
            return false;
        }
        me.checkInterval = window.setInterval(this.checkTime, 4000);
        me.wsUrl = wsURL;
        let mimeCodec = me.mimeCodec;
        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
            this.mediaSource = new MediaSource();
            videoLabel.src = URL.createObjectURL(this.mediaSource);
            this.mediaSource.addEventListener('sourceopen', this.addSrcBuffer);
            this.mediaSource.addEventListener('sourceclose', this.srcClose);
        } else {
            // console.error('Unsupported MIME type or codec: ', mimeCodec);
        }
        mseMap.set(videoLabel, me);
        me.mseMap = mseMap;
        videoLabel.load();
        const promise = videoLabel.play();
        promise.then(function(json) {
            call(true);
        });
    },

    srcClose: function () {
        // console.log('source close----');
    },

    addSrcBuffer: function (_) {
        var mediaSource = this;
        let me = webSocketMse;
        me.sourceBuffer = mediaSource.addSourceBuffer(me.mimeCodec);

        // sourceBuffer.mode = 'sequence';
        me.sourceBuffer.addEventListener('update', function () {
            if (me.queue.length > 0) {
                me.sourceBuffer.appendBuffer(me.queue.shift());
            } else {
                me.needData = true;
            }
        });
        me.sourceBuffer.addEventListener('abort', function () {
            // console.log('buffer abort');
        });
        me.sourceBuffer.addEventListener('error', function () {
            // console.log('buffer error');
        });
        me.sourceBuffer.addEventListener('sourceclose', function () {
            // console.log('buffer source close')
        });
        me.sourceBuffer.addEventListener('sourceended', function () {
            // console.log('buffer source sourceended')
        });
        me.video.addEventListener('timeupdate', function () {

        });

        me.video.addEventListener('canplay', function () {
            // console.log('Got can play event');
            // me.video.play();
        });

        me.video.onerror = function () {
            var s = '';
            var err = me.video.error;

            switch (err.code) {
                case MediaError.MEDIA_ERR_ABORTED:
                    s += 'The user canceled the video.';
                    break;
                case MediaError.MEDIA_ERR_NETWORK:
                    s += 'A network error occurred while fetching the video.';
                    break;
                case MediaError.MEDIA_ERR_DECODE:
                    s += 'An error occurred while decoding the video.';
                    me.ws.close();
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    s += 'The video is missing or is in a format not supported by your browser.';
                    break;
                default:
                    s += 'An unknown error occurred.';
                    break;
            }

            var message = err.message;

            if (message && message.length) {
                s += ' ' + message;
            }

            console.log('<strong>Error ' + err.code + ':</strong> ' + s + '<br>');
        };

        // console.log('Done with addSourceBuffer');
        var ws = new WebSocket(me.wsUrl);
        me.ws = ws;
        ws.binaryType = 'arraybuffer';
        ws.onopen = function () { };
        ws.onmessage = function (evt) {

            if (evt.data instanceof ArrayBuffer) {
                if (me.needData && !me.sourceBuffer.updating) {
                    try {
                        me.sourceBuffer.appendBuffer(new Uint8Array(evt.data));
                    } catch (e) {
                        // console.log('appendBuffer--->>' + e.message);

                    }

                    me.needData = false;
                } else {
                    if (me.queue.length > 3) {
                        ws.send('getKeyFrame'); // request I frame
                        return; // lost all frame later
                    }
                    me.queue.push(new Uint8Array(evt.data));
                }
            }
        };
        ws.onclose = function (evt) {
            // console.log('WebSocket is closed: ', evt.reason, evt.code);

        };
        ws.onerror = function (evt) {
            // console.log('WebSocket error: ', evt.data);
        }
    },

    mseStop: function () {
        // console.info('mseStop')
        let me = webSocketMse;
        if (me.ws != null) {
            window.clearInterval(me.checkInterval);
            me.ws.close();
            me.ws = null;
            try {
                // console.log('end stream--');
                me.mediaSource.endOfStream();
            } catch (e) {

            }
            // console.log('Mes stop--');
            me.queue = [];
            me.mediaSource.removeSourceBuffer(me.sourceBuffer);
            window.URL.revokeObjectURL(me.video.src);
            me.mseMap.delete(me.video);
            me.video = undefined;
            me = null;
        }
    },

    mseRequestAudio: function (req) {
        let me = webSocketMse;
        if (me.ws === null) return false;
        if (req === true) {
            me.ws.send('requestAudio');
        } else {
            me.ws.send('stopAudio');
        }
        return true;
    },

    replay: function () {
        let me = webSocketMse;
        window.clearInterval(me.checkInterval);
        try {
            me.mediaSource.removeSourceBuffer(me.sourceBuffer);
            me.mediaSource.endOfStream();
            me.ws.close();
            window.URL.revokeObjectURL(me.video.src);
            me.video.src = '';
        } catch (e) {

        }
        me.lastEndTime = 0;
        me.errorCount = 0;
        me.queue = [];
        me.needData = true;
        me.mediaSource = new MediaSource();
        me.video.src = URL.createObjectURL(me.mediaSource);
        me.mediaSource.addEventListener('sourceopen', me.addSrcBuffer);
        me.video.load();
        me.video.play();
        me.checkInterval = window.setInterval(me.checkTime, 4000);
        // console.log('--replay---');
    },

    checkTime: function () {
        let me = webSocketMse;
        if (me.ws != null) {
            if (me.ws.CLOSED === me.ws.readyState) {
                // console.log('--netstat close--')
                me.replay();
                return;
            }
        }
        try {
            if (me.sourceBuffer.buffered.length === 0) {
                me.errorCount++;
                if (me.errorCount >= 6 && me.queue.length > 0) {
                    me.errorCount = 0;
                    // console.log('--lltry replay--')
                    me.replay();
                    return;
                }
                return;
            }
            var bufferedRange = me.sourceBuffer.buffered;
            var eeend = bufferedRange.end(bufferedRange.length - 1);
            var eltime = eeend - me.video.currentTime;

            if (eltime > 4) {
                // console.log('stime---' + me.video.currentTime)
                me.video.currentTime = bufferedRange.end(bufferedRange.length - 1) - 0.3;
                // console.log('etime---' + me.video.currentTime)
            }
            if (eltime < -4) { // for chrome 5.0
                if (bufferedRange.length > 1) {
                    // console.log('-current' + me.video.currentTime + 'end:' + eeend);
                    me.video.currentTime = eeend;
                    return;
                }
            }

            if (me.lastEndTime === 0) {

            } else {
                if (me.lastEndTime === me.video.currentTime) {
                    me.errorCount++;
                    if (me.errorCount >= 2 && me.queue.length === 0) {
                        me.errorCount = 0;
                        // console.log('--try replay-- bufferCount' + bufferedRange.length)

                        if (bufferedRange.length > 1) {
                            // console.log('current' + me.video.currentTime + 'end:' + eeend);
                        }
                        if (navigator.appVersion.indexOf('Chrome') >= 0) {
                            me.video.currentTime = me.video.currentTime;
                            // console.log('chrome seek time cur')
                        } else {
                            me.replay();
                        }
                        return;
                    }
                } else {
                    if (me.errorCount > 0) {
                        me.errorCount = 0;
                    }
                }
            }
            me.lastEndTime = me.video.currentTime;

        } catch (e) {
            // console.log('--->>' + e.message + '\r\nneedData:' + e.needData + 'updating:' + me.sourceBuffer.updating);
            // TODO handle the exception
        }

    }

}
module.exports = webSocketMse;

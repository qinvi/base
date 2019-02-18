var liveVideo = {
    lvMap: new Map(),
    lastEndTime: 0,
    errorCount: 0,
    checkInterval: null,

    liveStopVideo: function (videoLabel) {
        var mse = this.lvMap.get(videoLabel);
        if (mse != null) {
            mse.lvStop();
        }
    },

    lvPlay: function (videoLabel, lvURL, call) {
        this.video = videoLabel;
        let me = this;
        videoLabel.seekable = false;
        videoLabel.controls = false;
        videoLabel.oncontextmenu = function () {
            return false;
        }

        this.checkInterval = window.setInterval(this.checkTime, 4000);
        me.lvURL = lvURL;

        this.lvMap.set(videoLabel, me);
        videoLabel.src = lvURL;
        const promise = videoLabel.play();
        promise.then(function(json) {
            call(true);
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
                    break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    s += 'The video is missing or is in a format not supported by your browser.';
                    break;
                default:
                    s += 'An unknown error occurred.';
            }

            var message = err.message;

            if (message && message.length) {
                s += ' ' + message;
            }

            console.log('<strong>Error ' + err.code + ':</strong> ' + s + '<br>');
        }
    },

    lvStop: function () {
        let me = this;
        window.clearInterval(me.checkInterval);
        me.lvMap.delete(me.video);
        me.video.pause();
        me.video.src = '';
        me = null;
    },

    lvRequestAudio: function (req) {
        return false;
    },

    replay: function () {
        let me = this;
        me.lastEndTime = 0;
        me.video.pause();
        me.video.src = me.lvURL;
        me.video.play();
        console.log('--lvreplay---');
    },

    checkTime: function () {
        let me = this;
        if (me.video.networkState !== me.video.NETWORK_LOADING) {
            me.replay();
            return;
        }

        try {
            var bufferedRange = me.video.buffered;

            if (me.lastEndTime === 0) {

            } else {
                if (me.lastEndTime === bufferedRange.end(0)) {
                    me.errorCount++;
                    if (me.errorCount >= 3) {
                        me.errorCount = 0;
                        console.log('-----\r\n' + me.lastEndTime + 'end:' + bufferedRange.end(0));
                        // me.replay(); //TODO
                        return;
                    }
                } else {
                    me.errorCount = 0;
                }
            }
            me.lastEndTime = bufferedRange.end(0);
        } catch (e) {
            console.log('--->>' + e.message);
        }
    }
}
module.exports = liveVideo;

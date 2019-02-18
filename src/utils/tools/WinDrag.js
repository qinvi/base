const drag = {
    // 最上层的 zIndex 值
    zIndex: 5000,

    /**
     * 使窗口可以拖动
     *
     * @param {object} handle 用于拖拽的目标
     * @param {object} target 需要拖拽的面板
     * @param {object} map 地图对象
     */
    drag(handle, target, map) {
        handle = handle || target;
        handle.style.cursor = 'move';

        // 将最新初始化的弹窗放置在最上层
        handle.style.zIndex = drag.zIndex + 1;
        target.style.zIndex = drag.zIndex + 1;
        // target.style.transform = 'none';
        drag.zIndex++;

        const clientWidth = document.documentElement.clientWidth;
        const clientHeight = document.documentElement.clientHeight;
        let mapEventControler = true;
        let marginLeft = target.style.marginLeft;
        marginLeft = !!marginLeft ? marginLeft : '0px';
        marginLeft = marginLeft.replace('px');
        const leftAbs = Math.abs(parseInt(marginLeft));
        handle.onmousedown = function(event) {
            event = event || window.event;

            // 点击或拖曳弹窗时将其置于最上层
            target.style.zIndex = drag.zIndex;
            drag.zIndex++;

            const disX = event.clientX - target.offsetLeft;
            const disY = event.clientY - target.offsetTop;
            mapEventControler = true;

            document.onmousemove = function(devent) {
                devent = devent || window.devent;
                let iL = devent.clientX - disX - parseInt(marginLeft);
                let iT = devent.clientY - disY;
                const maxL = document.documentElement.clientWidth - target.offsetWidth - parseInt(marginLeft);
                const maxT = document.documentElement.clientHeight - target.offsetHeight;
                if (iL <= leftAbs) iL = leftAbs;
                if (iT <= 0) iT = 0;
                if (iL >= maxL) iL = maxL;
                if (iT >= maxT) iT = maxT;
                target.style.left = iL + 'px';
                target.style.top = iT + 'px';
                return false;
            };
            // 对嵌套iframe的做特殊处理
            document.onmouseover = function(e) {
                if (e.path[1].id === 'pdf_page') {
                    document.onmousemove = null;
                    document.onmouseup = null;
                    mapEventControler = false;
                    document.onmouseover = null;
                }
            }

            handle.onmouseout = function() {
                if (map) {
                    map.on('mousemove', map, function(e) {
                        if (mapEventControler) {
                            let iL = e.pageX - disX - parseInt(marginLeft);
                            let iT = e.pageY - disY;
                            const maxL = clientWidth - target.offsetWidth - parseInt(marginLeft);
                            const maxT = clientHeight - target.offsetHeight;
                            if (iL <= leftAbs) iL = leftAbs;
                            if (iT <= 0) iT = 0;
                            if (iL >= maxL) iL = maxL;
                            if (iT >= maxT) iT = maxT;
                            target.style.left = iL + 'px';
                            target.style.top = iT + 'px';
                            return false;
                        }
                    });
                    map.on('mouseup', map, function(e) {
                        mapEventControler = false;
                        document.onmousemove = null;
                        document.onmouseup = null;
                        target.style.zIndex = drag.zIndex;
                        drag.zIndex++;
                    });
                }
            };
            document.onmouseup = function() {
                document.onmousemove = null;
                document.onmouseup = null;
                mapEventControler = false;
            };
            return false;
        };
    },

    init(handle, target, map) {
        let call = window.setInterval(() => {
            if (!!handle) {
                this.drag(handle, target, lmap.map);
                window.clearInterval(call);
            }
        }, 10);
    }
};

module.exports = drag;

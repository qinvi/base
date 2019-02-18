var DragCircle = require('./drag-circle')
var Distance = require('./Distance')

var custom = {
    init(type) {
        if (type === 'dragCircle') {
            return DragCircle;
        } else if (type === 'sector') {
            return;
        } else if (type === 'distance') {
            return Distance;
        }
    }
};

module.exports = custom;

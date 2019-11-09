cc.Class({
    extends: cc.Component,

    properties: {
        numLabel: {
            default: null,
            type: cc.Label
        },
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad () {
        this.numLabel.string = 0;
    },

    start () {

    },

    setTargetNum (num) {
        this.numLabel.string = num;
    }

    // update (dt) {},
});

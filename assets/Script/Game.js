var ballDistance = 120;
var rotationSpeed = 4;
var angleRange = [25, 155];
var visibleTargets = 7;
var bgColors = ['#62bd18', "#ffbb00", '#ff5300', '#d21034', '#ff475c', '#8f16b2'];

cc.Class({
    extends: cc.Component,

    properties: {
        background: {
            default: null,
            type: cc.Node
        },
        label: {
            default: null,
            type: cc.Label
        },
        gameGroup: {
            default: null,
            type: cc.Node
        },
        balls: [cc.Node],
        arm: {
            default: null,
            type: cc.Node
        },
        targetGroup: {
            default: null,
            type: cc.Node
        },
        targetPrefab: {
            default: null,
            type: cc.Prefab
        }
    },

    // use this for initialization
    onLoad () {
        // 本地存储数据
        this.localData = {
            level: 1,
            bestScore: 0
        };
        this.gameWidth = this.node.width;
        this.gameHeight = this.node.height;
        this.solidBallPosX = 0;
        this.solidBallPosY = -this.gameHeight / 5;

        this.targetArray = [];
        this.targetPool = new cc.NodePool();

        this.startGame();

        this.node.on(cc.Node.EventType.TOUCH_START, function (event) {
            this.changeBall();
        }, this);
    },

    startGame () {
        this.label.string = 0;
        // cc.sys.localStorage.setItem('circlepath', JSON.stringify(localData));
        this.localStorage = JSON.parse(cc.sys.localStorage.getItem('circlepath'));
        console.log('localStorage = ' + this.localStorage);
        if (this.localStorage == null) {
            this.bestScore = this.localData.bestScore;
        } else {
            this.bestScore = this.localStorage.bestScore;
        }
        // this.label.string = this.bestScore;

        let colorIndex = Math.floor(Math.random() * bgColors.length);
        console.log('colorIndex = ' + colorIndex);
        this.backgroundColor = "#000000";//bgColors[colorIndex];
        console.log('backgroundColor = ' + this.backgroundColor);
        //this.background.color = cc.Color.BLACK.fromHEX(this.backgroundColor);

        do {
            this.tintColor = bgColors[Math.floor(Math.random() * bgColors.length)];
        } while (this.backgroundColor == this.tintColor)
        // this.label.node.color = cc.Color.BLACK.fromHEX(this.tintColor);

        this.gameGroup.position = cc.v2(this.solidBallPosX, this.solidBallPosY);
        this.arm.active = true;
        // this.arm.color = cc.Color.BLACK.fromHEX(this.tintColor);
        this.arm.position = cc.v2(100, 0);
        this.arm.angle = 0;
        this.balls[0].stopAllActions();
        // this.balls[0].color = cc.Color.BLACK.fromHEX(this.tintColor);
        this.balls[0].position = cc.v2(100, 0);
        this.balls[0].opacity = 255;
        this.balls[1].stopAllActions();
        // this.balls[1].color = cc.Color.BLACK.fromHEX(this.tintColor);
        this.balls[1].position = cc.v2(220, 0);
        this.balls[1].opacity = 255;
        this.rotationAngle = 0;
        this.rotatingBall = 1;

        this.destroy = false;
        this.steps = 0;
        this.saveRotationSpeed = rotationSpeed;
        this.rotatingDirection = Math.round(Math.random() * 1);
        console.log('rotatingDirection = ' + this.rotatingDirection);

        for (var i = 0; i < this.targetArray.length; i++) {
            this.targetArray[i].stopAllActions();
            this.targetArray[i].opacity = 255;
            this.targetPool.put(this.targetArray[i]);
        }
        // 清空对象数组
        this.targetArray = [];
        // 初始化目标球组
        let target = this.getTargetPrefab();
        target.x = this.balls[0].x;
        target.y = this.balls[0].y;
        target.parent = this.targetGroup;
        var targetComp = target.getComponent("Target");
        targetComp.setTargetNum(this.steps);
        this.targetArray.push(target);
        for (var i = 0; i < visibleTargets; i++) {
            this.addTarget(); 
        }
    },

    // called every frame
    update (dt) {
        // mag() 返回向量的长度
        var distanceFromTarget = this.balls[this.rotatingBall].position.sub(this.targetArray[1].position).mag();
        if (distanceFromTarget > 360 && this.destroy && this.steps > visibleTargets) {
             this.gameOver();
        }
        if (distanceFromTarget < 40 && !this.destroy) {
             this.destroy = true;
        }
        this.rotationAngle = (this.rotationAngle + this.saveRotationSpeed * (this.rotatingDirection * 2 - 1)) % 360;
        this.arm.angle = this.rotationAngle + 90;
        this.balls[this.rotatingBall].x = this.balls[1 - this.rotatingBall].x - ballDistance * Math.sin(this.rotationAngle / 180 * Math.PI);
        this.balls[this.rotatingBall].y = this.balls[1 - this.rotatingBall].y + ballDistance * Math.cos(this.rotationAngle / 180 * Math.PI);
        let solidBall = this.balls[1 - this.rotatingBall];
        let worldPosition = this.gameGroup.convertToWorldSpaceAR(solidBall.position);
        let canvasPosition = this.node.convertToNodeSpaceAR(worldPosition);
        var distanceX = canvasPosition.x - this.solidBallPosX;
        var distanceY = canvasPosition.y - this.solidBallPosY;
        this.gameGroup.x = cc.misc.lerp(this.gameGroup.x, this.gameGroup.x - distanceX, 0.05);
        this.gameGroup.y = cc.misc.lerp(this.gameGroup.y, this.gameGroup.y - distanceY, 0.05); 
    },
    
    changeBall () {
        this.destroy = false;
        // mag() 返回向量的长度
        var distanceFromTarget = this.balls[this.rotatingBall].position.sub(this.targetArray[1].position).mag();
        if (distanceFromTarget < 20) {
            this.rotatingDirection = Math.round(Math.random() * 1);
            let doneTarget = this.targetArray[0];
            cc.tween(doneTarget)
                .to(0.5, { opacity: 0 }, { easing: 'cubicIn' })
                // 当前面的动作都执行完毕后才会调用这个回调函数
                .call(() => {
                    cc.log('Target Removed')
                    this.removeTargetPrefab(doneTarget);
                }).start();
            this.targetArray.shift();
            this.arm.position = this.balls[this.rotatingBall].position;
            this.rotatingBall = 1 - this.rotatingBall;
            this.rotationAngle = this.balls[1 - this.rotatingBall].position.angle(this.balls[this.rotatingBall].position, true) - 90;
            this.arm.angle = this.rotationAngle + 90; 
            for(var i = 0; i < this.targetArray.length; i++){
                this.targetArray[i].opacity += 255 / visibleTargets;  
            }
            this.addTarget();

            this.label.string = this.steps - visibleTargets;
        } else {
            this.gameOver();
        }   
    },

    addTarget () {
        this.steps++;
        let startX = this.targetArray[this.targetArray.length - 1].x;
        let startY = this.targetArray[this.targetArray.length - 1].y;          
        let target = this.getTargetPrefab();
        var randomAngle = angleRange[0] + Math.floor(Math.random() * (angleRange[1] - angleRange[0]));
        // 角度转为弧度：randomAngle / 180 * Math.PI
        target.x = startX + ballDistance * Math.cos(randomAngle / 180 * Math.PI);
        target.y = startY + ballDistance * Math.sin(randomAngle / 180 * Math.PI);
        target.opacity = 255 * (1 - this.targetArray.length * (1 / visibleTargets));
        target.parent = this.targetGroup;
        var targetComp = target.getComponent("Target");
        targetComp.setTargetNum(this.steps);
        this.targetArray.push(target);      
   },

   gameOver () {
        cc.sys.localStorage.setItem('circlepath', JSON.stringify({
            bestScore: Math.max(this.bestScore, this.steps - visibleTargets)
        }));
        cc.log('Score = ' + (this.steps - visibleTargets));
        this.saveRotationSpeed = 0;
        this.arm.active = false;
        cc.tween(this.balls[1 - this.rotatingBall])
            .to(1, { opacity: 0 }, { easing: 'cubicOut' })
            // 当前面的动作都执行完毕后才会调用这个回调函数
            .call(() => {
                cc.log('Game Over')
                this.startGame();
            }).start();
    },

    getTargetPrefab () {
        let targetNode = this.targetPool.get();
        if (targetNode == null) {
            targetNode = cc.instantiate(this.targetPrefab);
        }
        return targetNode;
    },

    removeTargetPrefab (targetNode) {
        this.targetPool.put(targetNode); 
    }
});

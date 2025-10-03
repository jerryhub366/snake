// 游戏常量
var CELL_SIZE = 20;
var INITIAL_SNAKE_LENGTH = 3;
var FOOD_COLOR = '#e74c3c';
var SNAKE_HEAD_COLOR = '#2ecc71';
var SNAKE_BODY_COLOR = '#27ae60';

// 游戏状态
var GameState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// 方向
var Direction = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// 难度设置
var Difficulty = {
    EASY: { speed: 8, name: 'easy' },
    MEDIUM: { speed: 12, name: 'medium' },
    HARD: { speed: 16, name: 'hard' }
};

// 游戏类
function SnakeGame() {
    // 获取DOM元素
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreElement = document.getElementById('current-score');
    this.highScoreElement = document.getElementById('high-score');
    this.startButton = document.getElementById('start-button');
    this.pauseButton = document.getElementById('pause-button');
    this.restartButton = document.getElementById('restart-button');
    this.gameOverElement = document.getElementById('game-over');
    this.finalScoreElement = document.getElementById('final-score');
    this.difficultySelect = document.getElementById('difficulty');
    this.languageSelect = document.getElementById('language-select');
    
    // 游戏属性
    this.gridWidth = 0;
    this.gridHeight = 0;
    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.score = 0;
    this.highScore = 0;
    this.gameState = GameState.IDLE;
    this.lastRenderTime = 0;
    this.gameSpeed = Difficulty.MEDIUM.speed;
    this.touchStartX = 0;
    this.touchStartY = 0;
    
    // 音效
    this.eatSound = document.getElementById('eat-sound');
    this.gameOverSound = document.getElementById('game-over-sound');
    
    // 初始化
    this.init();
}

// 初始化游戏
SnakeGame.prototype.init = function() {
    // 设置语言
    var savedLang = localStorage.getItem('snakeGameLanguage') || 'zh';
    if (this.languageSelect) {
        this.languageSelect.value = savedLang;
    }
    
    // 设置画布大小
    this.resizeCanvas();
    
    // 加载高分
    this.loadHighScore();
    
    // 初始化国际化
    window.i18n = new I18n();
    
    // 添加事件监听
    this.addEventListeners();
    
    // 初始化游戏
    this.reset();
    
    // 渲染初始状态
    this.render();
};

// 重置游戏
SnakeGame.prototype.reset = function() {
    // 重置游戏状态
    this.gameState = GameState.IDLE;
    this.score = 0;
    this.updateScore();
    
    // 重置蛇的位置和长度
    this.initializeSnake();
    
    // 生成食物
    this.generateFood();
    
    // 重置方向
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    
    // 隐藏游戏结束界面
    if (this.gameOverElement) {
        this.gameOverElement.classList.add('hidden');
    }
    
    // 重置按钮状态
    if (this.pauseButton) {
        this.pauseButton.disabled = false;
        this.pauseButton.textContent = window.i18n ? window.i18n.translate('pause_game') : '暂停游戏';
    }
};

// 初始化蛇
SnakeGame.prototype.initializeSnake = function() {
    this.snake = [];
    var centerX = Math.floor(this.gridWidth / 2);
    var centerY = Math.floor(this.gridHeight / 2);
    
    for (var i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
        this.snake.push({
            x: centerX - i,
            y: centerY
        });
    }
};

// 生成食物
SnakeGame.prototype.generateFood = function() {
    var newFood;
    var foodOnSnake = true;
    
    // 确保食物不会生成在蛇身上
    while (foodOnSnake) {
        newFood = {
            x: Math.floor(Math.random() * this.gridWidth),
            y: Math.floor(Math.random() * this.gridHeight)
        };
        
        foodOnSnake = false;
        for (var i = 0; i < this.snake.length; i++) {
            var segment = this.snake[i];
            if (segment.x === newFood.x && segment.y === newFood.y) {
                foodOnSnake = true;
                break;
            }
        }
    }
    
    this.food = newFood;
};

// 移动蛇
SnakeGame.prototype.moveSnake = function() {
    // 更新方向
    this.direction = this.nextDirection;
    
    // 创建新的头部
    var head = { x: this.snake[0].x, y: this.snake[0].y };
    
    // 根据方向移动头部
    switch (this.direction) {
        case Direction.UP:
            head.y -= 1;
            break;
        case Direction.DOWN:
            head.y += 1;
            break;
        case Direction.LEFT:
            head.x -= 1;
            break;
        case Direction.RIGHT:
            head.x += 1;
            break;
    }
    
    // 检查是否吃到食物
    var ateFood = head.x === this.food.x && head.y === this.food.y;
    
    // 处理穿墙
    if (head.x < 0) head.x = this.gridWidth - 1;
    if (head.x >= this.gridWidth) head.x = 0;
    if (head.y < 0) head.y = this.gridHeight - 1;
    if (head.y >= this.gridHeight) head.y = 0;
    
    // 将新头部添加到蛇身
    this.snake.unshift(head);
    
    // 如果没有吃到食物，移除尾部
    if (!ateFood) {
        this.snake.pop();
    } else {
        // 吃到食物，增加分数并生成新食物
        this.score += 10;
        this.updateScore();
        this.generateFood();
        
        // 播放音效
        if (this.eatSound) {
            this.eatSound.currentTime = 0;
            this.eatSound.play().catch(function(error) {
                console.log("音频播放失败:", error);
            });
        }
    }
    
    // 检查是否撞到自己
    this.checkCollision();
};

// 检查碰撞
SnakeGame.prototype.checkCollision = function() {
    var head = this.snake[0];
    
    // 检查是否撞到自己
    for (var i = 1; i < this.snake.length; i++) {
        if (this.snake[i].x === head.x && this.snake[i].y === head.y) {
            this.gameOver();
            break;
        }
    }
};

// 游戏结束
SnakeGame.prototype.gameOver = function() {
    this.gameState = GameState.GAME_OVER;
    
    // 更新高分
    if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('snakeHighScore', this.highScore);
        this.updateHighScore();
    }
    
    // 播放音效
    if (this.gameOverSound) {
        this.gameOverSound.currentTime = 0;
        this.gameOverSound.play().catch(function(error) {
            console.log("音频播放失败:", error);
        });
    }
    
    // 显示游戏结束界面
    if (this.finalScoreElement) {
        this.finalScoreElement.textContent = this.score;
    }
    
    if (this.gameOverElement) {
        this.gameOverElement.classList.remove('hidden');
    } else if (this.gameOverModal) {
        this.gameOverModal.style.display = 'flex';
    }
};

// 绘制食物
SnakeGame.prototype.drawFood = function() {
    this.ctx.fillStyle = FOOD_COLOR;
    
    // 绘制圆形食物
    var centerX = this.food.x * CELL_SIZE + CELL_SIZE / 2;
    var centerY = this.food.y * CELL_SIZE + CELL_SIZE / 2;
    var radius = CELL_SIZE / 2 * 0.8;
    
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
};

// 绘制蛇
SnakeGame.prototype.drawSnake = function() {
    // 绘制蛇身
    for (var i = 1; i < this.snake.length; i++) {
        var segment = this.snake[i];
        this.ctx.fillStyle = SNAKE_BODY_COLOR;
        this.ctx.fillRect(
            segment.x * CELL_SIZE,
            segment.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
    }
    
    // 绘制蛇头
    var head = this.snake[0];
    this.ctx.fillStyle = SNAKE_HEAD_COLOR;
    this.ctx.fillRect(
        head.x * CELL_SIZE,
        head.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE
    );
    
    // 绘制眼睛
    this.ctx.fillStyle = 'white';
    var eyeSize = CELL_SIZE / 5;
    var eyeOffset = CELL_SIZE / 4;
    
    // 根据方向绘制眼睛
    switch (this.direction) {
        case Direction.UP:
            this.ctx.fillRect(head.x * CELL_SIZE + eyeOffset, head.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            this.ctx.fillRect(head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, head.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            break;
        case Direction.DOWN:
            this.ctx.fillRect(head.x * CELL_SIZE + eyeOffset, head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            this.ctx.fillRect(head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case Direction.LEFT:
            this.ctx.fillRect(head.x * CELL_SIZE + eyeOffset, head.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            this.ctx.fillRect(head.x * CELL_SIZE + eyeOffset, head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case Direction.RIGHT:
            this.ctx.fillRect(head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, head.y * CELL_SIZE + eyeOffset, eyeSize, eyeSize);
            this.ctx.fillRect(head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
    }
};

// 绘制网格
SnakeGame.prototype.drawGrid = function() {
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.lineWidth = 1;
    
    // 绘制垂直线
    for (var x = 0; x <= this.gridWidth; x++) {
        this.ctx.beginPath();
        this.ctx.moveTo(x * CELL_SIZE, 0);
        this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
        this.ctx.stroke();
    }
    
    // 绘制水平线
    for (var y = 0; y <= this.gridHeight; y++) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y * CELL_SIZE);
        this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
        this.ctx.stroke();
    }
};

// 游戏循环
SnakeGame.prototype.gameLoop = function(currentTime) {
    window.requestAnimationFrame(this.gameLoop.bind(this));
    
    var secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
    
    // 如果时间间隔太短，不更新
    if (secondsSinceLastRender < 1 / this.gameSpeed) return;
    
    this.lastRenderTime = currentTime;
    
    // 如果游戏正在进行，更新游戏状态
    if (this.gameState === GameState.PLAYING) {
        this.update();
    }
    
    // 渲染游戏
    this.render();
};

// 更新游戏状态
SnakeGame.prototype.update = function() {
    this.moveSnake();
};

// 渲染游戏
SnakeGame.prototype.render = function() {
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制网格
    this.drawGrid();
    
    // 绘制食物
    this.drawFood();
    
    // 绘制蛇
    this.drawSnake();
};

// 开始游戏
SnakeGame.prototype.start = function() {
    if (this.gameState === GameState.IDLE || this.gameState === GameState.GAME_OVER) {
        this.reset();
        this.gameState = GameState.PLAYING;
        
        // 隐藏开始游戏消息
        var gameMessage = document.getElementById('game-message');
        if (gameMessage) {
            gameMessage.classList.add('hidden');
        }
        
        // 启用暂停按钮
        if (this.pauseButton) {
            this.pauseButton.disabled = false;
        }
    }
};

// 暂停游戏
SnakeGame.prototype.pause = function() {
    if (this.gameState === GameState.PLAYING) {
        this.gameState = GameState.PAUSED;
        this.pauseButton.textContent = window.i18n ? window.i18n.translate('resume_game') : '继续游戏';
    } else if (this.gameState === GameState.PAUSED) {
        this.gameState = GameState.PLAYING;
        this.pauseButton.textContent = window.i18n ? window.i18n.translate('pause_game') : '暂停游戏';
    }
};

// 更新分数显示
SnakeGame.prototype.updateScore = function() {
    if (this.scoreElement) {
        this.scoreElement.textContent = this.score;
    }
};

// 更新高分显示
SnakeGame.prototype.updateHighScore = function() {
    if (this.highScoreElement) {
        this.highScoreElement.textContent = this.highScore;
    }
};

// 加载高分
SnakeGame.prototype.loadHighScore = function() {
    var highScore = localStorage.getItem('snakeHighScore');
    if (highScore !== null) {
        this.highScore = parseInt(highScore);
        this.updateHighScore();
    }
};

// 调整画布大小
SnakeGame.prototype.resizeCanvas = function() {
    var container = this.canvas.parentElement;
    var containerWidth = container.clientWidth;
    var containerHeight = container.clientHeight;
    
    // 计算画布大小，保持正方形
    var size = Math.min(containerWidth, containerHeight);
    
    // 设置画布大小
    this.canvas.width = size;
    this.canvas.height = size;
    
    // 计算网格大小
    this.gridWidth = Math.floor(size / CELL_SIZE);
    this.gridHeight = Math.floor(size / CELL_SIZE);
    
    // 检测是否为移动设备
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 在移动设备上减小网格大小以提高性能
    if (isMobile && (this.gridWidth > 20 || this.gridHeight > 20)) {
        this.gridWidth = Math.min(this.gridWidth, 20);
        this.gridHeight = Math.min(this.gridHeight, 20);
    }
};

// 添加事件监听
SnakeGame.prototype.addEventListeners = function() {
    var self = this;
    
    // 键盘控制
    document.addEventListener('keydown', function(e) {
        self.handleKeyDown(e);
    });
    
    // 按钮控制
    if (this.startButton) {
        this.startButton.addEventListener('click', function() {
            self.start();
        });
    }
    
    if (this.pauseButton) {
        this.pauseButton.addEventListener('click', function() {
            self.pause();
        });
    }
    
    if (this.restartButton) {
        this.restartButton.addEventListener('click', function() {
            self.reset();
        });
    }
    
    // 关闭模态框
    if (this.closeModalButton) {
        this.closeModalButton.addEventListener('click', function() {
            self.gameOverModal.style.display = 'none';
        });
    }
    
    // 难度选择
    if (this.difficultySelect) {
        this.difficultySelect.addEventListener('change', function() {
            var selectedDifficulty = self.difficultySelect.value;
            switch (selectedDifficulty) {
                case 'easy':
                    self.gameSpeed = Difficulty.EASY.speed;
                    break;
                case 'medium':
                    self.gameSpeed = Difficulty.MEDIUM.speed;
                    break;
                case 'hard':
                    self.gameSpeed = Difficulty.HARD.speed;
                    break;
            }
        });
    }
    
    // 窗口大小改变
    window.addEventListener('resize', function() {
        self.resizeCanvas();
        self.render();
    });
    
    // 信息按钮
    if (this.infoButton) {
        this.infoButton.addEventListener('click', function() {
            self.infoModal.style.display = 'flex';
        });
    }
    
    // 关闭信息模态框
    if (this.closeInfoButton) {
        this.closeInfoButton.addEventListener('click', function() {
            self.infoModal.style.display = 'none';
        });
    }
    
    // 触摸控制
    this.canvas.addEventListener('touchstart', function(e) {
        self.handleTouchStart(e);
    });
    
    this.canvas.addEventListener('touchmove', function(e) {
        self.handleTouchMove(e);
    });
};

// 处理键盘输入
SnakeGame.prototype.handleKeyDown = function(e) {
    // 如果游戏结束或空闲状态，按任意键开始游戏
    if (this.gameState === GameState.GAME_OVER || this.gameState === GameState.IDLE) {
        if (e.key === ' ' || e.key === 'Enter') {
            this.start();
            return;
        }
    }
    
    // 如果游戏暂停，按空格键继续
    if (this.gameState === GameState.PAUSED) {
        if (e.key === ' ' || e.key === 'Enter') {
            this.pause();
            return;
        }
    }
    
    // 方向控制
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (this.direction !== Direction.DOWN) {
                this.nextDirection = Direction.UP;
            }
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (this.direction !== Direction.UP) {
                this.nextDirection = Direction.DOWN;
            }
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (this.direction !== Direction.RIGHT) {
                this.nextDirection = Direction.LEFT;
            }
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (this.direction !== Direction.LEFT) {
                this.nextDirection = Direction.RIGHT;
            }
            break;
        case ' ':
            this.pause();
            break;
    }
};

// 处理触摸开始
SnakeGame.prototype.handleTouchStart = function(e) {
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
};

// 处理触摸移动
SnakeGame.prototype.handleTouchMove = function(e) {
    if (!this.touchStartX || !this.touchStartY) return;
    
    e.preventDefault();
    
    var touchEndX = e.touches[0].clientX;
    var touchEndY = e.touches[0].clientY;
    
    var dx = touchEndX - this.touchStartX;
    var dy = touchEndY - this.touchStartY;
    
    // 确定滑动方向
    if (Math.abs(dx) > Math.abs(dy)) {
        // 水平滑动
        if (dx > 0 && this.direction !== Direction.LEFT) {
            this.nextDirection = Direction.RIGHT;
        } else if (dx < 0 && this.direction !== Direction.RIGHT) {
            this.nextDirection = Direction.LEFT;
        }
    } else {
        // 垂直滑动
        if (dy > 0 && this.direction !== Direction.UP) {
            this.nextDirection = Direction.DOWN;
        } else if (dy < 0 && this.direction !== Direction.DOWN) {
            this.nextDirection = Direction.UP;
        }
    }
    
    // 重置触摸起点
    this.touchStartX = 0;
    this.touchStartY = 0;
};

// 当DOM加载完成后初始化游戏
window.onload = function() {
    var game = new SnakeGame();
    
    // 启动游戏循环
    window.requestAnimationFrame(function(time) {
        game.gameLoop(time);
    });
};
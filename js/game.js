// 游戏常量
const CELL_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 3;
const FOOD_COLOR = '#e74c3c';
const SNAKE_HEAD_COLOR = '#2ecc71';
const SNAKE_BODY_COLOR = '#27ae60';

// 游戏状态
const GameState = {
    IDLE: 'idle',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// 方向
const Direction = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
};

// 难度设置
const Difficulty = {
    EASY: { speed: 8, name: 'easy' },
    MEDIUM: { speed: 12, name: 'medium' },
    HARD: { speed: 16, name: 'hard' }
};

// 游戏类
class SnakeGame {
    constructor() {
        // 获取DOM元素
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentScoreElement = document.getElementById('current-score');
        this.highScoreElement = document.getElementById('high-score');
        this.finalScoreElement = document.getElementById('final-score');
        this.difficultySelect = document.getElementById('difficulty');
        this.startButton = document.getElementById('start-button');
        this.restartButton = document.getElementById('restart-button');
        this.pauseButton = document.getElementById('pause-button');
        this.gameMessage = document.getElementById('game-message');
        this.gameOver = document.getElementById('game-over');
        this.eatSound = document.getElementById('eat-sound');
        this.gameOverSound = document.getElementById('game-over-sound');
        
        // 移动端控制按钮
        this.upButton = document.getElementById('up-button');
        this.downButton = document.getElementById('down-button');
        this.leftButton = document.getElementById('left-button');
        this.rightButton = document.getElementById('right-button');
        this.mobileControls = document.querySelector('.mobile-controls');
        
        // 初始化游戏状态
        this.state = GameState.IDLE;
        this.score = 0;
        this.highScore = this.getHighScore();
        this.difficulty = Difficulty.MEDIUM;
        this.animationFrameId = null;
        this.lastRenderTime = 0;
        
        // 初始化游戏设置
        this.initGame();
        this.setupEventListeners();
        this.resizeCanvas();
        this.updateHighScoreDisplay();
        
        // 检测是否为移动设备
        this.checkMobileDevice();
    }
    
    // 初始化游戏
    initGame() {
        // 设置画布尺寸
        this.resizeCanvas();
        
        // 计算网格大小
        this.gridWidth = Math.floor(this.canvas.width / CELL_SIZE);
        this.gridHeight = Math.floor(this.canvas.height / CELL_SIZE);
        
        // 初始化蛇
        this.initSnake();
        
        // 生成食物
        this.generateFood();
        
        // 重置分数
        this.score = 0;
        this.updateScoreDisplay();
    }
    
    // 初始化蛇
    initSnake() {
        // 蛇的初始位置在画布中央
        const centerX = Math.floor(this.gridWidth / 2);
        const centerY = Math.floor(this.gridHeight / 2);
        
        this.snake = [];
        
        // 创建初始长度的蛇
        for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
            this.snake.push({ x: centerX - i, y: centerY });
        }
        
        // 初始方向向右
        this.direction = Direction.RIGHT;
        this.nextDirection = Direction.RIGHT;
    }
    
    // 生成食物
    generateFood() {
        let foodPosition;
        let isOnSnake;
        
        // 确保食物不会生成在蛇身上
        do {
            isOnSnake = false;
            foodPosition = {
                x: Math.floor(Math.random() * this.gridWidth),
                y: Math.floor(Math.random() * this.gridHeight)
            };
            
            // 检查是否与蛇身重叠
            for (const segment of this.snake) {
                if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                    isOnSnake = true;
                    break;
                }
            }
        } while (isOnSnake);
        
        this.food = foodPosition;
    }
    
    // 更新游戏状态
    update() {
        if (this.state !== GameState.PLAYING) return;
        
        // 更新蛇的方向
        this.direction = this.nextDirection;
        
        // 获取蛇头位置
        const head = { ...this.snake[0] };
        
        // 根据方向移动蛇头
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
        
        // 检查碰撞
        if (this.checkCollision(head)) {
            this.gameOverSound.play().catch(e => console.log('无法播放音效:', e));
            this.endGame();
            return;
        }
        
        // 将新头部添加到蛇身
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            // 播放吃食物音效
            this.eatSound.play().catch(e => console.log('无法播放音效:', e));
            
            // 增加分数
            this.score += 10;
            this.updateScoreDisplay();
            
            // 生成新食物
            this.generateFood();
            
            // 添加动画效果
            this.canvas.classList.add('pulse');
            setTimeout(() => this.canvas.classList.remove('pulse'), 500);
        } else {
            // 如果没有吃到食物，移除尾部
            this.snake.pop();
        }
    }
    
    // 检查碰撞
    checkCollision(head) {
        // 检查是否撞墙
        if (
            head.x < 0 ||
            head.y < 0 ||
            head.x >= this.gridWidth ||
            head.y >= this.gridHeight
        ) {
            return true;
        }
        
        // 检查是否撞到自己（从第二个身体部分开始检查）
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 渲染游戏
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制背景网格
        this.drawGrid();
        
        // 绘制食物
        this.drawFood();
        
        // 绘制蛇
        this.drawSnake();
    }
    
    // 绘制背景网格
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 0.5;
        
        // 绘制垂直线
        for (let x = 0; x <= this.gridWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * CELL_SIZE, 0);
            this.ctx.lineTo(x * CELL_SIZE, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.gridHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * CELL_SIZE);
            this.ctx.lineTo(this.canvas.width, y * CELL_SIZE);
            this.ctx.stroke();
        }
    }
    
    // 绘制食物
    drawFood() {
        this.ctx.fillStyle = FOOD_COLOR;
        this.ctx.beginPath();
        const centerX = this.food.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = this.food.y * CELL_SIZE + CELL_SIZE / 2;
        const radius = CELL_SIZE / 2 * 0.8;
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // 绘制蛇
    drawSnake() {
        // 绘制蛇身
        for (let i = 1; i < this.snake.length; i++) {
            const segment = this.snake[i];
            this.ctx.fillStyle = SNAKE_BODY_COLOR;
            this.ctx.fillRect(
                segment.x * CELL_SIZE,
                segment.y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE
            );
        }
        
        // 绘制蛇头
        const head = this.snake[0];
        this.ctx.fillStyle = SNAKE_HEAD_COLOR;
        this.ctx.fillRect(
            head.x * CELL_SIZE,
            head.y * CELL_SIZE,
            CELL_SIZE,
            CELL_SIZE
        );
        
        // 绘制蛇眼睛
        this.ctx.fillStyle = '#000';
        
        // 根据方向绘制眼睛
        const eyeSize = CELL_SIZE / 5;
        const eyeOffset = CELL_SIZE / 4;
        
        let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
        
        switch (this.direction) {
            case Direction.UP:
                leftEyeX = head.x * CELL_SIZE + eyeOffset;
                leftEyeY = head.y * CELL_SIZE + eyeOffset;
                rightEyeX = head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                rightEyeY = head.y * CELL_SIZE + eyeOffset;
                break;
            case Direction.DOWN:
                leftEyeX = head.x * CELL_SIZE + eyeOffset;
                leftEyeY = head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                rightEyeX = head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                rightEyeY = head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                break;
            case Direction.LEFT:
                leftEyeX = head.x * CELL_SIZE + eyeOffset;
                leftEyeY = head.y * CELL_SIZE + eyeOffset;
                rightEyeX = head.x * CELL_SIZE + eyeOffset;
                rightEyeY = head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                break;
            case Direction.RIGHT:
                leftEyeX = head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                leftEyeY = head.y * CELL_SIZE + eyeOffset;
                rightEyeX = head.x * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                rightEyeY = head.y * CELL_SIZE + CELL_SIZE - eyeOffset - eyeSize;
                break;
        }
        
        this.ctx.fillRect(leftEyeX, leftEyeY, eyeSize, eyeSize);
        this.ctx.fillRect(rightEyeX, rightEyeY, eyeSize, eyeSize);
    }
    
    // 游戏循环
    gameLoop(currentTime) {
        if (this.state !== GameState.PLAYING) return;
        
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
        
        // 计算时间差
        const secondsSinceLastRender = (currentTime - this.lastRenderTime) / 1000;
        
        // 根据难度控制更新频率
        if (secondsSinceLastRender < 1 / this.difficulty.speed) return;
        
        this.lastRenderTime = currentTime;
        
        // 更新游戏状态
        this.update();
        
        // 渲染游戏
        this.render();
    }
    
    // 开始游戏
    startGame() {
        if (this.state === GameState.PLAYING) return;
        
        // 初始化游戏
        this.initGame();
        
        // 更新游戏状态
        this.state = GameState.PLAYING;
        
        // 隐藏开始消息
        this.gameMessage.classList.add('hidden');
        this.gameOver.classList.add('hidden');
        
        // 启用暂停按钮
        this.pauseButton.disabled = false;
        this.pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        
        // 开始游戏循环
        this.lastRenderTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // 暂停游戏
    pauseGame() {
        if (this.state !== GameState.PLAYING) return;
        
        // 更新游戏状态
        this.state = GameState.PAUSED;
        
        // 取消动画帧
        cancelAnimationFrame(this.animationFrameId);
        
        // 更新暂停按钮
        this.pauseButton.innerHTML = '<i class="fas fa-play"></i> 继续';
    }
    
    // 继续游戏
    resumeGame() {
        if (this.state !== GameState.PAUSED) return;
        
        // 更新游戏状态
        this.state = GameState.PLAYING;
        
        // 更新暂停按钮
        this.pauseButton.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        
        // 重新开始游戏循环
        this.lastRenderTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // 结束游戏
    endGame() {
        // 更新游戏状态
        this.state = GameState.GAME_OVER;
        
        // 取消动画帧
        cancelAnimationFrame(this.animationFrameId);
        
        // 禁用暂停按钮
        this.pauseButton.disabled = true;
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.saveHighScore(this.highScore);
            this.updateHighScoreDisplay();
        }
        
        // 显示游戏结束消息
        this.finalScoreElement.textContent = this.score;
        this.gameOver.classList.remove('hidden');
        this.gameOver.classList.add('fade-in');
        
        // 添加震动效果
        this.canvas.classList.add('shake');
        setTimeout(() => this.canvas.classList.remove('shake'), 500);
    }
    
    // 更新分数显示
    updateScoreDisplay() {
        this.currentScoreElement.textContent = this.score;
    }
    
    // 更新最高分显示
    updateHighScoreDisplay() {
        this.highScoreElement.textContent = this.highScore;
    }
    
    // 保存最高分到本地存储
    saveHighScore(score) {
        localStorage.setItem('snakeHighScore', score);
    }
    
    // 从本地存储获取最高分
    getHighScore() {
        const highScore = localStorage.getItem('snakeHighScore');
        return highScore ? parseInt(highScore) : 0;
    }
    
    // 调整画布大小
    resizeCanvas() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 确保画布是正方形
        const size = Math.min(containerWidth, containerHeight);
        
        // 设置画布尺寸
        this.canvas.width = Math.floor(size / CELL_SIZE) * CELL_SIZE;
        this.canvas.height = Math.floor(size / CELL_SIZE) * CELL_SIZE;
    }
    
    // 检测是否为移动设备
    checkMobileDevice() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            this.mobileControls.classList.remove('hidden');
        }
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 键盘控制
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        
        // 触摸屏控制
        this.setupTouchControls();
        
        // 按钮控制
        this.startButton.addEventListener('click', () => this.startGame());
        this.restartButton.addEventListener('click', () => this.startGame());
        this.pauseButton.addEventListener('click', () => {
            if (this.state === GameState.PLAYING) {
                this.pauseGame();
            } else if (this.state === GameState.PAUSED) {
                this.resumeGame();
            }
        });
        
        // 移动端方向按钮
        this.upButton.addEventListener('click', () => this.changeDirection(Direction.UP));
        this.downButton.addEventListener('click', () => this.changeDirection(Direction.DOWN));
        this.leftButton.addEventListener('click', () => this.changeDirection(Direction.LEFT));
        this.rightButton.addEventListener('click', () => this.changeDirection(Direction.RIGHT));
        
        // 难度选择
        this.difficultySelect.addEventListener('change', () => {
            const selectedDifficulty = this.difficultySelect.value;
            
            switch (selectedDifficulty) {
                case 'easy':
                    this.difficulty = Difficulty.EASY;
                    break;
                case 'medium':
                    this.difficulty = Difficulty.MEDIUM;
                    break;
                case 'hard':
                    this.difficulty = Difficulty.HARD;
                    break;
            }
        });
        
        // 窗口大小改变时调整画布
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            
            // 如果游戏正在进行，重新渲染
            if (this.state === GameState.PLAYING || this.state === GameState.PAUSED) {
                this.render();
            }
        });
        
        // 空格键开始/暂停游戏
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                
                if (this.state === GameState.IDLE || this.state === GameState.GAME_OVER) {
                    this.startGame();
                } else if (this.state === GameState.PLAYING) {
                    this.pauseGame();
                } else if (this.state === GameState.PAUSED) {
                    this.resumeGame();
                }
            }
        });
    }
    
    // 设置触摸屏控制
    setupTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.state !== GameState.PLAYING) return;
            
            e.preventDefault();
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            // 确定滑动方向
            if (Math.abs(dx) > Math.abs(dy)) {
                // 水平滑动
                if (dx > 0) {
                    this.changeDirection(Direction.RIGHT);
                } else {
                    this.changeDirection(Direction.LEFT);
                }
            } else {
                // 垂直滑动
                if (dy > 0) {
                    this.changeDirection(Direction.DOWN);
                } else {
                    this.changeDirection(Direction.UP);
                }
            }
            
            // 更新起始位置
            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });
    }
    
    // 处理键盘按键
    handleKeyDown(e) {
        if (this.state !== GameState.PLAYING) return;
        
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.changeDirection(Direction.UP);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeDirection(Direction.DOWN);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.changeDirection(Direction.LEFT);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.changeDirection(Direction.RIGHT);
                break;
        }
    }
    
    // 改变方向
    changeDirection(newDirection) {
        // 防止180度转弯
        if (
            (this.direction === Direction.UP && newDirection === Direction.DOWN) ||
            (this.direction === Direction.DOWN && newDirection === Direction.UP) ||
            (this.direction === Direction.LEFT && newDirection === Direction.RIGHT) ||
            (this.direction === Direction.RIGHT && newDirection === Direction.LEFT)
        ) {
            return;
        }
        
        this.nextDirection = newDirection;
    }
}

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    
    // 初始渲染
    game.render();
});
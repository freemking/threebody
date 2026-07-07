// 三体风格粒子动画和交互效果
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: null, y: null };
        this.resizeCanvas();
        this.initParticles();
        this.bindEvents();
        this.animate();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    initParticles() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 10000);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 0.5,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                color: Math.random() > 0.5 ? '#00ffff' : '#ff00ff',
                opacity: Math.random() * 0.5 + 0.1,
                pulse: Math.random() * Math.PI * 2
            });
        }
    }

    bindEvents() {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.particles = [];
            this.initParticles();
        });

        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        window.addEventListener('mouseout', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });
    }

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            // 更新粒子脉冲
            particle.pulse += 0.02;
            const pulseFactor = Math.sin(particle.pulse) * 0.3 + 0.7;
            
            // 绘制粒子
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * pulseFactor, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity * pulseFactor;
            this.ctx.fill();
            
            // 绘制光晕
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 4 * pulseFactor
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 4 * pulseFactor, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.globalAlpha = particle.opacity * 0.3 * pulseFactor;
            this.ctx.fill();
            
            this.ctx.globalAlpha = 1;
        });
    }

    updateParticles() {
        this.particles.forEach(particle => {
            // 移动粒子
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // 边界检查
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY *= -1;
            }
            
            // 鼠标交互
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 100) {
                    const force = (100 - distance) / 100;
                    particle.x -= dx * force * 0.01;
                    particle.y -= dy * force * 0.01;
                }
            }
            
            // 保持粒子在画布内
            if (particle.x < 0) particle.x = 0;
            if (particle.x > this.canvas.width) particle.x = this.canvas.width;
            if (particle.y < 0) particle.y = 0;
            if (particle.y > this.canvas.height) particle.y = this.canvas.height;
        });
    }

    animate() {
        this.updateParticles();
        this.drawParticles();
        requestAnimationFrame(() => this.animate());
    }
}

// 卡片悬停效果
function initCardEffects() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
        
        // 添加点击波纹效果
        card.addEventListener('click', function(e) {
            const ripple = document.createElement('div');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// 创建智子
function createSophons() {
    const container = document.getElementById('sophon-container');
    if (!container) return;
    
    for (let i = 0; i < 15; i++) {
        const sophon = document.createElement('div');
        sophon.className = 'sophon';
        sophon.style.left = Math.random() * 100 + '%';
        sophon.style.top = Math.random() * 100 + '%';
        sophon.style.animationDelay = Math.random() * 2 + 's';
        container.appendChild(sophon);
    }
}

// 创建二向箔
function createFoils() {
    const container = document.getElementById('foil-container');
    if (!container) return;
    
    for (let i = 0; i < 8; i++) {
        const foil = document.createElement('div');
        foil.className = 'foil';
        foil.style.left = Math.random() * 100 + '%';
        foil.style.top = Math.random() * 100 + '%';
        foil.style.animationDelay = Math.random() * 8 + 's';
        foil.style.animationDuration = (6 + Math.random() * 4) + 's';
        container.appendChild(foil);
    }
}

// 创建星际舰队
function createFleet() {
    const container = document.getElementById('fleet-container');
    if (!container) return;
    
    // 创建主舰队编队
    for (let i = 0; i < 8; i++) {
        const ship = document.createElement('div');
        ship.className = 'fleet-ship';
        
        // 创建V字形编队
        const angle = (i % 2 === 0) ? 1 : -1;
        const row = Math.floor(i / 2);
        const yOffset = angle * (row * 15 + 10);
        
        ship.style.left = '-100px';
        ship.style.top = `calc(50% + ${yOffset}px)`;
        ship.style.animationDelay = `${i * 0.5}s`;
        ship.style.animationDuration = `${12 + Math.random() * 3}s`;
        ship.style.transform = `rotate(${angle * 5}deg)`;
        
        container.appendChild(ship);
    }
    
    // 创建侦察舰队
    for (let i = 0; i < 3; i++) {
        const scout = document.createElement('div');
        scout.className = 'fleet-ship';
        scout.style.left = '-100px';
        scout.style.top = `${20 + i * 30}%`;
        scout.style.animationDelay = `${8 + i * 2}s`;
        scout.style.animationDuration = `${8 + Math.random() * 2}s`;
        scout.style.transform = 'scale(0.7)';
        scout.style.opacity = '0.7';
        
        container.appendChild(scout);
    }
    
    // 创建通信信号效果
    for (let i = 0; i < 5; i++) {
        const signal = document.createElement('div');
        signal.className = 'fleet-signal';
        signal.style.left = `${Math.random() * 100}%`;
        signal.style.top = `${30 + Math.random() * 40}%`;
        signal.style.animationDelay = `${Math.random() * 3}s`;
        signal.style.animationDuration = `${1.5 + Math.random() * 2}s`;
        
        container.appendChild(signal);
    }
}

// 创建射电天文望远镜
function createRadioTelescope() {
    const container = document.getElementById('radio-telescope-container');
    if (!container) return;
    
    // 创建基座
    const base = document.createElement('div');
    base.className = 'telescope-base';
    container.appendChild(base);
    
    // 创建支撑臂
    const arm = document.createElement('div');
    arm.className = 'telescope-arm';
    container.appendChild(arm);
    
    // 创建抛物面天线（带3D效果）
    const dish = document.createElement('div');
    dish.className = 'telescope-dish';
    
    // 创建同心圆环，增强3D效果
    for (let i = 0; i < 3; i++) {
        const ring = document.createElement('div');
        ring.className = 'telescope-dish-ring';
        dish.appendChild(ring);
    }
    container.appendChild(dish);
    
    // 创建馈源（信号接收器）
    const feed = document.createElement('div');
    feed.className = 'telescope-feed';
    container.appendChild(feed);
    
    // 创建电磁波发射效果（从馈源向外扩散的波前）
    for (let i = 0; i < 6; i++) {
        const wave = document.createElement('div');
        wave.className = 'telescope-em-wave';
        wave.style.animationDelay = `${i * 0.5}s`;
        container.appendChild(wave);
    }
}

// 创建三日凌空
function createThreeSuns() {
    const container = document.getElementById('three-suns-container');
    if (!container) return;
    
    // 创建三个轨道容器
    for (let i = 1; i <= 3; i++) {
        const orbit = document.createElement('div');
        orbit.className = `orbit orbit-${i}`;
        
        // 创建太阳
        const sun = document.createElement('div');
        sun.className = `sun sun-${i}`;
        orbit.appendChild(sun);
        
        container.appendChild(orbit);
    }
    
    // 创建三体星
    const planet = document.createElement('div');
    planet.className = 'three-body-planet';
    container.appendChild(planet);
    
    // 创建热浪效果
    const heatWave = document.createElement('div');
    heatWave.className = 'heat-wave';
    container.appendChild(heatWave);
}

// 页面加载动画
function initLoadingAnimation() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 1s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
}

// 添加波纹样式
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .ripple {
            position: absolute;
            border-radius: 50%;
            background: rgba(0, 255, 255, 0.3);
            transform: scale(0);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        }
        
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initLoadingAnimation();
    addRippleStyles();
    
    // 初始化粒子系统
    new ParticleSystem();
    
    // 初始化卡片效果
    initCardEffects();
    
    // 创建三体元素
    createSophons();
    createFoils();
    createFleet();
    createRadioTelescope();
    createThreeSuns();
    
    console.log('三体学习空间已加载完成！');
});
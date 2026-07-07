/**
 * Audio management module
 * Handles game audio playback, including word pronunciation and sound effects
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.voiceSpeed = 1.0;
        this.currentAudio = null;
        this.isSpeaking = false;
        
        // Initialize audio context
        this.initAudioContext();
    }
    
    /**
     * 初始化音频上下文
     */
    initAudioContext() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized successfully');
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }
    
    /**
     * 加载音频文件
     * @param {string} name 音频名称
     * @param {string} url 音频文件URL
     * @returns {Promise} 加载完成的Promise
     */
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds[name] = audioBuffer;
            console.log(`Audio ${name} loaded successfully`);
            return true;
        } catch (error) {
            console.warn(`Audio ${name} loading failed:`, error);
            return false;
        }
    }
    
    /**
     * 播放音效
     * @param {string} name 音效名称
     * @param {number} volume 音量（0-1）
     */
    playSound(name, volume = 1.0) {
        if (!this.soundEnabled) return;
        if (!this.sounds[name]) {
            console.warn(`Sound ${name} not loaded, using synthetic sound`);
            this.generateTone(name, volume);
            return;
        }
        
        try {
            const source = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            
            source.buffer = this.sounds[name];
            gainNode.gain.value = volume;
            
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.start(0);
        } catch (error) {
            console.warn(`Failed to play sound ${name}:`, error);
        }
    }
    
    /**
     * 生成合成音效
     * @param {string} name 音效名称
     * @param {number} volume 音量（0-1）
     */
    generateTone(name, volume = 1.0) {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set different tones based on sound name
            switch (name) {
                case 'success':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
                    gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;
                    
                case 'error':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.2);
                    break;
                    
                case 'click':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.05);
                    break;
                    
                case 'complete':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
                    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
                    oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
                    oscillator.frequency.setValueAtTime(1046.50, this.audioContext.currentTime + 0.3); // C6
                    gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                    
                case 'levelup':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4
                    oscillator.frequency.setValueAtTime(554.37, this.audioContext.currentTime + 0.1); // C#5
                    oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.2); // E5
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.3); // A5
                    gainNode.gain.setValueAtTime(volume * 0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.4);
                    break;
                    
                default:
                    // Default sound
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(volume * 0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.1);
                    break;
            }
        } catch (error) {
            console.warn(`Failed to generate synthetic sound ${name}:`, error);
        }
    }
    
    /**
     * 使用语音合成播放单词发音
     * @param {string} text 要朗读的文本
     * @param {string} lang 语言代码
     * @returns {Promise} 播放完成的Promise
     */
    speak(text, lang = 'en-US') {
        return new Promise((resolve, reject) => {
            if (!this.soundEnabled) {
                resolve();
                return;
            }
            
            // Check if browser supports speech synthesis
            if (!('speechSynthesis' in window)) {
                console.warn('Browser does not support speech synthesis');
                resolve();
                return;
            }
            
            // 停止当前正在播放的语音
            this.stopSpeaking();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = this.voiceSpeed;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                console.log(`Started speaking: ${text}`);
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                console.log(`Finished speaking: ${text}`);
                resolve();
            };
            
            utterance.onerror = (event) => {
                this.isSpeaking = false;
                console.warn('Speech synthesis error:', event.error);
                reject(event.error);
            };
            
            // 保存当前语音引用
            this.currentAudio = utterance;
            
            // 开始朗读
            window.speechSynthesis.speak(utterance);
        });
    }
    
    /**
     * 停止当前语音
     */
    stopSpeaking() {
        if (this.isSpeaking) {
            window.speechSynthesis.cancel();
            this.isSpeaking = false;
            this.currentAudio = null;
        }
    }
    
    /**
     * 播放单词发音
     * @param {Object} word 单词对象
     * @returns {Promise} 播放完成的Promise
     */
    async playWord(word) {
        try {
            // 尝试播放单词的MP3音频文件
            if (word.audio) {
                const audioUrl = `assets/sounds/${word.audio}`;
                const loaded = await this.loadSound(`word_${word.id}`, audioUrl);
                if (loaded) {
                    this.playSound(`word_${word.id}`, 1.0);
                    // 等待音频播放完成
                    await this.delay(1000);
                    // Play Chinese meaning
                    await this.speak(word.meaning, 'zh-CN');
                    return true;
                }
            }
            
            // 如果MP3文件不存在，使用语音合成
            await this.speak(word.word, 'en-US');
            
            // Short pause then play Chinese meaning
            await this.delay(500);
            await this.speak(word.meaning, 'zh-CN');
            
            return true;
        } catch (error) {
            console.warn('Failed to play word pronunciation:', error);
            return false;
        }
    }
    
    /**
     * 播放例句
     * @param {string} sentence 例句
     * @returns {Promise} 播放完成的Promise
     */
    async playSentence(sentence) {
        try {
            await this.speak(sentence, 'en-US');
            return true;
        } catch (error) {
            console.warn('Failed to play example sentence:', error);
            return false;
        }
    }
    
    /**
     * 播放成功音效
     */
    playSuccess() {
        this.playSound('success', 0.5);
    }
    
    /**
     * 播放失败音效
     */
    playError() {
        this.playSound('error', 0.5);
    }
    
    /**
     * 播放点击音效
     */
    playClick() {
        this.playSound('click', 0.3);
    }
    
    /**
     * 播放选中音效
     */
    playSelect() {
        this.playSound('click', 0.5);
        setTimeout(() => this.playSound('success', 0.2), 50);
    }
    
    /**
     * 播放完成音效
     */
    playComplete() {
        this.playSound('complete', 0.7);
        setTimeout(() => this.speak('Good job!', 'en-US'), 300);
    }
    
    /**
     * 延迟函数
     * @param {number} ms 毫秒数
     * @returns {Promise} 延迟完成的Promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 设置音效开关
     * @param {boolean} enabled 是否启用
     */
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        console.log(`Sound ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * 设置音乐开关
     * @param {boolean} enabled 是否启用
     */
    setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        console.log(`Music ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * 设置语音速度
     * @param {number} speed 速度（0.5-2）
     */
    setVoiceSpeed(speed) {
        this.voiceSpeed = Math.max(0.5, Math.min(2, speed));
        console.log(`Voice speed set to: ${this.voiceSpeed}`);
    }
    
    /**
     * 获取当前语音速度
     * @returns {number} 当前语音速度
     */
    getVoiceSpeed() {
        return this.voiceSpeed;
    }
    
    /**
     * 检查是否正在播放语音
     * @returns {boolean} 是否正在播放
     */
    isCurrentlySpeaking() {
        return this.isSpeaking;
    }
    
    /**
     * 预加载常用音效 - 使用合成音效，无需外部文件
     */
    async preloadSounds() {
        // 直接使用合成音效，无需加载外部MP3文件
        console.log('Sound preload skipped, using synthetic tones');
    }
    
    /**
     * 播放庆祝音效（用于成就解锁等）
     */
    playCelebration() {
        // Play a series of sounds to simulate celebration
        this.playSound('complete', 0.8);
        setTimeout(() => this.playSound('success', 0.6), 300);
        setTimeout(() => this.playSound('success', 0.4), 600);
    }
    
    /**
     * 播放计时器音效
     * @param {number} seconds 剩余秒数
     */
    playTimerTick(seconds) {
        if (seconds <= 3 && seconds > 0) {
            this.playSound('click', 0.3);
        }
    }
    
    /**
     * 播放单词匹配成功音效
     */
    playMatchSuccess() {
        this.playSound('success', 0.6);
    }
    
    /**
     * 播放单词匹配失败音效
     */
    playMatchError() {
        this.playSound('error', 0.4);
        setTimeout(() => this.speak('Try again!', 'en-US'), 200);
    }
    
    /**
     * 播放连击音效
     * @param {number} combo 连击数
     */
    playComboSound(combo) {
        if (combo >= 5) {
            this.playSound('complete', 0.8);
            setTimeout(() => this.playSound('success', 0.6), 150);
            setTimeout(() => this.playSound('success', 0.4), 300);
        } else if (combo >= 3) {
            this.playSound('success', 0.7);
            setTimeout(() => this.playSound('success', 0.5), 200);
        }
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        this.stopSpeaking();
        this.sounds = {};
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        console.log('Audio resources cleaned up');
    }
}

// Create global instance
const audioManager = new AudioManager();

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager, audioManager };
}
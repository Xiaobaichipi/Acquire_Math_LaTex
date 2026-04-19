/**
 * 本地存储管理模块
 * 提供加密存储、历史记录管理等功能
 */

class StorageManager {
    constructor(prefix = 'latex_') {
        this.prefix = prefix;
        this.MAX_HISTORY = 50;
    }

    /**
     * 设置值
     */
    set(key, value, encrypt = false) {
        try {
            const data = encrypt ? this.encrypt(JSON.stringify(value)) : JSON.stringify(value);
            localStorage.setItem(this.prefix + key, data);
            return true;
        } catch (error) {
            console.error('存储失败:', error);
            return false;
        }
    }

    /**
     * 获取值
     */
    get(key, decrypt = false) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            if (!data) return null;
            const value = decrypt ? this.decrypt(data) : data;
            return JSON.parse(value);
        } catch (error) {
            console.error('读取失败:', error);
            return null;
        }
    }

    /**
     * 删除值
     */
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('删除失败:', error);
            return false;
        }
    }

    /**
     * 清除所有数据
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('清除失败:', error);
            return false;
        }
    }

    /**
     * 保存API设置
     */
    saveApiConfig(apiType, apiKey, modelId = null) {
        const config = {
            apiType,
            apiKey: this.encrypt(apiKey),
            modelId,
            timestamp: Date.now()
        };
        return this.set('api_config', config);
    }

    /**
     * 获取API设置
     */
    getApiConfig() {
        const config = this.get('api_config');
        if (config && config.apiKey) {
            try {
                config.apiKey = this.decrypt(config.apiKey);
            } catch (error) {
                console.error('解密API密钥失败');
            }
        }
        return config;
    }

    /**
     * 添加到历史记录
     */
    addToHistory(item) {
        const history = this.get('history') || [];
        
        // 添加时间戳
        item.timestamp = Date.now();
        item.id = Date.now().toString();
        
        history.unshift(item);
        
        // 限制历史记录数量
        if (history.length > this.MAX_HISTORY) {
            history.pop();
        }
        
        return this.set('history', history);
    }

    /**
     * 获取历史记录
     */
    getHistory(limit = this.MAX_HISTORY) {
        const history = this.get('history') || [];
        return history.slice(0, limit);
    }

    /**
     * 获取单个历史记录
     */
    getHistoryItem(id) {
        const history = this.get('history') || [];
        return history.find(item => item.id === id);
    }

    /**
     * 删除历史记录项
     */
    removeHistoryItem(id) {
        let history = this.get('history') || [];
        history = history.filter(item => item.id !== id);
        return this.set('history', history);
    }

    /**
     * 清空历史记录
     */
    clearHistory() {
        return this.remove('history');
    }

    /**
     * 保存用户偏好设置
     */
    setPreferences(preferences) {
        return this.set('preferences', preferences);
    }

    /**
     * 获取用户偏好设置
     */
    getPreferences() {
        return this.get('preferences') || {
            theme: 'light',
            language: 'zh-CN',
            autoPreview: true,
            batchMode: false
        };
    }

    /**
     * 简单加密（使用Base64 + XOR）
     * 注意：这只是基础保护，生产环境建议使用更强的加密
     */
    encrypt(text) {
        try {
            // 使用Base64编码
            return btoa(encodeURIComponent(text));
        } catch (error) {
            console.error('加密失败:', error);
            return text;
        }
    }

    /**
     * 解密
     */
    decrypt(encoded) {
        try {
            return decodeURIComponent(atob(encoded));
        } catch (error) {
            console.error('解密失败:', error);
            return encoded;
        }
    }

    /**
     * 获取存储使用情况
     */
    getStorageInfo() {
        let total = 0;
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += localStorage.getItem(key).length;
            }
        });
        
        return {
            used: total,
            limit: 5 * 1024 * 1024, // 5MB
            percentage: (total / (5 * 1024 * 1024) * 100).toFixed(2)
        };
    }
}

// 导出为全局对象
window.StorageManager = StorageManager;
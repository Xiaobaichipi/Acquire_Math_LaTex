// 视觉识别转LaTeX应用主脚本
class VisionToLatexApp {
    constructor() {
        this.apiKey = localStorage.getItem('visionApiKey') || '';
        this.imageFile = null;
        this.isApiKeyVisible = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadApiKey();
    }
    
    initializeElements() {
        // API密钥相关元素
        this.apiKeyInput = document.getElementById('apiKey');
        this.toggleApiKeyBtn = document.getElementById('toggleApiKey');
        this.saveApiKeyBtn = document.getElementById('saveApiKey');
        this.apiTypeSelect = document.getElementById('apiType');
        this.modelSelect = document.getElementById('modelSelect');
        
        // 弹窗相关元素
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModalBtn = document.getElementById('closeModal');
        
        // 上传相关元素
        this.uploadArea = document.getElementById('uploadArea');
        this.imageUpload = document.getElementById('imageUpload');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.imagePreview = document.getElementById('imagePreview');
        
        // 结果相关元素
        this.latexResult = document.getElementById('latexResult');
        this.copyLatexBtn = document.getElementById('copyLatex');
        this.downloadLatexBtn = document.getElementById('downloadLatex');
    }
    
    bindEvents() {
        // 弹窗事件
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModalBtn.addEventListener('click', () => this.closeSettings());
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });
        
        // API密钥事件
        this.toggleApiKeyBtn.addEventListener('click', () => this.toggleApiKeyVisibility());
        this.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        
        // API类型选择事件
        this.apiTypeSelect.addEventListener('change', (e) => {
            const selectedApiType = e.target.value;
            const modelSelectContainer = document.getElementById('modelSelectContainer');
            
            if (selectedApiType === 'siliconflow') {
                // 显示模型选择器
                if (modelSelectContainer) {
                    modelSelectContainer.style.display = 'block';
                }
                
                // 如果已有API密钥，加载模型列表
                if (this.apiKey) {
                    this.loadSiliconFlowModels();
                }
            } else {
                // 隐藏模型选择器
                if (modelSelectContainer) {
                    modelSelectContainer.style.display = 'none';
                }
            }
        });
        
        // 上传事件
        this.uploadBtn.addEventListener('click', () => this.imageUpload.click());
        this.imageUpload.addEventListener('change', (e) => this.handleImageUpload(e));
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // 结果操作事件
        this.copyLatexBtn.addEventListener('click', () => this.copyLatex());
        this.downloadLatexBtn.addEventListener('click', () => this.downloadLatex());
    }
    
    loadApiKey() {
        if (this.apiKey) {
            this.apiKeyInput.value = this.apiKey;
        }
        
        const savedApiType = localStorage.getItem('apiType') || 'openai';
        this.apiTypeSelect.value = savedApiType;
        
        // 如果选择了硅基流动API，加载模型列表
        if (savedApiType === 'siliconflow' && this.apiKey) {
            setTimeout(() => {
                this.loadSiliconFlowModels();
            }, 500); // 延迟执行以确保界面元素已加载
        }
        
        this.showMessage(`API设置已加载 (${savedApiType})`, 'success');
    }
    
    openSettings() {
        this.settingsModal.classList.add('show');
    }
    
    closeSettings() {
        this.settingsModal.classList.remove('show');
    }
    
    toggleApiKeyVisibility() {
        this.isApiKeyVisible = !this.isApiKeyVisible;
        this.apiKeyInput.type = this.isApiKeyVisible ? 'text' : 'password';
        this.toggleApiKeyBtn.textContent = this.isApiKeyVisible ? '🔒' : '👁️';
    }
    
    saveApiKey() {
        this.apiKey = this.apiKeyInput.value.trim();
        const apiType = this.apiTypeSelect.value;
        
        if (this.apiKey) {
            localStorage.setItem('visionApiKey', this.apiKey);
            localStorage.setItem('apiType', apiType);
            
            // 如果选择了硅基流动API，保存选中的模型
            if (apiType === 'siliconflow') {
                const selectedModel = this.modelSelect.value;
                if (selectedModel) {
                    localStorage.setItem('selectedModel', selectedModel);
                }
                this.loadSiliconFlowModels();
            }
            
            this.showMessage(`API设置已保存 (${apiType})`, 'success');
            
            // 保存后关闭弹窗
            setTimeout(() => {
                this.closeSettings();
            }, 800);
        } else {
            this.showMessage('请输入有效的API密钥', 'error');
        }
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.style.borderColor = '#000';
        this.uploadArea.style.backgroundColor = '#eee';
    }
    
    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.uploadArea.style.borderColor = '#ddd';
        this.uploadArea.style.backgroundColor = '#f5f5f5';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processImageFile(files[0]);
        }
    }
    
    handleImageUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImageFile(file);
        }
    }
    
    processImageFile(file) {
        // 检查文件类型
        if (!file.type.match('image.*')) {
            this.showMessage('请选择有效的图片文件', 'error');
            return;
        }
        
        this.imageFile = file;
        
        // 显示图片预览
        this.showImagePreview(file);
        
        // 自动识别
        this.recognizeImage();
    }
    
    showImagePreview(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.innerHTML = `<img src="${e.target.result}" alt="预览图片">`;
        };
        reader.readAsDataURL(file);
    }
    
    async recognizeImage() {
        if (!this.imageFile) {
            this.showMessage('请先上传图片', 'error');
            return;
        }
        
        if (!this.apiKey) {
            this.showMessage('请先设置API密钥', 'error');
            return;
        }
        
        try {
            this.setLoadingState(true);
            this.showMessage('正在识别图片内容...', 'info');
            
            // 将图片转换为base64
            const base64Image = await this.fileToBase64(this.imageFile);
            
            // 调用视觉识别API
            const latexResult = await this.callVisionAPI(base64Image);
            
            if (latexResult) {
                this.latexResult.value = latexResult;
                this.showMessage('识别完成', 'success');
            } else {
                this.showMessage('识别失败，请重试', 'error');
            }
        } catch (error) {
            console.error('识别错误:', error);
            this.showMessage(`识别失败: ${error.message}`, 'error');
        } finally {
            this.setLoadingState(false);
        }
    }
    
    async callVisionAPI(base64Image) {
        // 支持多种视觉识别API
        // 可以根据用户选择的API类型调用不同的服务
        const apiType = this.apiTypeSelect.value;
        
        switch(apiType) {
            case 'openai':
                return await this.callOpenAIAPI(base64Image);
            case 'anthropic':
                return await this.callAnthropicAPI(base64Image);
            case 'siliconflow':
                return await this.callSiliconFlowAPI(base64Image);
            default:
                return await this.callOpenAIAPI(base64Image);
        }
    }
    
    async callOpenAIAPI(base64Image) {
        // OpenAI GPT-4 Vision API
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4-vision-preview",
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "请分析这张图片并将其内容转换为LaTeX格式。请只返回LaTeX代码，不需要其他解释。如果图片中包含数学公式，请使用适当的LaTeX数学环境。\n\n输出格式要求：\n- 数学公式使用适当的LaTeX环境（如equation, align, gather等）\n- 保持原始格式和结构\n- 使用正确的LaTeX语法"
                                },
                                {
                                    type: "image_url",
                                    image_url: {
                                        url: `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.1
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('OpenAI API调用错误:', error);
            throw error;
        }
    }
    
    async callAnthropicAPI(base64Image) {
        // Anthropic Claude API
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: "claude-3-sonnet-20240229",
                    max_tokens: 4000,
                    messages: [
                        {
                            role: "user",
                            content: [
                                {
                                    type: "text",
                                    text: "请分析这张图片并将其内容转换为LaTeX格式。请只返回LaTeX代码，不需要其他解释。如果图片中包含数学公式，请使用适当的LaTeX数学环境。\n\n输出格式要求：\n- 数学公式使用适当的LaTeX环境（如equation, align, gather等）\n- 保持原始格式和结构\n- 使用正确的LaTeX语法"
                                },
                                {
                                    type: "image",
                                    source: {
                                        type: "base64",
                                        media_type: "image/jpeg",
                                        data: base64Image
                                    }
                                }
                            ]
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Anthropic API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Anthropic API调用错误:', error);
            throw error;
        }
    }
    
    async callSiliconFlowAPI(base64Image) {
        // 硅基流动 Vision API
        try {
            // 获取用户选择的模型，优先使用当前选择，其次使用保存的模型，最后使用默认模型
            const selectedModel = this.modelSelect.value || localStorage.getItem('selectedModel') || 'Qwen/QwQ-32B';
            
            const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    "model": selectedModel,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "请分析这张图片并将其内容转换为LaTeX格式。请只返回LaTeX代码，不需要其他解释。如果图片中包含数学公式，请使用适当的LaTeX数学环境。\n\n输出格式要求：\n- 数学公式使用适当的LaTeX环境（如equation, align, gather等）\n- 保持原始格式和结构\n- 使用正确的LaTeX语法"
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": `data:image/jpeg;base64,${base64Image}`
                                    }
                                }
                            ]
                        }
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.7,
                    "top_p": 0.7,
                    "stream": false
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`硅基流动 API请求失败: ${response.status} - ${errorData.error?.message || response.statusText}`);
            }
            
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('硅基流动 API调用错误:', error);
            throw error;
        }
    }
    
    async loadSiliconFlowModels() {
        if (!this.apiKey) {
            this.showMessage('请先输入API密钥', 'error');
            return;
        }
        
        try {
            const response = await fetch('https://api.siliconflow.cn/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取模型列表失败: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 过滤出视觉模型
            const visionModels = data.data.filter(model => 
                model.id.includes('VL') || 
                model.id.includes('vision') || 
                model.id.includes('Vision') ||
                model.id.includes('Qwen') ||
                model.id.includes('glm') ||
                model.id.includes('GLM')
            );
            
            // 更新模型选择下拉菜单
            this.updateModelSelect(visionModels);
            
        } catch (error) {
            console.error('获取模型列表错误:', error);
            this.showMessage(`获取模型列表失败: ${error.message}`, 'error');
            
            // 如果API调用失败，使用默认模型列表
            const defaultModels = [
                { id: 'Qwen/Qwen2-VL-72B-Instruct', name: 'Qwen2-VL-72B-Instruct' },
                { id: 'Qwen/Qwen-VL-Chat', name: 'Qwen-VL-Chat' },
                { id: 'THUDM/glm-4v-9b', name: 'GLM-4V-9B' },
                { id: 'Qwen/QwQ-32B', name: 'QwQ-32B' },
                { id: 'Qwen/Qwen3-72B-Instruct', name: 'Qwen3-72B-Instruct' }
            ];
            this.updateModelSelect(defaultModels);
        }
    }
    
    updateModelSelect(models) {
        // 清空现有选项
        this.modelSelect.innerHTML = '';
        
        // 添加新选项
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name || model.id;
            this.modelSelect.appendChild(option);
        });
        
        // 恢复用户之前选择的模型
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel) {
            // 检查保存的模型是否在列表中
            const modelExists = Array.from(this.modelSelect.options).some(option => option.value === savedModel);
            if (modelExists) {
                this.modelSelect.value = savedModel;
            }
        }
        
        // 显示模型选择区域
        const modelSelectContainer = document.getElementById('modelSelectContainer');
        if (modelSelectContainer) {
            modelSelectContainer.style.display = 'block';
        }
    }
    
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // 移除data:image/jpeg;base64,前缀，只保留base64部分
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = error => reject(error);
        });
    }
    
    copyLatex() {
        if (!this.latexResult.value) {
            this.showMessage('没有可复制的内容', 'error');
            return;
        }
        
        navigator.clipboard.writeText(this.latexResult.value)
            .then(() => {
                this.showMessage('LaTeX代码已复制到剪贴板', 'success');
            })
            .catch(err => {
                console.error('复制失败:', err);
                this.showMessage('复制失败', 'error');
            });
    }
    
    downloadLatex() {
        if (!this.latexResult.value) {
            this.showMessage('没有可下载的内容', 'error');
            return;
        }
        
        const blob = new Blob([this.latexResult.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'latex-output.tex';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('LaTeX文件已下载', 'success');
    }
    
    setLoadingState(loading) {
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (loading) {
                btn.disabled = true;
                if (!btn.querySelector('.loading')) {
                    const loadingSpan = document.createElement('span');
                    loadingSpan.className = 'loading';
                    btn.appendChild(loadingSpan);
                }
            } else {
                btn.disabled = false;
                const loadingSpan = btn.querySelector('.loading');
                if (loadingSpan) {
                    loadingSpan.remove();
                }
            }
        });
    }
    
    showMessage(message, type) {
        // 移除现有的状态消息
        const existingMessage = document.querySelector('.status-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 创建新的状态消息
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message status-${type}`;
        messageDiv.textContent = message;
        
        // 添加到页面中合适的位置
        document.querySelector('main').insertBefore(messageDiv, document.querySelector('main').firstChild);
        
        // 3秒后自动移除消息
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new VisionToLatexApp();
});
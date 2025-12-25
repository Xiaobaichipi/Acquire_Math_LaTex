# Vision to LaTeX 应用

这是一个简约未来风格的图片识别转LaTeX工具，可以帮助你将图片中的内容识别并转换为LaTeX格式。

## 功能特性

- 简约黑白色调未来风格界面
- 支持图片上传和拖拽功能
- 可选择不同的视觉识别API（OpenAI GPT-4 Vision 或 Anthropic Claude 3）
- API密钥安全存储
- LaTeX代码预览、复制和下载功能

## 使用方法

1. 在"API 密钥设置"部分选择API类型并输入你的API密钥
2. 上传或拖拽图片到上传区域
3. 应用会自动识别图片内容并转换为LaTeX格式
4. 查看、复制或下载生成的LaTeX代码

## 支持的API

- OpenAI GPT-4 Vision API
- Anthropic Claude 3 API
- 硅基流动 Vision API

## 技术栈

- HTML5
- CSS3
- JavaScript (ES6+)
- Web APIs (FileReader, Fetch API, Clipboard API)

## 文件结构

- `index.html` - 主页面
- `styles.css` - 样式文件
- `script.js` - JavaScript逻辑

## 注意事项

- 需要有效的API密钥才能使用识别功能
- 图片文件大小可能受API提供商限制
- 请确保网络连接稳定以获得最佳体验

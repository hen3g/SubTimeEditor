# SubTime Editor

SubTime Editor 是一个简单而强大的字幕时间轴编辑工具，专门用于调整 SRT 格式字幕的时间轴。

🌐 在线演示：[https://sub-time-editor.vercel.app/](https://sub-time-editor.vercel.app/)

## ✨ 特性

- 🎥 支持视频预览：直接在编辑器中播放视频，实时查看字幕效果
- ⚡️ 精确时间调整：可以精确到毫秒级别的时间轴调整
- 🔄 片段循环播放：自动播放当前字幕对应的视频片段
- 📝 字幕文本编辑：支持直接编辑字幕文本内容
- 💾 导出功能：将调整后的字幕导出为 SRT 格式
- 🎯 碰撞检测：智能防止字幕时间重叠
- 🖱️ 快捷操作：支持点击列表快速切换字幕

## 🚀 快速开始

### 环境要求

- Node.js >= 16.13.2
- npm >= 8.1.2

### 安装

```bash
# 克隆项目
git clone [repository-url]

# 进入项目目录
cd subtime-editor

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 使用方法

1. 点击"上传视频"按钮选择视频文件
2. 点击"上传字幕"按钮选择 SRT 格式的字幕文件
3. 使用时间编辑器调整字幕时间：
   - 直接输入时间
   - 使用 +/-50ms 按钮微调
   - 点击视频画面播放/暂停
4. 编辑字幕文本（如需要）
5. 使用"上一条"/"下一条"按钮或点击列表切换字幕
6. 完成编辑后点击"导出字幕"保存修改

## 🛠️ 技术栈

- Vue 3
- Vite
- Element Plus
- Pinia
- Vue Router

## 📝 注意事项

- 支持的字幕格式：SRT
- 支持的视频格式：取决于浏览器支持的格式（通常包括 MP4、WebM 等）
- 建议使用 Chrome 或 Firefox 最新版本访问

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

import { defineStore } from 'pinia'
import Parser from 'srt-parser-2'

export const useSubtitleStore = defineStore('subtitle', {
  state: () => ({
    subtitles: [], // 解析后的字幕数组
    currentIndex: 0, // 当前播放的字幕索引
    videoUrl: null, // 视频URL
    currentTime: 0, // 当前视频时间
  }),
  
  actions: {
    // 解析SRT文件
    async parseSrtFile(file) {
      const parser = new Parser()
      const text = await file.text()
      // 使用解构和展开运算符确保响应式
      this.subtitles = [...parser.fromSrt(text)]
    },
    
    // 更新字幕时间
    updateSubtitleTime(index, startTime, endTime) {
      if (this.subtitles[index]) {
        // 创建新对象以确保响应式更新
        this.subtitles[index] = {
          ...this.subtitles[index],
          startTime,
          endTime
        }
      }
    },
    
    // 更新字幕文本
    updateSubtitleText(index, text) {
      if (this.subtitles[index]) {
        // 创建新对象以确保响应式更新
        this.subtitles[index] = {
          ...this.subtitles[index],
          text
        }
      }
    },
    
    // 设置当前字幕索引
    setCurrentIndex(index) {
      this.currentIndex = index
    },
    
    // 设置视频URL
    setVideoUrl(url) {
      this.videoUrl = url
    },
    
    // 更新当前时间
    updateCurrentTime(time) {
      this.currentTime = time
    },
    
    // 导出SRT内容
    exportSrt() {
      const parser = new Parser()
      return parser.toSrt(this.subtitles)
    },

    // 删除字幕
    deleteSubtitle(index) {
      if (index >= 0 && index < this.subtitles.length) {
        this.subtitles.splice(index, 1)
        // 重新编号字幕
        this.subtitles = this.subtitles.map((subtitle, idx) => ({
          ...subtitle,
          id: idx + 1
        }))
        // 调整当前索引
        if (this.currentIndex >= this.subtitles.length) {
          this.currentIndex = Math.max(0, this.subtitles.length - 1)
        }
      }
    }
  },
  
  getters: {
    currentSubtitle: (state) => state.subtitles[state.currentIndex] || null,
    totalSubtitles: (state) => state.subtitles.length,
  }
}) 
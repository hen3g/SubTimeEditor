<!-- 字幕编辑器主组件 -->
<template>
  <div class="subtitle-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-upload
        class="upload-btn"
        accept="video/*"
        :auto-upload="false"
        :show-file-list="false"
        @change="handleVideoUpload"
      >
        <el-button type="primary">上传视频</el-button>
      </el-upload>
      
      <el-upload
        class="upload-btn"
        accept=".srt"
        :auto-upload="false"
        :show-file-list="false"
        @change="handleSrtUpload"
      >
        <el-button type="primary">上传字幕</el-button>
      </el-upload>

      <el-button type="success" @click="handleExport">导出字幕</el-button>
    </div>

    <!-- 主要内容区 -->
    <div class="main-content">
      <!-- 左侧视频播放器 -->
      <div class="video-player">
        <div class="video-container">
          <video
            ref="videoRef"
            :src="store.videoUrl"
            @timeupdate="handleTimeUpdate"
            @click="togglePlay"
          ></video>
          <!-- 字幕显示层 -->
          <div class="subtitle-overlay" v-if="store.currentSubtitle">
            {{ store.currentSubtitle.text }}
          </div>
        </div>
      </div>

      <!-- 右侧字幕编辑区 -->
      <div class="subtitle-panel">
        <!-- 当前字幕编辑 -->
        <div class="current-subtitle" v-if="store.currentSubtitle">
          <div class="subtitle-header">
            <h3>当前字幕 ({{ store.currentIndex + 1 }}/{{ store.totalSubtitles }})</h3>
          </div>
          <div class="time-editor">
            <div class="time-input">
              <span>开始时间：</span>
              <el-input-number 
                v-model="startTimeMs"
                :min="0"
                @change="(value) => handleTimeChange('start', value)"
              />
              <div class="time-adjust-buttons">
                <el-button size="small" @click="adjustTime('start', -50)">-50ms</el-button>
                <el-button size="small" @click="adjustTime('start', 50)">+50ms</el-button>
              </div>
            </div>
            <div class="time-input">
              <span>结束时间：</span>
              <el-input-number 
                v-model="endTimeMs"
                :min="0"
                @change="(value) => handleTimeChange('end', value)"
              />
              <div class="time-adjust-buttons">
                <el-button size="small" @click="adjustTime('end', -50)">-50ms</el-button>
                <el-button size="small" @click="adjustTime('end', 50)">+50ms</el-button>
              </div>
            </div>
          </div>
          <div class="subtitle-text">
            <p>当前字幕文本：</p>
            <el-input
              type="textarea"
              :model-value="store.currentSubtitle?.text"
              @input="handleTextInput"
              :rows="3"
              placeholder="请输入字幕文本"
            />
          </div>
          <div class="controls">
            <el-button @click="playCurrentSubtitle">播放当前片段</el-button>
            <el-button @click="prevSubtitle" type="primary">上一条</el-button>
            <el-button @click="nextSubtitle" type="primary">下一条</el-button>
            <el-button @click="handleDelete" type="danger">删除当前字幕</el-button>
          </div>
        </div>

        <!-- 字幕列表 -->
        <div class="subtitle-list">
          <el-table 
            :data="store.subtitles" 
            height="400" 
            :row-class-name="tableRowClassName"
            @row-click="handleRowClick"
            ref="tableRef"
          >
            <el-table-column prop="id" label="序号" width="60" />
            <el-table-column prop="startTime" label="开始时间" width="100" />
            <el-table-column prop="endTime" label="结束时间" width="100" />
            <el-table-column prop="text" label="字幕文本" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useSubtitleStore } from '../stores/subtitle'
import { ElMessage, ElMessageBox } from 'element-plus'

const store = useSubtitleStore()
const videoRef = ref(null)
const tableRef = ref(null)

// 时间转换：毫秒
const startTimeMs = computed({
  get: () => timeToMs(store.currentSubtitle?.startTime),
  set: (value) => handleTimeChange('start', value)
})

const endTimeMs = computed({
  get: () => timeToMs(store.currentSubtitle?.endTime),
  set: (value) => handleTimeChange('end', value)
})

// 当前字幕文本
const currentText = computed({
  get: () => store.currentSubtitle?.text || '',
  set: (value) => {
    if (store.currentSubtitle) {
      store.updateSubtitleText(store.currentIndex, value)
    }
  }
})

// 处理视频上传
const handleVideoUpload = (file) => {
  const videoUrl = URL.createObjectURL(file.raw)
  store.setVideoUrl(videoUrl)
}

// 处理字幕上传
const handleSrtUpload = async (file) => {
  try {
    await store.parseSrtFile(file.raw)
    ElMessage.success('字幕文件解析成功')
  } catch (error) {
    ElMessage.error('字幕文件解析失败')
  }
}

// 获取相邻字幕的时间限制
const getTimeConstraints = () => {
  const prevSubtitle = store.subtitles[store.currentIndex - 1]
  const nextSubtitle = store.subtitles[store.currentIndex + 1]
  
  return {
    minStart: prevSubtitle ? timeToMs(prevSubtitle.endTime) : 0,
    maxEnd: nextSubtitle ? timeToMs(nextSubtitle.startTime) : Infinity
  }
}

// 处理时间更新
const handleTimeChange = (type, value) => {
  if (!store.currentSubtitle) return
  
  const { minStart, maxEnd } = getTimeConstraints()
  let newStartMs = type === 'start' ? value : timeToMs(store.currentSubtitle.startTime)
  let newEndMs = type === 'end' ? value : timeToMs(store.currentSubtitle.endTime)
  
  // 检查时间限制
  if (type === 'start') {
    if (value < minStart) {
      newStartMs = minStart
      ElMessage.warning('开始时间不能早于上一条字幕的结束时间')
    }
    if (value >= newEndMs) {
      newStartMs = newEndMs - 1 // 确保开始时间小于结束时间
      ElMessage.warning('开始时间不能晚于或等于结束时间')
    }
  } else {
    if (value > maxEnd) {
      newEndMs = maxEnd
      ElMessage.warning('结束时间不能晚于下一条字幕的开始时间')
    }
    if (value <= newStartMs) {
      newEndMs = newStartMs + 1 // 确保结束时间大于开始时间
      ElMessage.warning('结束时间不能早于或等于开始时间')
    }
  }
  
  // 更新时间
  store.updateSubtitleTime(
    store.currentIndex,
    msToTime(newStartMs),
    msToTime(newEndMs)
  )
}

// 调整时间（增加或减少毫秒）
const adjustTime = (type, delta) => {
  if (!store.currentSubtitle) return
  
  const currentMs = type === 'start' ? startTimeMs.value : endTimeMs.value
  const { minStart, maxEnd } = getTimeConstraints()
  
  let newMs = currentMs + delta
  
  // 检查时间限制
  if (type === 'start') {
    newMs = Math.max(minStart, Math.min(newMs, timeToMs(store.currentSubtitle.endTime) - 1))
    if (newMs === minStart && delta < 0) {
      ElMessage.warning('开始时间不能早于上一条字幕的结束时间')
    }
  } else {
    newMs = Math.max(timeToMs(store.currentSubtitle.startTime) + 1, Math.min(newMs, maxEnd))
    if (newMs === maxEnd && delta > 0) {
      ElMessage.warning('结束时间不能晚于下一条字幕的开始时间')
    }
  }
  
  handleTimeChange(type, newMs)
}

// 播放当前字幕片段
const playCurrentSubtitle = () => {
  if (!videoRef.value || !store.currentSubtitle) return
  
  const startTime = timeToMs(store.currentSubtitle.startTime) / 1000
  const endTime = timeToMs(store.currentSubtitle.endTime) / 1000
  
  // 清除之前的定时器
  if (window.subtitleTimer) {
    clearInterval(window.subtitleTimer)
  }
  
  // 设置新的播放位置
  videoRef.value.currentTime = startTime
  videoRef.value.play()
  
  // 监控结束时间
  window.subtitleTimer = setInterval(() => {
    if (videoRef.value.currentTime >= endTime) {
      videoRef.value.pause()
      clearInterval(window.subtitleTimer)
    }
  }, 10)
}

// 上一条字幕
const prevSubtitle = () => {
  if (store.currentIndex > 0) {
    // 清除当前的定时器
    if (window.subtitleTimer) {
      clearInterval(window.subtitleTimer)
    }
    
    store.setCurrentIndex(store.currentIndex - 1)
    // 直接播放新的字幕片段
    playCurrentSubtitle()
  } else {
    ElMessage.warning('已经是第一条字幕')
  }
}

// 下一条字幕
const nextSubtitle = () => {
  if (store.currentIndex < store.totalSubtitles - 1) {
    // 清除当前的定时器
    if (window.subtitleTimer) {
      clearInterval(window.subtitleTimer)
    }
    
    store.setCurrentIndex(store.currentIndex + 1)
    // 直接播放新的字幕片段
    playCurrentSubtitle()
  } else {
    ElMessage.warning('已经是最后一条字幕')
  }
}

// 处理视频时间更新
const handleTimeUpdate = () => {
  if (videoRef.value) {
    store.updateCurrentTime(videoRef.value.currentTime)
  }
}

// 导出字幕
const handleExport = () => {
  const srtContent = store.exportSrt()
  const blob = new Blob([srtContent], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'subtitle_edited.srt'
  a.click()
  URL.revokeObjectURL(url)
}

// 删除当前字幕
const handleDelete = () => {
  if (!store.currentSubtitle) return

  ElMessageBox.confirm(
    '确定要删除当前字幕吗？此操作不可恢复。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      store.deleteSubtitle(store.currentIndex)
      ElMessage.success('字幕已删除')
      
      // 如果还有字幕，自动播放当前字幕
      if (store.totalSubtitles > 0) {
        setTimeout(() => {
          playCurrentSubtitle()
        }, 100)
      }
    })
    .catch(() => {
      // 用户取消删除操作
    })
}

// 辅助函数：时间格式转换
const timeToMs = (timeStr) => {
  if (!timeStr) return 0
  const [hours, minutes, seconds] = timeStr.split(':')
  const [secs, ms] = seconds.split(',')
  return (parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(secs)) * 1000 + parseInt(ms)
}

const msToTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const milliseconds = ms % 1000
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`
}

// 切换播放/暂停
const togglePlay = () => {
  if (!videoRef.value) return
  
  if (videoRef.value.paused) {
    videoRef.value.play()
  } else {
    videoRef.value.pause()
  }
}

// 处理字幕列表行点击
const handleRowClick = (row) => {
  // 找到点击行的索引
  const index = store.subtitles.findIndex(item => item.id === row.id)
  if (index !== -1) {
    // 清除当前的定时器
    if (window.subtitleTimer) {
      clearInterval(window.subtitleTimer)
    }
    
    store.setCurrentIndex(index)
    // 直接播放新的字幕片段
    playCurrentSubtitle()
  }
}

// 处理文本输入
const handleTextInput = (value) => {
  if (store.currentSubtitle) {
    store.updateSubtitleText(store.currentIndex, value)
  }
}

// 设置表格行的类名
const tableRowClassName = ({ row, rowIndex }) => {
  return rowIndex === store.currentIndex ? 'current-subtitle-row' : ''
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (window.subtitleTimer) {
    clearInterval(window.subtitleTimer)
  }
})
</script>

<style scoped>
.subtitle-editor {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
}

.video-player {
  flex: 1;
  min-width: 0;
}

.video-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 宽高比 */
  background: #000;
}

.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.subtitle-overlay {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  max-width: 90%;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 1.2em;
  text-align: center;
  border-radius: 4px;
  z-index: 1;
  white-space: pre-wrap;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.8);
}

/* 移除视频默认控件 */
video::-webkit-media-controls {
  display: none !important;
}
video::-webkit-media-controls-enclosure {
  display: none !important;
}
video::-webkit-media-controls-panel {
  display: none !important;
}

/* 添加鼠标手型 */
.video-container {
  cursor: pointer;
}

.subtitle-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.current-subtitle {
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.time-editor {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.time-input {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.time-adjust-buttons {
  display: flex;
  gap: 5px;
  margin-left: 10px;
}

.subtitle-text {
  margin-bottom: 20px;
}

.controls {
  display: flex;
  gap: 10px;
}

.subtitle-list {
  flex: 1;
  min-height: 0;
}

/* 移除Element Plus的默认高亮样式 */
:deep(.el-table__row.current-row) {
  background-color: transparent !important;
}

:deep(.el-table__row.current-row > td.el-table__cell) {
  background-color: transparent !important;
}

/* 当前字幕行的样式 */
:deep(.current-subtitle-row) {
  border: 2px solid #409EFF !important;
  border-left: 4px solid #409EFF !important;
  background-color: #ecf5ff !important;
}

:deep(.current-subtitle-row td) {
  background-color: #ecf5ff !important;
}

:deep(.el-table__row:hover td) {
  background-color: #f5f7fa !important;
}

:deep(.current-subtitle-row:hover td) {
  background-color: #ecf5ff !important;
}

/* 确保边框不会影响布局 */
:deep(.el-table__row) {
  border: 2px solid transparent;
  border-left: 4px solid transparent;
}

.subtitle-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #dcdfe6;
}

.subtitle-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
</style> 
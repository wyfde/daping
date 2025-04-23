<template>
  <div class="daping-container">
    <!-- 顶部标题 -->
    <div class="header">
      <h1>设备监控大屏</h1>
      <div class="fullscreen-btn" @click="toggleFullScreen" v-if="!isFullscreen">
        <img src="@/assets/images/quanping.png" alt="全屏" />
      </div>
    </div>

    <!-- 设备展示区域 -->
    <div class="devices-grid">
      <div class="device-card" v-for="(device, index) in deviceList" :key="index">
        <div class="device-header">
          <span class="device-name">{{ device.deviceName }}</span>
          <span class="device-status" :class="{ 'online': device.status === 3 }">
            {{ device.status === 3 ? '在线' : '离线' }}
          </span>
        </div>
        <div class="device-info">
          <div class="info-item">
            <span class="label">设备编号：</span>
            <span class="value">{{ device.serialNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">产品名称：</span>
            <span class="value">{{ device.productName }}</span>
          </div>
          <div class="info-item">
            <span class="label">信号强度：</span>
            <span class="value signal">
              <svg-icon v-if="device.status === 3 && device.rssi >= '-55'" icon-class="wifi_4" />
              <svg-icon v-else-if="device.status === 3 && device.rssi >= '-70' && device.rssi < '-55'" icon-class="wifi_3" />
              <svg-icon v-else-if="device.status === 3 && device.rssi >= '-85' && device.rssi < '-70'" icon-class="wifi_2" />
              <svg-icon v-else-if="device.status === 3 && device.rssi >= '-100' && device.rssi < '-85'" icon-class="wifi_1" />
              <svg-icon v-else icon-class="wifi_0" />
            </span>
          </div>
          <div class="info-item">
            <span class="label">当前温度：</span>
            <span class="value temperature">{{ device.temperature || 0 }}℃</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listDevice, getDeviceRunningStatus } from '@/api/iot/device'

export default {
  name: 'Daping',
  data() {
    return {
      deviceList: [],
      deviceStatusMap: new Map(), // 存储设备实时状态
      isFullscreen: false // 是否全屏
    }
  },
  created() {
    this.getDeviceList()
    // 确保MQTT工具存在再初始化
    if (this.$mqttTool) {
      this.initMqtt()
    }
    // 监听全屏变化
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
  },
  mounted() {
    // 每5秒更新一次设备状态
    this.monitorTimer = setInterval(() => {
      this.updateDeviceStatus()
    }, 5000)
  },
  beforeDestroy() {
    // 断开MQTT连接
    if (this.$mqttTool && this.$mqttTool.client) {
      this.$mqttTool.client.end()
    }
    // 清除定时器
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer)
    }
    // 移除全屏监听
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
  },
  methods: {
    // 切换全屏
    toggleFullScreen() {
      const element = document.documentElement;
      
      if (!this.isFullscreen) {
        // 点击后立即隐藏按钮
        this.isFullscreen = true;
        
        if (element.requestFullscreen) {
          element.requestFullscreen().catch(err => {
            console.error('全屏失败:', err);
            this.isFullscreen = false;
          });
        }
      }
    },
    // 处理全屏状态变化
    handleFullscreenChange() {
      // 直接检查document.fullscreenElement
      this.isFullscreen = !!document.fullscreenElement;
      console.log('全屏状态变化:', this.isFullscreen);
    },
    // 获取设备列表
    async getDeviceList() {
      try {
        const res = await listDevice({
          pageNum: 1,
          pageSize: 8
        })
        if (res.code === 200) {
          this.deviceList = res.rows
          // 初始化设备状态
          this.updateDeviceStatus()
        }
      } catch (error) {
        console.error('获取设备列表失败:', error)
      }
    },
    // 更新设备状态
    async updateDeviceStatus() {
      if (!this.deviceList.length) return
      
      for (const device of this.deviceList) {
        try {
          const res = await getDeviceRunningStatus({
            deviceId: device.deviceId
          })
          if (res.code === 200 && res.data) {
            // 从thingsModels中获取温度值
            const temperatureModel = res.data.thingsModels?.find(model => model.id === 'temperature')
            const temperature = temperatureModel ? Number(temperatureModel.value) : 0
            
            // 更新设备状态和温度
            this.deviceStatusMap.set(device.deviceId, {
              ...res.data,
              temperature
            })
            
            // 同时更新设备列表中的温度值
            const deviceIndex = this.deviceList.findIndex(d => d.deviceId === device.deviceId)
            if (deviceIndex !== -1) {
              this.$set(this.deviceList, deviceIndex, {
                ...this.deviceList[deviceIndex],
                temperature
              })
            }
          }
        } catch (error) {
          console.error(`获取设备${device.deviceId}状态失败:`, error)
        }
      }
    },
    // 初始化MQTT连接
    initMqtt() {
      if (!this.$mqttTool || !this.$mqttTool.client) {
        console.warn('MQTT客户端未初始化');
        return;
      }
      
      try {
        this.$mqttTool.client.on('message', (topic, message) => {
          try {
            const topics = topic.split('/')
            const productId = topics[1]
            const deviceNum = topics[2]
            const messageData = JSON.parse(message.toString())
            
            if (topics[3] === 'status') {
              // 更新设备状态
              const device = this.deviceList.find(d => d.serialNumber === deviceNum)
              if (device) {
                device.status = messageData.status
                device.rssi = messageData.rssi
              }
            }
            
            if (topics[3] === 'monitor') {
              // 更新设备温度
              const device = this.deviceList.find(d => d.serialNumber === deviceNum)
              if (device) {
                for (const item of messageData) {
                  if (item.id === 'temperature') {
                    device.temperature = Number(item.value)
                    break
                  }
                }
              }
            }
          } catch (error) {
            console.error('MQTT消息处理失败:', error)
          }
        })
      } catch (error) {
        console.error('MQTT初始化失败:', error)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.daping-container {
  padding: 30px;
  background-color: #1a202c;
  color: #e2e8f0;
  min-height: 100vh;
  position: relative;

  .header {
    text-align: center;
    margin-bottom: 40px;
    position: relative;

    h1 {
      font-size: 48px;
      margin-bottom: 30px;
      color: #63b3ed;
      text-shadow: 0 0 15px rgba(99, 179, 237, 0.4);
      font-weight: bold;
    }

    .fullscreen-btn {
      position: absolute;
      top: 0;
      right: 30px;
      cursor: pointer;
      transition: transform 0.3s ease;
      padding: 10px;
      border-radius: 8px;
      background: rgba(45, 55, 72, 0.8);
      border: 2px solid #4a5568;

      &:hover {
        transform: scale(1.1);
        border-color: #63b3ed;
      }

      img {
        width: 40px;
        height: 40px;
      }
    }
  }

  .devices-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    padding: 0 30px;

    .device-card {
      background: #2d3748;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease;
      border: 2px solid #4a5568;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
        border-color: #63b3ed;
      }

      .device-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 25px;
        padding-bottom: 15px;
        border-bottom: 2px solid #4a5568;

        .device-name {
          font-size: 28px;
          font-weight: bold;
          color: #63b3ed;
        }

        .device-status {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 18px;
          background-color: #e53e3e;
          color: #fff;

          &.online {
            background-color: #38a169;
          }
        }
      }

      .device-info {
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 20px;

          .label {
            color: #a0aec0;
            font-weight: 500;
          }

          .value {
            color: #e2e8f0;
            font-weight: 500;

            &.temperature {
              font-size: 36px;
              font-weight: bold;
              color: #48bb78;
              text-shadow: 0 0 15px rgba(72, 187, 120, 0.4);
            }

            &.signal {
              display: flex;
              align-items: center;
              gap: 8px;

              .svg-icon {
                font-size: 32px;
                color: #48bb78;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式布局
@media screen and (max-width: 1920px) {
  .devices-grid {
    grid-template-columns: repeat(3, 1fr) !important;
  }
}

@media screen and (max-width: 1600px) {
  .devices-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media screen and (max-width: 1200px) {
  .devices-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>    
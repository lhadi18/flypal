class WebSocketService {
  constructor() {
    this.ws = null
    this.isConnected = false
    this.reconnectInterval = 3000
    this.eventListeners = {}
  }

  connect(url, userId) {
    if (this.ws && this.isConnected) {
      console.warn('WebSocket is already connected')
      return
    }

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.send({ type: 'register', userId })
      this.emitEvent('open')
    }

    this.ws.onmessage = event => {
      const message = JSON.parse(event.data)
      console.log('WebSocket message received:', message)
      this.emitEvent('message', message)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.isConnected = false
      this.emitEvent('close')
      setTimeout(() => this.connect(url, userId), this.reconnectInterval)
    }

    this.ws.onerror = error => {
      console.error('WebSocket error:', error)
      this.emitEvent('error', error)
    }
  }

  send(message) {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message)
    }
  }

  close() {
    if (this.ws) {
      this.ws.close()
    }
  }

  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = []
    }
    this.eventListeners[event].push(callback)
  }

  off(event, callback) {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback)
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data))
    }
  }
}

const webSocketService = new WebSocketService()
export default webSocketService

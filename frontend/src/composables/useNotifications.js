import { io } from 'socket.io-client';
import { ref } from 'vue';

const socket = ref(null);
const connected = ref(false);
const notifications = ref([]);

const isRinging = ref(false);
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let loopInterval = null;

function stopNotificationSound() {
  isRinging.value = false;
  
  if (loopInterval) {
    clearInterval(loopInterval);
    loopInterval = null;
  }

  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch (e) {}
    oscillator = null;
  }
  
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (e) {}
    audioCtx = null;
  }
}

function playNotificationSound() {
  stopNotificationSound(); // Ensure clean state
  isRinging.value = true;
  
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContext();
      }

      oscillator = audioCtx.createOscillator();
      gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Alarm style: rapid high-pitched beeps
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1760, audioCtx.currentTime + 0.1); // A6

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // Play immediately then loop
  playBeep();
  loopInterval = setInterval(playBeep, 2000); // Repeat every 2 seconds
}

export function useNotifications() {
  function connect(userId) {
    if (socket.value) {
      // If already connected, just ensure user is registered
      if (!connected.value) {
         socket.value.emit('register', userId);
      }
      return;
    }

    // Connect to WebSocket
    console.log('🔌 Attempting to connect to WebSocket: http://localhost:3000/notifications');
    socket.value = io('http://localhost:3000/notifications', {
      transports: ['websocket'],
    });

    socket.value.on('connect_error', (err) => {
      console.error('❌ Connection Error:', err.message);
    });

    socket.value.on('connect', () => {
      console.log('✅ Socket Connected! ID:', socket.value.id);
      connected.value = true;
      
      // Register user
      console.log('📝 Registering user:', userId);
      socket.value.emit('register', userId);
    });

    socket.value.on('disconnect', () => {
      console.log('❌ Disconnected from notification server');
      connected.value = false;
    });

    socket.value.on('reminder', (notification) => {
      console.log('📨 Received event: reminder');
      // Play notification sound
      playNotificationSound();
      
      // Add to notifications array
      notifications.value.unshift(notification);
      
      // Show browser notification
      showBrowserNotification(notification);
    });
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  }

  function showBrowserNotification(notification) {
    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const notif = new Notification(`📝 ${notification.title}`, {
        body: notification.content.substring(0, 100) + (notification.content.length > 100 ? '...' : ''),
        icon: '/favicon.ico',
        tag: notification.noteId,
        requireInteraction: true,
      });

      notif.onclick = () => {
        window.focus();
        // Navigate to notes page
        window.location.href = '/notes';
        notif.close();
      };
    }
  }

  function clearNotification(noteId) {
    const index = notifications.value.findIndex(n => n.noteId === noteId);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  }

  function clearAllNotifications() {
    notifications.value = [];
  }

  return {
    connect,
    disconnect,
    connected,
    notifications,
    isRinging,
    stopNotificationSound,
    clearNotification,
    clearAllNotifications,
  };
}

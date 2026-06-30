// Game Configuration
const CONFIG = {
  initialLives: 3,
  pointsPerCorrect: 10,
  pointsPerBonus: 5,
  maxWordLength: 12,
  hintDelay: 3000, // 3 seconds
  confettiCount: 100
};

// Game State
const gameState = {
  score: 0,
  highScore: localStorage.getItem('highScore') || 0,
  lives: CONFIG.initialLives,
  currentWordIndex: 0,
  guessedLetters: new Set(),
  isGameOver: false,
  timer: null,
  hintTimeout: null
};

// DOM Elements
const elements = {
  textInput: document.getElementById('textField'),
  scoreElement: document.getElementById('score'),
  highScoreElement: document.getElementById('highScore'),
  livesElement: document.getElementById('lives'),
  imageElement: document.getElementById('pic'),
  keyboard: document.querySelector('.keyboardCon'),
  modal: document.getElementById('gameOverModal'),
  finalScore: document.getElementById('finalScore'),
  newHighScore: document.getElementById('newHighScore'),
  playAgainBtn: document.getElementById('playAgain'),
  hintBtn: document.getElementById('hintBtn'),
  hintText: document.getElementById('hintText'),
  loading: document.querySelector('.loading')
};

// Word Bank - Categorized by difficulty and matched with available images
const WORD_BANK = {
  easy: [
    'APPLE', 'BABY', 'CAKE', 'DOG', 'EYE', 'FLIPFLOP', 'GUITAR', 'HORSE', 'ICECREAM', 'JUG',
    'KID', 'LION', 'MOTORBIKE', 'NATURE', 'OCLOCK', 'PUPPY', 'QUAIL', 'RABBIT', 'SOAP', 'TEA',
    'UMBRELLA', 'VAN', 'WATCH', 'XYLOPHONE', 'YELLOW', 'ZEBRA'
  ],
  medium: [
    'APPLE', 'BABY', 'CAKE', 'DOG', 'EYE', 'FLIPFLOP', 'GUITAR', 'HORSE', 'ICECREAM', 'JUG',
    'KID', 'LION', 'MOTORBIKE', 'NATURE', 'OCLOCK', 'PUPPY', 'QUAIL', 'RABBIT', 'SOAP', 'TEA'
  ],
  hard: [
    'APPLE', 'BABY', 'CAKE', 'DOG', 'EYE', 'FLIPFLOP', 'GUITAR', 'HORSE', 'ICECREAM', 'JUG',
    'KID', 'LION', 'MOTORBIKE', 'NATURE', 'OCLOCK', 'PUPPY', 'QUAIL', 'RABBIT', 'SOAP', 'TEA'
  ]
};

// Image mapping for words that don't match the first letter convention
const IMAGE_MAP = {
  'APPLE': 'apple.png',
  'BABY': 'baby.jpg',
  'CAKE': 'cake.jpg',
  'DOG': 'dog.jpg',
  'EYE': 'eye.jpg',
  'FLIPFLOP': 'flipflop.jpg',
  'GUITAR': 'guitar.jpg',
  'HORSE': 'horse.jpg',
  'ICECREAM': 'icecream.jpg',
  'JUG': 'jug.jpg',
  'KID': 'kid.jpg',
  'LION': 'lion.jpg',
  'MOTORBIKE': 'motorbike_1.jpg',
  'NATURE': 'nature.jpg',
  'OCLOCK': 'oclock.jpg',
  'PUPPY': 'puppy.jpg',
  'QUAIL': 'quail.png',
  'RABBIT': 'rabbit.jpg',
  'SOAP': 'soap.jpg',
  'TEA': 'tea.jpg',
  'UMBRELLA': 'umbrella.jpg',
  'VAN': 'v.png',
  'WATCH': 'watch.jpg',
  'XYLOPHONE': 'xylophone.png',
  'YELLOW': 'y.png',
  'ZEBRA': 'z.png'
};

// Initialize the game
function initGame() {
  // Reset game state
  gameState.score = 0;
  gameState.lives = CONFIG.initialLives;
  gameState.currentWordIndex = 0;
  gameState.guessedLetters.clear();
  gameState.isGameOver = false;
  
  // Reset UI
  updateScore();
  updateLives();
  elements.textInput.value = '';
  elements.textInput.disabled = false;
  elements.textInput.focus();
  
  // Clear any existing event listeners before setting up new ones
  if (elements.textInput) {
    elements.textInput.oninput = null;
    elements.textInput.onkeydown = null;
  }
  
  // Show loading state
  showLoading(true);
  
  // Start with a new word
  setTimeout(() => {
    showLoading(false);
    displayNewWord();
  }, 800);
  
  // Set up event listeners
  setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
  // Remove existing event listeners first
  elements.textInput.removeEventListener('input', handleInput);
  elements.textInput.removeEventListener('keydown', handleKeyDown);
  
  // Input field
  elements.textInput.addEventListener('input', handleInput);
  elements.textInput.addEventListener('keydown', handleKeyDown);
  
  // Keyboard buttons - use event delegation instead of adding multiple listeners
  if (elements.keyboard) {
    elements.keyboard.removeEventListener('click', handleKeyboardClick);
    elements.keyboard.addEventListener('click', handleKeyboardClick);
  }
  
  // Buttons - remove and re-add to prevent duplicates
  const submitBtn = document.getElementById('submitBtn');
  const clearBtn = document.getElementById('clearBtn');
  const hintBtn = elements.hintBtn;
  
  if (submitBtn) {
    submitBtn.removeEventListener('click', checkAnswer);
    submitBtn.addEventListener('click', checkAnswer);
  }
  if (clearBtn) {
    clearBtn.removeEventListener('click', clearInput);
    clearBtn.addEventListener('click', clearInput);
  }
  if (hintBtn) {
    hintBtn.removeEventListener('click', showHint);
    hintBtn.addEventListener('click', showHint);
  }
  
  // Play again button
  if (elements.playAgainBtn) {
    const handlePlayAgain = () => {
      hideModal();
      initGame();
    };
    elements.playAgainBtn.removeEventListener('click', handlePlayAgain);
    elements.playAgainBtn.addEventListener('click', handlePlayAgain);
  }
}

// Handle keyboard click events
function handleKeyboardClick(e) {
  const key = e.target.closest('.key');
  if (!key) return;
  
  const letter = key.textContent.trim();
  if (letter) {
    elements.textInput.value += letter.toLowerCase();
    elements.textInput.focus();
  }
}

// Handle keydown events
function handleKeyDown(e) {
  if (e.key === 'Enter') {
    checkAnswer();
  }
}

// Display a new word
function displayNewWord() {
  // Clear previous state
  clearTimeout(gameState.hintTimeout);
  elements.hintText.textContent = '';
  elements.hintBtn.disabled = false;
  
  // Get a random word from the appropriate difficulty level
  const difficulty = getCurrentDifficulty();
  const wordList = WORD_BANK[difficulty];
  const randomIndex = Math.floor(Math.random() * wordList.length);
  gameState.currentWord = wordList[randomIndex];
  
  // Update the image
  updateImage(gameState.currentWord);
  
  // Clear input and focus
  clearInput();
  elements.textInput.focus();
  
  // Start hint timer
  startHintTimer();
}

// Handle text input
function handleInput(e) {
  // Limit input length
  if (e.target.value.length > CONFIG.maxWordLength) {
    e.target.value = e.target.value.slice(0, CONFIG.maxWordLength);
  }
  
  // Convert to uppercase
  e.target.value = e.target.value.toUpperCase();
}

// Check the user's answer
function checkAnswer() {
  const userAnswer = elements.textInput.value.trim().toUpperCase();
  
  if (!userAnswer) {
    showFeedback('Please enter a word', 'error');
    return;
  }
  
  if (userAnswer === gameState.currentWord) {
    // Correct answer
    handleCorrectAnswer();
  } else {
    // Wrong answer
    handleWrongAnswer();
  }
}

// Handle correct answer
function handleCorrectAnswer() {
  // Add points
  const pointsEarned = calculatePoints();
  gameState.score += pointsEarned;
  
  // Update high score if needed
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('highScore', gameState.highScore);
  }
  
  // Update UI
  updateScore();
  showFeedback(`+${pointsEarned} points!`, 'success');
  
  // Show confetti for correct answer
  createConfetti();
  
  // Move to next word after a short delay
  setTimeout(() => {
    gameState.currentWordIndex++;
    displayNewWord();
  }, 1000);
}

// Handle wrong answer
function handleWrongAnswer() {
  gameState.lives--;
  updateLives();
  
  if (gameState.lives <= 0) {
    // Game over
    gameOver();
  } else {
    // Show wrong answer feedback
    showFeedback('Try again!', 'error');
    elements.textInput.classList.add('wrong');
    setTimeout(() => elements.textInput.classList.remove('wrong'), 1000);
    clearInput();
  }
}

// Calculate points based on word length and hints used
function calculatePoints() {
  let points = CONFIG.pointsPerCorrect;
  
  // Bonus points for longer words
  points += Math.min(Math.floor(gameState.currentWord.length / 3), 5);
  
  // Deduct points for using hints
  if (gameState.hintUsed) {
    points = Math.max(1, Math.floor(points / 2));
  }
  
  return points;
}

// Show a hint for the current word
function showHint() {
  if (gameState.hintShown) return;
  
  const word = gameState.currentWord;
  const hint = word.split('').map((letter, index) => {
    // Show first and last letters, and some random letters in between
    if (index === 0 || index === word.length - 1 || Math.random() > 0.7) {
      return letter;
    }
    return '_';
  }).join(' ');
  
  elements.hintText.textContent = `Hint: ${hint}`;
  elements.hintBtn.disabled = true;
  gameState.hintShown = true;
  
  // Auto-hide hint after delay
  gameState.hintTimeout = setTimeout(() => {
    elements.hintText.textContent = '';
  }, 5000);
}

// Start the hint timer
function startHintTimer() {
  gameState.hintShown = false;
  elements.hintBtn.disabled = true;
  
  // Enable hint button after delay
  gameState.hintTimeout = setTimeout(() => {
    if (!gameState.isGameOver) {
      elements.hintBtn.disabled = false;
      elements.hintText.textContent = 'Need a hint?';
    }
  }, CONFIG.hintDelay);
}

// Update the image based on the current word
function updateImage(word) {
  if (!word) return;
  
  // Get the image filename from the mapping, or use the first letter as fallback
  const imageFile = IMAGE_MAP[word] || `${word.charAt(0).toLowerCase()}.png`;
  const imageUrl = `./assets/${imageFile}`;
  
  // Show loading state
  elements.imageElement.style.opacity = 0.5;
  
  // Create or update the first letter hint
  let hintElement = document.getElementById('first-letter-hint');
  if (!hintElement) {
    hintElement = document.createElement('div');
    hintElement.id = 'first-letter-hint';
    elements.imageElement.parentNode.appendChild(hintElement);
  }
  
  // Style the hint
  hintElement.textContent = word.charAt(0);
  hintElement.style.position = 'absolute';
  hintElement.style.top = '10px';
  hintElement.style.left = '10px';
  hintElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  hintElement.style.color = 'white';
  hintElement.style.borderRadius = '50%';
  hintElement.style.width = '40px';
  hintElement.style.height = '40px';
  hintElement.style.display = 'flex';
  hintElement.style.justifyContent = 'center';
  hintElement.style.alignItems = 'center';
  hintElement.style.fontSize = '24px';
  hintElement.style.fontWeight = 'bold';
  hintElement.style.zIndex = '5';
  
  // Set up image loading handler
  elements.imageElement.onload = () => {
    elements.imageElement.style.opacity = 1;
    showLoading(false);
  };
  
  // Set up error handler in case image fails to load
  elements.imageElement.onerror = () => {
    console.error(`Failed to load image: ${imageUrl}`);
    // Fallback to first letter image
    if (!imageFile.endsWith('.png')) {
      elements.imageElement.src = `./assets/${word.charAt(0).toLowerCase()}.png`;
    }
  };
  
  // Set the image source
  elements.imageElement.src = imageUrl;
  elements.imageElement.alt = `A picture of ${word.toLowerCase()}`;
  elements.imageElement.title = `Can you name this ${word.toLowerCase()}?`;
  
  // Make sure the hint is on top
  hintElement.style.display = 'flex';
}

// Update score display
function updateScore() {
  if (elements.scoreElement) {
    elements.scoreElement.textContent = gameState.score;
  }
  
  if (elements.highScoreElement) {
    elements.highScoreElement.textContent = gameState.highScore;
  }
}

// Update lives display
function updateLives() {
  if (elements.livesElement) {
    elements.livesElement.textContent = '❤️'.repeat(gameState.lives);
  }
}

// Show feedback message
function showFeedback(message, type = 'info') {
  const feedback = document.createElement('div');
  feedback.className = `feedback ${type}`;
  feedback.textContent = message;
  
  document.body.appendChild(feedback);
  
  // Auto-remove feedback after delay
  setTimeout(() => {
    feedback.classList.add('fade-out');
    setTimeout(() => feedback.remove(), 300);
  }, 2000);
}

// Clear the input field
function clearInput() {
  elements.textInput.value = '';
  elements.textInput.focus();
}

// Show loading state
function showLoading(show) {
  if (elements.loading) {
    elements.loading.style.display = show ? 'flex' : 'none';
  }
}

// Show game over modal
function gameOver() {
  gameState.isGameOver = true;
  
  // Update modal content
  elements.finalScore.textContent = gameState.score;
  
  // Check for new high score
  const isNewHighScore = gameState.score >= gameState.highScore;
  elements.newHighScore.style.display = isNewHighScore ? 'block' : 'none';
  
  // Show modal
  showModal();
}

// Show modal
function showModal() {
  if (elements.modal) {
    elements.modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Hide modal
function hideModal() {
  if (elements.modal) {
    elements.modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Get current difficulty based on score
function getCurrentDifficulty() {
  if (gameState.score < 30) return 'easy';
  if (gameState.score < 100) return 'medium';
  return 'hard';
}

// Create confetti effect
function createConfetti() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  
  for (let i = 0; i < CONFIG.confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    
    // Random position
    const x = Math.random() * window.innerWidth;
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    // Random rotation
    const rotation = Math.random() * 360;
    
    // Apply styles
    confetti.style.left = `${x}px`;
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.transform = `rotate(${rotation}deg)`;
    
    // Random animation duration
    const duration = Math.random() * 3 + 2;
    confetti.style.animationDuration = `${duration}s`;
    
    // Add to document
    document.body.appendChild(confetti);
    
    // Remove after animation
    setTimeout(() => {
      confetti.remove();
    }, duration * 1000);
  }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add loading styles
  const style = document.createElement('style');
  style.textContent = `
    .feedback {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 50px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      opacity: 0.9;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      transition: opacity 0.3s ease;
    }
    
    .feedback.success {
      background-color: var(--success-color);
    }
    
    .feedback.error {
      background-color: var(--error-color);
    }
    
    .feedback.info {
      background-color: var(--primary-color);
    }
    
    .fade-out {
      opacity: 0 !important;
    }
  `;
  document.head.appendChild(style);
  
  // Start the game
  initGame();
});

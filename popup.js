document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('paintCanvas');
  const ctx = canvas.getContext('2d');
  const colorPicker = document.getElementById('colorPicker');
  const brushBtn = document.getElementById('brush');
  const eraserBtn = document.getElementById('eraser');
  const undo = document.getElementById('undo');
  const redo = document.getElementById('redo');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const exportBtn = document.getElementById('export');
  const importBtn = document.getElementById('import');
  const newCanvasBtn = document.getElementById('newCanvas');
  const canvasSettings = document.getElementById('canvasSettings');
  const canvasSettingsDropdown = document.getElementById('canvasSettingsDropdown');
  const exportDropdown = document.getElementById('exportDropdown');
  const applySize = document.getElementById('applySize');
  const canvasWidth = document.getElementById('canvasWidth');
  const canvasHeight = document.getElementById('canvasHeight');
  
  let painting = false;
  let currentColor = 'black';
  let lastColor = 'black'; // Store last used color
  let currentBrushSize = 5;
  let history = [];
  let historyStep = -1;
  let isEraser = false;
  let hasDrawn = false;
  let hasUnsavedChanges = false;

  // Initialize
  colorPicker.value = '#000000';
  brushSizeValue.value = '5';
  
  function startPosition(e) {
    painting = true;
    hasDrawn = false; // Reset drawing flag
    draw(e);
  }

  function endPosition() {
    if (painting && hasDrawn) { // Only save if we actually drew something
      saveState();
    }
    painting = false;
    ctx.beginPath();
  }

  function draw(e) {
    if (!painting) return;
    hasDrawn = true; // Set flag indicating drawing occurred
    hasUnsavedChanges = true;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = currentColor;

    ctx.lineTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);
  }

  function saveState() {
    history = history.slice(0, historyStep + 1);
    history.push(canvas.toDataURL());
    historyStep++;
  }

  function restoreState(step) {
    const img = new Image();
    img.src = history[step];
    img.onload = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
  }

  function resetCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    history = [];
    historyStep = -1;
    saveState();
    hasUnsavedChanges = false;
  }

  // Event Listeners
  colorPicker.addEventListener('input', function () {
    currentColor = colorPicker.value;
    lastColor = currentColor;
    isEraser = false;
    brushBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });

  brushBtn.addEventListener('click', function () {
    currentColor = lastColor;
    isEraser = false;
    brushBtn.classList.add('active');
    eraserBtn.classList.remove('active');
  });

  eraserBtn.addEventListener('click', function () {
    lastColor = currentColor;
    currentColor = '#FFFFFF';
    isEraser = true;
    eraserBtn.classList.add('active');
    brushBtn.classList.remove('active');
  });

  undo.addEventListener('click', function () {
    if (historyStep > 0) {
      historyStep--;
      restoreState(historyStep);
    }
  });

  redo.addEventListener('click', function () {
    if (historyStep < history.length - 1) {
      historyStep++;
      restoreState(historyStep);
    }
  });

  brushSizeValue.addEventListener('input', function () {
    let value = parseInt(brushSizeValue.value);
    if (value > 1000) value = 1000;
    if (value < 1) value = 1;
    currentBrushSize = value;
    brushSizeValue.value = value;
  });

  exportBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    exportDropdown.classList.toggle('show');
  });

  newCanvasBtn.addEventListener('click', function() {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Do you want to create a new canvas anyway?')) {
        resetCanvas();
      }
    } else {
      resetCanvas();
    }
  });

  // Get DOM elements with null checks
  const elements = {
    canvasSettings: document.getElementById('canvasSettings'),
    canvasSettingsDropdown: document.getElementById('canvasSettingsDropdown'),
    applySize: document.getElementById('applySize'),
    canvasWidth: document.getElementById('canvasWidth'),
    canvasHeight: document.getElementById('canvasHeight')
  };

  // Verify all elements exist
  for (const [key, element] of Object.entries(elements)) {
    if (!element) {
      console.error(`Missing element: ${key}`);
      return;
    }
  }

  // Add event listeners
  elements.canvasSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.canvasSettingsDropdown.style.display = 
      elements.canvasSettingsDropdown.style.display === 'block' ? 'none' : 'block';
  });

  // Close settings when clicking outside
  document.addEventListener('click', (e) => {
    if (!canvasSettingsDropdown.contains(e.target) && 
        !canvasSettings.contains(e.target)) {
      canvasSettingsDropdown.style.display = 'none';
    }
  });

  window.addEventListener('click', (e) => {
    if (!e.target.matches('#canvasSettings') && !e.target.matches('#export')) {
      canvasSettingsDropdown.classList.remove('show');
      exportDropdown.classList.remove('show');
    }
    if (!exportBtn.contains(e.target)) {
      exportDropdown.classList.remove('show');
    }
  });

  applySize.addEventListener('click', () => {
    const width = Math.min(Math.max(canvasWidth.value, 1), 1000);
    const height = Math.min(Math.max(canvasHeight.value, 1), 1000);
    
    // Save current canvas content
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
    
    // Resize canvas
    canvas.width = width;
    canvas.height = height;
    
    // Restore content
    ctx.drawImage(tempCanvas, 0, 0);
    saveState();
    canvasSettingsDropdown.classList.remove('show');
  });

  exportDropdown.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const type = e.target.dataset.type;
      const link = document.createElement('a');
      link.download = `drawing.${type.toLowerCase()}`;
      link.href = canvas.toDataURL(`image/${type.toLowerCase()}`);
      link.click();
      exportDropdown.classList.remove('show');
    }
  });

  canvas.addEventListener('mousedown', startPosition);
  canvas.addEventListener('mouseup', endPosition);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseleave', endPosition);

  document.addEventListener('click', function(e) {
    if (!exportBtn.contains(e.target)) {
      exportDropdown.classList.remove('show');
    }
  });

  // Initialize first state
  saveState();
});
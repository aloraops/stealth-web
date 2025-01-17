document.addEventListener('DOMContentLoaded', function() {
    // Add feature flags and configuration at the top
    const ENABLE_CURSOR_TRAIL = false;
    const ENABLE_EASTER_EGGS = true;
    const MIN_SENTENCES = 3;
    const MAX_SENTENCES = 5;
    const SENTENCE_MARGIN = 30;
    const CELL_WIDTH = 60;
    const CELL_HEIGHT = 25;

    // Calculate text lines to avoid
    function getTextLines() {
        const h1 = document.querySelector('.hero h1');
        const subtitle = document.querySelector('.hero .subtitle');
        const h1Rect = h1.getBoundingClientRect();
        const subtitleRect = subtitle.getBoundingClientRect();
        
        const startLine = Math.floor(h1Rect.top / CELL_HEIGHT);
        const endLine = Math.ceil(subtitleRect.bottom / CELL_HEIGHT);
        
        console.log(`Main text occupies lines ${startLine} to ${endLine}`);
        return { startLine, endLine };
    }

    // Call this after DOM is loaded
    const textLines = getTextLines();

    // Cursor trail code
    if (ENABLE_CURSOR_TRAIL) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor-trail';
        document.body.appendChild(cursor);

        let cursorX = 0;
        let cursorY = 0;
        let targetX = 0;
        let targetY = 0;

        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
        });

        function updateCursor() {
            const dx = targetX - cursorX;
            const dy = targetY - cursorY;
            
            cursorX += dx * 0.2;
            cursorY += dy * 0.2;
            
            cursor.style.left = `${cursorX}px`;
            cursor.style.top = `${cursorY}px`;
            
            requestAnimationFrame(updateCursor);
        }

        updateCursor();
    }

    // Fix cell selection for mobile
    const gridBackground = document.querySelector('.grid-background');
    let cellHighlight = document.createElement('div');
    let rangeHighlight = document.createElement('div');
    cellHighlight.className = 'cell-highlight';
    rangeHighlight.className = 'range-highlight';
    document.body.appendChild(cellHighlight);
    document.body.appendChild(rangeHighlight);

    let isSelecting = false;
    let startCell = { x: 0, y: 0 };
    let currentCell = { x: 0, y: 0 };
    let isMobile = false;

    // Detect mobile device
    function updateIsMobile() {
        isMobile = window.matchMedia('(max-width: 768px)').matches;
    }
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);

    function getCellCoordinates(e) {
        // Get touch or mouse coordinates
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        // Use window coordinates directly
        return {
            x: Math.floor(clientX / CELL_WIDTH) * CELL_WIDTH,
            y: Math.floor(clientY / CELL_HEIGHT) * CELL_HEIGHT
        };
    }

    function updateSelection(isComplete = false) {
        // Don't show range highlight on mobile for single taps
        if (isMobile && !isSelecting) {
            rangeHighlight.style.opacity = '0';
            return;
        }

        // Update initial cell highlight
        cellHighlight.style.left = startCell.x + 'px';
        cellHighlight.style.top = startCell.y + 'px';
        cellHighlight.style.width = CELL_WIDTH + 'px';
        cellHighlight.style.height = CELL_HEIGHT + 'px';
        cellHighlight.style.opacity = '1';

        // Calculate range dimensions
        const left = Math.min(startCell.x, currentCell.x);
        const top = Math.min(startCell.y, currentCell.y);
        const width = Math.abs(currentCell.x - startCell.x) + CELL_WIDTH;
        const height = Math.abs(currentCell.y - startCell.y) + CELL_HEIGHT;

        // Check if multiple cells are selected
        const isMultipleCells = width > CELL_WIDTH || height > CELL_HEIGHT;

        // Update range highlight
        rangeHighlight.style.left = left + 'px';
        rangeHighlight.style.top = top + 'px';
        rangeHighlight.style.width = width + 'px';
        rangeHighlight.style.height = height + 'px';
        rangeHighlight.style.opacity = '1';

        // Toggle classes based on selection state
        rangeHighlight.classList.toggle('selection-complete', isComplete);
        rangeHighlight.classList.toggle('multiple-cells', isMultipleCells);

        // Calculate cell reference range
        const startCol = String.fromCharCode(65 + Math.floor(left / CELL_WIDTH));
        const startRow = Math.floor(top / CELL_HEIGHT) + 1;
        const endCol = String.fromCharCode(65 + Math.floor((left + width - 1) / CELL_WIDTH));
        const endRow = Math.floor((top + height - 1) / CELL_HEIGHT) + 1;
        console.log(`Selected range: ${startCol}${startRow}:${endCol}${endRow}`);

        // Only process easter eggs if enabled
        if (ENABLE_EASTER_EGGS) {
            sentenceLocations.forEach(({ element, position, width, height, cellsNeeded }) => {
                const selectionLeft = parseInt(rangeHighlight.style.left);
                const selectionTop = parseInt(rangeHighlight.style.top);
                const selectionRight = selectionLeft + parseInt(rangeHighlight.style.width);
                const selectionBottom = selectionTop + parseInt(rangeHighlight.style.height);
                
                const elementLeft = Math.floor(position.x / CELL_WIDTH) * CELL_WIDTH;
                const elementRight = elementLeft + width; // Use actual width instead of cell-based width
                const elementTop = Math.floor(position.y / CELL_HEIGHT) * CELL_HEIGHT;
                const elementBottom = elementTop + CELL_HEIGHT;
                
                if (!(selectionLeft >= elementRight || 
                    selectionRight <= elementLeft || 
                    selectionTop >= elementBottom || 
                    selectionBottom <= elementTop)) {
                    
                    const visibleLeft = Math.max(selectionLeft - elementLeft, 0);
                    const visibleRight = Math.min(selectionRight - elementLeft, width);
                    
                    element.style.clipPath = `inset(0 ${width - visibleRight}px 0 ${visibleLeft}px)`;
                    element.style.opacity = '1';
                } else {
                    element.style.opacity = '0';
                }
            });
        }
    }

    // Handle both mouse and touch events
    gridBackground.addEventListener('mousedown', handleSelectionStart);
    gridBackground.addEventListener('touchstart', handleSelectionStart, { passive: false });

    document.addEventListener('mousemove', handleSelectionMove);
    document.addEventListener('touchmove', handleSelectionMove, { passive: false });

    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd, { passive: false });
    document.addEventListener('touchcancel', handleSelectionEnd, { passive: false });

    function handleSelectionStart(e) {
        if (e.target === gridBackground) {
            isSelecting = true;
            // Get coordinates whether it's touch or mouse event
            startCell = getCellCoordinates(e);
            currentCell = startCell;
            rangeHighlight.classList.remove('selection-complete');
            updateSelection(false);
            
            // Prevent default touch behavior and scrolling
            if (e.type === 'touchstart') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    function handleSelectionMove(e) {
        if (isSelecting) {
            // Get coordinates whether it's touch or mouse event
            currentCell = getCellCoordinates(e);
            updateSelection(false);
            
            // Prevent default touch behavior and scrolling
            if (e.type === 'touchmove') {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    function handleSelectionEnd(e) {
        if (isSelecting) {
            isSelecting = false;
            updateSelection(true);
            
            // Prevent any default behavior
            if (e && e.type && e.type.startsWith('touch')) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }

    // Hide highlights when clicking interactive elements
    document.querySelectorAll('.container a, .container button').forEach(element => {
        element.addEventListener('click', () => {
            cellHighlight.style.opacity = '0';
            rangeHighlight.style.opacity = '0';
            rangeHighlight.classList.remove('selection-complete');
        });
    });

    function clearSelection() {
        cellHighlight.style.opacity = '0';
        rangeHighlight.style.opacity = '0';
        rangeHighlight.classList.remove('selection-complete');
        rangeHighlight.classList.remove('multiple-cells');
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSelection();
            isSelecting = false;
        }
    });

    document.querySelectorAll('.container a, .container button').forEach(element => {
        element.addEventListener('click', clearSelection);
    });

    // Add this after the other variable declarations
    let hiddenSentences = [];
    let sentenceLocations = [];

    // Add this before loadAndPlaceSentences function
    let SAFETY_MARGIN = 50; // Make this variable instead of const

    function isValidPosition(x, y, width) {
        const mainContent = document.querySelector('.hero').getBoundingClientRect();
        const contactBox = document.querySelector('.contact-button').getBoundingClientRect();

        // Check window boundaries with reduced margin
        if (x < SAFETY_MARGIN || 
            x + width > window.innerWidth - SAFETY_MARGIN || 
            y < SAFETY_MARGIN || 
            y > window.innerHeight - SAFETY_MARGIN) {
            return false;
        }

        // Check collision with main content
        if (!(y + CELL_HEIGHT < mainContent.top - SAFETY_MARGIN || 
            y > mainContent.bottom + SAFETY_MARGIN ||
            x + width < mainContent.left - SAFETY_MARGIN || 
            x > mainContent.right + SAFETY_MARGIN)) {
            return false;
        }

        // Check collision with contact box
        if (!(y + CELL_HEIGHT < contactBox.top - SAFETY_MARGIN || 
            y > contactBox.bottom + SAFETY_MARGIN ||
            x + width < contactBox.left - SAFETY_MARGIN || 
            x > contactBox.right + SAFETY_MARGIN)) {
            return false;
        }

        // Check collision with other sentences
        for (const loc of sentenceLocations) {
            if (!(y + CELL_HEIGHT < loc.position.y - SAFETY_MARGIN || 
                y > loc.position.y + loc.height + SAFETY_MARGIN ||
                x + width < loc.position.x - SAFETY_MARGIN || 
                x > loc.position.x + loc.width + SAFETY_MARGIN)) {
                return false;
            }
        }

        return true;
    }

    // Load and place sentences
    async function loadAndPlaceSentences() {
        if (!ENABLE_EASTER_EGGS) return;

        try {
            const response = await fetch('easter_eggs_sentences.yml');
            const yamlText = await response.text();
            const data = jsyaml.load(yamlText);
            
            // Randomly select sentences
            const shuffled = data.sentences.sort(() => 0.5 - Math.random());
            const targetCount = Math.floor(Math.random() * (MAX_SENTENCES - MIN_SENTENCES + 1)) + MIN_SENTENCES;
            hiddenSentences = shuffled.slice(0, targetCount);
            
            // Create sentence elements
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            function isOverlapping(x, y, width, existingSentences) {
                for (const loc of existingSentences) {
                    if (!(y + CELL_HEIGHT + SENTENCE_MARGIN < loc.position.y || 
                        y > loc.position.y + loc.height + SENTENCE_MARGIN ||
                        x + width + SENTENCE_MARGIN < loc.position.x || 
                        x > loc.position.x + loc.width + SENTENCE_MARGIN)) {
                        return true;
                    }
                }
                return false;
            }

            hiddenSentences.forEach((sentence) => {
                const sentenceEl = document.createElement('div');
                sentenceEl.className = 'hidden-sentence';
                sentenceEl.textContent = sentence;
                document.body.appendChild(sentenceEl);
                
                // Calculate exact width
                const testEl = document.createElement('span');
                testEl.className = 'hidden-sentence';
                testEl.style.visibility = 'hidden';
                testEl.textContent = sentence;
                document.body.appendChild(testEl);
                const actualWidth = testEl.offsetWidth;
                document.body.removeChild(testEl);

                let position = null;
                let attempts = 0;
                const maxAttempts = 100;

                while (!position && attempts < maxAttempts) {
                    const x = Math.floor(Math.random() * (viewportWidth - actualWidth) / CELL_WIDTH) * CELL_WIDTH;
                    const y = Math.floor(Math.random() * (viewportHeight - CELL_HEIGHT) / CELL_HEIGHT) * CELL_HEIGHT;
                    
                    // Check if this position is in the text lines
                    const currentLine = Math.floor(y / CELL_HEIGHT);
                    if (currentLine >= textLines.startLine && currentLine <= textLines.endLine) {
                        attempts++;
                        continue; // Skip this position
                    }
                    
                    if (!isOverlapping(x, y, actualWidth, sentenceLocations)) {
                        position = { x, y };
                    }
                    attempts++;
                }

                if (position) {
                    sentenceLocations.push({
                        element: sentenceEl,
                        position: position,
                        width: actualWidth,
                        height: CELL_HEIGHT
                    });
                    
                    sentenceEl.style.left = `${position.x}px`;
                    sentenceEl.style.top = `${position.y}px`;
                    sentenceEl.style.width = `${actualWidth}px`;
                } else {
                    document.body.removeChild(sentenceEl);
                }
            });
        } catch (error) {
            console.error('Error loading easter eggs:', error);
        }
    }

    // Initialize sentences
    loadAndPlaceSentences();

    // Add these functions after the clearSelection function
    function moveSelection(direction) {
        // If there was a range selection, reset to single cell
        if (currentCell.x !== startCell.x || currentCell.y !== startCell.y) {
            currentCell = startCell;
            rangeHighlight.classList.remove('multiple-cells');
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Calculate new position based on direction
        let newX = currentCell.x;
        let newY = currentCell.y;
        
        switch (direction) {
            case 'ArrowLeft':
                newX = Math.max(0, currentCell.x - CELL_WIDTH);
                break;
            case 'ArrowRight':
                newX = Math.min(viewportWidth - CELL_WIDTH, currentCell.x + CELL_WIDTH);
                break;
            case 'ArrowUp':
                newY = Math.max(0, currentCell.y - CELL_HEIGHT);
                break;
            case 'ArrowDown':
                newY = Math.min(viewportHeight - CELL_HEIGHT, currentCell.y + CELL_HEIGHT);
                break;
        }
        
        // Only update if position changed
        if (newX !== currentCell.x || newY !== currentCell.y) {
            startCell = { x: newX, y: newY };
            currentCell = { x: newX, y: newY };
            updateSelection(true);
        }
    }

    // Update the keydown event listener
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearSelection();
            isSelecting = false;
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); // Prevent page scrolling
            if (cellHighlight.style.opacity !== '0') { // Only move if there's an active selection
                moveSelection(e.key);
            }
        }
    });
});

async function handleSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        // Show loading state
        const submitBtn = form.querySelector('.submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
        
        // You'll need to set up an email service endpoint
        const response = await fetch('https://your-email-service.com/api/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: 'contact@aloraops.com',
                from: data.email,
                subject: `New contact from ${data.name}`,
                message: data.message
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        // Show success message
        form.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <h3>Thank you for reaching out!</h3>
                <p>We'll get back to you soon.</p>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to send message. Please try again or email us directly at contact@aloraops.com');
    }
    
    return false;
} 
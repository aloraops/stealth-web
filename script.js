document.addEventListener('DOMContentLoaded', function() {
    // Add cursor trail flag
    const ENABLE_CURSOR_TRAIL = false; // Set to true to enable cursor trail

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

    const CELL_WIDTH = 60;
    const CELL_HEIGHT = 25;

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
        
        // Get grid position
        const rect = gridBackground.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        return {
            x: Math.floor(x / CELL_WIDTH) * CELL_WIDTH,
            y: Math.floor(y / CELL_HEIGHT) * CELL_HEIGHT
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
    }

    // Handle both mouse and touch events
    gridBackground.addEventListener('mousedown', handleSelectionStart);
    gridBackground.addEventListener('touchstart', handleSelectionStart);

    document.addEventListener('mousemove', handleSelectionMove);
    document.addEventListener('touchmove', handleSelectionMove);

    document.addEventListener('mouseup', handleSelectionEnd);
    document.addEventListener('touchend', handleSelectionEnd);

    function handleSelectionStart(e) {
        if (e.target === gridBackground) {
            isSelecting = true;
            startCell = getCellCoordinates(e);
            currentCell = startCell;
            rangeHighlight.classList.remove('selection-complete');
            updateSelection(false);
            
            // Prevent default touch behavior
            if (e.type === 'touchstart') {
                e.preventDefault();
            }
        }
    }

    function handleSelectionMove(e) {
        if (isSelecting) {
            currentCell = getCellCoordinates(e);
            updateSelection(false);
            
            // Prevent default touch behavior
            if (e.type === 'touchmove') {
                e.preventDefault();
            }
        }
    }

    function handleSelectionEnd() {
        if (isSelecting) {
            isSelecting = false;
            updateSelection(true);
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
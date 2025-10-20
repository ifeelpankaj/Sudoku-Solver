# Sudoku Solver - Animated Backtracking Visualizer

An interactive Sudoku solver built with React and TypeScript that visualizes the backtracking algorithm in real-time. Watch how the algorithm tries different numbers, backtracks when it hits a dead end, and eventually finds the solution!

## 🎯 Features

- **Interactive 9x9 Grid** - Click any cell to enter numbers
- **Animated Solving** - Watch the backtracking algorithm work step-by-step
- **Instant Solving** - Get solutions immediately without animation
- **Input Validation** - Detects invalid Sudoku puzzles before solving
- **Adjustable Speed** - Control animation speed from 5ms to 200ms
- **Example Puzzles** - Pre-loaded easy, medium, and hard puzzles
- **Export Functionality** - Copy your puzzle to clipboard
- **Abort Control** - Stop the solver mid-execution

## 🚀 Getting Started

### Installation

```bash
# This is a Next.js client component
# Copy the component to your Next.js project

# Make sure you have the required dependencies:
npm install  && npm run dev
```

## 📚 Core Functions

### **Data Types**

#### `Board`

```typescript
type Board = string[][];
```

A 9x9 matrix where each cell contains either:

- A digit `"1"` to `"9"` (as a string)
- A dot `"."` representing an empty cell

---

### **State Management Functions**

#### `emptyBoard()`

```typescript
const emptyBoard = (): Board =>
  Array.from({ length: 9 }, () => Array(9).fill("."));
```

**Purpose:** Creates a blank 9x9 Sudoku board filled with dots.

**Returns:** A new empty board

**Used by:** Initial state setup, Clear button

---

#### `cloneBoard(b: Board)`

```typescript
const cloneBoard = (b: Board) => b.map((row) => [...row]);
```

**Purpose:** Creates a deep copy of the board to avoid mutation

**Parameters:**

- `b` - The board to clone

**Returns:** A new board with copied values

**Why needed:** React requires immutable state updates. This prevents accidental modifications to the original board.

---

### **Validation Functions**

#### `isValid(b: Board, row: number, col: number, ch: string)`

```typescript
function isValid(b: Board, row: number, col: number, ch: string): boolean;
```

**Purpose:** Checks if placing a number at a specific position is valid according to Sudoku rules

**Parameters:**

- `b` - The current board state
- `row` - Row index (0-8)
- `col` - Column index (0-8)
- `ch` - The character/number to validate ("1"-"9")

**Returns:** `true` if the placement is valid, `false` otherwise

**Validation checks:**

1. **Row check:** No duplicate in the same row
2. **Column check:** No duplicate in the same column
3. **3x3 box check:** No duplicate in the same 3x3 subgrid

**Algorithm:**

```typescript
for (let i = 0; i < 9; i++) {
  // Check row
  if (b[row][i] === ch) return false;

  // Check column
  if (b[i][col] === ch) return false;

  // Check 3x3 box
  const drow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
  const dcol = 3 * Math.floor(col / 3) + (i % 3);
  if (b[drow][dcol] === ch) return false;
}
return true;
```

---

#### `validateInitialBoard(b: Board)`

```typescript
function validateInitialBoard(b: Board): { valid: boolean; message: string };
```

**Purpose:** Validates the entire board before solving to catch invalid puzzles

**Parameters:**

- `b` - The board to validate

**Returns:** Object with:

- `valid` - Boolean indicating if board is valid
- `message` - Error message if invalid, empty string if valid

**Checks performed:**

1. **Duplicate detection:** Ensures no duplicates exist in rows, columns, or 3x3 boxes
2. **Empty cells:** Ensures the board has at least one empty cell
3. **Completeness:** Checks if board is already solved

**Example errors:**

- `"Invalid Sudoku: Duplicate 5 at row 1, column 2"`
- `"Board is already complete!"`

---

### **Solving Algorithms**

#### `solveInstant(b: Board)`

```typescript
function solveInstant(b: Board): boolean;
```

**Purpose:** Solves the Sudoku puzzle instantly using backtracking (no animation)

**Parameters:**

- `b` - The board to solve (mutated in place)

**Returns:** `true` if solution found, `false` if unsolvable

**Algorithm (Recursive Backtracking):**

1. Find the first empty cell (`.`)
2. Try digits 1-9 in that cell
3. For each digit:
   - Check if valid using `isValid()`
   - If valid, place it and recursively solve the rest
   - If recursion succeeds, return `true`
   - If recursion fails, backtrack (remove the digit)
4. If no digit works, return `false`
5. If no empty cells remain, puzzle is solved

**Time Complexity:** O(9^m) where m is the number of empty cells

**Example flow:**

```
Find empty cell at (0,0)
Try 1: Valid? Yes → Place it → Recurse
  Find empty cell at (0,1)
  Try 1: Valid? No
  Try 2: Valid? Yes → Place it → Recurse
    ... continue until solution found or backtrack
```

---

#### `solveAnimated(startBoard: Board)`

```typescript
async function solveAnimated(startBoard: Board): Promise<boolean>;
```

**Purpose:** Solves the puzzle with visual animation showing each step

**Parameters:**

- `startBoard` - The initial board state

**Returns:** Promise that resolves to `true` if solved, `false` if unsolvable

**Key differences from `solveInstant`:**

1. **Async/await:** Uses promises for delays
2. **Visual updates:** Updates UI state after each cell change
3. **Highlighting:** Shows which cell is being processed
4. **Abort support:** Checks `runAbortRef` to allow cancellation
5. **Backtrack visualization:** Shows when numbers are removed

**Internal function `recurse()`:**

```typescript
async function recurse(): Promise<boolean> {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (b[i][j] === ".") {
        for (let chCode = 49; chCode <= 57; chCode++) {
          const ch = String.fromCharCode(chCode);

          // Check for abort
          if (runAbortRef.current.abort) return false;

          if (isValid(b, i, j, ch)) {
            // Place number
            b[i][j] = ch;
            setHighlight({ r: i, c: j });
            setBoard(cloneBoard(b));
            await delay(speedMs); // Animation delay

            if (await recurse()) return true;

            // Backtrack (show removal)
            b[i][j] = ".";
            setHighlight({ r: i, c: j });
            setBoard(cloneBoard(b));
            await delay(speedMs);
          }
        }
        return false;
      }
    }
  }
  return true;
}
```

**Visual feedback:**

- Yellow highlight on current cell
- Pulse animation on changes
- Speed controlled by `speedMs` slider

---

### **User Interface Functions**

#### `handleChange(r: number, c: number, value: string)`

```typescript
function handleChange(r: number, c: number, value: string);
```

**Purpose:** Handles user input in grid cells

**Parameters:**

- `r` - Row index
- `c` - Column index
- `value` - Input value from user

**Behavior:**

1. Ignores input if solver is running
2. Filters input to only allow digits 1-9
3. Updates board state
4. Clears any error/success messages

**Input sanitization:**

```typescript
const v = value.replace(/[^1-9]/g, ""); // Remove non-digits
newBoard[r][c] = v === "" ? "." : v;
```

---

#### `resetToInitial()`

```typescript
function resetToInitial();
```

**Purpose:** Restores the board to its state before solving

**Use case:** If you solve a puzzle but want to try again or see the animation again

**Example:**

```
Initial: 53..7....  →  After solving: 534678912
User clicks Reset  →  Back to: 53..7....
```

---

#### `clearBoard()`

```typescript
function clearBoard();
```

**Purpose:** Completely clears the board and resets initial state

**Use case:** Start fresh with a new puzzle

**Difference from Reset:**

- `resetToInitial()` - Goes back to last saved state
- `clearBoard()` - Erases everything

---

#### `onSolveAnimatedClick()`

```typescript
async function onSolveAnimatedClick();
```

**Purpose:** Main handler for the "Solve (Animate)" button

**Process:**

1. Check if already running (ignore if true)
2. Validate the board using `validateInitialBoard()`
3. If invalid, display error and return
4. Save current board as initial state
5. Start animated solving

**Error handling:**

```typescript
const validation = validateInitialBoard(cloneBoard(board));
if (!validation.valid) {
  setError(validation.message);
  return;
}
```

---

#### `onSolveInstantClick()`

```typescript
function onSolveInstantClick();
```

**Purpose:** Handler for "Solve (Instant)" button

**Process:**

1. Validate board
2. Clone board and solve instantly
3. Update UI with result
4. Show success or error message

**When to use:**

- You want the answer quickly
- You don't need to see the algorithm work
- You're testing multiple puzzles rapidly

---

#### `onAbort()`

```typescript
function onAbort();
```

**Purpose:** Stops the animated solver immediately

**Mechanism:**

- Sets `runAbortRef.current.abort = true`
- The `recurse()` function checks this flag on each iteration
- When detected, returns `false` to exit recursion
- Resets UI state and shows "Aborted" message

---

## 🎮 Usage Guide

### **Basic Workflow**

1. **Enter a puzzle:**

   - Click cells and type numbers (1-9)
   - Or load an example puzzle

2. **Solve:**

   - Click "Solve (Animate)" to watch the algorithm
   - Or "Solve (Instant)" for immediate results

3. **Adjust speed:**

   - Use the slider to control animation speed
   - Lower = faster, Higher = slower

4. **Reset/Clear:**
   - "Reset" - Goes back to puzzle before solving
   - "Clear" - Erases everything

### **Example Puzzles**

The app includes 4 pre-loaded puzzles:

1. **Easy** - Good for beginners, ~30 clues
2. **Medium** - Moderate difficulty, ~25 clues
3. **Hard** - Challenging, ~20 clues
4. **Invalid** - Contains duplicate 5s in first row (for testing)

### **Error Messages**

| Error                                            | Meaning                            |
| ------------------------------------------------ | ---------------------------------- |
| `Invalid Sudoku: Duplicate X at row Y, column Z` | Two same numbers in row/column/box |
| `No solution exists for this Sudoku puzzle`      | The puzzle is unsolvable           |
| `Board is already complete!`                     | All cells are filled               |
| `Solving aborted by user`                        | You clicked Abort                  |

---

## 🧠 Algorithm Explained

### **Backtracking Algorithm**

The solver uses a classic backtracking approach:

```
function solve(board):
    1. Find next empty cell
    2. If no empty cell, puzzle is solved! Return true
    3. For each digit 1-9:
        a. Check if digit is valid at this position
        b. If valid:
            - Place digit
            - Recursively solve rest of board
            - If recursion succeeds, return true
            - Else, remove digit (backtrack)
    4. If no digit works, return false
```

### **Why it works:**

1. **Exhaustive search** - Tries all possibilities
2. **Constraint checking** - Only tries valid moves
3. **Backtracking** - Undoes bad decisions
4. **Recursion** - Breaks problem into smaller subproblems

### **Visualization**

The animation shows:

- **Yellow highlight** - Current cell being processed
- **Numbers appearing** - Trying a digit
- **Numbers disappearing** - Backtracking
- **Pulse effect** - Cell is being modified

---

## 🎨 Customization

### **Changing Animation Speed**

```typescript
const [speedMs, setSpeedMs] = useState(40); // Default: 40ms
```

Adjust the range slider:

```typescript
<input type="range" min={5} max={200} />
```

### **Modifying Colors**

The component uses Tailwind classes. Key colors:

- **Prefilled numbers:** `text-gray-900 font-bold`
- **User numbers:** `text-indigo-600`
- **Highlight:** `bg-yellow-200`
- **Grid alternating:** `bg-gray-50` / `bg-white`

### **Adding Custom Examples**

```typescript
<ExampleButton
  title="Your Custom Puzzle"
  difficulty="Custom"
  onLoad={() => {
    const ex = [
      ".........",
      ".........",
      // ... 9 rows total
    ];
    const b = ex.map((row) => row.split(""));
    setBoard(b);
    setInitial(cloneBoard(b));
  }}
/>
```

---

## 🐛 Edge Cases Handled

✅ **Invalid input** - Only accepts 1-9, filters other characters  
✅ **Empty board** - Requires at least one cell to be filled  
✅ **Complete board** - Detects already-solved puzzles  
✅ **Duplicate numbers** - Validates no duplicates in rows/columns/boxes  
✅ **Unsolvable puzzles** - Detects and reports when no solution exists  
✅ **Abort during solving** - Safely stops animation and resets state  
✅ **Multiple rapid clicks** - Disables buttons while solving

---

## 📝 Technical Details

### **State Variables**

| State         | Type      | Purpose                                |
| ------------- | --------- | -------------------------------------- |
| `board`       | `Board`   | Current board state                    |
| `initial`     | `Board`   | Board before solving (for reset)       |
| `running`     | `boolean` | Is solver currently running?           |
| `speedMs`     | `number`  | Animation delay in milliseconds        |
| `highlight`   | `{r,c}`   | Which cell to highlight                |
| `error`       | `string`  | Error message to display               |
| `success`     | `boolean` | Was puzzle solved successfully?        |
| `runAbortRef` | `ref`     | Abort flag (doesn't trigger re-render) |

### **Why use `ref` for abort?**

```typescript
const runAbortRef = useRef({ abort: false });
```

Using `useRef` instead of `useState` for abort because:

1. **No re-renders needed** - Just a flag
2. **Immediate updates** - No async state batching
3. **Accessible in recursion** - Same reference throughout

---

## 🔧 Troubleshooting

**Q: Animation is too fast/slow**  
A: Adjust the speed slider (5-200ms range)

**Q: "No solution exists" but puzzle is valid**  
A: This shouldn't happen. Please verify all numbers are correct.

**Q: Cell won't accept input**  
A: Make sure solver isn't running (no "Solving..." text)

**Q: Export doesn't work**  
A: Browser must support `navigator.clipboard` API (all modern browsers do)

---

## 🚀 Performance

- **Instant solving:** < 100ms for most puzzles
- **Animated solving:** Depends on speed setting and puzzle difficulty
- **Memory:** Minimal - only stores two 9x9 boards
- **Optimization:** Early termination on invalid moves

---

## 📄 License

Free to use and modify for personal and commercial projects.

---

## 🤝 Contributing

Feel free to:

- Add more example puzzles
- Improve the algorithm
- Enhance the UI
- Add difficulty ratings
- Implement puzzle generation

---

## 📧 Support

For bugs or questions, create an issue or contact the developer.

---

**Happy Solving! 🎉**

// =========================================================================
// 1. GLOBAL STATE (THE DATA OF OUR APP)
// =========================================================================
// This object acts as the single source of truth for all of our data.
// It tracks our notebooks, which notebook is open, and which tab is visible.
let state = {
    notebooks: [],             // Array to hold notebook objects: { id, name, notes, tasks: [] }
    selectedNotebookId: null,  // Tracks which notebook's details are open on the right side
    activeTab: 'notes'         // Tracks which tab is active: 'notes', 'canvas', or 'tasks'
};

// =========================================================================
// 2. DOM ELEMENT SELECTORS
// =========================================================================
// Here we fetch references to the HTML elements so we can dynamically edit them.
const addNotebookBtn = document.getElementById("addnotebook");
const notebooksListContainer = document.getElementById("subbook");
const workspaceSection = document.getElementById("workspace");
const emptyStateSection = document.getElementById("empty-state");
const notebookTitleInput = document.getElementById("notebook-title-input");
const notesTextarea = document.getElementById("notes-textarea");
const tabButtons = document.querySelectorAll(".tab-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const newTaskInput = document.getElementById("new-task-input");
const addTaskBtn = document.getElementById("add-task-btn");
const incompleteTasksList = document.getElementById("incomplete-tasks-list");
const completedTasksList = document.getElementById("completed-tasks-list");
const incompleteCountSpan = document.getElementById("incomplete-count");
const completedCountSpan = document.getElementById("completed-count");

// =========================================================================
// 3. STORAGE FUNCTIONS (SAVING & LOADING DATA)
// =========================================================================

// Loads data from the browser's local storage so info doesn't disappear when refreshed
function loadStateFromStorage() {
    const savedData = localStorage.getItem('notebook_state');
    if (savedData) {
        try {
            state = JSON.parse(savedData);
        } catch (error) {
            console.error('Could not load existing notebooks:', error);
        }
    }
}

// Saves our state object to browser storage in string format
function saveStateToStorage() {
    localStorage.setItem('notebook_state', JSON.stringify(state));
}

// =========================================================================
// 4. NOTEBOOK HANDLERS (CREATE, RENDER, SELECT, DELETE, RENAME)
// =========================================================================

// Creates a new notebook and opens it automatically when '+ New Notebook' is clicked
function createNewNotebook() {
    // Generate a unique notebook ID using the current timestamp
    const uniqueId = "notebook_" + Date.now();
    
    // Setup a new notebook object
    const newNotebook = {
        id: uniqueId,
        name: "Notebook " + (state.notebooks.length + 1), // Default name (e.g. Notebook 1)
        notes: "", // Empty notes content
        tasks: []  // Empty task list
    };
    
    // Add it to our global array of notebooks
    state.notebooks.push(newNotebook);
    
    // Set this newly created notebook as selected
    state.selectedNotebookId = uniqueId;
    
    // Save to storage and refresh the screen layout
    saveStateToStorage();
    renderNotebooksSidebar();
    openNotebook(uniqueId);
}

// Renders the list of notebooks inside the left sidebar list
function renderNotebooksSidebar() {
    // Clear whatever elements are currently inside the container
    notebooksListContainer.innerHTML = "";
    
    // Loop through each notebook in the list and draw its HTML representation
    for (let i = 0; i < state.notebooks.length; i++) {
        const notebook = state.notebooks[i];
        
        // Create the notebook card/container element
        const itemDiv = document.createElement("div");
        itemDiv.classList.add("notebook-item");
        
        // Highlight this item if it's the currently opened notebook
        if (notebook.id === state.selectedNotebookId) {
            itemDiv.classList.add("active");
        }
        
        // Create a text title label
        const titleSpan = document.createElement("span");
        titleSpan.classList.add("notebook-item-title");
        titleSpan.textContent = notebook.name;
        
        // Create a delete (×) button
        const deleteButton = document.createElement("button");
        deleteButton.classList.add("delete-btn");
        deleteButton.textContent = "×";
        deleteButton.title = "Delete notebook";
        
        // Add click listener to the delete button
        deleteButton.addEventListener("click", function(event) {
            event.stopPropagation(); // Prevents clicking the delete button from opening the notebook
            deleteNotebook(notebook.id);
        });
        
        // Add click listener to open this notebook when the card is clicked
        itemDiv.addEventListener("click", function() {
            openNotebook(notebook.id);
        });
        
        // Assemble elements and append them to sidebar container
        itemDiv.appendChild(titleSpan);
        itemDiv.appendChild(deleteButton);
        notebooksListContainer.appendChild(itemDiv);
    }
}

// Opens details of a selected notebook on the right pane
function openNotebook(notebookId) {
    state.selectedNotebookId = notebookId;
    saveStateToStorage();
    
    // Update active highlight classes in the sidebar DOM manually
    const notebookItems = notebooksListContainer.querySelectorAll(".notebook-item");
    for (let i = 0; i < state.notebooks.length; i++) {
        const itemElement = notebookItems[i];
        if (itemElement) {
            if (state.notebooks[i].id === notebookId) {
                itemElement.classList.add("active");
            } else {
                itemElement.classList.remove("active");
            }
        }
    }
    
    // Find the notebook object details using a simple for loop
    let currentNotebook = null;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === notebookId) {
            currentNotebook = state.notebooks[i];
            break;
        }
    }
    
    // If the notebook exists, show the workspace. Otherwise, show the empty dashboard screen
    if (currentNotebook) {
        workspaceSection.style.display = "flex";
        emptyStateSection.style.display = "none";
        
        // Populate inputs with details
        notebookTitleInput.value = currentNotebook.name;
        notesTextarea.value = currentNotebook.notes;
        
        // Display the selected tab pane
        changeTab(state.activeTab);
        
        // Draw tasks list
        renderTaskList(currentNotebook);
    } else {
        workspaceSection.style.display = "none";
        emptyStateSection.style.display = "flex";
    }
}

// Deletes a notebook by its unique ID
function deleteNotebook(notebookId) {
    // Show confirmation dialog before deleting
    const confirmDelete = confirm("Are you sure you want to delete this notebook? All notes and tasks will be lost.");
    if (!confirmDelete) {
        return; // Exit if the user clicked cancel
    }
    
    // Find index of the target notebook
    let targetIndex = -1;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === notebookId) {
            targetIndex = i;
            break;
        }
    }
    
    // Remove the notebook from our array
    if (targetIndex !== -1) {
        state.notebooks.splice(targetIndex, 1);
        
        // If we deleted the active notebook, select another one or fallback to empty state
        if (state.selectedNotebookId === notebookId) {
            if (state.notebooks.length > 0) {
                // Select first notebook
                state.selectedNotebookId = state.notebooks[0].id;
            } else {
                state.selectedNotebookId = null;
            }
        }
        
        // Save database & redraw sidebar list
        saveStateToStorage();
        renderNotebooksSidebar();
        
        if (state.selectedNotebookId !== null) {
            openNotebook(state.selectedNotebookId);
        } else {
            workspaceSection.style.display = "none";
            emptyStateSection.style.display = "flex";
        }
    }
}

// Updates the name of the notebook as the user is typing it in real-time
notebookTitleInput.addEventListener("input", function(event) {
    let activeNotebook = null;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === state.selectedNotebookId) {
            activeNotebook = state.notebooks[i];
            break;
        }
    }
    
    if (activeNotebook) {
        activeNotebook.name = event.target.value;
        saveStateToStorage();
        
        // Sync the title label in the sidebar directly so the user doesn't lose text cursor focus
        const sidebarTitleElement = notebooksListContainer.querySelector(".notebook-item.active .notebook-item-title");
        if (sidebarTitleElement) {
            sidebarTitleElement.textContent = event.target.value || "Untitled Notebook";
        }
    }
});

// Saves Notes content automatically as user is writing
notesTextarea.addEventListener("input", function(event) {
    let activeNotebook = null;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === state.selectedNotebookId) {
            activeNotebook = state.notebooks[i];
            break;
        }
    }
    
    if (activeNotebook) {
        activeNotebook.notes = event.target.value;
        saveStateToStorage();
    }
});

// =========================================================================
// 5. TABS MANAGER (SWITCHING ACTIVE VIEWS)
// =========================================================================

// Activates the selected tab panel (Notes, Canvas, or Tasks)
function changeTab(tabName) {
    state.activeTab = tabName;
    saveStateToStorage();
    
    // Toggle active style on navigation buttons
    tabButtons.forEach(function(btn) {
        if (btn.getAttribute("data-tab") === tabName) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    
    // Show only the tab panel corresponding to our selection
    tabPanels.forEach(function(panel) {
        if (panel.id === "tab-" + tabName) {
            panel.classList.add("active");
        } else {
            panel.classList.remove("active");
        }
    });
}

// Setup event listeners on each tab button
function setupTabEvents() {
    tabButtons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            const selectedTab = btn.getAttribute("data-tab");
            changeTab(selectedTab);
        });
    });
}

// =========================================================================
// 6. TASK CHECKLIST HANDLERS (ADD, RENDER, TOGGLE, DELETE)
// =========================================================================

// Redraws the task checklists into complete and incomplete columns
function renderTaskList(notebook) {
    // Clear list boxes
    incompleteTasksList.innerHTML = "";
    completedTasksList.innerHTML = "";
    
    let incompleteCount = 0;
    let completedCount = 0;
    
    // Safeguard in case the notebook has no tasks array initialized
    if (!notebook.tasks) {
        notebook.tasks = [];
    }
    
    // Loop through all tasks and render their DOM nodes
    for (let i = 0; i < notebook.tasks.length; i++) {
        const task = notebook.tasks[i];
        
        // List item container
        const li = document.createElement("li");
        li.classList.add("task-item");
        
        // Left side block (checkbox + text description)
        const leftDiv = document.createElement("div");
        leftDiv.classList.add("task-item-left");
        
        // Visual checkbox node
        const checkboxDiv = document.createElement("div");
        checkboxDiv.classList.add("task-checkbox");
        
        // Task text label node
        const textSpan = document.createElement("span");
        textSpan.classList.add("task-text");
        textSpan.textContent = task.text;
        
        leftDiv.appendChild(checkboxDiv);
        leftDiv.appendChild(textSpan);
        
        // Delete task button node (represented by "×" symbol)
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("delete-task-btn");
        deleteBtn.innerHTML = "&times;";
        deleteBtn.title = "Delete task";
        
        // Setup delete task trigger
        deleteBtn.addEventListener("click", function(event) {
            event.stopPropagation(); // Prevents checkbox toggle on click
            removeTaskFromNotebook(notebook, task.id);
        });
        
        // Setup checkbox toggler trigger
        leftDiv.addEventListener("click", function() {
            task.completed = !task.completed; // Flip task status (true/false)
            saveStateToStorage();
            renderTaskList(notebook); // Re-draw list to move task into correct list
        });
        
        li.appendChild(leftDiv);
        li.appendChild(deleteBtn);
        
        // Distribute to the appropriate completed/incomplete container
        if (task.completed) {
            li.classList.add("completed");
            completedTasksList.appendChild(li);
            completedCount++;
        } else {
            incompleteTasksList.appendChild(li);
            incompleteCount++;
        }
    }
    
    // Update badge count numbers
    incompleteCountSpan.textContent = incompleteCount;
    completedCountSpan.textContent = completedCount;
}

// Adds a new task to the selected notebook
function addNewTask() {
    const taskText = newTaskInput.value.trim();
    if (taskText === "") {
        return; // Don't allow empty tasks
    }
    
    // Find active notebook details
    let activeNotebook = null;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === state.selectedNotebookId) {
            activeNotebook = state.notebooks[i];
            break;
        }
    }
    
    if (activeNotebook) {
        if (!activeNotebook.tasks) {
            activeNotebook.tasks = [];
        }
        
        // Create new task object
        const newTask = {
            id: "task_" + Date.now(),
            text: taskText,
            completed: false
        };
        
        activeNotebook.tasks.push(newTask);
        saveStateToStorage();
        
        // Clear task input field and refresh task pane
        newTaskInput.value = "";
        renderTaskList(activeNotebook);
    }
}

// Removes a single task from a notebook array
function removeTaskFromNotebook(notebook, taskId) {
    let targetIndex = -1;
    for (let i = 0; i < notebook.tasks.length; i++) {
        if (notebook.tasks[i].id === taskId) {
            targetIndex = i;
            break;
        }
    }
    
    if (targetIndex !== -1) {
        notebook.tasks.splice(targetIndex, 1);
        saveStateToStorage();
        renderTaskList(notebook);
    }
}

// Add task when clicking 'Add Task' button
addTaskBtn.addEventListener("click", addNewTask);

// Add task when hitting the 'Enter' key inside the input box
newTaskInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        addNewTask();
    }
});

// Trigger create notebook when '+ notebook' button is clicked
addNotebookBtn.addEventListener("click", createNewNotebook);

// =========================================================================
// 7. APPLICATION BOOTSTRAPPER (ON LOADING THE PAGE)
// =========================================================================
function initializeApp() {
    // 1. Load data from local storage
    loadStateFromStorage();
    
    // 2. Bind tab navigation clicks
    setupTabEvents();
    
    // 3. Draw sidebar notebooks list
    renderNotebooksSidebar();
    
    // 4. Open the active notebook or fall back to first notebook / empty page
    let activeExists = false;
    for (let i = 0; i < state.notebooks.length; i++) {
        if (state.notebooks[i].id === state.selectedNotebookId) {
            activeExists = true;
            break;
        }
    }
    
    if (state.selectedNotebookId && activeExists) {
        openNotebook(state.selectedNotebookId);
    } else if (state.notebooks.length > 0) {
        // Open the first notebook by default
        openNotebook(state.notebooks[0].id);
    } else {
        // No notebooks available, display the empty state page
        workspaceSection.style.display = "none";
        emptyStateSection.style.display = "flex";
    }
}

// Run bootstrapper
initializeApp();
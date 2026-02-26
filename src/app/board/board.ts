import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router'; //  Import Router

imports: [
  DragDropModule
]

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css']
})
export class BoardComponent implements OnInit{

  currentUser: any;

  searchText = '';
  selectedPriority: string = 'All'; // New variable for the filter

  tasks: any[] = [];

  showModal = false;
  isEditMode = false;
  editTaskRef: any = null;
  currentColumnStatus = 'todo'; // Tracks which column we are adding to
 
  // Notification and Confirmation states
  notification = { message: '', show: false, type: 'success' };
  showDeleteTaskModal = false;
  taskToDelete: any = null;
  private toastTimer: any;

  // --- NEW MODAL CONTROLS ---
  showColModal = false;
  showDeleteColModal = false;
  newColumnName = '';
  colToDeleteIndex: number | null = null;

  //  DYNAMIC COLUMNS ARRAY
  columns = [
    { id: 'todoList', title: 'To Do', status: 'todo' , canAddTask: true },
    { id: 'progressList', title: 'In Progress', status: 'progress' , canAddTask: false },
    { id: 'doneList', title: 'Done', status: 'done' , canAddTask: false }
  ];

  newTask = {
    title: '',
    description: '',
    priority: 'Medium',
    status: 'todo',
    createdAt: new Date(),
    deadline: '' // Will hold the user input date
  };
 
  constructor(private router: Router) {}

  ngOnInit() {
    const data = localStorage.getItem('currentUser');
    if (data) {
      this.currentUser = JSON.parse(data);
    }
    this.loadFromLocalStorage();
  }

  // --- LOCAL STORAGE LOGIC ---
  saveToLocalStorage() {
    const data = {
       tasks: this.tasks,
        columns: this.columns 
      };
    localStorage.setItem('agileDriftData', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem('agileDriftData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      this.tasks = parsed.tasks || [];
      this.columns = parsed.columns || this.columns;
      // Convert date strings back to objects
      this.tasks.forEach(t => t.createdAt = new Date(t.createdAt));
      this.sortTasks();
    }
  }

  // --- UPDATED COLUMN MANAGEMENT (CUSTOM MODALS) ---
  openColModal() {
    this.newColumnName = '';
    this.showColModal = true;
  }

  confirmAddColumn() {
    if (this.newColumnName.trim()) {
      const statusValue = this.newColumnName.toLowerCase().replace(/\s/g, '-');
      this.columns.push({
        id: `${statusValue}List`,
        title: this.newColumnName,
        status: statusValue,
        canAddTask: false
      });
      this.saveToLocalStorage();
      this.showToast(`Column "${this.newColumnName}" created!`);
      this.showColModal = false;
    }
  }

  triggerDeleteCol(index: number) {
    if (this.columns[index].status === 'todo')
      return;
    
    this.colToDeleteIndex = index;
    this.showDeleteColModal = true;
  }

  confirmDeleteColumn() {
     if (this.colToDeleteIndex !== null) {
       // 1. Capture the name first
       const colName = this.columns[this.colToDeleteIndex].title;
    
       // 2. Delete the column
       this.columns.splice(this.colToDeleteIndex, 1);
       this.saveToLocalStorage();
    
       // 3. Show the dynamic toast with the emoji
       this.showToast(`Column "${colName}" Deleted`, 'error');
    
       this.closeDeleteModal();
    }
  }

  closeDeleteModal() {
    this.showDeleteColModal = false;
    this.showDeleteTaskModal = false; // Reset both here
    this.colToDeleteIndex = null;
    this.taskToDelete = null;
  }

   getEmptyStateIcon(status: string): string {
    switch (status) {
       case 'todo': return '📝';      // Notepad for To Do
       case 'progress': return '⚡';  // Lightning for In Progress
       case 'done': return '✅';      // Checkmark for Done
       case 'delivered': return '🚀';  // Rocket for Delivered
       default: return '📂';          // Default folder icon
    }
  }
 
  // ADD THIS METHOD INSIDE THE CLASS
  isOverdue(deadline: string): boolean {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison
    return new Date(deadline) <= today;
  }

  //  UPDATED FILTER (Still used by the HTML loop)
  filterTasks(status: string) {
    return this.tasks.filter(t => {
      // 1. Check Status
      const matchStatus = t.status === status;

      // 2. Check Search Text
      const searchTextLower = this.searchText.toLowerCase();
      const matchSearch = t.title.toLowerCase().includes(searchTextLower) ||
                        (t.description ?? '').toLowerCase().includes(searchTextLower);
      // 3. Check Priority Filter
      const matchPriority = this.selectedPriority === 'All' || t.priority === this.selectedPriority;

      return matchStatus && matchSearch && matchPriority;
    });
  }

  //  GET ALL COLUMN IDs (For Drag & Drop connection)
  get connectedTo(): string[] {
    return this.columns.map(col => col.id);
  }

  // --- NOTIFICATION SYSTEM ---
  showToast(msg: string, type: 'success' | 'info' | 'error' = 'success') {
    if (this.toastTimer) {
       clearTimeout(this.toastTimer);
    }

    // Set the notification
    this.notification = { message: msg, show: true, type };

    this.toastTimer = setTimeout(() => {
      // We update the object reference to trigger Angular's UI refresh
      if (this.notification.show) {
      this.notification.show = false;
    }
    }, 2000);
  }

  // ---------- MODAL ----------
  openAddModal(status: string = 'todo') {
    this.isEditMode = false;
    this.currentColumnStatus = status; // Set the status based on the column button clicked
    this.newTask = {
      title: '',
      description: '',
      priority: 'Medium',
      status: status ,
      createdAt: new Date(),
      deadline: '' // Will hold the user input date
    };
    this.showModal = true;
  }

  openEditModal(task: any) {
    this.isEditMode = true;
    this.editTaskRef = task;
    this.newTask = { ...task };
    this.showModal = true;
  }


  saveTask() {
    if (!this.newTask.title.trim()) return;
    
    const isEditing = this.isEditMode;
    if (isEditing && this.editTaskRef) {
      Object.assign(this.editTaskRef, this.newTask);
      this.showToast("Task updated successfully!", 'info');
    } else {
      this.tasks.push({ ...this.newTask, createdAt: new Date() });
      this.showToast("New task added!");
    }

    this.sortTasks();
    this.saveToLocalStorage();
    this.closeModal();
  }

  // Task Delete Confirmation logic
  triggerDeleteTask(task: any) {
    this.taskToDelete = task;
    this.showDeleteTaskModal = true;
  }

  confirmDeleteTask() {
    if (this.taskToDelete) {
      this.tasks = this.tasks.filter(t => t !== this.taskToDelete);
      this.sortTasks(); // ✅ Ensure list remains ordered after deletion
      this.saveToLocalStorage();
      this.showToast("Task  deleted", 'error');
    }
    this.showDeleteTaskModal = false;
    this.taskToDelete = null;
  }

  closeModal() {
    this.showModal = false;
  }

  // ---------- DRAG & DROP ----------
  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    // data[index] gives us the task object even from a filtered list
    const task = event.previousContainer.data[event.previousIndex];
    if (task) {
        task.status = newStatus;
        this.saveToLocalStorage();
    }
    this.sortTasks();
  }


  // ---------- PRIORITY SORT ----------
  sortTasks() {
  const priorityOrder: any = { High: 1, Medium: 2, Low: 3 };

  this.tasks.sort((a, b) => {
      // 1. Sort by Priority
     if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
       return priorityOrder[a.priority] - priorityOrder[b.priority];
     }

     // 2. Sort by Deadline (if priority is the same)
     if (a.deadline && b.deadline) {
       return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
     }

     // 3. Sort by Creation Date (if deadline is also same or missing)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
     });
  }


  logout() {
    localStorage.removeItem('currentUser'); // Clear the session
    this.router.navigate(['/']);            // Go back to login
  }
  
}

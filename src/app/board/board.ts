import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router'; //  Import Router
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css']
})
export class BoardComponent implements OnInit{

  currentUser: any;
  showAccountMenu = false;
  showEditProfileModal = false; // Toggle for the Manage modal
  
  // Clone of current user to avoid direct binding during edits
  editingUser = { username: '', email: '', phone: '' };

  searchText = '';
  selectedPriority: string = 'All'; // New variable for the filter

  tasks: any[] = [];

  showModal = false;
  isEditMode = false;
  editTaskRef: any = null;
  currentColumnStatus = 'todo'; // Tracks which column we are adding to
  minDate: string;

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
 
  constructor(private router: Router, private http: HttpClient) {
    // New Date logic added here
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
    
    console.log("Min Date Set to:", this.minDate); // Helpful for debugging
  }


  ngOnInit() {
    const session = localStorage.getItem('currentUser');
    if (session) {
      this.currentUser = JSON.parse(session);
    }
    this.loadFromLocalStorage();
  }

  //  ADD ACCOUNT LOGIC
  goToRegister() {
    this.showAccountMenu = false;
    // Redirects to auth page; since isLoginMode will be false, it shows Register
    this.router.navigate(['/auth']); 
  }

  //  MANAGE PROFILE LOGIC
  openManageProfile() {
    this.editingUser = { ...this.currentUser }; // Create a shallow copy
    this.showEditProfileModal = true;
    this.showAccountMenu = false;
  }

  saveProfileUpdate() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const index = users.findIndex((u: any) => u.email === this.currentUser.email);

    if (index !== -1) {
      // Update the user in the main storage
      users[index] = { ...users[index], ...this.editingUser };
      localStorage.setItem('users', JSON.stringify(users));
      
      // Update the current session
      this.currentUser = users[index];
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      this.showEditProfileModal = false;
      alert("Profile updated successfully!");
    }
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
      const newCol = {
        id: `${statusValue}List`,
        title: this.newColumnName,
        status: statusValue,
        canAddTask: false
      };

      // Mock API Call for Adding Column
      this.http.post('/api/columns', newCol).subscribe(() => {
        this.columns.push(newCol);
        this.saveToLocalStorage();
        this.showToast(`Column "${this.newColumnName}" create! `);
        this.showColModal = false;
      });
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
      const targetCol = this.columns[this.colToDeleteIndex];
    
      // Mock API Call for Deleting Column
      this.http.delete(`/api/columns/${targetCol.id}`).subscribe(() => {
        this.columns.splice(this.colToDeleteIndex!, 1);
        this.saveToLocalStorage();
        this.showToast(`Column "${targetCol.title}" Deleted `, );
        this.closeDeleteModal();
      });
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


  saveTask(form: NgForm) {
    if (form.valid) {
      // Decide URL: POST for new tasks, PUT for updates
      const url = this.isEditMode ? '/api/tasks/update' : '/api/tasks/add';

      // This triggers the Network tab entry
      this.http.post(url, this.newTask).subscribe({
        next: (resp) => {
          console.log('Network Tab should show:', url);
          if (this.isEditMode && this.editTaskRef) {
            // Object.assign updates the reference in the original array
            Object.assign(this.editTaskRef, this.newTask);
            this.showToast("Task updated successfully!", 'info');
          } else {
            // Add new task with a unique ID for the delete logic to work
            this.tasks.push({ 
              ...this.newTask, 
              id: Date.now(), 
              createdAt: new Date() 
            });
            this.showToast("New task added!");
          }

          this.finalizeTaskSave();
          form.resetForm();
        },
        error: () => this.showToast("Network Error", 'error')
      });
    } else {
      form.control.markAllAsTouched();
      this.showToast("Please fill in all fields!", 'error');
    }
  }

  private finalizeTaskSave() {
    this.sortTasks();
    this.saveToLocalStorage();
    this.closeModal(); // Ensure the modal actually closes
  }

  // Task Delete Confirmation logic
  triggerDeleteTask(task: any) {
    this.taskToDelete = task;
    this.showDeleteTaskModal = true;
  }

  confirmDeleteTask() {
    if (this.taskToDelete) {
      // Mock API Call for Deleting Task
      // Assuming task has a unique ID, otherwise we use the title for the mock URL
      const taskId = this.taskToDelete.id || this.taskToDelete.title.replace(/\s/g, '');
    
      this.http.delete(`/api/tasks/${taskId}`).subscribe(() => {
        this.tasks = this.tasks.filter(t => t !== this.taskToDelete);
        this.sortTasks();
        this.saveToLocalStorage();
        this.showToast("Task Deleted .");
        this.showDeleteTaskModal = false;
        this.taskToDelete = null;
      });
    }
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

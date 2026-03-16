import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Router } from '@angular/router';
//import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './board.html',
  styleUrls: ['./board.css']
})
export class BoardComponent implements OnInit {

  currentUser: any;
  showAccountMenu = false;
  showEditProfileModal = false;
  
  editingUser = { username: '', email: '', phone: '' };
  passwordData = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  isPasswordVisible: boolean = false;
  searchText = '';
  selectedPriority: string = 'All';

  tasks: any[] = [];
  showModal = false;
  isEditMode = false;
  editTaskRef: any = null;
  currentColumnStatus = 'todo';
  minDate: string;

  notification = { message: '', show: false, type: 'success' };
  showDeleteTaskModal = false;
  taskToDelete: any = null;
  private toastTimer: any;

  showColModal = false;
  showDeleteColModal = false;
  newColumnName = '';
  colToDeleteIndex: number | null = null;

  columns = [
    { id: 'todoList', title: 'To Do', status: 'todo' , canAddTask: true },
    { id: 'progressList', title: 'In Progress', status: 'progress' , canAddTask: false },
    { id: 'doneList', title: 'Done', status: 'done' , canAddTask: false }
  ];

  newTask = {
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    createdAt: new Date(),
    deadline: '',
    progress: 0
  };
 
  constructor(private router: Router) {
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    const session = localStorage.getItem('currentUser');
    if (session) {
      this.currentUser = JSON.parse(session);
    }
    this.loadFromLocalStorage();
  }

  saveToLocalStorage() {
    const data = { tasks: this.tasks, columns: this.columns };
    localStorage.setItem('agileDriftData', JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const savedData = localStorage.getItem('agileDriftData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      this.tasks = parsed.tasks || [];
      this.columns = parsed.columns || this.columns;
      this.tasks.forEach(t => {
        t.createdAt = new Date(t.createdAt);
        if (t.progress === undefined) t.progress = 0; // Ensure old tasks get progress field
      });
      this.sortTasks();
    }
  }

  // --- DASHBOARD CALCULATIONS ---
  get totalTasksCount(): number {
    return this.tasks.length;
  }

  get completedTasksCount(): number {
    // Tasks are "completed" if progress is 100% or they are in 'done'/'delivered'
    return this.tasks.filter(t => t.progress === 100 || t.status === 'done' || t.status === 'delivered').length;
  }

  get projectCompletionPercentage(): number {
    if (this.totalTasksCount === 0) return 0;
    return Math.round((this.completedTasksCount / this.totalTasksCount) * 100);
  }

  getTasksCountByStatus(status: string): number {
    return this.tasks.filter(t => t.status === status).length;
  }

  // Method for manual progress changes
  onProgressChange(task: any) {
    if (task.progress > 100) task.progress = 100;
    if (task.progress < 0 || task.progress === null) task.progress = 0;
    
    // Automatically move to Done if 100% (Optional logic)
    if (task.progress === 100 && task.status !== 'done') {
       this.updateTaskStatus(task, 'done');
    }

    this.saveToLocalStorage();
  }

  // Calculate Column Percentage based on tasks within it
  getColumnProgress(status: string): number {
    const columnTasks = this.tasks.filter(t => t.status === status);
    if (columnTasks.length === 0) return 0;
    const totalProgress = columnTasks.reduce((acc, task) => acc + (task.progress || 0), 0);
    return Math.round(totalProgress / columnTasks.length);
  }

  private updateTaskStatus(task: any, newStatus: string) {
    task.status = newStatus;

      this.saveToLocalStorage();
      this.showToast(`Task completed! Moved to Done.`);
  }

  goToRegister() {
    this.showAccountMenu = false;
    this.router.navigate(['/auth']); 
  }

  openManageProfile() {
    this.editingUser = { ...this.currentUser };
    this.showEditProfileModal = true;
    this.showAccountMenu = false;
  }

  saveProfileUpdate() {
    // Password Validation Check
    if (this.passwordData.newPassword || this.passwordData.confirmPassword) {
      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.showToast("New passwords do not match!", "error");
        return;
      }
      // Note: In a real app, you'd send this.passwordData.oldPassword to your API here
    }

    // Existing Profile Update Logic
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const index = users.findIndex((u: any) => u.email === currentUser.email);
    
    if (index !== -1) {
      // Update local storage with new username/password
      users[index] = { 
        ...users[index], 
        username: this.editingUser.username 
      };
    
      // Only update password in storage if a new one was provided
      if (this.passwordData.newPassword) {
        users[index].password = this.passwordData.newPassword; 
      }

      localStorage.setItem('users', JSON.stringify(users));
      this.currentUser = users[index];
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    
      // Reset Password Fields & Close
      this.resetPasswordFields();
      this.showEditProfileModal = false;
      this.showToast("Profile updated successfully!");
    }
  }

  // Add this helper method to keep things clean
  resetPasswordFields(){

    this.passwordData={
      oldPassword:'',
      newPassword:'',
      confirmPassword:''
    };

  }

  // Add this method to toggle the state
  togglePasswordVisibility() {
    this.isPasswordVisible = !this.isPasswordVisible;
  }


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

      this.columns.push(newCol);

      this.saveToLocalStorage();

      this.showToast(`Column "${this.newColumnName}" created`);

      this.showColModal=false;
    }
  }

  triggerDeleteCol(index: number) {
    if (this.columns[index].status === 'todo') return;
    this.colToDeleteIndex = index;
    this.showDeleteColModal = true;
  }

  confirmDeleteColumn() {
     if(this.colToDeleteIndex!==null){

      const col=this.columns[this.colToDeleteIndex];

      this.columns.splice(this.colToDeleteIndex,1);

      this.tasks=this.tasks.filter(t=>t.status!==col.status);

      this.saveToLocalStorage();

      this.showToast("Column deleted");

      this.colToDeleteIndex=null;

      this.showDeleteColModal=false;

    }
  }

  closeDeleteModal() {
    this.showDeleteColModal = false;
    this.showDeleteTaskModal = false;
    this.colToDeleteIndex = null;
    this.taskToDelete = null;
  }

  getEmptyStateIcon(status: string): string {
    switch (status) {
      case 'todo': return '📝';
      case 'progress': return '⚡';
      case 'done': return '✅';
      case 'delivered': return '🚀';
      default: return '📂';
    }
  }
 
  isOverdue(deadline: string): boolean {
    if (!deadline) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(deadline) <= today;
  }

  getFilteredTasksByStatus(status: string) {
    return this.tasks.filter(t => {
      const matchStatus = t.status === status;
      const searchTextLower = this.searchText.toLowerCase();
      const matchSearch = t.title.toLowerCase().includes(searchTextLower) ||
                        (t.description ?? '').toLowerCase().includes(searchTextLower);
      const matchPriority = this.selectedPriority === 'All' || t.priority === this.selectedPriority;
      return matchStatus && matchSearch && matchPriority;
    });
  }

  get connectedTo(): string[] {
    return this.columns.map(col => col.id);
  }

  showToast(msg:string,type:'success'|'info'|'error'='success'){

    if(this.toastTimer) clearTimeout(this.toastTimer);

    this.notification={message:msg,show:true,type};

    this.toastTimer=setTimeout(()=>{
      this.notification.show=false;
    },2000);

  }

  openAddModal(status: string = 'todo') {
    this.isEditMode = false;
    this.currentColumnStatus = status;
    this.newTask = {
      title: '',
      description: '',
      priority: 'Medium',
      status: status ,
      createdAt: new Date(),
      deadline: '',
      progress: 0
    };
    this.showModal = true;
  }

  openEditModal(task: any) {
    this.isEditMode = true;
    this.editTaskRef = task;
    this.newTask = { ...task };
    this.showModal = true;
  }

  closeEditModal() {
    this.showEditProfileModal = false;
    this.resetPasswordFields();
  }

  saveTask(form: NgForm) {
     if(!form.valid){
      form.control.markAllAsTouched();
      return;
    }

    if(this.isEditMode && this.editTaskRef){

      Object.assign(this.editTaskRef,this.newTask);
      this.showToast("Task updated","info");
    } 
    else 
    {
      this.tasks.push({ 
      ...this.newTask, 
      id: Date.now(), 
      createdAt: new Date() 
      });
      this.showToast("New task added!");
    }
    this.sortTasks();

    this.saveToLocalStorage();

    this.showModal=false;

    form.resetForm();

  }

  finalizeTaskSave(){
    this.sortTasks();
    this.saveToLocalStorage();
    this.showModal=false;
  }

  triggerDeleteTask(task: any) {
    this.taskToDelete = task;
    this.showDeleteTaskModal = true;
  }

  confirmDeleteTask() {
     if(this.taskToDelete){

      this.tasks=this.tasks.filter(t=>t!==this.taskToDelete);

      this.sortTasks();
      this.saveToLocalStorage();

      this.showToast("Task deleted");

      this.showDeleteTaskModal=false;

    }
  }

  closeModal() {
    this.showModal = false;
  }

  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      // Get the actual task object from the filtered source list
      const taskToMove = event.previousContainer.data[event.previousIndex];

      // Update the task properties immediately
      taskToMove.status = newStatus;
      if (newStatus === 'done') taskToMove.progress = 100;

      // Trigger API (optional) and save state
      this.showToast(`Moved to ${newStatus}`,"info");

    }

    this.sortTasks();

    this.saveToLocalStorage();
  }

  sortTasks() {
    const priorityOrder: any = { High: 1, Medium: 2, Low: 3 };
    this.tasks.sort((a: any, b: any) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime();
    });
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.router.navigate(['/']);
  }
}
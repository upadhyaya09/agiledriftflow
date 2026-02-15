import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

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
export class BoardComponent {

  searchText = '';

  tasks: any[] = [];

  showModal = false;
  isEditMode = false;
  editTaskRef: any = null;

  newTask = {
    title: '',
    description: '',
    priority: 'Medium',
    status: 'todo'
  };

  // ---------- FILTERED COLUMNS ----------
  get todo() {
    return this.filterTasks('todo');
  }

  get progress() {
    return this.filterTasks('progress');
  }

  get done() {
    return this.filterTasks('done');
  }

  get delivered() {
    return this.filterTasks('delivered');
  }

  filterTasks(status: string) {
    return this.tasks.filter(t =>
      t.status === status &&
      (
        t.title.toLowerCase().includes(this.searchText.toLowerCase()) ||
        (t.description ?? '').toLowerCase().includes(this.searchText.toLowerCase())
      )
    );
  }

  // ---------- MODAL ----------
  openAddModal() {
    this.isEditMode = false;
    this.editTaskRef = null;
    this.newTask = {
      title: '',
      description: '',
      priority: 'Medium',
      status: 'todo'
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

    if (this.isEditMode && this.editTaskRef) {
      Object.assign(this.editTaskRef, this.newTask);
    } else {
      this.tasks.push({ ...this.newTask });
    }

    this.sortTasks();
    this.closeModal();
  }

  deleteTask(task: any) {
    this.tasks = this.tasks.filter(t => t !== task);
  }

  closeModal() {
    this.showModal = false;
    this.isEditMode = false;
    this.editTaskRef = null;
  }

  // ---------- DRAG & DROP ----------
  drop(event: any, status: string) {
  if (!event.previousContainer.data || !event.container.data) return;

  const task = event.previousContainer.data[event.previousIndex];
  task.status = status;

  this.sortTasks();
}


  // ---------- PRIORITY SORT ----------
  sortTasks() {
    const order: any = { High: 1, Medium: 2, Low: 3 };
    this.tasks.sort((a, b) => order[a.priority] - order[b.priority]);
  }
}

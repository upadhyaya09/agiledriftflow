import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

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
  selectedPriority: string = 'All'; // New variable for the filter

  tasks: any[] = [];

  //  DYNAMIC COLUMNS ARRAY
  columns = [
    { id: 'todoList', title: 'To Do', status: 'todo' , canAddTask: true },
    { id: 'progressList', title: 'In Progress', status: 'progress' , canAddTask: false },
    { id: 'doneList', title: 'Done', status: 'done' , canAddTask: false },
    { id: 'deliveredList', title: 'Delivered', status: 'delivered' , canAddTask: false }
  ];

  showModal = false;
  isEditMode = false;
  editTaskRef: any = null;
  currentColumnStatus = 'todo'; // Tracks which column we are adding to

  newTask = {
    title: '',
    description: '',
    priority: 'Medium',
    status: 'todo'
  };

  //  COLUMN MANAGEMENT
  addColumn() {
    const columnName = prompt('Enter new column name:');
    if (columnName && columnName.trim()) {
      const statusValue = columnName.toLowerCase().replace(/\s/g, '-');
      this.columns.push({
        id: `${statusValue}List`,
      title: columnName,
      status: statusValue,
      canAddTask: false // New columns won't have the Add Task button
       });
    }
  }

  removeColumn(index: number) {
  if (this.columns[index].status === 'todo') {
    alert("You cannot remove the To Do column.");
    return;
  }
  
  if (confirm(`Are you sure you want to delete the "${this.columns[index].title}" column?`)) {
    this.columns.splice(index, 1);
  }
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

  // ---------- MODAL ----------
  openAddModal(status: string = 'todo') {
    this.isEditMode = false;
    this.currentColumnStatus = status; // Set the status based on the column button clicked
    this.newTask = {
      title: '',
      description: '',
      priority: 'Medium',
      status: status
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
  }

  // ---------- DRAG & DROP ----------
  drop(event: CdkDragDrop<any[]>, newStatus: string) {
    // data[index] gives us the task object even from a filtered list
    const task = event.previousContainer.data[event.previousIndex];
    if (task) {
        task.status = newStatus;
    }
    this.sortTasks();
  }


  // ---------- PRIORITY SORT ----------
  sortTasks() {
    const order: any = { High: 1, Medium: 2, Low: 3 };
    this.tasks.sort((a, b) => order[a.priority] - order[b.priority]);
  }

}

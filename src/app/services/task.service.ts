import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private storageKey = 'agileDriftTasks';
  
  // Load existing data from localStorage on startup
  private getInitialTasks(): any[] {
    const savedTasks = localStorage.getItem(this.storageKey);
    return savedTasks ? JSON.parse(savedTasks) : [];
  }

  private tasksSource = new BehaviorSubject<any[]>(this.getInitialTasks());

  currentTasks = this.tasksSource.asObservable();

  constructor() {}

  updateTasks(tasks: any[]) {
    // Save to browser memory
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
    // Update all listening components
    this.tasksSource.next(tasks);
  }
}
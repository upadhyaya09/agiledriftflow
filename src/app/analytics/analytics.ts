import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule} from '@angular/common';
import { RouterModule} from '@angular/router';

import { TaskService } from '../services/task.service'; // Adjust path
import { Subscription } from 'rxjs';

import { Chart, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true, // MUST BE TRUE
  imports: [CommonModule, RouterModule], // Add RouterModule here!
  templateUrl: './analytics.html',
  styleUrls: ['./analytics.css']
})
export class AnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('statusCanvas') statusCanvas!: ElementRef;
  @ViewChild('priorityCanvas') priorityCanvas!: ElementRef;
  @ViewChild('trendCanvas') trendCanvas!: ElementRef;
  @ViewChild('reportContent') reportContent!: ElementRef;

  

  tasks: any[] = [];
  private taskSub!: Subscription;
  private charts: any[] = [];

  constructor(private taskService: TaskService) {}

  
  ngOnInit(): void {
    this.taskSub = this.taskService.currentTasks.subscribe(liveTasks => {
      this.tasks = [...liveTasks];
      // If charts already exist, you might need to update them here

      // Only re-render if the charts have been initialized
      if (this.statusCanvas) {
        setTimeout(() => {
          this.renderStatusChart();
          this.renderPriorityChart();
        }, 0);
      }
    });
  }

  ngOnDestroy() {
    // Clean up the subscription when leaving the page
    if (this.taskSub) {
      this.taskSub.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.updateAllCharts();
  }

  updateAllCharts() {
    this.renderStatusChart();
    this.renderPriorityChart();
    this.renderTrendChart();
  }

  renderStatusChart() {
    const existingChart = Chart.getChart(this.statusCanvas.nativeElement);
    if (existingChart) existingChart.destroy();
    const counts = {
    // Use .toLowerCase() and .includes() to be safer
    todo: this.tasks.filter(t => t.status?.toLowerCase().includes('todo')).length,
    progress: this.tasks.filter(t => t.status?.toLowerCase().includes('progress')).length,
    done: this.tasks.filter(t => t.status?.toLowerCase().includes('done')).length,
    delivered: this.tasks.filter(t => t.status?.toLowerCase().includes('delivered')).length
  };

    console.log('Chart Counts:', counts);

    new Chart(this.statusCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['To Do', 'In Progress', 'Done', 'Delivered'],
        datasets: [{
          data: [counts.todo, counts.progress, counts.done, counts.delivered],
          backgroundColor: ['#3b82f6', '#8b5cf6', '#22c55e', '#16a34a'],
          hoverOffset: 15,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // This is key to controlling height via CSS
        cutout: '70%', // Adjusts the "thickness" of the doughnut ring
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#fff', padding: 15, font: { size: 12 } }
          }
        }
      }
    });
  }

  renderPriorityChart() {
    const counts = {
      high: this.tasks.filter(t => t.priority?.toLowerCase() === 'high').length,
      medium: this.tasks.filter(t => t.priority?.toLowerCase() === 'medium').length,
      low: this.tasks.filter(t => t.priority?.toLowerCase() === 'low').length
    };

    new Chart(this.priorityCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [{
          label: 'Tasks',
          data: [counts.high, counts.medium, counts.low],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderRadius: 8
        }]
      },
      options: {
        scales: {
          y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
          x: { ticks: { color: '#fff' }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  renderTrendChart() {
    new Chart(this.trendCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Completed',
          data: [1, 4, 2, 7, 5, 9, 6],
          borderColor: '#00e5ff',
          backgroundColor: 'rgba(0, 229, 255, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 5
        }]
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { ticks: { color: '#fff' }, grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  async downloadPDF() {
    const data = this.reportContent.nativeElement;
    // We use scale 2 for high resolution and allowTaint to handle images
    const canvas = await html2canvas(data, { 
      backgroundColor: '#0f172a', 
      scale: 2,
      useCORS: true 
    });
    
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const contentDataURL = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    pdf.addImage(contentDataURL, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('AgileDrift_Report.pdf');
  }
}
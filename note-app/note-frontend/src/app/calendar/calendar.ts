import {Component, OnInit, OnDestroy} from '@angular/core';
import {ModelService} from '../model.service';
import {AsyncPipe} from '@angular/common';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-calendar',
  imports: [
    AsyncPipe
  ],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css'
})
export class Calendar implements OnInit, OnDestroy {

  currentWeekStart = this.getWeekStart(new Date());
  private timeIndicatorInterval: any;

  hours = [
    '8 AM', '9 AM', '10 AM', '11 AM', '12 PM',
    '1 PM', '2 PM', '3 PM', '4 PM', '5 PM',
    '6 PM', '7 PM', '8 PM', '9 PM', '10 PM'
  ];

  dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Sample events
  events = [
    { day: 6, startHour: 20, duration: 1, title: 'Evening Meeting', color: 'red' },
    { day: 0, startHour: 10, duration: 2, title: 'Team Sync', color: 'blue' },
    { day: 2, startHour: 14, duration: 1.5, title: 'Project Review', color: 'green' },
    { day: 4, startHour: 16, duration: 1, title: 'Client Call', color: 'purple' }
  ];

  allDayEvents = [
    { day: 6, title: 'Ende der Sommerzeit' },
    { day: 6, title: 'Nationalfeiertag' }
  ];

  constructor(public modelService: ModelService) {
  }

  ngOnInit(): void {
  this.modelService.openCalendar$.subscribe(isOpen => {
    if (isOpen) {
      setTimeout(() => this.renderCalendar(), 0);
    }
  });
  
  this.timeIndicatorInterval = setInterval(() => this.updateCurrentTimeIndicator(), 60000);
  }

  ngOnDestroy(): void {
    if (this.timeIndicatorInterval) {
      clearInterval(this.timeIndicatorInterval);
    }
  }

  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  formatDateRange(weekStart: Date): string {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (weekStart.getMonth() === weekEnd.getMonth()) {
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    } else {
      return `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
    }
  }

  renderCalendar(): void {
    const weekRangeEl = document.getElementById('weekRange');
    if (weekRangeEl) {
      weekRangeEl.textContent = this.formatDateRange(this.currentWeekStart);
    }
    this.renderWeekHeader();
    this.renderAllDaySection();
    this.renderGrid();
    this.updateCurrentTimeIndicator();
  }

  renderWeekHeader(): void {
    const header = document.getElementById('weekHeader');
    if (!header) return;

    header.innerHTML = '<div class="timezone-label">GMT+02</div>';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(date.getDate() + i);

      const isToday = date.getTime() === today.getTime();

      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header' + (isToday ? ' today' : '');
      dayHeader.innerHTML = `
        <div class="day-name">${this.dayNames[i]}</div>
        <div class="day-number">${date.getDate()}</div>
      `;
      header.appendChild(dayHeader);
    }
  }

  renderAllDaySection(): void {
    const section = document.getElementById('allDaySection');
    if (!section) return;

    section.innerHTML = '<div class="all-day-label">All-day</div>';

    for (let i = 0; i < 7; i++) {
      const cell = document.createElement('div');
      cell.className = 'all-day-cell';

      const dayEvents = this.allDayEvents.filter(e => e.day === i);
      dayEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = 'all-day-event';
        eventEl.textContent = event.title;
        cell.appendChild(eventEl);
      });

      if (dayEvents.length > 2) {
        const moreEl = document.createElement('div');
        moreEl.className = 'all-day-event';
        moreEl.textContent = `${dayEvents.length - 2} more`;
        moreEl.style.background = '#3a3f5c';
        moreEl.style.color = '#5eead4';
        cell.appendChild(moreEl);
      }

      section.appendChild(cell);
    }
  }

  renderGrid(): void {
    const grid = document.getElementById('calendarGrid');
    console.log('renderGrid: grid element found?', !!grid);
    if (!grid) return;

    grid.innerHTML = '';

    const timeCol = document.createElement('div');
    timeCol.className = 'time-column';
    this.hours.forEach(hour => {
      const slot = document.createElement('div');
      slot.className = 'time-slot';
      slot.textContent = hour;
      timeCol.appendChild(slot);
    });
    console.log('renderGrid: created', this.hours.length, 'time slots');
    grid.appendChild(timeCol);

    // Day columns
    for (let day = 0; day < 7; day++) {
      const dayCol = document.createElement('div');
      dayCol.className = 'day-column';

      this.hours.forEach((hour, index) => {
        const slot = document.createElement('div');
        slot.className = 'hour-slot';
        slot.onclick = () => this.createEvent(day, index + 8);
        dayCol.appendChild(slot);
      });

    
      const dayEvents = this.events.filter(e => e.day === day);
      dayEvents.forEach(event => {
        const eventEl = document.createElement('div');
        eventEl.className = `event event-${event.color}`;
        const topPosition = (event.startHour - 8) * 100;
        const height = event.duration * 100;
        eventEl.style.top = `${topPosition}px`;
        eventEl.style.height = `${height}px`;
        eventEl.innerHTML = `
          <div class="event-title">${event.title}</div>
          <div class="event-time">${this.formatEventTime(event.startHour, event.duration)}</div>
        `;
        dayCol.appendChild(eventEl);
      });

      grid.appendChild(dayCol);
    }
  }

  formatEventTime(startHour: number, duration: number): string {
    const start = startHour > 12 ? `${startHour - 12}:00 PM` : `${startHour}:00 AM`;
    const endHour = startHour + duration;
    const minutes = (endHour % 1) * 60;
    const minuteStr = minutes === 0 ? '00' : minutes.toString();
    const end = endHour > 12 ? `${Math.floor(endHour - 12)}:${minuteStr} PM` : `${Math.floor(endHour)}:${minuteStr} AM`;
    return `${start} - ${end}`;
  }

  updateCurrentTimeIndicator(): void {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour >= 8 && currentHour <= 22) {
      const dayColumns = document.querySelectorAll('.day-column');
      const targetColumn = dayColumns[currentDay] as HTMLElement;

      if (targetColumn) {
        const existingIndicator = targetColumn.querySelector('.current-time-indicator');
        if (existingIndicator) {
          existingIndicator.remove();
        }

        const indicator = document.createElement('div');
        indicator.className = 'current-time-indicator';
        const position = ((currentHour - 8) * 100) + (currentMinute * 100 / 60);
        indicator.style.top = `${position}px`;
        targetColumn.appendChild(indicator);
      }
    }
  }

  createEvent(day: number, hour: number): void {
    console.log(`Create event on day ${day} at ${hour}:00`);
    // Add your event creation logic here
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.renderCalendar();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.renderCalendar();
  }

  goToToday(): void {
    this.currentWeekStart = this.getWeekStart(new Date());
    this.renderCalendar();
  }
}
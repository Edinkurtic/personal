import {Injectable} from '@angular/core';
import {BehaviorSubject, Subject} from 'rxjs';
import {Note} from '../model/models';

@Injectable({providedIn: 'root'})
export class ModelService {
  isOpen = new BehaviorSubject(false);
  private isSublistOpen = new BehaviorSubject(false);
  isExistingNoteOpen = new BehaviorSubject(false);
  openCalendar = new BehaviorSubject(false);
  openOverview= new BehaviorSubject(true);
  isOpen$ = this.isOpen.asObservable();
  isSublistOpen$ = this.isSublistOpen.asObservable();
  noteClicked: Subject<Note> = new Subject<Note>();
  noteClicked$ = this.noteClicked.asObservable();
  isExistingNoteOpen$ = this.isExistingNoteOpen.asObservable();
  openCalendar$ = this.openCalendar.asObservable();
  openOverview$ = this.openOverview.asObservable();

  // current selected/edited note observable
  private currentNoteSubject: BehaviorSubject<Note | null> = new BehaviorSubject<Note | null>(null);
  public currentNote$ = this.currentNoteSubject.asObservable();

  toggleCalendar() {
    this.openOverview.next(!this.openOverview.value);
    this.openCalendar.next(!this.openCalendar.value);
  }
  openSublist() {
    this.isSublistOpen.next(true);
  }

  closeSublist() {
    this.isSublistOpen.next(false);
  }

  toggleOpenNewNote() {
    this.isOpen.next(!this.isOpen.value);
    this.isExistingNoteOpen.next(false);
  }

  onNoteClicked(note: Note) {
    this.noteClicked.next(note);
    this.isExistingNoteOpen.next(true);
    this.currentNoteSubject.next(note);
    console.log(this.isOpen$);
    console.log(this.isOpen.value);
    this.isOpen.next(false);
  }

  // update the current note (publish to subscribers)
  updateCurrentNote(note: Note) {
    this.currentNoteSubject.next(note);
  }

  //#region "notes"
  private isFolderAdderOpen: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isOpenFolder$ = this.isFolderAdderOpen.asObservable();

  openFolderAdder() {
    this.isFolderAdderOpen.next(true);
  }

  closeFolderAdder() {
    this.isFolderAdderOpen.next(false);
  }

  //endregion

}


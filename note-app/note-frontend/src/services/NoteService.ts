import {Injectable} from '@angular/core';
import {Category, Folder, Note} from '../model/models';
import {Subject, Observable, BehaviorSubject, debounceTime, distinctUntilChanged, switchMap, tap, Subscription, of, from} from 'rxjs';
export enum SaveStatus {
  IDLE = 'idle',
  SAVING = 'saving',
  SAVED = 'saved',
  ERROR = 'error'
}
declare global {
  interface Window {
    electronAPI: {
      notes: {
        createNote: (note: Note) => Promise<{ ok: boolean; id?: number; error?: string }>;
        updateNote: (note: Note) => Promise<{ ok: boolean; error?: string }>;
        getAllNotes: () => Promise<Note[]>;
        getNoteWithCertainCategory: (categoryID: number) => Promise<Note[]>;
        deleteNote: (id:number) => Promise<{ ok: boolean; error?: string }>;
        getCategories: () => Promise<Category[]>;
        createCategory: (categoryName: string) => Promise<Category>;
        deleteCategory: (categoryID: number) => Promise<void>;
      };
      folder: {
        addFolder: (folder: any) => Promise<any>,
        getAllFolders: () => Promise<Folder[]>,
        deleteFolder: (folder: Folder) => Promise<void>,
      }
    };
  }
}

@Injectable({providedIn: 'root'})
export class NoteService {
  //#region Notes
  private notesChangedSubject = new Subject<Note>();
  private saveSubject = new Subject<Note>();

  private saveSub?: Subscription;
  private saveStatusSubject = new BehaviorSubject<SaveStatus>(SaveStatus.IDLE);
  public readonly saveStatus$ = this.saveStatusSubject.asObservable();


  // shared notes cache and observable
  private notesCache: Note[] = [];
  private notesSubject: BehaviorSubject<Note[]> = new BehaviorSubject<Note[]>([]);
  public readonly notes$ = this.notesSubject.asObservable();




  public readonly notesChanged$: Observable<Note> = this.notesChangedSubject.asObservable();

  async createNote(note: Note) {
    const res = await window.electronAPI.notes.createNote(note);
    if (res && res.ok) {
      if (res.id) note.id = res.id;
      this.notesCache.unshift(note);
      this.notesSubject.next([...this.notesCache]);
      this.notesChangedSubject.next(note);
    }
    return res;
  }
  private initAutoSave(){
    this.saveSub = this.saveSubject.pipe(
      debounceTime(600),
      distinctUntilChanged((previous, current) => previous.content === current.content && previous.title === current.title),
      switchMap(note => {
        this.saveStatusSubject.next(SaveStatus.SAVING);
        if (note.id !== undefined && note.id !== null) {
          return from(this.updateNote(note));
        }
        return from(this.createNote(note));
      }),
      tap((res: any) => {
        if (res && res.ok) {
          this.saveStatusSubject.next(SaveStatus.SAVED);
        } else {
          this.saveStatusSubject.next(SaveStatus.ERROR);
        }
      })
    ).subscribe();
  }

  async deleteNote(id: number) {
    const res = await window.electronAPI.notes.deleteNote(id);
    if (res && res.ok) {
      this.notesCache = this.notesCache.filter(n => n.id !== id);
      this.notesSubject.next([...this.notesCache]);
    }
    return res;
  }


  async getAllNotes() {
    return await window.electronAPI.notes.getAllNotes();
  }

  // load notes from backend into shared cache
  async loadNotes(): Promise<void> {
    try {
      const rows = await window.electronAPI.notes.getAllNotes();
      this.notesCache = Array.isArray(rows) ? rows : [];
      this.notesSubject.next([...this.notesCache]);
    } catch (err) {
      console.error('Failed to load notes:', err);
    }
  }

  // update an existing note
  async updateNote(note: Note) {
    const res = await window.electronAPI.notes.updateNote(note);
    if (res && res.ok) {
      const idx = this.notesCache.findIndex(n => n.id === note.id);
      if (idx !== -1) {
        this.notesCache[idx] = { ...this.notesCache[idx], ...note };
      } else {
        this.notesCache.unshift(note);
      }
      this.notesSubject.next([...this.notesCache]);
      this.notesChangedSubject.next(note);
    }
    return res;
  }

  notifyNoteChanged(note: Note): void {
    this.notesChangedSubject.next(note);
  }

  private saveNoteToElectron(note:Note){
    return  window.electronAPI.notes.createNote(note);
  }

  // Public method components can call to trigger a debounced auto-save
  triggerAutoSave(note: Note) {
    // lazy init the autosave pipeline
    if (!this.saveSub) this.initAutoSave();
    this.saveSubject.next(note);
  }

  //#endregion

  //#region Categories

  //region shared categories cache and observable
  private categoriesCache: Category[] = [];
  private categoriesSubject: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>([]);
  public readonly categories$ = this.categoriesSubject.asObservable();


  private categoriesChangedSubject = new Subject<void>();
  public readonly categoriesChanged$: Observable<void> = this.categoriesChangedSubject.asObservable();

  async getNoteWithCertainCategory(categoryID: number) {
    const res = await window.electronAPI.notes.getNoteWithCertainCategory(categoryID);
    console.log('NoteService.getNoteWithCertainCategory', categoryID, res);
    return res;
  }

  async getCategoriesFromElectron() {
    return await window.electronAPI.notes.getCategories();
  }
  async loadCategories() {
    try {
      const rows = await this.getCategoriesFromElectron();
      this.categoriesCache = Array.isArray(rows) ? rows : [];
      this.categoriesSubject.next([...this.categoriesCache]);
      console.log('Categories loaded:', this.categoriesCache);
    }catch (e){
      console.error('Failed to load categories:', e);
    }
  }

  async addCategory(categoryName: string) {
    return await window.electronAPI.notes.createCategory(categoryName);
  }

  async deleteCategory(categoryID: number) {
    return await window.electronAPI.notes.deleteCategory(categoryID);
  }

  notifyCategoriesChanged(categoryID: number): void {
    this.categoriesChangedSubject.next();
  }
   getCategories() {
    return this.categories$;
  }


  //#endregion


  //#region folders
  private isFolderAdded: Subject<void> = new Subject<void>();
  public readonly folderChanged$ = this.isFolderAdded.asObservable();

  async getFolders(): Promise<Folder[]> {
     return await window.electronAPI.folder.getAllFolders();
  }
  async addFolder(folder: Folder): Promise<void> {
      return await window.electronAPI.folder.addFolder(folder);
  }
  async deleteFolder(folder: Folder): Promise<void> {
    return await window.electronAPI.folder.deleteFolder(folder);
  }
  notifyFolderChanged(): void {
    this.isFolderAdded.next();
  }
  //#endregion
}

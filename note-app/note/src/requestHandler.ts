import {ipcMain} from 'electron';
import {DB} from './database/database';

export function setUpHandlers() {
    ipcMain.handle('create:note', async (event, data: any) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`INSERT INTO notes (title, content, categoryID)
                                           VALUES (?, ?, ?)`);
            const res = await stmt.run(data.title, data.content, data.categoryID);
            await stmt.finalize();
            const id = res?.lastID;
            return {ok: true, id};
        } catch (err) {
            console.error('create:note error:', err);
            return {ok: false, error: String(err)};
        }
    });
    ipcMain.handle('delete:note', async (event, id: number) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`DELETE FROM notes WHERE id = ?`);
            await stmt.run(id);
            await stmt.finalize();
            return {ok: true};
        } catch (err) {
            console.error('delete:note error:', err);
        }
    })

    ipcMain.handle('update:note', async (event, data: any) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`UPDATE notes
                                           SET title = ?, content = ?, categoryID = ?, updated_at = CURRENT_TIMESTAMP
                                           WHERE id = ?`);
            await stmt.run(data.title, data.content, data.categoryID, data.id);
            await stmt.finalize();
            return {ok: true};
        } catch (err) {
            console.error('update:note error:', err);
            return {ok: false, error: String(err)};
        }
    });
    ipcMain.handle('getAllNotes', async () => {
        try {
            const db = await DB.getConnection();
            const rows = await db.all(`SELECT *
                                       FROM notes
                                       ORDER BY created_at DESC`);
            return rows;
        } catch (err) {
            console.error('getAllNotes error:', err);
            return [];
        }
    });
    //#region categories
    ipcMain.handle('getCategories', async () => {
        try {
            const db = await DB.getConnection();
            const rows = await db.all(`SELECT id, category FROM categories ORDER BY category ASC`);
            return (rows || []).map((r: any) => ({ id: r.id, name: r.category }));
        } catch (err) {
            console.error('getCategories error:', err);
            return [];
        }
    });

    ipcMain.handle('getNoteWithCertainCategory', async (event, categoryID: number) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`SELECT *
                                           FROM notes
                                           WHERE categoryID = ?;`);
            const result = await stmt.all(categoryID);
            await stmt.finalize();
            return result;
        } catch (err) {
            console.error('getNoteWithCertainCategory error:', err);
            return [];
        }
    });

    ipcMain.handle('createCategory', async (event, categoryInput: any) => {
        try {
            const db = await DB.getConnection();
            const name: string = typeof categoryInput === 'string' ? categoryInput : categoryInput?.name;
            if (!name || typeof name !== 'string') {
                throw new Error('Invalid category name');
            }
            let stmt = await db.prepare(`SELECT id, category FROM categories WHERE category = ?`);
            const existing = await stmt.get(name);
            await stmt.finalize();
            if (existing) {
                return { id: existing.id, name: existing.category };
            }
            stmt = await db.prepare(`INSERT INTO categories (category) VALUES (?)`);
            const res = await stmt.run(name);
            await stmt.finalize();
            const id = res?.lastID;
            return { id, name };
        } catch (err) {
            console.error('createCategory error:', err);
            return { error: String(err) };
        }
    });
    ipcMain.handle('deleteCategory', async (event, categoryID: number) => {
        try {
            const db = await DB.getConnection();

            let stmt = await db.prepare(`DELETE FROM categories WHERE id = ?;`);
            await stmt.run(categoryID);
            await stmt.finalize();
            stmt = await db.prepare(`DELETE FROM notes WHERE categoryID = ?;`);
            await stmt.run(categoryID);
            await stmt.finalize();
        } catch (err) {
            console.error('deleteCategory error:', err);
        }
    });
    //#endregion
    ipcMain.handle('addFolder', async (event, folder:Folder) => {
       try {
           const db = await DB.getConnection();
           const stmt = await db.prepare(`INSERT INTO FOLDERS (name,colour) VALUES(?,?)`)
           await stmt.run(folder.name,folder.colour);
           await stmt.finalize();
       }catch(err) {
           console.error('createFolder error:', err);
       }
    })
    ipcMain.handle('getAllFolders', async (event) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`SELECT * FROM Folders`)
            const result: Folder[] = await stmt.all();
            await stmt.finalize();
            return result;
        }catch (err){
            console.error('getAllFolders error:', err);
        }
    })
    ipcMain.handle('deleteFolder', async (event, folder:Folder) => {
        try {
            const db = await DB.getConnection();
            const stmt = await db.prepare(`DELETE FROM FOLDERS WHERE id = ?;`);
            await stmt.run(folder.id);
            await stmt.finalize();
        }catch (e) {
            console.error('deleteFolder error:', e);
        }
    })
}
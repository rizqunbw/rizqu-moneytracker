// d:\MoneyTracker\lib\script-templates.ts

export const ADMIN_SCRIPT_TEMPLATE = `function doPost(e) {
  const lock = LockService.getScriptLock();
  // Tunggu maksimal 10 detik untuk mendapatkan giliran
  if (lock.tryLock(10000)) {
    try {
      return handleRequest(e);
    } finally {
      lock.releaseLock();
    }
  } else {
    return responseJSON({ status: 'error', message: 'Server busy, please try again.' });
  }
}

function handleRequest(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Users');
  
  // 1. Buat sheet jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet('Users');
  }

  // 2. CEK HEADER: Jika baris kosong, buat header DULU
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Email', 'Password', 'PIN', 'Created At', 'Databases', 'Edit Count']);
    SpreadsheetApp.flush(); 
  }

  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) {
    return responseJSON({ status: 'error', message: 'Sheet structure error (No columns)' });
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const emailIdx = headers.indexOf('Email');
  const passIdx = headers.indexOf('Password');
  const pinIdx = headers.indexOf('PIN');
  const dbIdx = headers.indexOf('Databases');
  const createdIdx = headers.indexOf('Created At');
  const editCountIdx = headers.indexOf('Edit Count');
  
  if (emailIdx === -1 || passIdx === -1 || dbIdx === -1 || pinIdx === -1) {
     return responseJSON({ status: 'error', message: 'Invalid Sheet Structure: Missing required columns.' });
  }

  const users = sheet.getDataRange().getValues(); 

  // --- REGISTER ---
  if (action === 'register') {
    const user = data.user;
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIdx] === user.email) {
         return responseJSON({ status: 'error', message: 'Email sudah terdaftar' });
      }
    }

    // VALIDASI SCRIPT URL UNIK
    if (user.databases && user.databases.length > 0) {
      for (let d = 0; d < user.databases.length; d++) {
        const urlToCheck = user.databases[d].scriptUrl;
        if (urlToCheck) {
          for (let i = 1; i < users.length; i++) {
             let dbs = [];
             try { dbs = JSON.parse(users[i][dbIdx]); } catch(e) { dbs = []; }
             for (let k = 0; k < dbs.length; k++) {
               if (dbs[k].scriptUrl && dbs[k].scriptUrl.trim() === urlToCheck.trim()) {
                 return responseJSON({ status: 'error', message: 'Script URL sudah digunakan.' });
               }
             }
          }
        }
      }
    }
    
    const newRow = new Array(headers.length).fill('');
    newRow[emailIdx] = user.email;
    newRow[passIdx] = user.password;
    newRow[pinIdx] = user.pin;
    if (createdIdx > -1) newRow[createdIdx] = new Date();
    newRow[dbIdx] = JSON.stringify(user.databases || []);
    
    sheet.appendRow(newRow);
    return responseJSON({ status: 'success', message: 'Registrasi berhasil' });
  }

  // --- FIND USER ---
  if (action === 'findUser') {
    const email = data.email;
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIdx] === email) {
        let dbs = [];
        try { dbs = JSON.parse(users[i][dbIdx]); } catch(err) { dbs = []; }
        
        return responseJSON({ 
          status: 'success', 
          user: { 
            email: users[i][emailIdx], 
            password: users[i][passIdx], 
            editCount: users[i][editCountIdx],
            pin: users[i][pinIdx],
            databases: dbs 
          } 
        });
      }
    }
    return responseJSON({ status: 'not_found' });
  }

  // --- UPDATE USER ---
  if (action === 'updateUser') {
    const email = data.email;
    const updates = data.updates;
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIdx] === email) {
        
        if (updates.password) sheet.getRange(i + 1, passIdx + 1).setValue(updates.password);
        if (updates.pin) sheet.getRange(i + 1, pinIdx + 1).setValue(updates.pin);

        if (updates.databases) {
           const currentDbJson = users[i][dbIdx];
           let currentDbs = [];
           try { currentDbs = JSON.parse(currentDbJson); } catch(e) { currentDbs = []; }
           
           const newDbs = updates.databases;
           
           // VALIDASI SCRIPT URL UNIK
           for (let n = 0; n < newDbs.length; n++) {
             const urlToCheck = newDbs[n].scriptUrl;
             if (!urlToCheck) continue;

             for (let r = 1; r < users.length; r++) {
               if (r === i) continue; 
               let otherDbs = [];
               try { otherDbs = JSON.parse(users[r][dbIdx]); } catch(e) { otherDbs = []; }
               for (let k = 0; k < otherDbs.length; k++) {
                 if (otherDbs[k].scriptUrl && otherDbs[k].scriptUrl.trim() === urlToCheck.trim()) {
                   return responseJSON({ status: 'error', message: 'Script URL sudah digunakan.' });
                 }
               }
             }
           }

           // UPDATE TOKEN & EDIT COUNT
           for (let j = 0; j < newDbs.length; j++) {
             const newDb = newDbs[j];
             
             // Cari oldDb berdasarkan token dulu (jika ada), kalau tidak ada baru by name
             let oldDb = null;
             if (newDb.token) {
                oldDb = currentDbs.find(d => d.token === newDb.token);
             }
             if (!oldDb) {
                oldDb = currentDbs.find(d => d.name === newDb.name);
             }
             
             if (oldDb) {
               if (oldDb.scriptUrl !== newDb.scriptUrl) {
                 newDb.token = generateToken(6);
                 newDb.editCount = (oldDb.editCount || 0) + 1;
               } else {
                 newDb.token = oldDb.token || generateToken(6);
                 newDb.editCount = oldDb.editCount || 0;
               }
             } else {
               newDb.token = generateToken(6);
               newDb.editCount = 0;
             }
           }
           
           sheet.getRange(i + 1, dbIdx + 1).setValue(JSON.stringify(updates.databases));
        }
        
        const updatedVal = sheet.getRange(i + 1, dbIdx + 1).getValue();
        let dbs = [];
        try { dbs = JSON.parse(updatedVal); } catch(err) { dbs = []; }

        return responseJSON({ 
          status: 'success', 
          user: { 
            email: users[i][emailIdx], 
            password: users[i][passIdx], 
            pin: users[i][pinIdx],
            editCount: 0, 
            databases: dbs
          } 
        });
      }
    }
    return responseJSON({ status: 'error', message: 'User not found' });
  }

  // --- FIND DB BY TOKEN ---
  if (action === 'findDbByToken') {
    const token = data.token;
    if (!token) return responseJSON({ status: 'error', message: 'Token required' });

    for (let i = 1; i < users.length; i++) {
      let dbs = [];
      try { dbs = JSON.parse(users[i][dbIdx]); } catch(e) { dbs = []; }
      const foundDb = dbs.find(d => d.token === token);
      if (foundDb) {
        return responseJSON({
          status: 'success',
          data: {
            name: foundDb.name,
            scriptUrl: foundDb.scriptUrl,
            ownerEmail: users[i][emailIdx]
          }
        });
      }
    }
    return responseJSON({ status: 'error', message: 'Database not found or invalid token' });
  }

  // --- GET ALL USERS ---
  if (action === 'getAllUsers') {
    const allUsers = [];
    for (let i = 1; i < users.length; i++) {
      let dbs = [];
      try { dbs = JSON.parse(users[i][dbIdx]); } catch(e) { dbs = []; }
      allUsers.push({
        email: users[i][emailIdx],
        password: users[i][passIdx],
        pin: users[i][pinIdx],
        editCount: users[i][editCountIdx],
        databases: dbs,
        createdAt: createdIdx > -1 ? users[i][createdIdx] : ''
      });
    }
    return responseJSON({ status: 'success', users: allUsers });
  }

  // --- DELETE USER ---
  if (action === 'deleteUser') {
    const targetEmail = data.targetEmail;
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIdx] === targetEmail) {
        sheet.deleteRow(i + 1);
        return responseJSON({ status: 'success', message: 'User deleted' });
      }
    }
    return responseJSON({ status: 'error', message: 'User not found' });
  }

  // --- DELETE USER DATABASE ---
  if (action === 'deleteUserDatabase') {
    const targetEmail = data.targetEmail;
    const dbIndex = data.dbIndex;
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIdx] === targetEmail) {
        let dbs = [];
        try { dbs = JSON.parse(users[i][dbIdx]); } catch(e) { dbs = []; }
        if (dbIndex >= 0 && dbIndex < dbs.length) {
          dbs.splice(dbIndex, 1);
          sheet.getRange(i + 1, dbIdx + 1).setValue(JSON.stringify(dbs));
          return responseJSON({ status: 'success', message: 'Database deleted' });
        }
        return responseJSON({ status: 'error', message: 'Database index invalid' });
      }
    }
    return responseJSON({ status: 'error', message: 'User not found' });
  }

  return responseJSON({ status: 'error', message: 'Action tidak valid' });
}

function generateToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

export const USER_SCRIPT_TEMPLATE = `function doGet(e) {
  const action = e.parameter.action;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];

  if (action === 'get_transactions') {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return responseJSON({ status: 'success', data: [] });
    const headers = data.shift();
    const transactions = data.map((row, index) => {
      let transaction = { rowIndex: index + 2 };
      headers.forEach((header, colIndex) => {
        if(header) transaction[header.toString().toLowerCase()] = row[colIndex];
      });
      return transaction;
    });
    return responseJSON({ status: 'success', data: transactions.reverse() });
  }

  if (action === 'get_summary') {
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return responseJSON({ status: 'success', data: { income: 0, expense: 0, balance: 0 } });
    const range = sheet.getRange(2, 2, lastRow - 1); 
    const values = range.getValues().flat().filter(String);
    let income = 0;
    let expense = 0;
    values.forEach(val => {
      let cleanVal = val.toString().replace(/[^0-9.-]/g, '');
      const amount = parseFloat(cleanVal);
      if (!isNaN(amount)) {
        if (amount > 0) income += amount;
        else expense += amount;
      }
    });
    return responseJSON({ status: 'success', data: { income: income, expense: Math.abs(expense), balance: income + expense } });
  }

  if (action === 'get_logs') {
    let logSheet = ss.getSheetByName("Logs");
    if (!logSheet) {
      logSheet = ss.insertSheet("Logs");
      logSheet.appendRow(["Timestamp", "Action"]);
      return responseJSON({ status: 'success', data: [] });
    }
    const data = logSheet.getDataRange().getValues();
    if (data.length <= 1) return responseJSON({ status: 'success', data: [] });
    const headers = data.shift();
    const logs = data.map(row => ({ timestamp: row[0], action: row[1] }));
    return responseJSON({ status: 'success', data: logs.reverse() });
  }
  return responseJSON({ status: 'error', message: 'Invalid GET action' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Tunggu maksimal 30 detik untuk mendapatkan giliran
  if (lock.tryLock(30000)) {
    try {
      return handlePost(e);
    } finally {
      lock.releaseLock();
    }
  } else {
    return responseJSON({ status: 'error', message: 'Server busy (Lock timeout). Please try again.' });
  }
}

function handlePost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheets()[0];

    if (action === 'setup') {
      sheet.clear();
      sheet.appendRow(['Timestamp', 'Amount', 'Description', 'Image URL']);
      sheet.setFrozenRows(1);
      let logSheet = ss.getSheetByName("Logs");
      if (!logSheet) { logSheet = ss.insertSheet("Logs"); logSheet.appendRow(["Timestamp", "Action"]); } 
      else { logSheet.clear(); logSheet.appendRow(["Timestamp", "Action"]); }
      return responseJSON({ status: 'success', message: 'Database User Siap' });
    }

    if (action === 'add_transaction') {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Amount', 'Description', 'Image URL']);
        sheet.setFrozenRows(1);
      } else {
        const firstCell = sheet.getRange(1, 1).getValue();
        if (firstCell !== 'Timestamp') {
          sheet.insertRowBefore(1);
          sheet.getRange(1, 1, 1, 4).setValues([['Timestamp', 'Amount', 'Description', 'Image URL']]);
          sheet.setFrozenRows(1);
        }
      }
      const { amount, description, imageBase64, mimeType } = data;
      const fileUrl = uploadImage(imageBase64, mimeType, "Trans_" + new Date().getTime());
      sheet.appendRow([new Date(), amount, description, fileUrl]);
      logAction(ss, \`Tambah Transaksi: \${formatMoney(amount)} (\${description})\`);
      return responseJSON({ status: 'success', message: 'Transaksi tersimpan' });
    }

    if (action === 'edit_transaction') {
      const { rowIndex, amount, description, imageBase64, mimeType } = data;
      if (!rowIndex) return responseJSON({ status: 'error', message: 'Row Index missing' });
      const oldAmountVal = sheet.getRange(rowIndex, 2).getValue();
      const oldDesc = sheet.getRange(rowIndex, 3).getValue();
      sheet.getRange(rowIndex, 2).setValue(amount);
      sheet.getRange(rowIndex, 3).setValue(description);
      let imageLog = "Bukti TF tidak diedit";
      if (imageBase64 && mimeType) {
        const fileUrl = uploadImage(imageBase64, mimeType, "Edit_" + new Date().getTime());
        sheet.getRange(rowIndex, 4).setValue(fileUrl);
        imageLog = "Bukti TF telah diedit";
      }
      const fmtOld = formatMoney(oldAmountVal);
      const fmtNew = formatMoney(amount);
      const logMessage = \`Edit Transaksi. Jumlah: \${fmtOld} -> \${fmtNew}. Ket: "\${oldDesc}" -> "\${description}". \${imageLog}.\`;
      logAction(ss, logMessage);
      return responseJSON({ status: 'success', message: 'Transaksi berhasil diupdate' });
    }

    if (action === 'deleteTransaction') {
      const { rowIndex } = data;
      if (!rowIndex) return responseJSON({ status: 'error', message: 'Row Index missing' });
      const oldAmount = sheet.getRange(rowIndex, 2).getValue();
      const oldDesc = sheet.getRange(rowIndex, 3).getValue();
      sheet.deleteRow(rowIndex);
      logAction(ss, \`Hapus Transaksi: \${formatMoney(oldAmount)} (\${oldDesc})\`);
      return responseJSON({ status: 'success', message: 'Transaksi berhasil dihapus' });
    }
    return responseJSON({ status: 'error', message: 'Action tidak valid: ' + action });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function logAction(ss, actionText) {
  let logSheet = ss.getSheetByName("Logs");
  if (!logSheet) { logSheet = ss.insertSheet("Logs"); logSheet.appendRow(["Timestamp", "Action"]); }
  logSheet.appendRow([new Date(), actionText]);
}

function formatMoney(val) {
  let num = parseFloat(val.toString().replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return val;
  let sign = num >= 0 ? "+" : "-";
  let absVal = Math.abs(num);
  let formatted = absVal.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
  return sign + formatted;
}

function uploadImage(base64, mimeType, fileName) {
  if (!base64) return "";
  try {
    const folders = DriveApp.getFoldersByName("MoneyTrackerImages");
    let folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("MoneyTrackerImages");
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return "Error Upload: " + e.toString();
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}`;

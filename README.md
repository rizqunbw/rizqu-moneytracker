# 💸 Money Tracker

**Money Tracker** adalah aplikasi manajemen keuangan pribadi yang modern, responsif, dan aman. Aplikasi ini menggunakan **Google Sheets** sebagai database backend gratis dan **Google Drive** untuk menyimpan bukti transaksi (gambar).

Data keuangan Anda sepenuhnya berada di tangan Anda (di Google Drive/Sheets Anda sendiri), tanpa biaya server database bulanan!

!Money Tracker Preview

## ✨ Fitur Utama

- 🌓 **Dark & Light Mode**: Tampilan yang nyaman di mata, menyesuaikan preferensi sistem.
- 📱 **Mobile First Design**: Layout responsif yang optimal untuk penggunaan di HP (seperti aplikasi native).
- 📊 **Real-time Summary**: Lihat total saldo, pemasukan, dan pengeluaran secara instan.
- 🖼️ **Bukti Transaksi**: Upload gambar bukti transfer langsung ke Google Drive Anda.
- 📂 **Multi-Database**: Kelola banyak "buku" keuangan (misal: Pribadi, Bisnis, Tabungan) dalam satu aplikasi.
- 🔍 **Smart Filter**: Cari transaksi dengan cepat berdasarkan kata kunci.
- 🔒 **Privasi Terjamin**: Menggunakan Google Sheets pribadi Anda sebagai database.
- 🌐 **Public View Token**: Bagikan akses *read-only* ke orang lain menggunakan token khusus.

## 🛠️ Teknologi

- **Frontend**: Next.js 14 (App Router), React
- **Styling**: Tailwind CSS, Shadcn UI
- **Icons**: Lucide React
- **Backend**: Google Apps Script (Serverless)
- **Database**: Google Sheets

---

## 🚀 Cara Menjalankan (Local)

Ikuti langkah ini untuk menjalankan aplikasi di komputer Anda:

1. **Clone Repository**
   ```bash
   git clone https://github.com/rizqunbw/rizqu-moneytracker.git
   cd money-tracker
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Jalankan Server Development**
   ```bash
   npm run dev
   ```

4. **Buka Aplikasi**
   Buka http://localhost:3000 di browser Anda.

---

## 📝 Panduan Setup Google Sheets (Backend)

Aplikasi ini membutuhkan script khusus yang dipasang di Google Sheets Anda agar bisa berfungsi.

### Langkah 1: Persiapan Google Sheet
1. Buka Google Sheets dan buat spreadsheet baru.
2. Beri nama sheet (misal: `Keuangan Pribadi`).
3. Pastikan nama tab (sheet) di bagian bawah adalah **Sheet1**.
   > **Catatan**: Anda tidak perlu membuat header kolom secara manual. Aplikasi akan otomatis membuatnya saat transaksi pertama disimpan.

### Langkah 2: Pasang Google Apps Script
1. Di Google Sheets, klik menu **Extensions** > **Apps Script**.
2. Hapus semua kode yang ada di `Code.gs`, lalu copy-paste kode berikut:

<details>
<summary>📄 <b>Klik untuk melihat Kode Script Lengkap (Code.gs)</b></summary>

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getSheetByName('Sheet1');
    
    // Auto-create header if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Timestamp', 'Description', 'Amount', 'Image URL', 'Type']);
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    // --- 1. GET SUMMARY ---
    if (action === 'get-summary' || !action) { // Default to summary
      var rows = sheet.getDataRange().getValues();
      var income = 0, expense = 0;
      for (var i = 1; i < rows.length; i++) {
        var val = parseFloat(rows[i][2]); // Kolom Amount (C)
        if (!isNaN(val)) {
          if (val > 0) income += val;
          else expense += Math.abs(val);
        }
      }
      return responseJSON('success', { income: income, expense: expense, balance: income - expense });
    }

    // --- 2. GET TRANSACTIONS ---
    if (action === 'get-transactions') {
      var rows = sheet.getDataRange().getValues();
      var transactions = [];
      // Loop dari bawah ke atas (terbaru)
      for (var i = rows.length - 1; i >= 1; i--) {
        transactions.push({
          rowIndex: i + 1,
          timestamp: rows[i][0],
          description: rows[i][1],
          amount: rows[i][2],
          image_url: rows[i][3],
          type: rows[i][4]
        });
      }
      return responseJSON('success', transactions);
    }

    // --- 3. ADD TRANSACTION ---
    if (action === 'transaction') {
      var timestamp = new Date();
      var amount = data.amount;
      var desc = data.description;
      var type = parseFloat(amount) > 0 ? 'Income' : 'Expense';
      var imageUrl = '';

      // Upload Image to Drive
      if (data.imageBase64) {
        var decoded = Utilities.base64Decode(data.imageBase64);
        var blob = Utilities.newBlob(decoded, data.mimeType, 'proof-' + timestamp.getTime());
        var file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        imageUrl = file.getUrl();
      }

      sheet.appendRow([timestamp, desc, amount, imageUrl, type]);
      return responseJSON('success', { message: 'Transaction saved' });
    }

    // --- 4. EDIT TRANSACTION ---
    if (action === 'edit-transaction') {
      var rowIndex = parseInt(data.rowIndex);
      if (rowIndex < 2 || rowIndex > sheet.getLastRow()) return responseJSON('error', 'Invalid Row Index');
      
      var range = sheet.getRange(rowIndex, 1, 1, 5); // A to E
      var values = range.getValues()[0];
      
      // Update values
      var newAmount = data.amount || values[2];
      var newDesc = data.description || values[1];
      var newType = parseFloat(newAmount) > 0 ? 'Income' : 'Expense';
      var newImageUrl = values[3];

      if (data.imageBase64) {
        var decoded = Utilities.base64Decode(data.imageBase64);
        var blob = Utilities.newBlob(decoded, data.mimeType, 'proof-edit-' + new Date().getTime());
        var file = DriveApp.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        newImageUrl = file.getUrl();
      }

      // Set values back (Keep timestamp same)
      sheet.getRange(rowIndex, 2).setValue(newDesc);
      sheet.getRange(rowIndex, 3).setValue(newAmount);
      sheet.getRange(rowIndex, 4).setValue(newImageUrl);
      sheet.getRange(rowIndex, 5).setValue(newType);

      return responseJSON('success', { message: 'Transaction updated' });
    }

    // --- 5. DELETE TRANSACTION ---
    if (action === 'delete-transaction') {
      var rowIndex = parseInt(data.rowIndex);
      if (rowIndex < 2 || rowIndex > sheet.getLastRow()) return responseJSON('error', 'Invalid Row Index');
      
      sheet.deleteRow(rowIndex);
      return responseJSON('success', { message: 'Transaction deleted' });
    }
    
    return responseJSON('error', 'Action not found');

  } catch (e) {
    return responseJSON('error', e.toString());
  } finally {
    lock.releaseLock();
  }
}

function responseJSON(status, data) {
  return ContentService.createTextOutput(JSON.stringify({
    status: status,
    [status === 'success' ? 'data' : 'message']: data
  })).setMimeType(ContentService.MimeType.JSON);
}
```
</details>

### Langkah 3: Deploy sebagai Web App
1. Klik tombol **Deploy** (biru) di pojok kanan atas > **New deployment**.
2. Klik ikon roda gigi (Select type) > pilih **Web app**.
3. Isi konfigurasi berikut:
   - **Description**: `Money Tracker API`
   - **Execute as**: `Me` (email Anda).
   - **Who has access**: `Anyone` (Penting! Agar aplikasi bisa akses tanpa login Google).
4. Klik **Deploy**.
5. Salin **Web app URL** yang muncul (berakhiran `/exec`).
6. URL inilah yang akan Anda masukkan ke dalam aplikasi Money Tracker.

---

## 👑 Panduan Setup Admin Database (Central User Management)

Script ini berfungsi sebagai **Database Pusat** untuk menyimpan data pengguna (email) dan daftar database mereka. Ini wajib dipasang agar fitur login dan simpan database berfungsi.

### Langkah 1: Persiapan Google Sheet Admin
1. Buat Spreadsheet baru di Google Sheets.
2. Beri nama (misal: `Money Tracker Admin`).
3. Ubah nama sheet bawah menjadi **Users**.

### Langkah 2: Pasang Script Admin
1. Klik **Extensions** > **Apps Script**.
2. Paste kode berikut:

<details>
<summary>📄 <b>Klik untuk melihat Kode Script Admin (Code.gs)</b></summary>

```javascript
function doPost(e) {
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
}
```
</details>

### Langkah 3: Deploy
1. Deploy sebagai **Web App** (sama seperti langkah sebelumnya).
2. Set **Who has access** ke **Anyone**.
3. Copy URL-nya.
4. Masukkan URL ini ke file `.env.local` sebagai `ADMIN_SCRIPT_URL`.

---

## � Konfigurasi Environment (.env.local)

Untuk mengaktifkan fitur keamanan tambahan dan **Super Admin**, Anda perlu membuat file konfigurasi environment.

1. Buat file baru bernama `.env.local` di root folder project.
2. Isi dengan format berikut:

```env
# URL Script Google Apps Script untuk Admin (Backend Utama)
ADMIN_SCRIPT_URL=https://script.google.com/macros/s/XXXXXXXXXXXXXXXXXXXX/exec

# Email yang akan menjadi Super Admin (Bisa akses menu khusus)
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=emailanda@gmail.com
```

## 🛡️ Fitur Super Admin

Fitur Super Admin memberikan akses khusus kepada pemilik aplikasi untuk pengelolaan tingkat lanjut.

- **Cara Mengaktifkan**: Masukkan email Anda ke dalam variabel `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` di file `.env.local`.
- **Fungsi**: Saat Anda login menggunakan email tersebut, tombol **Super Admin** akan muncul di dashboard (sebelah nama user), memberikan akses ke fitur manajemen khusus.

---

## 📱 Cara Penggunaan Aplikasi

1. **Login / Masuk**:
   - Masukkan email Anda (hanya untuk identifikasi sesi lokal).
2. **Tambah Database**:
   - Klik ikon Database di header.
   - Klik **Add New Database**.
   - Masukkan **Nama** (bebas) dan **Script URL** (yang didapat dari langkah deploy di atas).
3. **Input Transaksi**:
   - Isi jumlah (gunakan tanda `-` untuk pengeluaran, misal `-50000`).
   - Isi keterangan.
   - (Opsional) Drag & drop gambar bukti struk.
   - Klik **Simpan Transaksi**.

---

## ☁️ Deploy ke Vercel

Cara termudah untuk mengonlinekan aplikasi ini:

1. Push kode ini ke GitHub Anda.
2. Buka Vercel dan login.
3. Klik **Add New...** > **Project**.
4. Import repository GitHub tadi.
5. Klik **Deploy**.

Selesai! Aplikasi Anda sekarang bisa diakses dari mana saja.

---

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi untuk keperluan pribadi maupun komersial.

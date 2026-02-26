import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------
// التعديل الجذري: حل مشكلة اختفاء البيانات في النسخة الـ Portable
// ---------------------------------------------------------------
if (app.isPackaged) {
  // هذا المتغير السري يجلب مسار الفلاشة الحقيقي أو سطح المكتب (مكان وجود ملف الـ exe الأصلي)
  // وإذا لم يجده، يستخدم المسار الافتراضي كاحتياط
  const realExeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
  
  // نجبر قاعدة البيانات على الاستقرار في هذا المسار الآمن
  app.setPath('userData', path.join(realExeDir, 'FastGrader_Data'));
}
// ---------------------------------------------------------------

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public/icon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    autoHideMenuBar: true, 
  });

  const startUrl = !app.isPackaged 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

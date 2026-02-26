import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// هذه الأسطر لتعريف المسارات في بيئة ES Modules الحديثة
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------
// السطر السحري الجراحي: جعل قاعدة البيانات محمولة 100%
// ---------------------------------------------------------------
if (app.isPackaged) {
  // نجلب مسار المجلد الذي يتواجد فيه ملف الـ .exe حالياً
  const exePath = path.dirname(app.getPath('exe'));
  // نجبر Electron على حفظ قاعدة بياناته (المستودع العملاق) داخل مجلد بجوار البرنامج
  app.setPath('userData', path.join(exePath, 'FastGrader_Data'));
}
// ---------------------------------------------------------------

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
     height: 800,
    icon: path.join(__dirname, 'public/icon256.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    // إخفاء القوائم العلوية لجعل التطبيق يبدو احترافياً
    autoHideMenuBar: true, 
  });

  // إذا كان التطبيق مجمعاً (EXE) يفتح ملف HTML، وإلا يفتح رابط التطوير
  const startUrl = !app.isPackaged 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, 'dist/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});


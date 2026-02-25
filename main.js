import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// هذه الأسطر لتعريف المسارات في بيئة ES Modules الحديثة
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
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

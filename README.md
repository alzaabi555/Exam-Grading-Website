# Exam Grading System

A comprehensive web application for efficient exam paper grading with hierarchical ID tracking and structured scoring.

## 🚀 Quick Start

The application includes sample data to help you understand the system. On first load, you'll see a welcome guide explaining all features.

### Key Features

✅ **Upload Exam Papers** - Add PDFs and answer images with unique IDs  
✅ **Structured Grading** - Score individual answer parts with dialog buttons  
✅ **Smart Navigation** - Move through papers with Next/Previous buttons  
✅ **Progress Tracking** - Monitor grading completion in real-time  
✅ **Student Results** - View detailed score breakdowns with grades  
✅ **Mark Templates** - Save reusable mark distributions for exams  
✅ **Keyboard Shortcuts** - Speed up grading with hotkeys  

## 📋 How to Use

### 1. Upload Papers
Navigate to the **Upload** page and:
- Enter student information (name, ID, exam name)
- Upload the exam paper PDF
- Upload answer images divided by question and part
- Set maximum score for each part
- Submit the paper

### 2. Configure Mark Distribution (Optional)
Go to **Settings** to:
- Create templates for recurring exams
- Define questions and parts
- Set mark allocation
- Save for future use

### 3. Grade Papers
Access the **Grade** interface to:
- View PDF and answer images side-by-side
- Click "Add Score" to open scoring dialog
- Select score (0 to max) using buttons or number keys
- Use arrow keys or Next/Previous buttons to navigate
- Progress is automatically saved

### 4. View Results
Check the **Dashboard** for:
- Overview statistics
- All papers with status
- Access to individual student results
- Detailed question-by-question breakdown

## 🔑 Keyboard Shortcuts

- **0-9 Keys**: Assign score (when dialog is open)
- **→ Arrow**: Next answer part
- **← Arrow**: Previous answer part

## 🔗 ID System

Every component has a unique ID to maintain relationships:

```
Paper: paper-{timestamp}
└─ Question: q{num}-paper-{timestamp}
   └─ Part: p{num}-q{num}-paper-{timestamp}
```

This ensures:
- Precise tracking of every answer
- Automatic score compilation
- Complete traceability from part to paper

## 📊 Data Structure

The system uses a hierarchical structure:

**Paper** → **Questions** → **Answer Parts**

Each level maintains references to its parent, enabling:
- Accurate total score calculation
- Question-level statistics
- Individual part grading

## 💾 Data Persistence

**Current Mode**: Browser localStorage (demo)

All data is stored locally in your browser. This means:
- ✅ Data persists across sessions
- ✅ No external database needed
- ⚠️ Data is lost if browser storage is cleared
- ⚠️ Not suitable for production use

**For Production**: Integrate with Supabase or similar backend for:
- Multi-user support
- Secure data storage
- Cross-device access
- Data backup

## 🎯 Sample Data

The system includes sample exam papers on first load:
- 2 sample student papers
- Mathematics Midterm exam
- Multiple questions with parts
- Pre-configured mark distribution

Feel free to delete these and add your own papers!

## 📱 Responsive Design

The application works on:
- Desktop computers (optimal experience)
- Tablets (good for grading)
- Mobile devices (viewing results)

## 🛠️ Technical Stack

- **Framework**: React 18 + TypeScript
- **Styling**: TailwindCSS v4
- **Routing**: React Router v7
- **UI Components**: Radix UI
- **Notifications**: Sonner
- **Icons**: Lucide React

## 📖 Additional Documentation

See `SYSTEM_INFO.md` for detailed technical documentation including:
- Complete data structure
- ID naming conventions
- Component architecture
- Future enhancement plans

## ⚠️ Important Notes

1. **Demo Mode**: This is a frontend-only implementation using localStorage
2. **File Storage**: Uploaded files use blob URLs (temporary)
3. **PDF Display**: PDF viewer shows placeholder (requires react-pdf integration)
4. **Security**: Not suitable for sensitive student data without backend
5. **Scalability**: Limited by browser storage capacity

## 🎓 Use Cases

Perfect for:
- Small class grading (10-50 students)
- Prototype/demo of grading systems
- Understanding structured grading workflows
- Teaching tool for educators

## 📞 Support

For questions or issues:
1. Check the Welcome Guide (appears on first load)
2. Review the Keyboard Shortcuts card in Grading interface
3. Refer to SYSTEM_INFO.md for technical details

---

**Ready to start?** Open the application and click through the Welcome Guide!
